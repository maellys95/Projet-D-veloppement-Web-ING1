import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Auth.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    // 1. Récupérer l'utilisateur stocké dans le navigateur après le Login
    const savedUser = localStorage.getItem('user');
    
    if (!savedUser) {
      // Si personne n'est connecté, on renvoie vers le login
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }

    // 2. Ici, on pourrait faire un fetch pour récupérer les vraies réservations SQL
    // fetch(`http://localhost:5000/api/reservations/${JSON.parse(savedUser).id}`)
    setReservations([
      { id: 1, room: 'Amphi A', date: '2026-04-25', time: '14:00', status: 'Confirmée' }
    ]);
  }, [navigate]);

  if (!user) return <div className="loader">Chargement...</div>;

  return (
    <div className="profile-wrapper">
      <div className="container">
        <div className="profile-grid">
          
          <aside className="profile-sidebar">
            <div className="profile-card-premium">
              <div className="avatar-container">
                <div className="avatar-placeholder">
                  {user.first_name ? user.first_name[0] : 'U'}{user.last_name ? user.last_name[0] : ''}
                </div>
                <span className={`badge-role ${user.member_type?.toLowerCase() || 'étudiant'}`}>
                  {user.member_type || 'Étudiant'}
                </span>
              </div>
              
              <h3>{user.first_name} {user.last_name}</h3>
              <p className="user-email">{user.email}</p>
              
              <div className="user-stats">
                <div className="stat-item">
                  <span className="stat-value">{user.points || 0}</span>
                  <span className="stat-label">Points XP</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{user.level || 'Débutant'}</span>
                  <span className="stat-label">Niveau</span>
                </div>
              </div>

              <button className="btn-edit-profile">Modifier le profil</button>
              <button 
                className="btn-logout" 
                onClick={() => { localStorage.removeItem('user'); navigate('/login'); }}
                style={{marginTop: '10px', background: '#e74c3c', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer'}}
              >
                Déconnexion
              </button>
            </div>

            <div className="progression-box">
              <h4>Objectif : Utilisateur Complexe</h4>
              <div className="progress-bar">
                <div className="fill" style={{ width: `${(user.points / 200) * 100}%` }}></div>
              </div>
              <p>Continuez vos efforts pour débloquer plus d'options IoT !</p>
              <button className="btn-quiz-access" onClick={() => navigate('/quiz')}>Passer un Quiz</button>
            </div>
          </aside>

          <main className="profile-main">
            <section className="activity-section">
              <div className="section-header">
                <h3>Mes Réservations en cours</h3>
                {user.member_type === 'Enseignant' && (
                   <button className="btn-add-res" onClick={() => navigate('/rooms')}>+ Nouvelle</button>
                )}
              </div>

              <div className="reservations-list">
                {reservations.length > 0 ? (
                  reservations.map(res => (
                    <div key={res.id} className="res-item">
                      <div className="res-info">
                        <span className="res-room">{res.room}</span>
                        <span className="res-time">{res.date} à {res.time}</span>
                      </div>
                      <span className={`res-status ${res.status.toLowerCase()}`}>
                        {res.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="empty-msg">Aucune réservation active.</p>
                )}
              </div>
            </section>

            <section className="iot-activity">
              <h3>Historique de Sensibilisation</h3>
              <div className="history-card">
                <p>✅ Bienvenue sur la plateforme Smart Campus !</p>
                {user.points > 0 && <p>✅ Points accumulés grâce à vos actions.</p>}
              </div>
            </section>
          </main>

        </div>
      </div>
    </div>
  );
};

export default Profile;