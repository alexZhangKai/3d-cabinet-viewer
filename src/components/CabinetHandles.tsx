import { useState } from 'react'
import { useDrag } from '../DragContext'

type CabinetHandlesProps = {
  id: string
  width: number
  height: number
  depth: number
  shelves: number[]
}

export default function CabinetHandles({ id, width, height, depth, shelves }: CabinetHandlesProps) {
  const { setDrag } = useDrag()
  const [widthHover, setWidthHover] = useState(false)
  const [shelfHover, setShelfHover] = useState<number | null>(null)

  return (
    <group>
      {/* Width handle — right edge, front face */}
      <mesh
        position={[width / 2, height / 2, depth / 2]}
        onPointerOver={(e) => { e.stopPropagation(); setWidthHover(true); document.body.style.cursor = 'ew-resize' }}
        onPointerOut={() => { setWidthHover(false); document.body.style.cursor = 'default' }}
        onPointerDown={(e) => {
          e.stopPropagation()
          setDrag({ type: 'width', cabinetId: id, startPoint: e.point.clone(), startValue: width })
          document.body.style.cursor = 'ew-resize'
        }}
      >
        <boxGeometry args={[0.015, height * 0.6, 0.015]} />
        <meshStandardMaterial color={widthHover ? '#74b3f5' : '#4A90E2'} />
      </mesh>

      {/* Shelf handles — one per shelf, front face */}
      {shelves.map((shelfY, i) => (
        <mesh
          key={i}
          position={[0, shelfY, depth / 2]}
          onPointerOver={(e) => { e.stopPropagation(); setShelfHover(i); document.body.style.cursor = 'ns-resize' }}
          onPointerOut={() => { setShelfHover(null); document.body.style.cursor = 'default' }}
          onPointerDown={(e) => {
            e.stopPropagation()
            setDrag({ type: 'shelf', cabinetId: id, shelfIndex: i, startPoint: e.point.clone(), startValue: shelfY })
            document.body.style.cursor = 'ns-resize'
          }}
        >
          <boxGeometry args={[width - 0.04, 0.015, 0.015]} />
          <meshStandardMaterial color={shelfHover === i ? '#55d6a8' : '#00B894'} />
        </mesh>
      ))}
    </group>
  )
}
