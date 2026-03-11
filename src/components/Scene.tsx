import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import Cabinet from './Cabinet'
import * as THREE from 'three'
import { useCabinetStore } from '../store'
import { useDrag } from '../DragContext'
import { DragProvider } from '../DragProvider'
import { useRef, useEffect } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { ThreeEvent } from '@react-three/fiber'

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
  const orbitRef = useRef<OrbitControlsImpl>(null)

  useEffect(() => {
    if (orbitRef.current) orbitRef.current.enabled = !drag && !draggingModelId
  }, [drag, draggingModelId])

  const totalWidth = cabinets.reduce((sum, c) => sum + c.width, 0)
  const startX = -totalWidth / 2
  const positions = cabinets.map((c, i) => {
    const x = startX + c.width / 2 + cabinets.slice(0, i).reduce((sum, s) => sum + s.width - thickness, 0)
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
          showHeightMeasurement={index === 0} // only show height for first cabinet to avoid clutter
        />
      ))}

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
        ref={orbitRef}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 + 0.1}
        enablePan={false}
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
        shadows
        className="w-full h-full"
      >
        <SceneContent />
      </Canvas>
    </DragProvider>
  )
}
