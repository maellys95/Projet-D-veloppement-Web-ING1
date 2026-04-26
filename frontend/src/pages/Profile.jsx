import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Auth.css';

// Importation du background pour l'harmonisation visuelle
import bgLogin from '../assets/background-login.png';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    gender: 'Non précisé',
    birthDate: '',
    age: '',
    photo: null
  });
  const handleEditChange = (e) => {
    const { name, value, files } = e.target;

    // 🔥 si on change la date → recalcul âge
    if (name === 'birthDate') {
      const today = new Date();
      const birth = new Date(value);

      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      setEditData(prev => ({
        ...prev,
        birthDate: value,
        age: age
      }));

      return;
    }

    // 🔥 autres champs (genre + photo)
    setEditData(prev => ({
      ...prev,
      [name]: name === 'photo' ? files[0] : value
    }));
  };

  const handleSaveProfile = async () => {
  const data = new FormData();

  data.append('gender', editData.gender);
  data.append('birth_date', editData.birthDate);
  data.append('age', editData.age);
  data.append('photo_url', user.photo_url || '');

  if (editData.photo) {
    data.append('photo', editData.photo);
  }

  const response = await fetch(`http://localhost:5000/users/${user.id}/profile`, {
    method: 'PUT',
    body: data
  });

  const result = await response.json();

  if (response.ok) {
    const updatedUser = {
      ...user,
      gender: editData.gender,
      birth_date: editData.birthDate,
      age: editData.age,
      photo_url: result.user.photo_url
    };

    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setEditMode(false);
  } else {
    alert(result.message || 'Erreur lors de la mise à jour.');
  }
};

  useEffect(() => {
    // Récupération de l'utilisateur après la connexion
    const savedUser = localStorage.getItem('user');
    
    if (!savedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);

      setEditData({
        gender: parsedUser.gender || 'Non précisé',
        birthDate: parsedUser.birth_date ? parsedUser.birth_date.slice(0, 10) : '',
        age: parsedUser.age || '',
        photo: null
      });
    }
  }, [navigate]);

  if (!user) return <div className="profile-page">Chargement...</div>;

  return (
    <div 
      className="profile-page" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${bgLogin})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px'
      }}
    >
      <div className="profile-wrapper">
        <div className="profile-card" style={{ maxWidth: '600px' }}>
          <h2>Mon Profil <span>SmartCampus</span></h2>
          <p>Gérez vos informations et suivez votre impact écologique.</p>

          <div className="profile-info-display" style={{ textAlign: 'left' }}>
            {user.photo_url && (
            <div className="input-group" style={{ textAlign: 'center', marginTop: '20px' }}>
              <img
                src={`http://localhost:5000${user.photo_url}`}
                alt="Photo de profil"
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(96, 165, 250, 0.4)'
                }}
              />
            </div>
            )}
            {/* Section Informations personnelles */}
            <div className="input-group">
              <label>Identité</label>
              <div className="info-box" style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}>
                <strong style={{ fontSize: '1.1rem' }}>{user.first_name} {user.last_name}</strong> 
                <span style={{ color: '#60a5fa', marginLeft: '10px' }}>({user.member_type})</span>
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Email Universitaire</label>
              <div className="info-box" style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}>
                {user.email}
              </div>
            </div>
            
            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Informations complémentaires</label>

              {!editMode ? (
                <div
                  className="info-box"
                  style={{
                    padding: '14px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1'
                  }}
                >
                  <p>Âge : {user.age || 'Non renseigné'}</p>
                  <p>Genre : {user.gender || 'Non précisé'}</p>
                  <p>
                    Date de naissance : {user.birth_date ? user.birth_date.slice(0, 10) : 'Non renseignée'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="input-group">
                    <label>Genre</label>
                    <select name="gender" value={editData.gender} onChange={handleEditChange}>
                      <option value="Non précisé">Non précisé</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Date de naissance</label>
                    <input
                      type="date"
                      name="birthDate"
                      value={editData.birthDate}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="input-group">
                    <label>Âge</label>
                    <input type="number" value={editData.age || ''} readOnly />
                  </div>

                  <div className="input-group">
                    <label>Photo de profil</label>
                    <input type="file" name="photo" onChange={handleEditChange} />
                  </div>
                </>
              )}
            </div>

            {/* Section TRACKING & POINTS */}
            <div className="user-stats" style={{ display: 'flex', gap: '15px', margin: '25px 0' }}>
              <div className="stat-card" style={{ flex: 1, textAlign: 'center', padding: '15px', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '16px', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 'bold', color: '#60a5fa' }}>
                  {user.points || 0}
                </span>
                <small style={{ color: '#93c5fd', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' }}>Points Eco-Score</small>
              </div>
              
              <div className="stat-card" style={{ flex: 1, textAlign: 'center', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>
                  {user.login_count || 1}
                </span>
                <small style={{ color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' }}>Connexions</small>
              </div>
            </div>

            {/* Historique utilisateur */}
            <div className="input-group">
              <label>Historique des actions (Tracking)</label>
              <div className="info-box" style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.9rem' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', color: '#4ade80' }}>
                    <span style={{ marginRight: '10px' }}>✅</span> Inscription validée
                  </li>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', color: '#4ade80' }}>
                    <span style={{ marginRight: '10px' }}>✅</span> Première connexion au Smart Campus
                  </li>
                  <li style={{ color: '#64748b', fontStyle: 'italic', marginTop: '10px', paddingLeft: '28px' }}>
                    Aucune autre action trackée pour le moment.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions de navigation */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '35px' }}>
            {!editMode ? (
                <button className="btn-login" onClick={() => setEditMode(true)}>
                  Modifier mon profil
                </button>
              ) : (
                <button className="btn-login" onClick={handleSaveProfile}>
                  Enregistrer
                </button>
              )}
            <button className="btn-login" onClick={() => navigate('/rooms')}>
              Accéder aux salles
            </button>
            <button 
              className="btn-login" 
              style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} 
              onClick={() => {
                localStorage.removeItem('user');
                navigate('/login');
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;