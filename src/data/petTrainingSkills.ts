import { battleSkills } from "@/data/petBattleData";
import type { BattlePet, BattleSkill, EnemyType, PetAttribute } from "@/data/petBattleData";
import { getPetSpeciesSkillTemplate } from "@/data/petSpeciesMasterData";
import type { BattleStatusType } from "@/data/petTrainingStatuses";

export type PetTrainingSkill = BattleSkill & {
  attribute: PetAttribute;
  baseSkillId: string;
  displayDescription: string;
  displayName: string;
  status?: {
    target: "enemy" | "pet";
    type: BattleStatusType;
  };
  unlockLevel: number;
};

const petSkillPlans: Record<string, Array<{
  attribute: PetAttribute;
  baseSkillId: string;
  cooldown?: number;
  displayDescription: string;
  displayName: string;
  power?: number;
  status?: PetTrainingSkill["status"];
  type?: BattleSkill["type"];
  unlockLevel: number;
}>> = {
  cloud_beast: [
    { attribute: "focus", baseSkillId: "cloud_bump", displayDescription: "专注型基础攻击。", displayName: "云雾冲撞", unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "wind_shield", displayDescription: "获得护盾，吸收下一轮伤害。", displayName: "轻风护盾", status: { target: "pet", type: "shield" }, unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "focus_star", displayDescription: "专注光点，对焦虑型敌人更有效。", displayName: "专注光点", unlockLevel: 3 },
    { attribute: "focus", baseSkillId: "star_heal", displayDescription: "恢复自身生命。", displayName: "星点治愈", unlockLevel: 5 }
  ],
  fire_fox: [
    { attribute: "action", baseSkillId: "fire_tail", displayDescription: "行动型基础攻击。", displayName: "星火扑击", unlockLevel: 1 },
    { attribute: "action", baseSkillId: "flash_claw", cooldown: 1, displayDescription: "快速连击，造成稳定伤害。", displayName: "火星连击", power: 12, unlockLevel: 1 },
    { attribute: "action", baseSkillId: "flame_dash", cooldown: 2, displayDescription: "造成伤害并附加灼烧。", displayName: "灼热印记", power: 6, status: { target: "enemy", type: "burn" }, unlockLevel: 3 },
    { attribute: "action", baseSkillId: "heat_boost", displayDescription: "提升下一次伤害。", displayName: "疾行动能", unlockLevel: 5 }
  ],
  grass_dragon: [
    { attribute: "growth", baseSkillId: "vine_bump", displayDescription: "积累型基础攻击。", displayName: "草芽撞击", power: 7, unlockLevel: 1 },
    { attribute: "growth", baseSkillId: "growth_charge", cooldown: 2, displayDescription: "获得护盾，保护当前伙伴。", displayName: "藤叶守护", status: { target: "pet", type: "shield" }, type: "shield", unlockLevel: 1 },
    { attribute: "growth", baseSkillId: "root_bind", displayDescription: "生长缠绕，对遗忘型敌人更有效。", displayName: "生长缠绕", unlockLevel: 3 },
    { attribute: "growth", baseSkillId: "memory_roots", cooldown: 3, displayDescription: "恢复自身生命。", displayName: "根系恢复", power: 0, status: { target: "pet", type: "shield" }, type: "heal", unlockLevel: 5 }
  ],
  "focus-rabbit-01": [
    { attribute: "focus", baseSkillId: "calm_bump", displayDescription: "专注型基础攻击。", displayName: "静心撞击", power: 8, type: "attack", unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "listening_shield", displayDescription: "获得护盾，减少下一次受到的伤害。", displayName: "聆听护盾", power: 0, status: { target: "pet", type: "shield" }, type: "shield", unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "focus_gaze", cooldown: 2, displayDescription: "降低敌方攻击或速度。", displayName: "专注凝视", power: 0, status: { target: "enemy", type: "anxietyDown" }, type: "debuff", unlockLevel: 3 },
    { attribute: "focus", baseSkillId: "flow_settle", cooldown: 3, displayDescription: "恢复自身生命并清除轻度负面状态。", displayName: "心流安定", power: 0, type: "heal", unlockLevel: 5 }
  ],
  "focus-crow-01": [
    { attribute: "focus", baseSkillId: "focus_peck", displayDescription: "专注型基础攻击。", displayName: "专注啄击", power: 9, type: "attack", unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "point_blade", cooldown: 1, displayDescription: "精准打击敌人。", displayName: "识点羽刃", power: 12, type: "power_attack", unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "lock_gaze", cooldown: 2, displayDescription: "降低敌方防御。", displayName: "锁题目光", power: 0, type: "debuff", unlockLevel: 3 },
    { attribute: "focus", baseSkillId: "insight_storm", cooldown: 3, displayDescription: "对焦虑型或遗忘型敌人有额外伤害。", displayName: "洞察风暴", power: 16, type: "power_attack", unlockLevel: 5 }
  ],
  "focus-octopus-01": [
    { attribute: "focus", baseSkillId: "order_slap", displayDescription: "专注型基础攻击。", displayName: "理序拍击", power: 8, type: "attack", unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "note_flow_shield", cooldown: 2, displayDescription: "获得护盾。", displayName: "便签护流", power: 0, status: { target: "pet", type: "shield" }, type: "shield", unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "summary_bind", cooldown: 2, displayDescription: "延长敌方节奏或降低速度。", displayName: "归纳缠绕", power: 0, status: { target: "enemy", type: "forget" }, type: "debuff", unlockLevel: 3 },
    { attribute: "focus", baseSkillId: "knowledge_echo", cooldown: 3, displayDescription: "恢复自身生命，并略微提升防御。", displayName: "知识回响", power: 0, type: "heal", unlockLevel: 5 }
  ]
};

