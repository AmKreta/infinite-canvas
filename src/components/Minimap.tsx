import React, { useState, useRef, useCallback, RefObject, useMemo } from 'react';
import { CornerShape, Shape } from '../types';
import withRenderThrottle from '../HOC/WithRenderThrottle';
import { useRAFThrottledFn } from '../hooks/useRAFThrottledFn';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

interface MinimapProps {
  shapes: Shape[];
  canvasPosition: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  viewportSize: { width: number; height: number };
  cornerShapes: RefObject<CornerShape>;
}

const Minimap: React.FC<MinimapProps> = ({
  shapes,
  canvasPosition,
  viewportSize,
  cornerShapes,
}) => {
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const [minimapPosition, setMinimapPosition] = useState({ x: 20, y: 20 });
  const containerRef = useRef<HTMLDivElement>(null);

  const minimapSize = useMemo(()=>({
    width: viewportSize.width * 0.15,
    height: viewportSize.height * 0.15,
  }), [viewportSize]);

  const getContentBounds = useCallback((shapes: Shape[], viewportSize: { width: number; height: number }, canvasPosition: { x: number; y: number }) => {
    if (shapes.length === 0) {
      return {
        minX: -viewportSize.width,
        maxX: viewportSize.width * 2,
        minY: -viewportSize.height,
        maxY: viewportSize.height * 2,
        width: viewportSize.width * 3,
        height: viewportSize.height * 3,
      };
    }

    let minX = cornerShapes.current.left?.x ?? Infinity;
    let maxX = cornerShapes.current.right?.x ?? -Infinity;
    let minY = cornerShapes.current.top?.y ?? Infinity;
    let maxY = cornerShapes.current.bottom?.y ?? -Infinity;

    const padding = 200;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    const viewportMinX = -canvasPosition.x;
    const viewportMaxX = viewportMinX + viewportSize.width;
    const viewportMinY = -canvasPosition.y;
    const viewportMaxY = viewportMinY + viewportSize.height;

    minX = Math.min(minX, viewportMinX);
    maxX = Math.max(maxX, viewportMaxX);
    minY = Math.min(minY, viewportMinY);
    maxY = Math.max(maxY, viewportMaxY);

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }, []);

  const contentBounds = useMemo(()=>getContentBounds(shapes, viewportSize, canvasPosition), [shapes, viewportSize, canvasPosition]);
  const minimapScale = Math.min(
    minimapSize.width / contentBounds.width,
    minimapSize.height / contentBounds.height
  );


  const stackedShapes = useMemo(
    () => [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)),
    [shapes]
  );

  const cornerRadius = 2 / minimapScale;

  const handleMinimapPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingMinimap(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const [handleMinimapPointerMove, cancelMinimapPointerMove] = useRAFThrottledFn(useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingMinimap) return;
      const deltaX = lastPosition.current.x - e.clientX;
      const deltaY = lastPosition.current.y - e.clientY;
      const margin = 20;
      const boxWidth = containerRef.current?.offsetWidth ?? 0;
      const boxHeight = containerRef.current?.offsetHeight ?? 0;

      setMinimapPosition((prev) => ({
        x: clamp(prev.x + deltaX, margin, window.innerWidth - boxWidth - margin),
        y: clamp(prev.y + deltaY, margin, window.innerHeight - boxHeight - margin),
      }));
      lastPosition.current = { x: e.clientX, y: e.clientY };
    },
    [isDraggingMinimap]
  ));

  const handleMinimapPointerUp = useCallback(() => {
    cancelMinimapPointerMove();
    setIsDraggingMinimap(false);
  }, [cancelMinimapPointerMove]);

  return (
    <div
      ref={containerRef}
      className="minimap-container"
      style={{
        position: "fixed",
        bottom: minimapPosition.y,
        right: minimapPosition.x,
        cursor: isDraggingMinimap ? "grabbing" : "grab",
      }}
      onPointerDown={handleMinimapPointerDown}
      onPointerMove={handleMinimapPointerMove}
      onPointerUp={handleMinimapPointerUp}
    >
      <svg
        className="minimap"
        width={minimapSize.width}
        height={minimapSize.height}
        viewBox={`${contentBounds.minX} ${contentBounds.minY} ${contentBounds.width} ${contentBounds.height}`}
        preserveAspectRatio="xMinYMin meet"
      >
        {stackedShapes.map((shape) => (
          <rect
            key={shape.id}
            className="minimap-shape"
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rx={cornerRadius}
            fill={shape.color}
            stroke={shape.color}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
};

export default withRenderThrottle<MinimapProps>(Minimap, 150);