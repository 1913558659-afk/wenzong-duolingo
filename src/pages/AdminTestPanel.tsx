import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Database, FlaskConical, Lock, RotateCcw, ShieldCheck, Wrench } from "lucide-react";
import { enemies, pets } from "@/data/petBattleData";
import { petSpeciesMasterData } from "@/data/petSpeciesMasterData";
import { getSpeciesSkillTemplate } from "@/data/petTrainingSkills";
import { SUBJECT_CONFIGS } from "@/lib/subjects";
import { isAdminUser } from "@/config/admin";
import { addPetExp, getPetLevelInfo, loadPartnerChessSave, partnerChessLevelCap, partnerChessSaveKey, savePartnerChessSave } from "@/utils/partnerChessSave";
import { addPetToCollection, canEvolvePet, defaultTrainingTeamIds, ensurePetCollection, evolvePet, getAllCollectiblePets, getPetEvolutionStageValue, getTrainingPetById, getTrainingPetDisplayById, isBossPet, isInitialPet, replaceTeamSlot, syncPetSkillState } from "@/utils/petCollection";
import { addCaptureBalls, captureBallConfigs, loadPetTrainingItemInventory, petTrainingItemInventoryKey, savePetTrainingItemInventory } from "@/utils/petTrainingItems";
import { petTrainingDailyRewardKey } from "@/utils/petTrainingSave";
import { defaultPetBattleState, savePetBattleState } from "@/utils/petBattleStorage";
import { getCompletedQuestionIds, markQuestionsCompleted, replaceCompletedQuestionIds } from "@/utils/progress";
import { adminDebugSettingsKey, loadAdminDebugSettings, saveAdminDebugSettings } from "@/utils/debugAdmin";
import { buildChallengeLevels } from "@/utils/challengeLevels";
import { normalizeChapterForSubject } from "@/utils/chapter";
import { subjectLabels } from "@/lib/labels";
import type { AuthUser, QuizQuestion, Subject } from "@/types";

type AdminTestPanelProps = {
  onNavigateHome: () => void;
  onStartPractice: (levelId: string) => void;
  questions: QuizQuestion[];
  user: AuthUser | null;
};

type DebugTab = "challenge" | "pets" | "evolution" | "skills" | "items" | "saves" | "checks";
type CheckRow = { detail: string; name: string; status: "通过" | "警告" | "错误"; suggestion: string };

const PROJECT_STORAGE_KEYS = [
  partnerChessSaveKey,
  petTrainingItemInventoryKey,
  petTrainingDailyRewardKey,
  "sayhi-pet-battle-state",
  "wenzong-island-completed-question-ids",
  "wenzong-island-study-stats",
  "wenzong-island-schedule",
  "wenzong-island-wrong-book",
  adminDebugSettingsKey
];

function clampLevel(level: number) {
  return Math.max(1, Math.min(partnerChessLevelCap, Math.round(level || 1)));
}

function subjectChapters(questions: QuizQuestion[], subject: Subject) {
  return Array.from(new Set(questions.filter((question) => question.subject === subject).map((question) => normalizeChapterForSubject(subject, question.chapter)))).filter(Boolean);
}

function levelIdFor(subject: Subject, chapter: string, levelIndex: number) {
  return `${subject}:${chapter}:level:${levelIndex}`;
}

function getLevelQuestions(questions: QuizQuestion[], subject: Subject, chapter: string, levelIndex: number) {
  const chapterQuestions = questions.filter((question) => question.subject === subject && normalizeChapterForSubject(subject, question.chapter) === chapter);
  return buildChallengeLevels({ chapterTitle: chapter, questions: chapterQuestions, subjectName: subjectLabels[subject] })[levelIndex - 1]?.questions ?? [];
}

function setPetLevelInSave(petId: string, level: number) {
  const safeLevel = clampLevel(level);
  const save = ensurePetCollection(loadPartnerChessSave());
  const next = syncPetSkillState({
    ...save,
    petExp: { ...save.petExp, [petId]: 0 },
    petLevel: { ...save.petLevel, [petId]: safeLevel }
  });
  savePartnerChessSave(next);
  return next;
}

function forceEvolutionStage(petId: string, stage: 1 | 2 | 3) {
  const save = ensurePetCollection(loadPartnerChessSave());
  const species = petSpeciesMasterData.find((item) => item.id === petId);
  const nextStage = species?.evolutionLine.stages[stage - 1];
  if (!nextStage) return save;
  const next = ensurePetCollection({
    ...save,
    petCurrentSpeciesId: { ...save.petCurrentSpeciesId, [petId]: nextStage.speciesId },
    petEvolutionStage: { ...save.petEvolutionStage, [petId]: stage }
  });
  savePartnerChessSave(next);
  return next;
}

