import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PitchRoom from './pages/PitchRoom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/pitch-room" element={<PitchRoom />} />
    </Routes>
  )
}

export default App