function capturedPetSkillPlan(pet: BattlePet): typeof petSkillPlans[string] {
  if (pet.attribute === "action") {
    return [
      { attribute: "action", baseSkillId: "action_basic_hit", displayDescription: "行动型伙伴的基础冲击。", displayName: "行动撞击", power: 8, unlockLevel: 1 },
      { attribute: "action", baseSkillId: "action_quick_combo", cooldown: 1, displayDescription: "快速连击形成冲击，造成稳定伤害。", displayName: "迅捷连击", power: 11, unlockLevel: 1 },
      { attribute: "action", baseSkillId: "action_tempo_down", cooldown: 2, displayDescription: "压低目标节奏，使下一次伤害降低。", displayName: "节奏压制", power: 0, status: { target: "enemy", type: "anxietyDown" }, type: "debuff", unlockLevel: 3 },
      { attribute: "action", baseSkillId: "action_burst", cooldown: 3, displayDescription: "抓住行动节奏爆发，造成较高伤害。", displayName: "行动爆发", power: 15, unlockLevel: 5 }
    ];
  }

  if (pet.attribute === "growth") {
    return [
      { attribute: "growth", baseSkillId: "growth_basic_hit", displayDescription: "积累型伙伴的基础攻击。", displayName: "积累撞击", power: 8, unlockLevel: 1 },
      { attribute: "growth", baseSkillId: "growth_guard", cooldown: 2, displayDescription: "稳固自身节奏，获得防护。", displayName: "成长守护", power: 0, status: { target: "pet", type: "shield" }, type: "shield", unlockLevel: 1 },
      { attribute: "growth", baseSkillId: "growth_bind", cooldown: 1, displayDescription: "积累力量形成冲击，对遗忘型敌人更有效。", displayName: "积累冲击", power: 12, unlockLevel: 3 },
      { attribute: "growth", baseSkillId: "growth_recover", cooldown: 3, displayDescription: "回收成长能量，恢复自身生命。", displayName: "成长回流", power: 0, type: "heal", unlockLevel: 5 }
    ];
  }

  return [
    { attribute: "focus", baseSkillId: "focus_basic_hit", displayDescription: "专注型伙伴的基础攻击。", displayName: "专注撞击", power: 8, unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "focus_light", cooldown: 1, displayDescription: "凝聚专注光点，造成伤害。", displayName: "专注光束", power: 10, type: "power_attack", unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "focus_down", cooldown: 2, displayDescription: "稳定节奏压制目标，使下一次伤害降低。", displayName: "安定压制", power: 0, status: { target: "enemy", type: "anxietyDown" }, type: "debuff", unlockLevel: 3 },
    { attribute: "focus", baseSkillId: "focus_burst", cooldown: 3, displayDescription: "集中精神后爆发，造成高额伤害。", displayName: "心流爆发", power: 16, unlockLevel: 5 }
  ];
}

