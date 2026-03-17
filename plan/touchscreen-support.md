# Add Touchscreen Support

## Context
The cabinet configurator currently only works with mouse input. Three interaction systems exist:
1. **3D handle dragging** (CabinetHandles + Scene) — already touch-safe via R3F pointer events
2. **Model catalog drag** (App + Controls) — uses `mousemove`/`mouseup` window listeners and `onMouseDown`
3. **Shelf item reordering** (Controls) — uses HTML5 drag-and-drop, which doesn't work on iOS/Android

Goal: make all three systems work on touch devices with minimal changes.

---

## Changes

### 1. `src/App.tsx` — swap mouse → pointer events (2 lines)
In the `useEffect` that tracks model dragging:
- `'mousemove'` → `'pointermove'`
- `'mouseup'` → `'pointerup'`
- Type annotation `(e: MouseEvent)` → `(e: PointerEvent)` (PointerEvent extends MouseEvent, so `e.clientX/Y` still work)
- Same swap in the `removeEventListener` calls

### 2. `src/components/Controls.tsx` — `ModelCatalog` component
- `onMouseDown` → `onPointerDown` on catalog item `<div>`
- Add `touchAction: 'none'` to the inline style (prevents browser scroll-claim on touch before pointer capture)

### 3. `src/components/Controls.tsx` — `ShelfItemsSection` component
Replace all HTML5 drag-and-drop props with `@use-gesture/react`'s `useDrag` (package already installed, not yet used).

**Pattern:**
```typescript
import { useDrag } from '@use-gesture/react'

// In ShelfItemsSection body (not inside .map):
const dragSourceRef = useRef<string | null>(null)
const bind = useDrag(
  ({ args: [instanceId], first, last, xy: [x, y], event }) => {
    event.stopPropagation()
    if (first) { dragSourceRef.current = instanceId }
    if (last) {
      const el = document.elementFromPoint(x, y)
      const target = el?.closest('[data-instance-id]') as HTMLElement | null
      const targetId = target?.dataset.instanceId ?? null
      if (dragSourceRef.current && targetId && dragSourceRef.current !== targetId) {
        movePlacedModelBefore(dragSourceRef.current, targetId)
      }
      dragSourceRef.current = null
      setDragOverId(null)
      return
    }
    const el = document.elementFromPoint(x, y)
    const target = el?.closest('[data-instance-id]') as HTMLElement | null
    setDragOverId(target?.dataset.instanceId ?? null)
  },
  { pointer: { capture: true }, filterTaps: true }
)

// On each chip <div>:
// - spread {...bind(placed.instanceId)}
// - add data-instance-id={placed.instanceId}
// - add touchAction: 'none' to style
// - remove: draggable, onDragStart, onDragOver, onDragLeave, onDrop
```

Key details:
- `filterTaps: true` — preserves tappability of the `×` remove button inside each chip
- `pointer.capture: true` — keeps pointermove stream alive as finger slides across elements
- `document.elementFromPoint` — detects which chip the finger is hovering over (since `onPointerEnter`/`Leave` don't fire on non-touch-targets)
- `useDrag` called once at component level with `args` to identify items (hooks can't be called inside `.map()`)

### 4. `src/components/CabinetHandles.tsx` — no changes needed
R3F pointer events already unify mouse + touch. `stopPropagation()` calls already prevent OrbitControls conflict.

### 5. `src/components/Scene.tsx` — no changes needed
OrbitControls gate `enabled={!drag && !draggingModelId}` already handles touch correctly.

---

## Implementation Order
1. `App.tsx` — mechanical, test desktop regression first
2. `Controls.tsx` `ModelCatalog` — small, test catalog drag on desktop + touch emulation
3. `Controls.tsx` `ShelfItemsSection` — replace HTML5 DnD with useDrag

## Verification
- Desktop: catalog drag, shelf handle drag, shelf item reorder all still work
- Touch (devtools emulation or real device):
  - Single-finger on cabinet width/shelf handle → resizes
  - Two-finger on canvas background → OrbitControls zoom/pan works
  - Long-press drag on catalog item → model follows finger into 3D viewport
  - Drag chip to reorder → shelf items reorder
  - Tap `×` on chip → removes item (not accidentally a drag)
