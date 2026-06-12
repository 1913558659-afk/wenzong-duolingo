import type { BattleEnemy, BattlePet, BattleStats } from "@/data/petBattleData";
import type { PartnerChessBuff } from "@/data/partnerChessBuffs";

export type ChessUnitSide = "ally" | "enemy";
export type ChessPosition = "front" | "middle" | "back";

export type ChessUnit = {
  id: string;
  sourceId: string;
  name: string;
  image: string;
  side: ChessUnitSide;
  position: ChessPosition;
  typeLabel: string;
  role: string;
  attribute?: BattlePet["attribute"];
  enemyType?: BattleEnemy["type"];
  maxHp: number;
  hp: number;
  shield: number;
  attack: number;
  defense: number;
  speed: number;
  charge: number;
};

export type AutoBattleResult = {
  allies: ChessUnit[];
  enemies: ChessUnit[];
  logs: string[];
  winner: "ally" | "enemy";
  willLoss: number;
};

function attributeLabel(attribute: BattlePet["attribute"]) {
  return {
    focus: "专注型",
    action: "行动型",
    growth: "积累型"
  }[attribute];
}

function enemyTypeLabel(type: BattleEnemy["type"]) {
  return {
    careless: "粗心型",
    forget: "遗忘型",
    anxiety: "焦虑型",
    focus: "专注型"
  }[type];
}

function isCountering(pet: ChessUnit, enemy: ChessUnit) {
  if (!pet.attribute || !enemy.enemyType) return false;
  return (
    (pet.attribute === "focus" && enemy.enemyType === "anxiety") ||
    (pet.attribute === "action" && enemy.enemyType === "careless") ||
    (pet.attribute === "growth" && enemy.enemyType === "forget")
  );
}

function applyPetBuffs(unit: ChessUnit, buffs: PartnerChessBuff[]) {
  let next = { ...unit };

  for (const buff of buffs) {
    if (buff.effects.teamAttackPercent) next.attack = Math.round(next.attack * (1 + buff.effects.teamAttackPercent));
    if (buff.effects.teamDefensePercent) next.defense = Math.round(next.defense * (1 + buff.effects.teamDefensePercent));
    if (buff.effects.teamShield) next.shield += buff.effects.teamShield;
    if (buff.effects.frontShield && next.position === "front") next.shield += buff.effects.frontShield;
    if (buff.effects.middleAttackPercent && next.position === "middle") next.attack = Math.round(next.attack * (1 + buff.effects.middleAttackPercent));
    if (buff.effects.backCharge && next.position === "back") next.charge += buff.effects.backCharge;
    if (buff.effects.randomCharge && next.position === "middle") next.charge += buff.effects.randomCharge;
    if (buff.effects.petStatBoost?.petId === next.sourceId) {
      next.maxHp += buff.effects.petStatBoost.hp ?? 0;
      next.hp += buff.effects.petStatBoost.hp ?? 0;
      next.attack += buff.effects.petStatBoost.attack ?? 0;
      next.defense += buff.effects.petStatBoost.defense ?? 0;
      next.speed += buff.effects.petStatBoost.speed ?? 0;
    }
    const attributeBoost = buff.effects.attributeBoost;
    if (attributeBoost && attributeBoost.attribute === next.attribute) {
      next.attack = Math.round(next.attack * (1 + (attributeBoost.attackPercent ?? 0)));
      next.defense = Math.round(next.defense * (1 + (attributeBoost.defensePercent ?? 0)));
    }
  }

  return next;
}

export function createAllyFormation(pets: BattlePet[], buffs: PartnerChessBuff[] = []): ChessUnit[] {
  const order: Array<{ petId: string; position: ChessPosition }> = [
    { petId: "grass_dragon", position: "front" },
    { petId: "fire_fox", position: "middle" },
    { petId: "cloud_beast", position: "back" }
  ];

  return order
    .map(({ petId, position }) => {
      const pet = pets.find((item) => item.id === petId);
      if (!pet) return null;
      const unit: ChessUnit = {
        id: `ally-${pet.id}`,
        sourceId: pet.id,
        name: pet.name,
        image: pet.image,
        side: "ally",
        position,
        typeLabel: attributeLabel(pet.attribute),
        role: pet.role,
        attribute: pet.attribute,
        maxHp: pet.baseStats.hp,
        hp: pet.baseStats.hp,
        shield: 0,
        attack: pet.baseStats.attack,
        defense: pet.baseStats.defense,
        speed: pet.baseStats.speed,
        charge: 0
      };
      return applyPetBuffs(unit, buffs);
    })
    .filter((unit): unit is ChessUnit => Boolean(unit));
}

