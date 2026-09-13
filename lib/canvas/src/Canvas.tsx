import { DrawingArea } from "./components/drawingArea";
import Minimap from "./components/minimap";
import Toolbar from "./components/toolbar";
import { Viewport } from "./components/viewport";

export function Canvas() {
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
