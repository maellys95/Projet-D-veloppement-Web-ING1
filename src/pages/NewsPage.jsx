import Navbar from "../components/Navbar";
import NewsCard from "../components/NewsCard";
import "./NewsPage.css";

import news1 from "../assets/news1.png";
import news2 from "../assets/news2.jpg";
import news3 from "../assets/news3.png";

function NewsPage() {
  return (
    <div className="news-page">
      <Navbar />

      <main className="news-wrapper">
        <section className="news-header">
          <div>
            <h1>Actualités</h1>
            <p>
              Retrouvez toutes les dernières nouvelles, événements et avancées
              de notre université.
            </p>
          </div>

          <div className="top-right-buttons">
            <button className="circle-btn">⚙️</button>
            <button className="lang-btn">FR</button>
          </div>
        </section>

        <section className="news-grid">
          <NewsCard
            image={news1}
            category="Événement"
            categoryClass="event"
            date="28 mai 2026"
            title="Ma thèse en 180 secondes : en route pour la finale !"
            description="Revivez la qualification d’une doctorante pour la finale nationale de cet événement d’éloquence et de vulgarisation scientifique."
          />

          <NewsCard
            image={news2}
            category="Commerce"
            categoryClass="research"
            date="24 mars"
            title="Cergy : Les 3 Fontaines, un lieu d’échange et d’innovation"
            description="À Cergy, un cycle de rencontres et de réflexions autour de l’alimentation et des enjeux sociétaux, réunissant chercheurs, étudiants et visiteurs au cœur des 3 Fontaines"
          />

          <NewsCard
            image={news3}
            category="Santé"
            categoryClass="health"
            date="18 mai 2026"
            title="Traitement innovateur contre la tuberculose : le mécanisme dévoilé"
            description="Ce traitement en cours d’évaluation clinique associe deux molécules et implique plusieurs laboratoires et partenaires industriels."
          />
        </section>

        <div className="bottom-action">
          <button className="all-news-btn">Voir toutes les actualités</button>
        </div>

        <button className="scroll-top">↑</button>
      </main>
    </div>
  );
}

export default NewsPage;