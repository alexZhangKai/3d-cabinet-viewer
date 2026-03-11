import { useState } from 'react'
import { useCabinetStore } from '../store'
import type { CabinetSpec } from '../store'
import { DISPLAY_MODELS, modelColor } from '../data/displayModels'
import ModelPicker from './ModelPicker'

type PickerTarget = { cabinetId: string; shelfIndex: number } | null

type CabinetRowProps = {
  cabinet: CabinetSpec
  index: number
  totalCabinets: number
  onOpenPicker: (cabinetId: string, shelfIndex: number) => void
}

function CabinetRow({ cabinet, index, totalCabinets, onOpenPicker }: CabinetRowProps) {
  const { addShelf, removeShelf, removeCabinet, height, thickness, depth, placedModels, removePlacedModel } =
    useCabinetStore()
  const { id, shelves, width } = cabinet

  const boundaries = [thickness, ...shelves, height - thickness]
  const maxGap = Math.max(...boundaries.slice(0, -1).map((b, i) => boundaries[i + 1] - b))
  const canAddShelf = maxGap > thickness * 2
  const usableWidth = width - thickness * 2

  return (
    <div style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ flex: 1, fontSize: 12, color: '#ddd', whiteSpace: 'nowrap' }}>
          Cabinet {index + 1} ({shelves.length} shelf{shelves.length !== 1 ? 'ves' : ''})
        </span>
        <button onClick={() => addShelf(id)} disabled={!canAddShelf} title="Add shelf" style={btnStyle(!canAddShelf)}>+S</button>
        <button
          onClick={() => removeShelf(id, shelves.length - 1)}
          disabled={shelves.length === 0}
          title="Remove last shelf"
          style={btnStyle(shelves.length === 0)}
        >−S</button>
        <button
          onClick={() => removeCabinet(id)}
          disabled={totalCabinets <= 1}
          title="Remove cabinet"
          style={btnStyle(totalCabinets <= 1)}
        >×</button>
      </div>

      {[{ shelfY: thickness / 2, shelfIndex: -1 }, ...shelves.map((shelfY, shelfIndex) => ({ shelfY, shelfIndex }))].map(({ shelfY, shelfIndex }) => {
        const nextShelfY = (shelfIndex === -1 ? shelves[0] : shelves[shelfIndex + 1]) ?? height
        const clearance = nextShelfY - (shelfY + thickness)
        const shelfModels = placedModels
          .filter((m) => m.cabinetId === id && m.shelfIndex === shelfIndex)
          .map((m) => ({ placed: m, model: DISPLAY_MODELS.find((d) => d.id === m.modelId)! }))
          .filter((x) => x.model)

        const totalWidth = shelfModels.reduce((sum, { model }) => sum + model.widthM, 0)
        const warnings: string[] = []
        shelfModels.forEach(({ model }) => {
          if (model.heightM > clearance) warnings.push(`⚠ ${model.name} too tall`)
          if (model.depthM! > depth) warnings.push(`⚠ ${model.name} too deep (clamped)`)
        })
        if (totalWidth > usableWidth) warnings.push('⚠ Shelf overflow')

        return (
          <div key={`compartment-${shelfIndex}`} style={{ marginLeft: 10, marginTop: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#999' }}>{shelfIndex === -1 ? 'Floor:' : `S${shelfIndex + 1}:`}</span>
              {shelfModels.map(({ placed, model }) => (
                <div
                  key={placed.instanceId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    background: 'rgba(255,255,255,0.08)', borderRadius: 3,
                    padding: '1px 5px', fontSize: 11, color: '#ccc',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: modelColor(model.id), flexShrink: 0 }} />
                  <span>{model.name}</span>
                  <button
                    onClick={() => removePlacedModel(placed.instanceId)}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0, fontSize: 12 }}
                  >×</button>
                </div>
              ))}
              <button
                onClick={() => onOpenPicker(id, shelfIndex)}
                style={{ ...btnStyle(false), fontSize: 10, padding: '1px 5px', color: '#8cf' }}
              >+ Model</button>
            </div>
            {warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 10, color: '#f90', marginTop: 1 }}>{w}</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function ModelCatalog() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(true)
  const { startModelDrag } = useCabinetStore()

  const filtered = DISPLAY_MODELS.filter(
    (m) => m.depthM !== null && m.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: '#aaa', fontSize: 11, padding: '0 0 4px 0', letterSpacing: '0.05em',
        }}
      >
        <span>MODEL CATALOG — drag to shelf</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <input
            placeholder="Search models..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 4, padding: '4px 8px', color: '#eee', fontSize: 11,
              outline: 'none', marginBottom: 4,
            }}
          />
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map((model) => (
              <div
                key={model.id}
                onMouseDown={(e) => {
                  e.preventDefault()
                  startModelDrag(model.id)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 6px', borderRadius: 4,
                  background: 'rgba(255,255,255,0.04)',
                  cursor: 'grab', userSelect: 'none',
                }}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: 2,
                  background: modelColor(model.id), flexShrink: 0,
                }} />
                <span style={{ flex: 1, color: '#ccc', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {model.name}
                </span>
                <span style={{ color: '#666', fontSize: 10, whiteSpace: 'nowrap' }}>
                  {Math.round(model.heightM * 100)}×{Math.round(model.widthM * 100)}×{Math.round(model.depthM! * 100)}
                </span>
                <span style={{ color: '#555', fontSize: 12 }}>⠿</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '2px 7px', fontSize: 12,
    background: disabled ? '#444' : '#555',
    color: disabled ? '#888' : '#eee',
    border: '1px solid #666', borderRadius: 4,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

export default function Controls() {
  const { cabinets, addCabinet, draggingModelId } = useCabinetStore()
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null)

  return (
    <>
      <div style={{
        position: 'absolute', top: 16, left: 16,
        background: 'rgba(20, 20, 20, 0.78)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8, padding: '10px 14px',
        minWidth: 260, maxWidth: 320,
        userSelect: 'none',
        maxHeight: 'calc(100vh - 40px)', overflowY: 'auto',
        // Pass pointer events through to canvas while dragging
        pointerEvents: draggingModelId ? 'none' : 'auto',
      }}>
        <button
          onClick={addCabinet}
          style={{
            width: '100%', padding: '5px 0', marginBottom: 8,
            fontSize: 13, background: '#2a6', color: '#fff',
            border: 'none', borderRadius: 5, cursor: 'pointer',
          }}
        >+ Add Cabinet</button>

        {cabinets.map((cabinet, i) => (
          <CabinetRow
            key={cabinet.id}
            cabinet={cabinet}
            index={i}
            totalCabinets={cabinets.length}
            onOpenPicker={(cabinetId, shelfIndex) => setPickerTarget({ cabinetId, shelfIndex })}
          />
        ))}

        <ModelCatalog />
      </div>

      {pickerTarget && (
        <ModelPicker
          cabinetId={pickerTarget.cabinetId}
          shelfIndex={pickerTarget.shelfIndex}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </>
  )
}
