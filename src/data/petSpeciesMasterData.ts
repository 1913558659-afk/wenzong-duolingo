import type { BattleSkillType, BattleStats, EnemyType, PetAttribute } from "@/data/petBattleData";
import type { BattleStatusType } from "@/data/petTrainingStatuses";

export type PetSpeciesElement = "focus" | "action" | "growth" | "careless" | "forget" | "anxiety";
export type PetSpeciesRarity = "normal" | "rare" | "elite" | "boss";

export type PetSpeciesSkillDefinition = {
  attribute: PetAttribute;
  baseSkillId: string;
  counterEnemyType?: EnemyType;
  cooldown: number;
  displayDescription: string;
  displayName: string;
  id: string;
  power: number;
  status?: {
    target: "enemy" | "pet";
    type: BattleStatusType;
  };
  type: BattleSkillType;
  unlockLevel: number;
};

export type PetEvolutionPlan = {
  evolveLevel?: number;
  evolvesTo?: string;
  lineId: string;
  nextStageName?: string;
  stage: 1 | 2 | 3;
  stageNames: [string, string, string];
};

export type PetEvolutionStage = {
  canEvolve: boolean;
  evolveLevel?: number;
  image: string;
  name: string;
  speciesId: string;
  stage: 1 | 2 | 3;
};

export type PetEvolutionLine = {
  lineId: string;
  stages: [PetEvolutionStage, PetEvolutionStage, PetEvolutionStage];
};

export type PetSpeciesMasterData = {
  baseStats: BattleStats;
  damageFormula: typeof petDamageFormulaConfig;
  element: PetSpeciesElement;
  evolution: PetEvolutionPlan;
  growthRate: BattleStats;
  id: string;
  image: string;
  learnset: Array<{
    level: number;
    skillId: string;
  }>;
  level100Stats: BattleStats;
  levelCap: 100;
  name: string;
  rarity: PetSpeciesRarity;
  role: string[];
  speciesId: string;
  evolutionLine: PetEvolutionLine;
  skillTemplate: PetSpeciesSkillDefinition[];
};

type SkillSeed = {
  baseSkillId: string;
  cooldown?: number;
  description: string;
  name: string;
  power?: number;
  status?: PetSpeciesSkillDefinition["status"];
  type?: BattleSkillType;
};

type SpeciesSeed = {
  baseStats: BattleStats;
  element: PetSpeciesElement;
  id: string;
  image: string;
  level100Stats: BattleStats;
  name: string;
  rarity?: PetSpeciesRarity;
  role: string[];
  skills: [SkillSeed, SkillSeed, SkillSeed, SkillSeed];
  speciesId: string;
  stageImages: [string, string, string];
  stageNames: [string, string, string];
};

export const petSpeciesLevelCap = 100;

export const petSpeciesSkillLevels = [1, 1, 5, 10, 16, 22, 30, 40, 52, 65, 80, 95] as const;

export const petDamageFormulaConfig = {
  base: "skillPower * attack / (defense + 20)",
  levelModifier: "1 + level * 0.012",
  minimumDamage: 1,
  randomRange: [0.92, 1.08],
  typeModifier: [0.85, 1, 1.25, 1.35]
} as const;

const elementAttributeMap: Record<PetSpeciesElement, PetAttribute> = {
  anxiety: "focus",
  careless: "action",
  focus: "focus",
  forget: "growth",
  growth: "growth",
  action: "action"
};

const elementEnemyCounterMap: Partial<Record<PetSpeciesElement, EnemyType>> = {
  action: "careless",
  focus: "anxiety",
  growth: "forget"
};

