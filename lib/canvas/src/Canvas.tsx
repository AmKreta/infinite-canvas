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
  // Marks the *next* store notification as caused by our own external-sync
  // write below, so the subscription doesn't echo it straight back out.
  const isExternalUpdateRef = useRef(false);

  // Internal -> controlled. Subscribes directly to the store instead of
  // comparing React-rendered values: two effects on the same component each
  // read `shapes`/`storeShapes` from their *own* render's closure, and React
  // flushes a passive effect from a pre-correction render before the
  // layout-effect-triggered re-render's own effect ever runs - comparing
  // props there sees a mismatch that was never real and fires `onChange`,
  // which round-trips back down and repeats forever. `subscribe` fires
  // synchronously on the actual `set()` call, independent of React's commit
  // timing, so there's no stale-render window for that to happen in.
  // Declared before the sync-down effect so it's already registered when
  // that effect makes its first write.
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

  // Controlled -> internal. Only push down when `shapes` is a genuinely
  // different reference from what the store already holds, read fresh via
  // getState() rather than a selector, so this never acts on a stale value.
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
