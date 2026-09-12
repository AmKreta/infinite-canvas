import { useRef, useState } from "react";
import { Mode, Shape, ShapeId } from "./types";

type CanvasStateProps = {
    height: number;
    width: number;
}

export const useCanvasState = ({ height, width }: CanvasStateProps) => {
    const [canvasOffset, setCanvasOffset] = useState({x: -width, y: -height});
    const [isDragging, setIsDragging] = useState(false);
    const [shapes, setShapes] = useState<Map<ShapeId, Shape>>(new Map());
    const [draggingShape, setDraggingShape] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>(Mode.PAN);
    const [drawingShapeId, setDrawingShapeId] = useState<string | null>(null);

    const drawingStartCoords = useRef({ x: 0, y: 0 });
    const lastCursorPos = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const drawingUpdateRef = useRef<number | null>(null);

    return {
        state: {
            canvasOffset,
            isDragging,
            shapes,
            draggingShape,
            mode,
            drawingShapeId,
        },
        refs:{
            container: containerRef.current,
            drawingUpdate: drawingUpdateRef.current,
            lastCursorPos: lastCursorPos.current,
            drawingStartCoords: drawingStartCoords.current,
        },
        actions: {
            setCanvasOffset,
            setIsDragging,
            setShapes,
            setDraggingShape,
            setMode,
            setDrawingShapeId,
        },
    }
}

export type CanvasStateType = ReturnType<typeof useCanvasState>;