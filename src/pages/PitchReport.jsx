import { useNavigate } from 'react-router-dom'
import './PitchReport.css'

const scoreBreakdown = [
  { label: 'Clarity', score: 22, color: '#4caf50' },
  { label: 'Persuasion', score: 18, color: '#ff9800' },
  { label: 'Market Knowledge', score: 25, color: '#2196f3' },
  { label: 'Confidence', score: 20, color: '#e91e63' },
  { label: 'Financials', score: 15, color: '#9c27b0' },
]

const totalScore = scoreBreakdown.reduce((sum, s) => sum + s.score, 0)

const leaderboard = [
  { rank: 1, name: 'Arjun Mehta', product: 'SolarSnack', score: 94 },
  { rank: 2, name: 'Lisa Chang', product: 'PetPulse', score: 89 },
  { rank: 3, name: 'David Okafor', product: 'BrewBot', score: 85 },
  { rank: 4, name: 'You', product: 'BrewBot', score: 82 },
  { rank: 5, name: 'Priya Sharma', product: 'FitPlate', score: 78 },
]

function buildConicGradient() {
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

  return (
    <div className="report">
      <div className="report-content">
        <h1>Pitch Report</h1>

        <div className="report-card">
          <div className="score-section">
            <div className="pie-container">
              <div className="pie-chart" style={{ background: buildConicGradient() }}>
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
            <p>
              Strong opening — you grabbed attention quickly with a relatable problem.
              Your market sizing was impressive and well-researched. The product demo
              concept was clear, but you rushed through the revenue model. Slow down
              when explaining unit economics — the sharks want to see you understand
              your numbers inside out. Your confidence was solid, but eye contact
              dropped during tough questions. Overall, a compelling pitch with room
              to tighten the financials narrative.
            </p>
            <div className="verdict">
              <span className="verdict-label">Verdict:</span>
              <span className="verdict-value offer">2 of 3 sharks made an offer</span>
            </div>
          </div>
        </div>

        <h2 className="leaderboard-title">Leaderboard</h2>
        <div className="leaderboard-card">
          <div className="leaderboard-header">
            <span className="lb-rank">#</span>
            <span className="lb-name">Pitcher</span>
            <span className="lb-product">Product</span>
            <span className="lb-score">Score</span>
          </div>
          {leaderboard.map((entry) => (
            <div
              className={`leaderboard-row${entry.name === 'You' ? ' you' : ''}`}
              key={entry.rank}
            >
              <span className="lb-rank">{entry.rank}</span>
              <span className="lb-name">{entry.name}</span>
              <span className="lb-product">{entry.product}</span>
              <span className="lb-score">{entry.score}</span>
            </div>
          ))}
        </div>

        <button className="go-home-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default PitchReport