const speciesSeeds: SpeciesSeed[] = [
  {
    baseStats: { attack: 10, defense: 10, hp: 48, speed: 8 },
    element: "focus",
    id: "cloud_beast",
    image: "/pet-battle/pets/cloud-beast.png",
    level100Stats: { attack: 109, defense: 129, hp: 444, speed: 87 },
    name: "云团兽",
    role: ["defense", "heal"],
    skills: [
      { baseSkillId: "cloud_bump", description: "专注型基础攻击。", name: "云雾冲撞", power: 8, type: "attack" },
      { baseSkillId: "wind_shield", description: "获得护盾，吸收下一轮伤害。", name: "轻风护盾", power: 0, status: { target: "pet", type: "shield" }, type: "shield" },
      { baseSkillId: "focus_star", cooldown: 1, description: "专注光点，对焦虑型敌人更有效。", name: "专注光点", power: 12, type: "power_attack" },
      { baseSkillId: "star_heal", cooldown: 3, description: "恢复自身生命。", name: "星点治愈", power: 0, type: "heal" }
    ],
    speciesId: "cloud-beast",
    stageImages: ["/pet-battle/pets/cloud-beast.png", "/pet-battle/evolutions/cloud-gale-beast-stage2.png", "/pet-battle/evolutions/nebula-guardian-beast-stage3.png"],
    stageNames: ["云团兽", "云岚兽", "星云守护兽"]
  },
  {
    baseStats: { attack: 14, defense: 7, hp: 40, speed: 12 },
    element: "action",
    id: "fire_fox",
    image: "/pet-battle/pets/starfire-fox.png",
    level100Stats: { attack: 167, defense: 86, hp: 377, speed: 156 },
    name: "星火狐",
    role: ["attack", "speed"],
    skills: [
      { baseSkillId: "fire_tail", description: "行动型基础攻击。", name: "星火扑击", power: 9, type: "attack" },
      { baseSkillId: "flash_claw", cooldown: 1, description: "快速连击，造成稳定伤害。", name: "火星连击", power: 12, type: "attack" },
      { baseSkillId: "flame_dash", cooldown: 2, description: "造成伤害并附加灼烧。", name: "灼热印记", power: 6, status: { target: "enemy", type: "burn" }, type: "attack" },
      { baseSkillId: "heat_boost", cooldown: 3, description: "提升下一次伤害。", name: "疾行动能", power: 0, type: "buff" }
    ],
    speciesId: "starfire-fox",
    stageImages: ["/pet-battle/pets/starfire-fox.png", "/pet-battle/evolutions/flame-star-fox-stage2.png", "/pet-battle/evolutions/starflame-spirit-fox-stage3.png"],
    stageNames: ["星火狐", "炎星狐", "星焰灵狐"]
  },
  {
    baseStats: { attack: 9, defense: 13, hp: 54, speed: 6 },
    element: "growth",
    id: "grass_dragon",
    image: "/pet-battle/pets/sprout-dragon.png",
    level100Stats: { attack: 103, defense: 166, hp: 509, speed: 80 },
    name: "草芽龙",
    role: ["defense", "growth"],
    skills: [
      { baseSkillId: "vine_bump", description: "积累型基础攻击。", name: "草芽撞击", power: 7, type: "attack" },
      { baseSkillId: "growth_charge", cooldown: 2, description: "获得护盾，保护当前伙伴。", name: "藤叶守护", power: 0, status: { target: "pet", type: "shield" }, type: "shield" },
      { baseSkillId: "root_bind", cooldown: 1, description: "生长缠绕，对遗忘型敌人更有效。", name: "生长缠绕", power: 11, type: "attack" },
      { baseSkillId: "memory_roots", cooldown: 3, description: "恢复自身生命。", name: "根系恢复", power: 0, type: "heal" }
    ],
    speciesId: "sprout-dragon",
    stageImages: ["/pet-battle/pets/sprout-dragon.png", "/pet-battle/evolutions/vine-sprout-dragon-stage2.png", "/pet-battle/evolutions/forest-crown-dragon-stage3.png"],
    stageNames: ["草芽龙", "藤芽龙", "森冠龙"]
  },
  {
    baseStats: { attack: 7, defense: 5, hp: 36, speed: 5 },
    element: "careless",
    id: "careless_beast",
    image: "/pet-battle/enemies/careless-beast.png",
    level100Stats: { attack: 111, defense: 79, hp: 353, speed: 94 },
    name: "粗心兽",
    role: ["interfere"],
    skills: carelessSkillSeeds("粗心兽"),
    speciesId: "careless-beast",
    stageImages: ["/pet-battle/enemies/careless-beast.png", "/pet-battle/evolutions/chaos-careless-beast-stage2.png", "/pet-battle/evolutions/wrong-question-rage-beast-stage3.png"],
    stageNames: ["粗心兽", "粗乱兽", "错题暴兽"]
  },
  {
    baseStats: { attack: 7, defense: 5, hp: 36, speed: 6 },
    element: "forget",
    id: "forget_shadow",
    image: "/pet-battle/enemies/forget-wraith.png",
    level100Stats: { attack: 96, defense: 84, hp: 363, speed: 110 },
    name: "遗忘怪",
    role: ["interfere", "control"],
    skills: forgetSkillSeeds("遗忘怪"),
    speciesId: "forget-shadow",
    stageImages: ["/pet-battle/enemies/forget-wraith.png", "/pet-battle/evolutions/broken-memory-spirit-stage2.png", "/pet-battle/evolutions/blank-ghost-king-stage3.png"],
    stageNames: ["遗忘怪", "断忆灵", "空白幽王"]
  },
  {
    baseStats: { attack: 10, defense: 6, hp: 45, speed: 11 },
    element: "anxiety",
    id: "anxiety_beast",
    image: "/pet-battle/enemies/anxiety-fang.png",
    level100Stats: { attack: 129, defense: 90, hp: 392, speed: 135 },
    name: "焦虑兽",
    role: ["pressure", "speed"],
    skills: anxietySkillSeeds("焦虑兽"),
    speciesId: "anxiety-beast",
    stageImages: ["/pet-battle/enemies/anxiety-fang.png", "/pet-battle/evolutions/heart-pressure-beast-stage2.png", "/pet-battle/evolutions/panic-pressure-fiend-stage3.png"],
    stageNames: ["焦虑兽", "压心兽", "惊压魔兽"]
  },
  {
    baseStats: { attack: 13, defense: 5, hp: 36, speed: 12 },
    element: "careless",
    id: "careless_shark",
    image: "/pet-battle/enemies/careless-shark.png",
    level100Stats: { attack: 166, defense: 79, hp: 353, speed: 165 },
    name: "漏题鲨",
    role: ["attack", "speed"],
    skills: carelessSkillSeeds("漏题鲨"),
    speciesId: "careless-shark",
    stageImages: ["/pet-battle/enemies/careless-shark.png", "/pet-battle/evolutions/mistake-wave-shark-stage2.png", "/pet-battle/evolutions/missing-paper-giant-shark-stage3.png"],
    stageNames: ["漏题鲨", "错浪鲨", "漏卷巨鲨"]
  },
  {
    baseStats: { attack: 12, defense: 7, hp: 37, speed: 10 },
    element: "careless",
    id: "careless_tiger",
    image: "/pet-battle/enemies/careless-tiger.png",
    level100Stats: { attack: 156, defense: 101, hp: 374, speed: 144 },
    name: "马虎虎",
    role: ["multi_attack"],
    skills: carelessSkillSeeds("马虎虎"),
    speciesId: "careless-tiger",
    stageImages: ["/pet-battle/enemies/careless-tiger.png", "/pet-battle/evolutions/chaos-stripe-tiger-stage2.png", "/pet-battle/evolutions/wrong-claw-mighty-tiger-stage3.png"],
    stageNames: ["马虎虎", "乱纹虎", "错爪猛虎"]
  },
  {
    baseStats: { attack: 11, defense: 11, hp: 46, speed: 6 },
    element: "careless",
    id: "careless_rhino",
    image: "/pet-battle/enemies/careless-rhino.png",
    level100Stats: { attack: 140, defense: 164, hp: 472, speed: 75 },
    name: "粗撞犀",
    role: ["defense", "attack"],
    skills: carelessSkillSeeds("粗撞犀"),
    speciesId: "careless-rhino",
    stageImages: ["/pet-battle/enemies/careless-rhino.png", "/pet-battle/evolutions/reckless-rhino-stage2.png", "/pet-battle/evolutions/broken-question-steel-rhino-stage3.png"],
    stageNames: ["粗撞犀", "莽撞犀", "断题钢犀"]
  },
  {
    baseStats: { attack: 11, defense: 7, hp: 49, speed: 8 },
    element: "forget",
    id: "forget-lizard-01",
    image: "/pet-battle/enemies/forget-lizard-01.png",
    level100Stats: { attack: 130, defense: 106, hp: 425, speed: 117 },
    name: "忘影蜥",
    role: ["control"],
    skills: forgetSkillSeeds("忘影蜥"),
    speciesId: "forget-lizard-01",
    stageImages: ["/pet-battle/enemies/forget-lizard-01.png", "/pet-battle/evolutions/broken-memory-lizard-stage2.png", "/pet-battle/evolutions/phantom-memory-drake-lizard-stage3.png"],
    stageNames: ["忘影蜥", "断忆蜥", "迷影龙蜥"]
  },
  {
    baseStats: { attack: 11, defense: 9, hp: 59, speed: 7 },
    element: "forget",
    id: "forget-ant-02",
    image: "/pet-battle/enemies/forget-ant-02.png",
    level100Stats: { attack: 120, defense: 133, hp: 475, speed: 101 },
    name: "记空蚁",
    role: ["group_debuff"],
    skills: forgetSkillSeeds("记空蚁"),
    speciesId: "forget-ant-02",
    stageImages: ["/pet-battle/enemies/forget-ant-02.png", "/pet-battle/evolutions/empty-nest-ant-stage2.png", "/pet-battle/evolutions/fragment-ant-king-stage3.png"],
    stageNames: ["记空蚁", "空巢蚁", "断片蚁王"]
  },
  {
    baseStats: { attack: 13, defense: 6, hp: 55, speed: 11 },
    element: "forget",
    id: "forget-chicken-03",
    image: "/pet-battle/enemies/forget-chicken-03.png",
    level100Stats: { attack: 171, defense: 105, hp: 550, speed: 164 },
    name: "忆迷鸡",
    rarity: "boss",
    role: ["boss", "control"],
    skills: forgetSkillSeeds("忆迷鸡"),
    speciesId: "forget-chicken-03",
    stageImages: ["/pet-battle/enemies/forget-chicken-03.png", "/pet-battle/evolutions/confusion-scroll-chicken-stage2.png", "/pet-battle/evolutions/broken-memory-phoenix-stage3.png"],
    stageNames: ["忆迷鸡", "迷卷鸡", "断忆玄凤"]
  },
  {
    baseStats: { attack: 12, defense: 6, hp: 52, speed: 12 },
    element: "anxiety",
    id: "anxiety-dog-01",
    image: "/pet-battle/enemies/jinghuangquan.png",
    level100Stats: { attack: 146, defense: 90, hp: 389, speed: 170 },
    name: "惊惶犬",
    role: ["speed", "interfere"],
    skills: anxietySkillSeeds("惊惶犬"),
    speciesId: "anxiety-dog-01",
    stageImages: ["/pet-battle/enemies/jinghuangquan.png", "/pet-battle/evolutions/panic-rush-dog-stage2.png", "/pet-battle/evolutions/anxious-heart-hound-stage3.png"],
    stageNames: ["惊惶犬", "急乱犬", "惶心猎犬"]
  },
  {
    baseStats: { attack: 11, defense: 7, hp: 49, speed: 13 },
    element: "anxiety",
    id: "anxiety-cat-02",
    image: "/pet-battle/enemies/yiyingmao.png",
    level100Stats: { attack: 125, defense: 101, hp: 396, speed: 176 },
    name: "疑影猫",
    role: ["control", "interfere"],
    skills: anxietySkillSeeds("疑影猫"),
    speciesId: "anxiety-cat-02",
    stageImages: ["/pet-battle/enemies/yiyingmao.png", "/pet-battle/evolutions/mist-doubt-cat-stage2.png", "/pet-battle/evolutions/phantom-doubt-spirit-cat-stage3.png"],
    stageNames: ["疑影猫", "疑雾猫", "影疑灵猫"]
  },
  {
    baseStats: { attack: 14, defense: 11, hp: 66, speed: 6 },
    element: "anxiety",
    id: "anxiety-bear-03",
    image: "/pet-battle/enemies/zhongyaxiong.png",
    level100Stats: { attack: 167, defense: 164, hp: 591, speed: 70 },
    name: "重压熊",
    rarity: "boss",
    role: ["boss", "tank"],
    skills: anxietySkillSeeds("重压熊"),
    speciesId: "anxiety-bear-03",
    stageImages: ["/pet-battle/enemies/zhongyaxiong.png", "/pet-battle/evolutions/heart-pressure-bear-stage2.png", "/pet-battle/evolutions/mountain-pressure-bear-king-stage3.png"],
    stageNames: ["重压熊", "压心熊", "山压熊王"]
  },
  {
    baseStats: { attack: 8, defense: 10, hp: 42, speed: 9 },
    element: "focus",
    id: "focus-rabbit-01",
    image: "/pet-battle/pets/focus-rabbit-01.png",
    level100Stats: { attack: 92, defense: 139, hp: 428, speed: 113 },
    name: "聆心兔",
    role: ["support", "defense"],
    skills: [
      { baseSkillId: "calm_bump", description: "专注型基础攻击。", name: "静心撞击", power: 8, type: "attack" },
      { baseSkillId: "listening_shield", cooldown: 2, description: "获得护盾，减少下一次受到的伤害。", name: "聆听护盾", power: 0, status: { target: "pet", type: "shield" }, type: "shield" },
      { baseSkillId: "focus_gaze", cooldown: 2, description: "降低敌方攻击或速度。", name: "专注凝视", power: 0, status: { target: "enemy", type: "anxietyDown" }, type: "debuff" },
      { baseSkillId: "flow_settle", cooldown: 3, description: "恢复自身生命并清除轻度负面状态。", name: "心流安定", power: 0, type: "heal" }
    ],
    speciesId: "focus-rabbit-01",
    stageImages: ["/pet-battle/pets/focus-rabbit-01.png", "/pet-battle/evolutions/quiet-moon-rabbit-stage2.png", "/pet-battle/evolutions/flow-moon-rabbit-stage3.png"],
    stageNames: ["聆心兔", "静月兔", "心流月兔"]
  },
  {
    baseStats: { attack: 12, defense: 7, hp: 39, speed: 12 },
    element: "focus",
    id: "focus-crow-01",
    image: "/pet-battle/pets/focus-crow-01.png",
    level100Stats: { attack: 161, defense: 91, hp: 366, speed: 165 },
    name: "识光鸦",
    role: ["precise_attack"],
    skills: [
      { baseSkillId: "focus_peck", description: "专注型基础攻击。", name: "专注啄击", power: 9, type: "attack" },
      { baseSkillId: "point_blade", cooldown: 1, description: "精准打击敌人。", name: "识点羽刃", power: 12, type: "power_attack" },
      { baseSkillId: "lock_gaze", cooldown: 2, description: "降低敌方防御。", name: "锁题目光", power: 0, type: "debuff" },
      { baseSkillId: "insight_storm", cooldown: 3, description: "对焦虑型或遗忘型敌人有额外伤害。", name: "洞察风暴", power: 16, type: "power_attack" }
    ],
    speciesId: "focus-crow-01",
    stageImages: ["/pet-battle/pets/focus-crow-01.png", "/pet-battle/evolutions/insight-crow-stage2.png", "/pet-battle/evolutions/deep-insight-raven-stage3.png"],
    stageNames: ["识光鸦", "明察鸦", "洞察玄鸦"]
  },
  {
    baseStats: { attack: 9, defense: 9, hp: 48, speed: 7 },
    element: "focus",
    id: "focus-octopus-01",
    image: "/pet-battle/pets/focus-octopus-01.png",
    level100Stats: { attack: 108, defense: 128, hp: 454, speed: 101 },
    name: "理序章",
    role: ["control", "support"],
    skills: [
      { baseSkillId: "order_slap", description: "专注型基础攻击。", name: "理序拍击", power: 8, type: "attack" },
      { baseSkillId: "note_flow_shield", cooldown: 2, description: "获得护盾。", name: "便签护流", power: 0, status: { target: "pet", type: "shield" }, type: "shield" },
      { baseSkillId: "summary_bind", cooldown: 2, description: "延长敌方节奏或降低速度。", name: "归纳缠绕", power: 0, status: { target: "enemy", type: "forget" }, type: "debuff" },
      { baseSkillId: "knowledge_echo", cooldown: 3, description: "恢复自身生命，并略微提升防御。", name: "知识回响", power: 0, type: "heal" }
    ],
    speciesId: "focus-octopus-01",
    stageImages: ["/pet-battle/pets/focus-octopus-01.png", "/pet-battle/evolutions/summary-octopus-stage2.png", "/pet-battle/evolutions/order-sea-spirit-stage3.png"],
    stageNames: ["理序章", "归纳章", "理序海灵"]
  }
];

