import { useMemo } from "react";
import { useCanvasStore } from "../CanvasContext";
import { Shape } from "../shape";
import "./index.css";

export function DrawingArea() {
  const canvasOffset = useCanvasStore((state) => state.canvasOffset);
  const shapes = useCanvasStore((state) => state.shapes);

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
        <Shape key={shape.id} {...shape} />
      ))}
    </div>
  );
}
