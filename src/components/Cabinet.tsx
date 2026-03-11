const T = 0.03

const wood = <meshStandardMaterial color="#c8a96e" roughness={0.6} metalness={0.05} />
const darkWood = <meshStandardMaterial color="#8b5e3c" roughness={0.7} metalness={0.0} />

import { Vector3 } from 'three'
import CabinetHandles from './CabinetHandles'
import CabinetMeasurements from './CabinetMeasurements'
import ShelfItems from './ShelfItems'
import ShelfDropZones from './ShelfDropZones'

type CabinetProps = {
  id: string
  position?: [number, number, number] | Vector3
  height: number,
  width: number,
  depth: number,
  shelves: number[]
  showHeightMeasurement?: boolean
}

export default function Cabinet({ id, position, height, width, depth, shelves, showHeightMeasurement = true }: CabinetProps) {
  return (
    <group castShadow position={position}>
      {/* Bottom — depth D-T, shifted forward so back face sits at z = -D/2+T */}
      <mesh position={[0, T / 2, T / 2]}>
        <boxGeometry args={[width, T, depth - T]} />
        {wood}
      </mesh>

      {/* Top */}
      <mesh position={[0, height - T / 2, T / 2]}>
        <boxGeometry args={[width, T, depth - T]} />
        {wood}
      </mesh>

      {/* Left side */}
      <mesh position={[-width / 2 + T / 2, height / 2, T / 2]}>
        <boxGeometry args={[T, height, depth - T]} />
        {wood}
      </mesh>

      {/* Right side */}
      <mesh position={[width / 2 - T / 2, height / 2, T / 2]}>
        <boxGeometry args={[T, height, depth - T]} />
        {wood}
      </mesh>

      {/* Back — outer face flush at z = -depth/2, no coplanar overlap */}
      <mesh position={[0, height / 2, -depth / 2 + 3 * T / 4]}>
        <boxGeometry args={[width, height, T / 2]} />
        {darkWood}
      </mesh>

      {/* Shelf */}
      {shelves.map((shelfHeight, index) => (
        <mesh key={index} position={[0, shelfHeight, T / 4]}>
          <boxGeometry args={[width - T * 2, T, depth - T]} />
          {wood}
        </mesh>
      ))}

      {/* Legs */}
      {([-1, 1] as const).flatMap((sx) =>
        ([-1, 1] as const).map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (width / 2 - 0.07), -0.06, sz * (depth / 2 - 0.06)]}>
            <boxGeometry args={[0.06, 0.12, 0.06]} />
            {darkWood}
          </mesh>
        ))
      )}

      <ShelfItems cabinetId={id} width={width} depth={depth} thickness={T} shelves={shelves} />
      <ShelfDropZones cabinetId={id} width={width} depth={depth} thickness={T} shelves={shelves} />
      <CabinetHandles id={id} width={width} height={height} depth={depth} shelves={shelves} />
      <CabinetMeasurements width={width} height={height} depth={depth} shelves={shelves} showHeightMeasurement={showHeightMeasurement} />
    </group>
  )
}
