import { log } from "~shared/log";
import { HexVector } from "./HexVector";

export type VisualDebugItemType = "h" |
  "lh" |
  "c" |
  "pt"

export const VISUAL_DEBUG_ITEM_TYPES: Record<string, VisualDebugItemType> = {
  Hexagon: "h",
  LabeledHexagon: "lh",
  CompositeItem: "c",
  PositionedText: "pt",
};

/**
 * An item that should be rendered client-side by the VisualDebug component 
 */
export interface VisualDebugItem {
  itemType: VisualDebugItemType;
  color: number;
  secondaryColor?: number;
  alpha: number;
  scale: number;
  visible: boolean;
}

export interface VisualDebugItemOptions {
  alpha?: number;
  color?: number;
  position?: HexVector;
  secondaryColor?: number;
  scale?: number;
  spriteName?: string;
  visible?: boolean;
}

export class LabeledHexagon implements VisualDebugItem {
  itemType = VISUAL_DEBUG_ITEM_TYPES.Hexagon;
  position: HexVector;
  alpha: number;
  color: number;
  scale: number;
  visible: boolean;
  secondaryColor?: number;
  constructor(
    public spriteName: string,
    public text: string,
    opts:  VisualDebugItemOptions = { }
  ) {
    this.visible = opts.visible ?? true;
    this.alpha = opts.alpha ?? 1;
    this.scale = opts.scale ?? 1;
    this.color = opts.color ?? 0xffffff;
    this.secondaryColor = opts.secondaryColor ?? 0xffffff;
    this.position = opts.position ?? HexVector.ZERO;
  }
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
    readonly position: HexVector | null = null,
    readonly childrenInheritPosition: boolean = false,
    readonly visible: boolean,
  ) { }
}

export function isCompositeItem(item: VisualDebugItem): item is CompositeItem {
  return item.itemType == VISUAL_DEBUG_ITEM_TYPES.CompositeItem;
}

export class PositionedText implements VisualDebugItem {
  itemType = VISUAL_DEBUG_ITEM_TYPES.PositionedText;
  constructor(
    readonly position: HexVector,
    readonly text: string,
    readonly alpha: number = 1,
    readonly color: number = 0xffffff,
    readonly scale: number = 1
  ) { }
}

export function isPositionedText(item: VisualDebugItem): item is PositionedText {
  return item.itemType == VISUAL_DEBUG_ITEM_TYPES.FloatingText;
}
