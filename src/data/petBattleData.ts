/*
  文件用途：
  这里维护“伙伴岛”第一版本地战斗数据。
  暂时不接数据库，后续如果要调整宠物、敌人、技能数值，优先改这个文件。

  新增宠物：
  1. 在 pets 数组里复制一只宠物对象。
  2. 修改 id、name、attribute、baseStats、growth、skills。
  3. skills 里的每个技能 id 必须能在 battleSkills 中找到。

  新增敌人：
  1. 在 enemies 数组里复制一个敌人对象。
  2. 修改 id、type、stats、rewardExp、skills 和 aiWeights。
  3. aiWeights 的 skillId 必须属于该敌人的 skills。

  新增技能：
  1. 在 battleSkills 里新增一个技能对象。
  2. type 只使用当前第一版支持的类型，避免战斗规则失控。
*/

export type PetAttribute = "focus" | "action" | "growth";
export type EnemyType = "careless" | "forget" | "anxiety" | "focus";

export type BattleSkillType =
  | "attack"
  | "power_attack"
  | "multi_hit"
  | "shield"
  | "heal"
  | "buff"
  | "debuff";

export type BattleStats = {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
};

export type StatGrowth = BattleStats;

export type BattleSkill = {
  id: string;
  name: string;
  type: BattleSkillType;
  power: number;
  cooldown: number;
  description: string;
  effectText: string;
  hits?: number;
  counterEnemyType?: EnemyType;
  shieldReduction?: number;
  healPercent?: number;
  buff?: Partial<Pick<BattleStats, "attack" | "defense" | "speed">> & {
    duration: number;
    nextAttackPowerMultiplier?: number;
  };
  debuff?: Partial<Pick<BattleStats, "attack" | "defense" | "speed">> & {
    duration: number;
    nextDamageMultiplier?: number;
  };
  lifestealPercent?: number;
  removeEnemyBuff?: boolean;
  selfDebuff?: Partial<Pick<BattleStats, "defense" | "speed">> & {
    duration: number;
  };
};

export type BattlePet = {
  id: string;
  name: string;
  role: string;
  attribute: PetAttribute;
  counters: EnemyType[];
  image: string;
  fitFor: string;
  battleStyle: string;
  baseStats: BattleStats;
  growth: StatGrowth;
  skills: string[];
};

export type BattleEnemy = {
  id: string;
  name: string;
  type: EnemyType;
  branch?: EnemyType | "basic";
  species?: string;
  stage?: "basic" | "advanced" | "advancedBoss";
  role: string;
  description?: string;
  personality?: string;
  weaknessHint?: string;
  image: string;
  level: number;
  stats: BattleStats;
  growth?: BattleStats;
  rewardExp: number;
  rewardTrainingExp?: number;
  skills: string[];
  aiWeights: Array<{
    skillId: string;
    weight: number;
  }>;
};

export const counterBonus = {
  advantage: 1.25,
  normal: 1,
  disadvantage: 0.85
};

export const pets: BattlePet[] = [
  {
    id: "cloud_beast",
    name: "云团兽",
    role: "均衡型 / 专注型",
    attribute: "focus",
    counters: ["anxiety"],
    image: "/pet-battle/pets/cloud-beast.png",
    fitFor: "新手、稳扎稳打型玩家",
    battleStyle: "血量、防御、恢复能力较均衡",
    baseStats: {
      hp: 48,
      attack: 10,
      defense: 10,
      speed: 8
    },
    growth: {
      hp: 6,
      attack: 2,
      defense: 2,
      speed: 1
    },
    skills: ["cloud_bump", "focus_star", "wind_shield", "star_heal"]
  },
  {
    id: "fire_fox",
    name: "星火狐",
    role: "速攻型 / 行动型",
    attribute: "action",
    counters: ["careless"],
    image: "/pet-battle/pets/starfire-fox.png",
    fitFor: "喜欢快速解决战斗的玩家",
    battleStyle: "攻击高、速度快、防御低",
    baseStats: {
      hp: 40,
      attack: 14,
      defense: 7,
      speed: 12
    },
    growth: {
      hp: 4,
      attack: 3,
      defense: 1,
      speed: 2
    },
    skills: ["fire_tail", "flame_dash", "flash_claw", "heat_boost"]
  },
  {
    id: "grass_dragon",
    name: "草芽龙",
    role: "防御型 / 成长型",
    attribute: "growth",
    counters: ["forget"],
    image: "/pet-battle/pets/sprout-dragon.png",
    fitFor: "喜欢稳、后期成长、耐打的玩家",
    battleStyle: "血厚、防高、恢复和蓄力能力强",
    baseStats: {
      hp: 54,
      attack: 9,
      defense: 13,
      speed: 6
    },
    growth: {
      hp: 7,
      attack: 2,
      defense: 3,
      speed: 1
    },
    skills: ["vine_bump", "root_bind", "growth_charge", "memory_roots"]
  }
];

