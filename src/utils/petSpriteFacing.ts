import { enemies } from "@/data/petBattleData";

export type SpriteFacing = "left" | "right";

const nativeFacingOverrides: Record<string, SpriteFacing> = {
  "focus-rabbit-01": "right",
  "focus-crow-01": "right",
  "focus-octopus-01": "right"
};

function nativeFacingForSprite(sourceId: string): SpriteFacing {
  const override = nativeFacingOverrides[sourceId];
  if (override) return override;
  return enemies.some((enemy) => enemy.id === sourceId) ? "left" : "right";
}

export function shouldFlipPetSprite(sourceId: string, desiredFacing: SpriteFacing) {
  return nativeFacingForSprite(sourceId) !== desiredFacing;
}

export function petSpriteFacingClass(sourceId: string, desiredFacing: SpriteFacing) {
  return shouldFlipPetSprite(sourceId, desiredFacing) ? "pet-sprite-flip-x" : "";
}
