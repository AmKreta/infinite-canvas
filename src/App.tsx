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
import { useRAFThrottledFn } from "./hooks/useRAFThrottledFn";

type Mode = "pan" | "draw";

function App() {
  const [canvasOffset, setCanvasOffset] = useState({
    x: -window.innerWidth,
    y: -window.innerHeight,
  });
  const [isDragging, setIsDragging] = useState(false);
  const lastCursorPos = useRef({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<ShapeType[]>([]);
  const [draggingShapeIndex, setDraggingShapeIndex] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("pan");
  const drawingStartCoords = useRef({ x: 0, y: 0 });
  const [drawingShapeId, setDrawingShapeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxZIndex = useRef(0);
  const cornerElements = useRef<{
    top: ShapeType | null;
    bottom: ShapeType | null;
    left: ShapeType | null;
    right: ShapeType | null;
  }>({
    top: null,
    bottom: null,
    left: null,
    right: null,
  });

  const updateCornerElementOnAdd = useCallback((shape: ShapeType) => {
    const corners = cornerElements.current;
  
    if (corners.top === null) {
      corners.top = corners.bottom = corners.left = corners.right = shape;
      return;
    }
  
    if (shape.x < corners.left!.x) corners.left = shape;
    if (shape.x > corners.right!.x) corners.right = shape;
    if (shape.y < corners.top!.y) corners.top = shape;
    if (shape.y > corners.bottom!.y) corners.bottom = shape;
  }, []);

  const updateCornerElementOnDrag = useCallback((shapes: readonly ShapeType[], draggingShapeIndex: number) => {
    const shape = shapes[draggingShapeIndex];
    const corners = cornerElements.current;
  
    const wasCorner =
      shape === corners.top ||
      shape === corners.bottom ||
      shape === corners.left ||
      shape === corners.right;
  
    if (!wasCorner) {
      // Shape wasn't an extreme before, so it can only newly become one
      // in the direction it moved — cheap comparison against current corners.
      if (shape.x < corners.left!.x) corners.left = shape;
      if (shape.x > corners.right!.x) corners.right = shape;
      if (shape.y < corners.top!.y) corners.top = shape;
      if (shape.y > corners.bottom!.y) corners.bottom = shape;
      return;
    }
  
    // Shape was a corner and moved — it may no longer be extreme in that
    // direction, so recompute from scratch.
    let left = shapes[0], right = shapes[0], top = shapes[0], bottom = shapes[0];
    for (let i = 1; i < shapes.length; i++) {
      const s = shapes[i];
      if (s.x < left.x) left = s;
      if (s.x > right.x) right = s;
      if (s.y < top.y) top = s;
      if (s.y > bottom.y) bottom = s;
    }
    corners.left = left;
    corners.right = right;
    corners.top = top;
    corners.bottom = bottom;
  }, []);

  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      if (mode === "draw" || !shapeId) {
        return false;
      }

      e.stopPropagation();
      e.preventDefault();

      const draggingShapeIndex = shapes.findIndex((s) => s.id === shapeId);
      if (draggingShapeIndex === -1) return;
      setDraggingShapeIndex(draggingShapeIndex);
      maxZIndex.current = (shapes[draggingShapeIndex].zIndex > maxZIndex.current)
        ? shapes[draggingShapeIndex].zIndex
        : maxZIndex.current + 1;
      setShapes((prev) => {
        const newShapes = [...prev];
        newShapes[draggingShapeIndex] = { ...newShapes[draggingShapeIndex], zIndex: maxZIndex.current };
        return newShapes;
      });
      lastCursorPos.current = { x: e.clientX, y: e.clientY };
    },
    [mode, shapes]
  );

  const getCanvasCoordinates = useCallback(
    (clientX: number, clientY: number) => ({
      x: clientX - canvasOffset.x,
      y: clientY - canvasOffset.y,
    }),
    [canvasOffset]
  );

  const [updateDrawingShape, cancelUpdateDrawingShape] = useRAFThrottledFn(useCallback((e: React.PointerEvent) => {
    if (!drawingShapeId) return;
    const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);
    const width = Math.abs(canvasCoords.x - drawingStartCoords.current.x);
    const height = Math.abs(canvasCoords.y - drawingStartCoords.current.y);
    const x = Math.min(canvasCoords.x, drawingStartCoords.current.x);
    const y = Math.min(canvasCoords.y, drawingStartCoords.current.y);
    setShapes((prev) =>
      prev.map((shape) => {
        if(shape.id === drawingShapeId) {
          const newShape = { ...shape, x, y, width, height };
          updateCornerElementOnAdd(newShape);
          return newShape;
        }
        return shape;
      })
    );
  }, [drawingShapeId]));

  const [updateDraggingShape, cancelUpdateDraggingShape] = useRAFThrottledFn(useCallback((e: React.PointerEvent) => {
    if (draggingShapeIndex === null) return;
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

    const deltaX = (e.clientX - lastCursorPos.current.x);
    const deltaY = (e.clientY - lastCursorPos.current.y);
    setShapes((prev) => {
      const newShapes = [...prev];
      newShapes[draggingShapeIndex] = { ...newShapes[draggingShapeIndex], x: newShapes[draggingShapeIndex].x + deltaX, y: newShapes[draggingShapeIndex].y + deltaY };
      updateCornerElementOnDrag(newShapes, draggingShapeIndex);
      return newShapes;
    });
    lastCursorPos.current = { x: e.clientX, y: e.clientY };
  }, [draggingShapeIndex, shapes]));

  const [updateCanvasOffset, cancelUpdateCanvasOffset] = useRAFThrottledFn(useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastCursorPos.current.x;
    const deltaY = e.clientY - lastCursorPos.current.y;
    setCanvasOffset((prev) => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
    lastCursorPos.current = { x: e.clientX, y: e.clientY };
  }, [isDragging]));

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
          zIndex: maxZIndex.current + 1,
        };

        setShapes((prev) => [...prev, newShape]);
        setDrawingShapeId(newShapeId);
        drawingStartCoords.current = canvasCoords;
        lastCursorPos.current = { x: e.clientX, y: e.clientY };
      } else if (draggingShapeIndex === null) {
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
    [mode, draggingShapeIndex, getCanvasCoordinates, shapes]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (drawingShapeId) {
        updateDrawingShape(e);
      } else if (draggingShapeIndex !== null) {
        updateDraggingShape(e);
      } else if (isDragging) {
        updateCanvasOffset(e);
      }
    },
    [isDragging, draggingShapeIndex, drawingShapeId, getCanvasCoordinates, updateDrawingShape]
  );

  const handlePointerUp = useCallback(() => {
    if (drawingShapeId) {
      cancelUpdateDrawingShape();
      const drawingShape = shapes[shapes.length - 1];
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

    cancelUpdateDraggingShape();
    setDraggingShapeIndex(null);

    cancelUpdateCanvasOffset();
    setIsDragging(false);

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
      minX: Math.min(cornerElements.current.left?.x || -window.innerWidth, -window.innerWidth),
      maxX: Math.max(cornerElements.current.right?.x || window.innerWidth, window.innerWidth),
      minY: Math.min(cornerElements.current.top?.y || -window.innerHeight, -window.innerHeight),
      maxY: Math.max(cornerElements.current.bottom?.y || window.innerHeight, window.innerHeight),
    };
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
          {shapes.map((shape, index) => (
            <Shape
              key={shape.id}
              isDragging={draggingShapeIndex === index}
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
