import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import Phaser from "phaser";

export type TerritoryCanvasOwner = "player" | "enemy" | "neutral";
export type TerritoryCanvasTileType =
  | "buildable"
  | "enemy_base"
  | "neutral"
  | "player_base"
  | "question"
  | "resource"
  | "water";

export type TerritoryCanvasTile = {
  blocked: boolean;
  building?: "camp" | "mine" | "tower";
  buildingLevel?: number;
  col: number;
  cost: number;
  id: string;
  owner: TerritoryCanvasOwner;
  revealed: boolean;
  row: number;
  type: TerritoryCanvasTileType;
};

export type TerritoryCanvasActionResult = {
  cost?: number;
  ok: boolean;
  tile?: TerritoryCanvasTile;
  message: string;
};

export type TerritoryCanvasBaseHp = {
  enemy: number;
  player: number;
};

export type TerritoryCanvasBattleStats = {
  baseDamageDealt: number;
  buildingsDestroyed: number;
  enemiesDefeated: number;
  enemyUnitCount: number;
  playerUnitCount: number;
  playerUnitsLost: number;
};

export type PhaserTerritoryWarCanvasHandle = {
  buildCampOnSelectedTile: () => TerritoryCanvasActionResult;
  buildMineOnSelectedTile: () => TerritoryCanvasActionResult;
  buildTowerOnSelectedTile: () => TerritoryCanvasActionResult;
  clearUnits: () => void;
  debugTriggerBossEvent: () => void;
  applyQuestionResult: (tileId: string, correct: boolean) => TerritoryCanvasActionResult;
  occupySelectedTile: () => TerritoryCanvasActionResult;
  resetBattlefield: () => void;
  resetView: () => void;
  useExpeditionSkill: (petId: string) => TerritoryCanvasActionResult;
  upgradeSelectedBuilding: () => TerritoryCanvasActionResult;
  zoomIn: () => void;
  zoomOut: () => void;
};

type PhaserTerritoryWarCanvasProps = {
  battleActive?: boolean;
  bossName?: string;
  enemyBaseHp?: number;
  expeditionPartnerIds?: string[];
  onBaseHpChanged?: (hp: TerritoryCanvasBaseHp) => void;
  onBattleEnd?: (status: "victory" | "defeat", hp: TerritoryCanvasBaseHp, stats: TerritoryCanvasBattleStats) => void;
  onQuestionTileRequested?: (tile: TerritoryCanvasTile) => void;
  onResourceDelta?: (amount: number, reason: string) => void;
  onBattleStatsChanged?: (stats: TerritoryCanvasBattleStats) => void;
  onLog?: (message: string) => void;
  playerBaseHp?: number;
  onTileSelected?: (tile: TerritoryCanvasTile) => void;
};

const rows = 10;
const cols = 12;
const occupyCost = 25;
const campCost = 100;
const mineCost = 50;
const towerCost = 120;
const upgradeCost = 250;
const playerBaseTileId = tileId(8, 1);
const enemyBaseTileId = tileId(1, 10);

type BattleUnitSide = "enemy" | "player";

type TerritoryBattleUnit = {
  attack: number;
  attackCooldown: number;
  currentCooldown: number;
  currentHexId: string;
  hp: number;
  id: string;
  maxHp: number;
  nextHexId?: string;
  role: "basic";
  side: BattleUnitSide;
  speed: number;
  state: "attacking" | "moving" | "idle";
  targetHexId?: string;
  x: number;
  y: number;
};

type TemporaryBattleBuff = {
  expiresAt: number;
  type: "boss_damage" | "player_attack" | "player_heal" | "spawn_speed";
  value: number;
};

function tileId(row: number, col: number) {
  return `${row}-${col}`;
}

function cloneTile(tile: TerritoryCanvasTile): TerritoryCanvasTile {
  return { ...tile };
}

function createBattlefieldTiles(): TerritoryCanvasTile[] {
  const water = new Set(["3-5", "4-5", "5-5", "4-6", "5-6", "6-6"]);
  const resource = new Set(["2-3", "6-3", "3-8", "7-8"]);
  const question = new Set(["1-4", "4-3", "2-7", "6-9"]);
  const playerLand = new Set(["8-1", "8-2", "7-1", "7-2", "9-1", "9-2", "8-3"]);
  const enemyLand = new Set(["1-9", "1-10", "2-9", "2-10", "0-9", "0-10", "1-8"]);

  const tiles: TerritoryCanvasTile[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const id = tileId(row, col);
      const isPlayerBase = row === 8 && col === 1;
      const isEnemyBase = row === 1 && col === 10;
      const blocked = water.has(id);
      const type: TerritoryCanvasTileType = isPlayerBase
        ? "player_base"
        : isEnemyBase
          ? "enemy_base"
          : blocked
            ? "water"
            : resource.has(id)
              ? "resource"
              : question.has(id)
                ? "question"
                : "buildable";
      const owner: TerritoryCanvasOwner = isPlayerBase || playerLand.has(id)
        ? "player"
        : isEnemyBase || enemyLand.has(id)
          ? "enemy"
          : "neutral";
      tiles.push({
        blocked,
        col,
        cost: type === "resource" ? mineCost : occupyCost,
        id,
        owner,
        revealed: true,
        row,
        type
      });
    }
  }
  return tiles;
}

function hexPoints(radius: number) {
  const points: number[] = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = Phaser.Math.DegToRad(60 * index - 30);
    points.push(radius * Math.cos(angle), radius * Math.sin(angle));
  }
  return points;
}

function tileColor(tile: TerritoryCanvasTile) {
  if (tile.type === "water") return 0x58b8ee;
  if (tile.type === "player_base") return 0xf3b73f;
  if (tile.type === "enemy_base") return 0x6d4ed6;
  if (tile.owner === "player") return 0xf8cf70;
  if (tile.owner === "enemy") return 0x9273e8;
  if (tile.type === "resource") return 0xdff5bc;
  if (tile.type === "question") return 0xdbeafe;
  return 0xded9ec;
}

function tileStroke(tile: TerritoryCanvasTile, selected: boolean) {
  if (selected) return 0x159ca8;
  if (tile.owner === "player") return 0xd99a18;
  if (tile.owner === "enemy") return 0x5d45be;
  if (tile.type === "water") return 0x2f9bd8;
  return 0xffffff;
}

