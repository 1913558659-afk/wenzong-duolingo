import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { AutoBattlePanel } from "@/components/partnerChess/AutoBattlePanel";
import { BattleLogPanel } from "@/components/partnerChess/BattleLogPanel";
import { BattleResultPanel } from "@/components/partnerChess/BattleResultPanel";
import { BuffSelectPanel } from "@/components/partnerChess/BuffSelectPanel";
import { ChessHeader } from "@/components/partnerChess/ChessHeader";
import type { PartnerChessPhase } from "@/components/partnerChess/ChessHeader";
import { DynamicBattleStage } from "@/components/partnerChess/DynamicBattleStage";
import { PrepQuizPanel } from "@/components/partnerChess/PrepQuizPanel";
import { enemies, pets } from "@/data/petBattleData";
import type { BattleEnemy } from "@/data/petBattleData";
import { fallbackBuff, getBuffChoices, getPerfectBuff } from "@/data/partnerChessBuffs";
import type { PartnerChessBuff } from "@/data/partnerChessBuffs";
import { partnerChessStages } from "@/data/partnerChessStages";
import type { PartnerChessStage } from "@/data/partnerChessStages";
import { calculateBattleRewards, shardLabel } from "@/data/partnerChessRewards";
import type { QuizQuestion } from "@/types";
import { createAllyFormation, createEnemyFormation, runPartnerChessBattle } from "@/utils/partnerChessEngine";
import type { ChessUnit } from "@/utils/partnerChessEngine";
import { isPartnerChessAnswerCorrect, type PartnerChessQuizQuestion, type PartnerChessSubjectFilter } from "@/utils/partnerChessQuestionAdapter";
import { countRealChoiceQuestionsBySubject, pickPartnerChessQuestions, recommendedPartnerChessSubject } from "@/utils/partnerChessQuestionPicker";
import {
  applyBattleRewards,
  applyPetLevelsToChessUnits,
  loadPartnerChessSave,
  savePartnerChessSave
} from "@/utils/partnerChessSave";
import type { AppliedBattleReward, PartnerChessSave } from "@/utils/partnerChessSave";

function getEnemiesByIds(enemyIds: string[]) {
  return enemyIds.map((enemyId) => enemies.find((enemy) => enemy.id === enemyId)).filter((enemy): enemy is BattleEnemy => Boolean(enemy));
}

type SubjectOption = {
  id: PartnerChessSubjectFilter;
  label: string;
};

const subjectOptions: SubjectOption[] = [
  { id: "all", label: "全部" },
  { id: "history", label: "历史" },
  { id: "politics", label: "政治" },
  { id: "geography", label: "地理" },
  { id: "english", label: "英语" },
  { id: "chinese", label: "语文" },
  { id: "math", label: "数学" },
  { id: "physics", label: "物理" },
  { id: "chemistry", label: "化学" },
  { id: "biology", label: "生物" }
];

function subjectLabel(subject: PartnerChessSubjectFilter) {
  return subjectOptions.find((item) => item.id === subject)?.label ?? "全部";
}

const phaseLabels: Record<PartnerChessPhase, string> = {
  select: "副本选择",
  prep: "备战",
  buff: "增益选择",
  battle: "自动战斗",
  settlement: "结算"
};

const emptyQuestionPick = {
  questions: [] as PartnerChessQuizQuestion[],
  realCount: 0,
  mockCount: 0,
  insufficientRealQuestions: false
};