export const enemies: BattleEnemy[] = [
  {
    id: "careless_beast",
    name: "粗心兽",
    type: "careless",
    branch: "basic",
    role: "新手敌人",
    description: "容易漏看条件的新手训练敌人，适合作为第一场热身。",
    image: "/pet-battle/enemies/careless-beast.png",
    level: 1,
    stats: {
      hp: 36,
      attack: 7,
      defense: 3,
      speed: 5
    },
    rewardExp: 30,
    rewardTrainingExp: 10,
    skills: ["miss_bump", "distract_sneeze"],
    aiWeights: [
      { skillId: "miss_bump", weight: 70 },
      { skillId: "distract_sneeze", weight: 30 }
    ]
  },
  {
    id: "forget_shadow",
    name: "遗忘怪",
    type: "forget",
    branch: "basic",
    role: "中级敌人",
    description: "会削弱防御、消耗节奏的遗忘型敌人。",
    image: "/pet-battle/enemies/forget-wraith.png",
    level: 3,
    stats: {
      hp: 48,
      attack: 8,
      defense: 5,
      speed: 7
    },
    rewardExp: 45,
    rewardTrainingExp: 12,
    skills: ["fragment_hit", "blank_fog", "memory_drain"],
    aiWeights: [
      { skillId: "fragment_hit", weight: 60 },
      { skillId: "blank_fog", weight: 25 },
      { skillId: "memory_drain", weight: 15 }
    ]
  },
  {
    id: "anxiety_beast",
    name: "焦虑兽",
    type: "anxiety",
    branch: "basic",
    role: "精英敌人",
    description: "速度快、压迫感强，适合作为第一版小Boss。",
    image: "/pet-battle/enemies/anxiety-fang.png",
    level: 5,
    stats: {
      hp: 62,
      attack: 12,
      defense: 7,
      speed: 13
    },
    rewardExp: 70,
    rewardTrainingExp: 14,
    skills: ["panic_claw", "pressure_scream", "countdown_impact"],
    aiWeights: [
      { skillId: "panic_claw", weight: 55 },
      { skillId: "pressure_scream", weight: 30 },
      { skillId: "countdown_impact", weight: 15 }
    ]
  },
  {
    id: "careless_shark",
    name: "漏题鲨",
    type: "careless",
    branch: "careless",
    role: "高速爆发",
    description: "总是冲得很快，但容易漏看关键信息的粗心型敌人。攻击和速度高，防御低。",
    image: "/pet-battle/enemies/careless-shark.png",
    level: 4,
    stats: {
      hp: 46,
      attack: 16,
      defense: 6,
      speed: 15
    },
    rewardExp: 70,
    rewardTrainingExp: 16,
    skills: ["fin_slash", "missed_question_dash", "chain_wrong_bite"],
    aiWeights: [
      { skillId: "fin_slash", weight: 50 },
      { skillId: "missed_question_dash", weight: 25 },
      { skillId: "chain_wrong_bite", weight: 25 }
    ]
  },
  {
    id: "careless_tiger",
    name: "马虎虎",
    type: "careless",
    branch: "careless",
    role: "均衡连击",
    description: "会做题但容易写错步骤的粗心型敌人，属性较均衡，连击能力强。",
    image: "/pet-battle/enemies/careless-tiger.png",
    level: 5,
    stats: {
      hp: 52,
      attack: 15,
      defense: 9,
      speed: 12
    },
    rewardExp: 80,
    rewardTrainingExp: 18,
    skills: ["tiger_paw", "careless_pounce", "distracted_roar"],
    aiWeights: [
      { skillId: "tiger_paw", weight: 50 },
      { skillId: "careless_pounce", weight: 30 },
      { skillId: "distracted_roar", weight: 20 }
    ]
  },
  {
    id: "careless_rhino",
    name: "粗撞犀",
    type: "careless",
    branch: "careless",
    role: "厚血强攻",
    description: "喜欢一股脑往前冲的粗心型敌人，血厚防高，速度较慢。",
    image: "/pet-battle/enemies/careless-rhino.png",
    level: 6,
    stats: {
      hp: 64,
      attack: 14,
      defense: 13,
      speed: 7
    },
    rewardExp: 95,
    rewardTrainingExp: 20,
    skills: ["right_angle_charge", "rough_line_headbutt", "heavy_guard"],
    aiWeights: [
      { skillId: "right_angle_charge", weight: 55 },
      { skillId: "rough_line_headbutt", weight: 25 },
      { skillId: "heavy_guard", weight: 20 }
    ]
  },
  {
    id: "forget-lizard-01",
    name: "忘影蜥",
    type: "forget",
    branch: "forget",
    species: "蜥蜴",
    stage: "advanced",
    role: "迷糊控场",
    description: "总是把刚刚记住的知识贴得到处都是，尾巴一甩，笔记就散了一地。",
    personality: "迷糊、慢半拍、容易忘步骤",
    image: "/pet-battle/enemies/forget-lizard-01.png",
    level: 4,
    stats: {
      hp: 68,
      attack: 14,
      defense: 8,
      speed: 10
    },
    growth: {
      hp: 8,
      attack: 2,
      defense: 1,
      speed: 1
    },
    rewardExp: 45,
    rewardTrainingExp: 14,
    skills: ["loose_page_slap", "tail_fog_forget", "blank_stare"],
    aiWeights: [
      { skillId: "loose_page_slap", weight: 50 },
      { skillId: "tail_fog_forget", weight: 30 },
      { skillId: "blank_stare", weight: 20 }
    ]
  },
  {
    id: "forget-ant-02",
    name: "记空蚁",
    type: "forget",
    branch: "forget",
    species: "蚂蚁",
    stage: "advanced",
    role: "厚血干扰",
    description: "它背着一块装满知识碎片的紫色方盒，但总是在迷宫里走错路。",
    personality: "努力但混乱、记得很多碎片却串不起来",
    image: "/pet-battle/enemies/forget-ant-02.png",
    level: 5,
    stats: {
      hp: 82,
      attack: 13,
      defense: 11,
      speed: 8
    },
    growth: {
      hp: 9,
      attack: 2,
      defense: 2,
      speed: 1
    },
    rewardExp: 55,
    rewardTrainingExp: 18,
    skills: ["fragment_nibble", "memory_box_bump", "maze_loop"],
    aiWeights: [
      { skillId: "fragment_nibble", weight: 50 },
      { skillId: "memory_box_bump", weight: 30 },
      { skillId: "maze_loop", weight: 20 }
    ]
  },
  {
    id: "forget-chicken-03",
    name: "忆迷鸡",
    type: "forget",
    branch: "forget",
    species: "鸡",
    stage: "advancedBoss",
    role: "高速断片",
    description: "一激动就开始原地转圈，转完以后连自己刚刚为什么转都忘了。",
    personality: "慌张、跳脱、记忆断片",
    image: "/pet-battle/enemies/forget-chicken-03.png",
    level: 6,
    stats: {
      hp: 76,
      attack: 16,
      defense: 7,
      speed: 14
    },
    growth: {
      hp: 8,
      attack: 3,
      defense: 1,
      speed: 2
    },
    rewardExp: 65,
    rewardTrainingExp: 22,
    skills: ["gugu_peck", "spin_forget_feather", "fragment_crow"],
    aiWeights: [
      { skillId: "gugu_peck", weight: 50 },
      { skillId: "spin_forget_feather", weight: 30 },
      { skillId: "fragment_crow", weight: 20 }
    ]
  },
  {
    id: "anxiety-dog-01",
    name: "惊惶犬",
    type: "anxiety",
    branch: "anxiety",
    species: "狗",
    stage: "advanced",
    role: "高速骚扰型",
    description: "总是竖着耳朵观察四周，哪怕没有危险，也会提前进入戒备状态。它不是勇敢，而是害怕出错，所以总抢先行动。",
    personality: "紧张、警觉、先发制人",
    weaknessHint: "使用专注型伙伴稳定节奏，可以克制它的焦虑干扰。",
    image: "/pet-battle/enemies/jinghuangquan.png",
    level: 4,
    stats: {
      hp: 72,
      attack: 15,
      defense: 7,
      speed: 15
    },
    growth: {
      hp: 8,
      attack: 2,
      defense: 1,
      speed: 2
    },
    rewardExp: 55,
    rewardTrainingExp: 18,
    skills: ["anxiety-dog-bite", "anxiety-dog-dash", "anxiety-dog-bark"],
    aiWeights: [
      { skillId: "anxiety-dog-bite", weight: 35 },
      { skillId: "anxiety-dog-dash", weight: 40 },
      { skillId: "anxiety-dog-bark", weight: 25 }
    ]
  },
  {
    id: "anxiety-cat-02",
    name: "疑影猫",
    type: "anxiety",
    branch: "anxiety",
    species: "猫",
    stage: "advanced",
    role: "诡异干扰型",
    description: "总会盯着空气中不存在的东西发呆，仿佛影子里藏着问题。它的攻击不一定最重，但最容易让人心烦意乱。",
    personality: "多疑、试探、持续干扰",
    weaknessHint: "使用专注型伙伴保持稳定判断，可以破解它的疑影干扰。",
    image: "/pet-battle/enemies/yiyingmao.png",
    level: 5,
    stats: {
      hp: 68,
      attack: 14,
      defense: 9,
      speed: 16
    },
    growth: {
      hp: 7,
      attack: 2,
      defense: 1,
      speed: 2
    },
    rewardExp: 65,
    rewardTrainingExp: 22,
    skills: ["anxiety-cat-claw", "anxiety-cat-eye", "anxiety-cat-shadow"],
    aiWeights: [
      { skillId: "anxiety-cat-claw", weight: 35 },
      { skillId: "anxiety-cat-shadow", weight: 30 },
      { skillId: "anxiety-cat-eye", weight: 35 }
    ]
  },
  {
    id: "anxiety-bear-03",
    name: "重压熊",
    type: "anxiety",
    branch: "anxiety",
    species: "熊",
    stage: "advancedBoss",
    role: "厚重压迫型",
    description: "它总是背着沉重的任务前行，从不轻易停下。所有担忧都被它一件件扛在身上，久而久之，连攻击都带着压迫感。",
    personality: "压抑、负担重、自我要求高",
    weaknessHint: "使用专注型伙伴拆解压力，可以克制它的重压攻击。",
    image: "/pet-battle/enemies/zhongyaxiong.png",
    level: 6,
    stats: {
      hp: 92,
      attack: 17,
      defense: 13,
      speed: 7
    },
    growth: {
      hp: 10,
      attack: 3,
      defense: 2,
      speed: 1
    },
    rewardExp: 80,
    rewardTrainingExp: 28,
    skills: ["anxiety-bear-slam", "anxiety-bear-burden", "anxiety-bear-pressure"],
    aiWeights: [
      { skillId: "anxiety-bear-slam", weight: 35 },
      { skillId: "anxiety-bear-pressure", weight: 40 },
      { skillId: "anxiety-bear-burden", weight: 25 }
    ]
  },
  {
    id: "focus-rabbit-01",
    name: "聆心兔",
    type: "focus",
    branch: "focus",
    species: "兔",
    stage: "advanced",
    role: "辅助防守",
    description: "安静倾听节奏的专注型野生宠物，擅长护盾与稳定防守。捕捉后可作为 Lv.1 专注型伙伴培养。",
    personality: "安静、敏锐、会观察节奏",
    image: "/pet-battle/pets/focus-rabbit-01.png",
    level: 4,
    stats: {
      hp: 58,
      attack: 10,
      defense: 12,
      speed: 11
    },
    growth: {
      hp: 7,
      attack: 2,
      defense: 2,
      speed: 1
    },
    rewardExp: 55,
    rewardTrainingExp: 16,
    skills: ["calm_bump", "listening_shield", "focus_gaze", "flow_settle"],
    aiWeights: [
      { skillId: "calm_bump", weight: 45 },
      { skillId: "listening_shield", weight: 25 },
      { skillId: "focus_gaze", weight: 20 },
      { skillId: "flow_settle", weight: 10 }
    ]
  },
  {
    id: "focus-crow-01",
    name: "识光鸦",
    type: "focus",
    branch: "focus",
    species: "鸦",
    stage: "advanced",
    role: "精准输出",
    description: "能迅速捕捉题目关键光点的专注型野生宠物，攻击精准、节奏干净。",
    personality: "冷静、锐利、判断准确",
    image: "/pet-battle/pets/focus-crow-01.png",
    level: 5,
    stats: {
      hp: 54,
      attack: 15,
      defense: 8,
      speed: 15
    },
    growth: {
      hp: 6,
      attack: 3,
      defense: 1,
      speed: 2
    },
    rewardExp: 65,
    rewardTrainingExp: 18,
    skills: ["focus_peck", "point_blade", "lock_gaze", "insight_storm"],
    aiWeights: [
      { skillId: "focus_peck", weight: 45 },
      { skillId: "point_blade", weight: 30 },
      { skillId: "lock_gaze", weight: 15 },
      { skillId: "insight_storm", weight: 10 }
    ]
  },
  {
    id: "focus-octopus-01",
    name: "理序章",
    type: "focus",
    branch: "focus",
    species: "章鱼",
    stage: "advanced",
    role: "控场辅助",
    description: "用便签和触手整理知识顺序的专注型野生宠物，擅长护盾、削弱和恢复。",
    personality: "有条理、爱归纳、控场稳",
    image: "/pet-battle/pets/focus-octopus-01.png",
    level: 5,
    stats: {
      hp: 66,
      attack: 11,
      defense: 11,
      speed: 9
    },
    growth: {
      hp: 8,
      attack: 2,
      defense: 2,
      speed: 1
    },
    rewardExp: 65,
    rewardTrainingExp: 20,
    skills: ["order_slap", "note_flow_shield", "summary_bind", "knowledge_echo"],
    aiWeights: [
      { skillId: "order_slap", weight: 42 },
      { skillId: "note_flow_shield", weight: 25 },
      { skillId: "summary_bind", weight: 20 },
      { skillId: "knowledge_echo", weight: 13 }
    ]
  }
];

