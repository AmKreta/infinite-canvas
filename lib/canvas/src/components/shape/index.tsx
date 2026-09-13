import type React from "react";
import { memo } from "react";
import "./index.css";
import type { Shape as ShapeType } from "../../types";
import { useCanvasStore } from "../CanvasContext";

type ShapeProps = ShapeType & {
  onShapeMouseDown: (e: React.MouseEvent) => unknown;
};

const _Shape: React.FC<ShapeProps> = ({
  id,
  type,
  x,
  y,
  width,
  height,
  color,
  zIndex,
  onShapeMouseDown,
}) => {
  const isDragging = useCanvasStore((s) => s.draggingShape === id);
  const isDrawingPreview = useCanvasStore((s) => s.drawingShapeId === id);

  return (
    <div
      className={`shape shape-${type} ${isDragging ? "dragging" : ""} ${isDrawingPreview ? "drawing-preview" : ""}`}
      style={{
        left: x,
        top: y,
        width: width,
        height: height,
        borderRadius: "8px",
        backgroundColor: color,
        borderColor: color,
        zIndex: zIndex,
      }}
      id={id}
      onMouseDown={onShapeMouseDown}
    />
  );
};

export const Shape = memo(_Shape);
