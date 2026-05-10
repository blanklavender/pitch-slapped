import { useNavigate } from 'react-router-dom'
import greenArrow from '../assets/green-arrow.png'
import './PitchPrep.css'

function PitchPrep() {
  const navigate = useNavigate()

  return (
    <div className="prep">
      <div className="prep-content">
        <h1>Prepare Your Pitch</h1>

        <p className="prep-warning">
          3 ruthless sharks are waiting on the other side.
          <br />
          You get <strong>one shot</strong> to convince them your idea is worth
          millions. No second chances, no do-overs.
        </p>

        <p className="prep-instruction">
          Step up to the mic, state your name, describe your product,
          <br />
          tell them what makes it special, and make your ask.
        </p>

      </div>

      <div className="prep-go-corner">
        <p className="prep-ready">Ready? Let's Go!</p>
        <img
          src={greenArrow}
          alt="Enter the Tank"
          className="go-arrow"
          onClick={() => navigate('/pitch-room')}
        />
      </div>
    </div>
  )
}

export default PitchPrep