function tileName(tile: TerritoryCanvasTile) {
  if (tile.type === "player_base") return "学习基地";
  if (tile.type === "enemy_base") return "迷雾核心";
  if (tile.type === "water") return "水域";
  if (tile.type === "resource") return tile.building === "mine" ? "知识矿点" : "知识矿脉";
  if (tile.type === "question") return "知识挑战";
  if (tile.building === "camp") return `伙伴营地 Lv.${tile.buildingLevel ?? 1}`;
  return "可建造地";
}

function neighborOffsets(row: number) {
  return row % 2 === 0
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
}

function isAdjacentToPlayer(tiles: TerritoryCanvasTile[], tile: TerritoryCanvasTile) {
  return neighborOffsets(tile.row).some(([dr, dc]) => {
    const neighbor = tiles.find((item) => item.row === tile.row + dr && item.col === tile.col + dc);
    return neighbor?.owner === "player" && !neighbor.blocked;
  });
}

class TerritoryWarBattlefieldScene extends Phaser.Scene {
  private content?: Phaser.GameObjects.Container;
  private dragStart?: { pointerX: number; pointerY: number; scrollX: number; scrollY: number };
  private battleActive = true;
  private baseHp: TerritoryCanvasBaseHp;
  private baseHpMax: TerritoryCanvasBaseHp;
  private battlefieldStartedAt = 0;
  private bossName = "迷雾核心";
  private buildingSpawnTimes = new Map<string, number>();
  private buildingAttackTimes = new Map<string, number>();
  private expeditionPartnerIds: string[];
  private lastBossAttackBuffAt = 0;
  private lastBossWaveAt = 0;
  private lastEnemyBaseSpawn = 0;
  private lastMineIncomeAt = 0;
  private lastPlayerBaseSpawn = 0;
  private lastRabbitHealAt = 0;
  private lastStatsNotifyAt = 0;
  private nextUnitId = 1;
  private onBaseHpChanged?: (hp: TerritoryCanvasBaseHp) => void;
  private onBattleEnd?: (status: "victory" | "defeat", hp: TerritoryCanvasBaseHp, stats: TerritoryCanvasBattleStats) => void;
  private onBattleStatsChanged?: (stats: TerritoryCanvasBattleStats) => void;
  private onLog?: (message: string) => void;
  private onQuestionTileRequested?: (tile: TerritoryCanvasTile) => void;
  private onResourceDelta?: (amount: number, reason: string) => void;
  private onTileSelected?: (tile: TerritoryCanvasTile) => void;
  private radius = 42;
  private selectedTileId = playerBaseTileId;
  private stats: TerritoryCanvasBattleStats = {
    baseDamageDealt: 0,
    buildingsDestroyed: 0,
    enemiesDefeated: 0,
    enemyUnitCount: 0,
    playerUnitCount: 0,
    playerUnitsLost: 0
  };
  private stopped = false;
  private temporaryBuffs: TemporaryBattleBuff[] = [];
  private tiles: TerritoryCanvasTile[] = createBattlefieldTiles();
  private unitViews = new Map<string, Phaser.GameObjects.Container>();
  private units: TerritoryBattleUnit[] = [];

  constructor(options: PhaserTerritoryWarCanvasProps) {
    super("TerritoryWarBattlefieldScene");
    this.battleActive = options.battleActive ?? true;
    this.bossName = options.bossName ?? this.bossName;
    this.baseHp = {
      enemy: options.enemyBaseHp ?? 120,
      player: options.playerBaseHp ?? 110
    };
    this.baseHpMax = { ...this.baseHp };
    this.expeditionPartnerIds = options.expeditionPartnerIds ?? [];
    this.onBaseHpChanged = options.onBaseHpChanged;
    this.onBattleEnd = options.onBattleEnd;
    this.onBattleStatsChanged = options.onBattleStatsChanged;
    this.onLog = options.onLog;
    this.onQuestionTileRequested = options.onQuestionTileRequested;
    this.onResourceDelta = options.onResourceDelta;
    this.onTileSelected = options.onTileSelected;
  }