function carelessSkillSeeds(name: string): [SkillSeed, SkillSeed, SkillSeed, SkillSeed] {
  return [
    { baseSkillId: `${name}_careless_hit`, description: "粗心型伙伴的基础冲击。", name: "马虎撞击", power: 8, type: "attack" },
    { baseSkillId: `${name}_paper_impact`, cooldown: 1, description: "乱纸飞散形成冲击，造成稳定伤害。", name: "乱纸冲击", power: 11, type: "attack" },
    { baseSkillId: `${name}_careless_down`, cooldown: 2, description: "压低目标节奏，使下一次伤害降低。", name: "粗心压制", power: 0, status: { target: "enemy", type: "anxietyDown" }, type: "debuff" },
    { baseSkillId: `${name}_mistake_counter`, cooldown: 3, description: "把失误转化为反击机会，造成较高伤害。", name: "失误反击", power: 15, type: "power_attack" }
  ];
}

function forgetSkillSeeds(name: string): [SkillSeed, SkillSeed, SkillSeed, SkillSeed] {
  return [
    { baseSkillId: `${name}_memory_hit`, description: "遗忘型伙伴的基础碎片攻击。", name: "记忆碎击", power: 8, type: "attack" },
    { baseSkillId: `${name}_forget_fog`, cooldown: 2, description: "释放遗忘雾气，使目标随机技能冷却延长。", name: "遗忘雾气", power: 0, status: { target: "enemy", type: "forget" }, type: "debuff" },
    { baseSkillId: `${name}_fragment_impact`, cooldown: 1, description: "断片聚合形成冲击，对遗忘型敌人更有效。", name: "断片冲击", power: 12, type: "attack" },
    { baseSkillId: `${name}_memory_return`, cooldown: 3, description: "回收记忆能量，恢复自身生命。", name: "记忆回流", power: 0, type: "heal" }
  ];
}

