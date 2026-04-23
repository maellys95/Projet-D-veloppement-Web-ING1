import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo_navbar_SC.png';
import searchIcon from '../assets/search.png';
import avatarIcon from '../assets/avatar.png';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // --- NOUVEAU : ON RÉCUPÈRE L'UTILISATEUR ---
  const user = JSON.parse(localStorage.getItem('user'));

  const getActiveClass = (path) => location.pathname === path ? "active-link" : "";

  // --- NOUVEAU : FONCTION DE CLIC INTELLIGENTE ---
  const handleUserClick = () => {
    if (user) {
      navigate('/profile'); // Si connecté -> Page Profil
    } else {
      navigate('/login');   // Si non connecté -> Page Connexion
    }
    setIsOpen(false); 
  };

  return (
    <>
      <nav className="navbar">
        {/* --- ZONE GAUCHE --- */}
        <div className="nav-left">
          <div className="burger-menu" onClick={() => setIsOpen(!isOpen)}>
            <div className={`bar ${isOpen ? "open" : ""}`}></div>
            <div className={`bar ${isOpen ? "open" : ""}`}></div>
            <div className={`bar ${isOpen ? "open" : ""}`}></div>
          </div>

          <div className="logo desktop-only" onClick={() => navigate('/')}>
            <img src={logo} alt="Smart Campus" className="navbar-logo-img" />
          </div>
        </div>

        {/* --- ZONE CENTRE --- */}
        <div className="nav-center">
          <div className="logo-mobile" onClick={() => navigate('/')}>
            <img src={logo} alt="Smart Campus" className="navbar-logo-img" />
          </div>
          
          <ul className="nav-links desktop-only">
            <li><Link to="/" className={getActiveClass("/")}>Accueil</Link></li>
            <li><Link to="/rooms" className={getActiveClass("/rooms")}>Salles</Link></li>
            <li><Link to="/news" className={getActiveClass("/news")}>Actualités</Link></li>
            <li><Link to="/prevention" className={getActiveClass("/prevention")}>Sensibilisation</Link></li>
          </ul>
        </div>

        {/* --- ZONE DROITE --- */}
        <div className="nav-right">
          <button className="icon-button" onClick={() => navigate('/search')}>
            <img src={searchIcon} alt="Recherche" className="nav-icon-img" />
          </button>

          {/* --- MODIFIÉ : BOUTON AVATAR INTELLIGENT --- */}
          <button className="icon-button" onClick={handleUserClick}>
            {user && <span className="nav-user-pseudo">{user.pseudo}</span>}
            <img 
              src={avatarIcon} 
              alt="Profil" 
              className={`nav-icon-img ${user ? 'icon-logged' : ''}`} 
            />
          </button>
        </div>
      </nav>

      {/* --- SIDEBAR MOBILE --- */}
      <div className={`sidebar-menu ${isOpen ? "active" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Navigation</span>
          <button className="close-sidebar" onClick={() => setIsOpen(false)}>×</button>
        </div>
        
        <ul className="sidebar-links">
          <li><Link to="/" onClick={() => setIsOpen(false)}>🏠 Accueil</Link></li>
          <li><Link to="/rooms" onClick={() => setIsOpen(false)}>🏢 Salles</Link></li>
          <li><Link to="/news" onClick={() => setIsOpen(false)}>📰 Actualités</Link></li>
          <li><Link to="/prevention" onClick={() => setIsOpen(false)}>🛡️ Sensibilisation</Link></li>
          
          {/* --- NOUVEAU : LIEN PROFIL/CO DANS LA SIDEBAR --- */}
          <hr style={{ border: '0.5px solid rgba(255,255,255,0.1)', margin: '10px 0' }} />
          <li>
            <Link to={user ? "/profile" : "/login"} onClick={() => setIsOpen(false)}>
              👤 {user ? "Mon Profil" : "Se connecter"}
            </Link>
          </li>
        </ul>
      </div>
      
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
}

export default Navbar;