export function PartnerChessPage({ goPetBattle, questions = [] }: { goPetBattle: () => void; questions?: QuizQuestion[] }) {
  const [phase, setPhase] = useState<PartnerChessPhase>("select");
  const [selectedSubject, setSelectedSubject] = useState<PartnerChessSubjectFilter>(() => recommendedPartnerChessSubject(questions));
  const [selectedStage, setSelectedStage] = useState<PartnerChessStage | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [will, setWill] = useState(100);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [questionPick, setQuestionPick] = useState(emptyQuestionPick);
  const [inspiration, setInspiration] = useState(0);
  const [perfectPrep, setPerfectPrep] = useState(false);
  const [activeBuffs, setActiveBuffs] = useState<PartnerChessBuff[]>([]);
  const [buffChoices, setBuffChoices] = useState<PartnerChessBuff[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [animatedBattleLogs, setAnimatedBattleLogs] = useState<string[]>([]);
  const [battleAllies, setBattleAllies] = useState<ChessUnit[]>([]);
  const [battleEnemies, setBattleEnemies] = useState<ChessUnit[]>([]);
  const [battleDisplayAllies, setBattleDisplayAllies] = useState<ChessUnit[]>([]);
  const [battleDisplayEnemies, setBattleDisplayEnemies] = useState<ChessUnit[]>([]);
  const [challengeResult, setChallengeResult] = useState<"playing" | "victory" | "defeat">("playing");
  const [lastBattleWinner, setLastBattleWinner] = useState<"ally" | "enemy" | null>(null);
  const [appliedReward, setAppliedReward] = useState<AppliedBattleReward | null>(null);
  const [partnerChessSave, setPartnerChessSave] = useState<PartnerChessSave>(() => loadPartnerChessSave());
  const [isBattlePlaying, setIsBattlePlaying] = useState(false);
  const battleAnimationTimerRef = useRef<number | null>(null);

  const currentRound = selectedStage?.rounds[roundIndex] ?? null;
  const currentQuestions = questionPick.questions;
  const subjectCounts = useMemo(() => countRealChoiceQuestionsBySubject(questions), [questions]);
  const previewBuffs = phase === "battle" || phase === "settlement" ? activeBuffs : [];
  const createLeveledAllies = useCallback((buffs: PartnerChessBuff[]) => applyPetLevelsToChessUnits(createAllyFormation(pets, buffs), partnerChessSave), [partnerChessSave]);
  const previewAllies = useMemo(() => battleAllies.length > 0 ? battleAllies : createLeveledAllies(previewBuffs), [battleAllies, createLeveledAllies, previewBuffs]);
  const previewEnemies = useMemo(() => {
    if (battleEnemies.length > 0) return battleEnemies;
    return createEnemyFormation(getEnemiesByIds(currentRound?.enemyIds ?? []));
  }, [battleEnemies, currentRound?.enemyIds]);
  const stageAllies = battleDisplayAllies.length > 0 ? battleDisplayAllies : previewAllies;
  const stageEnemies = battleDisplayEnemies.length > 0 ? battleDisplayEnemies : previewEnemies;
  const stageTheme = selectedStage?.theme ?? "careless";

  function clearBattleAnimationTimer() {
    if (battleAnimationTimerRef.current !== null) {
      window.clearTimeout(battleAnimationTimerRef.current);
      battleAnimationTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => clearBattleAnimationTimer();
  }, []);

  function buildQuestionPick(round: number, subject: PartnerChessSubjectFilter, usedIds: string[], seed = Date.now()) {
    return pickPartnerChessQuestions({
      questions,
      round,
      seed,
      selectedSubject: subject,
      usedIds
    });
  }

  function changeSubject(subject: PartnerChessSubjectFilter) {
    setSelectedSubject(subject);
    if (phase === "prep" && currentRound) {
      const nextSeed = Date.now();
      setAnswers({});
      setQuestionPick(buildQuestionPick(currentRound.round, subject, usedQuestionIds, nextSeed));
    }
  }

  function startStage(stage: PartnerChessStage) {
    clearBattleAnimationTimer();
    setIsBattlePlaying(false);
    const seed = Date.now();
    const initialUsedIds: string[] = [];
    setSelectedStage(stage);
    setRoundIndex(0);
    setWill(100);
    setAnswers({});
    setUsedQuestionIds(initialUsedIds);
    setQuestionPick(buildQuestionPick(stage.rounds[0].round, selectedSubject, initialUsedIds, seed));
    setInspiration(0);
    setPerfectPrep(false);
    setActiveBuffs([]);
    setBuffChoices([]);
    setLogs([`进入副本「${stage.name}」。第 1 回合开始备战。`]);
    setAnimatedBattleLogs([]);
    setBattleAllies([]);
    setBattleEnemies([]);
    setBattleDisplayAllies([]);
    setBattleDisplayEnemies([]);
    setChallengeResult("playing");
    setLastBattleWinner(null);
    setAppliedReward(null);
    setPhase("prep");
  }

  function submitPrep() {
    clearBattleAnimationTimer();
    setIsBattlePlaying(false);
    let correct = 0;
    for (const question of currentQuestions) {
      if (isPartnerChessAnswerCorrect(question, answers[question.id])) correct += 1;
    }
    const perfect = correct === currentQuestions.length;
    setUsedQuestionIds((current) => [...new Set([...current, ...currentQuestions.map((question) => question.id)])]);
    setInspiration(correct);
    setPerfectPrep(perfect);
    setBuffChoices(getBuffChoices(correct, perfect));
    setLogs((current) => [`备战完成：答对 ${correct}/${currentQuestions.length}，获得 ${correct} 点灵感点。${perfect ? "触发完美备战。" : ""}`, ...current]);
    setAnimatedBattleLogs([]);
    setPhase("buff");
  }

  function selectBuff(buff: PartnerChessBuff) {
    clearBattleAnimationTimer();
    setIsBattlePlaying(false);
    const nextBuffs = [buff, ...(perfectPrep ? [getPerfectBuff()] : [])];
    const initialAllies = createLeveledAllies(nextBuffs);
    const initialEnemies = createEnemyFormation(getEnemiesByIds(currentRound?.enemyIds ?? []));
    setActiveBuffs(nextBuffs);
    setBattleAllies(initialAllies);
    setBattleEnemies(initialEnemies);
    setBattleDisplayAllies(initialAllies);
    setBattleDisplayEnemies(initialEnemies);
    setLogs((current) => [`选择增益「${buff.name}」。${perfectPrep ? "额外获得「完美备战」。" : ""}`, ...current]);
    setAnimatedBattleLogs([]);
    setAppliedReward(null);
    setLastBattleWinner(null);
    setPhase("battle");
  }

  function runBattle() {
    clearBattleAnimationTimer();
    const startingAllies = battleDisplayAllies.length ? battleDisplayAllies : battleAllies.length ? battleAllies : createLeveledAllies(activeBuffs);
    const startingEnemies = battleDisplayEnemies.length ? battleDisplayEnemies : battleEnemies.length ? battleEnemies : createEnemyFormation(getEnemiesByIds(currentRound?.enemyIds ?? []));
    const result = runPartnerChessBattle({
      allies: startingAllies,
      enemies: startingEnemies,
      buffs: activeBuffs
    });
    setBattleDisplayAllies(startingAllies.map((unit) => ({ ...unit })));
    setBattleDisplayEnemies(startingEnemies.map((unit) => ({ ...unit })));
    setLogs((current) => [...current, ...result.logs]);
    setAnimatedBattleLogs(result.logs);
    setIsBattlePlaying(true);

    const animationDelay = Math.min(9000, Math.max(1400, result.logs.length * 880 + 700));
    battleAnimationTimerRef.current = window.setTimeout(() => {
      setIsBattlePlaying(false);
      battleAnimationTimerRef.current = null;
      setBattleAllies(result.allies);
      setBattleEnemies(result.enemies);
      setBattleDisplayAllies(result.allies);
      setBattleDisplayEnemies(result.enemies);
      setLastBattleWinner(result.winner);
      if (selectedStage && currentRound) {
        const reward = calculateBattleRewards({
          correctCount: inspiration,
          isBossRound: Boolean(currentRound.isBoss),
          isWin: result.winner === "ally",
          round: currentRound.round,
          stageId: selectedStage.id,
          stageTheme: selectedStage.theme,
          totalQuestions: currentQuestions.length
        });
        const applied = applyBattleRewards({
          allyPetIds: ["grass_dragon", "fire_fox", "cloud_beast"],
          isWin: result.winner === "ally",
          reward,
          round: currentRound.round,
          save: partnerChessSave,
          stageId: selectedStage.id
        });
        savePartnerChessSave(applied.save);
        setPartnerChessSave(applied.save);
        setAppliedReward(applied);
      }
      if (result.winner === "ally") {
        if (selectedStage && roundIndex >= selectedStage.rounds.length - 1) {
          setChallengeResult("victory");
        }
      } else {
        const nextWill = Math.max(0, will - result.willLoss);
        setWill(nextWill);
        if (nextWill <= 0) setChallengeResult("defeat");
      }
      setPhase("settlement");
    }, animationDelay);
  }

  function nextRound() {
    clearBattleAnimationTimer();
    setIsBattlePlaying(false);
    if (!selectedStage) return;
    if (roundIndex >= selectedStage.rounds.length - 1) {
      setChallengeResult("victory");
      setPhase("settlement");
      return;
    }
    const nextIndex = roundIndex + 1;
    const nextSeed = Date.now();
    const nextUsedIds = [...new Set([...usedQuestionIds, ...currentQuestions.map((question) => question.id)])];
    setRoundIndex(nextIndex);
    setAnswers({});
    setUsedQuestionIds(nextUsedIds);
    setQuestionPick(buildQuestionPick(selectedStage.rounds[nextIndex].round, selectedSubject, nextUsedIds, nextSeed));
    setInspiration(0);
    setPerfectPrep(false);
    setActiveBuffs([]);
    setBuffChoices([]);
    setBattleAllies([]);
    setBattleEnemies([]);
    setBattleDisplayAllies([]);
    setBattleDisplayEnemies([]);
    setAppliedReward(null);
    setLastBattleWinner(null);
    setLogs((current) => [`进入第 ${nextIndex + 1} 回合：${selectedStage.rounds[nextIndex].title}。`, ...current]);
    setAnimatedBattleLogs([]);
    setPhase("prep");
  }

  function restart() {
    clearBattleAnimationTimer();
    setIsBattlePlaying(false);
    if (selectedStage) startStage(selectedStage);
  }

  function returnToStageSelect() {
    clearBattleAnimationTimer();
    setIsBattlePlaying(false);
    setPhase("select");
    setSelectedStage(null);
    setRoundIndex(0);
    setActiveBuffs([]);
    setBuffChoices([]);
    setBattleAllies([]);
    setBattleEnemies([]);
    setBattleDisplayAllies([]);
    setBattleDisplayEnemies([]);
    setAnimatedBattleLogs([]);
    setAppliedReward(null);
    setLastBattleWinner(null);
  }

  const applyDisplayDamage = useCallback(({
    damage,
    targetId,
    targetSide
  }: {
    damage: number;
    targetId: string;
    targetSide: "ally" | "enemy";
  }) => {
    const applyDamage = (unit: ChessUnit) => unit.id === targetId ? { ...unit, hp: Math.max(0, unit.hp - damage) } : unit;
    if (targetSide === "ally") {
      setBattleDisplayAllies((current) => current.map(applyDamage));
    } else {
      setBattleDisplayEnemies((current) => current.map(applyDamage));
    }
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title="伙伴战棋场" subtitle="伙伴岛二阶段玩法 v0.5：动态战斗、真实题库备战、结算奖励与伙伴成长。" />
      <ChessHeader phase={phase} round={currentRound?.round ?? 0} stageName={selectedStage?.name ?? ""} will={will} />
      <GameCard className="bg-white/64">
        <div className="flex flex-wrap gap-2 text-xs font-black text-ink/60">
          <span className="rounded-full bg-gold/15 px-3 py-1.5 text-ink">学习币：{partnerChessSave.coins}</span>
          <span className="rounded-full bg-yellow-100/70 px-3 py-1.5">{shardLabel("careless_shard")}：{partnerChessSave.shards.careless_shard ?? 0}</span>
          <span className="rounded-full bg-violet-100/70 px-3 py-1.5">{shardLabel("forget_shard")}：{partnerChessSave.shards.forget_shard ?? 0}</span>
          <span className="rounded-full bg-red-100/70 px-3 py-1.5">{shardLabel("anxiety_shard")}：{partnerChessSave.shards.anxiety_shard ?? 0}</span>
          <span className="rounded-full bg-tide/10 px-3 py-1.5 text-tide">胜场：{partnerChessSave.totalWins}/{partnerChessSave.totalBattles}</span>
        </div>
      </GameCard>
      <DynamicBattleStage
        allies={stageAllies}
        enemies={stageEnemies}
        isBossRound={Boolean(currentRound?.isBoss)}
        isBattlePlaying={isBattlePlaying}
        logs={isBattlePlaying ? animatedBattleLogs : []}
        onDamageImpact={applyDisplayDamage}
        phase={phaseLabels[phase]}
        roundTitle={selectedStage && currentRound ? `${selectedStage.name} · 第 ${currentRound.round} 回合 · ${currentRound.title}` : "选择副本后，战斗舞台会显示伙伴和敌人。"}
        stageTheme={stageTheme}
      />

      <section className="space-y-5">
        <GameCard className="bg-white/68">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Prep Question Bank</p>
              <h2 className="mt-1 text-xl font-black text-ink">备战题库</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-ink/58">本局备战题目将从所选科目的题库中抽取。答对越多，灵感点越多。</p>
            </div>
            <p className="rounded-2xl bg-[#F7F3E7]/80 px-3 py-2 text-xs font-black text-ink/54">
              当前科目：{subjectLabel(selectedSubject)}
            </p>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {subjectOptions.map((option) => {
              const count = subjectCounts[option.id] ?? 0;
              const disabled = option.id !== "all" && count === 0;
              const active = selectedSubject === option.id;
              return (
                <button
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${
                    active
                      ? "border-ink bg-ink text-white shadow-[0_10px_22px_rgba(16,36,63,0.16)]"
                      : disabled
                        ? "cursor-not-allowed border-ink/5 bg-white/42 text-ink/28"
                        : "border-white/80 bg-white/70 text-ink/60 hover:-translate-y-0.5 hover:text-tide"
                  }`}
                  disabled={disabled}
                  key={option.id}
                  onClick={() => changeSubject(option.id)}
                  type="button"
                >
                  {option.label}
                  <span className="ml-1 text-[10px] opacity-70">{count > 0 ? `${count}题` : "暂无"}</span>
                </button>
              );
            })}
          </div>
        </GameCard>

        {phase === "select" && (
          <div className="grid gap-4 lg:grid-cols-3">
            {partnerChessStages.map((stage) => (
              <button className="text-left" key={stage.id} onClick={() => startStage(stage)} type="button">
                <GameCard className="h-full bg-white/68 transition hover:-translate-y-0.5 hover:border-tide/30">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">{stage.theme}</p>
                  <h2 className="mt-2 text-2xl font-black text-ink">{stage.name}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-ink/60">{stage.description}</p>
                  <div className="mt-4 space-y-2">
                    {stage.rounds.map((round) => (
                      <p className="rounded-2xl bg-[#F7F3E7]/76 px-3 py-2 text-xs font-black text-ink/58" key={round.round}>
                        第 {round.round} 回合 · {round.title}
                      </p>
                    ))}
                  </div>
                </GameCard>
              </button>
            ))}
          </div>
        )}

        {phase !== "select" && (
          <>
          {phase === "prep" && (
            <PrepQuizPanel
              answers={answers}
              onAnswer={(questionId, answer) => setAnswers((current) => ({ ...current, [questionId]: answer }))}
              onSubmit={submitPrep}
              questions={currentQuestions}
              selectedSubjectLabel={subjectLabel(selectedSubject)}
              sourceSummary={questionPick}
            />
          )}

          {phase === "buff" && <BuffSelectPanel choices={buffChoices.length ? buffChoices : [fallbackBuff]} inspiration={inspiration} onSelect={selectBuff} perfect={perfectPrep} />}

          {phase === "battle" && <AutoBattlePanel activeBuffs={activeBuffs} isBattlePlaying={isBattlePlaying} onRunBattle={runBattle} />}

          {phase === "settlement" && (
            <BattleResultPanel
              appliedReward={appliedReward}
              correctCount={inspiration}
              goPetBattle={goPetBattle}
              isFinalVictory={challengeResult === "victory"}
              isRoundWin={lastBattleWinner === "ally"}
              onNextRound={nextRound}
              onRestart={restart}
              onSelectStage={returnToStageSelect}
              roundTitle={currentRound?.title ?? "当前回合"}
              save={partnerChessSave}
              stage={selectedStage}
              totalQuestions={currentQuestions.length}
            />
          )}

          <BattleLogPanel logs={logs} />
          </>
        )}
      </section>
    </div>
  );
}
