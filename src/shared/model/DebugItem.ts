import { log } from "~shared/log";
import { HexVector } from "./HexVector";

//export type DebugItemType = "h" |
//  "lh" |
//  "c" |
//  "pt" |
//  "a"
//
//export const DEBUG_ITEM_TYPES: Record<string, DebugItemType> = {
//  Arrow: "a",
//  CompositeItem: "c",
//  Hexagon: "h",
//  LabeledHexagon: "lh",
//  PositionedText: "pt",
//};

export enum DebugItemType {
  Arrow = "a",
  CompositeItem = "c",
  Hexagon = "h",
  LabeledHexagon = "lh",
  PositionedText = "pt",
}

export interface DebugItemParams {
  alpha?: number;
  color?: number;
  position?: HexVector;
  scale?: number;
  secondaryColor?: number;
  spriteName?: string;
  visible?: boolean;
  zIndex?: number;
}

/**
 * An item that should be rendered client-side by the DebugDisplay component 
 */
export class DebugItem {
  readonly itemType: DebugItemType;
  alpha: number;
  color: number;
  position: HexVector;
  scale: number;
  secondaryColor?: number;
  spriteName?: string;
  visible: boolean;
  zIndex: number;
  constructor(params: DebugItemParams) {
    this.alpha = params.alpha ?? 1;
    this.color = params.color ?? 0xffffff;
    this.position = params.position ?? HexVector.ZERO;
    this.scale = params.scale ?? 1;
    this.secondaryColor = params.secondaryColor ?? 0xffffff;
    this.spriteName = params.spriteName;
    this.visible = params.visible ?? true;
    this.zIndex = params.zIndex ?? 0;
  }
}

export interface LabeledHexagonParams extends DebugItemParams {
  spriteName: string;
  snapToGrid?: boolean;
  text: string;
}

export class LabeledHexagon extends DebugItem {
  itemType = DebugItemType.LabeledHexagon;
  snapToGrid: boolean;
  spriteName: string;
  text: string;
  visible: boolean;
  constructor(
    params: LabeledHexagonParams
  ) {
    super(params);
    this.text = params.text;
    this.snapToGrid = params.snapToGrid ?? false;
  }
}

export function isLabeledHexagon(item: DebugItem): item is LabeledHexagon {
  return item.itemType == DebugItemType.LabeledHexagon;
}

export interface CompositeItemParams extends DebugItemParams {
  childrenInheritPosition?: boolean;
  components: DebugItem[];
}

/**
 * A composite of DebugItems, for representing composite information.
 * 
 * @remarks
 * e.g.: An arrow for an entity's path, with all the hex spaces it touches.
 *
 * Better not be self-referential!
 */
export class CompositeItem extends DebugItem {
  itemType = DebugItemType.CompositeItem;
  readonly components: DebugItem[];
  readonly childrenInheritPosition: boolean;
  constructor(
    params: CompositeItemParams
  ) {
    super(params);
    this.childrenInheritPosition = params.childrenInheritPosition ?? false;
    this.components = params.components;
  }
}

export function isCompositeItem(item: DebugItem): item is CompositeItem {
  return item.itemType == DebugItemType.CompositeItem;
}

export interface PositionedTextParams extends DebugItemParams {
  fontFamily?: string;
  fontSize?: number;
}

export class PositionedText extends DebugItem {
  itemType = DebugItemType.PositionedText;
  fontFamily: string;
  fontSize: number;
  constructor(
    public text: string,
    params: PositionedTextParams
  ) {
    super(params);
    this.fontFamily = params.fontFamily ?? "Arial";
    this.fontSize = params.fontSize ?? 12;
  }
}

export function isPositionedText(item: DebugItem): item is PositionedText {
  return item.itemType == DebugItemType.PositionedText;
}

export interface ArrowParams extends DebugItemParams {
  start: HexVector;
  end: HexVector;
}

export class Arrow extends DebugItem {
  itemType = DebugItemType.Arrow;
  start: HexVector;
  end: HexVector;
  constructor(
    params: ArrowParams
  ) {
    super(params);
    this.start = params.start;
    this.end = params.end;
    this.position = this.start;
  }
}

export function isArrow(item: DebugItem): item is Arrow {
  return item.itemType == DebugItemType.Arrow;
}
