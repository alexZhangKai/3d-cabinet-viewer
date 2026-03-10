import { createContext, useContext } from 'react'
import type { Vector3 } from 'three'

export interface ActiveDrag {
  type: 'width' | 'shelf'
  cabinetId: string
  shelfIndex?: number
  startPoint: Vector3
  startValue: number
}

interface DragContextValue {
  drag: ActiveDrag | null
  setDrag: (drag: ActiveDrag | null) => void
}

export const DragContext = createContext<DragContextValue>({
  drag: null,
  setDrag: () => {},
})

export function useDrag() {
  return useContext(DragContext)
}

