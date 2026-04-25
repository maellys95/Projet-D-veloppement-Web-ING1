import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoomCard from "../components/RoomCard"; // Import du composant RoomCard
import "./css/Rooms.css"; // CSS pour la page Rooms
import carte from "../assets/carte.png"; // Image de la carte du campus

function Rooms() {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/rooms")  // Récupère les salles depuis le backend
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error("Erreur rooms :", err));  // Gestion des erreurs
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
            image={`../assets/${room.name}.png`} // Ajoute une image par défaut ou à personnaliser
            name={room.name}
            status={room.status} // Actif ou Inactif
            fill={(room.capacity / 1000) * 100} // Calcul de l'occupation de la salle
            onClick={() => navigate(`/room/${room.id}`)}  // Redirige vers la page de détail de la salle
          />
        ))}
      </div>
    </main>
  );
}

export default Rooms;