function anxietySkillSeeds(name: string): [SkillSeed, SkillSeed, SkillSeed, SkillSeed] {
  return [
    { baseSkillId: `${name}_anxiety_hit`, description: "焦虑型伙伴的基础扑击。", name: "紧张扑击", power: 8, type: "attack" },
    { baseSkillId: `${name}_pressure_wave`, cooldown: 1, description: "释放压迫波纹，造成伤害。", name: "压迫波纹", power: 10, type: "power_attack" },
    { baseSkillId: `${name}_anxiety_down`, cooldown: 2, description: "用焦虑压制目标，使下一次伤害降低。", name: "焦虑压制", power: 0, status: { target: "enemy", type: "anxietyDown" }, type: "debuff" },
    { baseSkillId: `${name}_pressure_burst`, cooldown: 3, description: "积蓄压力后爆发，造成高额伤害。", name: "重压爆发", power: 16, type: "power_attack" }
  ];
}

function getGrowthRate(baseStats: BattleStats, level100Stats: BattleStats): BattleStats {
  return {
    attack: (level100Stats.attack - baseStats.attack) / 99,
    defense: (level100Stats.defense - baseStats.defense) / 99,
    hp: (level100Stats.hp - baseStats.hp) / 99,
    speed: (level100Stats.speed - baseStats.speed) / 99
  };
}

