import { getRandomColor } from "@infinite-canvas/utils";
import { useCanvasStore, useCanvasStoreApi } from "../CanvasContext";
import { useCallback, useEffect } from "react";
import { Mode, Shape } from "../../types";
import { getShapeMaxZIndex } from "../../utils/maxShapeZIndex";
import "./index.css";

export function Viewport({ children }: { children: React.ReactNode }) {
  const mode = useCanvasStore(state => state.mode);
  const shapes = useCanvasStore(state => state.shapes);
  const drawingUpdate = useCanvasStore(state => state.drawingUpdate);
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

      const drawingShapeId = canvasStore.getState().drawingShapeId;

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
        setShapes(shapes.map(s=>s.id===drawingShapeId ? {...s,  x, y, width, height} : s))
      });

      setDrawingUpdate(_drawingUpdate);
    },
    [shapes]
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
          zIndex: getShapeMaxZIndex(shapes) + 1,
        };
        setShapes([ ...shapes, newShape ]);
        setDrawingShapeId(newShapeId);
        setDrawindStartCoords(canvasCoords);
        return;
      }
      const draggingShape = canvasStore.getState().draggingShape;
      if (draggingShape === null) {
        setIsDragging(true);
      }
      setLastCursorPos({ x: e.clientX, y: e.clientY });
    },
    [mode, getCanvasCoordinates, shapes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const draggingShape = canvasStore.getState().draggingShape;
      if (draggingShape !== null) {
        // Shape dragging is handled by the global document mousemove
        // listener below, so it keeps tracking the cursor even if it
        // leaves this element's bounds mid-drag.
        return;
      }
      const drawingShapeId = canvasStore.getState().drawingShapeId;
      if (drawingShapeId) {
        const canvasCoords = getCanvasCoordinates(e.clientX, e.clientY);
        updateDrawingShape(canvasCoords);
        return;
      }
      const isDragging = canvasStore.getState().isDragging;
      if (isDragging) {
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
    [getCanvasCoordinates, updateDrawingShape]
  );

  const handleMouseUp = useCallback(() => {
    const drawingShapeId = canvasStore.getState().drawingShapeId;
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
  }, [shapes]);

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
      const isDragging = canvasStore.getState().isDragging;
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
    [setCanvasOffset, setLastCursorPos]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      const drawingShapeId = canvasStore.getState().drawingShapeId;
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
      const draggingShape = canvasStore.getState().draggingShape;
      const drawingShapeId = canvasStore.getState().drawingShapeId;
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
        setShapes(shapes.map(s=>s.id===draggingShape ? ({...s, x: s.x + deltaX, y: s.y + deltaY}) : s))
        setLastCursorPos({ x: clientX, y: clientY });
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("mousemove", handleGlobalMouseMove);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
    };
  }, [shapes]);

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