export type ShapeId = string;
export interface Shape {
  id: ShapeId;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  zIndex: number;
}

export enum Mode {
  PAN = "pan",
  DRAW = "draw",
}