import { useState, useEffect } from "react";
import "./css/News.css";

// Importation des images depuis assets
import cyberImg from "../assets/news_cyber.png";
import jpoImg from "../assets/news_jpo_cy.png";
import aiImg from "../assets/news_ai_conf.png";
import resultatsImg from "../assets/news_resultats_excep.png";
import airbusImg from "../assets/news_partenariat_airbus.png";
import wifiImg from "../assets/news_wifi.png";

export default function News() {
    const [newsData, setNewsData] = useState([]);
    const [search, setSearch] = useState("");
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);

    // Dictionnaire mis à jour pour mapper les IDs aux nouvelles images
    const imageMap = {
        1: cyberImg,      // Ouverture labo Cyber
        2: jpoImg,        // Journée Portes Ouvertes
        3: resultatsImg,  // Résultats examens
        4: airbusImg,     // Partenariat Airbus
        5: wifiImg,       // Maintenance Wi-Fi
        6: aiImg          // Conférence IA
    };

    useEffect(() => {
        fetch("http://localhost:5000/news")
            .then((response) => {
                if (!response.ok) throw new Error("Erreur réseau");
                return response.json();
            })
            .then((data) => {
                setNewsData(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Erreur lors du chargement des news:", error);
                setLoading(false);
            });
    }, []);

    const filteredNews = newsData.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    const visibleNews = showAll ? filteredNews : filteredNews.slice(0, 3);

    if (loading) return <div className="news-page"><p>Chargement...</p></div>;

    return (
        <main className="news-page">
            <section className="news-header">
                <h1>Actualités</h1>
                <p>Retrouvez les dernières nouvelles et avancées de notre université connectée.</p>
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
                    <article className="news-card" key={item.id}>
                        <img 
                            /* Priorité à l'imageMap locale selon l'ID de la BDD */
                            src={imageMap[item.id] || item.image_url || "https://via.placeholder.com/400x230/1e293b/5aa7ff?text=Smart+Campus"} 
                            alt={item.title} 
                            className="news-image" 
                        />
                        <div className="news-content">
                            <div className="news-top">
                                <span className={`news-category ${item.category.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {item.category}
                                </span>
                                <span className="news-date">
                                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                                </span>
                            </div>
                            <h3>{item.title}</h3>
                            <p>{item.content}</p>
                            <a href={`/news/${item.id}`} className="read-more">Lire la suite</a>
                        </div>
                    </article>
                ))}
            </section>

            {!showAll && filteredNews.length > 3 && (
                <div className="news-action">
                    <button onClick={() => setShowAll(true)}>Voir toutes les actualités</button>
                </div>
            )}
        </main>
    );
}