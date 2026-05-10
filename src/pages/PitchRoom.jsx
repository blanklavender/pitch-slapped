import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConversation } from '@elevenlabs/react'
import { useTranscript } from '../context/TranscriptContext'
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
const END_MARKER_RE = /<\s*END_SESSION\s*\/?\s*>/gi
const MS_PER_CHAR_FALLBACK = 75 // only used if alignment data is missing
const POST_END_GRACE_MS = 600 // small buffer so the final verdict audio can flush before we disconnect

function stripEndMarker(message) {
  return message.replace(END_MARKER_RE, '').trim()
}

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

// Concatenate alignment chunks into one timeline of { char, absMs } where
// absMs is the audio playback offset for that character relative to the very
// start of the agent's spoken response.
function buildAlignmentTimeline(alignments) {
  const chars = []
  let baseMs = 0
  for (const a of alignments) {
    const c = a.chars || []
    const starts = a.char_start_times_ms || a.charStartTimesMs || []
    const durs = a.char_durations_ms || a.charDurationsMs || []
    for (let i = 0; i < c.length; i++) {
      chars.push({ char: c[i], absMs: baseMs + (starts[i] ?? 0) })
    }
    if (c.length > 0) {
      const last = c.length - 1
      baseMs += (starts[last] ?? 0) + (durs[last] ?? 0)
    }
  }
  return { chars, totalMs: baseMs }
}

// Given parsed speaker segments and the alignment timeline, return per-segment
// { startMs, endMs } in absolute playback time. Falls back to char-count
// estimation when the timeline doesn't yet cover a segment.
function computeSegmentTimings(segments, timeline) {
  const isLetter = (ch) => /[\p{L}\p{N}]/u.test(ch)
  const result = []
  let charIdx = 0
  let lastEnd = 0
  for (const seg of segments) {
    while (charIdx < timeline.chars.length && !isLetter(timeline.chars[charIdx].char)) {
      charIdx++
    }
    let startMs
    let endMs
    if (charIdx < timeline.chars.length) {
      startMs = timeline.chars[charIdx].absMs
      let consumed = 0
      const target = seg.text.replace(/\s/g, '').length || seg.text.length
      while (charIdx < timeline.chars.length && consumed < target) {
        if (isLetter(timeline.chars[charIdx].char)) consumed++
        charIdx++
      }
      endMs = charIdx < timeline.chars.length
        ? timeline.chars[charIdx].absMs
        : Math.max(timeline.totalMs, startMs + seg.text.length * MS_PER_CHAR_FALLBACK)
    } else {
      startMs = lastEnd
      endMs = startMs + Math.max(seg.text.length * MS_PER_CHAR_FALLBACK, 400)
    }
    result.push({ ...seg, startMs, endMs })
    lastEnd = endMs
  }
  return result
}

function PitchRoom() {
  const navigate = useNavigate()
  const { setTranscript: saveTranscript } = useTranscript()
  const [seconds, setSeconds] = useState(0)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [errorMessage, setErrorMessage] = useState(null)
  const [currentSpeaker, setCurrentSpeaker] = useState(null)
  const transcriptRef = useRef(null)
  const transcriptDataRef = useRef([])
  const speakerTimersRef = useRef([])
  const segmentsRef = useRef([])
  const alignmentsRef = useRef([])
  const speakingStartRef = useRef(null)
  const endRequestedRef = useRef(false)
  const finishingRef = useRef(false)
  const conversationRef = useRef(null)

  const clearSpeakerTimers = () => {
    speakerTimersRef.current.forEach(clearTimeout)
    speakerTimersRef.current = []
  }

  const resetSpeakerState = () => {
    clearSpeakerTimers()
    segmentsRef.current = []
    alignmentsRef.current = []
    speakingStartRef.current = null
    setCurrentSpeaker(null)
  }

  // Re-derive every speaker-highlight transition from scratch using whatever
  // alignment chunks have arrived so far, anchored to the moment audio
  // playback actually started (speakingStartRef). Re-runs on every new
  // alignment so streaming chunks during long agent turns stay in sync.
  const reschedule = () => {
    if (speakingStartRef.current === null) return
    const segments = segmentsRef.current
    if (segments.length === 0) return

    clearSpeakerTimers()
    const timeline = buildAlignmentTimeline(alignmentsRef.current)
    const timings = computeSegmentTimings(segments, timeline)
    const elapsed = Date.now() - speakingStartRef.current

    for (const t of timings) {
      if (t.endMs <= elapsed) continue
      const delay = Math.max(0, t.startMs - elapsed)
      speakerTimersRef.current.push(
        setTimeout(() => setCurrentSpeaker(t.speaker), delay)
      )
    }
    const totalEnd = timings.length > 0 ? timings[timings.length - 1].endMs : 0
    if (totalEnd > elapsed) {
      speakerTimersRef.current.push(
        setTimeout(() => setCurrentSpeaker(null), totalEnd - elapsed)
      )
    } else {
      setCurrentSpeaker(null)
    }
  }

  const finishSession = async () => {
    if (finishingRef.current) return
    finishingRef.current = true
    saveTranscript(transcriptDataRef.current)
    try {
      await conversationRef.current?.endSession()
    } catch (error) {
      console.error('Failed to end conversation:', error)
    }
    navigate('/pitch-report')
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
      resetSpeakerState()
      setTranscript((prev) => [...prev, { role: 'system', text: 'Disconnected.' }])
    },
    onMessage: ({ message, role }) => {
      const hasEndMarker = role === 'agent' && END_MARKER_RE.test(message)
      const cleanText = role === 'agent' ? stripEndMarker(message) : message
      if (cleanText) {
        setTranscript((prev) => [...prev, { role, text: cleanText }])
      }
      if (role === 'agent') {
        segmentsRef.current = parseSpeakerSegments(cleanText)
        if (hasEndMarker) endRequestedRef.current = true
        reschedule()
      }
    },
    onAudioAlignment: (alignment) => {
      alignmentsRef.current.push(alignment)
      reschedule()
    },
    onModeChange: ({ mode }) => {
      if (mode === 'speaking') {
        speakingStartRef.current = Date.now()
        reschedule()
      } else {
        resetSpeakerState()
        if (endRequestedRef.current && !finishingRef.current) {
          setTimeout(() => { finishSession() }, POST_END_GRACE_MS)
        }
      }
    },
    onInterruption: () => {
      resetSpeakerState()
    },
    onError: (message) => {
      setErrorMessage(message)
    },
  })

  conversationRef.current = conversation

  const { status, mode, isMuted } = conversation
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setErrorMessage(null)
        await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled) return
        const response = await fetch('http://localhost:3001/signed-url')
        if (cancelled) return
        if (!response.ok) throw new Error('Failed to get signed URL')
        const { signedUrl } = await response.json()
        if (cancelled) return
        await conversationRef.current.startSession({ signedUrl })
      } catch (error) {
        if (cancelled) return
        console.error('Failed to start conversation:', error)
        setErrorMessage(error.message || 'Failed to start conversation')
      }
    })()
    return () => {
      cancelled = true
      Promise.resolve(conversationRef.current?.endSession()).catch(() => {})
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    transcriptDataRef.current = transcript
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
        {!isConnected && !isConnecting && 'Setting up the room...'}
      </p>

      <div className="pitch-controls">
        <button
          className="pitch-btn pitch-btn-mute"
          onClick={() => conversation.setMuted(!isMuted)}
          disabled={!isConnected}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
      </div>

      {errorMessage && <div className="pitch-error">{errorMessage}</div>}
    </div>
  )
}

export default PitchRoom
