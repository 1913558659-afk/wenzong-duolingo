import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BookOpen, Box, ChevronRight, Clock, Coins, Crown, Flag, Gem, HelpCircle, Home, Lock, Map, RefreshCw, Search, Shield, Sparkles, Star, Swords, Tent, Trophy, Users, Zap } from "lucide-react";
import { GameCard } from "@/components/GameCard";
import { PageHeader } from "@/components/PageHeader";
import { PhaserTerritoryWarCanvas } from "@/components/territoryWar/PhaserTerritoryWarCanvas";
import { isAdminUser } from "@/config/admin";
import { pets } from "@/data/petBattleData";
import type { AuthUser, Difficulty, QuizQuestion, Subject } from "@/types";
import { loadPartnerChessSave } from "@/utils/partnerChessSave";
import { getTrainingPetDisplayById } from "@/utils/petCollection";
import { petSpriteFacingClass } from "@/utils/petSpriteFacing";

type TileType = "plain" | "resource" | "question" | "treasure" | "enemy_camp" | "buff" | "base_player" | "base_enemy";
type Owner = "player" | "enemy" | "neutral";
type WarStatus = "playing" | "victory" | "defeat";
type TerritoryBuffType = "unit_attack" | "unit_hp" | "resource_income" | "spawn_speed" | "explore_discount" | "enemy_attack" | "enemy_spawn_delay" | "camp_boss_damage";
type TerritoryScene = "chapters" | "prepare" | "map" | "result";
type TerritoryQuestion = {
  answer: string;
  chapter: string;
  difficulty: Difficulty;
  explanation: string;
  id: string;
  options: string[];
  question: string;
  subject: Subject;
};
type TerritoryBuff = {
  amount: number;
  expiresAtTick?: number;
  id: string;
  label: string;
  type: TerritoryBuffType;
  uses?: number;
};
type ExpeditionSettings = {
  chapter: string;
  difficulty: "all" | Difficulty;
  subject: "all" | Subject;
};
type TerritoryChapter = {
  bossHp: number;
  bossName: string;
  difficulty: Difficulty;
  id: string;
  mapSize: number;
  recommendedPower: number;
  subject: Subject;
  subtitle: string;
  title: string;
  unlockRequirement: string | null;
};
type Building = {
  level: 1 | 2;
  spawnTimer: number;
  type: "partner_outpost";
};
type TerritoryTile = {
  building?: Building;
  col: number;
  enemyPower: number;
  id: string;
  ownedBy: Owner;
  answeredCorrect?: boolean;
  questionId?: string;
  resourceRate: number;
  revealed: boolean;
  row: number;
  solved?: boolean;
  type: TileType;
};
type TerritoryUnit = {
  attack: number;
  hp: number;
  id: string;
  progress: number;
  side: "player" | "enemy";
};
type TerritoryStats = {
  campsDestroyed: number;
  coinsEarned: number;
  correctAnswers: number;
  enemiesDefeated: number;
  exploredTiles: number;
  questionsAnswered: number;
  startTick: number;
};
type TerritoryWarState = {
  baseHpEnemy: number;
  baseHpPlayer: number;
  buffAttack: number;
  buffResource: number;
  chapterId: string;
  resultRecorded: boolean;
  logs: string[];
  settings: ExpeditionSettings;
  resources: number;
  scene: TerritoryScene;
  selectedTileId: string;
  selectedPartnerIds: string[];
  started: boolean;
  status: WarStatus;
  stats: TerritoryStats;
  temporaryBuffs: TerritoryBuff[];
  tick: number;
  tiles: TerritoryTile[];
  units: TerritoryUnit[];
  usedQuestionIds: string[];
};
type TerritoryChapterResult = {
  bestAccuracy: number;
  bestStars: number;
  bestTime: number;
  completedAt: string;
};
type TerritoryWarProgress = {
  completedChapters: Record<string, TerritoryChapterResult>;
  territoryExp: number;
  totalCorrectAnswers: number;
  totalPlays: number;
  totalQuestionsAnswered: number;
  totalWins: number;
  updatedAt: string;
};
type ExpeditionPartner = {
  effect: string;
  id: string;
  image: string;
  name: string;
};
type ExpeditionPartnerSkill = {
  description: string;
  name: string;
  type: TerritoryBuffType | "base_shield" | "base_regen";
  value: number;
 };

const mapSize = 6;
const storageKey = "sayhi_territory_war_state";
const progressStorageKey = "sayhi_territory_war_progress";
const legacyStorageKey = "sayhi-territory-war-mvp";
const exploreCost = 20;
const outpostCost = 50;
const upgradeCost = 80;

const tileLabels: Record<TileType, string> = {
  base_enemy: "迷雾核心",
  base_player: "学习基地",
  buff: "灵感点",
  enemy_camp: "迷雾敌营",
  plain: "空地",
  question: "知识挑战",
  resource: "知识泉",
  treasure: "知识宝箱"
};

const tileIcons: Record<TileType, typeof Home> = {
  base_enemy: Flag,
  base_player: Home,
  buff: Sparkles,
  enemy_camp: Tent,
  plain: Map,
  question: HelpCircle,
  resource: Gem,
  treasure: Box
};

const subjectLabels: Record<Subject, string> = {
  biology: "生物",
  english: "英语",
  geography: "地理",
  history: "历史",
  math: "数学",
  politics: "政治"
};

const territoryWarChapters: TerritoryChapter[] = [
  { bossHp: 180, bossName: "混乱题灵", difficulty: "easy", id: "history-ancient-01", mapSize: 6, recommendedPower: 100, subject: "history", subtitle: "从文明起源到早期国家", title: "先秦迷雾原野", unlockRequirement: null },
  { bossHp: 220, bossName: "制度迷影", difficulty: "medium", id: "history-qinhan-02", mapSize: 6, recommendedPower: 135, subject: "history", subtitle: "制度线索与统一秩序", title: "秦汉制度边境", unlockRequirement: "history-ancient-01" },
  { bossHp: 260, bossName: "繁荣幻卷", difficulty: "hard", id: "history-tangsong-03", mapSize: 6, recommendedPower: 170, subject: "history", subtitle: "繁荣时代的知识路线", title: "唐宋繁荣之路", unlockRequirement: "history-qinhan-02" },
  { bossHp: 175, bossName: "概念雾核", difficulty: "easy", id: "politics-core-01", mapSize: 6, recommendedPower: 100, subject: "politics", subtitle: "理解核心概念与基础判断", title: "核心概念训练场", unlockRequirement: null },
  { bossHp: 215, bossName: "秩序壁垒", difficulty: "medium", id: "politics-govern-02", mapSize: 6, recommendedPower: 135, subject: "politics", subtitle: "治理结构与规则意识", title: "国家治理据点", unlockRequirement: "politics-core-01" },
  { bossHp: 255, bossName: "经济迷阵", difficulty: "hard", id: "politics-economy-03", mapSize: 6, recommendedPower: 170, subject: "politics", subtitle: "经济生活与选择策略", title: "经济生活阵地", unlockRequirement: "politics-govern-02" },
  { bossHp: 175, bossName: "方位雾灵", difficulty: "easy", id: "geography-map-01", mapSize: 6, recommendedPower: 100, subject: "geography", subtitle: "地图判读与方向感", title: "地图判读丘陵", unlockRequirement: null },
  { bossHp: 215, bossName: "风带领主", difficulty: "medium", id: "geography-climate-02", mapSize: 6, recommendedPower: 135, subject: "geography", subtitle: "气候、风带与区域联系", title: "气候风带荒原", unlockRequirement: "geography-map-01" },
  { bossHp: 255, bossName: "港湾迷核", difficulty: "hard", id: "geography-region-03", mapSize: 6, recommendedPower: 170, subject: "geography", subtitle: "区域发展与空间判断", title: "区域发展港湾", unlockRequirement: "geography-climate-02" },
  { bossHp: 170, bossName: "词汇雾灵", difficulty: "easy", id: "english-vocab-01", mapSize: 6, recommendedPower: 100, subject: "english", subtitle: "积累词汇，打开表达入口", title: "词汇森林", unlockRequirement: null },
  { bossHp: 215, bossName: "语序守卫", difficulty: "medium", id: "english-grammar-02", mapSize: 6, recommendedPower: 135, subject: "english", subtitle: "语法结构与表达秩序", title: "语法高地", unlockRequirement: "english-vocab-01" },
  { bossHp: 255, bossName: "长文迷潮", difficulty: "hard", id: "english-reading-03", mapSize: 6, recommendedPower: 170, subject: "english", subtitle: "阅读理解与信息定位", title: "阅读理解峡谷", unlockRequirement: "english-grammar-02" },
  { bossHp: 170, bossName: "计算雾团", difficulty: "easy", id: "math-basic-01", mapSize: 6, recommendedPower: 100, subject: "math", subtitle: "稳住计算，积累资源", title: "基础计算平原", unlockRequirement: null },
  { bossHp: 215, bossName: "坐标幻影", difficulty: "medium", id: "math-function-02", mapSize: 6, recommendedPower: 135, subject: "math", subtitle: "函数变化与坐标推演", title: "函数坐标岛", unlockRequirement: "math-basic-01" },
  { bossHp: 255, bossName: "几何壁垒", difficulty: "hard", id: "math-geometry-03", mapSize: 6, recommendedPower: 170, subject: "math", subtitle: "图形关系与推理路线", title: "几何推理山谷", unlockRequirement: "math-function-02" }
];

const territoryPetSkills: Record<string, ExpeditionPartnerSkill> = {
  anxiety_beast: { description: "我方前 20 秒出兵速度 +15%", name: "压迫突袭", type: "spawn_speed", value: 0.15 },
  careless_beast: { description: "敌方单位攻击 -8%", name: "乱纸干扰", type: "enemy_attack", value: -0.08 },
  cloud_beast: { description: "我方基地开局护盾 +20", name: "云盾守护", type: "base_shield", value: 20 },
  fire_fox: { description: "我方单位攻击 +10%", name: "星火冲锋", type: "unit_attack", value: 0.1 },
  "focus-crow-01": { description: "我方单位对敌营和 Boss 伤害 +10%", name: "题眼锁定", type: "camp_boss_damage", value: 0.1 },
  "focus-octopus-01": { description: "伙伴据点生成速度 +8%", name: "队列整理", type: "spawn_speed", value: 0.08 },
  "focus-rabbit-01": { description: "每 12 秒恢复我方基地 3 HP", name: "静心恢复", type: "base_regen", value: 3 },
  forget_shadow: { description: "敌方出兵间隔 +10%", name: "迷雾延迟", type: "enemy_spawn_delay", value: 0.1 },
  grass_dragon: { description: "我方单位 HP +12%", name: "根系庇护", type: "unit_hp", value: 0.12 }
};

