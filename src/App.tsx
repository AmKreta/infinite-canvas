import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import "./App.css";
import Toolbar from "./components/Toolbar";
import Minimap from "./components/Minimap";
import type { Shape as ShapeType } from "./types";
import Shape from "./components/Shape";
import { getRandomColor } from "./utils/colors";

type Mode = "pan" | "draw";

function App() {
  const [canvasOffset, setCanvasOffset] = useState({
    x: -window.innerWidth,
    y: -window.innerHeight,
  });
  const [isDragging, setIsDragging] = useState(false);
  const lastCursorPos = useRef({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<ShapeType[]>([]);
  const [draggingShape, setDraggingShape] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("pan");
  const drawingStartCoords = useRef({ x: 0, y: 0 });
  const [drawingShapeId, setDrawingShapeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingUpdateRef = useRef<number | null>(null);

  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      if (mode === "draw" || !shapeId) {
        return false;
      }

      e.stopPropagation();
      e.preventDefault();

      setDraggingShape(shapeId);

      setShapes((prev) => {
        const maxZ = Math.max(0, ...prev.map((s) => s.zIndex));
        return prev.map((shape) =>
          shape.id === shapeId ? { ...shape, zIndex: maxZ + 1 } : shape
        );
      });

      lastCursorPos.current = { x: e.clientX, y: e.clientY };
    },
    [mode]
  );

  const getCanvasCoordinates = useCallback(
    (clientX: number, clientY: number) => ({
      x: clientX - canvasOffset.x,
      y: clientY - canvasOffset.y,
    }),
    [canvasOffset]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      if (mode === "draw") {
        const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);
        const newShapeId = `drawing-${Date.now()}`;
        const newColor = getRandomColor();

        const newShape: ShapeType = {
          id: newShapeId,
          type: "rectangle",
          x: canvasCoords.x,
          y: canvasCoords.y,
          width: 0,
          height: 0,
          color: newColor,
          zIndex:
            shapes.length > 0
              ? Math.max(...shapes.map((s) => s.zIndex)) + 1
              : 1,
        };

        setShapes((prev) => [...prev, newShape]);
        setDrawingShapeId(newShapeId);
        drawingStartCoords.current = canvasCoords;
        lastCursorPos.current = { x: e.clientX, y: e.clientY };
      } else if (draggingShape === null) {
        const shapeClicked = (e.target as HTMLElement).classList.contains("shape");
        if (shapeClicked) {
          const id = (e.target as HTMLElement).id;
          handleShapeMouseDown(e, id);
        } else {
          setIsDragging(true);
        }
        lastCursorPos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [mode, draggingShape, getCanvasCoordinates, shapes]
  );

  const updateDrawingShape = useCallback(
    (canvasCoords: { x: number; y: number }) => {
      if (!drawingShapeId || drawingUpdateRef.current) {
        if (drawingUpdateRef.current) {
          cancelAnimationFrame(drawingUpdateRef.current);
        }
      }

      drawingUpdateRef.current = requestAnimationFrame(() => {
        if (!drawingShapeId) return;

        const width = Math.abs(canvasCoords.x - drawingStartCoords.current.x);
        const height = Math.abs(canvasCoords.y - drawingStartCoords.current.y);
        const x = Math.min(canvasCoords.x, drawingStartCoords.current.x);
        const y = Math.min(canvasCoords.y, drawingStartCoords.current.y);

        setShapes((prev) =>
          prev.map((shape) =>
            shape.id === drawingShapeId
              ? { ...shape, x, y, width, height }
              : shape
          )
        );
      });
    },
    [drawingShapeId]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingShape !== null) {
        const deltaX = (e.clientX - lastCursorPos.current.x);
        const deltaY = (e.clientY - lastCursorPos.current.y);

        const scrollMargin = 50;
        const scrollSpeed = 5;
        let canvasDeltaX = 0;
        let canvasDeltaY = 0;

        if (e.clientX < scrollMargin) {
          canvasDeltaX = scrollSpeed;
        } else if (e.clientX > window.innerWidth - scrollMargin) {
          canvasDeltaX = -scrollSpeed;
        }

        if (e.clientY < scrollMargin) {
          canvasDeltaY = scrollSpeed;
        } else if (e.clientY > window.innerHeight - scrollMargin) {
          canvasDeltaY = -scrollSpeed;
        }

        if (canvasDeltaX !== 0 || canvasDeltaY !== 0) {
          setCanvasOffset((prev) => ({
            x: prev.x + canvasDeltaX,
            y: prev.y + canvasDeltaY,
          }));
        }

        setShapes((prev) =>
          prev.map((shape) =>
            shape.id === draggingShape
              ? {
                ...shape,
                x: shape.x + deltaX,
                y: shape.y + deltaY,
              }
              : shape
          )
        );

        lastCursorPos.current = { x: e.clientX, y: e.clientY };
      } else if (drawingShapeId) {
        const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);
        updateDrawingShape(canvasCoords);
      } else if (isDragging) {
        const deltaX = e.clientX - lastCursorPos.current.x;
        const deltaY = e.clientY - lastCursorPos.current.y;

        setCanvasOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        lastCursorPos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isDragging, draggingShape, drawingShapeId, getCanvasCoordinates, updateDrawingShape]
  );

  const handlePointerUp = useCallback(() => {
    if (drawingShapeId) {
      if (drawingUpdateRef.current) {
        cancelAnimationFrame(drawingUpdateRef.current);
        drawingUpdateRef.current = null;
      }

      const drawingShape = shapes.find((s) => s.id === drawingShapeId);
      if (
        !drawingShape ||
        drawingShape.width <= 5 ||
        drawingShape.height <= 5
      ) {
        setShapes((prev) => prev.filter((s) => s.id !== drawingShapeId));
      }

      setDrawingShapeId(null);
      setMode("pan");
    }

    setIsDragging(false);
    setDraggingShape(null);
  }, [drawingShapeId, shapes]);

  const handleShapeSelect = useCallback(() => {
    setMode("draw");
  }, []);

  const handleMinimapPositionChange = useCallback(
    (newPosition: { x: number; y: number }) => {
      setCanvasOffset(newPosition);
    },
    []
  );

  const canvasBounds = useMemo(() => {
    let bounds = {
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
    <>
      <Toolbar
        onShapeSelect={handleShapeSelect}
        onReset={() => {
          setShapes([]);
        }}
      />

      <div
        className={`infinite-canvas ${mode === "draw" ? "draw-mode" : ""}`}
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="canvas-content"
          id="canvas-content"
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
            width: canvasBounds.width,
            height: canvasBounds.height,
          }}
        >
          {shapes.map((shape) => (
            <Shape
              key={shape.id}
              isDragging={draggingShape === shape.id}
              isDrawingPreview={drawingShapeId === shape.id}
              {...shape}
            />
          ))}
        </div>
      </div>

      <Minimap
        shapes={shapes}
        canvasPosition={canvasOffset}
        onPositionChange={handleMinimapPositionChange}
        viewportSize={{ width: window.innerWidth, height: window.innerHeight }}
      />
    </>
  );
}

export default App;
