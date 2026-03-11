import { useState } from 'react'
import { DoubleSide } from 'three'
import { useCabinetStore } from '../store'
import { DISPLAY_MODELS, modelColor } from '../data/displayModels'

const GAP = 0.005

type Props = {
  cabinetId: string
  width: number
  depth: number
  thickness: number
  shelves: number[]
}

export default function ShelfDropZones({ cabinetId, width, depth, thickness: T, shelves }: Props) {
  const { draggingModelId, placedModels, placeDisplayModel, endModelDrag, height } = useCabinetStore()
  const [hoveredShelf, setHoveredShelf] = useState<number | null>(null)

  if (!draggingModelId) return null

  const draggingModel = DISPLAY_MODELS.find((m) => m.id === draggingModelId)
  if (!draggingModel || draggingModel.depthM === null) return null

  // Build compartment list: floor (-1) + intermediate shelves (0, 1, ...)
  const allCompartments: Array<{ shelfY: number; shelfIndex: number }> = [
    { shelfY: T / 2, shelfIndex: -1 },
    ...shelves.map((shelfY, shelfIndex) => ({ shelfY, shelfIndex })),
  ]

  return (
    <group>
      {allCompartments.map(({ shelfY, shelfIndex }) => {
        const nextShelfY = (shelfIndex === -1 ? shelves[0] : shelves[shelfIndex + 1]) ?? height
        const compartmentBottom = shelfY + T / 2
        const compartmentTop = nextShelfY - T / 2
        const compartmentHeight = compartmentTop - compartmentBottom
        const centerY = (compartmentBottom + compartmentTop) / 2
        const isHovered = hoveredShelf === shelfIndex

        // Compute ghost box position (packed after existing shelf items)
        const shelfModels = placedModels
          .filter((m) => m.cabinetId === cabinetId && m.shelfIndex === shelfIndex)
          .map((m) => DISPLAY_MODELS.find((d) => d.id === m.modelId))
          .filter(Boolean)
        const cursor = shelfModels.reduce((sum, m) => sum + m!.widthM + GAP, 0)
        const renderDepth = Math.min(draggingModel.depthM!, depth - T)
        const ghostX = -(width / 2 - T) + cursor + draggingModel.widthM / 2
        const ghostY = shelfY + T / 2 + draggingModel.heightM / 2
        const ghostZ = depth / 2 - T / 4 - renderDepth / 2

        return (
          <group key={`compartment-${shelfIndex}`}>
            {/* Hit zone — transparent plane at front of compartment */}
            <mesh
              position={[0, centerY, depth / 2 + 0.005]}
              onPointerEnter={(e) => { e.stopPropagation(); setHoveredShelf(shelfIndex) }}
              onPointerLeave={() => setHoveredShelf(null)}
              onPointerUp={(e) => {
                e.stopPropagation()
                placeDisplayModel(cabinetId, shelfIndex, draggingModelId)
                endModelDrag()
                setHoveredShelf(null)
              }}
            >
              <planeGeometry args={[width - T * 2, compartmentHeight]} />
              <meshBasicMaterial
                transparent
                opacity={isHovered ? 0.18 : 0.04}
                color={isHovered ? '#00ff88' : '#ffffff'}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Ghost preview box — shows where the model will land */}
            {isHovered && (
              <mesh position={[ghostX, ghostY, ghostZ]}>
                <boxGeometry args={[draggingModel.widthM, draggingModel.heightM, renderDepth]} />
                <meshStandardMaterial
                  color={modelColor(draggingModel.id)}
                  transparent
                  opacity={0.45}
                  depthWrite={false}
                />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}