const fallbackQuestions: TerritoryQuestion[] = [
  {
    answer: "A",
    chapter: "测试章节",
    difficulty: "easy",
    explanation: "资源点能提升知识币产出，是扩张领地的重要基础。",
    id: "territory-fallback-1",
    options: ["占领资源点", "减少据点", "放弃探索", "关闭日志"],
    question: "在知识领地战中，哪种做法能提高知识币产出？",
    subject: "history"
  },
  {
    answer: "B",
    chapter: "测试章节",
    difficulty: "easy",
    explanation: "相邻迷雾格才能被探索，避免玩家跳过地图扩张过程。",
    id: "territory-fallback-2",
    options: ["任意迷雾格", "相邻我方领地的迷雾格", "敌方基地", "已解决题目格"],
    question: "第一版探索规则中，玩家可以探索哪类格子？",
    subject: "geography"
  },
  {
    answer: "C",
    chapter: "测试章节",
    difficulty: "medium",
    explanation: "伙伴据点会周期性生成我方单位，推动战线前进。",
    id: "territory-fallback-3",
    options: ["停止战斗", "扣除基地 HP", "自动派出小伙伴", "清空题目池"],
    question: "伙伴据点的核心作用是什么？",
    subject: "politics"
  }
];

function tileId(row: number, col: number) {
  return `${row}-${col}`;
}

function lanePositionForTile(tile: TerritoryTile) {
  return Math.round(((mapSize - 1 - tile.row + tile.col) / ((mapSize - 1) * 2)) * 100);
}

function pushLog(logs: string[], message: string) {
  return [message, ...logs].slice(0, 10);
}

function isNeighbor(left: TerritoryTile, right: TerritoryTile) {
  const directions = left.row % 2 === 0
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
  return directions.some(([dr, dc]) => left.row + dr === right.row && left.col + dc === right.col);
}

function chooseTileType(): TileType {
  const roll = Math.random();
  if (roll < 0.35) return "plain";
  if (roll < 0.57) return "resource";
  if (roll < 0.77) return "question";
  if (roll < 0.87) return "treasure";
  if (roll < 0.95) return "enemy_camp";
  return "buff";
}

function createInitialTiles() {
  const tiles: TerritoryTile[] = [];
  for (let row = 0; row < mapSize; row += 1) {
    for (let col = 0; col < mapSize; col += 1) {
      const isPlayerBase = row === mapSize - 1 && col === 0;
      const isEnemyBase = row === 0 && col === mapSize - 1;
      tiles.push({
        col,
        enemyPower: isEnemyBase ? 120 : 0,
        id: tileId(row, col),
        ownedBy: isPlayerBase ? "player" : isEnemyBase ? "enemy" : "neutral",
        resourceRate: 0,
        revealed: isPlayerBase || isEnemyBase,
        row,
        type: isPlayerBase ? "base_player" : isEnemyBase ? "base_enemy" : "plain"
      });
    }
  }
  return tiles;
}

function defaultStats(): TerritoryStats {
  return {
    campsDestroyed: 0,
    coinsEarned: 0,
    correctAnswers: 0,
    enemiesDefeated: 0,
    exploredTiles: 0,
    questionsAnswered: 0,
    startTick: 0
  };
}

function defaultProgress(): TerritoryWarProgress {
  return {
    completedChapters: {},
    territoryExp: 0,
    totalCorrectAnswers: 0,
    totalPlays: 0,
    totalQuestionsAnswered: 0,
    totalWins: 0,
    updatedAt: new Date().toISOString()
  };
}

function territoryLevel(exp: number) {
  return Math.floor(Math.max(0, exp) / 100) + 1;
}

function getChapter(chapterId: string) {
  return territoryWarChapters.find((chapter) => chapter.id === chapterId) ?? territoryWarChapters[0];
}

function getChapterIndex(chapter: TerritoryChapter) {
  return territoryWarChapters.filter((item) => item.subject === chapter.subject).findIndex((item) => item.id === chapter.id);
}

function isChapterUnlocked(chapter: TerritoryChapter, progress: TerritoryWarProgress) {
  return !chapter.unlockRequirement || Boolean(progress.completedChapters[chapter.unlockRequirement]);
}

function starsForResult(state: TerritoryWarState) {
  if (state.status !== "victory") return 0;
  const accuracy = state.stats.questionsAnswered ? state.stats.correctAnswers / state.stats.questionsAnswered : 1;
  if (accuracy >= 0.8 && state.baseHpPlayer > 50) return 3;
  if (accuracy >= 0.6) return 2;
  return 1;
}

function resultAccuracy(state: TerritoryWarState) {
  return state.stats.questionsAnswered ? Math.round((state.stats.correctAnswers / state.stats.questionsAnswered) * 100) : 100;
}

function resultExp(state: TerritoryWarState) {
  const base = state.status === "victory" ? 30 : 10;
  return base + state.stats.correctAnswers * 2;
}

function loadTerritoryWarProgress() {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(progressStorageKey);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<TerritoryWarProgress>;
    return {
      ...defaultProgress(),
      ...parsed,
      completedChapters: parsed.completedChapters && typeof parsed.completedChapters === "object" ? parsed.completedChapters : {},
      territoryExp: Math.max(0, Number(parsed.territoryExp ?? 0)),
      totalCorrectAnswers: Math.max(0, Number(parsed.totalCorrectAnswers ?? 0)),
      totalPlays: Math.max(0, Number(parsed.totalPlays ?? 0)),
      totalQuestionsAnswered: Math.max(0, Number(parsed.totalQuestionsAnswered ?? 0)),
      totalWins: Math.max(0, Number(parsed.totalWins ?? 0)),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString()
    };
  } catch {
    return defaultProgress();
  }
}

function saveTerritoryWarProgress(progress: TerritoryWarProgress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(progressStorageKey, JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }));
}

function applyTerritoryWarResult(progress: TerritoryWarProgress, state: TerritoryWarState) {
  const elapsed = Math.max(0, state.tick - state.stats.startTick);
  const stars = starsForResult(state);
  const accuracy = resultAccuracy(state);
  const currentBest = progress.completedChapters[state.chapterId];
  const nextCompleted = state.status === "victory"
    ? {
      ...progress.completedChapters,
      [state.chapterId]: {
        bestAccuracy: Math.max(currentBest?.bestAccuracy ?? 0, accuracy),
        bestStars: Math.max(currentBest?.bestStars ?? 0, stars),
        bestTime: currentBest?.bestTime ? Math.min(currentBest.bestTime, elapsed) : elapsed,
        completedAt: new Date().toISOString()
      }
    }
    : progress.completedChapters;
  return {
    ...progress,
    completedChapters: nextCompleted,
    territoryExp: progress.territoryExp + resultExp(state),
    totalCorrectAnswers: progress.totalCorrectAnswers + state.stats.correctAnswers,
    totalPlays: progress.totalPlays + 1,
    totalQuestionsAnswered: progress.totalQuestionsAnswered + state.stats.questionsAnswered,
    totalWins: progress.totalWins + (state.status === "victory" ? 1 : 0),
    updatedAt: new Date().toISOString()
  };
}

function createInitialState(chapterId = territoryWarChapters[0].id, selectedPartnerIds: string[] = []): TerritoryWarState {
  const chapter = getChapter(chapterId);
  const progress = loadTerritoryWarProgress();
  const levelBonus = Math.floor((territoryLevel(progress.territoryExp) - 1) / 5) * 5;
  return {
    baseHpEnemy: chapter.bossHp,
    baseHpPlayer: 110,
    buffAttack: 0,
    buffResource: 0,
    chapterId: chapter.id,
    logs: ["欢迎来到知识领地战。选择章节与伙伴，攻破知识迷雾核心。"],
    resultRecorded: false,
    scene: "chapters",
    selectedPartnerIds,
    settings: { chapter: "all", difficulty: chapter.difficulty, subject: chapter.subject },
    resources: 100 + levelBonus,
    selectedTileId: tileId(mapSize - 1, 0),
    started: false,
    status: "playing",
    stats: defaultStats(),
    temporaryBuffs: [],
    tick: 0,
    tiles: createInitialTiles(),
    units: [],
    usedQuestionIds: []
  };
}

