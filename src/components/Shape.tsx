import type React from "react";
import { memo } from "react";
import type { Shape as ShapeType } from "../types"

type ShapeProps = ShapeType & {
  isDragging?: boolean;
  isDrawingPreview?: boolean;
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
  isDragging,
  isDrawingPreview
}) => {
  return (
    <div
      className={`shape shape-${type} ${isDragging ? "dragging" : ""} ${isDrawingPreview ? "drawing-preview" : ""}`}
      style={{
        left: 0,
        top: 0,
        width: width,
        height: height,
        borderRadius: "8px",
        backgroundColor: color,
        borderColor: color,
        zIndex: zIndex,
        transform: `translate(${x}px, ${y}px)${isDragging ? " scale(1.05)" : ""}`,
      }}
      id={id}
    />
  );
};

export default memo(_Shape);
