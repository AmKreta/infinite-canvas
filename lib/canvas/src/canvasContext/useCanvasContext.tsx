import { useContext } from "react";
import { CanvasContext } from "./CanvasContext";

export const useCanvasContext = () => {
    const canvasState = useContext(CanvasContext);
    return canvasState;
}