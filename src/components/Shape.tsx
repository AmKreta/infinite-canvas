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
    >
      {JSON.stringify({x, y, id}, null, 2)}
    </div>
  );
};

export default memo(_Shape);
