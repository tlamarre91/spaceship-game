import { log } from "~shared/log";
import { HexVector } from "./HexVector";

export type VisualDebugItemType = "h" |
  "lh" |
  "c";

export const VISUAL_DEBUG_ITEM_TYPES: Record<string, VisualDebugItemType> = {
  Hexagon: "h",
  LabeledHexagon: "lh",
  CompositeItem: "c"
};

/**
 * An item that should be rendered client-side by the VisualDebug component 
 */
export interface VisualDebugItem {
  itemType: VisualDebugItemType;
}

export class LabeledHexagon implements VisualDebugItem {
  itemType = VISUAL_DEBUG_ITEM_TYPES.Hexagon;
  constructor(
    readonly position: HexVector,
    readonly spriteName: string,
    readonly text: string,
    readonly alpha: number = 1,
    readonly tint: number = 0xffffff,
    readonly scale: number = 1
  ) { }
}

export function isLabeledHexagon(item: VisualDebugItem): item is LabeledHexagon {
  return item.itemType == VISUAL_DEBUG_ITEM_TYPES.LabeledHexagon;
}

/**
 * A composite of VisualDebugItems, for representing composite information.
 * 
 * @remarks
 * e.g.: An arrow for an entity's path, with all the hex spaces it touches.
 *
 * Better not be self-referential!
 */
export class CompositeItem implements VisualDebugItem {
  itemType = VISUAL_DEBUG_ITEM_TYPES.CompositeItem;
  constructor(
    readonly components: VisualDebugItem[],
    readonly basePosition: HexVector | null = null,
  ) { }
}

export function isCompositeItem(item: VisualDebugItem): item is CompositeItem {
  return item.itemType == VISUAL_DEBUG_ITEM_TYPES.CompositeItem;
}
