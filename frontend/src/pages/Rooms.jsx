import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoomCard from "../components/RoomCard";
import { getRoomImage } from "../utils/imageUtils";
import "./css/Rooms.css";
import carte from "../assets/carte.png";

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/rooms")
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error("Erreur rooms :", err));
  }, []);

  return (
    <main className="rooms-page" align="center">
      {/* Section pour la carte du campus */}
      <section className="campus-map-section">
        <h2>Carte des salles connectées</h2>
        <div className="map-container">
          <img src={carte} alt="Carte du campus" />
        </div>
      </section>

      {/* Section pour la liste des salles disponibles */}
      <section className="rooms-section">
        <h2>Salles disponibles</h2>
      </section>

      {/* Grille des salles */}
      <div className="rooms-grid">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            image={getRoomImage(room.name)}
            name={room.name}
            status={room.status || "Libre"}
            fill={(room.capacity / 1000) * 100}
            onClick={() => navigate(`/room/${room.id}`)}
          />
        ))}
      </div>
    </main>
  );
}

export default Rooms;