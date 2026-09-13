import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCanvasStore, useCanvasStoreApi } from "../CanvasContext";
import { Shape } from "../shape";
import "./index.css";
import { Mode } from "../../types";
import { getShapeMaxZIndex } from "../../utils/maxShapeZIndex";

export function DrawingArea() {
  const canvasOffset = useCanvasStore(
    useShallow((state) => state.canvasOffset),
  );
  const shapes = useCanvasStore((state) => state.shapes);
  const setDraggingShape = useCanvasStore((s) => s.setDraggingShape);
  const setShapes = useCanvasStore((s) => s.setShapes);
  const setlastCursorPos = useCanvasStore((s) => s.setLastCursorPos);
  const canvasStore = useCanvasStoreApi();

  const canvasBounds = useMemo(() => {
    const bounds = {
      minX: -window.innerWidth,
      maxX: window.innerWidth * 2,
      minY: -window.innerHeight,
      maxY: window.innerHeight * 2,
    };

    shapes.forEach((shape) => {
      bounds.minX = Math.min(bounds.minX, shape.x);
      bounds.maxX = Math.max(bounds.maxX, shape.x + shape.width);
      bounds.minY = Math.min(bounds.minY, shape.y);
      bounds.maxY = Math.max(bounds.maxY, shape.y + shape.height);
    });
    return {
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY,
    };
  }, [shapes]);

  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const id = (e.target as HTMLDivElement).id;
      if (canvasStore.getState().mode === Mode.DRAW || !id) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      setDraggingShape(id);
      const shapes = canvasStore.getState().shapes;
      const maxZIndex = getShapeMaxZIndex(shapes);
      setShapes(
        shapes.map((shape) =>
          shape.id === id ? { ...shape, zIndex: maxZIndex + 1 } : shape,
        ),
      );
      setlastCursorPos({ x: e.clientX, y: e.clientY });
    },
    [canvasStore, setDraggingShape, setShapes, setlastCursorPos],
  );

  return (
    <div
      className="canvas-content"
      style={{
        transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
        width: canvasBounds.width,
        height: canvasBounds.height,
      }}
    >
      {shapes.map((shape) => (
        <Shape
          key={shape.id}
          {...shape}
          onShapeMouseDown={handleShapeMouseDown}
        />
      ))}
    </div>
  );
}
