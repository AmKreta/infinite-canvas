import React, { useCallback, memo } from "react"
import "./index.css"
import { Mode, Shape as ShapeProps } from "../../types"
import { useCanvasStore, useCanvasStoreApi } from "../CanvasContext"
import { getShapeMaxZIndex } from "../../utils/maxShapeZIndex"

const _Shape: React.FC<ShapeProps> = ({ id, type, x, y, width, height, color, zIndex }) => {
    const mode = useCanvasStore(s=>s.mode);
    const setDraggingShape = useCanvasStore(s=>s.setDraggingShape);
    const setShapes = useCanvasStore(s=>s.setShapes);
    const setlastCursorPos = useCanvasStore(s=>s.setLastCursorPos);
    const draggingShape = useCanvasStore(s=>s.draggingShape);
    const drawingShapeId = useCanvasStore(s=>s.drawingShapeId);
    const canvasStore = useCanvasStoreApi();

    const handleShapeMouseDown = useCallback(
        (e: React.MouseEvent) => {
          if (mode === Mode.DRAW) {
            return false;
          }
          e.stopPropagation();
          e.preventDefault();
          setDraggingShape(id);
          const shapes = canvasStore.getState().shapes;
          const maxZIndex = getShapeMaxZIndex(shapes);
          setShapes(shapes.map(shape =>shape.id === id ? { ...shape, zIndex: maxZIndex + 1 } : shape));
          setlastCursorPos({ x: e.clientX, y: e.clientY });
        },
        [mode]
      );

    return <div
        className={`shape shape-${type} ${draggingShape === id ? "dragging" : ""} ${drawingShapeId === id ? "drawing-preview" : ""}`}
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
        onMouseDown={handleShapeMouseDown}
    />
}

export const Shape = memo(_Shape);