function normalizeState(value: unknown): TerritoryWarState {
  const fallback = createInitialState();
  if (!value || typeof value !== "object") return fallback;
  const maybe = value as Partial<TerritoryWarState>;
  if (!Array.isArray(maybe.tiles) || maybe.tiles.length !== mapSize * mapSize) return fallback;
  const chapter = getChapter(typeof maybe.chapterId === "string" ? maybe.chapterId : fallback.chapterId);
  return {
    ...fallback,
    ...maybe,
    baseHpEnemy: Math.max(0, Number(maybe.baseHpEnemy ?? fallback.baseHpEnemy)),
    baseHpPlayer: Math.max(0, Number(maybe.baseHpPlayer ?? fallback.baseHpPlayer)),
    chapterId: chapter.id,
    logs: Array.isArray(maybe.logs) ? maybe.logs.slice(0, 10) : fallback.logs,
    resultRecorded: Boolean(maybe.resultRecorded),
    resources: Math.max(0, Number(maybe.resources ?? fallback.resources)),
    scene: maybe.scene === "chapters" || maybe.scene === "prepare" || maybe.scene === "map" || maybe.scene === "result" ? maybe.scene : (maybe.started ? "map" : "chapters"),
    settings: {
      chapter: typeof maybe.settings?.chapter === "string" ? maybe.settings.chapter : fallback.settings.chapter,
      difficulty: maybe.settings?.difficulty === "easy" || maybe.settings?.difficulty === "medium" || maybe.settings?.difficulty === "hard" || maybe.settings?.difficulty === "all" ? maybe.settings.difficulty : fallback.settings.difficulty,
      subject: maybe.settings?.subject === "history" || maybe.settings?.subject === "politics" || maybe.settings?.subject === "geography" || maybe.settings?.subject === "biology" || maybe.settings?.subject === "math" || maybe.settings?.subject === "english" || maybe.settings?.subject === "all" ? maybe.settings.subject : fallback.settings.subject
    },
    selectedPartnerIds: Array.isArray(maybe.selectedPartnerIds) ? maybe.selectedPartnerIds.filter((id): id is string => typeof id === "string").slice(0, 3) : fallback.selectedPartnerIds,
    started: Boolean(maybe.started),
    stats: {
      ...fallback.stats,
      ...(maybe.stats && typeof maybe.stats === "object" ? maybe.stats : {}),
      campsDestroyed: Math.max(0, Number(maybe.stats?.campsDestroyed ?? 0)),
      coinsEarned: Math.max(0, Number(maybe.stats?.coinsEarned ?? 0)),
      correctAnswers: Math.max(0, Number(maybe.stats?.correctAnswers ?? 0)),
      enemiesDefeated: Math.max(0, Number(maybe.stats?.enemiesDefeated ?? 0)),
      exploredTiles: Math.max(0, Number(maybe.stats?.exploredTiles ?? 0)),
      questionsAnswered: Math.max(0, Number(maybe.stats?.questionsAnswered ?? 0)),
      startTick: Math.max(0, Number(maybe.stats?.startTick ?? 0))
    },
    status: maybe.status === "victory" || maybe.status === "defeat" ? maybe.status : "playing",
    temporaryBuffs: Array.isArray(maybe.temporaryBuffs) ? maybe.temporaryBuffs : [],
    tiles: maybe.tiles.map((tile) => ({ ...tile, building: tile.building ? { ...tile.building } : undefined })),
    units: Array.isArray(maybe.units) ? maybe.units : [],
    usedQuestionIds: Array.isArray(maybe.usedQuestionIds) ? maybe.usedQuestionIds : []
  };
}

function loadTerritoryWarState() {
  if (typeof window === "undefined") return createInitialState();
  try {
    const saved = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
    return normalizeState(saved ? JSON.parse(saved) : null);
  } catch {
    return createInitialState();
  }
}

function normalizeQuestion(question: QuizQuestion): TerritoryQuestion | null {
  if (!question.question || !Array.isArray(question.options) || question.options.length < 2) return null;
  return {
    answer: question.answer,
    chapter: question.chapter || "未分章节",
    difficulty: question.difficulty,
    explanation: question.explanation || "暂无解析。",
    id: question.id,
    options: question.options,
    question: question.question,
    subject: question.subject
  };
}

function answerMatches(question: TerritoryQuestion, selectedOption: string, selectedIndex: number) {
  const answer = String(question.answer).trim();
  const answerLetter = String.fromCharCode(65 + selectedIndex);
  if (/^[A-D]$/i.test(answer)) return answer.toUpperCase() === answerLetter;
  const numeric = Number(answer);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric < question.options.length) return numeric === selectedIndex;
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= question.options.length) return numeric - 1 === selectedIndex;
  return answer === selectedOption;
}

function correctAnswerText(question: TerritoryQuestion) {
  const answer = String(question.answer).trim();
  if (/^[A-D]$/i.test(answer)) return question.options[answer.toUpperCase().charCodeAt(0) - 65] ?? answer;
  const numeric = Number(answer);
  if (Number.isInteger(numeric) && numeric >= 0 && numeric < question.options.length) return question.options[numeric] ?? answer;
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= question.options.length) return question.options[numeric - 1] ?? answer;
  return answer;
}

function activeBuffs(state: TerritoryWarState, type: TerritoryBuffType) {
  return state.temporaryBuffs.filter((buff) => buff.type === type && (!buff.expiresAtTick || buff.expiresAtTick > state.tick) && (buff.uses ?? 1) > 0);
}

function buffAmount(state: TerritoryWarState, type: TerritoryBuffType) {
  return activeBuffs(state, type).reduce((total, buff) => total + buff.amount, 0);
}

