import { log } from "~shared/log";
import { HexVector } from "./HexVector";

//export type VisualDebugItemType = "h" |
//  "lh" |
//  "c" |
//  "pt" |
//  "a"
//
//export const VISUAL_DEBUG_ITEM_TYPES: Record<string, VisualDebugItemType> = {
//  Arrow: "a",
//  CompositeItem: "c",
//  Hexagon: "h",
//  LabeledHexagon: "lh",
//  PositionedText: "pt",
//};

export enum VisualDebugItemType {
  Arrow = "a",
  CompositeItem = "c",
  Hexagon = "h",
  LabeledHexagon = "lh",
  PositionedText = "pt",
}

export interface VisualDebugItemParams {
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
 * An item that should be rendered client-side by the VisualDebug component 
 */
export class VisualDebugItem {
  readonly itemType: VisualDebugItemType;
  alpha: number;
  color: number;
  position: HexVector;
  scale: number;
  secondaryColor?: number;
  spriteName?: string;
  visible: boolean;
  zIndex: number;
  constructor(params: VisualDebugItemParams) {
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

export interface LabeledHexagonParams extends VisualDebugItemParams {
  spriteName: string;
  snapToGrid?: boolean;
  text: string;
}

export class LabeledHexagon extends VisualDebugItem {
  itemType = VisualDebugItemType.LabeledHexagon;
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

export function isLabeledHexagon(item: VisualDebugItem): item is LabeledHexagon {
  return item.itemType == VisualDebugItemType.LabeledHexagon;
}

export interface CompositeItemParams extends VisualDebugItemParams {
  childrenInheritPosition?: boolean;
  components: VisualDebugItem[];
}

/**
 * A composite of VisualDebugItems, for representing composite information.
 * 
 * @remarks
 * e.g.: An arrow for an entity's path, with all the hex spaces it touches.
 *
 * Better not be self-referential!
 */
export class CompositeItem extends VisualDebugItem {
  itemType = VisualDebugItemType.CompositeItem;
  readonly components: VisualDebugItem[];
  readonly childrenInheritPosition: boolean;
  constructor(
    params: CompositeItemParams
  ) {
    super(params);
    this.childrenInheritPosition = params.childrenInheritPosition ?? false;
    this.components = params.components;
  }
}

export function isCompositeItem(item: VisualDebugItem): item is CompositeItem {
  return item.itemType == VisualDebugItemType.CompositeItem;
}

export interface PositionedTextParams extends VisualDebugItemParams {
  fontFamily?: string;
  fontSize?: number;
}

export class PositionedText extends VisualDebugItem {
  itemType = VisualDebugItemType.PositionedText;
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

export function isPositionedText(item: VisualDebugItem): item is PositionedText {
  return item.itemType == VisualDebugItemType.PositionedText;
}

export interface ArrowParams extends VisualDebugItemParams {
  start: HexVector;
  end: HexVector;
}

export class Arrow extends VisualDebugItem {
  itemType = VisualDebugItemType.Arrow;
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

export function isArrow(item: VisualDebugItem): item is Arrow {
  return item.itemType == VisualDebugItemType.Arrow;
}
