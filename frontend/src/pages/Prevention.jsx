import React from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Prevention.css';

const Prevention = () => {
  const navigate = useNavigate();

  // Données pour la section sensibilisation
  const ecoGestes = [
    {
      title: "Énergie & Chaleur",
      icon: "🔥",
      tips: [
        "Baissez le chauffage de 1°C, c'est 7% d'économie.",
        "Éteignez les lumières en quittant une salle de TP.",
        "Fermez les fenêtres si le chauffage est allumé."
      ]
    },
    {
      title: "Numérique Responsable",
      icon: "💻",
      tips: [
        "Éteignez vos écrans de PC après vos cours.",
        "Videz votre corbeille mail régulièrement.",
        "Utilisez le mode sombre pour économiser la batterie."
      ]
    },
    {
      title: "Tri & Déchets",
      icon: "♻️",
      tips: [
        "Utilisez les bacs de recyclage près de la cafétéria.",
        "Évitez les bouteilles en plastique : utilisez une gourde.",
        "Signalez toute fuite d'eau aux agents via l'application."
      ]
    }
  ];

  return (
    <div className="prevention-wrapper">
      {/* --- EN-TÊTE --- */}
      <header className="prevention-header">
        <h1>Sensibilisation <span>Éco-Responsable</span></h1>
        <p>Ensemble, agissons sur l'empreinte carbone de CY Tech et préservons notre campus.</p>
      </header>

      {/* --- GRILLE DE CONSEILS (Celle qui n'apparaissait pas) --- */}
      <section className="prevention-grid">
        {ecoGestes.map((category, index) => (
          <div key={index} className="prevention-card">
            <div className="card-icon">{category.icon}</div>
            <h3>{category.title}</h3>
            <ul>
              {category.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
        
      {/* --- BOX IMPACT IOT --- */}
      <section className="iot-impact-box">
        <h3>L'impact du Smart Campus</h3>
        <p>
          Grâce à nos capteurs installés dans les salles, nous avons réduit la consommation 
          électrique du bâtiment de <strong>12%</strong> ce semestre.
        </p>
        <button className="btn-stats" onClick={() => navigate('/rooms')}>
          Voir les données en temps réel
        </button>
      </section>

      {/* --- APPEL À L'ACTION QUIZ --- */}
      <section className="quiz-cta">
        <div className="cta-glass-card">
          <div className="cta-icon">🎓</div>
          <div className="cta-text">
            <h3>Es-tu un expert en éco-responsabilité ?</h3>
            <p>Relève le défi, teste tes connaissances et booste ton score de citoyen du campus !</p>
          </div>
          <button className="btn-launch-quiz" onClick={() => navigate('/quiz')}>
            Lancer le défi
          </button>
        </div>
      </section>
    </div>
  );
};

export default Prevention;