import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./css/RoomDetail.css";

function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/rooms/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setRoom(data[0]); // Met à jour la salle
        }
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des données :", err);
      })
      .finally(() => setLoading(false));  // Fin du chargement
  }, [id]);

  if (loading) return <p className="room-detail-loading">Chargement...</p>;

  if (!room) {
    return (
      <main className="room-detail-page">
        <p>La salle n'a pas été trouvée.</p>
        <button onClick={() => navigate("/rooms")}>Retour aux salles</button>
      </main>
    );
  }

  return (
    <main className="room-detail-page">
      <button className="back-button" onClick={() => navigate("/rooms")}>
        ← Retour aux salles
      </button>

      <section className="room-detail-card">
        <div className="room-detail-top">
          <span className="room-status">{room.status || "Statut inconnu"}</span>
        </div>

        <h1>{room.name}</h1>
        <p className="room-description">{room.description}</p>

        <div className="room-info-grid">
          <div>
            <h3>Bâtiment</h3>
            <p>{room.building || "Non renseigné"}</p>
          </div>

          <div>
            <h3>Capacité</h3>
            <p>{room.capacity}</p>
          </div>

          <div>
            <h3>Étage</h3>
            <p>{room.floor || "Non renseigné"}</p>
          </div>

          <div>
            <h3>Identifiant</h3>
            <p>{room.id}</p>
          </div>
        </div>

      </section>
    </main>
  );
}

export default RoomDetail;