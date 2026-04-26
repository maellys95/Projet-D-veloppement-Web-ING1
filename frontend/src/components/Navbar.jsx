import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo_navbar_SC.png';
import searchIcon from '../assets/search.png';
import avatarIcon from '../assets/avatar.png';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchMenuOpen, setSearchMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchMenuRef = useRef(null);

  // --- RÉCUPÈRE L'UTILISATEUR ---
let user = null;
try {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    user = JSON.parse(userStr);
  }
} catch (err) {
  console.error('Error parsing user:', err);
  localStorage.removeItem('user');
}
  const getActiveClass = (path) => location.pathname === path ? "active-link" : "";

  // --- FONCTION DE CLIC INTELLIGENTE POUR LE PROFIL ---
  const handleUserClick = () => {
    if (user) {
      navigate('/profile'); // Si connecté -> Page Profil
    } else {
      navigate('/login');   // Si non connecté -> Page Connexion
    }
    setIsOpen(false); 
  };

  // --- GESTION DU MENU DE RECHERCHE ---
  const handleSearchClick = () => {
    setSearchMenuOpen(!searchMenuOpen);
  };

  const handleSearchOption = (type) => {
    setSearchMenuOpen(false);
    if (type === 'members') {
      navigate('/members');
    } else if (type === 'devices') {
      navigate('/search');
    }
  };

  // --- FERME LE MENU SI ON CLIQUE AILLEURS ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchMenuRef.current && !searchMenuRef.current.contains(event.target)) {
        setSearchMenuOpen(false);
      }
    };

    if (searchMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [searchMenuOpen]);

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
            <li><Link to="/events" className={getActiveClass("/events")}>Événements</Link></li>
            <li><Link to="/prevention" className={getActiveClass("/prevention")}>Sensibilisation</Link></li>
          </ul>
        </div>

        {/* --- ZONE DROITE --- */}
        <div className="nav-right">
          {/* --- BOUTON RECHERCHE AVEC MENU --- */}
          <div className="search-menu-wrapper" ref={searchMenuRef}>
            <button 
              className={`icon-button ${searchMenuOpen ? 'active' : ''}`}
              onClick={handleSearchClick}
              title="Rechercher"
            >
              <img src={searchIcon} alt="Recherche" className="nav-icon-img" />
            </button>

            {/* --- MENU DÉROULANT DE RECHERCHE --- */}
            {searchMenuOpen && (
              <div className="search-menu-dropdown">
                <div className="search-menu-header">
                  <p className="search-menu-title">Qu'est-ce que tu cherches?</p>
                </div>

                <button 
                  className="search-menu-option"
                  onClick={() => handleSearchOption('members')}
                >
                  <span className="search-menu-icon">👥</span>
                  <div className="search-menu-option-text">
                    <strong>Chercher un membre</strong>
                    <small>Découvre les autres utilisateurs</small>
                  </div>
                </button>

                <button 
                  className="search-menu-option"
                  onClick={() => handleSearchOption('devices')}
                >
                  <span className="search-menu-icon">🔍</span>
                  <div className="search-menu-option-text">
                    <strong>Chercher salles & objets</strong>
                    <small>Équipements IoT du campus</small>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* --- BOUTON PROFIL --- */}
          <button className="icon-button" onClick={handleUserClick}>
            {user && <span className="nav-user-pseudo">{user.pseudo}</span>}
            {user?.photo_url ? (
              <img
                src={`http://localhost:5000${user.photo_url}`}
                alt="Profil"
                className="nav-profile-photo"
              />
            ) : (
              <img 
                src={avatarIcon} 
                alt="Profil" 
                className={`nav-icon-img ${user ? 'icon-logged' : ''}`} 
              />
            )}
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
          <li><Link to="/devices" onClick={() => setIsOpen(false)}>🔌 Objets connectés</Link></li>
          <li><Link to="/members" onClick={() => setIsOpen(false)}>👥 Communauté</Link></li>
          <li><Link to="/news" onClick={() => setIsOpen(false)}>📰 Actualités</Link></li>
          <li><Link to="/events" onClick={() => setIsOpen(false)}>🎉 Événements</Link></li>
          <li><Link to="/prevention" onClick={() => setIsOpen(false)}>🛡️ Sensibilisation</Link></li>
          
          {/* --- LIEN PROFIL/CO DANS LA SIDEBAR --- */}
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