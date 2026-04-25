import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Auth.css'; 
import bgLogin from '../assets/background-login.png';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '', memberType: 'Étudiant'
  });

  const [errors, setErrors] = useState({});
  const [passChecks, setPassChecks] = useState({ length: false, upper: false, number: false, special: false });
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
  const { name, value } = e.target;
  const newFormData = { ...formData, [name]: value };
  setFormData(newFormData);
  
  // Réinitialiser l'erreur spécifique au champ
  setErrors(prev => ({ ...prev, [name]: '' }));

  // --- Validation de la correspondance Email / Nom-Prénom ---
  if (name === 'email' || name === 'firstName' || name === 'lastName') {
    const emailPart = (name === 'email' ? value : newFormData.email).split('@')[0];
    const fName = (name === 'firstName' ? value : newFormData.firstName).toLowerCase().trim();
    const lName = (name === 'lastName' ? value : newFormData.lastName).toLowerCase().trim();

    if (emailPart && fName && lName) {
      const expectedEmailPart = `${fName}.${lName}`;
      if (emailPart.toLowerCase() !== expectedEmailPart) {
        setErrors(prev => ({ 
          ...prev, 
          email: `L'email doit correspondre à ${expectedEmailPart}@...` 
        }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    }
  }

  // Tes autres validations (regex, etc.) restent ici...
};

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword' && value !== formData.password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Les mots de passe ne correspondent pas.' }));
    }
  };

  useEffect(() => {
    const { password } = formData;
    setPassChecks({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[_#@$!%*?&]/.test(password)
    });
  }, [formData.password]);

  useEffect(() => {
    const email = formData.email.toLowerCase();
    if (email.endsWith('@etu.cyu.fr')) {
      setFormData(prev => ({ ...prev, memberType: 'Étudiant' }));
    } else if (email.endsWith('@cyu.fr')) {
      setFormData(prev => ({ ...prev, memberType: 'Enseignant' }));
    }
  }, [formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (Object.values(errors).some(error => error !== '')) {
      setMessage({ type: 'error', text: 'Veuillez corriger les erreurs avant de continuer.' });
      return;
    }
    const email = formData.email.trim().toLowerCase();

    if (!email.endsWith('@etu.cyu.fr') && !email.endsWith('@cyu.fr')) {
      setMessage({
        type: 'error',
        text: 'Veuillez utiliser votre adresse mail fournie par votre établissement.'
      });
      return;
    }
    
    const cleanFirstName = formData.firstName.trim().charAt(0).toUpperCase() + formData.firstName.trim().slice(1).toLowerCase();
    const cleanLastName = formData.lastName.trim().toUpperCase();

    const payload = {
      first_name: cleanFirstName,
      last_name: cleanLastName,
      email: formData.email.trim().toLowerCase(),
      password: formData.password, 
      member_type: formData.memberType,
      pseudo: (cleanFirstName[0] + cleanLastName).toLowerCase().substring(0, 15),
      is_approved: 0,
      points: 0
    };

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Inscription réussie ! Vérifie ton email pour confirmer ton compte.'});
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de l\'inscription.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Le serveur ne répond pas.' });
    }
  };

  return (
    <div className="register-page" style={{ 
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${bgLogin})`,
      backgroundSize: 'cover', }}>
      <div className="register-card">
        <h2>Inscription <span>SmartCampus</span></h2>
        
        {message.text && (
          <div className={message.type === 'error' ? "error-alert" : "success-alert"}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Prénom</label>
              <input type="text" name="firstName" placeholder="Prénom" onChange={handleChange} required />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Nom</label>
              <input type="text" name="lastName" placeholder="Nom" onChange={handleChange} required />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="input-group">
            <label>Email Universitaire</label>
            <input type="email" name="email" placeholder="prenom.nom@etu.cyu.fr ou prenom.nom@cyu.fr" onChange={handleChange} required />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label>Type de membre</label>
            <select name="memberType" value={formData.memberType} disabled>
              <option value="Étudiant">Étudiant (Détecté)</option>
              <option value="Enseignant">Enseignant (Détecté)</option>
            </select>
          </div>

          <div className="input-group">
            <label>Mot de passe</label>
            <input type="password" name="password" placeholder="••••••••" onChange={handleChange} required />
            <ul className="password-hints">
              <li style={{ color: passChecks.length ? '#4ade80' : '#94a3b8' }}>{passChecks.length ? '✓' : '●'} 8 caractères min</li>
              <li style={{ color: passChecks.upper ? '#4ade80' : '#94a3b8' }}>{passChecks.upper ? '✓' : '●'} Une majuscule</li>
              <li style={{ color: passChecks.number ? '#4ade80' : '#94a3b8' }}>{passChecks.number ? '✓' : '●'} Un chiffre</li>
              <li style={{ color: passChecks.special ? '#4ade80' : '#94a3b8' }}>{passChecks.special ? '✓' : '●'} Un caractère spécial : _ # @ $ ! % * ? &</li>
            </ul>
          </div>

          <div className="input-group">
            <label>Confirmer le mot de passe</label>
            <input type="password" name="confirmPassword" placeholder="••••••••" onChange={handleChange} onBlur={handleBlur} required />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>


<div className="validation-summary">
  {!Object.values(passChecks).every(Boolean) && formData.password.length > 0 && (
    <p className="error-text" style={{ textAlign: 'center', marginBottom: '10px' }}>
      ⚠️ Votre mot de passe n'est pas encore conforme.
    </p>
  )}
  {formData.password !== formData.confirmPassword && formData.confirmPassword.length > 0 && (
    <p className="error-text" style={{ textAlign: 'center', marginBottom: '10px' }}>
      ❌ Les mots de passe ne correspondent pas.
    </p>
  )}
</div>

          <button 
            type="submit" 
            className="btn-register" 
            disabled={!Object.values(passChecks).every(Boolean) || Object.values(errors).some(e => e)}
          >
              Créer mon compte
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;