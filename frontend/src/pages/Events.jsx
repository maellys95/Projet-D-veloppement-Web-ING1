import { useState, useEffect } from "react";
import "./css/Events.css";

export default function Events() {
    const [eventsData, setEventsData] = useState([]);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);

    // Récupération des données depuis l'API au montage du composant
    useEffect(() => {
        fetch("http://localhost:5000/events")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données");
                }
                return response.json();
            })
            .then((data) => {
                setEventsData(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Erreur lors du chargement des événements:", error);
                setLoading(false);
            });
    }, []);

    // Gestion de l'affichage limité (3 premiers) ou complet
    const visibleEvents = showAll ? eventsData : eventsData.slice(0, 3);

    if (loading) {
        return (
            <main className="events-page">
                <div className="loading">Chargement des événements...</div>
            </main>
        );
    }

    return (
        <main className="events-page">
            <section className="events-header">
                <h1>Événements</h1>
                <p>
                    Consultez les événements à venir sur le campus, découvrez leurs
                    détails et inscrivez-vous aux activités.
                </p>
            </section>

            <section className="events-grid">
                {visibleEvents.length > 0 ? (
                    visibleEvents.map((event) => (
                        <article className="event-card" key={event.id}>
                            <div className="event-top">
                                <span className="event-category">{event.category}</span>
                                <span className="event-date">
                                    {event.event_date 
                                        ? new Date(event.event_date).toLocaleDateString('fr-FR') 
                                        : "Date non définie"}
                                </span>
                            </div>

                            <h3>{event.title}</h3>
                            <p>{event.description}</p>

                            <div className="event-info">
                                <span>📍 {event.location}</span>
                            </div>

                            <div className="event-actions">
                                <button className="details-btn">Voir les détails</button>
                                
                                {/* On affiche le bouton d'inscription par défaut ou selon un champ de la BDD */}
                                <button className="register-btn">S’inscrire</button>
                            </div>
                        </article>
                    ))
                ) : (
                    <p className="no-events">Aucun événement trouvé en base de données.</p>
                )}
            </section>

            {!showAll && eventsData.length > 3 && (
                <div className="events-more">
                    <button onClick={() => setShowAll(true)}>
                        Voir tous les événements
                    </button>
                </div>
            )}
        </main>
    );
}