export function createEnemyFormation(enemies: BattleEnemy[]): ChessUnit[] {
  const positions: ChessPosition[] = enemies.length >= 2 ? ["front", "middle"] : ["front"];
  return enemies.map((enemy, index) => {
    const hp = enemy.stats.hp + enemy.level * 5;
    return {
      id: `enemy-${enemy.id}-${index}`,
      sourceId: enemy.id,
      name: enemy.name,
      image: enemy.image,
      side: "enemy",
      position: positions[index] ?? "back",
      typeLabel: enemyTypeLabel(enemy.type),
      role: enemy.role,
      enemyType: enemy.type,
      maxHp: hp,
      hp,
      shield: 0,
      attack: enemy.stats.attack + Math.floor(enemy.level * 1.5),
      defense: enemy.stats.defense + Math.floor(enemy.level / 2),
      speed: enemy.stats.speed,
      charge: 0
    };
  });
}

function firstAlive(units: ChessUnit[]) {
  return units.find((unit) => unit.hp > 0);
}

function totalRemainingHp(units: ChessUnit[]) {
  return units.reduce((sum, unit) => sum + Math.max(0, unit.hp), 0);
}

function totalMaxHp(units: ChessUnit[]) {
  return units.reduce((sum, unit) => sum + unit.maxHp, 0);
}

function takeDamage(unit: ChessUnit, amount: number) {
  let incoming = amount;
  if (unit.shield > 0) {
    const absorbed = Math.min(unit.shield, incoming);
    unit.shield -= absorbed;
    incoming -= absorbed;
  }
  unit.hp = Math.max(0, unit.hp - incoming);
}

export function runPartnerChessBattle({
  allies,
  enemies,
  buffs
}: {
  allies: ChessUnit[];
  enemies: ChessUnit[];
  buffs: PartnerChessBuff[];
}): AutoBattleResult {
  const nextAllies = allies.map((unit) => ({ ...unit }));
  const nextEnemies = enemies.map((unit) => ({ ...unit }));
  const logs: string[] = ["自动战斗开始，伙伴们进入战棋阵位。"];
  const failReduction = buffs.reduce((sum, buff) => sum + (buff.effects.failWillReduction ?? 0), 0);

  for (let tick = 1; tick <= 18; tick += 1) {
    const turnOrder = [...nextAllies, ...nextEnemies].filter((unit) => unit.hp > 0).sort((a, b) => b.speed - a.speed);

    for (const actor of turnOrder) {
      if (actor.hp <= 0) continue;
      const targets = actor.side === "ally" ? nextEnemies : nextAllies;
      const target = firstAlive(targets);
      if (!target) break;

      let damage = Math.max(1, actor.attack + Math.round(actor.charge * 10) - target.defense);

      if (actor.side === "ally") {
        const bonus = buffs.find((buff) => buff.effects.bonusDamageToEnemyType?.enemyType === target.enemyType)?.effects.bonusDamageToEnemyType?.percent ?? 0;
        damage = Math.round(damage * (isCountering(actor, target) ? 1.25 : 1) * (1 + bonus));
      } else {
        const reduction = buffs.find((buff) => buff.effects.reduceDamageFromEnemyType?.enemyType === actor.enemyType)?.effects.reduceDamageFromEnemyType?.percent ?? 0;
        damage = Math.round(damage * (1 - reduction));
      }

      takeDamage(target, damage);
      const skillName = actor.side === "ally" ? (actor.charge > 0.2 ? "协同技能" : "普通攻击") : "压力攻击";
      logs.push(`${actor.name}发动【${skillName}】，对${target.name}造成 ${damage} 点伤害！`);
      actor.charge = Math.min(0.5, actor.charge + 0.08);

      if (!firstAlive(nextEnemies)) {
        logs.push("本回合战斗胜利！");
        return { allies: nextAllies, enemies: nextEnemies, logs, winner: "ally", willLoss: 0 };
      }
      if (!firstAlive(nextAllies)) {
        const remainingRatio = totalRemainingHp(nextEnemies) / Math.max(1, totalMaxHp(nextEnemies));
        const baseLoss = Math.round(15 + remainingRatio * 15);
        const willLoss = Math.max(5, Math.round(baseLoss * (1 - failReduction)));
        logs.push(`本回合战斗失败，学习意志值下降 ${willLoss}。`);
        return { allies: nextAllies, enemies: nextEnemies, logs, winner: "enemy", willLoss };
      }
    }
  }

  const allyHp = totalRemainingHp(nextAllies);
  const enemyHp = totalRemainingHp(nextEnemies);
  if (allyHp >= enemyHp) {
    logs.push("伙伴们稳住阵线，本回合战斗胜利！");
    return { allies: nextAllies, enemies: nextEnemies, logs, winner: "ally", willLoss: 0 };
  }

  const willLoss = Math.max(8, Math.round(20 * (1 - failReduction)));
  logs.push(`战斗进入消耗，我方暂时撤退，学习意志值下降 ${willLoss}。`);
  return { allies: nextAllies, enemies: nextEnemies, logs, winner: "enemy", willLoss };
}
