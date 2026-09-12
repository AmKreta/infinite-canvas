import { createContext } from "react";
import { CanvasStateType } from "../CanvasState";
import { Mode } from "../types";

const defaultCanvasContextValues: CanvasStateType = {
    state: {
        canvasOffset: { x: 0, y: 0 },
        isDragging: false,
        shapes: new Map(),
        draggingShape: null,
        mode: Mode.PAN,
        drawingShapeId: null,
    },
    refs: {
        container: null,
        drawingUpdate: null,
        lastCursorPos: { x: 0, y: 0 },
        drawingStartCoords: { x: 0, y: 0 },
    },
    actions: {
        setCanvasOffset: () => {},
        setIsDragging: () => {},
        setShapes: () => {},
        setDraggingShape: () => {},
        setMode: () => {},
        setDrawingShapeId: () => {},
    },
};

export const CanvasContext = createContext<CanvasStateType>(defaultCanvasContextValues);