import { create } from 'zustand'
import { getSnapPoints, applySnap } from './cabinetUtils'

export type CabinetSpec = {
  id: string
  width: number
  shelves: number[]
}

export type PlacedModel = {
  instanceId: string
  cabinetId: string
  shelfIndex: number
  modelId: string
}

interface CabinetState {
  height: number
  depth: number
  thickness: number
  cabinets: CabinetSpec[]
  placedModels: PlacedModel[]
  draggingModelId: string | null
  setWidth: (id: string, width: number) => void
  setShelf: (id: string, shelfIndex: number, y: number) => void
  addCabinet: () => void
  removeCabinet: (id: string) => void
  addShelf: (id: string) => void
  removeShelf: (id: string, shelfIndex: number) => void
  placeDisplayModel: (cabinetId: string, shelfIndex: number, modelId: string) => void
  removePlacedModel: (instanceId: string) => void
  startModelDrag: (modelId: string) => void
  endModelDrag: () => void
}

export const useCabinetStore = create<CabinetState>((set, get) => ({
  height: 1.8, // external dimensions in meters, controls max shelf height and overall cabinet height
  width: 2.8, // external dimensions in meters, control max overall cabinet width
  depth: 0.7, // no internal/external distinction for depth, just total
  thickness: 0.017, // material thickness in meters, depends on the material used
  cabinets: [
    {
      id: 'cabinet-1',
      width: 0.7, // internal width
      shelves: [0.9], // shelf heights in meters between center of the shelf panel and the floor (base panel) TODO: add restriction
    },
    {
      id: 'cabinet-2',
      width: 1.0,
      shelves: [2 / 3, 4 / 3],
    },
    {
      id: 'cabinet-3',
      width: 0.7,
      shelves: [0.4, 0.8, 1.2, 1.6],
    },
  ],
  placedModels: [],
  draggingModelId: null,

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
        const floor = thickness * 1.5
        const ceiling = height - thickness * 1.5
        const lowerBound = shelfIndex > 0 ? shelves[shelfIndex - 1] + thickness : floor
        const upperBound = shelfIndex < shelves.length - 1 ? shelves[shelfIndex + 1] - thickness : ceiling

        const snapped = applySnap(y, getSnapPoints(height, thickness))
        shelves[shelfIndex] = Math.max(lowerBound, Math.min(upperBound, snapped))
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
    set((state) => ({
      cabinets: state.cabinets.filter((c) => c.id !== id),
      placedModels: state.placedModels.filter((m) => m.cabinetId !== id),
    }))
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
      placedModels: state.placedModels
        .filter((m) => !(m.cabinetId === id && m.shelfIndex === shelfIndex))
        .map((m) =>
          m.cabinetId === id && m.shelfIndex > shelfIndex
            ? { ...m, shelfIndex: m.shelfIndex - 1 }
            : m
        ),
    }))
  },

  placeDisplayModel: (cabinetId, shelfIndex, modelId) => {
    const instanceId = crypto.randomUUID()
    set((state) => ({
      placedModels: [...state.placedModels, { instanceId, cabinetId, shelfIndex, modelId }],
    }))
  },

  removePlacedModel: (instanceId) => {
    set((state) => ({
      placedModels: state.placedModels.filter((m) => m.instanceId !== instanceId),
    }))
  },

  startModelDrag: (modelId) => set({ draggingModelId: modelId }),
  endModelDrag: () => set({ draggingModelId: null }),
}))
