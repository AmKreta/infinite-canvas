import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import Canvas from "@infinite-canvas/canvas";
import { getRandomColor } from "@infinite-canvas/utils";
import Minimap from "./components/Minimap";
import Toolbar from "./components/Toolbar";
import type { Shape } from "./types";

type Mode = "pan" | "draw";

function App() {
  const [canvasOffset, setCanvasOffset] = useState({
    x: -window.innerWidth,
    y: -window.innerHeight,
  });
  const [isDragging, setIsDragging] = useState(false);
  const lastCursorPos = useRef({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [draggingShape, setDraggingShape] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("pan");
  const drawingStartCoords = useRef({ x: 0, y: 0 });
  const [drawingShapeId, setDrawingShapeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingUpdateRef = useRef<number | null>(null);

  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      if (mode === "draw") {
        return false;
      }

      e.stopPropagation();
      e.preventDefault();

      setDraggingShape(shapeId);

      setShapes((prev) => {
        const maxZ = Math.max(0, ...prev.map((s) => s.zIndex));
        return prev.map((shape) =>
          shape.id === shapeId ? { ...shape, zIndex: maxZ + 1 } : shape,
        );
      });

      lastCursorPos.current = { x: e.clientX, y: e.clientY };
    },
    [mode],
  );

  const getCanvasCoordinates = useCallback(
    (clientX: number, clientY: number) => ({
      x: clientX - canvasOffset.x,
      y: clientY - canvasOffset.y,
    }),
    [canvasOffset],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode === "draw") {
        const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);
        const newShapeId = `drawing-${Date.now()}`;
        const newColor = getRandomColor();

        const newShape: Shape = {
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
        setIsDragging(true);
        lastCursorPos.current = { x: e.clientX, y: e.clientY };
      }
    },
    [mode, draggingShape, getCanvasCoordinates, shapes],
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
              : shape,
          ),
        );
      });
    },
    [drawingShapeId],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingShape !== null) {
        // Shape dragging is handled by the global document mousemove
        // listener below, so it keeps tracking the cursor even if it
        // leaves this element's bounds mid-drag.
        return;
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
    [
      isDragging,
      draggingShape,
      drawingShapeId,
      getCanvasCoordinates,
      updateDrawingShape,
    ],
  );

  const handleMouseUp = useCallback(() => {
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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      lastCursorPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - lastCursorPos.current.x;
        const deltaY = e.touches[0].clientY - lastCursorPos.current.y;

        setCanvasOffset((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        lastCursorPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    [isDragging],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
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
        setMode("pan");
      }
      setIsDragging(false);
      setDraggingShape(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingShape !== null && !drawingShapeId) {
        const container = containerRef.current;
        if (!container) return;

        const clientX = e.clientX;
        const clientY = e.clientY;

        const deltaX = clientX - lastCursorPos.current.x;
        const deltaY = clientY - lastCursorPos.current.y;

        const scrollMargin = 50;
        const scrollSpeed = 5;

        let canvasDeltaX = 0;
        let canvasDeltaY = 0;

        if (clientX < scrollMargin) {
          canvasDeltaX = scrollSpeed;
        } else if (clientX > window.innerWidth - scrollMargin) {
          canvasDeltaX = -scrollSpeed;
        }

        if (clientY < scrollMargin) {
          canvasDeltaY = scrollSpeed;
        } else if (clientY > window.innerHeight - scrollMargin) {
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
              : shape,
          ),
        );

        lastCursorPos.current = { x: clientX, y: clientY };
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("mousemove", handleGlobalMouseMove);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [drawingShapeId, draggingShape, shapes]);

  const handleShapeSelect = useCallback(() => {
    setMode("draw");
  }, []);

  const handleMinimapPositionChange = useCallback(
    (newPosition: { x: number; y: number }) => {
      setCanvasOffset(newPosition);
    },
    [],
  );

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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="canvas-content"
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
            width: canvasBounds.width,
            height: canvasBounds.height,
            border: "10px solid red",
          }}
        >
          {shapes.map((shape) => (
            <div
              key={shape.id}
              className={`shape shape-${shape.type} ${
                draggingShape === shape.id ? "dragging" : ""
              } ${drawingShapeId === shape.id ? "drawing-preview" : ""}`}
              style={{
                left: shape.x,
                top: shape.y,
                width: shape.width,
                height: shape.height,
                borderRadius: "8px",
                backgroundColor: shape.color,
                borderColor: shape.color,
                zIndex: shape.zIndex,
              }}
              onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
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

function App1() {
  return <Canvas />;
}

export default App;
