import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Home.css';
import campusImg from '../assets/background.png';

const Home = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?q=${query}`);
  };

  return (
    <div className="home-wrapper">
      {/* 1. HERO SECTION */}
      <section id="hero" className="hero-fullscreen">
        <div className="hero-background-img" style={{ backgroundImage: `url(${campusImg})` }}></div>
        <div className="hero-overlay"></div>
        <div className="hero-content reveal">
          <h2>SMART CAMPUS : CY TECH</h2>
          <h3>Protégez votre futur avec notre système de gestion de sécurité et d'évacuation intelligente en temps réel.</h3>
          
          <div className="more-info-container">
            <button className="link-more" onClick={() => document.getElementById('flux').scrollIntoView()}>
              Explorer le campus
            </button>
          </div>
        </div>
      </section>

      {/* 2. SECTION FLUX (SALLES) */}
      <section id="flux" className="section-full">
        <div className="container reveal">
          <div className="section-title">
            <h2>Occupation des Salles</h2>
            <p>Visualisez en temps réel l'état des amphis et salles de TP.</p>
          </div>
          <div className="cards-grid">
            <article className="smart-card">
              <div className="smart-card-icon">🏢</div>
              <h3>Amphi Condorcet</h3>
              <p>Statut : <span className="smart-badge">Occupé</span></p>
              <div className="progress-bar"><div className="fill" style={{width: '85%'}}></div></div>
            </article>

            <article className="smart-card">
              <div className="smart-card-icon">📖</div>
              <h3>Bibliothèque</h3>
              <p>Statut : <span className="smart-badge">Libre</span></p>
              <div className="progress-bar"><div className="fill" style={{width: '15%'}}></div></div>
            </article>
          </div>

          <div className="more-info-container">
            <button className="link-more" onClick={() => navigate('/rooms')}>
              Voir toutes les salles
            </button>
          </div>
        </div>
      </section>

      {/* 3. SECTION ÉQUIPEMENTS INTELLIGENTS (RÉTABLIE) */}
      <section className="section-full bg-accent">
        <div className="container reveal">
          <div className="section-title">
            <h2>Équipements Intelligents</h2>
            <p>La technologie IoT au service de la sécurité.</p>
          </div>

          <form className="search-panel-premium" onSubmit={handleSearch}>
            <div className="search-group">
              <input 
                type="text" 
                placeholder="Rechercher un capteur..." 
                className="search-input"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <select className="search-select">
                <option value="">Tous les types</option>
                <option value="temp">Température</option>
                <option value="camera">Caméra</option>
              </select>
              
              <select className="search-select">
                <option value="">Tous les états</option>
                <option value="online">Connecté</option>
                <option value="offline">Déconnecté</option>
              </select>
            </div>
            <button type="submit" className="search-button">Filtrer</button>
          </form>

          <div className="cards-grid mt-4">
            <article className="smart-card">
              <div className="smart-card-icon">🌡️</div>
              <h3>Capteur Flux H001</h3>
              <span className="smart-badge">Connecté</span>
            </article>
            <article className="smart-card">
              <div className="smart-card-icon">📹</div>
              <h3>Caméra Entrée</h3>
              <span className="smart-badge">Connecté</span>
            </article>
          </div>
          
          <div className="more-info-container">
            <button className="link-more" onClick={() => navigate('/devices')}>
              Voir tous les objets
            </button>
          </div>
        </div>
      </section>

      {/* --- SECTION PRÉVENTION & SÉCURITÉ --- */}
<section id="prevention" className="section-full">
  <div className="container reveal">
    <div className="section-title text-center">
      <h2>Gestes Sécurité & Prévention</h2>
      <p>Protocoles d'évacuation pilotés par nos capteurs IoT.</p>
    </div>

    <div className="cards-grid">
      <article className="smart-card">
        <div className="smart-card-icon">🏃</div>
        <h3>Évacuation Intelligente</h3>
        <p>Nos capteurs orientent la foule vers les sorties les moins encombrées.</p>
      </article>

      <article className="smart-card">
        <div className="smart-card-icon">🚨</div>
        <h3>Alertes & Notifications</h3>
        <p>Toute anomalie détectée déclenche une notification immédiate.</p>
      </article>

      <article className="smart-card">
        <div className="smart-card-icon">🛡️</div>
        <h3>Points de Rassemblement</h3>
        <p>Le système compte automatiquement les personnes présentes.</p>
      </article>
    </div>

    {/* BLOC INTERACTIF FUSIONNÉ : QUIZ & INFOS */}
    <div className="more-info-container mt-5">
      <div className="quiz-integration-box">
        <p>Prêt à tester vos connaissances ?</p>
        <div className="button-group-harmonized">
          <button className="link-more" onClick={() => navigate('/quiz')}>
            Lancer le Quiz
          </button>
          <span className="separator">|</span>
          <button className="link-more" onClick={() => navigate('/prevention')}>
            En savoir plus sur la prévention
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
    </div>
  );
};

export default Home;