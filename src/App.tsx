import './index.css'
import Scene from './components/Scene'
import Controls from './components/Controls'

export default function App() {
  return (
    <div className="w-screen h-screen relative">
      <Scene />
      <Controls />
    </div>
  )
}
