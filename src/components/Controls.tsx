import { useState, useRef } from 'react'
import { z } from 'zod'
import { useCabinetStore } from '../store'
import type { CabinetSpec, CabinetConfig } from '../store'
import { DISPLAY_MODELS, modelColor } from '../data/displayModels'
import ModelPicker from './ModelPicker'

type PickerTarget = { cabinetId: string; shelfIndex: number } | null

const T = {
  textSecondary: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.3)',
  border: '1px solid rgba(255,255,255,0.06)',
  fs: 14,       // primary: labels, inputs, buttons, model names
  fsSub: 12,    // secondary: units, muted sub-labels, chips, warnings
  sectionLabel: {
    fontSize: 12,
    letterSpacing: '0.12em',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.5)',
  },
}

function SectionHeader({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <span style={T.sectionLabel}>{label}</span>
      <span style={{ color: T.textMuted, fontSize: T.fsSub }}>{open ? '▼' : '▶'}</span>
    </button>
  )
}

function DimensionsSection() {
  const { height, depth, thickness, setGlobalHeight, setGlobalDepth, setThickness } = useCabinetStore()

  const rows: Array<{
    label: string
    valueM: number
    min: number
    max: number
    set: (mm: number) => void
  }> = [
      { label: 'Thickness', valueM: thickness, min: 10, max: 50, set: (mm) => setThickness(mm / 1000) },
      { label: 'Height', valueM: height, min: 500, max: 3000, set: (mm) => setGlobalHeight(mm / 1000) },
      { label: 'Depth', valueM: depth, min: 200, max: 1500, set: (mm) => setGlobalDepth(mm / 1000) },
    ]

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map(({ label, valueM, min, max, set }) => {
        const mm = Math.round(valueM * 1000)
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 80, fontSize: T.fs, color: T.textSecondary, flexShrink: 0 }}>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              step={5}
              value={mm}
              onChange={(e) => set(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#4af' }}
            />
            <input
              type="number"
              min={min}
              max={max}
              step={5}
              value={mm}
              onChange={(e) => set(Number(e.target.value))}
              style={{
                width: 58, background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
                padding: '4px 6px', color: '#eee', fontSize: T.fs, outline: 'none',
                textAlign: 'right',
              }}
            />
            <span style={{ fontSize: T.fsSub, color: T.textMuted, width: 24 }}>mm</span>
          </div>
        )
      })}
    </div>
  )
}

function CabinetsSection() {
  const { cabinets, addCabinet, removeCabinet, setWidth } = useCabinetStore()

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {cabinets.map((cabinet, i) => (
        <div key={cabinet.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: T.fs, color: T.textSecondary, width: 72, flexShrink: 0 }}>
            Cabinet {i + 1}
          </span>
          <input
            type="number"
            step={0.05}
            min={0.3}
            max={3.0}
            value={cabinet.width}
            onChange={(e) => setWidth(cabinet.id, Number(e.target.value))}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
              padding: '4px 8px', color: '#eee', fontSize: T.fs, outline: 'none',
            }}
          />
          <span style={{ fontSize: T.fsSub, color: T.textMuted, width: 12 }}>m</span>
          <button
            onClick={() => removeCabinet(cabinet.id)}
            disabled={cabinets.length <= 1}
            title="Remove cabinet"
            style={{
              width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.18)',
              background: 'none', color: cabinets.length <= 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
              cursor: cabinets.length <= 1 ? 'not-allowed' : 'pointer',
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >×</button>
        </div>
      ))}

      <button
        onClick={addCabinet}
        style={{
          marginTop: 4, width: '100%', padding: '8px 0',
          background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 5, color: '#fff', fontSize: T.fs, cursor: 'pointer',
          letterSpacing: '0.05em',
        }}
      >+ Add Cabinet</button>
    </div>
  )
}

