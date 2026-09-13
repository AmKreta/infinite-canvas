import type React from "react";
import { useCallback } from "react";
import { Mode } from "../../types";
import { useCanvasStore } from "../CanvasContext";
import "./index.css";

const Toolbar: React.FC = () => {
  const setMode = useCanvasStore((s) => s.setMode);
  const setShapes = useCanvasStore((s) => s.setShapes);

  const handleShapeSelect = useCallback(() => {
    setMode(Mode.DRAW);
  }, [setMode]);

  const onReset = useCallback(() => {
    setShapes([]);
  }, [setShapes]);

  return (
    <div className="toolbar">
      <div className="toolbar-content">
        <button className="reset-btn" onClick={onReset}>
          Reset
        </button>
        <button className="create-btn" onClick={handleShapeSelect}>
          Create
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
