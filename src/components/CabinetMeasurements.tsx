import { Text, Line } from '@react-three/drei'

type Props = {
  width: number
  height: number
  depth: number
  shelves: number[]
  thickness: number
  showHeightMeasurement?: boolean
}

const cm = (m: number) => `${(m * 100).toFixed(2)} cm`

export default function CabinetMeasurements({ width, height, depth, shelves, thickness, showHeightMeasurement = true }: Props) {
  const z = depth / 2 + 0.01 // slightly in front of cabinet face

  // Width dimension line sits 13 cm below cabinet floor
  const widthLineY = height + 0.02
  const tickH = 0.03

  // Height dimension line sits to the left of the cabinet
  const heightLineX = width / 2 + 0.05

  // dimensions (subtract wall/panel thickness)
  const innerWidth = width
  const outerHeight = height

  // Compute inner compartment intervals accounting for shelf panel thickness.
  const compartments: { y1: number; y2: number; innerH: number }[] = shelves.map((shelfY, i) => {
    const y1 = i === 0 ? thickness / 2 : shelves[i - 1]
    const y2 = shelfY
    return { y1, y2, innerH: y2 - y1 - thickness }
  })
  if (shelves.length > 0) {
    const y1 = shelves[shelves.length - 1]
    const y2 = height - thickness / 2
    compartments.push({ y1, y2, innerH: y2 - y1 - thickness })
  } else {
    compartments.push({ y1: thickness / 2, y2: height - thickness / 2, innerH: height - thickness * 2 })
  }

  return (
    <group>
      {/* ── Inner Width ── */}
      <Line
        points={[[-innerWidth / 2, widthLineY, z], [innerWidth / 2, widthLineY, z]]}
        color="#444"
        lineWidth={1.5}
      />
      {/* Left tick */}
      <Line
        points={[[-innerWidth / 2, widthLineY - tickH, z], [-innerWidth / 2, widthLineY + tickH, z]]}
        color="#444"
        lineWidth={1.5}
      />
      {/* Right tick */}
      <Line
        points={[[innerWidth / 2, widthLineY - tickH, z], [innerWidth / 2, widthLineY + tickH, z]]}
        color="#444"
        lineWidth={1.5}
      />
      <Text
        position={[0, widthLineY + 0.07, z]}
        fontSize={0.07}
        color="#222"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="#fff"
      >
        {cm(innerWidth)}
      </Text>

      {/* ── Shelf compartments (right side) ── */}
      {compartments.map(({ y1, y2, innerH }, i) => {
        const x = 0
        const mid = (y1 + y2) / 2
        const y1Mark = y1 + thickness / 2
        const y2Mark = y2 - thickness / 2
        return (
          <group key={i}>
            <Line points={[[x - tickH, y1Mark, z], [x + tickH, y1Mark, z]]} color="#888" lineWidth={1} />
            <Line points={[[x - tickH, y2Mark, z], [x + tickH, y2Mark, z]]} color="#888" lineWidth={1} />
            <Line points={[[x, y1Mark, z], [x, y2Mark, z]]} color="#888" lineWidth={1} />
            <Text
              position={[x + 0.1, mid, z]}
              fontSize={0.055}
              color="#555"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.004}
              outlineColor="#fff"
            >
              {cm(innerH)}
            </Text>
          </group>
        )
      })}

      {/* Height */}
      {showHeightMeasurement && (
        <>
          <Line
            points={[[-heightLineX - tickH, 0, z], [-heightLineX + tickH, 0, z]]}
            color="#444"
            lineWidth={1.5}
          />
          <Line
            points={[[-heightLineX - tickH, height, z], [-heightLineX + tickH, height, z]]}
            color="#444"
            lineWidth={1.5}
          />
          <Line
            points={[[-heightLineX, 0, z], [-heightLineX, height, z]]}
            color="#444"
            lineWidth={1.5}
          />
          <Text
            position={[-heightLineX - 0.15, height / 2, z]}
            fontSize={0.07}
            color="#222"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.005}
            outlineColor="#fff"
          >
            {cm(outerHeight)}
          </Text>
        </>
      )}
    </group>
  )
}