export const battleSkills: Record<string, BattleSkill> = {
  cloud_bump: {
    id: "cloud_bump",
    name: "云雾冲撞",
    type: "attack",
    power: 8,
    cooldown: 0,
    effectText: "造成稳定伤害",
    description: "云团兽向敌人轻轻撞击，是最基础的攻击技能。"
  },
  focus_star: {
    id: "focus_star",
    name: "专注光点",
    type: "power_attack",
    power: 12,
    cooldown: 1,
    counterEnemyType: "anxiety",
    effectText: "如果敌人是焦虑兽，额外造成25%伤害",
    description: "云团兽凝聚头顶星光攻击敌人，专门克制焦虑类敌人。"
  },
  wind_shield: {
    id: "wind_shield",
    name: "轻风护盾",
    type: "shield",
    power: 0,
    cooldown: 2,
    shieldReduction: 0.4,
    effectText: "下一次受到的伤害减少40%",
    description: "云雾环绕身体，形成临时护盾。"
  },
  star_heal: {
    id: "star_heal",
    name: "星点治愈",
    type: "heal",
    power: 0,
    cooldown: 3,
    healPercent: 0.25,
    effectText: "恢复自身最大生命值的25%",
    description: "适合新手保持续航，保证云团兽不容易暴毙。"
  },
  fire_tail: {
    id: "fire_tail",
    name: "火尾拍击",
    type: "attack",
    power: 9,
    cooldown: 0,
    effectText: "造成普通伤害",
    description: "星火狐用燃着小火苗的尾巴快速攻击敌人。"
  },
  flame_dash: {
    id: "flame_dash",
    name: "烈焰突袭",
    type: "power_attack",
    power: 16,
    cooldown: 2,
    counterEnemyType: "careless",
    effectText: "如果敌人是粗心兽，额外造成25%伤害",
    description: "以高速突进打断敌人的马虎状态。"
  },
  flash_claw: {
    id: "flash_claw",
    name: "连闪爪",
    type: "multi_hit",
    power: 6,
    hits: 2,
    cooldown: 1,
    effectText: "连续造成两段小伤害",
    description: "对低防御敌人很有效，打击感明显。"
  },
  heat_boost: {
    id: "heat_boost",
    name: "热流加速",
    type: "buff",
    power: 0,
    cooldown: 3,
    buff: {
      attack: 3,
      speed: 3,
      duration: 2
    },
    effectText: "接下来2回合自身攻击+3，速度+3",
    description: "星火狐进入加速状态，适合快速收割。"
  },
  vine_bump: {
    id: "vine_bump",
    name: "藤芽撞击",
    type: "attack",
    power: 8,
    cooldown: 0,
    effectText: "造成稳定伤害",
    description: "草芽龙用头顶嫩叶和身体撞击敌人。"
  },
  root_bind: {
    id: "root_bind",
    name: "根须缠绕",
    type: "debuff",
    power: 11,
    cooldown: 1,
    debuff: {
      attack: -2,
      duration: 1
    },
    effectText: "敌人下一回合攻击-2",
    description: "用根须缠住敌人，削弱其进攻。"
  },
  growth_charge: {
    id: "growth_charge",
    name: "生长蓄力",
    type: "buff",
    power: 0,
    cooldown: 2,
    buff: {
      defense: 3,
      duration: 1,
      nextAttackPowerMultiplier: 1.3
    },
    effectText: "自身防御+3，下一次攻击威力+30%",
    description: "草芽龙扎根蓄力，体现“积累型”玩法。"
  },
  memory_roots: {
    id: "memory_roots",
    name: "记忆根系",
    type: "power_attack",
    power: 13,
    cooldown: 2,
    counterEnemyType: "forget",
    lifestealPercent: 0.2,
    effectText: "如果敌人是遗忘怪，额外造成25%伤害，并恢复造成伤害的20%生命",
    description: "用扎根记忆对抗遗忘，是草芽龙的核心技能。"
  },
  miss_bump: {
    id: "miss_bump",
    name: "漏看冲撞",
    type: "attack",
    power: 7,
    cooldown: 0,
    effectText: "造成普通伤害",
    description: "粗心兽慌慌张张地撞过来。"
  },
  distract_sneeze: {
    id: "distract_sneeze",
    name: "走神喷嚏",
    type: "debuff",
    power: 4,
    cooldown: 2,
    debuff: {
      duration: 1,
      nextDamageMultiplier: 0.8
    },
    effectText: "造成少量伤害，并使玩家下一次攻击伤害降低20%",
    description: "用走神干扰玩家节奏。"
  },
  fragment_hit: {
    id: "fragment_hit",
    name: "断片拍击",
    type: "attack",
    power: 8,
    cooldown: 0,
    effectText: "造成普通伤害",
    description: "遗忘怪用漂浮的碎片攻击玩家。"
  },
  blank_fog: {
    id: "blank_fog",
    name: "空白迷雾",
    type: "debuff",
    power: 5,
    cooldown: 2,
    debuff: {
      defense: -2,
      duration: 2
    },
    effectText: "造成少量伤害，并使玩家防御-2，持续2回合",
    description: "让玩家陷入记忆空白，防御变弱。"
  },
  memory_drain: {
    id: "memory_drain",
    name: "记忆抽离",
    type: "power_attack",
    power: 10,
    cooldown: 3,
    removeEnemyBuff: true,
    effectText: "造成伤害；如果玩家身上有强化效果，移除一个强化效果",
    description: "专门克制玩家的强化策略。"
  },
  panic_claw: {
    id: "panic_claw",
    name: "慌乱之爪",
    type: "attack",
    power: 10,
    cooldown: 0,
    effectText: "造成普通伤害",
    description: "焦虑兽快速抓击，出手很快。"
  },
  pressure_scream: {
    id: "pressure_scream",
    name: "压力尖叫",
    type: "debuff",
    power: 8,
    cooldown: 2,
    debuff: {
      attack: -2,
      duration: 2
    },
    effectText: "造成伤害，并使玩家攻击-2，持续2回合",
    description: "用压力干扰玩家输出。"
  },
  countdown_impact: {
    id: "countdown_impact",
    name: "倒计时冲击",
    type: "power_attack",
    power: 18,
    cooldown: 3,
    selfDebuff: {
      defense: -2,
      duration: 1
    },
    effectText: "造成高额伤害；使用后自身防御-2，持续1回合",
    description: "强力但有副作用，适合制造Boss压迫感。"
  },
  fin_slash: {
    id: "fin_slash",
    name: "乱鳍拍击",
    type: "attack",
    power: 10,
    cooldown: 0,
    effectText: "快速拍击，造成普通伤害",
    description: "漏题鲨快速拍击，造成普通伤害。"
  },
  missed_question_dash: {
    id: "missed_question_dash",
    name: "漏题突袭",
    type: "power_attack",
    power: 17,
    cooldown: 2,
    effectText: "高速突袭，速度优势明显",
    description: "高速突袭，若敌人速度低于自己，额外造成少量伤害。"
  },
  chain_wrong_bite: {
    id: "chain_wrong_bite",
    name: "连错撕咬",
    type: "multi_hit",
    power: 7,
    hits: 2,
    cooldown: 1,
    effectText: "连续造成两段伤害",
    description: "连续撕咬两次，像连续错过两个关键条件。"
  },
  tiger_paw: {
    id: "tiger_paw",
    name: "虎爪拍击",
    type: "attack",
    power: 11,
    cooldown: 0,
    effectText: "稳定造成伤害",
    description: "马虎虎用虎爪拍击，稳定造成伤害。"
  },
  careless_pounce: {
    id: "careless_pounce",
    name: "马虎连扑",
    type: "multi_hit",
    power: 6,
    hits: 3,
    cooldown: 2,
    effectText: "连续攻击三次",
    description: "马虎虎连续扑击三次，连击能力很强。"
  },
  distracted_roar: {
    id: "distracted_roar",
    name: "走神咆哮",
    type: "debuff",
    power: 0,
    cooldown: 3,
    debuff: {
      attack: -1,
      duration: 1
    },
    effectText: "降低我方攻击",
    description: "马虎虎用咆哮打乱节奏，降低我方攻击。"
  },
  right_angle_charge: {
    id: "right_angle_charge",
    name: "直角冲撞",
    type: "attack",
    power: 12,
    cooldown: 0,
    effectText: "稳定造成伤害",
    description: "粗撞犀直线冲撞，稳定造成伤害。"
  },
  rough_line_headbutt: {
    id: "rough_line_headbutt",
    name: "粗线猛顶",
    type: "power_attack",
    power: 18,
    cooldown: 2,
    selfDebuff: {
      speed: -2,
      duration: 1
    },
    effectText: "造成高额伤害，但自身下回合速度降低",
    description: "粗撞犀猛顶造成高额伤害，但出手后变得笨重。"
  },
  heavy_guard: {
    id: "heavy_guard",
    name: "笨重防守",
    type: "shield",
    power: 0,
    cooldown: 3,
    shieldReduction: 0.35,
    effectText: "下次受到伤害降低",
    description: "粗撞犀缩起身体防守，下次受到的伤害降低。"
  },
  loose_page_slap: {
    id: "loose_page_slap",
    name: "散页拍打",
    type: "attack",
    power: 10,
    cooldown: 0,
    effectText: "造成普通伤害",
    description: "用散落的便签拍击对手，造成普通伤害。"
  },
  tail_fog_forget: {
    id: "tail_fog_forget",
    name: "尾雾遗忘",
    type: "debuff",
    power: 13,
    cooldown: 1,
    debuff: {
      speed: -1,
      duration: 1
    },
    effectText: "造成伤害，并小幅降低我方速度",
    description: "甩出紫色迷雾，造成伤害，并小幅降低我方速度。"
  },
  blank_stare: {
    id: "blank_stare",
    name: "空白凝视",
    type: "shield",
    power: 0,
    cooldown: 2,
    shieldReduction: 0.28,
    effectText: "下一回合自身受到伤害降低",
    description: "让对手一瞬间忘记节奏，下一回合敌方受到伤害降低。"
  },
  fragment_nibble: {
    id: "fragment_nibble",
    name: "碎片啃咬",
    type: "attack",
    power: 11,
    cooldown: 0,
    effectText: "造成普通伤害",
    description: "用零散知识碎片攻击对手，造成普通伤害。"
  },
  memory_box_bump: {
    id: "memory_box_bump",
    name: "记忆盒撞击",
    type: "power_attack",
    power: 15,
    cooldown: 1,
    effectText: "造成较高伤害",
    description: "抱着记忆盒冲撞，造成较高伤害。"
  },
  maze_loop: {
    id: "maze_loop",
    name: "迷宫循环",
    type: "shield",
    power: 0,
    cooldown: 2,
    shieldReduction: 0.35,
    effectText: "本回合提升自身防御",
    description: "进入重复回忆状态，本回合提升自身防御。"
  },
  gugu_peck: {
    id: "gugu_peck",
    name: "咕咕啄击",
    type: "attack",
    power: 10,
    cooldown: 0,
    effectText: "快速造成普通伤害",
    description: "快速啄击对手，造成普通伤害。"
  },
  spin_forget_feather: {
    id: "spin_forget_feather",
    name: "旋忘羽击",
    type: "power_attack",
    power: 17,
    cooldown: 1,
    effectText: "造成较高伤害",
    description: "旋转甩出紫色羽毛，造成较高伤害。"
  },
  fragment_crow: {
    id: "fragment_crow",
    name: "断片啼叫",
    type: "debuff",
    power: 0,
    cooldown: 2,
    debuff: {
      duration: 1,
      nextDamageMultiplier: 0.8
    },
    effectText: "降低我方下一次攻击伤害",
    description: "发出混乱叫声，降低我方下一次攻击伤害。"
  },
  "anxiety-dog-bite": {
    id: "anxiety-dog-bite",
    name: "惊步咬",
    type: "attack",
    power: 11,
    cooldown: 0,
    effectText: "快速造成普通伤害",
    description: "快速扑咬对手，造成普通伤害。"
  },
  "anxiety-dog-dash": {
    id: "anxiety-dog-dash",
    name: "警觉冲刺",
    type: "buff",
    power: 14,
    cooldown: 1,
    buff: {
      speed: 2,
      duration: 1
    },
    effectText: "造成伤害，并小幅提高自身速度",
    description: "因过度警觉而突然冲刺攻击，造成伤害，并小幅提高自身速度。"
  },
  "anxiety-dog-bark": {
    id: "anxiety-dog-bark",
    name: "慌乱吠",
    type: "debuff",
    power: 0,
    cooldown: 2,
    debuff: {
      duration: 1,
      nextDamageMultiplier: 0.8
    },
    effectText: "使对手下一次攻击伤害降低",
    description: "发出慌乱叫声，干扰对手节奏，使对手下一次攻击伤害降低。"
  },
  "anxiety-cat-claw": {
    id: "anxiety-cat-claw",
    name: "疑影爪",
    type: "attack",
    power: 10,
    cooldown: 0,
    effectText: "造成普通伤害",
    description: "从影子里突然伸爪，造成普通伤害。"
  },
  "anxiety-cat-eye": {
    id: "anxiety-cat-eye",
    name: "乱心瞳",
    type: "debuff",
    power: 0,
    cooldown: 2,
    debuff: {
      duration: 1,
      nextDamageMultiplier: 0.8
    },
    effectText: "使对手下一次攻击伤害降低",
    description: "用不安的目光扰乱对手，使对手下一次攻击伤害降低。"
  },
  "anxiety-cat-shadow": {
    id: "anxiety-cat-shadow",
    name: "夜影伏",
    type: "shield",
    power: 13,
    cooldown: 1,
    shieldReduction: 0.25,
    effectText: "造成伤害，并提升自身下回合减伤效果",
    description: "伏入阴影后快速突袭，造成伤害，并提升自身下回合减伤效果。"
  },
  "anxiety-bear-slam": {
    id: "anxiety-bear-slam",
    name: "压顶拍",
    type: "attack",
    power: 12,
    cooldown: 0,
    effectText: "造成普通伤害",
    description: "用沉重的熊掌拍击对手，造成普通伤害。"
  },
  "anxiety-bear-burden": {
    id: "anxiety-bear-burden",
    name: "负担堆积",
    type: "shield",
    power: 0,
    cooldown: 2,
    shieldReduction: 0.35,
    debuff: {
      speed: -1,
      duration: 1
    },
    effectText: "提升自身防御，并让对手下回合速度下降",
    description: "将焦虑化为压力，提升自身防御，并让对手下回合速度下降。"
  },
  "anxiety-bear-pressure": {
    id: "anxiety-bear-pressure",
    name: "忧念压制",
    type: "power_attack",
    power: 18,
    cooldown: 1,
    effectText: "造成较高伤害",
    description: "以沉重压力压制对手，造成较高伤害。"
  },
  calm_bump: {
    id: "calm_bump",
    name: "静心撞击",
    type: "attack",
    power: 8,
    cooldown: 0,
    effectText: "专注型基础攻击",
    description: "聆心兔静下心来向前轻撞，造成稳定伤害。"
  },
  listening_shield: {
    id: "listening_shield",
    name: "聆听护盾",
    type: "shield",
    power: 0,
    cooldown: 2,
    shieldReduction: 0.4,
    effectText: "获得护盾，减少下一次受到的伤害",
    description: "聆心兔聆听节奏，撑起柔和护盾。"
  },
  focus_gaze: {
    id: "focus_gaze",
    name: "专注凝视",
    type: "debuff",
    power: 0,
    cooldown: 2,
    debuff: {
      attack: -2,
      speed: -1,
      duration: 1
    },
    effectText: "降低敌方攻击或速度",
    description: "用稳定目光打断对方节奏，降低攻击与速度。"
  },
  flow_settle: {
    id: "flow_settle",
    name: "心流安定",
    type: "heal",
    power: 0,
    cooldown: 3,
    healPercent: 0.25,
    effectText: "恢复自身生命并清除轻度负面状态",
    description: "进入心流状态，恢复自身生命。"
  },
  focus_peck: {
    id: "focus_peck",
    name: "专注啄击",
    type: "attack",
    power: 9,
    cooldown: 0,
    effectText: "专注型基础攻击",
    description: "识光鸦瞄准关键点啄击，造成普通伤害。"
  },
  point_blade: {
    id: "point_blade",
    name: "识点羽刃",
    type: "power_attack",
    power: 12,
    cooldown: 1,
    effectText: "精准打击敌人",
    description: "羽刃精准掠过敌人，造成较高伤害。"
  },
  lock_gaze: {
    id: "lock_gaze",
    name: "锁题目光",
    type: "debuff",
    power: 0,
    cooldown: 2,
    debuff: {
      defense: -2,
      duration: 1
    },
    effectText: "降低敌方防御",
    description: "锁定题目关键点，使敌方防御降低。"
  },
  insight_storm: {
    id: "insight_storm",
    name: "洞察风暴",
    type: "power_attack",
    power: 16,
    cooldown: 3,
    counterEnemyType: "anxiety",
    effectText: "对焦虑型或遗忘型敌人有额外伤害",
    description: "识光鸦掀起洞察风暴，对焦虑型或遗忘型敌人更有效。"
  },
  order_slap: {
    id: "order_slap",
    name: "理序拍击",
    type: "attack",
    power: 8,
    cooldown: 0,
    effectText: "专注型基础攻击",
    description: "理序章用触手整理节奏后拍击敌人。"
  },
  note_flow_shield: {
    id: "note_flow_shield",
    name: "便签护流",
    type: "shield",
    power: 0,
    cooldown: 2,
    shieldReduction: 0.4,
    effectText: "获得护盾",
    description: "便签流形成护盾，减少下一次受到的伤害。"
  },
  summary_bind: {
    id: "summary_bind",
    name: "归纳缠绕",
    type: "debuff",
    power: 0,
    cooldown: 2,
    debuff: {
      speed: -1,
      duration: 1
    },
    effectText: "延长敌方节奏或降低速度",
    description: "用归纳出的线索缠住敌人，降低速度。"
  },
  knowledge_echo: {
    id: "knowledge_echo",
    name: "知识回响",
    type: "heal",
    power: 0,
    cooldown: 3,
    healPercent: 0.24,
    buff: {
      defense: 1,
      duration: 1
    },
    effectText: "恢复自身生命，并略微提升防御",
    description: "知识回响带来恢复，并提升自身防御。"
  }
};

