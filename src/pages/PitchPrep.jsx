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
          Potential investors await your presentation in the Pitch Room.
          <br />
          You get <strong>one shot</strong> at convincing them your idea is worth
          their money.
        </p>

        <p className="prep-instruction">
          State your name, describe your idea and
          <br />
          blow their minds! Good luck.
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
