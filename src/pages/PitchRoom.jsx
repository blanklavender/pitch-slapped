import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConversation } from '@elevenlabs/react'
import judge1 from '../assets/judge1.png'
import judge2 from '../assets/judge2.png'
import judge3 from '../assets/judge3.png'
import spotlightImg from '../assets/spotlight.png'
import './PitchRoom.css'

const SHARK_DEFS = [
  { id: 'james', name: 'James', image: judge1 },
  { id: 'vidya', name: 'Vidya', image: judge2 },
  { id: 'layla', name: 'Layla', image: judge3 },
]

const initialSharkState = () =>
  SHARK_DEFS.reduce((acc, s) => {
    acc[s.id] = { status: 'active', offer: null }
    return acc
  }, {})

const initialSummary = () => ({
  productName: null,
  usp: null,
  ask: null,
  bullets: [],
})

function formatOffer(offer) {
  if (!offer) return ''
  const parts = []
  if (offer.amount != null) parts.push(`$${Number(offer.amount).toLocaleString()}`)
  if (offer.equity != null) parts.push(`for ${offer.equity}% equity`)
  const head = parts.join(' ')
  return offer.notes ? `${head} — ${offer.notes}` : head
}

function SharkCard({ shark, state, isTalking }) {
  const optedOut = state.status === 'opted_out'
  return (
    <div className={`shark-card-wrap`}>
      <div
        className={[
          'shark-card',
          isTalking ? 'talking' : '',
          optedOut ? 'opted-out' : '',
        ].join(' ').trim()}
      >
        <div className="shark-glow" />
        <img src={shark.image} alt={shark.name} className="shark-card-avatar" />
        <div className="shark-card-name">{shark.name}</div>
        {optedOut && <div className="shark-card-tag">Out</div>}
      </div>
      {state.offer && !optedOut && (
        <div className="offer-banner">
          <span className="offer-label">Offer</span>
          <span className="offer-text">{formatOffer(state.offer)}</span>
        </div>
      )}
    </div>
  )
}

