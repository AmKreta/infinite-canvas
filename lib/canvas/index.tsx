import { CanvasProvider } from "./src/components/CanvasContext";
import { DrawingArea } from "./src/components/drawingArea";
import Minimap from "./src/components/minimap";
import Toolbar from "./src/components/toolbar";
import { Viewport } from "./src/components/viewport";

export default function Canvas() {
  return (
    <CanvasProvider>
      <Viewport>
        <Toolbar />
        <DrawingArea />
      </Viewport>
      <Minimap />
    </CanvasProvider>
  );
}