function exportProjectStorage() {
  const data = Object.fromEntries(PROJECT_STORAGE_KEYS.map((key) => [key, window.localStorage.getItem(key)]));
  return JSON.stringify({ exportedAt: new Date().toISOString(), keys: data }, null, 2);
}

function importProjectStorage(text: string) {
  const parsed = JSON.parse(text) as { keys?: Record<string, string | null> };
  if (!parsed.keys || typeof parsed.keys !== "object") throw new Error("存档格式不正确。");
  for (const key of PROJECT_STORAGE_KEYS) {
    if (!(key in parsed.keys)) continue;
    const value = parsed.keys[key];
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  }
}

function statusClass(status: CheckRow["status"]) {
  if (status === "通过") return "bg-emerald-50 text-emerald-700";
  if (status === "警告") return "bg-amber-50 text-amber-700";
  return "bg-rose-50 text-rose-700";
}

function buttonClass(kind: "primary" | "soft" | "danger" = "soft") {
  if (kind === "primary") return "rounded-2xl bg-[#1496A3] px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(20,150,163,0.18)] transition hover:-translate-y-0.5";
  if (kind === "danger") return "rounded-2xl bg-rose-500 px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_24px_rgba(244,63,94,0.18)] transition hover:-translate-y-0.5";
  return "rounded-2xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm font-black text-[#10233f] shadow-[0_8px_22px_rgba(16,35,63,0.08)] transition hover:-translate-y-0.5";
}

