import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Members.css';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sortBy, setSortBy] = useState('points');
  const navigate = useNavigate();

  // ── PROTECTION: Vérifier si l'utilisateur est connecté ──
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login'); // Redirect to login if not authenticated
    }
  }, [navigate]);

  useEffect(() => {
    // Récupère tous les membres
    fetch('http://localhost:5000/members')
      .then(res => res.json())
      .then(data => {
        setMembers(data);
        setFilteredMembers(data);
      })
      .catch(err => console.error('Erreur:', err));
  }, []);

  /**
   * Tri des membres
   */
  const sortMembers = (memberList, sortOption) => {
    const sorted = [...memberList];

    switch (sortOption) {
      case 'points':
        // Par points décroissants
        sorted.sort((a, b) => (b.points || 0) - (a.points || 0));
        break;

      case 'points-asc':
        // Par points croissants
        sorted.sort((a, b) => (a.points || 0) - (b.points || 0));
        break;

      case 'name':
        // Par pseudo alphabétique
        sorted.sort((a, b) => (a.pseudo || '').localeCompare(b.pseudo || ''));
        break;

      case 'level':
        // Par niveau (avancé → débutant)
        const levelOrder = { 'expert': 0, 'avancé': 1, 'intermédiaire': 2, 'débutant': 3 };
        sorted.sort((a, b) => 
          (levelOrder[a.experience_level?.toLowerCase()] || 999) - 
          (levelOrder[b.experience_level?.toLowerCase()] || 999)
        );
        break;

      case 'member-type':
        // Par type de membre
        sorted.sort((a, b) => (a.member_type || '').localeCompare(b.member_type || ''));
        break;

      default:
        break;
    }

    return sorted;
  };

  const applyFilters = () => {
    let results = [...members];

    // Recherche texte
    if (search) {
      results = results.filter(m =>
        m.pseudo.toLowerCase().includes(search.toLowerCase()) ||
        m.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.last_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtre type de membre
    if (memberTypeFilter) {
      results = results.filter(m => m.member_type === memberTypeFilter);
    }

    // Filtre niveau
    if (levelFilter) {
      results = results.filter(m => m.experience_level === levelFilter);
    }

    // Appliquer le tri
    results = sortMembers(results, sortBy);

    setFilteredMembers(results);
  };

  // Re-filter quand les paramètres changent
  useEffect(() => {
    applyFilters();
  }, [search, memberTypeFilter, levelFilter, sortBy, members]);

  const reset = () => {
    setSearch('');
    setMemberTypeFilter('');
    setLevelFilter('');
    setSortBy('points');
  };

  // Badges/couleurs par type de membre
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

  // Couleur par niveau
  const getLevelColor = (level) => {
    const levels = {
      'expert': '#ef4444',
      'avancé': '#f97316',
      'intermédiaire': '#f59e0b',
      'débutant': '#3b82f6'
    };
    return levels[level?.toLowerCase()] || '#666';
  };

  return (
    <div className="members-page">
      <section className="members-header">
        <h1>Communauté SmartCampus</h1>
        <p>Découvrez les autres membres et leurs profils</p>
      </section>

      <div className="members-layout">
        {/* ── FILTERS SIDEBAR ── */}
        <aside className="members-filters">
          <h2>Filtres & Tri</h2>

          <div className="filter-item">
            <label>🔍 Recherche</label>
            <input
              type="text"
              placeholder="Pseudo, nom, prénom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-item">
            <label>👥 Type de membre</label>
            <select 
              value={memberTypeFilter}
              onChange={(e) => setMemberTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous</option>
              <option value="Étudiant">Étudiant</option>
              <option value="Enseignant">Enseignant</option>
              <option value="Administratif">Administratif</option>
              <option value="Directeur">Directeur</option>
              <option value="Chercheur">Chercheur</option>
              <option value="Stagiaire">Stagiaire</option>
            </select>
          </div>

          <div className="filter-item">
            <label>📊 Niveau d'expérience</label>
            <select 
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous</option>
              <option value="débutant">Débutant</option>
              <option value="intermédiaire">Intermédiaire</option>
              <option value="avancé">Avancé</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="filter-item">
            <label>↕️ Trier par</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="points">Points (décroissants)</option>
              <option value="points-asc">Points (croissants)</option>
              <option value="name">Pseudo (A-Z)</option>
              <option value="level">Niveau d'expérience</option>
              <option value="member-type">Type de membre</option>
            </select>
          </div>

          <button className="btn-reset-members" onClick={reset}>
            ✕ Réinitialiser filtres
          </button>
        </aside>

        {/* ── MEMBERS GRID ── */}
        <section className="members-results">
          <div className="results-info">
            <h2>Résultats</h2>
            <p>{filteredMembers.length} membre{filteredMembers.length !== 1 ? 's' : ''} trouvé{filteredMembers.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="members-grid">
            {filteredMembers.length > 0 ? (
              filteredMembers.map(member => {
                const memberBadge = getMemberTypeBadge(member.member_type);
                const levelColor = getLevelColor(member.experience_level);

                return (
                  <div 
                    key={member.id}
                    className="member-card"
                    onClick={() => navigate(`/member/${member.id}`)}
                  >
                    {/* Photo */}
                    <div className="member-photo">
                      {member.photo_url ? (
                        <img 
                          src={`http://localhost:5000${member.photo_url}`}
                          alt={member.pseudo}
                          className="photo"
                        />
                      ) : (
                        <div className="photo-placeholder">
                          {member.first_name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>

                    {/* Badge type de membre */}
                    <div 
                      className="member-type-badge"
                      style={{
                        backgroundColor: memberBadge.bg,
                        color: memberBadge.color
                      }}
                    >
                      <span>{memberBadge.icon}</span> {member.member_type}
                    </div>

                    {/* Infos */}
                    <div className="member-info">
                      <h3>{member.pseudo}</h3>
                      <p className="member-name">
                        {member.first_name} {member.last_name}
                      </p>

                      {/* Niveau */}
                      <div className="level-badge" style={{ borderColor: levelColor }}>
                        <span style={{ color: levelColor }}>
                          ★ {member.experience_level || 'débutant'}
                        </span>
                      </div>

                      {/* Points */}
                      <div className="points-display">
                        <span className="points-value">{Math.round(member.points || 0)}</span>
                        <span className="points-label">Pts</span>
                      </div>

                      {/* CTA */}
                      <button className="view-profile-btn">
                        Voir le profil →
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-members" style={{ gridColumn: '1 / -1' }}>
                <p>❌ Aucun membre trouvé</p>
                <p>Essaie d'ajuster tes filtres</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Members;