export function trainingSkillCountersEnemy(skill: Pick<PetTrainingSkill, "attribute" | "baseSkillId" | "counterEnemyType">, enemyType: EnemyType) {
  return skill.counterEnemyType === enemyType
    || (skill.baseSkillId === "insight_storm" && enemyType === "forget")
    || (skill.attribute === "focus" && enemyType === "anxiety")
    || (skill.attribute === "action" && enemyType === "careless")
    || (skill.attribute === "growth" && enemyType === "forget");
}

export function getSpeciesSkillTemplate(pet: BattlePet): PetTrainingSkill[] {
  const masterTemplate = getPetSpeciesSkillTemplate(pet.id);
  if (masterTemplate) {
    return masterTemplate.map((skill) => ({
      cooldown: skill.cooldown,
      description: skill.displayDescription,
      effectText: skill.displayDescription,
      id: skill.id,
      name: skill.displayName,
      power: skill.power,
      type: skill.type,
      attribute: skill.attribute,
      baseSkillId: skill.baseSkillId,
      counterEnemyType: skill.counterEnemyType,
      displayDescription: skill.displayDescription,
      displayName: skill.displayName,
      status: skill.status,
      unlockLevel: skill.unlockLevel
    }));
  }

  const plan = petSkillPlans[pet.id] ?? (pet.skills.length > 0 ? pet.skills.map((skillId, index) => ({
    attribute: pet.attribute,
    baseSkillId: skillId,
    displayDescription: battleSkills[skillId]?.effectText ?? "",
    displayName: battleSkills[skillId]?.name ?? skillId,
    unlockLevel: index < 2 ? 1 : index === 2 ? 3 : 5
  })) : capturedPetSkillPlan(pet));

  const duplicatedBaseIds = new Set(plan
    .map((item) => item.baseSkillId)
    .filter((skillId, index, skillIds) => skillIds.indexOf(skillId) !== index));

  return plan.map((item, index) => {
    const fallbackType = item.type ?? ((item.power ?? 8) > 0 ? "attack" : "buff");
    const baseSkill = battleSkills[item.baseSkillId] ?? {
      cooldown: item.cooldown ?? 0,
      description: item.displayDescription,
      effectText: item.displayDescription,
      id: item.baseSkillId,
      name: item.displayName,
      power: item.power ?? (fallbackType === "heal" || fallbackType === "shield" || fallbackType === "buff" || fallbackType === "debuff" ? 0 : 8),
      type: fallbackType
    };
    const templateSkillId = duplicatedBaseIds.has(item.baseSkillId) ? `${item.baseSkillId}_${index}` : item.baseSkillId;
    return {
      ...baseSkill,
      attribute: item.attribute,
      baseSkillId: item.baseSkillId,
      cooldown: item.cooldown ?? baseSkill.cooldown,
      description: item.displayDescription,
      displayDescription: item.displayDescription,
      displayName: item.displayName,
      effectText: item.displayDescription,
      id: templateSkillId,
      name: item.displayName,
      power: item.power ?? baseSkill.power,
      status: item.status,
      type: item.type ?? baseSkill.type,
      unlockLevel: item.unlockLevel
    };
  });
}

export function getTrainingSkillsForPet(pet: BattlePet): PetTrainingSkill[] {
  return getSpeciesSkillTemplate(pet);
}

export function getSkillsByIdsForPet(pet: BattlePet, skillIds: string[]) {
  const template = getSpeciesSkillTemplate(pet);
  const byId = new Map(template.map((skill) => [skill.id, skill]));
  return skillIds.map((skillId) => byId.get(skillId)).filter((skill): skill is PetTrainingSkill => Boolean(skill));
}
