import { useState } from 'react'
import ReactDOM from 'react-dom'
import { DISPLAY_MODELS, modelColor } from '../data/displayModels'
import { useCabinetStore } from '../store'

type Props = {
  cabinetId: string
  shelfIndex: number
  onClose: () => void
}

export default function ModelPicker({ cabinetId, shelfIndex, onClose }: Props) {
  const [query, setQuery] = useState('')
  const { placeDisplayModel } = useCabinetStore()

  const filtered = DISPLAY_MODELS.filter(
    (m) => m.depthM !== null && m.name.toLowerCase().includes(query.toLowerCase())
  )

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(20,20,20,0.95)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10,
          padding: 16,
          width: 440,
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          backdropFilter: 'blur(8px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#eee', fontSize: 14, fontWeight: 600 }}>Place a Display Model</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 18 }}
          >×</button>
        </div>

        <input
          autoFocus
          placeholder="Search models..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 5,
            padding: '6px 10px',
            color: '#eee',
            fontSize: 13,
            outline: 'none',
          }}
        />

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((model) => (
            <div
              key={model.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 6px',
                borderRadius: 5,
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <div style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: modelColor(model.id),
                flexShrink: 0,
              }} />
              <span style={{ flex: 1, color: '#ddd', fontSize: 12 }}>{model.name}</span>
              <span style={{ color: '#888', fontSize: 11, whiteSpace: 'nowrap' }}>
                {Math.round(model.heightM * 100)}×{Math.round(model.widthM * 100)}×{Math.round(model.depthM! * 100)} cm
              </span>
              <button
                onClick={() => {
                  placeDisplayModel(cabinetId, shelfIndex, model.id)
                  onClose()
                }}
                style={{
                  padding: '2px 8px',
                  fontSize: 11,
                  background: '#2a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >Place</button>
            </div>
          ))}
          {filtered.length === 0 && (
            <span style={{ color: '#666', fontSize: 12, textAlign: 'center', padding: 12 }}>No models found</span>
          )}
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}
