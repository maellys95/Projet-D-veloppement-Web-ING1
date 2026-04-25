import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Auth.css'; 
import bgLogin from '../assets/background-login.png';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    memberType: 'Étudiant'
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.password !== formData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
    }

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Inscription réussie ! Votre compte est en attente d\'approbation.' });
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de l\'inscription.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  };

  return (
    <div 
  className="register-page" 
  style={{ 
    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${bgLogin})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }}
>
      <div className="register-wrapper">
        <div className="register-card">
          <h2>Inscription <span>SmartCampus</span></h2>
          <p>Rejoignez la communauté et accédez aux services connectés.</p>

          {message.text && (
            <div className={message.type === 'error' ? "error-alert" : "success-alert"}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Prénom</label>
                <input 
                  type="text" 
                  name="firstName" 
                  placeholder="Prénom" 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <label>Nom</label>
                <input 
                  type="text" 
                  name="lastName" 
                  placeholder="Nom" 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email Universitaire</label>
              <input 
                type="email" 
                name="email" 
                placeholder="prenom.nom@etu.cyu.fr" 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Type de membre</label>
              <select name="memberType" value={formData.memberType} onChange={handleChange}>
                <option value="Étudiant">Étudiant (@etu.cyu.fr)</option>
                <option value="Enseignant">Enseignant (@cyu.fr)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Mot de passe</label>
              <input 
                type="password" 
                name="password" 
                placeholder="••••••••" 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Confirmation</label>
              <input 
                type="password" 
                name="confirmPassword" 
                placeholder="••••••••" 
                onChange={handleChange} 
                required 
              />
            </div>

            <button type="submit" className="btn-register">Créer mon compte</button>
          </form>

          <p className="login-footer">
            Déjà un compte ? <span onClick={() => navigate('/login')}>Se connecter</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;