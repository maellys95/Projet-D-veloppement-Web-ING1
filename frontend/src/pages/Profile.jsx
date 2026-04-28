import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Auth.css';

import bgLogin from '../assets/background-login.png';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [progression, setProgression] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    gender: 'Non précisé',
    birthDate: '',
    age: '',
    photo: null
  });
  const [updateMsg, setUpdateMsg] = useState('');

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;

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

    try {
      const response = await fetch(`http://localhost:5000/users/${user.email}/profile`, {
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
        setUpdateMsg('✅ Profil mis à jour avec succès!');
        
        setTimeout(() => {
          setEditMode(false);
          setUpdateMsg('');
        }, 1500);
      } else {
        setUpdateMsg('❌ Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setUpdateMsg('❌ Erreur lors de la mise à jour du profil');
    }
  };

  // ── FETCH USER DATA AND PROGRESSION
  const fetchUserData = (userId) => {
    fetch(`http://localhost:5000/user-current/${userId}`)
      .then(res => res.json())
      .then(data => {
        console.log('📊 User data fetched:', data);
        setUser(data.user);
        setProgression(data.progression);
        localStorage.setItem('user', JSON.stringify(data.user));
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching user data:', err);
        setLoading(false);
      });
  };

  // ── INITIAL LOAD + INTERVAL FOR REAL-TIME UPDATES
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    
    if (!savedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      fetchUserData(parsedUser.id);

      setEditData({
        gender: parsedUser.gender || 'Non précisé',
        birthDate: parsedUser.birth_date ? parsedUser.birth_date.slice(0, 10) : '',
        age: parsedUser.age || '',
        photo: null
      });

      // ── Rafraîchir les données toutes les 2 secondes
      const interval = setInterval(() => {
        fetchUserData(parsedUser.id);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [navigate]);

  if (!user) return <div className="profile-page">Chargement...</div>;

  // Déterminer la couleur du niveau
  const getLevelColor = (level) => {
    const colors = {
      'débutant': '#3b82f6',
      'intermédiaire': '#f59e0b',
      'avancé': '#f97316',
      'expert': '#ef4444'
    };
    return colors[level?.toLowerCase()] || '#666';
  };

  const getLevelEmoji = (level) => {
    const emojis = {
      'débutant': '🌱',
      'intermédiaire': '📈',
      'avancé': '⭐',
      'expert': '👑'
    };
    return emojis[level?.toLowerCase()] || '📊';
  };

  // ── CALCUL LEVEL BASÉ SUR POINTS ──
  // Débutant: 1-4 pts
  // Intermédiaire: 5-9 pts
  // Avancé: 10-19 pts
  // Expert: 20+ pts
  const getLevelFromPoints = (points) => {
    if (points >= 20) return 'expert';
    if (points >= 10) return 'avancé';
    if (points >= 5) return 'intermédiaire';
    return 'débutant';
  };

  const currentLevel = getLevelFromPoints(user.points);
  const totalActions = progression?.total_actions || 0;

  // ── CALCUL PROGRESSION ──
  const levelThresholds = {
    'débutant': { min: 1, max: 5 },
    'intermédiaire': { min: 5, max: 10 },
    'avancé': { min: 10, max: 20 },
    'expert': { min: 20, max: Infinity }
  };

  const currentThreshold = levelThresholds[currentLevel];
  const nextLevelKey = currentLevel === 'expert' ? 'expert' : 
                       currentLevel === 'avancé' ? 'expert' : 
                       currentLevel === 'intermédiaire' ? 'avancé' : 'intermédiaire';
  
  const nextThreshold = levelThresholds[nextLevelKey];
  const pointsNeeded = Math.max(0, nextThreshold.min - user.points);
  
  // Progression pour la barre (0-100%)
  let progressPercentage = 0;
  if (currentLevel === 'expert') {
    progressPercentage = 100;
  } else {
    progressPercentage = Math.min(100, 
      ((user.points - currentThreshold.min) / (currentThreshold.max - currentThreshold.min)) * 100
    );
  }

  const isMaxLevel = currentLevel === 'expert';

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
          <p>Gérez vos informations et suivez votre progression.</p>

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
                  border: '3px solid rgba(96, 165, 250, 0.4)',
                  objectFit: 'cover'
                }}
              />
            </div>
            )}

            {/* PROGRESSION SECTION */}
            {user.points !== undefined && (
              <div className="input-group" style={{ marginTop: '25px', padding: '20px', background: 'rgba(30, 41, 59, 0.8)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 PROGRESSION & NIVEAU
                  </h3>
                </div>

                <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <p style={{ color: '#cbd5e1', margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                    💎 Niveau actuel (auto-calculé)
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '2rem' }}>
                      {getLevelEmoji(currentLevel)}
                    </span>
                    <span style={{ 
                      fontSize: '1.6rem', 
                      fontWeight: 'bold', 
                      color: getLevelColor(currentLevel),
                      textTransform: 'capitalize'
                    }}>
                      {currentLevel}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <h4 style={{ color: '#cbd5e1', margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: '600' }}>📈 Vos statistiques</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '8px', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
                      <p style={{ color: '#93c5fd', margin: '0', fontSize: '0.85rem', fontWeight: '600' }}>Score</p>
                      <p style={{ color: '#fff', margin: '4px 0 0 0', fontSize: '1.3rem', fontWeight: 'bold' }}>
                        {parseFloat(user.points).toFixed(2)} pts
                      </p>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <p style={{ color: '#94a3b8', margin: '0', fontSize: '0.85rem', fontWeight: '600' }}>Actions</p>
                      <p style={{ color: '#fff', margin: '4px 0 0 0', fontSize: '1.3rem', fontWeight: 'bold' }}>
                        {totalActions} complétées
                      </p>
                    </div>
                  </div>
                </div>

                {/* MAX LEVEL MESSAGE */}
                {isMaxLevel && (
                  <div style={{ 
                    padding: '12px', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: '12px'
                  }}>
                    <p style={{ 
                      color: '#4ade80', 
                      margin: '0', 
                      fontSize: '0.95rem',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      Vous êtes au niveau maximum! 👑
                    </p>
                  </div>
                )}

                {/* PROGRESSION BAR */}
                {!isMaxLevel && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <p style={{ color: '#cbd5e1', margin: '0', fontSize: '0.85rem' }}>
                        Progression vers {nextLevelKey} ({nextThreshold.min} pts)
                      </p>
                      <p style={{ color: '#4ade80', margin: '0', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {Math.round(progressPercentage)}%
                      </p>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${progressPercentage}%`, 
                        height: '100%', 
                        background: `linear-gradient(90deg, ${getLevelColor(currentLevel)}, ${getLevelColor(nextLevelKey)})`,
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                    
                    {pointsNeeded > 0 && (
                      <p style={{ 
                        color: '#94a3b8', 
                        margin: '8px 0 0 0', 
                        fontSize: '0.8rem',
                        textAlign: 'center'
                      }}>
                        +{parseFloat(pointsNeeded).toFixed(2)} pts pour atteindre {nextLevelKey}
                      </p>
                    )}
                  </div>
                )}

              </div>
            )}

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
                    <select name="gender" value={editData.gender} onChange={handleEditChange} style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px'
                    }}>
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
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>

                  <div className="input-group">
                    <label>Âge</label>
                    <input type="number" value={editData.age || ''} readOnly style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      color: '#999',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px'
                    }} />
                  </div>

                  <div className="input-group">
                    <label>Photo de profil</label>
                    <input type="file" name="photo" onChange={handleEditChange} />
                  </div>
                </>
              )}
            </div>

            {updateMsg && (
              <div
                style={{
                  padding: '10px 15px',
                  background: updateMsg.includes('✅') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${updateMsg.includes('✅') ? '#4ade80' : '#ef4444'}`,
                  borderRadius: '8px',
                  color: updateMsg.includes('✅') ? '#4ade80' : '#ef4444',
                  marginBottom: '20px',
                  marginTop: '20px',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}
              >
                {updateMsg}
              </div>
            )}

            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Historique des actions</label>
              <div className="info-box" style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.9rem' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', color: '#4ade80' }}>
                    <span style={{ marginRight: '10px' }}>✅</span> Inscription validée
                  </li>
                  <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', color: '#4ade80' }}>
                    <span style={{ marginRight: '10px' }}>✅</span> Première connexion au Smart Campus
                  </li>
                  <li style={{ color: '#64748b', fontStyle: 'italic', marginTop: '10px', paddingLeft: '28px' }}>
                    Consultez votre progression en temps réel.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '35px', flexWrap: 'wrap' }}>
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