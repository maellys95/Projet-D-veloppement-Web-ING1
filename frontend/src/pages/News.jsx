import { useState } from "react";
import NewsCard from "../components/NewsCard";
import "./css/News.css";


import news2 from "../assets/news2.jpg";
import news3 from "../assets/news3.jpg";
import news6 from "../assets/news6.webp";

const newsData = [
    {
        id: 1,
        image: news2,
        category: "Recherche",
        categoryClass: "research",
        date: "2026",
        title: "Ouverture du nouveau laboratoire de Cybersécurité",
        description: "Nous sommes ravis d’annoncer l’inauguration du nouveau laboratoire de cybersécurité du campus.",
    },
    {
        id: 2,
        image: news3,
        category: "Campus",
        categoryClass: "campus",
        date: "15 avril 2026",
        title: "Journée Portes Ouvertes 2026",
        description: "Le campus organise sa journée portes ouvertes. Venez découvrir les formations et les espaces connectés.",
    },


    {
        id: 6,
        image: news6,
        category: "Conférence",
        categoryClass: "research",
        date: "2026",
        title: "Conférence IA et Robotique Dr. Marie Curie 2.0",
        description: "Le Pr. Antoine Leblanc donnera une conférence sur l’avenir de l’IA et de la robotique.",
    },
];

export default function News() {
    const [search, setSearch] = useState("");
    const [showAll, setShowAll] = useState(false);

    const filteredNews = newsData.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    const visibleNews = showAll ? filteredNews : filteredNews.slice(0, 3);

    return (
        <main className="news-page">
            <section className="news-header">
                <h1>Actualités</h1>
                <p>
                    Retrouvez les dernières nouvelles, annonces et avancées de notre
                    université connectée.
                </p>

                <input
                    type="text"
                    placeholder="Rechercher une actualité..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setShowAll(true);
                    }}
                    className="news-search"
                />
            </section>

            <section className="news-grid">
                {visibleNews.map((item) => (
                    <NewsCard key={item.id} {...item} />
                ))}
            </section>

            {!showAll && filteredNews.length > 3 && (
                <div className="news-action">
                    <button onClick={() => setShowAll(true)}>
                        Voir toutes les actualités
                    </button>
                </div>
            )}
        </main>
    );
}
