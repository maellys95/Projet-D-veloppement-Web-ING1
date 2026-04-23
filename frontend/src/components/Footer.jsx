import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="footer-premium">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Colonne 1 : Logo et Description */}
          <div className="footer-column brand-col">
            <h3 className="footer-logo" onClick={() => navigate('/')}>
              Smart<span>Campus</span>
            </h3>
            <p>L'intelligence IoT au service de la sécurité et de l'optimisation de votre campus universitaire.</p>
          </div>

          {/* Colonne 2 : Navigation Rapide */}
          <div className="footer-column">
            <h4>Navigation</h4>
            <ul>
              <li onClick={() => navigate('/')}>Accueil</li>
              <li onClick={() => navigate('/rooms')}>Flux des Salles</li>
              <li onClick={() => navigate('/actualites')}>Actualités</li>
              <li onClick={() => navigate('/quiz')}>Sensibilisation</li>
            </ul>
          </div>

          {/* Colonne 3 : Contact & Localisation */}
          <div className="footer-column">
            <h4>Contact</h4>
            <p>📧 support@cytech.fr</p>
            <p>📍 Avenue du Parc, Cergy</p>
            <p>🏫 Site du Parc, Cauchy 307</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Smart Campus CY Tech - Tous droits réservés</p>
          <div className="footer-socials">
            {/* Ajoute ici tes icônes si besoin */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;