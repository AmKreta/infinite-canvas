import { useCallback, useRef } from "react";
import type { Shape as ShapeType } from "../types";

export const useCornerShapes = () => {
    const cornerElements = useRef<{
        top: ShapeType | null;
        bottom: ShapeType | null;
        left: ShapeType | null;
        right: ShapeType | null;
    }>({
        top: null,
        bottom: null,
        left: null,
        right: null,
    });

    const updateCornerElementOnAdd = useCallback((shape: ShapeType) => {
        const corners = cornerElements.current;

        if (corners.top === null) {
            corners.top = corners.bottom = corners.left = corners.right = shape;
            return;
        }

        if (shape.x < corners.left!.x) corners.left = shape;
        if (shape.x > corners.right!.x) corners.right = shape;
        if (shape.y < corners.top!.y) corners.top = shape;
        if (shape.y > corners.bottom!.y) corners.bottom = shape;
    }, []);

    const updateCornerElementOnDrag = useCallback((shapes: readonly ShapeType[], draggingShapeIndex: number) => {
        const shape = shapes[draggingShapeIndex];
        const corners = cornerElements.current;

        const wasCorner =
            shape === corners.top ||
            shape === corners.bottom ||
            shape === corners.left ||
            shape === corners.right;

        if (!wasCorner) {
            // Shape wasn't an extreme before, so it can only newly become one
            // in the direction it moved — cheap comparison against current corners.
            if (!corners.left || shape.x < corners.left.x) corners.left = shape;
            if (!corners.right || shape.x + shape.width > corners.right.x + corners.right.width) corners.right = shape;
            if (!corners.top || shape.y < corners.top.y) corners.top = shape;
            if (!corners.bottom || shape.y + shape.height > corners.bottom.y + corners.bottom.height) corners.bottom = shape;
            return;
        }

        // Shape was a corner and moved — it may no longer be extreme in that
        // direction, so recompute from scratch.
        let left = shapes[0], right = shapes[0], top = shapes[0], bottom = shapes[0];
        for (let i = 1; i < shapes.length; i++) {
            const s = shapes[i];
            if (s.x < left.x) left = s;
            if (s.x + s.width > right.x + right.width) right = s;
            if (s.y < top.y) top = s;
            if (s.y + s.height > bottom.y + bottom.height) bottom = s;
        }
        corners.left = left;
        corners.right = right;
        corners.top = top;
        corners.bottom = bottom;
    }, []);

    return [
        cornerElements,
        updateCornerElementOnAdd,
        updateCornerElementOnDrag,
    ] as const;
}