function elementLabel(element: PetSpeciesElement) {
  return {
    action: "行动",
    anxiety: "焦虑",
    careless: "粗心",
    focus: "专注",
    forget: "遗忘",
    growth: "积累"
  }[element];
}

function defaultSkillTypeForSlot(index: number, role: string[]): BattleSkillType {
  if (index === 4) return "debuff";
  if (index === 5) return role.includes("heal") || role.includes("support") ? "heal" : "shield";
  if (index === 8) return "debuff";
  if (index === 9) return role.includes("heal") ? "heal" : "shield";
  return "power_attack";
}

function makeAdvancedSkillSeed(seed: SpeciesSeed, index: number): SkillSeed {
  const level = petSpeciesSkillLevels[index];
  const stage2 = seed.stageNames[1];
  const stage3 = seed.stageNames[2];
  const type = defaultSkillTypeForSlot(index, seed.role);
  const isUtility = type === "shield" || type === "heal" || type === "buff" || type === "debuff";
  const powerByIndex: Record<number, number> = {
    6: 18,
    7: 22,
    10: 30,
    11: 38
  };
  const names = [
    `${seed.name}节奏压制`,
    `${seed.name}稳态守护`,
    `${stage2}觉醒`,
    `${stage2}核心技`,
    `${stage2}战术技`,
    `${stage3}预兆`,
    `${stage3}大招`,
    `${stage3}终极专属`
  ];
  const advancedIndex = index - 4;
  return {
    baseSkillId: `${seed.id}_s${String(index + 1).padStart(2, "0")}`,
    cooldown: index >= 10 ? 5 : index >= 7 ? 3 : 2,
    description: `${elementLabel(seed.element)}型 ${level} 级学习技能，服务于 ${seed.role.join("/")} 定位。`,
    name: names[advancedIndex],
    power: isUtility ? 0 : powerByIndex[index] ?? 14,
    status: type === "shield"
      ? { target: "pet", type: "shield" }
      : type === "debuff"
        ? { target: "enemy", type: seed.element === "forget" ? "forget" : "anxietyDown" }
        : undefined,
    type
  };
}

