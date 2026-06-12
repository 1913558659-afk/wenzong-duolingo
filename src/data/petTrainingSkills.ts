import { battleSkills } from "@/data/petBattleData";
import type { BattlePet, BattleSkill, EnemyType, PetAttribute } from "@/data/petBattleData";
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
  ]
};

function capturedPetSkillPlan(pet: BattlePet): typeof petSkillPlans[string] {
  if (pet.attribute === "action") {
    return [
      { attribute: "action", baseSkillId: "fire_tail", displayDescription: "粗心型伙伴的基础冲击。", displayName: "马虎撞击", power: 8, unlockLevel: 1 },
      { attribute: "action", baseSkillId: "flame_dash", cooldown: 1, displayDescription: "乱纸飞散形成冲击，造成稳定伤害。", displayName: "乱纸冲击", power: 11, unlockLevel: 1 },
      { attribute: "action", baseSkillId: "distract_sneeze", cooldown: 2, displayDescription: "压低目标节奏，使下一次伤害降低。", displayName: "粗心压制", power: 0, status: { target: "enemy", type: "anxietyDown" }, type: "debuff", unlockLevel: 3 },
      { attribute: "action", baseSkillId: "flame_dash", cooldown: 3, displayDescription: "把失误转化为反击机会，造成较高伤害。", displayName: "失误反击", power: 15, unlockLevel: 5 }
    ];
  }

  if (pet.attribute === "growth") {
    return [
      { attribute: "growth", baseSkillId: "vine_bump", displayDescription: "遗忘型伙伴的基础碎片攻击。", displayName: "记忆碎击", power: 8, unlockLevel: 1 },
      { attribute: "growth", baseSkillId: "blank_fog", cooldown: 2, displayDescription: "释放遗忘雾气，使目标随机技能冷却延长。", displayName: "遗忘雾气", power: 0, status: { target: "enemy", type: "forget" }, type: "debuff", unlockLevel: 1 },
      { attribute: "growth", baseSkillId: "fragment_hit", cooldown: 1, displayDescription: "断片聚合形成冲击，对遗忘型敌人更有效。", displayName: "断片冲击", power: 12, unlockLevel: 3 },
      { attribute: "growth", baseSkillId: "memory_roots", cooldown: 3, displayDescription: "回收记忆能量，恢复自身生命。", displayName: "记忆回流", power: 0, type: "heal", unlockLevel: 5 }
    ];
  }

  return [
    { attribute: "focus", baseSkillId: "cloud_bump", displayDescription: "焦虑型伙伴的基础扑击。", displayName: "紧张扑击", power: 8, unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "pressure_scream", cooldown: 1, displayDescription: "释放压迫波纹，造成伤害。", displayName: "压迫波纹", power: 10, type: "power_attack", unlockLevel: 1 },
    { attribute: "focus", baseSkillId: "pressure_scream", cooldown: 2, displayDescription: "用焦虑压制目标，使下一次伤害降低。", displayName: "焦虑压制", power: 0, status: { target: "enemy", type: "anxietyDown" }, type: "debuff", unlockLevel: 3 },
    { attribute: "focus", baseSkillId: "countdown_impact", cooldown: 3, displayDescription: "积蓄压力后爆发，造成高额伤害。", displayName: "重压爆发", power: 16, unlockLevel: 5 }
  ];
}

export function trainingSkillCountersEnemy(skill: Pick<PetTrainingSkill, "attribute" | "counterEnemyType">, enemyType: EnemyType) {
  return skill.counterEnemyType === enemyType
    || (skill.attribute === "focus" && enemyType === "anxiety")
    || (skill.attribute === "action" && enemyType === "careless")
    || (skill.attribute === "growth" && enemyType === "forget");
}

export function getTrainingSkillsForPet(pet: BattlePet): PetTrainingSkill[] {
  const plan = petSkillPlans[pet.id] ?? (pet.skills.length > 0 ? pet.skills.map((skillId, index) => ({
    attribute: pet.attribute,
    baseSkillId: skillId,
    displayDescription: battleSkills[skillId]?.effectText ?? "",
    displayName: battleSkills[skillId]?.name ?? skillId,
    unlockLevel: index < 2 ? 1 : index === 2 ? 3 : 5
  })) : capturedPetSkillPlan(pet));

  return plan.map((item) => {
    const baseSkill = battleSkills[item.baseSkillId];
    return {
      ...baseSkill,
      attribute: item.attribute,
      baseSkillId: item.baseSkillId,
      cooldown: item.cooldown ?? baseSkill.cooldown,
      description: item.displayDescription,
      displayDescription: item.displayDescription,
      displayName: item.displayName,
      effectText: item.displayDescription,
      name: item.displayName,
      power: item.power ?? baseSkill.power,
      status: item.status,
      type: item.type ?? baseSkill.type,
      unlockLevel: item.unlockLevel
    };
  });
}
