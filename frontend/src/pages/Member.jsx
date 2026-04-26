import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/Members.css';

const Member = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── PROTECTION: Vérifier si l'utilisateur est connecté ──
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login'); // Redirect to login if not authenticated
    }
  }, [navigate]);

  useEffect(() => {
    fetch(`http://localhost:5000/members/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Membre non trouvé');
        return res.json();
      })
      .then(data => {
        setMember(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="member-page-loading">Chargement...</div>;
  if (error) return <div className="member-page-error">❌ {error}</div>;
  if (!member) return <div className="member-page-error">Membre non trouvé</div>;

  const getMemberTypeBadge = (memberType) => {
    const badges = {
      'Étudiant': { bg: '#dbeafe', color: '#0c4a6e', icon: '👨‍🎓' },
      'Enseignant': { bg: '#dcfce7', color: '#15803d', icon: '👨‍🏫' },
      'Administratif': { bg: '#fce7f3', color: '#831843', icon: '👔' },
      'Directeur': { bg: '#fed7aa', color: '#7c2d12', icon: '👨‍💼' },
      'Chercheur': { bg: '#e9d5ff', color: '#581c87', icon: '🔬' },
      'Stagiaire': { bg: '#f3e8ff', color: '#6b21a8', icon: '📚' }
    };
    return badges[memberType] || { bg: '#f0f0f0', color: '#333', icon: '👤' };
  };

  const getLevelColor = (level) => {
    const levels = {
      'expert': '#ef4444',
      'avancé': '#f97316',
      'intermédiaire': '#f59e0b',
      'débutant': '#3b82f6'
    };
    return levels[level?.toLowerCase()] || '#666';
  };

  const getLevelStars = (level) => {
    const levels = {
      'expert': '★★★★★',
      'avancé': '★★★★☆',
      'intermédiaire': '★★★☆☆',
      'débutant': '★★☆☆☆'
    };
    return levels[level?.toLowerCase()] || '★☆☆☆☆';
  };

  const memberBadge = getMemberTypeBadge(member.member_type);
  const levelColor = getLevelColor(member.experience_level);

  return (
    <div className="member-page">
      <section className="member-page-header">
        <button className="back-button" onClick={() => navigate('/members')}>
          ← Retour à la communauté
        </button>
      </section>

      <div className="member-page-container">
        <div className="member-page-card">
          {/* ── PHOTO & IDENTITY ── */}
          <div className="member-page-top">
            <div className="member-page-photo-wrapper">
              {member.photo_url ? (
                <img 
                  src={`http://localhost:5000${member.photo_url}`}
                  alt={member.pseudo}
                  className="member-page-photo"
                />
              ) : (
                <div className="member-page-photo-placeholder">
                  {member.first_name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div 
                className="member-page-type-badge"
                style={{
                  backgroundColor: memberBadge.bg,
                  color: memberBadge.color
                }}
              >
                <span>{memberBadge.icon}</span> {member.member_type}
              </div>
            </div>

            <div className="member-page-identity">
              <h1>{member.pseudo}</h1>
              <p className="member-page-fullname">
                {member.first_name} {member.last_name}
              </p>

              <div className="member-page-stats-mini">
                <div className="stat-mini">
                  <strong>{Math.round(member.points || 0)}</strong>
                  <span>Points</span>
                </div>
                <div className="stat-mini">
                  <strong>{member.experience_level || 'débutant'}</strong>
                  <span>Niveau</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── LEVEL & RATING ── */}
          <div className="member-page-level-section">
            <div className="level-display">
              <p className="level-stars" style={{ color: levelColor }}>
                {getLevelStars(member.experience_level)}
              </p>
              <p className="level-text" style={{ color: levelColor }}>
                {member.experience_level || 'Débutant'}
              </p>
            </div>
            <p className="level-description">
              Niveau d'expérience sur la plateforme SmartCampus
            </p>
          </div>

          {/* ── INFOS PERSONNELLES ── */}
          <section className="member-page-section">
            <h2>Informations Personnelles</h2>

            <div className="member-page-info-grid">
              <div className="info-card">
                <label>Pseudo</label>
                <p>{member.pseudo}</p>
              </div>

              <div className="info-card">
                <label>Email</label>
                <p>{member.email}</p>
              </div>

              {member.age && (
                <div className="info-card">
                  <label>Âge</label>
                  <p>{member.age} ans</p>
                </div>
              )}

              {member.gender && member.gender !== 'Non précisé' && (
                <div className="info-card">
                  <label>Genre</label>
                  <p>{member.gender}</p>
                </div>
              )}

              {member.birth_date && (
                <div className="info-card">
                  <label>Date de naissance</label>
                  <p>{new Date(member.birth_date).toLocaleDateString('fr-FR')}</p>
                </div>
              )}

              <div className="info-card">
                <label>Type de membre</label>
                <p>{member.member_type}</p>
              </div>
            </div>
          </section>

          {/* ── STATS & ACHIEVEMENTS ── */}
          <section className="member-page-section">
            <h2>Statistiques & Achievements</h2>

            <div className="member-page-stats-grid">
              <div className="stat-card">
                <span className="stat-icon">⭐</span>
                <div>
                  <strong>{Math.round(member.points || 0)}</strong>
                  <p>Eco-Score Points</p>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">🎖️</span>
                <div>
                  <strong>Actif</strong>
                  <p>Membre vérifié</p>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">📊</span>
                <div>
                  <strong>{member.experience_level || 'Débutant'}</strong>
                  <p>Niveau d'expérience</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── ACTIONS ── */}
          <section className="member-page-actions">
            <button className="btn-members-back" onClick={() => navigate('/members')}>
              ← Retour à la liste
            </button>
            <button className="btn-members-home" onClick={() => navigate('/')}>
              Accueil 🏠
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Member;