  create() {
    this.cameras.main.setBackgroundColor("#f7f3e7");
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.dragStart = {
          pointerX: pointer.x,
          pointerY: pointer.y,
          scrollX: this.cameras.main.scrollX,
          scrollY: this.cameras.main.scrollY
        };
      }
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.dragStart || !pointer.isDown) return;
      const camera = this.cameras.main;
      camera.scrollX = this.dragStart.scrollX - (pointer.x - this.dragStart.pointerX) / camera.zoom;
      camera.scrollY = this.dragStart.scrollY - (pointer.y - this.dragStart.pointerY) / camera.zoom;
    });
    this.input.on("pointerup", () => {
      this.dragStart = undefined;
    });
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) => {
      this.setZoom(this.cameras.main.zoom + (dy > 0 ? -0.08 : 0.08));
    });
    this.scale.on("resize", () => this.fitView());
    this.draw();
    this.fitView();
    this.battlefieldStartedAt = this.time.now;
    this.lastPlayerBaseSpawn = this.time.now - 1200;
    this.lastEnemyBaseSpawn = this.time.now - 300;
    this.notifyBaseHp();
    this.notifyStatsThrottled();
    const selected = this.getSelectedTile();
    if (selected) this.onTileSelected?.(cloneTile(selected));
  }

  update(_time: number, delta: number) {
    if (!this.battleActive || this.stopped) return;
    this.runBattleTick(delta);
  }

  buildCampOnSelectedTile(): TerritoryCanvasActionResult {
    const tile = this.getSelectedTile();
    if (!tile) return { message: "请先选择地块。", ok: false };
    if (tile.owner !== "player" || tile.blocked || tile.type === "player_base" || tile.type === "enemy_base") return { message: "只能在己方可建造地块建造伙伴营地。", ok: false, tile: cloneTile(tile) };
    if (tile.building) return { message: "该地块已有建筑。", ok: false, tile: cloneTile(tile) };
    tile.building = "camp";
    tile.buildingLevel = 1;
    this.draw();
    this.onTileSelected?.(cloneTile(tile));
    return { cost: campCost, message: "建造了伙伴营地。", ok: true, tile: cloneTile(tile) };
  }

  buildMineOnSelectedTile(): TerritoryCanvasActionResult {
    const tile = this.getSelectedTile();
    if (!tile) return { message: "请先选择地块。", ok: false };
    if (tile.owner !== "player" || tile.type !== "resource") return { message: "只能在已占领资源地建造知识矿点。", ok: false, tile: cloneTile(tile) };
    if (tile.building) return { message: "该资源点已经激活。", ok: false, tile: cloneTile(tile) };
    tile.building = "mine";
    tile.buildingLevel = 1;
    this.draw();
    this.onTileSelected?.(cloneTile(tile));
    return { cost: mineCost, message: "激活了知识矿点。", ok: true, tile: cloneTile(tile) };
  }

  buildTowerOnSelectedTile(): TerritoryCanvasActionResult {
    const tile = this.getSelectedTile();
    if (!tile) return { message: "请先选择地块。", ok: false };
    if (tile.owner !== "player" || tile.blocked || tile.type !== "buildable") return { message: "只能在己方普通地块建造防御塔。", ok: false, tile: cloneTile(tile) };
    if (tile.building) return { message: "该地块已有建筑。", ok: false, tile: cloneTile(tile) };
    tile.building = "tower";
    tile.buildingLevel = 1;
    this.draw();
    this.onTileSelected?.(cloneTile(tile));
    return { cost: towerCost, message: "建造了知识防御塔。", ok: true, tile: cloneTile(tile) };
  }

  occupySelectedTile(): TerritoryCanvasActionResult {
    const tile = this.getSelectedTile();
    if (!tile) return { message: "请先选择地块。", ok: false };
    if (tile.blocked || tile.type === "water") return { message: "水域无法占领。", ok: false, tile: cloneTile(tile) };
    if (tile.type === "enemy_base") return { message: "迷雾核心不能直接占领。", ok: false, tile: cloneTile(tile) };
    if (tile.type === "question") return { message: "知识挑战格需要先答题，答对后才能占领。", ok: false, tile: cloneTile(tile) };
    if (tile.owner === "player") return { message: "这片地块已经属于我方。", ok: false, tile: cloneTile(tile) };
    if (!isAdjacentToPlayer(this.tiles, tile)) return { message: "只能占领相邻我方领地的地块。", ok: false, tile: cloneTile(tile) };
    tile.owner = "player";
    this.draw();
    this.onTileSelected?.(cloneTile(tile));
    return { cost: tile.type === "resource" ? mineCost : occupyCost, message: `占领了 ${tileName(tile)}。`, ok: true, tile: cloneTile(tile) };
  }

  applyQuestionResult(tileIdValue: string, correct: boolean): TerritoryCanvasActionResult {
    const tile = this.tiles.find((item) => item.id === tileIdValue);
    if (!tile || tile.type !== "question") return { message: "没有找到对应的知识挑战格。", ok: false };
    if (correct) {
      tile.owner = "player";
      tile.cost = 0;
      this.showFloatingText(this.tileCenter(tile).x, this.tileCenter(tile).y - 30, "+60", "#159ca8");
      this.draw();
      this.onTileSelected?.(cloneTile(tile));
      return { message: "答题成功，知识挑战格已归入我方领地。", ok: true, tile: cloneTile(tile) };
    }
    this.temporaryBuffs.push({ expiresAt: this.time.now + 15000, type: "player_attack", value: -0.05 });
    this.showFloatingText(this.tileCenter(tile).x, this.tileCenter(tile).y - 30, "迷雾增强", "#7b4bd6");
    return { message: "答错了，题目格暂未占领，迷雾短暂压制我方攻击。", ok: true, tile: cloneTile(tile) };
  }

  resetBattlefield() {
    this.tiles = createBattlefieldTiles();
    this.selectedTileId = playerBaseTileId;
    this.units = [];
    this.unitViews.forEach((view) => view.destroy());
    this.unitViews.clear();
    this.buildingSpawnTimes.clear();
    this.buildingAttackTimes.clear();
    this.nextUnitId = 1;
    this.stopped = false;
    this.baseHp = { ...this.baseHpMax };
    this.stats = {
      baseDamageDealt: 0,
      buildingsDestroyed: 0,
      enemiesDefeated: 0,
      enemyUnitCount: 0,
      playerUnitCount: 0,
      playerUnitsLost: 0
    };
    this.battlefieldStartedAt = this.time.now;
    this.lastPlayerBaseSpawn = this.time.now - 1200;
    this.lastEnemyBaseSpawn = this.time.now - 300;
    this.lastBossWaveAt = this.time.now;
    this.lastBossAttackBuffAt = this.time.now;
    this.lastMineIncomeAt = this.time.now;
    this.lastRabbitHealAt = this.time.now;
    this.temporaryBuffs = [];
    this.draw();
    this.fitView();
    this.notifyBaseHp();
    this.notifyStats();
    const selected = this.getSelectedTile();
    if (selected) this.onTileSelected?.(cloneTile(selected));
  }

  clearUnits() {
    this.units = [];
    this.unitViews.forEach((view) => view.destroy());
    this.unitViews.clear();
    this.notifyStats();
  }

  debugTriggerBossEvent() {
    this.spawnUnit("enemy", enemyBaseTileId);
    this.spawnUnit("enemy", enemyBaseTileId);
    this.onLog?.(`${this.bossName} 立刻召唤了一波迷雾单位。`);
  }

  resetView() {
    this.fitView();
  }

  setZoom(nextZoom: number) {
    this.cameras.main.setZoom(Phaser.Math.Clamp(nextZoom, 0.62, 1.72));
  }

  upgradeSelectedBuilding(): TerritoryCanvasActionResult {
    const tile = this.getSelectedTile();
    if (!tile) return { message: "请先选择地块。", ok: false };
    if (!tile.building) return { message: "该地块没有可升级建筑。", ok: false, tile: cloneTile(tile) };
    if ((tile.buildingLevel ?? 1) >= 2) return { message: "该建筑已是当前骨架版最高等级。", ok: false, tile: cloneTile(tile) };
    tile.buildingLevel = 2;
    this.draw();
    this.onTileSelected?.(cloneTile(tile));
    return { cost: upgradeCost, message: `${tileName(tile)} 升级为 Lv.2。`, ok: true, tile: cloneTile(tile) };
  }

  zoomIn() {
    this.setZoom(this.cameras.main.zoom + 0.14);
  }

  zoomOut() {
    this.setZoom(this.cameras.main.zoom - 0.14);
  }

  useExpeditionSkill(petId: string): TerritoryCanvasActionResult {
    const now = this.time.now;
    if (petId === "cloud_beast") {
      this.baseHp.player = Math.min(this.baseHpMax.player + 20, this.baseHp.player + 20);
      this.notifyBaseHp();
      this.draw();
      return { message: "云盾守护生效：学习基地护盾 +20。", ok: true };
    }
    if (petId === "fire_fox") {
      this.temporaryBuffs.push({ expiresAt: now + 12000, type: "player_attack", value: 0.15 });
      return { message: "星火冲锋生效：我方单位攻击 +15%，持续 12 秒。", ok: true };
    }
    if (petId === "grass_dragon") {
      for (const unit of this.units.filter((item) => item.side === "player")) {
        unit.hp = Math.min(unit.maxHp, unit.hp + 6);
      }
      this.temporaryBuffs.push({ expiresAt: now + 10000, type: "player_heal", value: 0.35 });
      return { message: "根系庇护生效：伙伴小队持续恢复。", ok: true };
    }
    if (petId === "focus-rabbit-01") {
      this.baseHp.player = Math.min(this.baseHpMax.player, this.baseHp.player + 12);
      this.notifyBaseHp();
      this.draw();
      return { message: "静心恢复生效：学习基地 HP +12。", ok: true };
    }
    if (petId === "focus-crow-01") {
      this.temporaryBuffs.push({ expiresAt: now + 12000, type: "boss_damage", value: 0.2 });
      return { message: "题眼锁定生效：对 Boss 伤害 +20%，持续 12 秒。", ok: true };
    }
    if (petId === "focus-octopus-01") {
      this.temporaryBuffs.push({ expiresAt: now + 12000, type: "spawn_speed", value: 0.2 });
      return { message: "队列整理生效：伙伴据点出兵速度 +20%，持续 12 秒。", ok: true };
    }
    this.temporaryBuffs.push({ expiresAt: now + 10000, type: "player_attack", value: 0.08 });
    return { message: "伙伴协力生效：我方单位攻击 +8%，持续 10 秒。", ok: true };
  }

  updateRuntimeOptions(options: Pick<PhaserTerritoryWarCanvasProps, "battleActive" | "bossName" | "enemyBaseHp" | "expeditionPartnerIds" | "onBaseHpChanged" | "onBattleEnd" | "onBattleStatsChanged" | "onLog" | "onQuestionTileRequested" | "onResourceDelta" | "onTileSelected" | "playerBaseHp">) {
    this.battleActive = options.battleActive ?? this.battleActive;
    this.bossName = options.bossName ?? this.bossName;
    this.expeditionPartnerIds = options.expeditionPartnerIds ?? this.expeditionPartnerIds;
    this.onBaseHpChanged = options.onBaseHpChanged;
    this.onBattleEnd = options.onBattleEnd;
    this.onBattleStatsChanged = options.onBattleStatsChanged;
    this.onLog = options.onLog;
    this.onQuestionTileRequested = options.onQuestionTileRequested;
    this.onResourceDelta = options.onResourceDelta;
    this.onTileSelected = options.onTileSelected;
    if (!this.units.length && !this.stopped) {
      this.baseHp = {
        enemy: options.enemyBaseHp ?? this.baseHp.enemy,
        player: options.playerBaseHp ?? this.baseHp.player
      };
      this.baseHpMax = {
        enemy: Math.max(this.baseHpMax.enemy, this.baseHp.enemy),
        player: Math.max(this.baseHpMax.player, this.baseHp.player)
      };
      this.notifyBaseHp();
    }
  }

  private runBattleTick(delta: number) {
    const now = this.time.now;
    this.temporaryBuffs = this.temporaryBuffs.filter((buff) => buff.expiresAt > now);
    this.spawnUnits(now);
    this.applyBossEvents(now);
    this.applyMineIncome(now);
    this.applyRabbitHeal(now);
    this.applyTowerAttacks(now);
    this.applyPlayerRegen(delta);
    for (const unit of [...this.units]) {
      if (unit.hp <= 0) continue;
      this.updateUnit(unit, delta);
    }
    this.units = this.units.filter((unit) => unit.hp > 0);
    this.syncUnitViews();
    this.notifyStatsThrottled();
  }

  private spawnUnits(now: number) {
    const elapsed = now - this.battlefieldStartedAt;
    const spawnBuff = this.buffAmount("spawn_speed");
    const enemyDelayBonus = this.hasPartner("forget_shadow") ? 1.1 : 1;
    const earlyRushBonus = this.hasPartner("anxiety_beast") && elapsed <= 20000 ? 0.85 : 1;
    const playerBaseInterval = 4000 * earlyRushBonus;
    const enemyBaseInterval = 4500 * enemyDelayBonus;
    if (now - this.lastPlayerBaseSpawn >= playerBaseInterval) {
      this.spawnUnit("player", playerBaseTileId);
      this.lastPlayerBaseSpawn = now;
      this.onLog?.("学习基地派出了一名伙伴小队。");
    }
    if (now - this.lastEnemyBaseSpawn >= enemyBaseInterval) {
      this.spawnUnit("enemy", enemyBaseTileId);
      this.lastEnemyBaseSpawn = now;
      this.onLog?.("迷雾核心派出了一名迷雾小怪。");
    }
    for (const tile of this.tiles) {
      if (tile.building !== "camp" || tile.owner !== "player") continue;
      const level = tile.buildingLevel ?? 1;
      const octopusBonus = this.hasPartner("focus-octopus-01") ? 0.92 : 1;
      const interval = (level === 2 ? 2600 : 3500) * octopusBonus * Math.max(0.65, 1 - spawnBuff);
      const last = this.buildingSpawnTimes.get(tile.id) ?? now;
      if (!this.buildingSpawnTimes.has(tile.id)) this.buildingSpawnTimes.set(tile.id, now - 900);
      if (now - last >= interval) {
        this.spawnUnit("player", tile.id);
        this.buildingSpawnTimes.set(tile.id, now);
        this.onLog?.(`${tileName(tile)} 派出伙伴小队。`);
      }
    }
  }

  private applyBossEvents(now: number) {
    if (now - this.lastBossWaveAt >= 20000) {
      this.lastBossWaveAt = now;
      this.spawnUnit("enemy", enemyBaseTileId);
      this.spawnUnit("enemy", enemyBaseTileId);
      this.onLog?.(`${this.bossName} 召唤一波迷雾单位。`);
    }
    if (now - this.lastBossAttackBuffAt >= 35000) {
      this.lastBossAttackBuffAt = now;
      this.temporaryBuffs.push({ expiresAt: now + 10000, type: "player_attack", value: -0.1 });
      this.onLog?.(`${this.bossName} 激活迷雾压制，我方攻击短暂下降。`);
    }
  }

  private applyMineIncome(now: number) {
    if (now - this.lastMineIncomeAt < 2000) return;
    this.lastMineIncomeAt = now;
    const activeMines = this.tiles.filter((tile) => tile.owner === "player" && tile.building === "mine");
    const amount = activeMines.reduce((total, tile) => total + ((tile.buildingLevel ?? 1) >= 2 ? 5 : 3), 0);
    if (!amount) return;
    this.onResourceDelta?.(amount, "知识矿点产出");
    for (const tile of activeMines) {
      const center = this.tileCenter(tile);
      this.showFloatingText(center.x, center.y - 35, `+${(tile.buildingLevel ?? 1) >= 2 ? 5 : 3}`, "#a15c00");
    }
  }

  private applyRabbitHeal(now: number) {
    if (!this.hasPartner("focus-rabbit-01") || now - this.lastRabbitHealAt < 12000 || this.baseHp.player <= 0) return;
    this.lastRabbitHealAt = now;
    this.baseHp.player = Math.min(this.baseHpMax.player, this.baseHp.player + 3);
    const center = this.tileCenterById(playerBaseTileId);
    if (center) this.showFloatingText(center.x, center.y - 54, "+3", "#159ca8");
    this.onLog?.("聆心兔的静心恢复让学习基地 HP +3。");
    this.notifyBaseHp();
  }

  private applyTowerAttacks(now: number) {
    for (const tile of this.tiles.filter((item) => item.owner === "player" && item.building === "tower")) {
      const level = tile.buildingLevel ?? 1;
      const interval = level === 2 ? 1200 : 1500;
      const last = this.buildingAttackTimes.get(tile.id) ?? 0;
      if (now - last < interval) continue;
      const center = this.tileCenter(tile);
      const target = this.units
        .filter((unit) => unit.side === "enemy" && unit.hp > 0 && Phaser.Math.Distance.Between(center.x, center.y, unit.x, unit.y) <= this.radius * 2.5)
        .sort((left, right) => Phaser.Math.Distance.Between(center.x, center.y, left.x, left.y) - Phaser.Math.Distance.Between(center.x, center.y, right.x, right.y))[0];
      if (!target) continue;
      const damage = level === 2 ? 8 : 5;
      this.buildingAttackTimes.set(tile.id, now);
      target.hp = Math.max(0, target.hp - damage);
      const beam = this.add.line(0, 0, center.x, center.y, target.x, target.y, 0x159ca8, 0.82).setLineWidth(3);
      this.tweens.add({ alpha: 0, duration: 220, onComplete: () => beam.destroy(), targets: beam });
      this.showFloatingText(target.x, target.y - 34, `-${damage}`, "#159ca8");
      this.flashUnit(target.id);
      if (target.hp <= 0) {
        this.removeUnitView(target.id);
        this.stats.enemiesDefeated += 1;
        this.onLog?.("知识防御塔击退了一名迷雾小怪。");
      }
    }
  }

  private applyPlayerRegen(delta: number) {
    if (this.buffAmount("player_heal") <= 0) return;
    for (const unit of this.units.filter((item) => item.side === "player" && item.hp > 0)) {
      unit.hp = Math.min(unit.maxHp, unit.hp + delta * 0.0012);
    }
  }

  private spawnUnit(side: BattleUnitSide, hexId: string) {
    const center = this.tileCenterById(hexId);
    if (!center) return;
    const attackMultiplier = side === "player"
      ? Math.max(0.35, (this.hasPartner("fire_fox") ? 1.1 : 1) + this.buffAmount("player_attack"))
      : (this.hasPartner("careless_beast") ? 0.92 : 1);
    const hpMultiplier = side === "player" && this.hasPartner("grass_dragon") ? 1.12 : 1;
    const baseHp = side === "player" ? 24 : 22;
    const attack = side === "player" ? 6 : 5;
    const unit: TerritoryBattleUnit = {
      attack: Math.max(1, Math.round(attack * attackMultiplier)),
      attackCooldown: side === "player" ? 900 : 950,
      currentCooldown: Phaser.Math.Between(200, 650),
      currentHexId: hexId,
      hp: Math.round(baseHp * hpMultiplier),
      id: `${side}-${this.nextUnitId++}`,
      maxHp: Math.round(baseHp * hpMultiplier),
      role: "basic",
      side,
      speed: side === "player" ? 45 : 42,
      state: "idle",
      targetHexId: side === "player" ? enemyBaseTileId : playerBaseTileId,
      x: center.x + Phaser.Math.Between(-8, 8),
      y: center.y + Phaser.Math.Between(-8, 8)
    };
    this.units.push(unit);
    this.stats.playerUnitCount = this.units.filter((item) => item.side === "player").length;
    this.stats.enemyUnitCount = this.units.filter((item) => item.side === "enemy").length;
    this.createUnitView(unit);
  }

  private updateUnit(unit: TerritoryBattleUnit, delta: number) {
    const enemy = this.findEnemyInRange(unit);
    if (enemy) {
      unit.state = "attacking";
      this.attackUnit(unit, enemy, delta);
      return;
    }
    if (this.isAdjacentToBase(unit)) {
      unit.state = "attacking";
      this.attackBase(unit, delta);
      return;
    }
    unit.state = "moving";
    this.moveUnit(unit, delta);
  }

  private findEnemyInRange(unit: TerritoryBattleUnit) {
    return this.units
      .filter((other) => other.side !== unit.side && other.hp > 0)
      .sort((left, right) => Phaser.Math.Distance.Between(unit.x, unit.y, left.x, left.y) - Phaser.Math.Distance.Between(unit.x, unit.y, right.x, right.y))
      .find((other) => Phaser.Math.Distance.Between(unit.x, unit.y, other.x, other.y) <= this.radius * 1.8);
  }

  private attackUnit(unit: TerritoryBattleUnit, target: TerritoryBattleUnit, delta: number) {
    unit.currentCooldown -= delta;
    if (unit.currentCooldown > 0) return;
    unit.currentCooldown = unit.attackCooldown;
    target.hp = Math.max(0, target.hp - unit.attack);
    this.flashUnit(target.id);
    this.showFloatingText(target.x, target.y - 38, `-${unit.attack}`, unit.side === "player" ? "#e15a3a" : "#7b4bd6");
    if (target.hp <= 0) {
      this.removeUnitView(target.id);
      if (target.side === "enemy") {
        this.stats.enemiesDefeated += 1;
        this.onLog?.("伙伴小队击退了一名迷雾小怪。");
      } else {
        this.stats.playerUnitsLost += 1;
        this.onLog?.("一名伙伴小队被迷雾击退。");
      }
    }
  }

  private attackBase(unit: TerritoryBattleUnit, delta: number) {
    unit.currentCooldown -= delta;
    if (unit.currentCooldown > 0) return;
    unit.currentCooldown = unit.attackCooldown;
    const damage = Math.max(1, Math.round(unit.attack * (unit.side === "player" && this.hasPartner("focus-crow-01") ? 1.1 : 1) * (1 + (unit.side === "player" ? this.buffAmount("boss_damage") : 0))));
    const target = unit.side === "player" ? "enemy" : "player";
    this.baseHp[target] = Math.max(0, this.baseHp[target] - damage);
    const baseCenter = this.tileCenterById(target === "enemy" ? enemyBaseTileId : playerBaseTileId);
    if (baseCenter) {
      this.showFloatingText(baseCenter.x, baseCenter.y - 58, `-${damage}`, target === "enemy" ? "#e15a3a" : "#7b4bd6");
      this.cameras.main.shake(90, 0.003);
    }
    if (unit.side === "player") {
      this.stats.baseDamageDealt += damage;
      this.onLog?.(`迷雾核心受到 ${damage} 点伤害。`);
    } else {
      this.onLog?.(`学习基地受到 ${damage} 点伤害。`);
    }
    this.notifyBaseHp();
    this.draw();
    if (this.baseHp.enemy <= 0) this.finishBattle("victory");
    if (this.baseHp.player <= 0) this.finishBattle("defeat");
  }

  private moveUnit(unit: TerritoryBattleUnit, delta: number) {
    const next = unit.nextHexId ? this.tiles.find((tile) => tile.id === unit.nextHexId) : this.chooseNextTile(unit);
    if (!next) return;
    unit.nextHexId = next.id;
    const center = this.tileCenter(next);
    const distance = Phaser.Math.Distance.Between(unit.x, unit.y, center.x, center.y);
    const step = unit.speed * (delta / 1000);
    if (distance <= step) {
      unit.x = center.x;
      unit.y = center.y;
      unit.currentHexId = next.id;
      unit.nextHexId = undefined;
      return;
    }
    const angle = Phaser.Math.Angle.Between(unit.x, unit.y, center.x, center.y);
    unit.x += Math.cos(angle) * step;
    unit.y += Math.sin(angle) * step;
  }

  private chooseNextTile(unit: TerritoryBattleUnit) {
    const current = this.tiles.find((tile) => tile.id === unit.currentHexId);
    const target = this.tiles.find((tile) => tile.id === (unit.side === "player" ? enemyBaseTileId : playerBaseTileId));
    if (!current || !target) return undefined;
    const candidates = this.neighborTiles(current).filter((tile) => !tile.blocked && tile.type !== "water");
    if (!candidates.length) return undefined;
    return candidates.sort((left, right) => this.tileDistance(left, target) - this.tileDistance(right, target))[0];
  }

  private isAdjacentToBase(unit: TerritoryBattleUnit) {
    const current = this.tiles.find((tile) => tile.id === unit.currentHexId);
    const target = this.tiles.find((tile) => tile.id === (unit.side === "player" ? enemyBaseTileId : playerBaseTileId));
    if (!current || !target) return false;
    return current.id === target.id || this.tileDistance(current, target) <= 1;
  }

  private finishBattle(status: "victory" | "defeat") {
    if (this.stopped) return;
    this.stopped = true;
    this.onLog?.(status === "victory" ? "胜利！伙伴小队攻破了知识迷雾核心。" : "我方学习基地失守，本次远征失败。");
    this.onBattleEnd?.(status, { ...this.baseHp }, { ...this.stats });
  }

  private notifyBaseHp() {
    this.onBaseHpChanged?.({ ...this.baseHp });
  }

  private notifyStats() {
    this.stats.playerUnitCount = this.units.filter((unit) => unit.side === "player").length;
    this.stats.enemyUnitCount = this.units.filter((unit) => unit.side === "enemy").length;
    this.onBattleStatsChanged?.({ ...this.stats });
  }

  private notifyStatsThrottled() {
    if (this.time.now - this.lastStatsNotifyAt < 500) return;
    this.lastStatsNotifyAt = this.time.now;
    this.notifyStats();
  }

  private hasPartner(id: string) {
    return this.expeditionPartnerIds.includes(id);
  }

  private buffAmount(type: TemporaryBattleBuff["type"]) {
    return this.temporaryBuffs.filter((buff) => buff.type === type).reduce((total, buff) => total + buff.value, 0);
  }

  private draw() {
    this.unitViews.forEach((view) => view.destroy());
    this.unitViews.clear();
    this.children.removeAll();
    const hexWidth = Math.sqrt(3) * this.radius;
    const hexHeight = this.radius * 1.5;
    const worldWidth = cols * hexWidth + hexWidth;
    const worldHeight = rows * hexHeight + this.radius * 3;
    this.cameras.main.setBounds(-120, -120, worldWidth + 240, worldHeight + 240);

    const bg = this.add.graphics();
    bg.fillStyle(0xf7f3e7, 1);
    bg.fillRect(-160, -160, worldWidth + 320, worldHeight + 320);
    bg.fillStyle(0xdff8f4, 0.45);
    bg.fillRoundedRect(20, 20, worldWidth - 40, worldHeight - 20, 28);

    for (const tile of this.tiles) {
      const x = this.radius * 1.4 + tile.col * hexWidth + (tile.row % 2 ? hexWidth / 2 : 0);
      const y = this.radius * 1.35 + tile.row * hexHeight;
      const selected = tile.id === this.selectedTileId;
      const polygon = this.add.polygon(x, y, hexPoints(this.radius), tileColor(tile), 0.94);
      polygon.setStrokeStyle(selected ? 5 : 2, tileStroke(tile, selected), selected ? 1 : 0.76);
      polygon.setInteractive(new Phaser.Geom.Polygon(hexPoints(this.radius)), Phaser.Geom.Polygon.Contains);
      polygon.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        this.selectedTileId = tile.id;
        this.draw();
        this.onTileSelected?.(cloneTile(tile));
        this.onLog?.(`选中了 ${tile.row}-${tile.col} · ${tileName(tile)}`);
      });

      if (tile.type === "player_base" || tile.type === "enemy_base") {
        const baseColor = tile.type === "player_base" ? 0x159ca8 : 0x6d4ed6;
        this.add.circle(x, y - 9, this.radius * 0.34, baseColor, 1).setStrokeStyle(3, 0xffffff, 0.9);
        this.add.rectangle(x, y + 12, this.radius * 0.85, this.radius * 0.42, baseColor, 1).setStrokeStyle(3, 0xffffff, 0.9);
        this.add.text(x, y + 42, tile.type === "player_base" ? "学习基地" : this.bossName, { color: "#10233f", fontSize: "11px", fontStyle: "bold" }).setOrigin(0.5);
        const key = tile.type === "player_base" ? "player" : "enemy";
        const maxHp = Math.max(1, this.baseHpMax[key]);
        const hpWidth = Phaser.Math.Clamp((this.baseHp[key] / maxHp) * 68, 0, 68);
        this.add.rectangle(x, y - 50, 72, 8, 0xffffff, 0.86).setStrokeStyle(1, 0x10233f, 0.14);
        this.add.rectangle(x - 34 + hpWidth / 2, y - 50, hpWidth, 6, key === "player" ? 0x159ca8 : 0xe15a3a, 1);
      }

      if (tile.type === "resource") {
        this.add.circle(x, y - 6, this.radius * 0.22, 0xf1b84b, 1).setStrokeStyle(3, 0xffffff, 0.9);
        this.add.text(x, y + 16, tile.building ? `+${(tile.buildingLevel ?? 1) >= 2 ? 5 : 3}/2s` : "50", { color: "#a15c00", fontSize: "15px", fontStyle: "bold" }).setOrigin(0.5);
      }

      if (tile.type === "question") {
        this.add.circle(x, y - 2, this.radius * 0.28, 0x6d8df6, 1).setStrokeStyle(3, 0xffffff, 0.92);
        this.add.text(x, y - 5, "?", { color: "#ffffff", fontSize: "24px", fontStyle: "bold" }).setOrigin(0.5);
        this.add.text(x, y + 27, tile.owner === "player" ? "已解答" : "知识挑战", { color: tile.owner === "player" ? "#159ca8" : "#3554a4", fontSize: "10px", fontStyle: "bold" }).setOrigin(0.5);
      }

      if (tile.type === "buildable" && tile.owner !== "player" && tile.owner !== "enemy") {
        this.add.text(x, y + 5, String(tile.cost), { color: "#cc3d2f", fontSize: "16px", fontStyle: "bold" }).setOrigin(0.5);
      }

      if (tile.type === "water") {
        this.add.text(x, y, "水", { color: "#ffffff", fontSize: "18px", fontStyle: "bold" }).setOrigin(0.5);
      }

      if (tile.building === "camp") {
        this.add.circle(x, y - 9, this.radius * 0.22, 0xffffff, 0.96).setStrokeStyle(4, 0x159ca8, 0.9);
        this.add.rectangle(x, y + 10, this.radius * 0.52, this.radius * 0.36, 0x159ca8, 0.92).setStrokeStyle(2, 0xffffff, 0.9);
        this.add.text(x, y + 34, `营地 Lv.${tile.buildingLevel ?? 1}`, { color: "#10233f", fontSize: "11px", fontStyle: "bold" }).setOrigin(0.5);
      }

      if (tile.building === "tower") {
        this.add.triangle(x, y - 11, 0, 24, 15, -8, 30, 24, 0xffffff, 0.96).setStrokeStyle(4, 0x159ca8, 0.9);
        this.add.rectangle(x, y + 12, this.radius * 0.44, this.radius * 0.3, 0x246a86, 0.92).setStrokeStyle(2, 0xffffff, 0.9);
        this.add.text(x, y + 34, `塔 Lv.${tile.buildingLevel ?? 1}`, { color: "#10233f", fontSize: "11px", fontStyle: "bold" }).setOrigin(0.5);
      }

      if (tile.owner === "enemy" && tile.type !== "enemy_base") {
        this.add.text(x, y - 3, "雾", { color: "#ffffff", fontSize: "16px", fontStyle: "bold" }).setOrigin(0.5);
      }
    }
    this.syncUnitViews();
  }

  private createUnitView(unit: TerritoryBattleUnit) {
    const color = unit.side === "player" ? 0x3aa8d8 : 0x8b5cf6;
    const label = unit.side === "player" ? "伴" : "雾";
    const container = this.add.container(unit.x, unit.y);
    const shadow = this.add.ellipse(0, 12, 28, 10, 0x10233f, 0.16);
    const body = this.add.circle(0, 0, 13, color, 1).setStrokeStyle(3, 0xffffff, 0.9);
    const text = this.add.text(0, -1, label, { color: "#ffffff", fontSize: "12px", fontStyle: "bold" }).setOrigin(0.5);
    const hpBg = this.add.rectangle(0, -20, 28, 4, 0xffffff, 0.8);
    const hpBar = this.add.rectangle(-14, -20, 28, 3, unit.side === "player" ? 0x30c6b2 : 0xff775e, 1).setOrigin(0, 0.5);
    hpBar.setName("hpBar");
    container.add([shadow, body, text, hpBg, hpBar]);
    this.unitViews.set(unit.id, container);
  }

  private syncUnitViews() {
    const liveIds = new Set(this.units.map((unit) => unit.id));
    for (const [id, view] of this.unitViews) {
      if (!liveIds.has(id)) {
        view.destroy();
        this.unitViews.delete(id);
      }
    }
    for (const unit of this.units) {
      if (!this.unitViews.has(unit.id)) this.createUnitView(unit);
      const view = this.unitViews.get(unit.id);
      if (!view) continue;
      view.setPosition(unit.x, unit.y);
      const hpBar = view.getByName("hpBar") as Phaser.GameObjects.Rectangle | null;
      if (hpBar) hpBar.width = Phaser.Math.Clamp((unit.hp / unit.maxHp) * 28, 0, 28);
    }
  }

  private removeUnitView(unitId: string) {
    const view = this.unitViews.get(unitId);
    if (!view) return;
    view.destroy();
    this.unitViews.delete(unitId);
  }

  private flashUnit(unitId: string) {
    const view = this.unitViews.get(unitId);
    if (!view) return;
    this.tweens.add({
      duration: 80,
      repeat: 1,
      yoyo: true,
      targets: view,
      x: view.x + (Phaser.Math.Between(0, 1) ? 6 : -6)
    });
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const label = this.add.text(x, y, text, {
      color,
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#ffffff",
      strokeThickness: 4
    }).setOrigin(0.5);
    this.tweens.add({
      alpha: 0,
      duration: 850,
      ease: "Sine.easeOut",
      onComplete: () => label.destroy(),
      targets: label,
      y: y - 34
    });
  }

  private tileCenter(tile: TerritoryCanvasTile) {
    const hexWidth = Math.sqrt(3) * this.radius;
    const hexHeight = this.radius * 1.5;
    return {
      x: this.radius * 1.4 + tile.col * hexWidth + (tile.row % 2 ? hexWidth / 2 : 0),
      y: this.radius * 1.35 + tile.row * hexHeight
    };
  }

  private tileCenterById(id: string) {
    const tile = this.tiles.find((item) => item.id === id);
    return tile ? this.tileCenter(tile) : undefined;
  }

  private neighborTiles(tile: TerritoryCanvasTile) {
    return neighborOffsets(tile.row)
      .map(([dr, dc]) => this.tiles.find((item) => item.row === tile.row + dr && item.col === tile.col + dc))
      .filter((item): item is TerritoryCanvasTile => Boolean(item));
  }

  private tileDistance(left: TerritoryCanvasTile, right: TerritoryCanvasTile) {
    return Math.abs(left.row - right.row) + Math.abs(left.col - right.col);
  }

  private fitView() {
    const camera = this.cameras.main;
    const width = this.scale.width;
    const height = this.scale.height;
    const zoom = width < 640 ? 0.82 : width < 980 ? 0.92 : 1.06;
    camera.setZoom(zoom);
    camera.centerOn(410, height < 500 ? 390 : 340);
  }

  private getSelectedTile() {
    return this.tiles.find((tile) => tile.id === this.selectedTileId);
  }
}

