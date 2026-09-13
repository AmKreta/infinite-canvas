import { useLayoutEffect, useRef } from "react";
import { useCanvasStoreApi } from "./components/CanvasContext";
import { DrawingArea } from "./components/drawingArea";
import Minimap from "./components/minimap";
import Toolbar from "./components/toolbar";
import { Viewport } from "./components/viewport";
import type { Shape } from "./types";

interface CanvasProps {
  shapes?: Shape[];
  onChange?: (shapes: Shape[]) => void;
}

export function Canvas({ shapes, onChange }: CanvasProps) {
  const canvasStore = useCanvasStoreApi();
  const isExternalUpdateRef = useRef(false);

  useLayoutEffect(() => {
    if (!onChange) return;
    return canvasStore.subscribe((state, prevState) => {
      if (state.shapes === prevState.shapes) return;
      if (isExternalUpdateRef.current) {
        isExternalUpdateRef.current = false;
        return;
      }
      onChange(state.shapes);
    });
  }, [canvasStore, onChange]);

  useLayoutEffect(() => {
    if (shapes !== undefined && shapes !== canvasStore.getState().shapes) {
      isExternalUpdateRef.current = true;
      canvasStore.getState().setShapes(shapes);
    }
  }, [shapes, canvasStore]);

  return (
    <>
      <Viewport>
        <Toolbar />
        <DrawingArea />
      </Viewport>
      <Minimap />
    </>
  );
}
