import { create } from 'zustand'

export type CabinetSpec = {
  id: string
  width: number
  shelves: number[]
}

interface CabinetState {
  height: number
  depth: number
  thickness: number
  cabinets: CabinetSpec[]
  setWidth: (id: string, width: number) => void
  setShelf: (id: string, shelfIndex: number, y: number) => void
  addCabinet: () => void
  removeCabinet: (id: string) => void
  addShelf: (id: string) => void
  removeShelf: (id: string, shelfIndex: number) => void
}

export const useCabinetStore = create<CabinetState>((set, get) => ({
  height: 2.0,
  depth: 0.5,
  thickness: 0.03,
  cabinets: [
    {
      id: 'cabinet-1',
      width: 1.0,
      shelves: [0.5, 1, 1.5],
    },
    {
      id: 'cabinet-2',
      width: 2.0,
      shelves: [2 / 3, 4 / 3],
    },
    {
      id: 'cabinet-3',
      width: 1.0,
      shelves: [0.4, 0.8, 1.2, 1.6],
    },
  ],

  setWidth: (id, width) => {
    const clamped = Math.max(0.3, Math.min(3.0, width))
    set((state) => ({
      cabinets: state.cabinets.map((c) =>
        c.id === id ? { ...c, width: clamped } : c
      ),
    }))
  },

  setShelf: (id, shelfIndex, y) => {
    const { height, thickness } = get()
    set((state) => ({
      cabinets: state.cabinets.map((c) => {
        if (c.id !== id) return c
        const shelves = [...c.shelves]
        const floor = thickness
        const ceiling = height - thickness
        const lowerBound = shelfIndex > 0 ? shelves[shelfIndex - 1] + thickness : floor
        const upperBound = shelfIndex < shelves.length - 1 ? shelves[shelfIndex + 1] - thickness : ceiling
        shelves[shelfIndex] = Math.max(lowerBound, Math.min(upperBound, y))
        return { ...c, shelves }
      }),
    }))
  },

  addCabinet: () => {
    const { height, thickness } = get()
    const newCabinet: CabinetSpec = {
      id: crypto.randomUUID(),
      width: 0.8,
      shelves: [
        (height - thickness * 2) / 3 + thickness,
        ((height - thickness * 2) * 2) / 3 + thickness,
      ],
    }
    set((state) => ({ cabinets: [...state.cabinets, newCabinet] }))
  },

  removeCabinet: (id) => {
    set((state) => ({ cabinets: state.cabinets.filter((c) => c.id !== id) }))
  },

  addShelf: (id) => {
    const { height, thickness } = get()
    set((state) => ({
      cabinets: state.cabinets.map((c) => {
        if (c.id !== id) return c
        const boundaries = [thickness, ...c.shelves, height - thickness]
        let maxGap = 0
        let insertAfter = 0
        for (let i = 0; i < boundaries.length - 1; i++) {
          const gap = boundaries[i + 1] - boundaries[i]
          if (gap > maxGap) { maxGap = gap; insertAfter = i }
        }
        if (maxGap <= thickness * 2) return c
        const newY = (boundaries[insertAfter] + boundaries[insertAfter + 1]) / 2
        const shelves = [...c.shelves]
        shelves.splice(insertAfter, 0, newY)
        return { ...c, shelves }
      }),
    }))
  },

  removeShelf: (id, shelfIndex) => {
    set((state) => ({
      cabinets: state.cabinets.map((c) =>
        c.id === id ? { ...c, shelves: c.shelves.filter((_, i) => i !== shelfIndex) } : c
      ),
    }))
  },
}))
