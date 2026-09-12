import { useCanvasStore } from "../CanvasContext";
import "./index.css";

export function Viewport({ children }: { children: React.ReactNode }) {
  const mode = useCanvasStore(state => state.mode);
  const setContainer = useCanvasStore(state => state.setContainer);

  return <div
    className={`infinite-canvas ${mode === "draw" ? "draw-mode" : ""}`}
    ref={setContainer}
  >
    {children}
  </div>
}