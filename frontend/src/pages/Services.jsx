import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Services.css';

const Services = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // ── PROTECTION: Only inscribed users (simple + complexe) ──
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(savedUser);
      console.log('👤 User:', parsedUser.pseudo, '| Level:', parsedUser.user_level);
      setUser(parsedUser);
    }
  }, [navigate]);

  // ── FETCH SERVICES ──
  useEffect(() => {
    fetch('http://localhost:5000/services')
      .then(res => res.json())
      .then(data => {
        console.log('📋 Services fetched:', data);
        setServices(data);
        setFilteredServices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching services:', err);
        setLoading(false);
      });
  }, []);

  // ── FILTER & SEARCH ──
  useEffect(() => {
    let results = [...services];

    // Filtre par catégorie
    if (categoryFilter) {
      results = results.filter(s => s.category === categoryFilter);
    }

    // Recherche par nom/description
    if (searchTerm) {
      results = results.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(results);
  }, [categoryFilter, searchTerm, services]);

  // ── GET UNIQUE CATEGORIES ──
  const categories = [...new Set(services.map(s => s.category))];

  // ── GET EMOJI FOR ICON ──
  const getIconEmoji = (icon) => {
    const iconMap = {
      'calendar': '📅',
      'zap': '⚡',
      'droplets': '💧',
      'lock': '🔒',
      'wind': '💨',
      'wifi': '📡',
      'bell': '🔔',
      'bar-chart-2': '📊',
      'cpu': '💻',
      'settings': '⚙️',
      'home': '🏠',
      'users': '👥',
      'file': '📄'
    };
    return iconMap[icon] || '📌';
  };

  // ── CHECK IF USER IS COMPLEXE (can configure) ──
  const isComplexe = user && user.user_level === 'complexe';

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement des services...</div>;
  }

  return (
    <div className="services-page">
      {/* ── HEADER ── */}
      <section className="services-header">
        <h1>Services SmartCampus 🏢</h1>
        <p>Découvrez tous les services disponibles pour gérer votre campus</p>
        {isComplexe && (
          <p style={{ color: '#4ade80', fontSize: '0.95rem', marginTop: '12px' }}>
            ⚙️ Mode expert activé - Vous pouvez configurer les services
          </p>
        )}
      </section>

      <div className="services-layout">
        {/* ── FILTERS SIDEBAR ── */}
        <aside className="services-filters">
          <h2>Filtres</h2>

          <div className="filter-item">
            <label>🔍 Recherche</label>
            <input
              type="text"
              placeholder="Nom, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-item">
            <label>📂 Catégorie</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Toutes</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button
            className="btn-reset"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
            }}
          >
            ✕ Réinitialiser filtres
          </button>

          {/* ── USER INFO ── */}
          <div className="filter-item" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <label>👤 Votre profil</label>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              <p style={{ margin: '8px 0' }}>
                <strong>{user?.pseudo}</strong>
              </p>
              <p style={{ margin: '4px 0' }}>
                Type: <span style={{ color: isComplexe ? '#4ade80' : '#93c5fd' }}>
                  {isComplexe ? '🔧 Complexe' : '👥 Simple'}
                </span>
              </p>
              <p style={{ margin: '4px 0' }}>
                Niveau: <span style={{ textTransform: 'capitalize', color: '#fbbf24' }}>
                  {user?.level}
                </span>
              </p>
            </div>
          </div>
        </aside>

        {/* ── SERVICES GRID ── */}
        <section className="services-results">
          <div className="results-info">
            <h2>Services disponibles</h2>
            <p>{filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} trouvé{filteredServices.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="services-grid">
            {filteredServices.length > 0 ? (
              filteredServices.map(service => (
                <div key={service.id} className="service-card">
                  {/* Icon */}
                  <div className="service-icon">
                    {getIconEmoji(service.icon)}
                  </div>

                  {/* Contenu */}
                  <div className="service-content">
                    <h3>{service.name}</h3>
                    <p className="service-description">{service.description}</p>

                    {/* Category Badge */}
                    <div className="service-category">
                      📂 {service.category}
                    </div>

                    {/* Buttons */}
                    <div className="service-buttons">
                      <button className="btn-service btn-view">
                        👁️ Consulter
                      </button>

                      {/* Configure button - Only for complexe users */}
                      {isComplexe && (
                        <button className="btn-service btn-configure">
                          ⚙️ Configurer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-services" style={{ gridColumn: '1 / -1' }}>
                <p>❌ Aucun service trouvé</p>
                <p>Essaie d'ajuster tes filtres</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Services;