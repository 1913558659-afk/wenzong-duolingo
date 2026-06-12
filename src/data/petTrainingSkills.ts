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

export function trainingSkillCountersEnemy(skill: Pick<PetTrainingSkill, "attribute" | "counterEnemyType">, enemyType: EnemyType) {
  return skill.counterEnemyType === enemyType
    || (skill.attribute === "focus" && enemyType === "anxiety")
    || (skill.attribute === "action" && enemyType === "careless")
    || (skill.attribute === "growth" && enemyType === "forget");
}

export function getTrainingSkillsForPet(pet: BattlePet): PetTrainingSkill[] {
  const plan = petSkillPlans[pet.id] ?? pet.skills.map((skillId, index) => ({
    attribute: pet.attribute,
    baseSkillId: skillId,
    displayDescription: battleSkills[skillId]?.effectText ?? "",
    displayName: battleSkills[skillId]?.name ?? skillId,
    unlockLevel: index < 2 ? 1 : index === 2 ? 3 : 5
  }));

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
