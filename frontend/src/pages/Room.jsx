import "./css/Room.css";
import carte from "../assets/carte.png";

const rooms = [
  {
    id: 1,
    name: "Amphi A",
    building: "Bâtiment Principal",
    floor: 0,
    capacity: 300,
    description: "Grand amphithéâtre principal",
    status: "Occupée",
    equipments: ["Vidéoprojecteur", "Micro", "Wi-Fi", "PC enseignant"],
  },
  {
    id: 2,
    name: "Amphi B",
    building: "Bâtiment Principal",
    floor: 0,
    capacity: 150,
    description: "Amphithéâtre secondaire",
    status: "Libre",
    equipments: ["Vidéoprojecteur", "Wi-Fi", "Micro"],
  },
  {
    id: 3,
    name: "Salle TP 101",
    building: "Bâtiment Info",
    floor: 1,
    capacity: 30,
    description: "Salle de travaux pratiques informatique",
    status: "Libre",
    equipments: ["PC", "Écran interactif", "Wi-Fi"],
  },
  {
    id: 4,
    name: "Salle TP 102",
    building: "Bâtiment Info",
    floor: 1,
    capacity: 30,
    description: "Salle de travaux pratiques réseau",
    status: "Occupée",
    equipments: ["PC", "Routeurs", "Switchs", "Wi-Fi"],
  },
  {
    id: 5,
    name: "Laboratoire Recherche",
    building: "Bâtiment R&D",
    floor: 2,
    capacity: 20,
    description: "Laboratoire de recherche",
    status: "Maintenance",
    equipments: ["Capteurs IoT", "PC de contrôle", "Imprimante 3D"],
  },
  {
    id: 6,
    name: "Bibliothèque",
    building: "Bâtiment Culture",
    floor: 0,
    capacity: 200,
    description: "Bibliothèque universitaire",
    status: "Libre",
    equipments: ["Wi-Fi", "PC publics", "Imprimante", "Bornes de prêt"],
  },
  
  {
    id: 8,
    name: "Salle Réunion A",
    building: "Bâtiment Admin",
    floor: 1,
    capacity: 15,
    description: "Salle de réunion administrative",
    status: "Libre",
    equipments: ["Écran connecté", "Visioconférence", "Wi-Fi"],
  },
  
];

export default function Room() {
  return (
    <main className="rooms-page">
      <section className="rooms-header">
        <h1>Occupation des Salles</h1>
        <p>
          Visualisez les salles du campus, leur statut et les équipements
          connectés disponibles.
        </p>
      </section>

      <section className="campus-map-section">
        <h2>Carte des salles connectées</h2>
        <div className="map-container">
          <img src={carte} alt="Carte du campus" />
        </div>
      </section>

      <section className="rooms-section">
        <h2>Salles disponibles</h2>

        <div className="rooms-grid">
          {rooms.map((room) => (
            <article className="room-card" key={room.id}>
              <div className="room-top">
                <div>
                  <h3>{room.name}</h3>
                  <p>{room.type}</p>
                </div>

                <span
                  className={`room-status ${
                    room.status === "Libre"
                      ? "free"
                      : room.status === "Occupée"
                      ? "busy"
                      : "maintenance"
                  }`}
                >
                  {room.status}
                </span>
              </div>

              <p className="capacity">Capacité : {room.capacity} places</p>
              <p className="room-description">{room.description}</p>

              <div className="equipments">
                <h4>Équipements</h4>
                <div className="equipment-list">
                  {room.equipments.map((equipment) => (
                    <span key={equipment}>{equipment}</span>
                  ))}
                </div>
              </div>
              
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}