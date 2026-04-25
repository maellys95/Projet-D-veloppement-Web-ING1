import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Auth.css';


// Importation du background depuis le dossier assets
import bgLogin from '../assets/background-login.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Connexion au serveur Node (Backend)
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Enregistrement des infos utilisateur et redirection
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (email.endsWith('@cyu.fr')) {
          navigate('/dashboard-admin');
        } else {
          navigate('/profile');
        }
      } else {
        setError(data.message || "Identifiants incorrects.");
      }
    } catch (err) {
      setError("Le serveur ne répond pas. Vérifiez que server.js est lancé.");
    }
  };

  return (
    <div 
      className="login-page" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.8)), url(${bgLogin})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="login-wrapper">
        <div className="login-card">
          <h2>Connexion <span>SmartCampus</span></h2>
          <p>Accédez aux salles et aux données IoT du campus.</p>

          {error && <div className="error-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Universitaire</label>
              <input 
                type="email" 
                placeholder="prenom.nom@etu.cy-tech.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label>Mot de passe</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <button type="submit" className="btn-login">S'identifier</button>
          </form>

          <p className="register-footer">
            Nouveau ? <span onClick={() => navigate('/register')}>Créer un compte</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;