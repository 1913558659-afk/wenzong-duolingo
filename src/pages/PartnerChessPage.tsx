import { useMemo, useState } from "react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { AutoBattlePanel } from "@/components/partnerChess/AutoBattlePanel";
import { BattleLogPanel } from "@/components/partnerChess/BattleLogPanel";
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
import type { QuizQuestion } from "@/types";
import { createAllyFormation, createEnemyFormation, runPartnerChessBattle } from "@/utils/partnerChessEngine";
import type { ChessUnit } from "@/utils/partnerChessEngine";
import { isPartnerChessAnswerCorrect, type PartnerChessQuizQuestion, type PartnerChessSubjectFilter } from "@/utils/partnerChessQuestionAdapter";
import { countRealChoiceQuestionsBySubject, pickPartnerChessQuestions, recommendedPartnerChessSubject } from "@/utils/partnerChessQuestionPicker";

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
  const [battleAllies, setBattleAllies] = useState<ChessUnit[]>([]);
  const [battleEnemies, setBattleEnemies] = useState<ChessUnit[]>([]);
  const [challengeResult, setChallengeResult] = useState<"playing" | "victory" | "defeat">("playing");

  const currentRound = selectedStage?.rounds[roundIndex] ?? null;
  const currentQuestions = questionPick.questions;
  const subjectCounts = useMemo(() => countRealChoiceQuestionsBySubject(questions), [questions]);
  const previewBuffs = phase === "battle" || phase === "settlement" ? activeBuffs : [];
  const previewAllies = useMemo(() => battleAllies.length > 0 ? battleAllies : createAllyFormation(pets, previewBuffs), [battleAllies, previewBuffs]);
  const previewEnemies = useMemo(() => {
    if (battleEnemies.length > 0) return battleEnemies;
    return createEnemyFormation(getEnemiesByIds(currentRound?.enemyIds ?? []));
  }, [battleEnemies, currentRound?.enemyIds]);
  const stageTheme = selectedStage?.theme ?? "careless";

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
    setBattleAllies([]);
    setBattleEnemies([]);
    setChallengeResult("playing");
    setPhase("prep");
  }

  function submitPrep() {
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
    setPhase("buff");
  }

  function selectBuff(buff: PartnerChessBuff) {
    const nextBuffs = [buff, ...(perfectPrep ? [getPerfectBuff()] : [])];
    setActiveBuffs(nextBuffs);
    setBattleAllies(createAllyFormation(pets, nextBuffs));
    setBattleEnemies(createEnemyFormation(getEnemiesByIds(currentRound?.enemyIds ?? [])));
    setLogs((current) => [`选择增益「${buff.name}」。${perfectPrep ? "额外获得「完美备战」。" : ""}`, ...current]);
    setPhase("battle");
  }

  function runBattle() {
    const result = runPartnerChessBattle({
      allies: battleAllies.length ? battleAllies : createAllyFormation(pets, activeBuffs),
      enemies: battleEnemies.length ? battleEnemies : createEnemyFormation(getEnemiesByIds(currentRound?.enemyIds ?? [])),
      buffs: activeBuffs
    });
    setBattleAllies(result.allies);
    setBattleEnemies(result.enemies);
    setLogs((current) => [...current, ...result.logs]);

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
  }

  function nextRound() {
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
    setLogs((current) => [`进入第 ${nextIndex + 1} 回合：${selectedStage.rounds[nextIndex].title}。`, ...current]);
    setPhase("prep");
  }

  function restart() {
    if (selectedStage) startStage(selectedStage);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="伙伴战棋场" subtitle="伙伴岛二阶段玩法 v0.3：上方横版动态战斗场景，下方真实题库备战与增益选择。" />
      <ChessHeader phase={phase} round={currentRound?.round ?? 0} stageName={selectedStage?.name ?? ""} will={will} />
      <DynamicBattleStage
        allies={previewAllies}
        enemies={previewEnemies}
        isBossRound={Boolean(currentRound?.isBoss)}
        logs={logs.length ? logs : ["选择副本，开始伙伴战棋试炼。"]}
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

          {phase === "battle" && <AutoBattlePanel activeBuffs={activeBuffs} onRunBattle={runBattle} />}

          {phase === "settlement" && (
            <GameCard className="bg-white/70">
              <h2 className="text-2xl font-black text-ink">
                {challengeResult === "victory" ? "副本挑战胜利" : challengeResult === "defeat" ? "挑战失败" : "本回合结算"}
              </h2>
              <p className="mt-2 text-sm font-semibold text-ink/58">
                {challengeResult === "playing" ? "本回合已经结束，可以进入下一回合。" : "可以重新挑战，继续调整备战策略。"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {challengeResult === "playing" && (
                  <button className="min-h-11 rounded-2xl bg-tide px-4 text-sm font-black text-white hover:bg-ink" onClick={nextRound} type="button">
                    进入下一回合
                  </button>
                )}
                <button className="min-h-11 rounded-2xl bg-white px-4 text-sm font-black text-ink shadow-[0_10px_22px_rgba(16,36,63,0.08)] hover:text-tide" onClick={restart} type="button">
                  重新挑战
                </button>
                <button className="min-h-11 rounded-2xl bg-white px-4 text-sm font-black text-ink shadow-[0_10px_22px_rgba(16,36,63,0.08)] hover:text-coral" onClick={goPetBattle} type="button">
                  返回伙伴岛
                </button>
              </div>
            </GameCard>
          )}

          <BattleLogPanel logs={logs} />
          </>
        )}
      </section>
    </div>
  );
}
