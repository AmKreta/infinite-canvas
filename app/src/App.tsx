import { Canvas, CanvasProvider, type Shape } from "@infinite-canvas/canvas";
import { useState } from "react";
import "./App.css";

function App1() {
  const [shapes, setShapes] = useState<Shape[]>([]);

  return (
    <CanvasProvider>
      <Canvas shapes={shapes} onChange={setShapes} />
    </CanvasProvider>
  );
}

export default App1;
