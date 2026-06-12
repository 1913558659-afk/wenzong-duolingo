import { enemies } from "@/data/petBattleData";

export type SpriteFacing = "left" | "right";

function nativeFacingForSprite(sourceId: string): SpriteFacing {
  return enemies.some((enemy) => enemy.id === sourceId) ? "left" : "right";
}

export function shouldFlipPetSprite(sourceId: string, desiredFacing: SpriteFacing) {
  return nativeFacingForSprite(sourceId) !== desiredFacing;
}

export function petSpriteFacingClass(sourceId: string, desiredFacing: SpriteFacing) {
  return shouldFlipPetSprite(sourceId, desiredFacing) ? "pet-sprite-flip-x" : "";
}
