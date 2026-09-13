import { createZustandContext } from "@infinite-canvas/createZustandContext";
import { createStore } from "zustand";
import { Mode, Shape, ShapeId } from "../types";

interface CanvasStateType {
    canvasOffset: { x: number, y: number };
    isDragging: boolean;
    shapes: Shape[];
    draggingShape: string | null;
    mode: Mode;
    drawingShapeId: string | null;
    container: HTMLDivElement | null;
    drawingUpdate: number | null;
    lastCursorPos: { x: number, y: number };
    drawingStartCoords: { x: number, y: number };
    setCanvasOffset: (canvasOffset: { x: number, y: number }) => void;
    setIsDragging: (isDragging: boolean) => void;
    setShapes: (shapes: Shape[]) => void;
    setDraggingShape: (draggingShape: string | null) => void;
    setMode: (mode: Mode) => void;
    setDrawingShapeId: (drawingShapeId: string | null) => void;
    setContainer: (container: HTMLDivElement | null) => void;
    setDrawingUpdate: (drawingUpdate: number | null) => void;
    setLastCursorPos: (lastCursorPos: { x: number, y: number }) => void;
    setDrawingStartCoords: (drawingStartCoords: { x: number, y: number }) => void;
}

const canvasStoreCreator = () => createStore<CanvasStateType>((set, get) => ({
    // reactive state
    canvasOffset: { x: 0, y: 0 },
    isDragging: false,
    shapes: [],
    draggingShape: null,
    mode: Mode.PAN,
    drawingShapeId: null,
    setCanvasOffset: (canvasOffset: { x: number, y: number }) => set({ canvasOffset }),
    setIsDragging: (isDragging: boolean) => set({ isDragging }),
    setShapes: (shapes: Shape[]) => set({ shapes }),
    setDraggingShape: (draggingShape: string | null) => set({ draggingShape }),
    setMode: (mode: Mode) => set({ mode }),
    setDrawingShapeId: (drawingShapeId: string | null) => set({ drawingShapeId }),
    // non-reactive state
    container: null,
    drawingUpdate: null,
    lastCursorPos: { x: 0, y: 0 },
    drawingStartCoords: { x: 0, y: 0 },
    setContainer: (container: HTMLDivElement | null) => get().container = container,
    setDrawingUpdate: (drawingUpdate: number | null) => get().drawingUpdate = drawingUpdate,
    setLastCursorPos: (lastCursorPos: { x: number, y: number }) => get().lastCursorPos = lastCursorPos,
    setDrawingStartCoords: (drawingStartCoords: { x: number, y: number }) => get().drawingStartCoords = drawingStartCoords,
}))

export const [CanvasProvider, useCanvasStore, useCanvasStoreApi] = createZustandContext<CanvasStateType>(canvasStoreCreator);