function skillSeedToDefinition(seed: SpeciesSeed, skill: SkillSeed, index: number): PetSpeciesSkillDefinition {
  const skillId = `${seed.id}_s${String(index + 1).padStart(2, "0")}`;
  return {
    attribute: elementAttributeMap[seed.element],
    baseSkillId: skill.baseSkillId,
    cooldown: skill.cooldown ?? 0,
    displayDescription: skill.description,
    displayName: skill.name,
    id: skillId,
    power: skill.power ?? 0,
    status: skill.status,
    type: skill.type ?? ((skill.power ?? 0) > 0 ? "attack" : "buff"),
    unlockLevel: petSpeciesSkillLevels[index]
  };
}

function createSpecies(seed: SpeciesSeed): PetSpeciesMasterData {
  const twelveSkills = [
    ...seed.skills,
    ...petSpeciesSkillLevels.slice(4).map((_, index) => makeAdvancedSkillSeed(seed, index + 4))
  ];
  const skillTemplate = twelveSkills.map((skill, index) => {
    const definition = skillSeedToDefinition(seed, skill, index);
    const counterEnemyType = elementEnemyCounterMap[seed.element];
    return counterEnemyType && definition.power > 0
      ? { ...definition, counterEnemyType } as PetSpeciesSkillDefinition & { counterEnemyType: EnemyType }
      : definition;
  });

  return {
    baseStats: seed.baseStats,
    damageFormula: petDamageFormulaConfig,
    element: seed.element,
    evolution: {
      evolveLevel: 30,
      evolvesTo: undefined,
      lineId: seed.speciesId,
      nextStageName: seed.stageNames[1],
      stage: 1,
      stageNames: seed.stageNames
    },
    evolutionLine: {
      lineId: `${seed.id}_line`,
      stages: [
        {
          canEvolve: true,
          image: seed.stageImages[0],
          name: seed.stageNames[0],
          speciesId: seed.id,
          stage: 1
        },
        {
          canEvolve: seed.rarity !== "boss",
          evolveLevel: 30,
          image: seed.stageImages[1],
          name: seed.stageNames[1],
          speciesId: `${seed.id}_stage2`,
          stage: 2
        },
        {
          canEvolve: seed.rarity !== "boss",
          evolveLevel: 60,
          image: seed.stageImages[2],
          name: seed.stageNames[2],
          speciesId: `${seed.id}_stage3`,
          stage: 3
        }
      ]
    },
    growthRate: getGrowthRate(seed.baseStats, seed.level100Stats),
    id: seed.id,
    image: seed.image,
    learnset: skillTemplate.map((skill) => ({ level: skill.unlockLevel, skillId: skill.id })),
    level100Stats: seed.level100Stats,
    levelCap: 100,
    name: seed.name,
    rarity: seed.rarity ?? "normal",
    role: seed.role,
    speciesId: seed.speciesId,
    skillTemplate
  };
}