export function AdminTestPanel({ onNavigateHome, onStartPractice, questions, user }: AdminTestPanelProps) {
  const isAdmin = isAdminUser(user);
  const [tab, setTab] = useState<DebugTab>("challenge");
  const [notice, setNotice] = useState("");
  const [save, setSave] = useState(() => ensurePetCollection(loadPartnerChessSave()));
  const [inventory, setInventory] = useState(() => loadPetTrainingItemInventory());
  const [debugSettings, setDebugSettings] = useState(() => loadAdminDebugSettings());
  const [selectedSubject, setSelectedSubject] = useState<Subject>("history");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedPetId, setSelectedPetId] = useState(() => save.ownedPets[0] ?? defaultTrainingTeamIds[0]);
  const [targetLevel, setTargetLevel] = useState(30);
  const [exportText, setExportText] = useState("");
  const [importText, setImportText] = useState("");
  const [checks, setChecks] = useState<CheckRow[]>([]);

  const chapters = useMemo(() => subjectChapters(questions, selectedSubject), [questions, selectedSubject]);
  const activeChapter = selectedChapter || chapters[0] || "";
  const chapterLevels = useMemo(() => buildChallengeLevels({
    chapterTitle: activeChapter,
    questions: questions.filter((question) => question.subject === selectedSubject && normalizeChapterForSubject(selectedSubject, question.chapter) === activeChapter),
    subjectName: subjectLabels[selectedSubject]
  }), [activeChapter, questions, selectedSubject]);
  const selectedPet = getTrainingPetById(selectedPetId);
  const selectedDisplayPet = getTrainingPetDisplayById(selectedPetId, save);
  const selectedLevelInfo = getPetLevelInfo(save, selectedPetId);
  const selectedSpecies = petSpeciesMasterData.find((species) => species.id === selectedPetId);
  const selectedEvolution = canEvolvePet(save, selectedPetId);
  const selectedTemplate = getSpeciesSkillTemplate(selectedPet);
  const learned = save.petLearnedSkillIds[selectedPetId] ?? [];
  const equipped = save.petEquippedSkillIds[selectedPetId] ?? [];

  function refresh(message?: string) {
    setSave(ensurePetCollection(loadPartnerChessSave()));
    setInventory(loadPetTrainingItemInventory());
    setDebugSettings(loadAdminDebugSettings());
    if (message) setNotice(message);
  }

  function requireConfirm(message: string) {
    return window.confirm(message);
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-[2rem] border border-rose-100 bg-white/78 p-8 text-center shadow-[0_18px_44px_rgba(16,35,63,0.08)]">
          <Lock className="mx-auto size-10 text-rose-500" />
          <h1 className="mt-4 text-2xl font-black text-[#10233f]">无权限访问</h1>
          <p className="mt-2 text-sm font-semibold text-[#667085]">管理员测试台只允许管理员账号使用。</p>
          <button className={`mt-5 ${buttonClass("primary")}`} onClick={onNavigateHome} type="button">返回首页</button>
        </div>
      </div>
    );
  }

  function resetAllProgress() {
    if (!requireConfirm("确定重置全部闯关进度？题库不会被删除。")) return;
    replaceCompletedQuestionIds([]);
    setNotice("已重置全部闯关进度。");
  }

  function resetSubjectProgress(subject: Subject) {
    if (!requireConfirm(`确定重置「${subjectLabels[subject]}」进度？`)) return;
    const completed = getCompletedQuestionIds();
    questions.filter((question) => question.subject === subject).forEach((question) => completed.delete(question.id));
    replaceCompletedQuestionIds([...completed]);
    setNotice(`已重置 ${subjectLabels[subject]} 进度。`);
  }

  function unlockAllLevels() {
    if (!requireConfirm("确定解锁/完成全部本地闯关进度？")) return;
    markQuestionsCompleted(questions.map((question) => question.id));
    setNotice("已将当前题库题目全部标记为完成。");
  }

  function simulateLevelComplete(percent: 100 | 80 | 60) {
    const levelQuestions = getLevelQuestions(questions, selectedSubject, activeChapter, selectedLevel);
    const count = Math.max(1, Math.round(levelQuestions.length * (percent / 100)));
    markQuestionsCompleted(levelQuestions.slice(0, count).map((question) => question.id));
    setNotice(`已模拟完成 ${subjectLabels[selectedSubject]} · ${activeChapter} · 第 ${selectedLevel} 关，正确率 ${percent}%。`);
  }

  function grantAllPets(includeBoss = false) {
    let next = ensurePetCollection(loadPartnerChessSave());
    for (const pet of getAllCollectiblePets()) {
      if (!includeBoss && isBossPet(pet.id)) continue;
      next = addPetToCollection(next, pet.id).save;
    }
    savePartnerChessSave(next);
    refresh(includeBoss ? "已测试获得全部宠物（含 Boss）。" : "已测试获得全部非 Boss 一阶段宠物。");
  }

  function resetToInitialPets() {
    if (!requireConfirm("确定清空非初始宠物并恢复初始三宠？")) return;
    const current = ensurePetCollection(loadPartnerChessSave());
    const next = syncPetSkillState({
      ...current,
      activeTrainingTeam: defaultTrainingTeamIds,
      capturedAt: {},
      ownedPets: defaultTrainingTeamIds,
      petCurrentSpeciesId: Object.fromEntries(defaultTrainingTeamIds.map((id) => [id, id])),
      petEvolutionStage: Object.fromEntries(defaultTrainingTeamIds.map((id) => [id, 1])),
      petExp: Object.fromEntries(defaultTrainingTeamIds.map((id) => [id, current.petExp[id] ?? 0])),
      petLevel: Object.fromEntries(defaultTrainingTeamIds.map((id) => [id, current.petLevel[id] ?? 1])),
      petShards: {}
    });
    savePartnerChessSave(next);
    refresh("已恢复到初始三宠。");
  }

  function restoreDefaultTeam() {
    let next = ensurePetCollection(loadPartnerChessSave());
    defaultTrainingTeamIds.forEach((petId, index) => {
      if (!next.ownedPets.includes(petId)) next = addPetToCollection(next, petId).save;
      next = replaceTeamSlot(next, index, petId);
    });
    savePartnerChessSave(next);
    refresh("已恢复默认背包队伍。");
  }

  function setSelectedPetLevel(level: number) {
    const next = setPetLevelInSave(selectedPetId, level);
    setSave(next);
    setNotice(`${selectedDisplayPet.name} 已设置为 Lv.${clampLevel(level)}。`);
  }

  function forceStage(stage: 1 | 2 | 3) {
    if (!requireConfirm(`确定强制把 ${selectedDisplayPet.name} 设置为 ${stage} 阶？管理员测试操作不会检查等级。`)) return;
    const next = forceEvolutionStage(selectedPetId, stage);
    setSave(next);
    setNotice(`已强制设置进化阶段为 ${stage}。`);
  }

  function learnCurrentSkills() {
    const next = syncPetSkillState(loadPartnerChessSave());
    savePartnerChessSave(next);
    refresh("已按当前等级补齐应学技能。");
  }

  function learnAllSkills() {
    const current = ensurePetCollection(loadPartnerChessSave());
    const ids = selectedTemplate.map((skill) => skill.id);
    const next = syncPetSkillState({
      ...current,
      petLearnedSkillIds: { ...current.petLearnedSkillIds, [selectedPetId]: ids },
      petEquippedSkillIds: { ...current.petEquippedSkillIds, [selectedPetId]: (current.petEquippedSkillIds[selectedPetId] ?? ids).filter((id) => ids.includes(id)).slice(0, 4) }
    });
    savePartnerChessSave(next);
    refresh(`${selectedDisplayPet.name} 已学会全部技能，携带槽仍限制 4 个。`);
  }

  function resetSkills() {
    const current = ensurePetCollection(loadPartnerChessSave());
    const unlocked = selectedTemplate.filter((skill) => (current.petLevel[selectedPetId] ?? 1) >= skill.unlockLevel).map((skill) => skill.id);
    const next = syncPetSkillState({
      ...current,
      petEquippedSkillIds: { ...current.petEquippedSkillIds, [selectedPetId]: unlocked.slice(0, 4) },
      petForgottenSkillIds: { ...current.petForgottenSkillIds, [selectedPetId]: [] },
      petLearnedSkillIds: { ...current.petLearnedSkillIds, [selectedPetId]: unlocked }
    });
    savePartnerChessSave(next);
    refresh("已重置该宠物技能为当前等级默认配置。");
  }

  function findIllegalSkills() {
    const current = ensurePetCollection(loadPartnerChessSave());
    const issues: string[] = [];
    for (const petId of current.ownedPets) {
      const templateIds = new Set(getSpeciesSkillTemplate(getTrainingPetById(petId)).map((skill) => skill.id));
      const badLearned = (current.petLearnedSkillIds[petId] ?? []).filter((skillId) => !templateIds.has(skillId));
      const badEquipped = (current.petEquippedSkillIds[petId] ?? []).filter((skillId) => !templateIds.has(skillId));
      if (badLearned.length || badEquipped.length) issues.push(`${petId}: learned=${badLearned.join(",") || "-"} equipped=${badEquipped.join(",") || "-"}`);
    }
    setNotice(issues.length ? `发现非法技能：${issues.join("；")}` : "未发现技能串用。");
  }

  function cleanIllegalSkills() {
    const next = syncPetSkillState(loadPartnerChessSave());
    savePartnerChessSave(next);
    refresh("已清理非法技能并重新同步技能携带。");
  }

  function setBallCount(ballId: "basic" | "advanced" | "premium", value: number) {
    const next = {
      ...inventory,
      captureBalls: { ...inventory.captureBalls, [ballId]: Math.max(0, Math.round(value || 0)) },
      updatedAt: new Date().toISOString()
    };
    savePetTrainingItemInventory(next);
    setInventory(next);
    setNotice("捕捉道具数量已保存。");
  }

  function checkImagePath(path: string) {
    return new Promise<boolean>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = path;
    });
  }

  async function runChecks() {
    const rows: CheckRow[] = [];
    const current = ensurePetCollection(loadPartnerChessSave());
    const speciesIds = petSpeciesMasterData.map((species) => species.id);
    const duplicateSpeciesIds = speciesIds.filter((id, index) => speciesIds.indexOf(id) !== index);
    rows.push({ name: "speciesId 重复", status: duplicateSpeciesIds.length ? "错误" : "通过", detail: duplicateSpeciesIds.join(", ") || "无重复", suggestion: duplicateSpeciesIds.length ? "检查主数据 id。" : "无需处理" });

    const missingEvolution = petSpeciesMasterData.filter((species) => !species.evolutionLine || species.evolutionLine.stages.length !== 3);
    rows.push({ name: "进化线完整性", status: missingEvolution.length ? "错误" : "通过", detail: missingEvolution.map((item) => item.id).join(", ") || "18 条进化线完整", suggestion: "缺失时补齐 evolutionLine。" });

    const bossOpen = petSpeciesMasterData.filter((species) => species.rarity === "boss" && species.evolutionLine.stages.some((stage) => stage.stage > 1 && stage.canEvolve));
    rows.push({ name: "Boss 普通进化开放", status: bossOpen.length ? "错误" : "通过", detail: bossOpen.map((item) => item.name).join(", ") || "Boss 均为碎片预留", suggestion: "Boss 二三阶段 canEvolve 应为 false。" });

    const overEquipped = Object.entries(current.petEquippedSkillIds).filter(([, ids]) => ids.length > 4);
    rows.push({ name: "携带技能超过 4", status: overEquipped.length ? "错误" : "通过", detail: overEquipped.map(([petId]) => petId).join(", ") || "全部正常", suggestion: "使用清理非法技能修复。" });

    const illegalSkillPets = current.ownedPets.filter((petId) => {
      const templateIds = new Set(getSpeciesSkillTemplate(getTrainingPetById(petId)).map((skill) => skill.id));
      return [...(current.petLearnedSkillIds[petId] ?? []), ...(current.petEquippedSkillIds[petId] ?? [])].some((skillId) => !templateIds.has(skillId));
    });
    rows.push({ name: "非法技能串用", status: illegalSkillPets.length ? "错误" : "通过", detail: illegalSkillPets.join(", ") || "未发现", suggestion: "清理非法技能，避免粗心技能串入其他宠物。" });

    const imagePaths = [
      ...petSpeciesMasterData.flatMap((species) => species.evolutionLine.stages.map((stage) => stage.image)),
      ...pets.map((pet) => pet.image),
      ...enemies.map((enemy) => enemy.image)
    ];
    const chinesePaths = imagePaths.filter((path) => /[\u4e00-\u9fa5\s]/.test(path));
    rows.push({ name: "图片路径命名", status: chinesePaths.length ? "警告" : "通过", detail: chinesePaths.join(", ") || "无中文/空格路径", suggestion: "网页资源建议使用英文短横线文件名。" });
    const uniqueImagePaths = Array.from(new Set(imagePaths));
    const imageResults = await Promise.all(uniqueImagePaths.map(async (path) => ({ ok: await checkImagePath(path), path })));
    const missingImages = imageResults.filter((result) => !result.ok).map((result) => result.path);
    rows.push({ name: "图片 404 检查", status: missingImages.length ? "错误" : "通过", detail: missingImages.join(", ") || `${uniqueImagePaths.length} 个图片路径均可加载`, suggestion: missingImages.length ? "检查 public 资源文件名和数据路径。" : "无需处理" });

    rows.push({ name: "battleUnitId 冲突风险", status: "通过", detail: "训练场运行时使用 player-slot-* / enemy-* 实例 id。", suggestion: "继续避免用 speciesId 作为战斗 key。" });
    setChecks(rows);
    setNotice("系统检查已完成。");
  }

  function backupSave() {
    const key = `sayhi_debug_backup_${Date.now()}`;
    window.localStorage.setItem(key, exportProjectStorage());
    setNotice(`已备份到 ${key}`);
  }

  function restoreLatestBackup() {
    const keys = Object.keys(window.localStorage).filter((key) => key.startsWith("sayhi_debug_backup_")).sort();
    const latest = keys[keys.length - 1];
    if (!latest) {
      setNotice("没有找到备份。");
      return;
    }
    if (!requireConfirm(`确定恢复最近备份 ${latest}？页面会刷新。`)) return;
    const value = window.localStorage.getItem(latest);
    if (value) importProjectStorage(value);
    window.location.reload();
  }

  function clearProjectSaves() {
    if (!requireConfirm("危险操作：确定清空 SayHi 当前浏览器游戏存档？不会清理无关网站数据。")) return;
    for (const key of PROJECT_STORAGE_KEYS) window.localStorage.removeItem(key);
    window.location.reload();
  }

  const tabs: Array<{ id: DebugTab; label: string }> = [
    { id: "challenge", label: "闯关测试" },
    { id: "pets", label: "宠物测试" },
    { id: "evolution", label: "进化测试" },
    { id: "skills", label: "技能测试" },
    { id: "items", label: "道具与捕捉测试" },
    { id: "saves", label: "存档工具" },
    { id: "checks", label: "系统检查" }
  ];

  return (
    <div className="space-y-5 pb-12">
      <section className="rounded-[2rem] border border-white/70 bg-white/72 p-5 shadow-[0_18px_44px_rgba(16,35,63,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1496A3]">Admin Debug Lab</p>
            <h1 className="mt-2 text-3xl font-black text-[#10233f]">管理员测试台</h1>
            <p className="mt-2 text-sm font-semibold text-[#667085]">仅当前浏览器本地存档测试，不修改后端数据库。</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
            <ShieldCheck className="mr-2 inline size-4" /> {user?.email}
          </div>
        </div>
        {notice && <div className="mt-4 rounded-2xl border border-[#159ca8]/20 bg-[#e0f7f4]/70 px-4 py-3 text-sm font-black text-[#10233f]">{notice}</div>}
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-[1.6rem] border border-white/70 bg-white/66 p-2">
        {tabs.map((item) => (
          <button className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-black transition ${tab === item.id ? "bg-[#1496A3] text-white" : "bg-white/70 text-[#10233f]"}`} key={item.id} onClick={() => setTab(item.id)} type="button">
            {item.label}
          </button>
        ))}
      </div>

      {tab === "challenge" && (
        <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <Card title="进度操作" icon={<RotateCcw className="size-5" />}>
            <div className="flex flex-wrap gap-2">
              <button className={buttonClass("danger")} onClick={resetAllProgress} type="button">重置全部闯关进度</button>
              <button className={buttonClass("primary")} onClick={unlockAllLevels} type="button">解锁/完成全部关卡</button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUBJECT_CONFIGS.map((subject) => <button className={buttonClass()} key={subject.code} onClick={() => resetSubjectProgress(subject.code)} type="button">重置{subject.name}</button>)}
            </div>
          </Card>
          <Card title="任意选关与模拟完成" icon={<FlaskConical className="size-5" />}>
            <div className="grid gap-3 md:grid-cols-3">
              <select className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 font-bold" value={selectedSubject} onChange={(event) => { setSelectedSubject(event.target.value as Subject); setSelectedChapter(""); }}>
                {SUBJECT_CONFIGS.map((subject) => <option key={subject.code} value={subject.code}>{subject.name}</option>)}
              </select>
              <select className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 font-bold" value={activeChapter} onChange={(event) => setSelectedChapter(event.target.value)}>
                {chapters.map((chapter) => <option key={chapter} value={chapter}>{chapter}</option>)}
              </select>
              <select className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 font-bold" value={selectedLevel} onChange={(event) => setSelectedLevel(Number(event.target.value))}>
                {chapterLevels.map((level) => <option key={level.id} value={level.index}>第 {level.index} 关 · {level.title}</option>)}
              </select>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={buttonClass("primary")} onClick={() => onStartPractice(levelIdFor(selectedSubject, activeChapter, selectedLevel))} type="button">跳转到该关卡</button>
              {[100, 80, 60].map((percent) => <button className={buttonClass()} key={percent} onClick={() => simulateLevelComplete(percent as 100 | 80 | 60)} type="button">模拟 {percent}% 完成</button>)}
            </div>
          </Card>
        </section>
      )}

      {(tab === "pets" || tab === "evolution" || tab === "skills") && (
        <section className="space-y-4">
          <Card title="宠物选择" icon={<Database className="size-5" />}>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <select className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 font-bold" value={selectedPetId} onChange={(event) => setSelectedPetId(event.target.value)}>
                {save.ownedPets.map((petId) => <option key={petId} value={petId}>{getTrainingPetDisplayById(petId, save).name} · {petId}</option>)}
              </select>
              <div className="flex gap-2">
                <input className="w-28 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 font-bold" max={100} min={1} type="number" value={targetLevel} onChange={(event) => setTargetLevel(Number(event.target.value))} />
                <button className={buttonClass("primary")} onClick={() => setSelectedPetLevel(targetLevel)} type="button">设置等级</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <Info label="当前形态" value={`${selectedDisplayPet.name} · ${getPetEvolutionStageValue(save, selectedPetId)} 阶`} />
              <Info label="等级/经验" value={`Lv.${selectedLevelInfo.level} · EXP ${selectedLevelInfo.exp}`} />
              <Info label="已学/携带" value={`${learned.length} / ${equipped.length}`} />
              <Info label="仓库数量" value={`${save.ownedPets.length} 只`} />
            </div>
            <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-[#10233f] p-4 text-xs font-semibold text-white/86">{JSON.stringify({
              activeTrainingTeam: save.activeTrainingTeam,
              pet: {
                speciesId: selectedPetId,
                currentSpeciesId: save.petCurrentSpeciesId[selectedPetId],
                evolutionStage: save.petEvolutionStage[selectedPetId],
                level: save.petLevel[selectedPetId],
                exp: save.petExp[selectedPetId],
                learnedSkillIds: learned,
                equippedSkillIds: equipped
              }
            }, null, 2)}</pre>
          </Card>

          {tab === "pets" && (
            <Card title="宠物仓库快捷操作" icon={<Wrench className="size-5" />}>
              <div className="flex flex-wrap gap-2">
                {[1, 5, 30, 60, 100].map((level) => <button className={buttonClass()} key={level} onClick={() => setSelectedPetLevel(level)} type="button">升到 Lv.{level}</button>)}
                <button className={buttonClass("primary")} onClick={() => grantAllPets(false)} type="button">一键获得所有一阶段宠物</button>
                <button className={buttonClass()} onClick={() => grantAllPets(true)} type="button">测试获得 Boss</button>
                <button className={buttonClass()} onClick={restoreDefaultTeam} type="button">恢复默认背包</button>
                <button className={buttonClass("danger")} onClick={resetToInitialPets} type="button">清空非初始宠物</button>
              </div>
            </Card>
          )}

          {tab === "evolution" && (
            <Card title="进化测试" icon={<ShieldCheck className="size-5" />}>
              <div className="grid gap-3 md:grid-cols-3">
                {selectedSpecies?.evolutionLine.stages.map((stage) => (
                  <div className="rounded-2xl border border-white/70 bg-white/70 p-3" key={stage.stage}>
                    <img alt={stage.name} className="mx-auto h-24 object-contain" src={stage.image} />
                    <p className="mt-2 text-center text-sm font-black text-[#10233f]">{stage.stage} 阶 · {stage.name}</p>
                    <p className="text-center text-xs font-bold text-[#667085]">{stage.evolveLevel ? `Lv.${stage.evolveLevel}` : "初始形态"} {stage.canEvolve ? "" : "· 碎片预留"}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm font-bold text-[#667085]">当前判断：{selectedEvolution.reason}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={buttonClass()} onClick={() => setSelectedPetLevel(30)} type="button">升到二阶段等级 Lv.30</button>
                <button className={buttonClass()} onClick={() => setSelectedPetLevel(60)} type="button">升到三阶段等级 Lv.60</button>
                <button className={buttonClass("primary")} onClick={() => { const result = evolvePet(save, selectedPetId); savePartnerChessSave(result.save); refresh(result.message); }} type="button">按正式规则进化</button>
                <button className={buttonClass()} onClick={() => forceStage(2)} type="button">强制二阶段</button>
                <button className={buttonClass()} onClick={() => forceStage(3)} type="button">强制三阶段</button>
                <button className={buttonClass("danger")} onClick={() => forceStage(1)} type="button">重置为一阶段</button>
              </div>
            </Card>
          )}

          {tab === "skills" && (
            <Card title="技能测试" icon={<Wrench className="size-5" />}>
              <div className="grid gap-3 md:grid-cols-3">
                <SkillList title="物种技能池 learnset" skills={selectedTemplate.map((skill) => `${skill.unlockLevel}级 · ${skill.name} · ${skill.id}`)} />
                <SkillList title="已学会 learnedSkillIds" skills={learned} />
                <SkillList title="当前携带 equippedSkillIds" skills={equipped} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className={buttonClass()} onClick={learnCurrentSkills} type="button">学会当前等级应学技能</button>
                <button className={buttonClass("primary")} onClick={learnAllSkills} type="button">一键学会全部技能</button>
                <button className={buttonClass()} onClick={resetSkills} type="button">重置为当前等级默认配置</button>
                <button className={buttonClass()} onClick={findIllegalSkills} type="button">快速检查技能串用</button>
                <button className={buttonClass("danger")} onClick={cleanIllegalSkills} type="button">清理非法技能</button>
              </div>
            </Card>
          )}
        </section>
      )}

      {tab === "items" && (
        <section className="space-y-4">
          <Card title="捕捉道具" icon={<FlaskConical className="size-5" />}>
            <div className="grid gap-3 md:grid-cols-3">
              {captureBallConfigs.map((ball) => (
                <div className="rounded-2xl border border-white/70 bg-white/70 p-4" key={ball.id}>
                  <p className="text-lg font-black text-[#10233f]">{ball.name}</p>
                  <p className="mt-1 text-xs font-bold text-[#667085]">当前：{inventory.captureBalls[ball.id]} 个 · 基础率 {ball.baseRate}%</p>
                  <input className="mt-3 w-full rounded-2xl border border-white/70 bg-white/90 px-3 py-2 font-bold" min={0} type="number" value={inventory.captureBalls[ball.id]} onChange={(event) => setBallCount(ball.id, Number(event.target.value))} />
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className={buttonClass("primary")} onClick={() => { const next = addCaptureBalls(inventory, { basic: 99 - inventory.captureBalls.basic, advanced: 99 - inventory.captureBalls.advanced, premium: 99 - inventory.captureBalls.premium }); savePetTrainingItemInventory(next); setInventory(next); setNotice("捕捉球已补满到 99。"); }} type="button">一键补满捕捉球</button>
              <button className={buttonClass("danger")} onClick={() => { if (!requireConfirm("确定清空捕捉道具？")) return; const next = { ...inventory, captureBalls: { basic: 0, advanced: 0, premium: 0 }, updatedAt: new Date().toISOString() }; savePetTrainingItemInventory(next); setInventory(next); }} type="button">清空捕捉道具</button>
            </div>
          </Card>
          <Card title="捕捉与野生宠调试" icon={<AlertTriangle className="size-5" />}>
            <div className="flex flex-wrap items-center gap-3">
              <button className={buttonClass(debugSettings.captureAlwaysSuccess ? "danger" : "primary")} onClick={() => { const next = { ...debugSettings, captureAlwaysSuccess: !debugSettings.captureAlwaysSuccess }; saveAdminDebugSettings(next); setDebugSettings(next); }} type="button">
                捕捉必定成功：{debugSettings.captureAlwaysSuccess ? "开" : "关"}
              </button>
              <select className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 font-bold" value={debugSettings.nextTrainingEnemyId} onChange={(event) => { const next = { ...debugSettings, nextTrainingEnemyId: event.target.value }; saveAdminDebugSettings(next); setDebugSettings(next); }}>
                <option value="">按正常轮换</option>
                {enemies.map((enemy) => <option key={enemy.id} value={enemy.id}>{enemy.name} · {enemy.id}</option>)}
              </select>
              <button className={buttonClass()} onClick={() => setNotice("下一场训练敌人设置已保存；回到伙伴岛点击重新训练即可生效。")} type="button">保存野生宠测试</button>
            </div>
          </Card>
        </section>
      )}

      {tab === "saves" && (
        <section className="space-y-4">
          <Card title="导出 / 导入存档" icon={<Copy className="size-5" />}>
            <div className="flex flex-wrap gap-2">
              <button className={buttonClass("primary")} onClick={() => setExportText(exportProjectStorage())} type="button">导出当前本地存档</button>
              <button className={buttonClass()} onClick={() => navigator.clipboard?.writeText(exportText)} type="button">复制导出文本</button>
              <button className={buttonClass()} onClick={backupSave} type="button">备份存档</button>
              <button className={buttonClass()} onClick={restoreLatestBackup} type="button">恢复最近备份</button>
              <button className={buttonClass("danger")} onClick={clearProjectSaves} type="button">清空全部游戏存档</button>
            </div>
            <textarea className="mt-4 min-h-52 w-full rounded-2xl border border-white/70 bg-white/80 p-4 font-mono text-xs" value={exportText} onChange={(event) => setExportText(event.target.value)} placeholder="导出的 JSON 会显示在这里" />
            <textarea className="mt-4 min-h-36 w-full rounded-2xl border border-white/70 bg-white/80 p-4 font-mono text-xs" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder="粘贴要导入的 JSON" />
            <button className={`mt-3 ${buttonClass("danger")}`} onClick={() => { if (!requireConfirm("确定导入存档？页面会刷新。")) return; try { importProjectStorage(importText); window.location.reload(); } catch (error) { setNotice(error instanceof Error ? error.message : "导入失败。"); } }} type="button">确认导入存档</button>
          </Card>
        </section>
      )}

      {tab === "checks" && (
        <Card title="系统检查" icon={<CheckCircle2 className="size-5" />}>
          <button className={buttonClass("primary")} onClick={runChecks} type="button">运行系统检查</button>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs font-black uppercase tracking-[0.14em] text-[#667085]">
                <tr><th>检查项</th><th>状态</th><th>详情</th><th>建议</th></tr>
              </thead>
              <tbody>
                {checks.map((row) => (
                  <tr className="rounded-2xl bg-white/72" key={row.name}>
                    <td className="rounded-l-2xl px-3 py-3 font-black text-[#10233f]">{row.name}</td>
                    <td className="px-3 py-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(row.status)}`}>{row.status}</span></td>
                    <td className="px-3 py-3 font-semibold text-[#667085]">{row.detail}</td>
                    <td className="rounded-r-2xl px-3 py-3 font-semibold text-[#667085]">{row.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({ children, icon, title }: { children: React.ReactNode; icon: React.ReactNode; title: string }) {
  return (
    <section className="rounded-[1.8rem] border border-white/70 bg-white/68 p-5 shadow-[0_16px_42px_rgba(16,35,63,0.08)] backdrop-blur">
      <div className="mb-4 flex items-center gap-2 text-[#10233f]">
        <span className="grid size-10 place-items-center rounded-2xl bg-[#e0f7f4] text-[#1496A3]">{icon}</span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-3">
      <p className="text-xs font-black text-[#667085]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#10233f]">{value}</p>
    </div>
  );
}

function SkillList({ skills, title }: { skills: string[]; title: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
      <p className="text-sm font-black text-[#10233f]">{title}</p>
      <div className="mt-3 max-h-64 space-y-2 overflow-auto">
        {skills.length === 0 ? <p className="text-xs font-bold text-[#667085]">暂无</p> : skills.map((skill) => <p className="rounded-xl bg-[#f7f3e7] px-3 py-2 text-xs font-bold text-[#10233f]" key={skill}>{skill}</p>)}
      </div>
    </div>
  );
}
