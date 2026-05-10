import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PitchPrep from './pages/PitchPrep'
import PitchRoom from './pages/PitchRoom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pitch-prep" element={<PitchPrep />} />
      <Route path="/pitch-room" element={<PitchRoom />} />
    </Routes>
  )
}

export default App
