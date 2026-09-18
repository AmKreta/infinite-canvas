# Infinite Canvas Assignment

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation & Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000` (or the port shown in your terminal).

# Changes

The original app already panned, drew rectangles, dragged them, and showed a minimap. The work since then is mostly about **keeping that interaction at 60fps as the shape count grows**, plus a few correctness bugs that showed up while doing that.

---

## Additions

### Hooks

**`src/hooks/useRAFThrottledFn.ts`**

Coalesces pointer-move work onto the next animation frame. Each call cancels the previous scheduled frame, so a burst of `pointermove` events becomes one update per vsync. Returns `[callback, cancel]` so the pending frame can be dropped on pointer-up instead of applying one extra step after release.

Used for canvas pan, shape drag, freehand drawing, and minimap chrome drag.

The initial commit only RAF-throttled drawing (`drawingUpdateRef` in `App`). Pan and shape drag ran `setState` on every mouse event.

**`src/hooks/useCornerShapes.ts`**

Keeps a ref of the current leftmost / rightmost / topmost / bottommost shapes. Add is O(1) against the four extremes. Drag is O(1) unless the moved shape *was* an extreme, in which case it rescans once.

Replaces the initial `canvasBounds` / minimap `getContentBounds` loops that walked every shape on every render.

### HOC

**`src/HOC/WithRenderThrottle.tsx`**

Time-throttles a child's props (minimap is wrapped at 150ms). The inner component is also `React.memo`'d, so pan/draw frames do not rebuild the overview at 60Hz. A trailing timeout still delivers the latest props so the minimap does not freeze mid-gesture.

### Utils

**`src/utils/spatialHash.ts`**

Uniform grid (`cellSize = 500`, `threshold = 2`) keyed by Cantor pairing of zigzag-encoded cell coordinates, so negative canvas space hashes without colliding with positives.

- `add` / `remove` / `update` keep each item's cell list in sync
- `getItemsBetween(x, y, w, h)` gathers candidate cells (with a padded halo), then AABB-filters against the **unpadded** query
- `update` always writes `item.data`, even when cell membership is unchanged. Without that, a drag that stayed inside the same 500px cell would be tested on query against stale coordinates

Viewport culling queries the hash in **canvas space**: origin is `getCanvasCoordinates(0, 0)` i.e. `(-canvasOffset.x, -canvasOffset.y)`, size is `window.innerWidth/Height`. Querying `canvasOffset` and `canvasBounds` pointed at the wrong region (sign-flipped origin, content extent instead of viewport) and returned off-screen shapes.

### Components

**`src/components/Shape.tsx`**

Shapes used to be inline `<div>`s in `App`. They are now a `memo`'d component. Unchanged siblings skip reconciling `left`/`top`/`zIndex` when some other shape moves. Pointer handling is delegated to the canvas (`classList.contains("shape")` + `id`), so each shape is not its own event target.

### Shape positioning: `left`/`top` → `transform: translate()`

`Shape.tsx` positions via `transform: translate(x, y)` (anchored at a fixed `left: 0, top: 0`) instead of `left: x, top: y`. Changing `left`/`top` forces the browser to run layout on every update; `transform` is compositor-only. This is the same technique `.canvas-content` already used for panning, now applied per-shape.

Required dropping `transform` from `.shape`'s CSS `transition` (`App.css`) — it was there to ease the `.dragging` "pop" (`scale(1.05)`), but once transform also carries position, that same transition would visibly lag the shape behind the cursor by ~200ms. The scale is now composed into the same inline `transform` string (`translate(...) scale(1.05)`) instead of living in a separate CSS class rule.

### Shape drag: decoupled from React state

`updateDraggingShape` (`App.tsx`) no longer calls `setShapes` on every RAF frame while dragging. Each frame it mutates a `liveDragShape` ref, writes the DOM `transform` directly via `document.getElementById`, and updates the spatial hash — none of that goes through React. `setShapes` (and the reconciliation pass that comes with it) now only fires every `DRAG_STATE_COMMIT_FRAMES` (9 frames, ≈150ms — matched to the minimap's own render throttle) during a drag, plus once unconditionally on pointer-up so state, the spatial hash, and the DOM all converge exactly at release with no snap.

Net effect: the spatial hash is now updated every frame (more current than before, when it only updated on state commits), the minimap lags the live drag position by at most ~150ms (visually negligible for a small overview), and full-tree reconciliation during a drag drops from 60/sec to ~7/sec.

---

## Bug fixes

### Removed the `0.8` scale on shape translation

Initial drag applied:

```ts
const deltaX = (e.clientX - lastCursorPos.current.x) * 0.8;
```

The cursor and the rectangle drifted apart (the jitter fixed in `e33d2b4`). Deltas are now 1:1 with pointer movement.

### Removed `transition` from transform / layout

`.shape` used `transition: all 0.2s`, so every `left`/`top`/`transform` update was interpolated. Combined with the `0.8` factor this felt like lag, not easing. Transitions were first narrowed to `box-shadow`, `transform` (the 1.05 drag scale), and `border-color` — then `transform` was dropped too once position moved onto it (see "Shape positioning" above), leaving only `box-shadow` and `border-color`.

### Fixed minimap drag

The chrome is positioned with `bottom` / `right`. The clamp used **viewport** width/height as the box size, so the upper bound collapsed to about `-20` and the minimap snapped to the margin instead of tracking the pointer.

It now clamps against the container's `offsetWidth` / `offsetHeight` (includes the 2px border that `minimapSize` does not), keeps a 20px inset, and cancels the pending RAF on pointer-up.

### Fixed drawn shapes always getting deleted on pointer-up

`handlePointerUp`'s `useCallback` deps were `[drawingShapeId]`, but the function read `shapes` directly to check the drawn rectangle's final size. `drawingShapeId` is set once when the draw gesture starts and doesn't change again until release, so the callback stayed memoized against the `shapes` snapshot from the instant the shape was created — width and height still `0` at that point. The `width <= 5 || height <= 5` discard check was reading that stale `0`, so it was always true: every drawn shape was deleted on release regardless of how large it was actually drawn.

Fixed by adding `shapes` back to the dependency array, and by looking the shape up as `shapes.find(s => s.id === drawingShapeId)` instead of `shapes[shapes.length - 1]`, which assumed the shape being finished was always the last array element.

---

## Behavioural / performance changes

| Area | Initial commit | Now |
|---|---|---|
| Shape identity in updates | `Array.map` over every shape, match by `id` | Index (or last-drawn id) for the hot path; spatial hash keyed by `id` |
| Pointer model | `mousedown` / `mousemove` / `mouseup` plus a separate touch path | Pointer events + `setPointerCapture` (mouse, pen, and touch) |
| Move throttling | Drawing only | Pan, shape drag, drawing, minimap drag |
| z-index | `Math.max(...shapes.map(zIndex))` on create and on every pick | `maxZIndex` ref, increment on bring-to-front / create |
| Canvas bounds | Full scan of `shapes` in `useMemo` | Corner-shape ref |
| What the canvas mounts | Every shape | Still every shape — the spatial hash is kept live (`add`/`update`/`remove` on every shape mutation) but the render loop doesn't query it yet. `getItemsBetween` is only used by drag/draw sync and a debug `console.log`. Viewport culling of the render list is the natural next step, not yet wired in |
| Shape re-renders | Parent re-render = all divs update | `memo(Shape)` — props must change |
| Shape position (CSS) | `left` / `top` (forces layout on every update) | `transform: translate(x, y)` (compositor-only) |
| Shape drag → state commits | `setShapes` on every RAF frame | DOM transform + spatial hash updated every frame; `setShapes` only every ~150ms and once (unconditionally) on pointer-up |
| Minimap shapes | Absolutely positioned `div`s, JS multiplied every `x/y/w/h` by `minimapScale` | One `<svg>` + `<rect>`s in canvas units; `viewBox` + `preserveAspectRatio="xMinYMin meet"` does the scale. `rx` is `2 / minimapScale` so corners stay ~2px on screen. `vector-effect: non-scaling-stroke` keeps the 1px border. Paint order is document order, so shapes are sorted by `zIndex` once per throttled render |
| Minimap bounds | Scanned all shapes | Reads the same corner ref, padded, unioned with the viewport |
| Minimap render rate | Every parent commit | `withRenderThrottle(..., 150)` |

---

