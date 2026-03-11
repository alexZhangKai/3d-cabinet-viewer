# Cabinet POC

A 3D interactive cabinet configurator built with React, Three.js, and TypeScript. Drag handles directly in the 3D viewport to resize cabinets and reposition shelves in real time.

## Features

- **3D scene** rendered with `@react-three/fiber` and `three.js`
- **Drag-to-resize** cabinet widths (blue handle on right edge)
- **Drag-to-reposition** shelves vertically (green handles)
- **Add/remove** cabinets and shelves via UI controls
- Shelf positions are clamped to prevent overlapping and stay within cabinet bounds
- Global state managed with Zustand

## Tech Stack

| Layer        | Library                         |
| ------------ | ------------------------------- |
| UI framework | React 19                        |
| 3D rendering | Three.js + `@react-three/fiber` |
| 3D helpers   | `@react-three/drei`             |
| Gesture/drag | `@use-gesture/react`            |
| State        | Zustand                         |
| Styling      | Tailwind CSS v4                 |
| Build        | Vite + TypeScript               |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── store.ts                  # Zustand store — cabinet state & actions
├── DragContext.tsx            # Drag state context (type, cabinetId, startPoint)
├── DragProvider.tsx           # Provider + pointer-move/up handler for drag logic
├── App.tsx                    # Root layout
└── components/
    ├── Scene.tsx              # Canvas, lights, camera, DragProvider wrapper
    ├── Cabinet.tsx            # Individual cabinet mesh (walls, floor, ceiling)
    ├── CabinetHandles.tsx     # Draggable width + shelf handle meshes
    ├── CabinetMeasurements.tsx# Dimension labels rendered in 3D
    └── Controls.tsx           # Overlay UI (add/remove cabinets and shelves)
```

## Scripts

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start dev server with HMR           |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview production build            |
| `npm run lint`    | Run ESLint                          |

## TODOs

- improve the control panel, enable detailed edit on cabinet and shelf size
- need to set a max height and width of the overall cabinet
-
