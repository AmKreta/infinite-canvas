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

# Canvas App Monorepo

A highly optimized, high-performance canvas engine built inside a modern monorepo architecture. This project details significant performance breakthroughs, architectural refactoring, and codebase optimization to scale collaborative canvas capabilities.

## 📊 Performance Monitoring Benchmarks

### Metrics
* **Peak CPU Usage:** Improved from **41%** down to **17%**.
* **Drag Event Churn:** Listener registration/removal churn slashed from **2,500 events** to **200 events** on drag.
* **Creation Event Churn:** Listener registration/removal churn slashed from **500 events** to **200 events** on shape creation.

### Profiling
* **Re-renders:** Dramatically decreased. The layout relies on granular reactivity so that **only one shape re-renders at a time** (specifically, the isolated shape currently being created or dragged).

### 🛠 Visual Comparisons (Before vs After)

#### Drag & Creation Performance (Old)
<!-- TODO: Add video/image showing high CPU usage and event churn from the old implementation -->
> [!NOTE]
> *PLACEHOLDER: Insert Old Video/GIF Link Here*

#### Drag & Creation Performance (New)
<!-- TODO: Add video/image showcasing smooth 60fps performance and low event churn -->
> [!NOTE]
> *PLACEHOLDER: Insert New Video/GIF Link Here*

---

## 🏗 Architecture & Workspace Setup

The repository has been restructured into a highly performant **Monorepo setup** powered by modern build orchestration utilities:

* **Turborepo:** Orchestrates the development workflow to build, test, and run workspaces concurrently with computation caching.
* **Vite Migration:** Migrated away from Create React App (CRA) to **Vite** to achieve near-instant Hot Module Replacement (HMR), superior tree-shaking, and seamless resolution of local workspace packages (CRA loaders were constrained to the `src` directory only).
* **Biome:** Replaced ESLint and Prettier with **Biome** for ultra-fast code linting and formatting.
* **Husky:** Configured pre-commit git hooks to guarantee formatting compliance and test health before code pushes.

### Repository Structure
```text
├── app/                             # Primary Canvas User Interface       
└── hooks/                           # Shared react utility hooks
└── utils/                           # Common helper functionalities                
└── lib/
    ├── canvas/                      # Core canvas rendering engine logic
    ├── createZustandContext/        # Fine-grained state provider binding
```

---

## ⚡ Significant Code Changes

* **Controlled Layout Overrides:** Removed generic transitions across all shape properties. Transitions are now restricted strictly to `border-radius` and `box-shadow`. This allows `top` and `left` positioning coordinates to be fully program-controlled without animation lag or browser layout thrashing.
* **Unified Event Handlers:** Opted out of allocating discrete event handlers for every individual shape. Built a unified, highly efficient event dispatcher that distinguishes target elements instantly using `e.target.id`.
* **Pointer Events Migration:** Deprecated historical `mousedown`/`touchstart` patterns to mitigate double-trigger anomalies and eliminate the need for global window-level escape handlers. The app now uniformly handles interactions via the modern **Pointer Events API**.
* **Zustand + Context Architecture:** Replaced global React state lifting with a hybrid **Zustand + React Context** architecture. This lets components selectively subscribe to highly specific slices of state, achieving fine-grained re-renders.
* **RequestAnimationFrame (rAF) Throttling:** Bound drag event updates directly into `requestAnimationFrame` hooks, ensuring visual synchronization matches the monitor refresh rate for minimal CPU stress.
* **Controlled Layout Overrides:** Converted canvas into a controlled component, now devs can pass shapes and onChange props to canvas, it works without props as well.

---

## 🚀 Roadmap & Future Additions

### 🎨 Core Program Enhancements
* **Spatial Hashing:** Introduce a grid spatial hash mapping system to calculate and render only elements currently visible within the viewport bounding box.
* **Configurable Canvas Engine:** Move away from hardcoded primitive variations (Rectangle, Circle) to an open configuration layer, enabling developers to supply and inject custom render templates.

### 🤖 Developer Experience (DX) Optimizations
* **AI Automated PR Reviews:** Integrate an AI skill into CI/CD pipelines to calculate the code impact "blast radius" and suggest target developer tests before review approval.
* **AI Automated Test Coverage:** Deploy an autonomous assistant to author comprehensive unit tests across newly drafted packages and utils.