function PitchSummary({ summary }) {
  const hasContent =
    summary.productName || summary.usp || summary.ask || summary.bullets.length > 0
  return (
    <div className="pitch-summary-card">
      <div className="pitch-summary-title">Pitch Summary</div>
      {!hasContent && (
        <div className="pitch-summary-empty">
          Details will fill in as the pitch progresses…
        </div>
      )}
      {hasContent && (
        <ul className="pitch-summary-list">
          {summary.productName && (
            <li><strong>Product:</strong> {summary.productName}</li>
          )}
          {summary.usp && (
            <li><strong>USP:</strong> {summary.usp}</li>
          )}
          {summary.ask && (
            <li><strong>Ask:</strong> {summary.ask}</li>
          )}
          {summary.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SpeakerView({ activeShark, isPitcherTalking, videoRef }) {
  const showingPitcher = isPitcherTalking || !activeShark
  return (
    <div className="speaker-view">
      <img src={spotlightImg} alt="" className="speaker-spotlight" />
      <div className="speaker-glow" />
      <div className="speaker-frame">
        {showingPitcher ? (
          <video
            ref={videoRef}
            className="speaker-video"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            src={activeShark.image}
            alt={activeShark.name}
            className="speaker-shark-img"
          />
        )}
      </div>
      <div className="speaker-label">
        {showingPitcher ? 'You' : activeShark.name}
      </div>
    </div>
  )
}

function EndModal({ status, details, onClose }) {
  if (!status || status === 'live' || status === 'idle') return null
  const titles = {
    ended_no_offers: 'No offers — session over',
    ended_accepted: 'Deal closed',
    ended_declined: 'You walked away',
  }
  return (
    <div className="end-modal-backdrop" onClick={onClose}>
      <div className="end-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{titles[status] || 'Session ended'}</h2>
        {details?.message && <p>{details.message}</p>}
        <button className="end-modal-btn" onClick={onClose}>Back to home</button>
      </div>
    </div>
  )
}

function PitchRoom() {
  const navigate = useNavigate()

  const [seconds, setSeconds] = useState(0)
  const [activeSharkId, setActiveSharkId] = useState(null)
  const [sharkStates, setSharkStates] = useState(initialSharkState)
  const [summary, setSummary] = useState(initialSummary)
  const [sessionStatus, setSessionStatus] = useState('idle')
  const [endDetails, setEndDetails] = useState(null)
  const [pitcherSpeaking, setPitcherSpeaking] = useState(false)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)

  const finalizeSession = useCallback((status, details = null) => {
    setSessionStatus(status)
    setEndDetails(details)
    setActiveSharkId(null)
    setPitcherSpeaking(false)
  }, [])

  const clientTools = useMemo(() => ({
    setActiveShark: ({ sharkId }) => {
      const id = String(sharkId || '').toLowerCase()
      if (SHARK_DEFS.some((s) => s.id === id)) {
        setActiveSharkId(id)
        return `active shark set to ${id}`
      }
      return 'unknown shark id'
    },
    makeOffer: ({ sharkId, amount, equity, notes }) => {
      const id = String(sharkId || '').toLowerCase()
      setSharkStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], offer: { amount, equity, notes }, status: 'active' },
      }))
      return 'offer recorded'
    },
    optOut: ({ sharkId }) => {
      const id = String(sharkId || '').toLowerCase()
      setSharkStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: 'opted_out', offer: null },
      }))
      return 'shark opted out'
    },
    updateSummary: ({ productName, usp, ask, bullets }) => {
      setSummary((prev) => ({
        productName: productName ?? prev.productName,
        usp: usp ?? prev.usp,
        ask: ask ?? prev.ask,
        bullets: Array.isArray(bullets) ? bullets : prev.bullets,
      }))
      return 'summary updated'
    },
    endSession: ({ outcome, sharkId, message }) => {
      const map = {
        no_offers: 'ended_no_offers',
        accepted: 'ended_accepted',
        declined: 'ended_declined',
      }
      const status = map[outcome] || 'ended_declined'
      finalizeSession(status, { sharkId, message })
      return 'session ended'
    },
  }), [finalizeSession])

  const conversation = useConversation({
    clientTools,
    onConnect: () => setSessionStatus('live'),
    onDisconnect: () => {
      setActiveSharkId(null)
      setPitcherSpeaking(false)
    },
    onError: (err) => console.error('Conversation error:', err),
  })

  useEffect(() => {
    if (sessionStatus !== 'live') return
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [sessionStatus])

  useEffect(() => {
    let cancelled = false
    async function setupMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream

        const Ctx = window.AudioContext || window.webkitAudioContext
        const ctx = new Ctx()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        source.connect(analyser)
        audioCtxRef.current = ctx
        analyserRef.current = analyser

        const buf = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / buf.length)
          setPitcherSpeaking(rms > 0.04)
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch (err) {
        console.warn('Media setup failed:', err)
      }
    }
    setupMedia()
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {})
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const startConversation = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/conversation-signed-url')
      const data = await res.json()
      if (data.signedUrl) {
        await conversation.startSession({ signedUrl: data.signedUrl })
      } else {
        const idRes = await fetch('http://localhost:3001/agent-id')
        const idData = await idRes.json()
        if (!idData.agentId) throw new Error('No agent id available')
        await conversation.startSession({ agentId: idData.agentId })
      }
    } catch (err) {
      console.error('Failed to start conversation:', err)
    }
  }, [conversation])

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession()
    } catch (err) {
      console.error('Failed to end conversation:', err)
    }
  }, [conversation])

  const handleEndClick = useCallback(async () => {
    await stopConversation()
    const anyOffers = Object.values(sharkStates).some((s) => s.offer)
    const allOut = Object.values(sharkStates).every((s) => s.status === 'opted_out')
    if (allOut || !anyOffers) {
      finalizeSession('ended_no_offers')
    } else {
      finalizeSession('ended_declined')
    }
  }, [stopConversation, sharkStates, finalizeSession])

  const isAISpeaking = conversation.isSpeaking
  const activeShark = activeSharkId
    ? SHARK_DEFS.find((s) => s.id === activeSharkId)
    : null
  const showSharkSpeaker = isAISpeaking && activeShark
  const showPitcherSpeaker = !showSharkSpeaker && pitcherSpeaking

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  const isLive = conversation.status === 'connected' || sessionStatus === 'live'

  return (
    <div className="pitch-room">
      <div className="bg-overlay" />

      <div className="top-banner">
        <div className="timer">{mins}:{secs}</div>
      </div>

      <div className="stage">
        <SpeakerView
          activeShark={showSharkSpeaker ? activeShark : null}
          isPitcherTalking={showPitcherSpeaker}
          videoRef={videoRef}
        />

        <div className="shark-row">
          {SHARK_DEFS.map((shark) => (
            <SharkCard
              key={shark.id}
              shark={shark}
              state={sharkStates[shark.id]}
              isTalking={isAISpeaking && activeSharkId === shark.id}
            />
          ))}
        </div>
      </div>

      <PitchSummary summary={summary} />

      <div className="control-bar">
        {!isLive ? (
          <button className="control-btn primary" onClick={startConversation}>
            Start Pitch
          </button>
        ) : (
          <button className="control-btn" onClick={stopConversation}>
            Pause
          </button>
        )}
        <button className="control-btn danger" onClick={handleEndClick}>
          End Session
        </button>
      </div>

      <EndModal
        status={sessionStatus}
        details={endDetails}
        onClose={() => navigate('/')}
      />
    </div>
  )
}

export default PitchRoom
