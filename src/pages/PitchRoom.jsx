import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConversation } from '@elevenlabs/react'
import judge1 from '../assets/judge1.png'
import judge2 from '../assets/judge2.png'
import judge3 from '../assets/judge3.png'
import spotlightImg from '../assets/spotlight.png'
import './PitchRoom.css'

function PitchRoom() {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(0)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [errorMessage, setErrorMessage] = useState(null)
  const transcriptRef = useRef(null)

  const conversation = useConversation({
    onConnect: () => {
      setErrorMessage(null)
      setTranscript((prev) => [
        ...prev,
        { role: 'system', text: 'Connected. The investors are listening — start your pitch.' },
      ])
    },
    onDisconnect: () => {
      setTranscript((prev) => [...prev, { role: 'system', text: 'Disconnected.' }])
    },
    onMessage: ({ message, role }) => {
      setTranscript((prev) => [...prev, { role, text: message }])
    },
    onError: (message) => {
      setErrorMessage(message)
    },
  })

  const { status, mode, isMuted } = conversation
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  const handleStart = async () => {
    try {
      setErrorMessage(null)
      await navigator.mediaDevices.getUserMedia({ audio: true })
      const response = await fetch('http://localhost:3001/signed-url')
      if (!response.ok) throw new Error('Failed to get signed URL')
      const { signedUrl } = await response.json()
      await conversation.startSession({ signedUrl })
    } catch (error) {
      console.error('Failed to start conversation:', error)
      setErrorMessage(error.message || 'Failed to start conversation')
    }
  }

  const handleStop = async () => {
    try {
      await conversation.endSession()
    } catch (error) {
      console.error('Failed to end conversation:', error)
    }
  }

  const handleEndSession = async () => {
    if (isConnected || isConnecting) {
      await handleStop()
    }
    navigate('/')
  }

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [transcript])

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
            <div
              className="spotlight-glow"
              style={
                isConnected && mode === 'speaking'
                  ? { background: 'radial-gradient(circle, rgba(255, 245, 180, 0.6) 0%, transparent 70%)' }
                  : undefined
              }
            />
            <div className="judge-avatar-wrapper">
              <img src={judge} alt={`Judge ${i + 1}`} className="judge-avatar" />
            </div>
          </div>
        ))}
      </div>

      <div className="summary-box">
        <div className="summary-header" onClick={() => setSummaryOpen(!summaryOpen)}>
          <span>Live Transcript</span>
          <span className={`summary-arrow ${summaryOpen ? 'open' : ''}`}>&#9660;</span>
        </div>
        <div className={`summary-content ${summaryOpen ? 'open' : ''}`} ref={transcriptRef}>
          {transcript.length === 0 ? (
            <em>Conversation will appear here once the pitch begins.</em>
          ) : (
            transcript.map((entry, idx) => (
              <div key={idx} style={{ marginBottom: '8px' }}>
                <strong style={{ color: entry.role === 'user' ? '#ffd27a' : entry.role === 'agent' ? '#ff8a8a' : '#9ad' }}>
                  {entry.role === 'user' ? 'You' : entry.role === 'agent' ? 'Investors' : 'System'}:
                </strong>{' '}
                {entry.text}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="placeholder-text">
        {isConnecting && 'Connecting to the investors...'}
        {isConnected && mode === 'listening' && 'The investors are listening — pitch away.'}
        {isConnected && mode === 'speaking' && 'An investor is responding...'}
        {!isConnected && !isConnecting && 'Press Start Pitch to begin your conversation.'}
      </p>

      <div className="pitch-controls">
        {!isConnected && !isConnecting && (
          <button className="pitch-btn pitch-btn-start" onClick={handleStart}>
            Start Pitch
          </button>
        )}
        {(isConnected || isConnecting) && (
          <>
            <button
              className="pitch-btn pitch-btn-mute"
              onClick={() => conversation.setMuted(!isMuted)}
              disabled={!isConnected}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button className="pitch-btn pitch-btn-stop" onClick={handleStop}>
              Stop Pitch
            </button>
          </>
        )}
      </div>

      {errorMessage && <div className="pitch-error">{errorMessage}</div>}

      <button className="end-btn" onClick={handleEndSession}>
        End Session
      </button>
    </div>
  )
}

export default PitchRoom