function ShelvesSection() {
  const { cabinets, addShelf, removeShelf, setShelf, height, thickness } = useCabinetStore()

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {cabinets.map((cabinet, i) => {
        const boundaries = [thickness, ...cabinet.shelves, height - thickness]
        const maxGap = Math.max(...boundaries.slice(0, -1).map((b, idx) => boundaries[idx + 1] - b))
        const canAddShelf = maxGap > thickness * 2

        return (
          <div key={cabinet.id}>
            <div style={{ fontSize: T.fsSub, color: T.textMuted, marginBottom: 6 }}>Cabinet {i + 1}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[thickness / 2, ...cabinet.shelves].map((y1, ci) => {
                const y2 = ci < cabinet.shelves.length ? cabinet.shelves[ci] : height - thickness / 2
                const innerH = y2 - y1 - thickness
                const isEditable = ci < cabinet.shelves.length
                const upperBound = ci < cabinet.shelves.length - 1 ? cabinet.shelves[ci + 1] - thickness : height - thickness * 1.5
                const maxInnerH = upperBound - y1 - thickness
                return (
                  <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: T.fsSub, color: '#bbb', width: 52, flexShrink: 0 }}>Shelf {ci + 1}</span>
                    {isEditable ? (
                      <>
                        <input
                          type="number"
                          step={5}
                          min={Math.round(thickness * 2 * 1000)}
                          max={Math.round(maxInnerH * 1000)}
                          value={Math.round(innerH * 1000)}
                          onChange={(e) => setShelf(cabinet.id, ci, Number(e.target.value) / 1000 + y1 + thickness)}
                          style={{
                            flex: 1, background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4,
                            padding: '4px 8px', color: '#eee', fontSize: T.fs, outline: 'none',
                          }}
                        />
                        <span style={{ fontSize: T.fsSub, color: T.textMuted, width: 24 }}>mm</span>
                      </>
                    ) : (
                      <span style={{ fontSize: T.fsSub, color: T.textMuted }}>{Math.round(innerH * 1000)} mm</span>
                    )}
                  </div>
                )
              })}
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  onClick={() => addShelf(cabinet.id)}
                  disabled={!canAddShelf}
                  style={{
                    flex: 1, background: 'none', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4,
                    padding: '5px 0', fontSize: T.fsSub,
                    color: canAddShelf ? '#8cf' : 'rgba(255,255,255,0.2)',
                    cursor: canAddShelf ? 'pointer' : 'not-allowed',
                  }}
                >+ Shelf</button>
                <button
                  onClick={() => removeShelf(cabinet.id, cabinet.shelves.length - 1)}
                  disabled={cabinet.shelves.length === 0}
                  style={{
                    flex: 1, background: 'none', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4,
                    padding: '5px 0', fontSize: T.fsSub,
                    color: cabinet.shelves.length === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)',
                    cursor: cabinet.shelves.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >- Shelf</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

type ShelfItemsSectionProps = {
  onOpenPicker: (cabinetId: string, shelfIndex: number) => void
}

function ModelCatalog() {
  const [query, setQuery] = useState('')
  const { startModelDrag } = useCabinetStore()

  const filtered = DISPLAY_MODELS.filter(
    (m) => m.depthM !== null && m.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ borderBottom: T.border, paddingBottom: 4 }}>
      <div style={{ padding: '4px 20px 8px' }}>
        <div style={{ fontSize: T.fsSub, color: T.textMuted, marginBottom: 8, letterSpacing: '0.08em' }}>
          DRAG TO SHELF
        </div>
        <input
          placeholder="Search models..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 4, padding: '7px 10px', color: '#eee', fontSize: T.fs,
            outline: 'none', marginBottom: 6,
          }}
        />
        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((model) => (
            <div
              key={model.id}
              onMouseDown={(e) => {
                e.preventDefault()
                startModelDrag(model.id)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 6px', borderRadius: 4,
                background: 'rgba(255,255,255,0.04)',
                cursor: 'grab', userSelect: 'none',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: 2, background: modelColor(model.id), flexShrink: 0 }} />
              <span style={{ flex: 1, color: '#ccc', fontSize: T.fs, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {model.name}
              </span>
              <span style={{ color: '#555', fontSize: T.fsSub, whiteSpace: 'nowrap' }}>
                {Math.round(model.heightM * 100)}×{Math.round(model.widthM * 100)}×{Math.round(model.depthM! * 100)} cm
              </span>
              <span style={{ color: '#444', fontSize: T.fs }}>⠿</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ShelfItemsSection({ onOpenPicker }: ShelfItemsSectionProps) {
  const { cabinets, height, thickness, depth, placedModels, removePlacedModel, movePlacedModelBefore } = useCabinetStore()
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  return (
    <div>
      <ModelCatalog />
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {cabinets.map((cabinet: CabinetSpec, ci: number) => {
          const usableWidth = cabinet.width - thickness * 2
          const compartments = [
            { shelfY: thickness / 2, shelfIndex: -1, label: 'Shelf 1' },
            ...cabinet.shelves.map((shelfY, si) => ({ shelfY, shelfIndex: si, label: `Shelf ${si + 2}` })),
          ]

          return (
            <div key={cabinet.id}>
              <div style={{ fontSize: T.fsSub, color: T.textMuted, marginBottom: 8 }}>Cabinet {ci + 1}</div>
              {compartments.map(({ shelfY, shelfIndex, label }) => {
                const nextShelfY = (shelfIndex === -1 ? cabinet.shelves[0] : cabinet.shelves[shelfIndex + 1]) ?? height - thickness
                const clearance = nextShelfY - (shelfY + thickness)
                const shelfModels = placedModels
                  .filter((m) => m.cabinetId === cabinet.id && m.shelfIndex === shelfIndex)
                  .map((m) => ({ placed: m, model: DISPLAY_MODELS.find((d) => d.id === m.modelId)! }))
                  .filter((x) => x.model)

                const totalWidth = shelfModels.reduce((sum, { model }) => sum + model.widthM, 0)
                const warnings: string[] = []
                shelfModels.forEach(({ model }) => {
                  if (model.heightM > clearance) warnings.push(`⚠ ${model.name} too tall`)
                  if (model.depthM! > depth) warnings.push(`⚠ ${model.name} too deep`)
                })
                if (totalWidth > usableWidth) warnings.push('⚠ Shelf overflow')

                return (
                  <div key={`comp-${shelfIndex}`} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: T.fsSub, color: '#888', width: 48, flexShrink: 0 }}>{label}:</span>
                      {shelfModels.map(({ placed, model }) => (
                        <div
                          key={placed.instanceId}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', placed.instanceId)}
                          onDragOver={(e) => { e.preventDefault(); setDragOverId(placed.instanceId) }}
                          onDragLeave={() => setDragOverId(null)}
                          onDrop={(e) => {
                            e.preventDefault()
                            movePlacedModelBefore(e.dataTransfer.getData('text/plain'), placed.instanceId)
                            setDragOverId(null)
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 3,
                            background: dragOverId === placed.instanceId ? 'rgba(100,180,255,0.15)' : 'rgba(255,255,255,0.08)',
                            borderRadius: 3,
                            border: dragOverId === placed.instanceId ? '1px solid rgba(100,180,255,0.4)' : '1px solid transparent',
                            padding: '3px 7px', fontSize: T.fsSub, color: '#ccc',
                            cursor: 'grab',
                          }}
                        >
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: modelColor(model.id), flexShrink: 0 }} />
                          <span>{model.name}</span>
                          <button
                            onClick={() => removePlacedModel(placed.instanceId)}
                            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0, fontSize: T.fs }}
                          >×</button>
                        </div>
                      ))}
                      <button
                        onClick={() => onOpenPicker(cabinet.id, shelfIndex)}
                        style={{
                          background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 3,
                          padding: '2px 8px', fontSize: T.fsSub, color: '#8cf', cursor: 'pointer',
                        }}
                      >+ Model</button>
                    </div>
                    {warnings.map((w, wi) => (
                      <div key={wi} style={{ fontSize: T.fsSub, color: '#f90', marginTop: 2 }}>{w}</div>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CabinetConfigSchema = z.object({
  version: z.literal(1),
  height: z.number(),
  depth: z.number(),
  thickness: z.number(),
  cabinets: z.array(z.object({
    id: z.string(),
    width: z.number(),
    shelves: z.array(z.number()),
  })),
  placedModels: z.array(z.object({
    instanceId: z.string(),
    cabinetId: z.string(),
    shelfIndex: z.number(),
    modelId: z.string(),
  })),
})

function validateConfig(data: unknown): CabinetConfig | null {
  const result = CabinetConfigSchema.safeParse(data)
  return result.success ? result.data : null
}

function ConfigSection() {
  const { getConfig, loadConfig, newDesign } = useCabinetStore()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    const config = getConfig()
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cabinet-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const config = validateConfig(data)
        if (!config) { setError('Invalid config file'); return }
        loadConfig(config)
      } catch {
        setError('Failed to parse file')
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const btnStyle = {
    flex: 1, padding: '8px 0',
    background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 5, color: '#fff', fontSize: T.fs, cursor: 'pointer',
    letterSpacing: '0.05em',
  }

  return (
    <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} style={btnStyle}>Save</button>
        <button onClick={() => fileInputRef.current?.click()} style={btnStyle}>Load</button>
        <button onClick={newDesign} style={{ ...btnStyle, color: '#f99' }}>New</button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoad} style={{ display: 'none' }} />
      </div>
      {error && <div style={{ fontSize: T.fsSub, color: '#f66' }}>{error}</div>}
    </div>
  )
}

export default function Controls() {
  const { draggingModelId } = useCabinetStore()
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null)
  const [open, setOpen] = useState({
    config: true,
    dimensions: true,
    cabinets: true,
    shelves: false,
    shelfItems: false,
  })

  const toggle = (key: keyof typeof open) =>
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <>
      <div style={{
        width: 360, flexShrink: 0,
        background: 'rgba(40,40,40,0.97)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        overflowY: 'auto',
        height: '100vh',
        userSelect: 'none',
        pointerEvents: draggingModelId ? 'none' : 'auto',
      }}>
        <SectionHeader label="Config" open={open.config} onToggle={() => toggle('config')} />
        {open.config && <ConfigSection />}

        <SectionHeader label="Dimensions" open={open.dimensions} onToggle={() => toggle('dimensions')} />
        {open.dimensions && <DimensionsSection />}

        <SectionHeader label="Cabinets" open={open.cabinets} onToggle={() => toggle('cabinets')} />
        {open.cabinets && <CabinetsSection />}

        <SectionHeader label="Shelves" open={open.shelves} onToggle={() => toggle('shelves')} />
        {open.shelves && <ShelvesSection />}

        <SectionHeader label="Shelf Items" open={open.shelfItems} onToggle={() => toggle('shelfItems')} />
        {open.shelfItems && (
          <ShelfItemsSection
            onOpenPicker={(cabinetId, shelfIndex) => setPickerTarget({ cabinetId, shelfIndex })}
          />
        )}
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
