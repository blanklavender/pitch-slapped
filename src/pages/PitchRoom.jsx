import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import judge1 from '../assets/judge1.png'
import judge2 from '../assets/judge2.png'
import judge3 from '../assets/judge3.png'
import spotlightImg from '../assets/spotlight.png'
import './PitchRoom.css'
import { useScribe } from "@elevenlabs/react";

function PitchRoom() {
  const navigate = useNavigate()
  const [seconds, setSeconds] = useState(0)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    onPartialTranscript: (data) => {
      console.log("Partial:", data.text);
    },
    onCommittedTranscript: (data) => {
      console.log("Committed:", data.text);
    },
    onCommittedTranscriptWithTimestamps: (data) => {
      console.log("Committed with timestamps:", data.text);
      console.log("Timestamps:", data.words);
    },
  }); 

  const fetchTokenFromServer = async () => {
  const response = await fetch("http://localhost:3001/scribe-token");
  const data = await response.json();
  return data.token;
  };

  const handleStart = async () => {
  try {
    const token = await fetchTokenFromServer();
    console.log("Token received:", token);
    
    await scribe.connect({
      token,
      microphone: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    
    console.log("Connected!");
  } catch (error) {
    console.error("Error starting:", error);
  }
};    

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
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        <button onClick={handleStart} disabled={scribe.isConnected}>
          Start Recording
        </button>
        <button onClick={scribe.disconnect} disabled={!scribe.isConnected}>
          Stop
        </button>
        {scribe.partialTranscript && <p>Live: {scribe.partialTranscript}</p>}
        <div>
          {scribe.committedTranscripts.map((t) => (
            <p key={t.id}>{t.text}</p>
          ))}
        </div>
      </div>

      <button className="end-btn" onClick={() => navigate('/')}>
        End Session
      </button>
    </div>
  )
}

export default PitchRoom
