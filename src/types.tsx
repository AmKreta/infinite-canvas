export interface Shape {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  zIndex: number;
}

export type CornerShape = {
  top: Shape | null;
  bottom: Shape | null;
  left: Shape | null;
  right: Shape | null;
}