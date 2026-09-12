import { getRandomColor } from "@infinite-canvas/utils";
import { useCanvasStore, useCanvasStoreApi } from "../CanvasContext";
import { useCallback, useEffect } from "react";
import { Mode, Shape } from "../types";
import "./index.css";

const getMaxZIndex = (shapes: Shape[]) => {
  let maxZIndex = 0;
  if (shapes.length === 0) {
    return maxZIndex;
  }
  shapes.forEach((shape) => {
    if (shape.zIndex > maxZIndex) {
      maxZIndex = shape.zIndex;
    }   
  });
  return maxZIndex;
}

export function Viewport({ children }: { children: React.ReactNode }) {
  const mode = useCanvasStore(state => state.mode);
  const shapes = useCanvasStore(state => state.shapes);
  const draggingShape = useCanvasStore(state => state.draggingShape);
  const drawingShapeId = useCanvasStore(state => state.drawingShapeId);
  const drawingUpdate = useCanvasStore(state => state.drawingUpdate);
  const isDragging = useCanvasStore(state => state.isDragging);
  const setContainer = useCanvasStore(state => state.setContainer);
  const setCanvasOffset = useCanvasStore(state => state.setCanvasOffset);
  const setShapes = useCanvasStore(state => state.setShapes);
  const setDrawingShapeId = useCanvasStore(state => state.setDrawingShapeId);
  const setDrawindStartCoords = useCanvasStore(state => state.setDrawingStartCoords);
  const setLastCursorPos = useCanvasStore(state => state.setLastCursorPos);
  const setIsDragging = useCanvasStore(state => state.setIsDragging);
  const setDraggingShape = useCanvasStore(state => state.setDraggingShape);
  const setDrawingUpdate = useCanvasStore(state => state.setDrawingUpdate);
  const setMode = useCanvasStore(state => state.setMode);

  const canvasStore = useCanvasStoreApi();  

  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    const canvasOffset = canvasStore.getState().canvasOffset;
    return {
      x: clientX - canvasOffset.x,
      y: clientY - canvasOffset.y,
    };
  },[]);

  const updateDrawingShape = useCallback(
    (canvasCoords: { x: number; y: number }) => {
      if (drawingUpdate) {
        cancelAnimationFrame(drawingUpdate);
      }

      if(!drawingShapeId ){
        return;
      }

      const _drawingUpdate = requestAnimationFrame(() => {
        if (!drawingShapeId) return;
        const drawingStartCoords = canvasStore.getState().drawingStartCoords;
        const width = Math.abs(canvasCoords.x - drawingStartCoords.x);
        const height = Math.abs(canvasCoords.y - drawingStartCoords.y);
        const x = Math.min(canvasCoords.x, drawingStartCoords.x);
        const y = Math.min(canvasCoords.y, drawingStartCoords.y);
        const shapeIndex = shapes.findIndex(shape => shape.id === drawingShapeId);
        if (shapeIndex !== -1) {
          shapes[shapeIndex] = { ...shapes[shapeIndex], x, y, width, height };
          setShapes([...shapes]);
        }
      });

      setDrawingUpdate(_drawingUpdate);
    },
    [drawingShapeId]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (mode === Mode.DRAW) {
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
          zIndex: getMaxZIndex(shapes) + 1,
        };
        setShapes([ ...shapes, newShape ]);
        setDrawingShapeId(newShapeId);
        setDrawindStartCoords(canvasCoords);
      } else if (draggingShape === null) {
        setIsDragging(true);
      }
      setLastCursorPos({ x: e.clientX, y: e.clientY });
    },
    [mode, draggingShape, getCanvasCoordinates, shapes]
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
        const lastCursorPos = canvasStore.getState().lastCursorPos;
        const canvasOffset = canvasStore.getState().canvasOffset;
        
        const deltaX = e.clientX - lastCursorPos.x;
        const deltaY = e.clientY - lastCursorPos.y;

        setCanvasOffset({
          x: canvasOffset.x + deltaX,
          y: canvasOffset.y + deltaY,
        });

        setLastCursorPos({ x: e.clientX, y: e.clientY });
      }
    },
    [isDragging, draggingShape, drawingShapeId, getCanvasCoordinates, updateDrawingShape]
  );

  const handleMouseUp = useCallback(() => {
    if (drawingShapeId) {
      if (drawingUpdate) {
        cancelAnimationFrame(drawingUpdate);
        setDrawingUpdate(null);
      }

      const drawingShape = shapes.find(shape => shape.id === drawingShapeId);
      if (
        !drawingShape ||
        drawingShape.width <= 5 ||
        drawingShape.height <= 5
      ) {
        setShapes(shapes.filter(shape => shape.id !== drawingShapeId));
      }

      setDrawingShapeId(null);
      setMode(Mode.PAN);
    }

    setIsDragging(false);
    setDraggingShape(null);
  }, [drawingShapeId, shapes]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastCursorPos({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isDragging) {
        const lastCursorPos = canvasStore.getState().lastCursorPos;
        const canvasOffset = canvasStore.getState().canvasOffset;

        const deltaX = e.touches[0].clientX - lastCursorPos.x;
        const deltaY = e.touches[0].clientY - lastCursorPos.y;

        setCanvasOffset({
          x: canvasOffset.x + deltaX,
          y: canvasOffset.y + deltaY,
        });

        setLastCursorPos({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        });
      }
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (drawingShapeId) {
        if (drawingUpdate) {
          cancelAnimationFrame(drawingUpdate);
          setDrawingUpdate(null);
        }

        const drawingShape = shapes.find((s) => s.id === drawingShapeId);
        if (
          !drawingShape ||
          drawingShape.width <= 5 ||
          drawingShape.height <= 5
        ) {
          setShapes(shapes.filter(shape => shape.id !== drawingShapeId));
        }
        setMode(Mode.PAN);
      }
      setIsDragging(false);
      setDraggingShape(null);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingShape !== null && !drawingShapeId) {
        const container = canvasStore.getState().container;
        if (!container) return;

        const clientX = e.clientX;
        const clientY = e.clientY;

        const lastCursorPos = canvasStore.getState().lastCursorPos;
        const deltaX = clientX - lastCursorPos.x;
        const deltaY = clientY - lastCursorPos.y;

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
          const canvasOffset = canvasStore.getState().canvasOffset;
          setCanvasOffset({
            x: canvasOffset.x + canvasDeltaX,
            y: canvasOffset.y + canvasDeltaY,
          });
        }
        const shapeIndex = shapes.findIndex(shape => shape.id === draggingShape);
        if (shapeIndex !== -1) {
          shapes[shapeIndex] = { ...shapes[shapeIndex], x: shapes[shapeIndex].x + deltaX, y: shapes[shapeIndex].y + deltaY };
          setShapes([...shapes]);
        }
        setLastCursorPos({ x: clientX, y: clientY });
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("mousemove", handleGlobalMouseMove);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [drawingShapeId, draggingShape, shapes]);

  return <div
    className={`infinite-canvas ${mode === "draw" ? "draw-mode" : ""}`}
    ref={setContainer}
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onTouchStart={handleTouchStart}
    onTouchMove={handleTouchMove}
    onTouchEnd={handleTouchEnd}
  >
    {children}
  </div>
}