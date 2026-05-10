import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConversation } from '@elevenlabs/react'
import judge1 from '../assets/judge1.png'
import judge2 from '../assets/judge2.png'
import judge3 from '../assets/judge3.png'
import spotlightImg from '../assets/spotlight.png'
import './PitchRoom.css'

const JUDGES = [
  { name: 'James', image: judge1 },
  { name: 'Vidya', image: judge2 },
  { name: 'Layla', image: judge3 },
]

const SPEAKER_TAG_RE = /<(James|Vidya|Layla)>([\s\S]*?)<\/\1>/g
const MS_PER_CHAR = 75 // rough TTS pace, used to schedule highlight transitions

function parseSpeakerSegments(message) {
  const segments = []
  let match
  SPEAKER_TAG_RE.lastIndex = 0
  while ((match = SPEAKER_TAG_RE.exec(message)) !== null) {
    const text = match[2].trim()
    if (text) segments.push({ speaker: match[1], text })
  }
  return segments
}

function PitchRoom() {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(0)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [errorMessage, setErrorMessage] = useState(null)
  const [currentSpeaker, setCurrentSpeaker] = useState(null)
  const transcriptRef = useRef(null)
  const speakerTimersRef = useRef([])

  const clearSpeakerTimers = () => {
    speakerTimersRef.current.forEach(clearTimeout)
    speakerTimersRef.current = []
  }

  const scheduleSpeakerHighlights = (segments) => {
    clearSpeakerTimers()
    let elapsed = 0
    segments.forEach(({ speaker, text }) => {
      const startAt = elapsed
      speakerTimersRef.current.push(
        setTimeout(() => setCurrentSpeaker(speaker), startAt)
      )
      elapsed += Math.max(text.length * MS_PER_CHAR, 400)
    })
    speakerTimersRef.current.push(
      setTimeout(() => setCurrentSpeaker(null), elapsed)
    )
  }

  const conversation = useConversation({
    onConnect: () => {
      setErrorMessage(null)
      setTranscript((prev) => [
        ...prev,
        { role: 'system', text: 'Connected. The investors are listening — start your pitch.' },
      ])
    },
    onDisconnect: () => {
      clearSpeakerTimers()
      setCurrentSpeaker(null)
      setTranscript((prev) => [...prev, { role: 'system', text: 'Disconnected.' }])
    },
    onMessage: ({ message, role }) => {
      setTranscript((prev) => [...prev, { role, text: message }])
      if (role === 'agent') {
        const segments = parseSpeakerSegments(message)
        if (segments.length > 0) scheduleSpeakerHighlights(segments)
      }
    },
    onModeChange: ({ mode }) => {
      if (mode === 'listening') {
        clearSpeakerTimers()
        setCurrentSpeaker(null)
      }
    },
    onInterruption: () => {
      clearSpeakerTimers()
      setCurrentSpeaker(null)
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

  useEffect(() => () => clearSpeakerTimers(), [])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  return (
    <div className="pitch-room">
      <div className="bg-overlay" />

      <div className="top-banner">
        <div className="timer">{mins}:{secs}</div>
      </div>

      <div className="judges">
        {JUDGES.map(({ name, image }, i) => {
          const isSpeaking = currentSpeaker === name
          return (
            <div className={`judge-station${isSpeaking ? ' speaking' : ''}`} key={name}>
              <img src={spotlightImg} alt="" className="spotlight-img" />
              <div className="spotlight-glow" />
              <div className="judge-avatar-wrapper">
                <img src={image} alt={`Judge ${i + 1} (${name})`} className="judge-avatar" />
              </div>
            </div>
          )
        })}
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
            transcript.map((entry, idx) => {
              if (entry.role === 'agent') {
                const segments = parseSpeakerSegments(entry.text)
                if (segments.length > 0) {
                  return segments.map((seg, segIdx) => (
                    <div key={`${idx}-${segIdx}`} className="summary-item">
                      <strong style={{ color: '#ff8a8a' }}>{seg.speaker}:</strong> {seg.text}
                    </div>
                  ))
                }
              }
              const label = entry.role === 'user' ? 'You' : entry.role === 'agent' ? 'Investors' : 'System'
              const color = entry.role === 'user' ? '#ffd27a' : entry.role === 'agent' ? '#ff8a8a' : '#9ad'
              return (
                <div key={idx} className="summary-item">
                  <strong style={{ color }}>{label}:</strong> {entry.text}
                </div>
              )
            })
          )}
        </div>
      </div>

      <p className="placeholder-text">
        {isConnecting && 'Connecting to the investors...'}
        {isConnected && mode === 'listening' && 'The investors are listening — pitch away.'}
        {isConnected && mode === 'speaking' && (currentSpeaker ? `${currentSpeaker} is responding...` : 'An investor is responding...')}
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