function addTimedBuff(state: TerritoryWarState, type: TerritoryBuffType, amount: number, seconds: number, label: string): TerritoryBuff {
  return {
    amount,
    expiresAtTick: state.tick + seconds,
    id: `${type}-${state.tick}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    type
  };
}

function getPartnerSkill(petId: string): ExpeditionPartnerSkill {
  return territoryPetSkills[petId] ?? { description: "我方单位攻击 +3%", name: "伙伴协力", type: "unit_attack", value: 0.03 };
}

function expeditionSkillAmount(partners: ExpeditionPartner[], type: ExpeditionPartnerSkill["type"]) {
  return partners.reduce((total, partner) => {
    const skill = getPartnerSkill(partner.id);
    return skill.type === type ? total + skill.value : total;
  }, 0);
}

function consumeExploreBuffs(buffs: TerritoryBuff[]) {
  let consumedDiscount = false;
  return buffs.flatMap((buff) => {
    if (buff.type !== "explore_discount" || consumedDiscount) return [buff];
    consumedDiscount = true;
    const nextUses = (buff.uses ?? 1) - 1;
    return nextUses > 0 ? [{ ...buff, uses: nextUses }] : [];
  });
}

function getAdjacentOwnedTile(tiles: TerritoryTile[], tile: TerritoryTile) {
  return tiles.some((other) => other.ownedBy === "player" && other.revealed && isNeighbor(other, tile));
}

function getTileClass(tile: TerritoryTile, selected: boolean, canExplore: boolean) {
  if (!tile.revealed) {
    return canExplore
      ? selected ? "border-tide bg-[#dff8f4] text-ink shadow-[0_12px_28px_rgba(21,156,168,0.16)]" : "border-tide/30 bg-[#edf7f7] text-ink/68 hover:-translate-y-0.5"
      : "border-slate-300/60 bg-slate-200/70 text-slate-500";
  }
  if (tile.type === "base_player") return "border-tide bg-[#dff8f4] text-tide";
  if (tile.type === "base_enemy") return "border-coral bg-[#fff0ec] text-coral";
  if (tile.type === "resource") return "border-leaf/50 bg-[#edfbea] text-leaf";
  if (tile.type === "question") return tile.solved ? "border-tide/50 bg-[#e0f7f4] text-tide" : "border-indigo-300 bg-indigo-50 text-indigo-700";
  if (tile.type === "treasure") return "border-gold/60 bg-[#fff7df] text-gold";
  if (tile.type === "enemy_camp") return "border-purple-300 bg-purple-50 text-purple-700";
  if (tile.type === "buff") return "border-sky-300 bg-sky-50 text-sky-700";
  if (tile.ownedBy === "player") return "border-tide/40 bg-white text-ink";
  return "border-white/70 bg-white/60 text-ink/70";
}

function hpPercent(value: number, max: number) {
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

function applyTick(state: TerritoryWarState, partners: ExpeditionPartner[]) {
  if (!state.started || state.status !== "playing") return state;
  const chapter = getChapter(state.chapterId);
  let logs = state.logs;
  let stats = { ...state.stats };
  let tiles = state.tiles.map((tile) => ({ ...tile, building: tile.building ? { ...tile.building } : undefined }));
  let units = state.units.map((unit) => ({ ...unit }));
  const temporaryBuffs = state.temporaryBuffs.filter((buff) => (!buff.expiresAtTick || buff.expiresAtTick > state.tick) && (buff.uses ?? 1) > 0);
  const resourceBuff = buffAmount({ ...state, temporaryBuffs }, "resource_income");
  const attackBuff = buffAmount({ ...state, temporaryBuffs }, "unit_attack");
  const spawnBuff = buffAmount({ ...state, temporaryBuffs }, "spawn_speed");
  const enemyAttackBuff = buffAmount({ ...state, temporaryBuffs }, "enemy_attack");
  const enemySpawnDelay = expeditionSkillAmount(partners, "enemy_spawn_delay");
  const bossDamageBonus = expeditionSkillAmount(partners, "camp_boss_damage");
  const baseRegen = expeditionSkillAmount(partners, "base_regen");
  const income = Math.round((3 + tiles.filter((tile) => tile.ownedBy === "player" && tile.type === "resource").length * 2) * (1 + state.buffResource + resourceBuff));
  let resources = state.resources + income;
  stats.coinsEarned += income;
  let baseHpPlayer = Math.min(130, state.baseHpPlayer + (baseRegen > 0 && state.tick > 0 && state.tick % 12 === 0 ? baseRegen : 0));
  let baseHpEnemy = state.baseHpEnemy;
  const playerAttackBonus = expeditionSkillAmount(partners, "unit_attack") + attackBuff;
  const playerHpBonus = expeditionSkillAmount(partners, "unit_hp");
  const partnerSpawnBonus = partners.reduce((total, partner) => {
    const skill = getPartnerSkill(partner.id);
    if (skill.type !== "spawn_speed") return total;
    if (partner.id === "anxiety_beast" && state.tick - state.stats.startTick > 20) return total;
    return total + skill.value;
  }, 0);
  const outpostSpeedBonus = partnerSpawnBonus + spawnBuff;

  tiles = tiles.map((tile) => {
    if (tile.ownedBy !== "player" || tile.building?.type !== "partner_outpost") return tile;
    const interval = Math.max(1, tile.building.level === 2 ? 2 - outpostSpeedBonus : 3 - outpostSpeedBonus);
    const spawnTimer = tile.building.spawnTimer + 1;
    if (spawnTimer >= interval) {
      units.push({
        attack: Math.round(6 * (1 + playerAttackBonus + state.buffAttack)),
        hp: Math.round(20 * (1 + playerHpBonus)),
        id: `p-${state.tick}-${tile.id}-${Math.random().toString(36).slice(2, 6)}`,
        progress: Math.max(0, Math.min(100, lanePositionForTile(tile))),
        side: "player"
      });
      logs = pushLog(logs, "伙伴据点派出了小伙伴。");
      return { ...tile, building: { ...tile.building, spawnTimer: 0 } };
    }
    return { ...tile, building: { ...tile.building, spawnTimer } };
  });

  const enemySpawnInterval = Math.max(3, Math.round(4 * (1 + enemySpawnDelay)));
  if (state.tick % enemySpawnInterval === 0) {
    units.push({ attack: Math.round(5 * (1 + enemyAttackBuff)), hp: 18, id: `e-base-${state.tick}`, progress: 100, side: "enemy" });
    logs = pushLog(logs, "迷雾核心派出了小怪。");
  }
  const bossWaveInterval = chapter.difficulty === "hard" ? 15 : chapter.difficulty === "medium" ? 18 : 20;
  if (state.tick > 0 && state.tick % bossWaveInterval === 0) {
    units.push(
      { attack: Math.round(6 * (1 + enemyAttackBuff)), hp: 20, id: `e-boss-a-${state.tick}`, progress: 100, side: "enemy" },
      { attack: Math.round(5 * (1 + enemyAttackBuff)), hp: 18, id: `e-boss-b-${state.tick}`, progress: 94, side: "enemy" }
    );
    logs = pushLog(logs, `${chapter.bossName} 召唤了一波迷雾小怪。`);
  }
  if (chapter.difficulty === "medium" && state.tick > 0 && state.tick % 30 === 0) {
    logs = pushLog(logs, `${chapter.bossName} 激活迷雾鼓动，敌方攻击短暂提升。`);
    temporaryBuffs.push(addTimedBuff(state, "enemy_attack", 0.1, 10, "Boss 鼓动：敌方攻击 +10%"));
  }
  if (chapter.difficulty === "hard" && state.tick > 0 && state.tick % 25 === 0) {
    const target = tiles.find((tile) => tile.revealed && tile.ownedBy !== "player" && tile.type === "plain") ?? tiles.find((tile) => tile.revealed && tile.ownedBy === "neutral");
    if (target) {
      tiles = tiles.map((tile) => tile.id === target.id ? { ...tile, enemyPower: 35, ownedBy: "enemy", type: "enemy_camp" } : tile);
      logs = pushLog(logs, `${chapter.bossName} 在地图上扩散出新的敌营。`);
    }
  }
  for (const camp of tiles.filter((tile) => tile.revealed && tile.type === "enemy_camp" && tile.enemyPower > 0)) {
    if (state.tick % 5 === 0) {
      units.push({ attack: Math.round(5 * (1 + enemyAttackBuff)), hp: 18, id: `e-camp-${state.tick}-${camp.id}`, progress: lanePositionForTile(camp), side: "enemy" });
      logs = pushLog(logs, "敌营派出了迷雾小怪。");
    }
  }

  const playerUnits = units.filter((unit) => unit.side === "player");
  const enemyUnits = units.filter((unit) => unit.side === "enemy");
  const engaged = new Set<string>();
  for (const player of playerUnits) {
    const enemy = enemyUnits.find((target) => !engaged.has(target.id) && Math.abs(target.progress - player.progress) <= 6);
    if (enemy) {
      enemy.hp -= player.attack;
      player.hp -= enemy.attack;
      engaged.add(player.id);
      engaged.add(enemy.id);
      if (enemy.hp <= 0) logs = pushLog(logs, "我方小伙伴击败了迷雾小怪。");
      if (enemy.hp <= 0) stats.enemiesDefeated += 1;
      if (player.hp <= 0) logs = pushLog(logs, "一名小伙伴被迷雾小怪击退。");
    }
  }

  units = units
    .filter((unit) => unit.hp > 0)
    .map((unit) => {
      if (engaged.has(unit.id)) return unit;
      return { ...unit, progress: unit.side === "player" ? Math.min(100, unit.progress + 6) : Math.max(0, unit.progress - 5) };
    });

  for (const unit of units) {
    if (unit.side === "player") {
      const camp = tiles.find((tile) => tile.type === "enemy_camp" && tile.enemyPower > 0 && Math.abs(lanePositionForTile(tile) - unit.progress) <= 4);
      if (camp) {
        camp.enemyPower = Math.max(0, camp.enemyPower - Math.round(unit.attack * (1 + bossDamageBonus)));
        if (camp.enemyPower === 0) {
          camp.type = "plain";
          camp.ownedBy = "player";
          stats.campsDestroyed += 1;
          logs = pushLog(logs, "小伙伴清除了敌营，这片地块加入我方领地。");
        }
      }
      if (unit.progress >= 100) {
        const damage = Math.round(unit.attack * (1 + bossDamageBonus));
        baseHpEnemy = Math.max(0, baseHpEnemy - damage);
        unit.hp = 0;
        logs = pushLog(logs, `${chapter.bossName} 受到 ${damage} 点伤害。`);
      }
    } else if (unit.progress <= 0) {
      baseHpPlayer = Math.max(0, baseHpPlayer - unit.attack);
      unit.hp = 0;
      logs = pushLog(logs, `我方基地受到 ${unit.attack} 点伤害。`);
    }
  }

  units = units.filter((unit) => unit.hp > 0);
  const status: WarStatus = baseHpEnemy <= 0 ? "victory" : baseHpPlayer <= 0 ? "defeat" : "playing";
  if (status === "victory") logs = pushLog(logs, "胜利！你攻破了知识迷雾核心。");
  if (status === "defeat") logs = pushLog(logs, "我方基地失守，本次远征失败。");
  const scene: TerritoryScene = status === "playing" ? state.scene : "result";
  return { ...state, baseHpEnemy, baseHpPlayer, logs, resources, scene, stats, status, temporaryBuffs, tick: state.tick + 1, tiles, units };
}

export function TerritoryWarPage({ questions = [], user }: { questions?: QuizQuestion[]; user?: AuthUser | null }) {
  const [state, setState] = useState<TerritoryWarState>(() => loadTerritoryWarState());
  const [progress, setProgress] = useState<TerritoryWarProgress>(() => loadTerritoryWarProgress());
  const [activeSubjectTab, setActiveSubjectTab] = useState<Subject>("history");
  const [activeQuestionTileId, setActiveQuestionTileId] = useState<string | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<null | { correct: boolean; selectedIndex: number }>(null);

  const ownedExpeditionPartners = useMemo<ExpeditionPartner[]>(() => {
    const fallbackIds = ["cloud_beast", "fire_fox", "grass_dragon"];
    try {
      const save = loadPartnerChessSave();
      const owned = save.ownedPets?.length ? save.ownedPets : fallbackIds;
      return owned.map((petId) => {
        const pet = getTrainingPetDisplayById(petId, save);
        return {
          effect: partnerEffect(petId),
          id: petId,
          image: pet.image,
          name: pet.name
        };
      });
    } catch {
      return fallbackIds.map((petId) => {
        const pet = pets.find((item) => item.id === petId) ?? pets[0];
        return { effect: partnerEffect(petId), id: petId, image: pet.image, name: pet.name };
      });
    }
  }, []);
  const expeditionPartners = useMemo<ExpeditionPartner[]>(() => {
    const fallbackIds = ["cloud_beast", "fire_fox", "grass_dragon"];
    const ids = state.selectedPartnerIds.length ? state.selectedPartnerIds : fallbackIds;
    const selected = ids
      .map((petId) => ownedExpeditionPartners.find((partner) => partner.id === petId))
      .filter((partner): partner is ExpeditionPartner => Boolean(partner));
    return selected.length ? selected.slice(0, 3) : ownedExpeditionPartners.slice(0, 3);
  }, [ownedExpeditionPartners, state.selectedPartnerIds]);
  const currentChapter = getChapter(state.chapterId);
  const filteredChapters = territoryWarChapters.filter((chapter) => chapter.subject === activeSubjectTab);
  const territoryLv = territoryLevel(progress.territoryExp);
  const elapsedSeconds = Math.max(0, state.tick - state.stats.startTick);
  const currentStars = starsForResult(state);
  const currentAccuracy = resultAccuracy(state);

  const normalizedQuestions = useMemo(() => {
    const real = questions.map(normalizeQuestion).filter((item): item is TerritoryQuestion => Boolean(item));
    return real.length ? real : fallbackQuestions;
  }, [questions]);

  const availableChapters = useMemo(() => {
    return Array.from(new Set(normalizedQuestions
      .filter((question) => state.settings.subject === "all" || question.subject === state.settings.subject)
      .map((question) => question.chapter)))
      .filter(Boolean);
  }, [normalizedQuestions, state.settings.subject]);

  const questionPool = useMemo(() => {
    const filtered = normalizedQuestions.filter((question) => {
      if (state.settings.subject !== "all" && question.subject !== state.settings.subject) return false;
      if (state.settings.chapter !== "all" && question.chapter !== state.settings.chapter) return false;
      if (state.settings.difficulty !== "all" && question.difficulty !== state.settings.difficulty) return false;
      return true;
    });
    return filtered.length ? filtered : fallbackQuestions;
  }, [normalizedQuestions, state.settings]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if ((state.status === "victory" || state.status === "defeat") && !state.resultRecorded) {
      const next = applyTerritoryWarResult(progress, state);
      saveTerritoryWarProgress(next);
      setProgress(next);
      setState((current) => ({ ...current, resultRecorded: true, scene: "result" }));
    }
  }, [progress, state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setState((current) => applyTick(current, expeditionPartners));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expeditionPartners]);

  const selectedTile = state.tiles.find((tile) => tile.id === state.selectedTileId) ?? state.tiles[0];
  const canExploreSelected = !selectedTile.revealed && getAdjacentOwnedTile(state.tiles, selectedTile);
  const canOccupySelected = selectedTile.revealed && selectedTile.ownedBy === "neutral" && ["plain", "resource", "buff"].includes(selectedTile.type);
  const canBuildSelected = selectedTile.revealed && selectedTile.ownedBy === "player" && !selectedTile.building && selectedTile.type !== "base_player" && selectedTile.type !== "base_enemy";
  const canUpgradeSelected = selectedTile.building?.type === "partner_outpost" && selectedTile.building.level === 1;
  const playerUnits = state.units.filter((unit) => unit.side === "player").length;
  const enemyUnits = state.units.filter((unit) => unit.side === "enemy").length;
  const activeQuestionTile = activeQuestionTileId ? state.tiles.find((tile) => tile.id === activeQuestionTileId) : null;
  const activeQuestion = activeQuestionTile?.questionId ? questionPool.find((question) => question.id === activeQuestionTile.questionId) ?? normalizedQuestions.find((question) => question.id === activeQuestionTile.questionId) ?? fallbackQuestions[0] : null;
  const exploreDiscount = Math.min(exploreCost, Math.round(buffAmount(state, "explore_discount")));
  const currentExploreCost = Math.max(0, exploreCost - exploreDiscount);
  const admin = isAdminUser(user ?? null);

  function pickQuestion(current: TerritoryWarState) {
    const unused = questionPool.filter((question) => !current.usedQuestionIds.includes(question.id));
    const pool = unused.length ? unused : questionPool;
    const chosen = pool[Math.floor(Math.random() * pool.length)] ?? fallbackQuestions[0];
    return chosen;
  }

  function startExpedition() {
    setState((current) => {
      const chapter = getChapter(current.chapterId);
      const selectedPartnerIds = (current.selectedPartnerIds.length ? current.selectedPartnerIds : expeditionPartners.map((partner) => partner.id)).slice(0, 3);
      const partners = selectedPartnerIds
        .map((petId) => ownedExpeditionPartners.find((partner) => partner.id === petId))
        .filter((partner): partner is ExpeditionPartner => Boolean(partner));
      const baseShield = expeditionSkillAmount(partners, "base_shield");
      return {
        ...current,
        baseHpPlayer: Math.min(130, 110 + baseShield),
        logs: [
          `远征开始：${subjectLabels[chapter.subject]} · ${chapter.title}。${partners.map((partner) => getPartnerSkill(partner.id).name).join("、")} 已生效。`,
          ...current.logs
        ].slice(0, 10),
        resultRecorded: false,
        scene: "map",
        selectedPartnerIds,
        started: true,
        stats: { ...defaultStats(), startTick: current.tick },
        status: "playing",
        temporaryBuffs: current.temporaryBuffs
      };
    });
  }

  function openPrepare(chapter: TerritoryChapter) {
    if (!isChapterUnlocked(chapter, progress)) return;
    const fallbackIds = ownedExpeditionPartners.slice(0, 3).map((partner) => partner.id);
    setState((current) => ({
      ...createInitialState(chapter.id, current.selectedPartnerIds.length ? current.selectedPartnerIds : fallbackIds),
      scene: "prepare"
    }));
  }

  function togglePartner(petId: string) {
    setState((current) => {
      const exists = current.selectedPartnerIds.includes(petId);
      const selectedPartnerIds = exists
        ? current.selectedPartnerIds.filter((id) => id !== petId)
        : [...current.selectedPartnerIds, petId].slice(0, 3);
      return { ...current, selectedPartnerIds };
    });
  }

  function updateSettings(settings: Partial<ExpeditionSettings>) {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...settings,
        chapter: settings.subject && settings.subject !== current.settings.subject ? "all" : settings.chapter ?? current.settings.chapter
      }
    }));
  }

  function updateSelectedTile(updater: (tile: TerritoryTile) => TerritoryTile, log?: string) {
    setState((current) => ({
      ...current,
      logs: log ? pushLog(current.logs, log) : current.logs,
      tiles: current.tiles.map((tile) => tile.id === current.selectedTileId ? updater(tile) : tile)
    }));
  }

  function exploreTile() {
    if (!canExploreSelected || state.resources < currentExploreCost || state.status !== "playing" || !state.started) return;
    const nextType = chooseTileType();
    setState((current) => {
      let logs = current.logs;
      let resources = current.resources - currentExploreCost;
      let stats = { ...current.stats, exploredTiles: current.stats.exploredTiles + 1 };
      let usedQuestionIds = current.usedQuestionIds;
      const tiles: TerritoryTile[] = current.tiles.map((tile) => {
        if (tile.id !== current.selectedTileId) return tile;
        if (nextType === "treasure") {
          resources += 40;
          stats = { ...stats, coinsEarned: stats.coinsEarned + 40 };
          logs = pushLog(logs, "你探索了一片未知地块，发现知识宝箱，获得知识币 +40！");
          return { ...tile, enemyPower: 0, ownedBy: "player", revealed: true, type: "plain" };
        }
        if (nextType === "buff") {
          logs = pushLog(logs, "你发现灵感点，本局我方单位攻击提升。");
          return { ...tile, enemyPower: 0, ownedBy: "player", revealed: true, type: "buff" };
        }
        if (nextType === "enemy_camp") {
          logs = pushLog(logs, "你探索到迷雾敌营，小伙伴需要推进清除它。");
          return { ...tile, enemyPower: 45, ownedBy: "enemy", revealed: true, type: "enemy_camp" };
        }
        if (nextType === "question") {
          const question = pickQuestion(current);
          usedQuestionIds = [...current.usedQuestionIds, question.id];
          logs = pushLog(logs, "发现知识挑战格！答题可获得资源与临时增益。");
          return { ...tile, answeredCorrect: undefined, enemyPower: 0, ownedBy: "neutral", questionId: question.id, revealed: true, solved: false, type: "question" };
        }
        logs = pushLog(logs, `你探索了一片未知地块，发现${tileLabels[nextType]}。`);
        return { ...tile, enemyPower: 0, ownedBy: "neutral", revealed: true, resourceRate: nextType === "resource" ? 2 : 0, type: nextType };
      });
      return {
        ...current,
        buffAttack: nextType === "buff" ? current.buffAttack + 0.1 : current.buffAttack,
        logs,
        resources,
        stats,
        temporaryBuffs: currentExploreCost < exploreCost ? consumeExploreBuffs(current.temporaryBuffs) : current.temporaryBuffs,
        tiles,
        usedQuestionIds
      };
    });
  }

  function occupyTile() {
    if (!canOccupySelected || state.status !== "playing") return;
    updateSelectedTile((tile) => ({ ...tile, ownedBy: "player" }), `占领了${tileLabels[selectedTile.type]}。`);
  }

  function buildOutpost() {
    if (!canBuildSelected || state.resources < outpostCost || state.status !== "playing") return;
    setState((current) => ({
      ...current,
      logs: pushLog(current.logs, "建造了伙伴据点。"),
      resources: current.resources - outpostCost,
      tiles: current.tiles.map((tile) => tile.id === current.selectedTileId ? { ...tile, building: { level: 1, spawnTimer: 0, type: "partner_outpost" } } : tile)
    }));
  }

  function upgradeOutpost() {
    if (!canUpgradeSelected || state.resources < upgradeCost || state.status !== "playing") return;
    setState((current) => ({
      ...current,
      logs: pushLog(current.logs, "伙伴据点升级为 Lv.2，出兵速度提升。"),
      resources: current.resources - upgradeCost,
      tiles: current.tiles.map((tile) => tile.id === current.selectedTileId && tile.building ? { ...tile, building: { ...tile.building, level: 2 } } : tile)
    }));
  }

  function restart() {
    setState(createInitialState(state.chapterId, state.selectedPartnerIds));
    setActiveQuestionTileId(null);
    setSelectedOptionIndex(null);
    setAnswerResult(null);
  }

  function restartCurrentChapter() {
    setState({ ...createInitialState(state.chapterId, state.selectedPartnerIds), scene: "prepare" });
    setActiveQuestionTileId(null);
    setSelectedOptionIndex(null);
    setAnswerResult(null);
  }

  function returnToChapters() {
    setState({ ...createInitialState(state.chapterId, state.selectedPartnerIds), scene: "chapters" });
    setActiveQuestionTileId(null);
    setSelectedOptionIndex(null);
    setAnswerResult(null);
  }

  function goNextChapter() {
    const index = territoryWarChapters.findIndex((chapter) => chapter.id === state.chapterId);
    const next = territoryWarChapters[index + 1];
    if (next && isChapterUnlocked(next, progress)) {
      setActiveSubjectTab(next.subject);
      openPrepare(next);
    } else {
      returnToChapters();
    }
  }

  function openQuestion(tileId: string) {
    setActiveQuestionTileId(tileId);
    setSelectedOptionIndex(null);
    setAnswerResult(null);
  }

  function submitAnswer() {
    if (!activeQuestion || selectedOptionIndex === null || answerResult) return;
    const correct = answerMatches(activeQuestion, activeQuestion.options[selectedOptionIndex], selectedOptionIndex);
    setAnswerResult({ correct, selectedIndex: selectedOptionIndex });
  }

  function applyQuestionOutcome() {
    if (!activeQuestion || !activeQuestionTile || !answerResult) return;
    setState((current) => {
      let resources = current.resources + (answerResult.correct ? 60 : 15);
      let baseHpPlayer = current.baseHpPlayer;
      const rewardCoins = answerResult.correct ? 60 : 15;
      let temporaryBuffs = current.temporaryBuffs;
      let logs = current.logs;
      const subject = activeQuestion.subject;
      if (answerResult.correct) {
        if (subject === "history") {
          temporaryBuffs = [...temporaryBuffs, addTimedBuff(current, "unit_attack", 0.08, 20, "历史线索：单位攻击 +8%")];
          logs = pushLog(logs, "你答对了历史题，获得 60 知识币！历史线索清晰，伙伴攻击提升 20 秒。");
        } else if (subject === "politics") {
          baseHpPlayer = Math.min(125, baseHpPlayer + 15);
          logs = pushLog(logs, "你答对了政治题，获得 60 知识币！治理秩序稳定，基地获得护盾。");
        } else if (subject === "geography") {
          temporaryBuffs = [...temporaryBuffs, { amount: 20, id: `explore-${current.tick}`, label: "地形判断：下一次探索费用 -20", type: "explore_discount", uses: 1 }];
          logs = pushLog(logs, "你答对了地理题，获得 60 知识币！地形判断准确，下一次探索免费。");
        } else if (subject === "english") {
          temporaryBuffs = [...temporaryBuffs, addTimedBuff(current, "spawn_speed", 0.15, 20, "表达流畅：出兵速度 +15%")];
          logs = pushLog(logs, "你答对了英语题，获得 60 知识币！表达更流畅，伙伴行动加快。");
        } else if (subject === "math") {
          temporaryBuffs = [...temporaryBuffs, addTimedBuff(current, "resource_income", 0.1, 20, "精准计算：资源产出 +10%")];
          logs = pushLog(logs, "你答对了数学题，获得 60 知识币！计算更精准，资源产出提升。");
        } else {
          temporaryBuffs = [...temporaryBuffs, addTimedBuff(current, "unit_attack", 0.05, 15, "知识共鸣：单位攻击 +5%")];
          logs = pushLog(logs, `你答对了${subjectLabels[subject]}题，获得 60 知识币！知识共鸣提升伙伴攻击。`);
        }
      } else {
        temporaryBuffs = [...temporaryBuffs, addTimedBuff(current, "enemy_attack", 0.05, 15, "敌方趁势：敌方攻击 +5%")];
        logs = pushLog(logs, "答错了，但仍获得 15 知识币。敌方趁机加快了进攻，解析已显示，可稍后继续挑战。");
      }
      return {
        ...current,
        baseHpPlayer,
        logs,
        resources,
        stats: {
          ...current.stats,
          coinsEarned: current.stats.coinsEarned + rewardCoins,
          correctAnswers: current.stats.correctAnswers + (answerResult.correct ? 1 : 0),
          questionsAnswered: current.stats.questionsAnswered + 1
        },
        temporaryBuffs,
        tiles: current.tiles.map((tile) => tile.id === activeQuestionTile.id ? {
          ...tile,
          answeredCorrect: answerResult.correct,
          ownedBy: answerResult.correct ? "player" : tile.ownedBy,
          solved: answerResult.correct
        } : tile)
      };
    });
    setActiveQuestionTileId(null);
    setSelectedOptionIndex(null);
    setAnswerResult(null);
  }

  function debugAddResources() {
    setState((current) => ({ ...current, logs: pushLog(current.logs, "Debug：知识币 +500。"), resources: current.resources + 500 }));
  }

  function debugCreateQuestionTile() {
    setState((current) => {
      const target = current.tiles.find((tile) => !tile.revealed && getAdjacentOwnedTile(current.tiles, tile)) ?? current.tiles.find((tile) => tile.type === "plain" && tile.ownedBy !== "player");
      if (!target) return current;
      const question = pickQuestion(current);
      return {
        ...current,
        logs: pushLog(current.logs, "Debug：生成了一个知识挑战格。"),
        tiles: current.tiles.map((tile) => tile.id === target.id ? { ...tile, ownedBy: "neutral", questionId: question.id, revealed: true, solved: false, type: "question" } : tile),
        usedQuestionIds: [...current.usedQuestionIds, question.id]
      };
    });
  }

  function debugCorrectReward() {
    setState((current) => ({
      ...current,
      logs: pushLog(current.logs, "Debug：触发答对奖励。"),
      resources: current.resources + 60,
      temporaryBuffs: [...current.temporaryBuffs, addTimedBuff(current, "unit_attack", 0.08, 20, "Debug：单位攻击 +8%")]
    }));
  }

  function debugWrongPenalty() {
    setState((current) => ({
      ...current,
      logs: pushLog(current.logs, "Debug：触发答错惩罚。"),
      resources: current.resources + 15,
      temporaryBuffs: [...current.temporaryBuffs, addTimedBuff(current, "enemy_attack", 0.05, 15, "Debug：敌方攻击 +5%")]
    }));
  }

  if (state.scene === "chapters") {
    return (
      <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
        <PageHeader title="知识领地战" subtitle="带领伙伴攻破知识迷雾，占领学科领地。" />
        <GameCard className="bg-[linear-gradient(135deg,#FFF8EC_0%,#EAF5F2_100%)]">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Chapter Expedition</p>
              <h2 className="mt-1 text-2xl font-black text-ink">章节远征</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">选择学科章节，配置远征伙伴，挑战 Boss 据点。长期进度只保存在本地。</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 md:min-w-[420px]">
              <InfoPill icon={<Trophy className="size-4" />} label="远征等级" value={`Lv.${territoryLv}`} />
              <InfoPill icon={<Sparkles className="size-4" />} label="远征经验" value={String(progress.territoryExp)} />
              <InfoPill icon={<Flag className="size-4" />} label="胜场" value={`${progress.totalWins}/${progress.totalPlays}`} />
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {Array.from(new Set(territoryWarChapters.map((chapter) => chapter.subject))).map((subject) => (
              <button className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${activeSubjectTab === subject ? "bg-tide text-white" : "bg-white/76 text-ink"}`} key={subject} onClick={() => setActiveSubjectTab(subject)} type="button">
                {subjectLabels[subject]}
              </button>
            ))}
          </div>
        </GameCard>

        <div className="grid gap-4 lg:grid-cols-3">
          {filteredChapters.map((chapter) => {
            const unlocked = isChapterUnlocked(chapter, progress);
            const record = progress.completedChapters[chapter.id];
            const index = getChapterIndex(chapter) + 1;
            return (
              <GameCard className={`relative overflow-hidden ${unlocked ? "bg-white/72" : "bg-slate-100/80"}`} key={chapter.id}>
                <div className="absolute right-4 top-4 rounded-full bg-ink/5 px-3 py-1 text-xs font-black text-ink/46">第 {index} 章</div>
                <div className={`grid size-12 place-items-center rounded-2xl ${unlocked ? "bg-tide/10 text-tide" : "bg-slate-200 text-slate-500"}`}>
                  {unlocked ? <Crown className="size-6" /> : <Lock className="size-6" />}
                </div>
                <h3 className="mt-4 text-xl font-black text-ink">{chapter.title}</h3>
                <p className="mt-2 min-h-10 text-sm font-semibold leading-5 text-ink/58">{chapter.subtitle}</p>
                <div className="mt-4 grid gap-2 text-xs font-black text-ink/58">
                  <span className="rounded-full bg-white/76 px-3 py-2">Boss：{chapter.bossName} · HP {chapter.bossHp}</span>
                  <span className="rounded-full bg-white/76 px-3 py-2">推荐战力：{chapter.recommendedPower} · {chapter.difficulty}</span>
                  <span className="rounded-full bg-gold/12 px-3 py-2 text-gold">奖励预览：远征经验 +30 · 星级记录</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="text-xs font-black text-ink/52">
                    {record ? (
                      <div>
                        <p className="text-tide">已通关 · {record.bestStars} 星</p>
                        <p>最快 {record.bestTime}s · 正确率 {record.bestAccuracy}%</p>
                      </div>
                    ) : unlocked ? "未通关" : `需通关 ${getChapter(chapter.unlockRequirement ?? "").title}`}
                  </div>
                  <button className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-tide px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-ink disabled:bg-ink/10 disabled:text-ink/36" disabled={!unlocked} onClick={() => openPrepare(chapter)} type="button">
                    {record ? "再次远征" : "进入准备"} <ChevronRight className="size-4" />
                  </button>
                </div>
              </GameCard>
            );
          })}
        </div>
      </div>
    );
  }

  if (state.scene === "prepare") {
    return (
      <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
        <PageHeader title="远征准备" subtitle={`${subjectLabels[currentChapter.subject]} · ${currentChapter.title}`} />
        <GameCard className="bg-white/72">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Preparation</p>
              <h2 className="mt-1 text-2xl font-black text-ink">{currentChapter.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">{currentChapter.subtitle}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <InfoPill icon={<Crown className="size-4" />} label="Boss" value={currentChapter.bossName} />
                <InfoPill icon={<Shield className="size-4" />} label="Boss HP" value={String(currentChapter.bossHp)} />
                <InfoPill icon={<Zap className="size-4" />} label="推荐战力" value={String(currentChapter.recommendedPower)} />
              </div>
            </div>
            <div className="rounded-[1.4rem] bg-tide/8 p-4">
              <p className="text-sm font-black text-ink">本局题目范围</p>
              <div className="mt-3 grid gap-3">
                <label className="text-xs font-black text-ink/58">章节
                  <select className="mt-1 min-h-10 w-full rounded-2xl border border-white/80 bg-white px-3 text-sm font-bold text-ink" onChange={(event) => updateSettings({ chapter: event.target.value })} value={state.settings.chapter}>
                    <option value="all">全部章节</option>
                    {availableChapters.map((chapter) => <option key={chapter} value={chapter}>{chapter}</option>)}
                  </select>
                </label>
                <label className="text-xs font-black text-ink/58">难度
                  <select className="mt-1 min-h-10 w-full rounded-2xl border border-white/80 bg-white px-3 text-sm font-bold text-ink" onChange={(event) => updateSettings({ difficulty: event.target.value as ExpeditionSettings["difficulty"] })} value={state.settings.difficulty}>
                    <option value="all">全部难度</option>
                    <option value="easy">easy</option>
                    <option value="medium">medium</option>
                    <option value="hard">hard</option>
                  </select>
                </label>
                <span className="rounded-full bg-white/76 px-3 py-2 text-xs font-black text-tide">当前题池 {questionPool.length} 题</span>
              </div>
            </div>
          </div>
        </GameCard>

        <GameCard className="bg-white/72">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-ink">选择出战伙伴</h3>
              <p className="mt-1 text-sm font-semibold text-ink/54">最多选择 3 只，只影响本局领地战，不修改正式宠物背包。</p>
            </div>
            <span className="rounded-full bg-tide/10 px-3 py-1 text-sm font-black text-tide">{state.selectedPartnerIds.length || expeditionPartners.length}/3</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {ownedExpeditionPartners.map((partner) => {
              const selected = state.selectedPartnerIds.includes(partner.id) || (!state.selectedPartnerIds.length && expeditionPartners.some((item) => item.id === partner.id));
              const skill = getPartnerSkill(partner.id);
              return (
                <button className={`rounded-[1.4rem] border p-3 text-left transition hover:-translate-y-0.5 ${selected ? "border-tide bg-tide/10" : "border-white/70 bg-white/70"}`} key={partner.id} onClick={() => togglePartner(partner.id)} type="button">
                  <div className="flex items-center gap-3">
                    <div className="grid size-14 place-items-center rounded-2xl bg-white/82">
                      <img alt={partner.name} className={`max-h-12 max-w-12 object-contain [image-rendering:pixelated] ${petSpriteFacingClass(partner.id, "right")}`} src={partner.image} />
                    </div>
                    <div>
                      <p className="font-black text-ink">{partner.name}</p>
                      <p className="text-xs font-black text-tide">{skill.name}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-bold leading-5 text-ink/56">{skill.description}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap justify-between gap-2">
            <button className="min-h-11 rounded-2xl bg-white/80 px-5 text-sm font-black text-ink ring-1 ring-white/80" onClick={returnToChapters} type="button">返回章节选择</button>
            <button className="min-h-11 rounded-2xl bg-tide px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(21,156,168,0.14)] disabled:bg-ink/10 disabled:text-ink/36" disabled={(state.selectedPartnerIds.length || expeditionPartners.length) === 0} onClick={startExpedition} type="button">开始远征</button>
          </div>
        </GameCard>
      </div>
    );
  }

  if (state.scene === "result") {
    const next = territoryWarChapters[territoryWarChapters.findIndex((chapter) => chapter.id === state.chapterId) + 1];
    const nextAvailable = next && isChapterUnlocked(next, progress);
    return (
      <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
        <PageHeader title="远征结算" subtitle={`${currentChapter.title} · ${state.status === "victory" ? "胜利" : "失败"}`} />
        <GameCard className="bg-[linear-gradient(135deg,#FFF8EC_0%,#EAF5F2_100%)] text-center">
          <div className={`mx-auto grid size-16 place-items-center rounded-[1.4rem] ${state.status === "victory" ? "bg-gold/18 text-gold" : "bg-coral/12 text-coral"}`}>
            {state.status === "victory" ? <Trophy className="size-8" /> : <Shield className="size-8" />}
          </div>
          <h2 className="mt-4 text-3xl font-black text-ink">{state.status === "victory" ? "远征胜利！" : "远征失败"}</h2>
          <p className="mt-2 text-sm font-semibold text-ink/58">正式奖励系统将在后续开放，本次仅记录远征进度。</p>
          <div className="mt-4 flex justify-center gap-1">
            {[1, 2, 3].map((star) => <Star className={`size-8 ${star <= currentStars ? "fill-gold text-gold" : "text-ink/16"}`} key={star} />)}
          </div>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            <InfoPill icon={<Clock className="size-4" />} label="用时" value={`${elapsedSeconds}s`} />
            <InfoPill icon={<HelpCircle className="size-4" />} label="答题" value={`${state.stats.correctAnswers}/${state.stats.questionsAnswered}`} />
            <InfoPill icon={<BookOpen className="size-4" />} label="正确率" value={`${currentAccuracy}%`} />
            <InfoPill icon={<Swords className="size-4" />} label="击败敌人" value={String(state.stats.enemiesDefeated)} />
            <InfoPill icon={<Search className="size-4" />} label="探索格" value={String(state.stats.exploredTiles)} />
            <InfoPill icon={<Tent className="size-4" />} label="摧毁敌营" value={String(state.stats.campsDestroyed)} />
            <InfoPill icon={<Coins className="size-4" />} label="获得知识币" value={String(state.stats.coinsEarned)} />
            <InfoPill icon={<Sparkles className="size-4" />} label="远征经验" value={`+${resultExp(state)}`} />
          </div>
          <div className="mt-5 rounded-[1.4rem] bg-white/76 p-4 text-left text-sm font-bold leading-6 text-ink/64">
            <p className="font-black text-ink">奖励预览</p>
            <p>远征经验 {state.status === "victory" ? "+30" : "+10"}，答对题目每题 +2；胜利章节会记录最佳星级、最快时间与最高正确率。</p>
            <p className="mt-1 text-gold">宠物碎片、捕捉球等正式奖励暂未真实发放。</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button className="min-h-11 rounded-2xl bg-white/82 px-5 text-sm font-black text-ink ring-1 ring-white/80" onClick={restartCurrentChapter} type="button">再来一次</button>
            <button className="min-h-11 rounded-2xl bg-ink px-5 text-sm font-black text-white" onClick={returnToChapters} type="button">返回章节选择</button>
            <button className="min-h-11 rounded-2xl bg-tide px-5 text-sm font-black text-white disabled:bg-ink/10 disabled:text-ink/36" disabled={!nextAvailable} onClick={goNextChapter} type="button">下一章节</button>
          </div>
        </GameCard>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-6">
      <PageHeader title="知识领地战" subtitle="翻开知识迷雾，建立伙伴据点，派出小伙伴攻占学习领地。" />

      <GameCard className="bg-white/72">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Chapter Boss</p>
            <h2 className="mt-1 text-2xl font-black text-ink">{currentChapter.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">{currentChapter.subtitle} · Boss 据点每隔一段时间会触发迷雾事件。</p>
          </div>
          <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/82 px-4 text-sm font-black text-ink ring-1 ring-white/80 transition hover:-translate-y-0.5" onClick={returnToChapters} type="button">
            <BookOpen className="size-4" />
            返回章节
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <InfoPill icon={<Crown className="size-4" />} label="Boss" value={currentChapter.bossName} />
          <InfoPill icon={<Shield className="size-4" />} label="Boss HP" value={`${state.baseHpEnemy}/${currentChapter.bossHp}`} />
          <InfoPill icon={<Clock className="size-4" />} label="用时" value={`${elapsedSeconds}s`} />
          <InfoPill icon={<HelpCircle className="size-4" />} label="题池" value={`${questionPool.length} 题`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-tide/10 px-3 py-1 text-tide">本局题池 {questionPool.length} 题</span>
          {normalizedQuestions === fallbackQuestions && <span className="rounded-full bg-gold/15 px-3 py-1 text-gold">当前学科暂无题目，已使用测试题目</span>}
          {expeditionPartners.map((partner) => <span className="rounded-full bg-white/76 px-3 py-1 text-ink/58" key={partner.id}>{partner.name}：{getPartnerSkill(partner.id).name}</span>)}
          <span className="rounded-full bg-ink/5 px-3 py-1 text-ink/52">题目格不会影响正式闯关记录</span>
        </div>
      </GameCard>

      <GameCard className="bg-[linear-gradient(135deg,#FFF8EC_0%,#EAF5F2_100%)]">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Territory War MVP</p>
            <h2 className="mt-1 text-2xl font-black text-ink">知识迷雾核心战</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">消耗知识币探索六边形地块，占领资源点，建立伙伴据点，让小伙伴自动推进。</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <InfoPill icon={<Coins className="size-4" />} label="知识币" value={String(Math.floor(state.resources))} />
            <InfoPill icon={<Shield className="size-4" />} label="我方基地" value={`${state.baseHpPlayer}/125`} />
            <InfoPill icon={<Flag className="size-4" />} label="局势" value={state.status === "playing" ? "进行中" : state.status === "victory" ? "胜利" : "失败"} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-ink px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-tide" onClick={restartCurrentChapter} type="button">
            <RefreshCw className="size-4" />
            重新开始
          </button>
          {activeBuffs(state, "unit_attack").length + activeBuffs(state, "resource_income").length + activeBuffs(state, "spawn_speed").length + activeBuffs(state, "explore_discount").length + activeBuffs(state, "enemy_attack").length > 0 && (
            <div className="flex flex-wrap gap-2">
              {state.temporaryBuffs.filter((buff) => (!buff.expiresAtTick || buff.expiresAtTick > state.tick) && (buff.uses ?? 1) > 0).map((buff) => (
                <span className="rounded-full bg-white/76 px-3 py-2 text-xs font-black text-ink/58 ring-1 ring-white/80" key={buff.id}>{buff.label}</span>
              ))}
            </div>
          )}
        </div>
      </GameCard>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <GameCard className="overflow-hidden bg-white/70">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Hex Map</p>
              <h3 className="text-xl font-black text-ink">六边形知识地图</h3>
            </div>
            <div className="flex gap-2 text-xs font-black text-ink/52">
              <span className="rounded-full bg-tide/10 px-3 py-1 text-tide">我方 {playerUnits}</span>
              <span className="rounded-full bg-coral/10 px-3 py-1 text-coral">敌方 {enemyUnits}</span>
            </div>
          </div>

          <PhaserTerritoryWarCanvas
            onTileClick={(tile) => {
              setState((current) => ({
                ...current,
                logs: pushLog(current.logs, `Phaser 测试：点击了坐标 ${tile.row}-${tile.col}（${tile.label}）。`)
              }));
            }}
          />

          <div className="overflow-x-auto pb-3">
            <div className="mx-auto grid min-w-[520px] max-w-[680px] grid-cols-6 gap-x-1 gap-y-3 px-2 py-2">
              {state.tiles.map((tile) => {
                const selected = tile.id === selectedTile.id;
                const canExplore = !tile.revealed && getAdjacentOwnedTile(state.tiles, tile);
                const Icon = tile.revealed ? tileIcons[tile.type] : Search;
                return (
                  <button
                    className={`relative grid h-[78px] place-items-center border text-center transition ${getTileClass(tile, selected, canExplore)} ${selected ? "ring-4 ring-tide/20" : ""}`}
                    key={tile.id}
                    onClick={() => setState((current) => ({ ...current, selectedTileId: tile.id }))}
                    style={{
                      clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0 50%)",
                      marginLeft: tile.row % 2 ? "2.05rem" : "0"
                    }}
                    type="button"
                  >
                    <Icon className="size-5" />
                    <span className="mt-1 block text-[10px] font-black">{tile.revealed ? tileLabels[tile.type] : canExplore ? "可探索" : "迷雾"}</span>
                    {tile.ownedBy === "player" && <span className="absolute right-4 top-2 size-2 rounded-full bg-tide" />}
                    {tile.building && <span className="absolute bottom-2 rounded-full bg-ink px-2 py-0.5 text-[9px] font-black text-white">据点 Lv.{tile.building.level}</span>}
                    {tile.type === "enemy_camp" && tile.enemyPower > 0 && <span className="absolute bottom-2 rounded-full bg-coral px-2 py-0.5 text-[9px] font-black text-white">{tile.enemyPower}</span>}
                    {tile.type === "question" && tile.solved && <span className="absolute bottom-2 rounded-full bg-tide px-2 py-0.5 text-[9px] font-black text-white">已解决</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 rounded-[1.4rem] bg-ink/5 p-4">
            <div className="mb-2 flex justify-between text-xs font-black text-ink/52">
              <span>我方推进</span>
              <span>迷雾核心</span>
            </div>
            <div className="relative h-12 rounded-full bg-white/72 ring-1 ring-white/80">
              <div className="absolute left-3 right-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-tide via-gold to-coral" />
              {state.units.map((unit) => (
                <span
                  className={`absolute top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[10px] font-black text-white shadow-[0_8px_18px_rgba(16,36,63,0.16)] ${unit.side === "player" ? "bg-tide" : "bg-coral"}`}
                  key={unit.id}
                  style={{ left: `${unit.progress}%` }}
                >
                  {unit.side === "player" ? "伴" : "雾"}
                </span>
              ))}
            </div>
          </div>
        </GameCard>

        <div className="space-y-4">
          <GameCard className="bg-white/72">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Selected Tile</p>
            <h3 className="mt-1 text-xl font-black text-ink">{selectedTile.revealed ? tileLabels[selectedTile.type] : "知识迷雾"}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/58">
              坐标 {selectedTile.row + 1}-{selectedTile.col + 1} · {selectedTile.revealed ? `归属：${selectedTile.ownedBy === "player" ? "我方" : selectedTile.ownedBy === "enemy" ? "敌方" : "中立"}` : "尚未探索"}
            </p>
            {selectedTile.type === "enemy_camp" && selectedTile.enemyPower > 0 && <p className="mt-2 rounded-2xl bg-coral/10 px-3 py-2 text-sm font-black text-coral">敌营强度：{selectedTile.enemyPower}</p>}
            {selectedTile.type === "question" && (
              <div className="mt-3 rounded-2xl bg-indigo-50 px-3 py-3 text-sm font-bold text-indigo-800">
                {selectedTile.solved ? "这道知识挑战已解决，地块已归入我方。" : "完成知识挑战可获得知识币和学科增益。"}
              </div>
            )}
            <div className="mt-4 grid gap-2">
              <ActionButton disabled={!canExploreSelected || state.resources < currentExploreCost || state.status !== "playing" || !state.started} icon={<Search className="size-4" />} onClick={exploreTile}>探索 · {currentExploreCost}</ActionButton>
              <ActionButton disabled={selectedTile.type !== "question" || Boolean(selectedTile.solved) || !selectedTile.questionId || state.status !== "playing" || !state.started} icon={<HelpCircle className="size-4" />} onClick={() => openQuestion(selectedTile.id)}>开始答题</ActionButton>
              <ActionButton disabled={!canOccupySelected || state.status !== "playing"} icon={<Flag className="size-4" />} onClick={occupyTile}>占领地块</ActionButton>
              <ActionButton disabled={!canBuildSelected || state.resources < outpostCost || state.status !== "playing"} icon={<Tent className="size-4" />} onClick={buildOutpost}>建造伙伴据点 · {outpostCost}</ActionButton>
              <ActionButton disabled={!canUpgradeSelected || state.resources < upgradeCost || state.status !== "playing"} icon={<Zap className="size-4" />} onClick={upgradeOutpost}>升级据点 · {upgradeCost}</ActionButton>
            </div>
          </GameCard>

          <GameCard className="bg-white/72">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Expedition Partners</p>
            <h3 className="mt-1 text-xl font-black text-ink">当前远征伙伴</h3>
            <div className="mt-3 grid gap-2">
              {expeditionPartners.map((partner) => (
                <div className="flex items-center gap-3 rounded-2xl bg-ink/5 p-2" key={partner.id}>
                  <div className="grid size-12 place-items-center rounded-2xl bg-white/80">
                    <img alt={partner.name} className={`max-h-10 max-w-10 object-contain [image-rendering:pixelated] ${petSpriteFacingClass(partner.id, "right")}`} src={partner.image} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-ink">{partner.name}</p>
                    <p className="text-xs font-bold text-ink/50">{partner.effect}</p>
                  </div>
                </div>
              ))}
            </div>
          </GameCard>

          <GameCard className="bg-white/72">
            <div className="flex items-center gap-2">
              <Swords className="size-5 text-coral" />
              <h3 className="text-xl font-black text-ink">战斗日志</h3>
            </div>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {state.logs.map((log, index) => (
                <p className={`rounded-2xl px-3 py-2 text-sm font-bold leading-5 ${index === 0 ? "bg-tide/10 text-ink" : "bg-ink/5 text-ink/58"}`} key={`${log}-${index}`}>{log}</p>
              ))}
            </div>
          </GameCard>

          {admin && (
            <GameCard className="border border-dashed border-tide/30 bg-tide/8">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Debug</p>
              <h3 className="mt-1 text-xl font-black text-ink">知识领地战测试</h3>
              <div className="mt-3 grid gap-2">
                <ActionButton icon={<Coins className="size-4" />} onClick={debugAddResources}>知识币 +500</ActionButton>
                <ActionButton icon={<HelpCircle className="size-4" />} onClick={debugCreateQuestionTile}>生成题目格</ActionButton>
                <ActionButton icon={<Sparkles className="size-4" />} onClick={debugCorrectReward}>触发答对奖励</ActionButton>
                <ActionButton icon={<Zap className="size-4" />} onClick={debugWrongPenalty}>触发答错惩罚</ActionButton>
                <ActionButton icon={<RefreshCw className="size-4" />} onClick={restart}>清空本局存档</ActionButton>
              </div>
              <div className="mt-3 space-y-1 text-xs font-bold text-ink/52">
                {state.temporaryBuffs.length ? state.temporaryBuffs.map((buff) => <p key={buff.id}>{buff.label} · {buff.expiresAtTick ? `剩余 ${Math.max(0, buff.expiresAtTick - state.tick)} 秒` : `次数 ${buff.uses ?? 1}`}</p>) : <p>暂无 temporaryBuffs。</p>}
              </div>
            </GameCard>
          )}
        </div>
      </div>

      {activeQuestion && activeQuestionTile && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/35 px-3 py-5 backdrop-blur-[4px]">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(226,247,244,0.92))] p-4 shadow-[0_28px_80px_rgba(16,36,63,0.22)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-tide">Knowledge Challenge</p>
                <h3 className="mt-1 text-2xl font-black text-ink">知识挑战</h3>
                <p className="mt-2 text-sm font-bold text-ink/54">{subjectLabels[activeQuestion.subject]} · {activeQuestion.chapter} · {activeQuestion.difficulty}</p>
              </div>
              <button className="rounded-2xl bg-ink/6 px-4 py-2 text-sm font-black text-ink/58 hover:bg-ink/10" onClick={() => setActiveQuestionTileId(null)} type="button">返回地图</button>
            </div>

            <p className="mt-5 rounded-[1.4rem] bg-white/76 p-4 text-base font-black leading-7 text-ink shadow-[0_10px_22px_rgba(16,36,63,0.06)]">{activeQuestion.question}</p>
            <div className="mt-4 grid gap-2">
              {activeQuestion.options.map((option, index) => {
                const selected = selectedOptionIndex === index;
                const correct = answerResult && answerMatches(activeQuestion, option, index);
                const wrong = answerResult && answerResult.selectedIndex === index && !answerResult.correct;
                return (
                  <button
                    className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                      correct
                        ? "border-leaf/40 bg-leaf/12 text-leaf"
                        : wrong
                          ? "border-coral/40 bg-coral/10 text-coral"
                          : selected
                            ? "border-tide/40 bg-tide/10 text-ink"
                            : "border-white/80 bg-white/76 text-ink/70 hover:-translate-y-0.5 hover:border-tide/30"
                    }`}
                    disabled={Boolean(answerResult)}
                    key={`${activeQuestion.id}-${option}-${index}`}
                    onClick={() => setSelectedOptionIndex(index)}
                    type="button"
                  >
                    <span className="mr-2 font-black">{String.fromCharCode(65 + index)}.</span>{option}
                  </button>
                );
              })}
            </div>

            {answerResult && (
              <div className={`mt-4 rounded-[1.4rem] p-4 ${answerResult.correct ? "bg-leaf/10 text-leaf" : "bg-coral/10 text-coral"}`}>
                <p className="text-lg font-black">{answerResult.correct ? "回答正确！" : "回答错误"}</p>
                <p className="mt-2 text-sm font-bold text-ink/68">正确答案：{correctAnswerText(activeQuestion)}</p>
                <p className="mt-2 rounded-2xl bg-white/76 p-3 text-sm font-semibold leading-6 text-ink/64">解析：{activeQuestion.explanation}</p>
                <p className="mt-2 text-sm font-black">{answerResult.correct ? "奖励：知识币 +60，并触发学科增益。" : "奖励：知识币 +15；敌方短暂增强。题目格可稍后再次挑战。"}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {!answerResult ? (
                <button className="min-h-11 rounded-2xl bg-tide px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(21,156,168,0.14)] disabled:bg-ink/10 disabled:text-ink/36" disabled={selectedOptionIndex === null} onClick={submitAnswer} type="button">提交答案</button>
              ) : (
                <button className="min-h-11 rounded-2xl bg-ink px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(16,36,63,0.14)]" onClick={applyQuestionOutcome} type="button">{answerResult.correct ? "领取奖励" : "返回地图"}</button>
              )}
            </div>
          </div>
        </div>
      )}

      <GameCard className="bg-white/60">
        <p className="text-sm font-semibold leading-6 text-ink/58">本局目标：探索相邻迷雾，建造伙伴据点，让小伙伴自动推进并攻破右上角的知识迷雾核心。后续可扩展题目格、章节远征、远征奖励、宠物专属技能和 Boss 据点。</p>
      </GameCard>
    </div>
  );
}

function partnerEffect(petId: string) {
  const effects: Record<string, string> = {
    cloud_beast: "我方基地护盾 +10",
    fire_fox: "我方单位攻击 +10%",
    "focus-crow-01": "对敌营伤害预留 +10%",
    "focus-octopus-01": "据点生成速度 +5%",
    "focus-rabbit-01": "每 10 秒恢复基地 3 HP",
    grass_dragon: "我方单位 HP +10%"
  };
  return effects[petId] ?? "远征加成预留";
}

function InfoPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/76 p-3 ring-1 ring-white/80">
      <div className="flex items-center gap-2 text-xs font-black text-ink/46">{icon}{label}</div>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}

function ActionButton({ children, disabled, icon, onClick }: { children: ReactNode; disabled?: boolean; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-tide px-4 text-sm font-black text-white shadow-[0_12px_24px_rgba(21,156,168,0.14)] transition hover:-translate-y-0.5 hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/10 disabled:text-ink/36 disabled:shadow-none"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </button>
  );
}
