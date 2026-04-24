// Affiche une liste des événements à venir sur le campus.
// Permet à l'utilisateur de voir les détails d'un événement et de s'y inscrire si nécessaire.

import { useState } from "react";
import "./css/Events.css";

const eventsData = [
    {
        id: 1,
        title: "Hackathon IoT Campus 2026",
        description:
            "Compétition de 48h autour des objets connectés. Les étudiants travaillent en équipe sur des solutions innovantes pour le campus.",
        location: "Amphi A",
        date: "15 avril 2026",
        category: "Innovation",
        registration: true,
    },
    {
        id: 2,
        title: "Journée Portes Ouvertes",
        description:
            "Découverte du campus, des salles connectées et des services numériques proposés aux futurs étudiants.",
        location: "Campus entier",
        date: "20 avril 2026",
        category: "Campus",
        registration: false,
    },
    {
        id: 3,
        title: "Conférence IA & Enseignement",
        description:
            "Conférence sur l’impact de l’intelligence artificielle dans l’éducation et les usages pédagogiques.",
        location: "Amphi A",
        date: "25 avril 2026",
        category: "Conférence",
        registration: true,
    },
    {
        id: 4,
        title: "Atelier Python Débutant",
        description:
            "Atelier d’introduction à Python destiné aux étudiants souhaitant renforcer leurs bases en programmation.",
        location: "Salle TP 101",
        date: "28 avril 2026",
        category: "Atelier",
        registration: true,
    },
    {
        id: 5,
        title: "Forum des Entreprises",
        description:
            "Rencontre entre étudiants et recruteurs. Plus de 50 entreprises seront présentes pour présenter stages et alternances.",
        location: "Hall d’entrée",
        date: "5 mai 2026",
        category: "Professionnel",
        registration: false,
    },
    {
        id: 6,
        title: "Tournoi de Jeux Vidéo",
        description:
            "Tournoi inter-filières autour de jeux vidéo compétitifs, organisé dans un cadre convivial.",
        location: "Bibliothèque",
        date: "10 mai 2026",
        category: "Vie étudiante",
        registration: true,
    },
];

export default function Events() {
    const [showAll, setShowAll] = useState(false);

    const visibleEvents = showAll ? eventsData : eventsData.slice(0, 3);

    return (
        <main className="events-page">
            <section className="events-header">
                <h1>Événements</h1>
                <p>
                    Consultez les événements à venir sur le campus, découvrez leurs
                    détails et inscrivez-vous lorsque l’inscription est disponible.
                </p>
            </section>

            <section className="events-grid">
                {visibleEvents.map((event) => (
                    <article className="event-card" key={event.id}>
                        <div className="event-top">
                            <span className="event-category">{event.category}</span>
                            <span className="event-date">{event.date}</span>
                        </div>

                        <h3>{event.title}</h3>
                        <p>{event.description}</p>

                        <div className="event-info">
                            <span>📍 {event.location}</span>
                        </div>

                        <div className="event-actions">
                            <button className="details-btn">Voir les détails</button>

                            {event.registration && (
                                <button className="register-btn">S’inscrire</button>
                            )}
                        </div>
                    </article>
                ))}
            </section>

            {!showAll && (
                <div className="events-more">
                    <button onClick={() => setShowAll(true)}>
                        Voir tous les événements
                    </button>
                </div>
            )}
        </main>
    );
}