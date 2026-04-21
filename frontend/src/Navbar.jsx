
function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        <div className="logo-icon">
            <span className="sc-s">S</span>
            <span className="sc-c">C</span>
        </div>

        <span className="logo-text">
            <span className="logo-smart">Smart</span>{" "}
            <span className="logo-campus">Campus</span>
        </span>
       </div>

      <ul className="nav-links">
        <li>Accueil</li>
        <li>Salles</li>
        <li className="active-link">Actualités</li>
        <li>À propos</li>
        <li>Contact</li>
      </ul>

      <div className="nav-actions">
        <div className="search-box">🔍 Rechercher</div>
        <button className="login-button">Connexion</button>
      </div>
    </nav>
  );
}

export default Navbar;