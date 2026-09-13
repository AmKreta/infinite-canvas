import React, { useCallback, memo } from "react"
import "./index.css"
import { Mode, Shape as ShapeProps } from "../../types"
import { useCanvasStore, useCanvasStoreApi } from "../CanvasContext"
import { getShapeMaxZIndex } from "../../utils/maxShapeZIndex"

const _Shape: React.FC<ShapeProps> = ({ id, type, x, y, width, height, color, zIndex }) => {
    const setDraggingShape = useCanvasStore(s=>s.setDraggingShape);
    const setShapes = useCanvasStore(s=>s.setShapes);
    const setlastCursorPos = useCanvasStore(s=>s.setLastCursorPos);
    const isDragging = useCanvasStore(s=>s.draggingShape === id);
    const isDrawingPreview = useCanvasStore(s=>s.drawingShapeId === id);
    const canvasStore = useCanvasStoreApi();

    const handleShapeMouseDown = useCallback(
        (e: React.MouseEvent) => {
          if (canvasStore.getState().mode === Mode.DRAW) {
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
        [canvasStore, setDraggingShape, setShapes, setlastCursorPos, id]
      );

    return <div
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
        onMouseDown={handleShapeMouseDown}
    />
}

export const Shape = memo(_Shape);