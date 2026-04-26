import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoomCard from "../components/RoomCard";
import { getRoomImage } from "../utils/imageUtils";
import "./css/Rooms.css";

import carte from "../assets/carte.png";

// Images slider
import cytech from "../assets/cy-tech.jpg";
import amphi1 from "../assets/amphi1.png";
import amphi2 from "../assets/amphi2.png";
import amphi3 from "../assets/amphi3.png";
import salle1 from "../assets/salle1.png";
import salleinfo from "../assets/salle_info1.png";
import bibliotheque from "../assets/biblioetheque.jpg";

function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [currentImage, setCurrentImage] = useState(0);

    const navigate = useNavigate();

    // Images du slider
    const roomImages = [
        { image: cytech, title: "Campus CY Tech" },
        { image: amphi1, title: "Amphithéâtre A" },
        { image: amphi2, title: "Amphithéâtre B" },
        { image: amphi3, title: "Salle de conférence" },
        { image: salle1, title: "Salle de cours" },
        { image: salleinfo, title: "Salle informatique" },
        { image: bibliotheque, title: "Bibliothèque" }
    ];

    // Image suivante
    const nextImage = () => {
        setCurrentImage((prev) => (prev + 1) % roomImages.length);
    };

    // Image précédente
    const prevImage = () => {
        setCurrentImage((prev) =>
            prev === 0 ? roomImages.length - 1 : prev - 1
        );
    };

    // Récupération des salles depuis backend
    useEffect(() => {
        fetch("http://localhost:5000/rooms")
            .then((res) => res.json())
            .then((data) => setRooms(data))
            .catch((err) => console.error("Erreur rooms :", err));
    }, []);

    return (
        <>
            {/* Slider en haut */}
            <section className="rooms-gallery-section">
                <div className="gallery-container">
                    <img
                        src={roomImages[currentImage].image}
                        alt={roomImages[currentImage].title}
                        className="gallery-image"
                    />

                    <h3 className="gallery-title">
                        {roomImages[currentImage].title}
                    </h3>

                    <div className="gallery-buttons">
                        <button onClick={prevImage}>❮</button>
                        <button onClick={nextImage}>❯</button>
                    </div>
                </div>
            </section>

            {/* Reste de la page */}
            <main className="rooms-page" align="center">

                {/* Carte du campus */}
                <section className="campus-map-section">
                    <h2>Carte des salles connectées</h2>
                    <div className="map-container">
                        <img src={carte} alt="Carte du campus" />
                    </div>
                </section>

                {/* Liste des salles */}
                <section className="rooms-section">
                    <h2>Salles disponibles</h2>
                </section>

                {/* Grille */}
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
        </>
    );
}

export default Rooms;