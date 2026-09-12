import { useRef, useState } from "react";
import { Mode, Shape } from "../types";
import { useCanvasState } from "../CanvasState";
import { CanvasContext } from "./CanvasContext";

export const CanvasProvider = ({ children }: { children: React.ReactNode }) => {
   const canvasState =  useCanvasState({ height: window.innerHeight, width: window.innerWidth });
   return (
    <CanvasContext.Provider value={canvasState}>
        {children}
    </CanvasContext.Provider>
   );
}