import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeviceImage } from '../utils/imageUtils';
import './css/Search.css';

const Search = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('name'); // Nouveau: tri par défaut
  const [devices, setDevices] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [applyFilters, setApplyFilters] = useState(false);
  const navigate = useNavigate();

  // Les catégories extraites de la base
  const categories = ["Caméra", "Éclairage", "Point Accès wifi", "Capteur", "Multimédia", "Thermostat", "Projecteur", "Écran", "Capteur de qualité de l'air", "Compteur d'eau", "Compteur electrique", "Contrôle d'accès"];

  useEffect(() => {
    fetch("http://localhost:5000/devices")
      .then(res => res.json())
      .then(data => {
        setDevices(data);
        setFilteredResults(data);
      })
      .catch(err => console.error("Erreur :", err));
  }, []);

  /**
   * Fonction de tri basée sur le champ sélectionné
   */
  const sortDevices = (deviceList, sortOption) => {
    const sorted = [...deviceList];

    switch (sortOption) {
      case 'name':
        // Tri alphabétique par nom
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;

      case 'status-active':
        // Les appareils actifs en premier
        sorted.sort((a, b) => {
          const aActive = a.status === 'Actif' ? 0 : 1;
          const bActive = b.status === 'Actif' ? 0 : 1;
          return aActive - bActive;
        });
        break;

      case 'status-inactive':
        // Les appareils inactifs en premier
        sorted.sort((a, b) => {
          const aInactive = a.status === 'Inactif' ? 0 : 1;
          const bInactive = b.status === 'Inactif' ? 0 : 1;
          return aInactive - bInactive;
        });
        break;

      case 'battery':
        // Par niveau de batterie (décroissant)
        sorted.sort((a, b) => (b.battery_level || 0) - (a.battery_level || 0));
        break;

      case 'signal':
        // Par force du signal (Fort > Moyen > Faible)
        const signalOrder = { 'Fort': 0, 'Moyen': 1, 'Faible': 2 };
        sorted.sort((a, b) => (signalOrder[a.signal_strength] || 999) - (signalOrder[b.signal_strength] || 999));
        break;

      case 'room':
        // Par salle (alphabétique)
        sorted.sort((a, b) => (a.room_name || 'ZZZ').localeCompare(b.room_name || 'ZZZ'));
        break;

      case 'category':
        // Par catégorie (alphabétique)
        sorted.sort((a, b) => (a.category_name || '').localeCompare(b.category_name || ''));
        break;

      case 'recent':
        // Les plus récemment mis à jour
        sorted.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));
        break;

      default:
        break;
    }

    return sorted;
  };

  const filterAndSort = () => {
    let results = [...devices];

    // Appliquer les filtres
    if (search) {
      results = results.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.uid.toLowerCase().includes(search.toLowerCase()) ||
        (d.room_name && d.room_name.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (statusFilter) {
      results = results.filter(d => d.status === statusFilter);
    }

    if (categoryFilter) {
      results = results.filter(d => d.category_name === categoryFilter);
    }

    // Appliquer le tri
    results = sortDevices(results, sortBy);

    setFilteredResults(results);
    setApplyFilters(true);
  };

  const reset = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setSortBy('name');
    setFilteredResults(sortDevices(devices, 'name'));
    setApplyFilters(false);
  };

  return (
    <div className="search-page">
      <section className="search-header">
        <h1>Recherche & Filtres</h1>
        <p>Trouvez les équipements IoT du campus</p>
      </section>

      <div className="search-layout">
        {/* ── Panneau de filtres (gauche) ── */}
        <aside className="search-filters">
          <h2>Filtres & Tri</h2>

          {/* Recherche texte */}
          <div className="filter-item">
            <label>🔍 Recherche</label>
            <input
              type="text"
              placeholder="Nom, UID, salle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Catégorie */}
          <div className="filter-item">
            <label>📦 Catégorie</label>
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

          {/* Statut */}
          <div className="filter-item">
            <label>⚡ Statut</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Tous</option>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Erreur">Erreur</option>
            </select>
          </div>

          {/* Tri */}
          <div className="filter-item">
            <label>↕️ Trier par</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Nom (A-Z)</option>
              <option value="status-active">Actifs d'abord</option>
              <option value="status-inactive">Inactifs d'abord</option>
              <option value="battery">Batterie (haute ↓)</option>
              <option value="signal">Signal (Fort → Faible)</option>
              <option value="room">Salle (A-Z)</option>
              <option value="category">Catégorie (A-Z)</option>
              <option value="recent">Plus récent</option>
            </select>
          </div>

          {/* Boutons d'action */}
          <button className="btn-apply" onClick={filterAndSort}>
            ✓ Appliquer filtres
          </button>

          {applyFilters && (
            <button className="btn-reset" onClick={reset}>
              ✕ Réinitialiser
            </button>
          )}
        </aside>

        {/* ── Résultats (droite) ── */}
        <section className="search-results">
          <div className="results-header">
            <h2>Résultats</h2>
            <p className="result-count">
              {filteredResults.length} équipement{filteredResults.length !== 1 ? 's' : ''} trouvé{filteredResults.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="results-grid">
            {filteredResults.length > 0 ? (
              filteredResults.map((device) => (
                <article 
                  key={device.id} 
                  className="device-result-card"
                  onClick={() => navigate(`/device/${device.id}`)}
                >
                  <div className="result-card-image-wrapper">
                    <img
                      src={getDeviceImage(device.category_name)}
                      alt={device.name}
                      className="result-card-image"
                    />
                    <span className={`result-card-status ${device.status.toLowerCase()}`}>
                      {device.status}
                    </span>
                  </div>

                  <div className="result-card-content">
                    <h3>{device.name}</h3>
                    <p className="result-card-uid">{device.uid}</p>
                    <p className="result-card-category">
                      📦 {device.category_name}
                    </p>
                    <p className="result-card-room">
                      🏠 {device.room_name || 'Non assignée'}
                    </p>

                    {device.battery_level !== undefined && device.battery_level !== null && (
                      <p className="result-card-battery">
                        🔋 {device.battery_level}%
                      </p>
                    )}

                    {device.signal_strength && (
                      <p className="result-card-signal">
                        📡 Signal: {device.signal_strength}
                      </p>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="no-results">
                <p>❌ Aucun équipement trouvé</p>
                <p className="no-results-hint">Essaie d'ajuster tes filtres</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Search;