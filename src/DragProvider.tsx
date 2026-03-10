import { useState } from 'react'
import { DragContext } from './DragContext'
import type { ActiveDrag } from './DragContext'

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [drag, setDrag] = useState<ActiveDrag | null>(null)
  return (
    <DragContext.Provider value={{ drag, setDrag }}>
      {children}
    </DragContext.Provider>
  )
}
