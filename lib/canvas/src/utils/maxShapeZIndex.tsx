import { Shape } from "../types";

export const getShapeMaxZIndex = (shapes: Shape[]) => {
    let maxZIndex = 0;
    if (shapes.length === 0) {
      return maxZIndex;
    }
    shapes.forEach((shape) => {
      if (shape.zIndex > maxZIndex) {
        maxZIndex = shape.zIndex;
      }   
    });
    return maxZIndex;
  }