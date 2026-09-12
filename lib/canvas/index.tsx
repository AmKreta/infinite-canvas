import { CanvasProvider } from "./src/CanvasContext";
import { Viewport } from "./src/viewport";

export default function Canvas() {
  return <CanvasProvider >
    <Viewport>
      <div>amk</div>
    </Viewport>
  </CanvasProvider>
}