// Formulaire d'inscription avec des champs pour le nom, prénom, email, mot de passe, et type d'utilisateur (étudiant/professeur).
// Envoie une demande au backend pour créer un nouvel utilisateur dans la base de données.
// L'utilisateur doit recevoir un email de validation pour compléter l'inscription (validation via le backend).
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Auth.css'; // Vérifie bien que le fichier est dans frontend/src/pages/css/Auth.css

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
        body: JSON.stringify({
          // On génère un pseudo simple à partir du nom/prénom pour SQL
          pseudo: (formData.firstName + formData.lastName).toLowerCase().replace(/\s/g, ''),
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          member_type: formData.memberType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Inscription réussie ! Redirection...' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage({ type: 'error', text: data.message || "Erreur lors de l'inscription." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Le serveur backend ne répond pas. Vérifiez s'il est lancé." });
    }
  };

  return (
    <div className="register-wrapper"> {/* CHANGE ICI (était auth-container) */}
      <div className="register-card">  {/* CHANGE ICI (était auth-card) */}
        <h2>Inscription <span>SmartCampus</span></h2>
        
        {message.text && (
          <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="input-group">
              <label>Prénom</label>
              <input type="text" name="firstName" onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Nom</label>
              <input type="text" name="lastName" onChange={handleChange} required />
            </div>
          </div>

          <div className="input-group">
            <label>Email Universitaire</label>
            <input type="email" name="email" placeholder="prenom.nom@etu.cy-tech.fr" onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Type de membre</label>
            <select name="memberType" value={formData.memberType} onChange={handleChange}>
              <option value="Étudiant">Étudiant (@etu.cy-tech.fr)</option>
              <option value="Enseignant">Enseignant (@cy-tech.fr)</option>
              <option value="Administratif">Administratif</option>
            </select>
          </div>

          <div className="input-group">
            <label>Mot de passe</label>
            <input type="password" name="password" onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Confirmation</label>
            <input type="password" name="confirmPassword" onChange={handleChange} required />
          </div>

          <button type="submit" className="btn-auth">Créer mon compte</button>
        </form>

        <p className="auth-footer">
          Déjà un compte ? <span onClick={() => navigate('/login')}>Se connecter</span>
        </p>
      </div>
    </div>
  );
};

export default Register;