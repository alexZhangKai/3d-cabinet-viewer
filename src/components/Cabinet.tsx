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
  shelves: number[],
  thickness: number,
  showHeightMeasurement?: boolean
}

export default function Cabinet({ id, position, height, width, depth, shelves, thickness, showHeightMeasurement = true }: CabinetProps) {
  return (
    <group castShadow position={position}>
      {/* Bottom — depth D-thickness, shifted forward so back face sits at z = -D/2+thickness */}
      <mesh position={[0, thickness / 2, 0]}>
        <boxGeometry args={[width, thickness, depth - thickness]} />
        {wood}
      </mesh>

      {/* Top */}
      <mesh position={[0, height - thickness / 2, thickness / 2]}>
        <boxGeometry args={[width, thickness, depth - thickness]} />
        {wood}
      </mesh>

      {/* Left side */}
      <mesh position={[-width / 2 + thickness / 2, height / 2, thickness / 2]}>
        <boxGeometry args={[thickness, height, depth - thickness]} />
        {wood}
      </mesh>

      {/* Right side */}
      <mesh position={[width / 2 - thickness / 2, height / 2, thickness / 2]}>
        <boxGeometry args={[thickness, height, depth - thickness]} />
        {wood}
      </mesh>

      {/* Back — outer face flush at z = -depth/2, no coplanar overlap */}
      {/* <mesh position={[0, height / 2, -depth / 2 + 3 * thickness / 4]}>
        <boxGeometry args={[width, height, thickness / 2]} />
        {darkWood}
      </mesh> */}

      {/* Shelf */}
      {shelves.map((shelfHeight, index) => (
        <mesh key={index} position={[0, shelfHeight, thickness / 4]}>
          <boxGeometry args={[width - thickness * 2, thickness, depth - thickness]} />
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

      <ShelfItems cabinetId={id} width={width} depth={depth} thickness={thickness} shelves={shelves} />
      <ShelfDropZones cabinetId={id} width={width} depth={depth} thickness={thickness} shelves={shelves} />
      <CabinetHandles id={id} width={width} height={height} depth={depth} thickness={thickness} shelves={shelves} />
      <CabinetMeasurements width={width} height={height} depth={depth} shelves={shelves} thickness={thickness} showHeightMeasurement={showHeightMeasurement} />
    </group>
  )
}
