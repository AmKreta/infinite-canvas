import { getRandomColor } from "@infinite-canvas/utils";
import { useCallback } from "react";
import { Mode, type Shape } from "../../types";
import { getShapeMaxZIndex } from "../../utils/maxShapeZIndex";
import { useCanvasStore, useCanvasStoreApi } from "../CanvasContext";
import "./index.css";

export function Viewport({ children }: { children: React.ReactNode }) {
  const mode = useCanvasStore((state) => state.mode);
  const shapes = useCanvasStore((state) => state.shapes);
  const drawingUpdate = useCanvasStore((state) => state.drawingUpdate);
  const setDragUpdate = useCanvasStore((state) => state.setDragUpdate);
  const setPendingDragDelta = useCanvasStore(
    (state) => state.setPendingDragDelta,
  );
  const setContainer = useCanvasStore((state) => state.setContainer);
  const setCanvasOffset = useCanvasStore((state) => state.setCanvasOffset);
  const setShapes = useCanvasStore((state) => state.setShapes);
  const setDrawingShapeId = useCanvasStore((state) => state.setDrawingShapeId);
  const setDrawindStartCoords = useCanvasStore(
    (state) => state.setDrawingStartCoords,
  );
  const setLastCursorPos = useCanvasStore((state) => state.setLastCursorPos);
  const setIsDragging = useCanvasStore((state) => state.setIsDragging);
  const setDraggingShape = useCanvasStore((state) => state.setDraggingShape);
  const setDrawingUpdate = useCanvasStore((state) => state.setDrawingUpdate);
  const setMode = useCanvasStore((state) => state.setMode);
  const canvasStore = useCanvasStoreApi();

  const getCanvasCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      const canvasOffset = canvasStore.getState().canvasOffset;
      return {
        x: clientX - canvasOffset.x,
        y: clientY - canvasOffset.y,
      };
    },
    [canvasStore.getState],
  );

  const updateDrawingShape = useCallback(
    (canvasCoords: { x: number; y: number }) => {
      if (drawingUpdate) {
        cancelAnimationFrame(drawingUpdate);
      }

      const drawingShapeId = canvasStore.getState().drawingShapeId;

      if (!drawingShapeId) {
        return;
      }

      const _drawingUpdate = requestAnimationFrame(() => {
        if (!drawingShapeId) return;
        const drawingStartCoords = canvasStore.getState().drawingStartCoords;
        const width = Math.abs(canvasCoords.x - drawingStartCoords.x);
        const height = Math.abs(canvasCoords.y - drawingStartCoords.y);
        const x = Math.min(canvasCoords.x, drawingStartCoords.x);
        const y = Math.min(canvasCoords.y, drawingStartCoords.y);
        setShapes(
          shapes.map((s) =>
            s.id === drawingShapeId ? { ...s, x, y, width, height } : s,
          ),
        );
      });

      setDrawingUpdate(_drawingUpdate);
    },
    [shapes, setShapes, canvasStore.getState, drawingUpdate, setDrawingUpdate],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
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
        setShapes([...shapes, newShape]);
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
    [
      mode,
      getCanvasCoordinates,
      shapes,
      canvasStore.getState,
      setDrawindStartCoords,
      setDrawingShapeId,
      setIsDragging,
      setLastCursorPos,
      setShapes,
    ],
  );

  const dragShape = useCallback(
    (e: React.PointerEvent, draggingShape: string) => {
      const container = canvasStore.getState().container;
      if (!container) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      const lastCursorPos = canvasStore.getState().lastCursorPos;
      const deltaX = clientX - lastCursorPos.x;
      const deltaY = clientY - lastCursorPos.y;
      setLastCursorPos({ x: clientX, y: clientY });

      const pendingDelta = canvasStore.getState().pendingDragDelta;
      setPendingDragDelta({
        x: pendingDelta.x + deltaX,
        y: pendingDelta.y + deltaY,
      });

      const pendingDragUpdate = canvasStore.getState().dragUpdate;
      if (pendingDragUpdate) {
        cancelAnimationFrame(pendingDragUpdate);
      }

      const _dragUpdate = requestAnimationFrame(() => {
        const { x: accDeltaX, y: accDeltaY } =
          canvasStore.getState().pendingDragDelta;
        setPendingDragDelta({ x: 0, y: 0 });

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

        const currentShapes = canvasStore.getState().shapes;
        setShapes(
          currentShapes.map((s) =>
            s.id === draggingShape
              ? { ...s, x: s.x + accDeltaX, y: s.y + accDeltaY }
              : s,
          ),
        );
      });

      setDragUpdate(_dragUpdate);
    },
    [
      canvasStore.getState,
      setCanvasOffset,
      setDragUpdate,
      setLastCursorPos,
      setPendingDragDelta,
      setShapes,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const draggingShape = canvasStore.getState().draggingShape;
      if (draggingShape !== null) {
        dragShape(e, draggingShape);
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
    [
      getCanvasCoordinates,
      updateDrawingShape,
      canvasStore.getState,
      setCanvasOffset,
      setLastCursorPos,
      dragShape,
    ],
  );

  const handlePointerUp = useCallback(() => {
    const drawingShapeId = canvasStore.getState().drawingShapeId;
    if (drawingShapeId) {
      const drawingUpdate = canvasStore.getState().drawingUpdate;
      if (drawingUpdate) {
        cancelAnimationFrame(drawingUpdate);
        setDrawingUpdate(null);
      }
      const shapes = canvasStore.getState().shapes;
      const drawingShape = shapes.find((shape) => shape.id === drawingShapeId);
      if (
        !drawingShape ||
        drawingShape.width <= 5 ||
        drawingShape.height <= 5
      ) {
        setShapes(shapes.filter((shape) => shape.id !== drawingShapeId));
      }

      setDrawingShapeId(null);
      setMode(Mode.PAN);
    }

    const pendingDragUpdate = canvasStore.getState().dragUpdate;
    if (pendingDragUpdate) {
      cancelAnimationFrame(pendingDragUpdate);
      setDragUpdate(null);
    }
    setPendingDragDelta({ x: 0, y: 0 });

    setIsDragging(false);
    setDraggingShape(null);
  }, [
    canvasStore.getState,
    setDraggingShape,
    setDragUpdate,
    setDrawingShapeId,
    setDrawingUpdate,
    setIsDragging,
    setMode,
    setPendingDragDelta,
    setShapes,
  ]);

  return (
    <div
      className={`infinite-canvas ${mode === "draw" ? "draw-mode" : ""}`}
      ref={setContainer}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {children}
    </div>
  );
}
