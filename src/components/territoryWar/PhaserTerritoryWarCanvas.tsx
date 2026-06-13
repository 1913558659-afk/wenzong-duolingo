import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

type HexTile = {
  col: number;
  label: string;
  owner: "player" | "enemy" | "neutral" | "water";
  row: number;
  type: "base_player" | "base_enemy" | "plain" | "resource" | "question" | "water";
};

type PhaserTerritoryWarCanvasProps = {
  onTileClick?: (tile: HexTile) => void;
};

const testTiles: HexTile[] = [
  { col: 0, label: "我方基地", owner: "player", row: 2, type: "base_player" },
  { col: 1, label: "伙伴营地", owner: "player", row: 2, type: "plain" },
  { col: 2, label: "知识矿", owner: "player", row: 1, type: "resource" },
  { col: 2, label: "水域", owner: "water", row: 3, type: "water" },
  { col: 3, label: "知识挑战", owner: "neutral", row: 2, type: "question" },
  { col: 4, label: "迷雾地", owner: "enemy", row: 1, type: "plain" },
  { col: 5, label: "敌方基地", owner: "enemy", row: 1, type: "base_enemy" }
];

function hexPoints(cx: number, cy: number, radius: number) {
  const points: number[] = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = Phaser.Math.DegToRad(60 * index - 30);
    points.push(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  }
  return points;
}

function tileColor(tile: HexTile) {
  if (tile.owner === "player") return 0xf8c85a;
  if (tile.owner === "enemy") return 0x8c6ee8;
  if (tile.owner === "water") return 0x58b8ee;
  return 0xd8d5e8;
}

class TerritoryWarTestScene extends Phaser.Scene {
  private onTileClick?: (tile: HexTile) => void;

  constructor(onTileClick?: (tile: HexTile) => void) {
    super("TerritoryWarTestScene");
    this.onTileClick = onTileClick;
  }

  create() {
    this.drawScene();
    this.scale.on("resize", () => this.drawScene());
  }

  drawScene() {
    this.children.removeAll();
    const width = this.scale.width;
    const height = this.scale.height;
    const radius = Math.max(34, Math.min(58, width / 12));
    const hexWidth = Math.sqrt(3) * radius;
    const hexHeight = 1.5 * radius;
    const originX = Math.max(radius + 18, width / 2 - hexWidth * 2.8);
    const originY = Math.max(radius + 20, height / 2 - hexHeight * 1.7);

    this.add.rectangle(width / 2, height / 2, width, height, 0xf7f3e7);
    this.add.rectangle(width / 2, height / 2, width, height, 0xe0f7f4, 0.42);

    this.add.text(18, 14, "Phaser Hex Test", {
      color: "#10233f",
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      fontStyle: "bold"
    });
    this.add.text(18, 36, "点击六边形会输出坐标", {
      color: "#547084",
      fontFamily: "Arial, sans-serif",
      fontSize: "12px"
    });

    for (const tile of testTiles) {
      const x = originX + tile.col * hexWidth + (tile.row % 2 ? hexWidth / 2 : 0);
      const y = originY + tile.row * hexHeight;
      const polygon = this.add.polygon(x, y, hexPoints(0, 0, radius), tileColor(tile), 0.92);
      polygon.setStrokeStyle(3, tile.owner === "enemy" ? 0x5d4abb : tile.owner === "player" ? 0xd99a18 : 0xffffff, 0.9);
      polygon.setInteractive(new Phaser.Geom.Polygon(hexPoints(0, 0, radius)), Phaser.Geom.Polygon.Contains);
      polygon.on("pointerdown", () => {
        console.info("[TerritoryWar Phaser] tile clicked", { col: tile.col, row: tile.row, type: tile.type });
        this.onTileClick?.(tile);
      });

      if (tile.type === "base_player" || tile.type === "base_enemy") {
        const baseColor = tile.type === "base_player" ? 0x159ca8 : 0x7b3bd1;
        this.add.circle(x, y - 8, radius * 0.34, baseColor, 0.95).setStrokeStyle(3, 0xffffff, 0.85);
        this.add.rectangle(x, y + 12, radius * 0.78, radius * 0.4, baseColor, 0.95).setStrokeStyle(3, 0xffffff, 0.85);
      }

      if (tile.type === "resource") {
        this.add.circle(x, y - 4, radius * 0.22, 0xf2b84b, 1).setStrokeStyle(3, 0xffffff, 0.9);
        this.add.text(x, y + 18, "矿", { color: "#10233f", fontSize: "14px", fontStyle: "bold" }).setOrigin(0.5);
      }

      if (tile.type === "question") {
        this.add.circle(x, y, radius * 0.3, 0x6d8df6, 0.95).setStrokeStyle(3, 0xffffff, 0.9);
        this.add.text(x, y - 2, "?", { color: "#ffffff", fontSize: "24px", fontStyle: "bold" }).setOrigin(0.5);
      }

      if (tile.type === "water") {
        this.add.text(x, y, "水", { color: "#ffffff", fontSize: "18px", fontStyle: "bold" }).setOrigin(0.5);
      }

      this.add.text(x, y + radius * 0.62, `${tile.row},${tile.col}`, {
        color: tile.owner === "enemy" ? "#ffffff" : "#10233f",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        fontStyle: "bold"
      }).setOrigin(0.5);
    }
  }
}

export function PhaserTerritoryWarCanvas({ onTileClick }: PhaserTerritoryWarCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const clickHandlerRef = useRef(onTileClick);
  const [lastClicked, setLastClicked] = useState<HexTile | null>(null);

  clickHandlerRef.current = onTileClick;

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    const scene = new TerritoryWarTestScene((tile) => {
      setLastClicked(tile);
      clickHandlerRef.current?.(tile);
    });
    gameRef.current = new Phaser.Game({
      backgroundColor: "#f7f3e7",
      parent: containerRef.current,
      scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        height: 360,
        mode: Phaser.Scale.RESIZE,
        width: 720
      },
      scene,
      type: Phaser.AUTO
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white/70 p-3 shadow-[0_16px_42px_rgba(16,35,63,0.08)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-tide">Phaser Test Canvas</p>
          <h3 className="text-lg font-black text-ink">六边形即时战场测试</h3>
        </div>
        <span className="rounded-full bg-tide/10 px-3 py-1 text-xs font-black text-tide">
          {lastClicked ? `点击：${lastClicked.row}, ${lastClicked.col}` : "等待点击"}
        </span>
      </div>
      <div ref={containerRef} className="h-[320px] overflow-hidden rounded-[1.2rem] bg-[#f7f3e7] md:h-[380px]" />
      {lastClicked && (
        <p className="mt-2 rounded-2xl bg-ink/5 px-3 py-2 text-xs font-bold text-ink/60">
          最近点击：row {lastClicked.row} / col {lastClicked.col} · {lastClicked.label}
        </p>
      )}
    </div>
  );
}
