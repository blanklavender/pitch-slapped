import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import judge1 from '../assets/judge1.png'
import judge2 from '../assets/judge2.png'
import judge3 from '../assets/judge3.png'
import spotlightImg from '../assets/spotlight.png'
import './PitchRoom.css'

function PitchRoom() {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(0)
  const [summaryOpen, setSummaryOpen] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  const judges = [judge1, judge2, judge3]

  return (
    <div className="pitch-room">
      <div className="bg-overlay" />

      <div className="top-banner">
        <div className="timer">{mins}:{secs}</div>
      </div>

      <div className="judges">
        {judges.map((judge, i) => (
          <div className="judge-station" key={i}>
            <img src={spotlightImg} alt="" className="spotlight-img" />
            <div className="spotlight-glow" />
            <div className="judge-avatar-wrapper">
              <img src={judge} alt={`Judge ${i + 1}`} className="judge-avatar" />
            </div>
          </div>
        ))}
      </div>

      <div className="summary-box">
        <div className="summary-header" onClick={() => setSummaryOpen(!summaryOpen)}>
          <span>Running Summary</span>
          <span className={`summary-arrow ${summaryOpen ? 'open' : ''}`}>&#9660;</span>
        </div>
        <div className={`summary-content ${summaryOpen ? 'open' : ''}`}>
          Pitch evaluation and key points will appear here as the session progresses.
        </div>
      </div>

      <p className="placeholder-text">Start speaking to get your evaluations</p>

      <button className="end-btn" onClick={() => navigate('/')}>
        End Session
      </button>
    </div>
  )
}

export default PitchRoom
