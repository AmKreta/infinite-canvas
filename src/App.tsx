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
import { useCornerShapes } from "./hooks/useCornerShapes";
import { SpatialHash } from "./utils/spatialHash";

type Mode = "pan" | "draw";


const DRAG_STATE_COMMIT_FRAMES = 10;

function App() {
  const [canvasOffset, setCanvasOffset] = useState({
    x: -window.innerWidth,
    y: -window.innerHeight,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [shapes, setShapes] = useState<ShapeType[]>([]);
  const [draggingShapeIndex, setDraggingShapeIndex] = useState<number | null>(null);
  const [drawingShapeId, setDrawingShapeId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("pan");
  const lastCursorPos = useRef({ x: 0, y: 0 });
  const drawingStartCoords = useRef({ x: 0, y: 0 });
  const maxZIndex = useRef(0);
  const [cornerElements, updateCornerElementOnAdd, updateCornerElementOnDrag] = useCornerShapes();
  const spatialHash = useRef(new SpatialHash<ShapeType>(500, 2));
  const liveDragShape = useRef<ShapeType | null>(null);
  const liveDragShapeNode = useRef<HTMLDivElement | null>(null);
  const dragCommitFrameCount = useRef(0);

  const handleShapeMouseDown = useCallback(
    (e: React.MouseEvent, shapeId: string) => {
      if (mode === "draw" || !shapeId) {
        return false;
      }

      e.stopPropagation();
      e.preventDefault();
      liveDragShapeNode.current = e.target as HTMLDivElement;
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
      liveDragShape.current = { ...shapes[draggingShapeIndex], zIndex: maxZIndex.current };
      dragCommitFrameCount.current = 0;
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
          spatialHash.current.update(shape.id, newShape);
          updateCornerElementOnAdd(newShape);
          return newShape;
        }
        return shape;
      })
    );
  }, [drawingShapeId]));

  const [updateDraggingShape, cancelUpdateDraggingShape] = useRAFThrottledFn(useCallback((e: React.PointerEvent) => {
    if (draggingShapeIndex === null || !liveDragShape.current) return;
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

    // Hot path: mutate the live ref, write the transform straight to the DOM,
    // and keep the spatial hash current — all cheap, all synchronous, none of
    // it goes through React. This is what avoids a full re-render every frame.
    const draggedShape = liveDragShape.current;
    draggedShape.x += deltaX;
    draggedShape.y += deltaY;
  
    if (liveDragShapeNode.current) {
      liveDragShapeNode.current.style.transform = `translate(${draggedShape.x}px, ${draggedShape.y}px) scale(1.05)`;
    }
    spatialHash.current.update(draggedShape.id, draggedShape);

    // Periodically fold the live position back into React state so anything
    // driven by `shapes` (the minimap, corner-bounds tracking) stays roughly
    // live during the drag instead of only updating once on release.
    dragCommitFrameCount.current += 1;
    if (dragCommitFrameCount.current >= DRAG_STATE_COMMIT_FRAMES) {
      dragCommitFrameCount.current = 0;
      const committedShape = { ...draggedShape };
      setShapes((prev) => {
        const newShapes = [...prev];
        newShapes[draggingShapeIndex] = committedShape;
        updateCornerElementOnDrag(newShapes, draggingShapeIndex);
        return newShapes;
      });
    }

    lastCursorPos.current = { x: e.clientX, y: e.clientY };
  }, [draggingShapeIndex]));

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

        spatialHash.current.add(newShapeId, newShape);
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
      const drawingShape = shapes.find((s) => s.id === drawingShapeId);
      if (
        !drawingShape ||
        drawingShape.width <= 5 ||
        drawingShape.height <= 5
      ) {
        spatialHash.current.remove(drawingShapeId);
        setShapes((prev) => prev.filter((s) => s.id !== drawingShapeId));
      }

      setDrawingShapeId(null);
      setMode("pan");
    }

    cancelUpdateDraggingShape();
    if (draggingShapeIndex !== null && liveDragShape.current) {
      const finalShape = liveDragShape.current;
      setShapes((prev) => {
        const newShapes = [...prev];
        newShapes[draggingShapeIndex] = finalShape;
        updateCornerElementOnDrag(newShapes, draggingShapeIndex);
        return newShapes;
      });
      liveDragShape.current = null;
      liveDragShapeNode.current = null;
    }
    setDraggingShapeIndex(null);

    cancelUpdateCanvasOffset();
    setIsDragging(false);

  }, [drawingShapeId, shapes, draggingShapeIndex]);

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

  const visibleShapes = useMemo(() => {
    // Shapes are stored in canvas space, so the viewport has to be converted
    // into it before querying.
    const viewportOrigin = getCanvasCoordinates(0, 0);
    return spatialHash.current.getItemsBetween(
      viewportOrigin.x,
      viewportOrigin.y,
      window.innerWidth,
      window.innerHeight
    );
  }, [getCanvasCoordinates, shapes]);

  console.log(spatialHash.current, visibleShapes);

  return (
    <>
      <Toolbar
        onShapeSelect={handleShapeSelect}
        onReset={() => {
          setShapes([]);
          spatialHash.current.clear();
        }}
      />

      <div
        className={`infinite-canvas ${mode === "draw" ? "draw-mode" : ""}`}
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
          {visibleShapes.map((shape, index) => (
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
        cornerShapes={cornerElements}
      />
    </>
  );
}

export default App;
