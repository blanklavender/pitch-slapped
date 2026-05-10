import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranscript } from '../context/TranscriptContext'
import './PitchReport.css'

const MOCK_TRANSCRIPT = [
  { role: "user", text: "Hi everyone, I'm Alex and I'm here to pitch BrewBot — a smart coffee machine that learns your taste preferences over time using AI. We're seeking 200 thousand dollars for 10% equity." },
  { role: "agent", text: "<James>Interesting concept. How does the AI actually learn? Is it just tracking what buttons I press, or is there something deeper going on?</James>" },
  { role: "user", text: "Great question James. BrewBot uses a combination of direct feedback — you rate each cup — and passive signals like time of day, weather, and how quickly you finish your drink. Our proprietary algorithm adjusts grind size, water temperature, and brew time." },
  { role: "agent", text: "<Vidya>I like the tech angle, but coffee machines are a crowded market. What makes you different from a Nespresso with an app?</Vidya>" },
  { role: "user", text: "Vidya, the key difference is we don't use pods. We work with fresh beans, and our machine grinds and brews. No proprietary pod lock-in. Plus our AI genuinely adapts — Nespresso just gives you preset options." },
  { role: "agent", text: "<Layla>Talk to me about numbers. What's your current revenue? What's the unit economics look like?</Layla>" },
  { role: "user", text: "We launched 6 months ago. We've done 450 thousand in revenue. Each unit costs us 180 to manufacture, we sell at 499. Our customer acquisition cost is about 45 dollars through social media and influencer partnerships." },
  { role: "agent", text: "<James>Those margins are solid. What's your return rate?</James>" },
  { role: "user", text: "Return rate is 3.2%, which is well below industry average of 8% for kitchen appliances. Our NPS score is 72." },
  { role: "agent", text: "<Vidya>What's your plan for the 200K? Where does that money go?</Vidya>" },
  { role: "user", text: "60% goes to inventory for our next production run — we're supply constrained right now. 25% to marketing to scale our influencer program. And 15% to R&D for our mobile app which launches in Q3." },
  { role: "agent", text: "<Layla>I have concerns about scalability. Manufacturing hardware is capital intensive. How do you plan to scale without burning through cash?</Layla>" },
  { role: "user", text: "We've partnered with a contract manufacturer in Shenzhen who can scale to 50,000 units per month. We only pay per unit, so there's no fixed overhead increase. We're also exploring a subscription model for premium bean deliveries which would give us recurring revenue." },
  { role: "agent", text: "<James>I like what I'm hearing. The subscription angle is smart. I'd be interested in making an offer.</James><Vidya>I think the market is tough but you clearly know your numbers. I'm going to pass, but I wish you the best.</Vidya><Layla>I love the recurring revenue angle. I'm in — I'd like to make an offer as well.</Layla>" },
]

const CATEGORY_META = {
  clarity: { label: 'Clarity', color: '#4caf50' },
  persuasion: { label: 'Persuasion', color: '#ff9800' },
  market_knowledge: { label: 'Market Knowledge', color: '#2196f3' },
  confidence: { label: 'Confidence', color: '#e91e63' },
  financials: { label: 'Financials', color: '#9c27b0' },
}

function buildConicGradient(scoreBreakdown, totalScore) {
  let deg = 0
  const stops = scoreBreakdown.map((s) => {
    const start = deg
    deg += (s.score / totalScore) * 360
    return `${s.color} ${start}deg ${deg}deg`
  })
  return `conic-gradient(${stops.join(', ')})`
}

function PitchReport() {
  const navigate = useNavigate()
  const { getTranscript } = useTranscript()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let transcript = getTranscript()
    if (!transcript || transcript.length === 0) {
      transcript = MOCK_TRANSCRIPT
    }

    fetch('http://localhost:3001/analyze-pitch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to analyze pitch')
        return res.json()
      })
      .then((data) => setAnalysis(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="report">
        <div className="report-content">
          <h1>Pitch Report</h1>
          <div className="report-loading">
            <div className="loading-spinner" />
            <p>Analyzing your pitch with AI...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="report">
        <div className="report-content">
          <h1>Pitch Report</h1>
          <p className="report-error">{error}</p>
          <button className="go-home-btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const scoreBreakdown = Object.entries(CATEGORY_META).map(([key, meta]) => ({
    label: meta.label,
    score: analysis.scores[key] || 0,
    color: meta.color,
  }))

  const totalScore = scoreBreakdown.reduce((sum, s) => sum + s.score, 0)

  return (
    <div className="report">
      <div className="report-content">
        <h1>Pitch Report</h1>

        <div className="report-card">
          <div className="score-section">
            <div className="pie-container">
              <div className="pie-chart" style={{ background: buildConicGradient(scoreBreakdown, totalScore) }}>
                <div className="pie-center">
                  <span className="pie-score">{totalScore}</span>
                  <span className="pie-label">/ 100</span>
                </div>
              </div>
              <div className="pie-legend">
                {scoreBreakdown.map((s) => (
                  <div className="legend-item" key={s.label}>
                    <span className="legend-dot" style={{ background: s.color }} />
                    <span className="legend-text">{s.label}</span>
                    <span className="legend-score">{s.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="feedback-section">
            <h2>Feedback</h2>
            <p>{analysis.feedback}</p>
            <div className="verdict">
              <span className="verdict-label">Verdict:</span>
              <span className="verdict-value offer">{analysis.verdict}</span>
            </div>
          </div>
        </div>

        {analysis.strengths && analysis.strengths.length > 0 && (
          <div className="insights-card">
            <h2>Strengths</h2>
            <ul>
              {analysis.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.improvements && analysis.improvements.length > 0 && (
          <div className="insights-card">
            <h2>Areas to Improve</h2>
            <ul>
              {analysis.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="go-home-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default PitchReport