export const battleRewards = {
  defeat: {
    careless_beast: 30,
    forget_shadow: 45,
    anxiety_beast: 70,
    careless_shark: 70,
    careless_tiger: 80,
    careless_rhino: 95,
    "forget-lizard-01": 45,
    "forget-ant-02": 55,
    "forget-chicken-03": 65,
    "anxiety-dog-01": 55,
    "anxiety-cat-02": 65,
    "anxiety-bear-03": 80,
    "focus-rabbit-01": 55,
    "focus-crow-01": 65,
    "focus-octopus-01": 65
  },
  lose: 5,
  firstDailyWinBonus: 20,
  learning: {
    correctAnswer: 5,
    wrongAnswerWithExplanation: 2,
    completeChallengeLevel: 30,
    fiveCorrectStreak: 20,
    completeChapter: 100
  }
};

export const battleBalanceNotes = [
  "云团兽不能太弱，因为它是新手宠。",
  "星火狐打得最快，但血量和防御必须低。",
  "草芽龙前期慢，但防御和血量要明显高。",
  "粗心兽必须简单，让玩家第一战基本能赢。",
  "遗忘怪开始有削弱机制，但伤害不要太高。",
  "焦虑兽可以强一点，用作第一版小Boss。",
  "克制倍率第一版只使用1.25，避免平衡失控。",
  "失败也要给少量经验，避免玩家挫败。",
  "宠物经验主要来自学习，不让小游戏取代做题主线。"
];
