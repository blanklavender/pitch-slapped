import { useNavigate } from 'react-router-dom'
import rocketImg from '../assets/rocket-ship-half-shadow.png'
import boxImg from '../assets/out-of-the-box.png'
import dartImg from '../assets/target-with-dart.png'
import plantImg from '../assets/plant-growth-from-coin.png'
import greenArrow from '../assets/green-arrow.png'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home">
      <img src={rocketImg} alt="" className="deco deco-rocket" />
      <img src={boxImg} alt="" className="deco deco-box" />
      <img src={dartImg} alt="" className="deco deco-dart" />
      <img src={plantImg} alt="" className="deco deco-plant" />

      <h1>Pitch Slapped</h1>
      <div className="enter-section">
        <label>Get humbled by potential investors!</label>
        <img
          src={greenArrow}
          alt="Go"
          className="go-arrow"
          onClick={() => navigate('/pitch-prep')}
        />
      </div>
    </div>
  )
}

export default Home
