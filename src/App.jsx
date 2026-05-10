import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PitchPrep from './pages/PitchPrep'
import PitchRoom from './pages/PitchRoom'
import PitchReport from './pages/PitchReport'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pitch-prep" element={<PitchPrep />} />
      <Route path="/pitch-room" element={<PitchRoom />} />
      <Route path="/pitch-report" element={<PitchReport />} />
    </Routes>
  )
}

export default App
