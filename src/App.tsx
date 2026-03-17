import { useState, useEffect } from 'react'
import './index.css'
import Scene from './components/Scene'
import Controls from './components/Controls'
import { useCabinetStore } from './store'
import { DISPLAY_MODELS, modelColor } from './data/displayModels'

export default function App() {
  const { draggingModelId, endModelDrag, loadConfig } = useCabinetStore()
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [controlsVisible, setControlsVisible] = useState(true)

  useEffect(() => {
    fetch('/default-config.json')
      .then((r) => r.json())
      .then(loadConfig)
      .catch(() => { })
  })

  useEffect(() => {
    if (!draggingModelId) return
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    const onUp = () => endModelDrag()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [draggingModelId, endModelDrag])

  const draggingModel = draggingModelId
    ? DISPLAY_MODELS.find((m) => m.id === draggingModelId)
    : null

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <Scene />
      </div>
      <button
        onClick={() => setControlsVisible((v) => !v)}
        style={{
          position: 'fixed', top: 12, right: controlsVisible ? 372 : 12, zIndex: 100,
          background: 'rgba(40,40,40,0.9)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6, color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          padding: '6px 10px', fontSize: 14, lineHeight: 1,
        }}
      >{controlsVisible ? '⟩' : '⟨'}</button>
      {controlsVisible && <Controls />}
      {draggingModel && (
        <div style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 999,
          left: mouse.x + 14,
          top: mouse.y + 14,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(20,20,20,0.9)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6, padding: '5px 10px',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: modelColor(draggingModel.id), flexShrink: 0 }} />
            <span style={{ color: '#eee', fontSize: 12, whiteSpace: 'nowrap' }}>
              {draggingModel.name}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