export const petSpeciesMasterData = speciesSeeds.map(createSpecies);

export const petSpeciesMasterDataById = Object.fromEntries(petSpeciesMasterData.map((species) => [species.id, species])) as Record<string, PetSpeciesMasterData>;

export function getPetSpeciesMasterData(id: string) {
  return petSpeciesMasterDataById[id] ?? null;
}

export function getPetSpeciesSkillTemplate(id: string) {
  return getPetSpeciesMasterData(id)?.skillTemplate ?? null;
}

export function getPetEvolutionLine(id: string) {
  return getPetSpeciesMasterData(id)?.evolutionLine ?? null;
}

export function getPetEvolutionStage(id: string, stage: number) {
  const line = getPetEvolutionLine(id);
  if (!line) return null;
  const safeStage = Math.max(1, Math.min(3, Math.round(stage))) as 1 | 2 | 3;
  return line.stages[safeStage - 1] ?? null;
}

export function getPetSpeciesStatsAtLevel(id: string, level: number): BattleStats | null {
  const species = getPetSpeciesMasterData(id);
  if (!species) return null;
  const safeLevel = Math.max(1, Math.min(species.levelCap, Math.round(level)));
  const growthTimes = safeLevel - 1;
  return {
    attack: Math.round(species.baseStats.attack + species.growthRate.attack * growthTimes),
    defense: Math.round(species.baseStats.defense + species.growthRate.defense * growthTimes),
    hp: Math.round(species.baseStats.hp + species.growthRate.hp * growthTimes),
    speed: Math.round(species.baseStats.speed + species.growthRate.speed * growthTimes)
  };
}
