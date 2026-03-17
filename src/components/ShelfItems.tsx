import { useCabinetStore } from '../store'
import { DISPLAY_MODELS, type DisplayModel } from '../data/displayModels'
import { Text, useTexture } from '@react-three/drei'

const GAP = 0.005

type ItemProps = {
  model: DisplayModel
  centerX: number
  centerY: number
  centerZ: number
  renderDepth: number
  hasFitIssue: boolean
  instanceId: string
}

function ShelfItem({ model, centerX, centerY, centerZ, renderDepth, hasFitIssue, instanceId }: ItemProps) {
  const texture = useTexture(`/textures/sets/${model.id}.jpg`)

  return (
    <group key={instanceId}>
      <mesh position={[centerX, centerY, centerZ]}>
        <boxGeometry args={[model.widthM, model.heightM, renderDepth]} />
        <meshStandardMaterial
          map={texture}
          emissive={hasFitIssue ? '#ff0000' : '#000000'}
          emissiveIntensity={hasFitIssue ? 0.4 : 0}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {model.widthM > 0.08 && (
        <Text
          position={[centerX, centerY - model.heightM / 2 + 0.005, centerZ + renderDepth / 2 + 0.001]}
          fontSize={0.025}
          color="#7dd3fc"
          anchorX="center"
          anchorY="bottom"
          maxWidth={model.widthM - 0.01}
          outlineWidth={0.003}
          outlineColor="#000"
        >
          {model.name}
        </Text>
      )}
    </group>
  )
}

type Props = {
  cabinetId: string
  width: number
  depth: number
  thickness: number
  shelves: number[]
}

export default function ShelfItems({ cabinetId, width, depth, thickness: T, shelves }: Props) {
  const { placedModels, height } = useCabinetStore()
  const cabinetModels = placedModels.filter((m) => m.cabinetId === cabinetId)

  const allCompartments: Array<{ shelfY: number; shelfIndex: number }> = [
    { shelfY: T / 2, shelfIndex: -1 },
    ...shelves.map((shelfY, shelfIndex) => ({ shelfY, shelfIndex })),
  ]

  return (
    <group>
      {allCompartments.map(({ shelfY, shelfIndex }) => {
        const nextShelfY = (shelfIndex === -1 ? shelves[0] : shelves[shelfIndex + 1]) ?? height
        const clearance = nextShelfY - (shelfY + T / 2)
        const usableDepth = depth - T
        const innerLeft = -(width / 2 - T)
        const innerRight = width / 2 - T

        const shelfModels = cabinetModels
          .filter((m) => m.shelfIndex === shelfIndex)
          .map((m) => ({ placed: m, model: DISPLAY_MODELS.find((d) => d.id === m.modelId)! }))
          .filter((x) => x.model)

        const totalItemsWidth = shelfModels.reduce(
          (sum, { model }, i) => sum + model.widthM + (i < shelfModels.length - 1 ? GAP : 0),
          0
        )
        const innerWidth = innerRight - innerLeft
        let cursor = (innerWidth - totalItemsWidth) / 2

        return shelfModels.map(({ placed, model }) => {
          const renderDepth = Math.min(model.depthM!, usableDepth)
          const centerX = innerLeft + cursor + model.widthM / 2
          const centerY = shelfY + T / 2 + model.heightM / 2
          const centerZ = depth / 2 - T / 4 - renderDepth / 2

          const tooTall = model.heightM > clearance
          const overflow = centerX + model.widthM / 2 > innerRight
          const tooDeep = model.depthM! > usableDepth
          const hasFitIssue = tooTall || overflow || tooDeep

          cursor += model.widthM + GAP

          return (
            <ShelfItem
              key={placed.instanceId}
              instanceId={placed.instanceId}
              model={model}
              centerX={centerX}
              centerY={centerY}
              centerZ={centerZ}
              renderDepth={renderDepth}
              hasFitIssue={hasFitIssue}
            />
          )
        })
      })}
    </group>
  )
}
