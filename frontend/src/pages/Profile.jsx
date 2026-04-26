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
    photo: null,
    newLevel: ''
  });
  const [levelChangeMsg, setLevelChangeMsg] = useState('');

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

        // ── CHANGE LEVEL IF SELECTED ──
        if (editData.newLevel && editData.newLevel !== user.level) {
          console.log('🎯 Changing level from', user.level, 'to', editData.newLevel);
          
          try {
            const levelRes = await fetch('http://localhost:5000/change-level', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, newLevel: editData.newLevel })
            });

            const levelData = await levelRes.json();
            console.log('✅ Level response:', levelRes.status, levelData);

            if (levelRes.ok) {
              setLevelChangeMsg(`✅ Vous avez choisi le niveau : ${editData.newLevel.charAt(0).toUpperCase() + editData.newLevel.slice(1)}!`);
              
              // Attendre et rafraîchir
              setTimeout(() => {
                fetchUserData(user.id);
                setEditMode(false);
                setLevelChangeMsg('');
              }, 1500);
            } else {
              console.error('❌ Level change error:', levelData.message);
              setLevelChangeMsg(`❌ ${levelData.message}`);
            }
          } catch (err) {
            console.error('❌ Error changing level:', err);
            setLevelChangeMsg('❌ Erreur lors du changement de niveau');
          }
        } else {
          console.log('ℹ️ No level change - closing edit mode');
          setEditMode(false);
          fetchUserData(user.id);
        }
      } else {
        console.error('❌ Profile update error:', result.message);
        alert(result.message || 'Erreur lors de la mise à jour.');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      alert('Erreur lors de la mise à jour du profil');
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
        photo: null,
        newLevel: parsedUser.level || ''
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

  // Les niveaux disponibles selon les points
  const getAvailableLevels = () => {
    const levels = ['débutant'];
    if (user.points >= 10) levels.push('intermédiaire');
    if (user.points >= 25) levels.push('avancé');
    if (user.points >= 50) levels.push('expert');
    return levels;
  };

  // Récupérer le niveau atteint de la progression (basé sur points actuels)
  const attainedLevel = progression?.current_level || 'débutant';
  const chosenLevel = user.level;

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
                  objectFit: 'cover',
                  border: '3px solid rgba(96, 165, 250, 0.4)'
                }}
              />
            </div>
            )}

            {/* ── PROGRESSION SECTION ── */}
            {!loading && progression && user && (
              <div className="input-group" style={{ marginTop: '20px' }}>
                <label>📊 Progression & Niveau</label>
                <div style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#cbd5e1' }}>
                  
                  {/* SECTION 1: NIVEAU ATTEINT (basé sur points) */}
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#a0aec0' }}>
                      📍 Niveau atteint (basé sur vos points)
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.8rem' }}>{getLevelEmoji(attainedLevel)}</span>
                      <p style={{ margin: 0, color: getLevelColor(attainedLevel), fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'capitalize' }}>
                        {attainedLevel.charAt(0).toUpperCase() + attainedLevel.slice(1)}
                      </p>
                    </div>
                  </div>

                  {/* SECTION 2: NIVEAU CHOISI */}
                  <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#a0aec0' }}>
                      ✅ Vous avez choisi le niveau
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.8rem' }}>{getLevelEmoji(chosenLevel)}</span>
                      <p style={{ margin: 0, color: getLevelColor(chosenLevel), fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'capitalize' }}>
                        {chosenLevel.charAt(0).toUpperCase() + chosenLevel.slice(1)}
                      </p>
                    </div>
                  </div>

                  {/* SECTION 3: POINTS RESTANTS */}
                  <div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#a0aec0' }}>
                      💪 Vos statistiques
                    </p>
                    <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '10px 12px', borderRadius: '8px' }}>
                      <p style={{ margin: '4px 0', fontSize: '0.95rem' }}>
                        <strong>{parseFloat(user.points).toFixed(2)} pts</strong> cumulés
                      </p>
                      {progression.points_needed > 0 && (
                        <p style={{ margin: '4px 0', fontSize: '0.95rem', color: '#f59e0b' }}>
                          <strong>Il vous reste {parseFloat(progression.points_needed).toFixed(2)} pts</strong> avant de débloquer <strong>{progression.next_level}</strong>
                        </p>
                      )}
                      {progression.points_needed === 0 && (
                        <p style={{ margin: '4px 0', fontSize: '0.95rem', color: '#4ade80' }}>
                          <strong>Vous êtes au niveau maximum! 🎉</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* PROGRESSION BAR */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${progression.progress_percentage}%`, 
                        height: '100%', 
                        background: getLevelColor(chosenLevel),
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                </div>
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

                  {/* ── CHANGE LEVEL IN EDIT MODE ── */}
                  <div className="input-group" style={{ marginTop: '20px' }}>
                    <label>🎯 Mettre à jour votre niveau</label>
                    <select 
                      value={editData.newLevel}
                      onChange={(e) => setEditData({...editData, newLevel: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        color: '#fff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="">Garder le niveau actuel</option>
                      {getAvailableLevels().map(level => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                    {levelChangeMsg && (
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', textAlign: 'center', color: levelChangeMsg.includes('❌') ? '#ef4444' : '#4ade80' }}>
                        {levelChangeMsg}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Section STATS */}
            <div className="user-stats" style={{ display: 'flex', gap: '15px', margin: '25px 0' }}>
              <div className="stat-card" style={{ flex: 1, textAlign: 'center', padding: '15px', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '16px', border: '1px solid rgba(96, 165, 250, 0.2)' }}>
                <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 'bold', color: '#60a5fa' }}>
                  {parseFloat(user.points).toFixed(2)}
                </span>
                <small style={{ color: '#93c5fd', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' }}>Points</small>
              </div>
              
              <div className="stat-card" style={{ flex: 1, textAlign: 'center', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <span style={{ display: 'block', fontSize: '1.6rem', fontWeight: 'bold', color: '#fff' }}>
                  {user.total_actions || 0}
                </span>
                <small style={{ color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', fontSize: '0.75rem' }}>Actions</small>
              </div>
            </div>

            <div className="input-group">
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