import { useCabinetStore } from '../store'
import type { CabinetSpec } from '../store'

type CabinetRowProps = {
  cabinet: CabinetSpec
  index: number
  totalCabinets: number
}

function CabinetRow({ cabinet, index, totalCabinets }: CabinetRowProps) {
  const { addShelf, removeShelf, removeCabinet, height, thickness } = useCabinetStore()
  const { id, shelves } = cabinet

  const boundaries = [thickness, ...shelves, height - thickness]
  const maxGap = Math.max(...boundaries.slice(0, -1).map((b, i) => boundaries[i + 1] - b))
  const canAddShelf = maxGap > thickness * 2

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
      <span style={{ flex: 1, fontSize: 12, color: '#ddd', whiteSpace: 'nowrap' }}>
        Cabinet {index + 1} ({shelves.length} shelf{shelves.length !== 1 ? 'ves' : ''})
      </span>
      <button
        onClick={() => addShelf(id)}
        disabled={!canAddShelf}
        title="Add shelf"
        style={btnStyle(!canAddShelf)}
      >+S</button>
      <button
        onClick={() => removeShelf(id, shelves.length - 1)}
        disabled={shelves.length === 0}
        title="Remove shelf"
        style={btnStyle(shelves.length === 0)}
      >−S</button>
      <button
        onClick={() => removeCabinet(id)}
        disabled={totalCabinets <= 1}
        title="Remove cabinet"
        style={btnStyle(totalCabinets <= 1)}
      >×</button>
    </div>
  )
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '2px 7px',
    fontSize: 12,
    background: disabled ? '#444' : '#555',
    color: disabled ? '#888' : '#eee',
    border: '1px solid #666',
    borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export default function Controls() {
  const { cabinets, addCabinet } = useCabinetStore()

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: 16,
      background: 'rgba(20, 20, 20, 0.78)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 8,
      padding: '10px 14px',
      minWidth: 220,
      userSelect: 'none',
    }}>
      <button
        onClick={addCabinet}
        style={{
          width: '100%',
          padding: '5px 0',
          marginBottom: 8,
          fontSize: 13,
          background: '#2a6',
          color: '#fff',
          border: 'none',
          borderRadius: 5,
          cursor: 'pointer',
        }}
      >+ Add Cabinet</button>
      {cabinets.map((cabinet, i) => (
        <CabinetRow
          key={cabinet.id}
          cabinet={cabinet}
          index={i}
          totalCabinets={cabinets.length}
        />
      ))}
    </div>
  )
}
