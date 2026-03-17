import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Text, Line } from '@react-three/drei'
import Cabinet from './Cabinet'
import * as THREE from 'three'
import { useCabinetStore } from '../store'
import { useDrag } from '../DragContext'
import { DragProvider } from '../DragProvider'
import type { ThreeEvent } from '@react-three/fiber'

const cm = (m: number) => `${(m * 100).toFixed(2)} cm`

type TotalWidthProps = { totalWidth: number; height: number; depth: number; thickness: number }

function TotalWidthMeasurement({ totalWidth, height, depth, thickness }: TotalWidthProps) {
  const z = depth / 2 + 0.01
  const y = height + 0.15
  const tickH = 0.03
  const halfW = totalWidth / 2
  return (
    <group>
      <Line points={[[-halfW - thickness, y, z], [halfW - thickness, y, z]]} color="#444" lineWidth={1.5} />
      <Line points={[[-halfW - thickness, y - tickH - 0.12, z], [-halfW - thickness, y + tickH, z]]} color="#444" lineWidth={1.5} />
      <Line points={[[halfW - thickness, y - tickH - 0.12, z], [halfW - thickness, y + tickH, z]]} color="#444" lineWidth={1.5} />
      <Text position={[0, y + 0.07, z]} fontSize={0.07} color="#222" anchorX="center" anchorY="middle" outlineWidth={0.005} outlineColor="#fff">
        {cm(totalWidth)}
      </Text>
    </group>
  )
}

function Room() {
  return (
    <group>
      {/* Floor — dark oak */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#6b4226" roughness={0.85} metalness={0.0} />
      </mesh>

      {/* Back wall — sage green */}
      <mesh position={[0, 2.5, -3]} receiveShadow>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#c8d5b9" roughness={1} side={THREE.FrontSide} />
      </mesh>

      {/* Left wall — slightly warmer */}
      <mesh position={[-5, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#d4c9a8" roughness={1} side={THREE.FrontSide} />
      </mesh>

      {/* Right wall — slightly warmer */}
      <mesh position={[5, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#d4c9a8" roughness={1} side={THREE.FrontSide} />
      </mesh>
    </group>
  )
}

function SceneContent() {
  const { cabinets, height, depth, thickness, setWidth, setShelf, draggingModelId } = useCabinetStore()
  const { drag, setDrag } = useDrag()

  let totalWidth = cabinets.reduce((sum, c) => sum + c.width, 0)
  totalWidth += thickness * (cabinets.length + 1) // add gaps between cabinets

  const startX = -totalWidth / 2
  const positions = cabinets.map((c, i) => {
    const x = startX + c.width / 2 + cabinets.slice(0, i).reduce((sum, s) => sum + s.width + thickness, 0)
    return [x, 0, 0] as [number, number, number]
  })

  const handleDragMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag) return
    if (drag.type === 'width') {
      const deltaX = e.point.x - drag.startPoint.x
      setWidth(drag.cabinetId, drag.startValue + deltaX)
    } else {
      const deltaY = e.point.y - drag.startPoint.y
      setShelf(drag.cabinetId, drag.shelfIndex!, drag.startValue + deltaY)
    }
  }

  return (
    <>
      {/* Warm ambient */}
      <ambientLight intensity={0.5} color="#ffe8c0" />

      {/* Sunlight from upper-left window */}
      <directionalLight
        position={[-4, 6, 3]}
        intensity={2.0}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Soft fill from right */}
      <pointLight position={[4, 3, 2]} intensity={0.6} color="#d0e8ff" />

      {/* Assist grid — sits just above floor to avoid z-fighting */}
      <gridHelper args={[10, 20, '#6b4226', '#4a2e1a']} position={[0, -0.119, 0]} />

      {/* Axis indicator — small XYZ arrows at scene origin */}
      <axesHelper args={[0.4]} position={[0, -0.119, 0]} />
      <Text position={[0.52, -0.119, 0]} fontSize={0.08} color="#ff4444" anchorX="center" anchorY="middle">X</Text>
      <Text position={[0, 0.28, 0]} fontSize={0.08} color="#44ff44" anchorX="center" anchorY="middle">Y</Text>
      <Text position={[0, -0.119, 0.52]} fontSize={0.08} color="#4488ff" anchorX="center" anchorY="middle">Z</Text>

      <Room />
      {cabinets.map((spec, index) => (
        <Cabinet
          key={spec.id}
          id={spec.id}
          position={positions[index]}
          height={height}
          width={spec.width}
          depth={depth}
          shelves={spec.shelves}
          thickness={thickness}
          showHeightMeasurement={index === 0} // only show height for first cabinet to avoid clutter
        />
      ))}

      <TotalWidthMeasurement totalWidth={totalWidth} height={height} depth={depth} thickness={thickness} />

      {drag && (
        <mesh
          position={[0, 0, depth / 2]}
          onPointerMove={handleDragMove}
          onPointerUp={() => { setDrag(null); document.body.style.cursor = 'default' }}
        >
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      <Environment preset="apartment" />
      <OrbitControls
        makeDefault
        enabled={!drag && !draggingModelId}
        target={[0, 0.8, 0]}
      />
    </>
  )
}

export default function Scene() {
  return (
    <DragProvider>
      <Canvas
        camera={{ position: [2, 1.8, 3], fov: 45 }}
        shadows="pcf"
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </DragProvider>
  )
}
