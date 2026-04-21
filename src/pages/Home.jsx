import campusImage from "../assets/campus.jpg";
import "./Home.css";

function Home() {
  return (
    <div className="home">
      <div className="hero-text">
        <h1>Bienvenue sur Smart Campus</h1>
        <p>Réservez facilement vos salles universitairesnp</p>
        <button>Explorer les salles</button>
      </div>

      <div className="hero-image">
        <img src={campusImage} alt="Campus" />
      </div>
    </div>
  );
}

export default Home;