export const PhaserTerritoryWarCanvas = forwardRef<PhaserTerritoryWarCanvasHandle, PhaserTerritoryWarCanvasProps>(
  function PhaserTerritoryWarCanvas({ battleActive, bossName, enemyBaseHp, expeditionPartnerIds, onBaseHpChanged, onBattleEnd, onBattleStatsChanged, onLog, onQuestionTileRequested, onResourceDelta, onTileSelected, playerBaseHp }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const sceneRef = useRef<TerritoryWarBattlefieldScene | null>(null);
    const baseHpRef = useRef(onBaseHpChanged);
    const battleEndRef = useRef(onBattleEnd);
    const statsRef = useRef(onBattleStatsChanged);
    const logRef = useRef(onLog);
    const questionRef = useRef(onQuestionTileRequested);
    const resourceRef = useRef(onResourceDelta);
    const selectRef = useRef(onTileSelected);

    baseHpRef.current = onBaseHpChanged;
    battleEndRef.current = onBattleEnd;
    statsRef.current = onBattleStatsChanged;
    logRef.current = onLog;
    questionRef.current = onQuestionTileRequested;
    resourceRef.current = onResourceDelta;
    selectRef.current = onTileSelected;

    useImperativeHandle(ref, () => ({
      buildCampOnSelectedTile: () => sceneRef.current?.buildCampOnSelectedTile() ?? { message: "战场尚未初始化。", ok: false },
      buildMineOnSelectedTile: () => sceneRef.current?.buildMineOnSelectedTile() ?? { message: "战场尚未初始化。", ok: false },
      buildTowerOnSelectedTile: () => sceneRef.current?.buildTowerOnSelectedTile() ?? { message: "战场尚未初始化。", ok: false },
      clearUnits: () => sceneRef.current?.clearUnits(),
      debugTriggerBossEvent: () => sceneRef.current?.debugTriggerBossEvent(),
      applyQuestionResult: (tileIdValue, correct) => sceneRef.current?.applyQuestionResult(tileIdValue, correct) ?? { message: "战场尚未初始化。", ok: false },
      occupySelectedTile: () => sceneRef.current?.occupySelectedTile() ?? { message: "战场尚未初始化。", ok: false },
      resetBattlefield: () => sceneRef.current?.resetBattlefield(),
      resetView: () => sceneRef.current?.resetView(),
      useExpeditionSkill: (petId) => sceneRef.current?.useExpeditionSkill(petId) ?? { message: "战场尚未初始化。", ok: false },
      upgradeSelectedBuilding: () => sceneRef.current?.upgradeSelectedBuilding() ?? { message: "战场尚未初始化。", ok: false },
      zoomIn: () => sceneRef.current?.zoomIn(),
      zoomOut: () => sceneRef.current?.zoomOut()
    }), []);

    useEffect(() => {
      if (!containerRef.current || gameRef.current) return;
      const scene = new TerritoryWarBattlefieldScene({
        battleActive,
        bossName,
        enemyBaseHp,
        expeditionPartnerIds,
        onBaseHpChanged: (hp) => baseHpRef.current?.(hp),
        onBattleEnd: (status, hp, stats) => battleEndRef.current?.(status, hp, stats),
        onBattleStatsChanged: (stats) => statsRef.current?.(stats),
        onLog: (message) => logRef.current?.(message),
        onQuestionTileRequested: (tile) => questionRef.current?.(tile),
        onResourceDelta: (amount, reason) => resourceRef.current?.(amount, reason),
        onTileSelected: (tile) => selectRef.current?.(tile),
        playerBaseHp
      });
      sceneRef.current = scene;
      gameRef.current = new Phaser.Game({
        backgroundColor: "#f7f3e7",
        parent: containerRef.current,
        scale: {
          autoCenter: Phaser.Scale.CENTER_BOTH,
          height: 640,
          mode: Phaser.Scale.RESIZE,
          width: 960
        },
        scene,
        type: Phaser.AUTO
      });

      return () => {
        gameRef.current?.destroy(true);
        gameRef.current = null;
        sceneRef.current = null;
      };
    }, []);

    useEffect(() => {
      sceneRef.current?.updateRuntimeOptions({
        battleActive,
        bossName,
        enemyBaseHp,
        expeditionPartnerIds,
        onBaseHpChanged: (hp) => baseHpRef.current?.(hp),
        onBattleEnd: (status, hp, stats) => battleEndRef.current?.(status, hp, stats),
        onBattleStatsChanged: (stats) => statsRef.current?.(stats),
        onLog: (message) => logRef.current?.(message),
        onQuestionTileRequested: (tile) => questionRef.current?.(tile),
        onResourceDelta: (amount, reason) => resourceRef.current?.(amount, reason),
        onTileSelected: (tile) => selectRef.current?.(tile),
        playerBaseHp
      });
    }, [battleActive, bossName, enemyBaseHp, expeditionPartnerIds, playerBaseHp]);

    return (
      <div className="h-[56vh] min-h-[420px] overflow-hidden rounded-[1.5rem] border border-white/80 bg-[#f7f3e7] shadow-[0_18px_50px_rgba(16,35,63,0.12)] md:h-[620px] lg:h-[calc(100vh-250px)] lg:min-h-[560px]">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    );
  }
);
