import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Search.css'; 
import RoomCard from '../components/RoomCard';

const Search = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [devices, setDevices] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [applyFilters, setApplyFilters] = useState(false);
  const navigate = useNavigate();

  const categories = ["Caméra", "Éclairage", "Point Accès wifi", "Capteur", "Multimédia", "Thermostat", "Projecteur", "Ecran", "Capteur de qualité de l'air", "Compteur d'eau", "Compteur electrique", "Controle d'accès"];

  useEffect(() => {
    fetch("http://localhost:5000/devices")
      .then(res => res.json())
      .then(data => {
        setDevices(data);
        setFilteredResults(data);
      })
      .catch(err => console.error("Erreur :", err));
  }, []);

 const getImagePath = (category) => {
    const map = {
      "Caméra": "camera.png",
      "Éclairage": "eclairage.png",
      "Point Accès wifi": "point_acces_wifi.png",
      "Capteur": "sensor.png",
      "Multimédia": "multimedia.png",
      "Thermostat": "temp.png",
      "Projecteur": "projecteur.png",
      "Ecran": "ecran.png",
      "Capteur de qualité de l'air": "capteur_qualite_air.png",
      "Compteur d'eau": "compteur_eau.png",
      "Compteur electrique": "compteur_electrique.png",
      "Controle d'accès": "controle_acces.png",
    };
    return `/assets/${map[category] || 'default.png'}`;
  };

  const filterAndSort = () => {
    let results = [...devices];
    if (search) {
      results = results.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (statusFilter) {
      results = results.filter(d => d.status === statusFilter);
    }
    if (categoryFilter) {
      results = results.filter(d => d.category_name === categoryFilter);
    }
    setFilteredResults(results);
    setApplyFilters(true);
  };

  const reset = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setFilteredResults(devices);
    setApplyFilters(false);
  };

  return (
    <div className="search-page">
      <div className="search-filters">
        <h2>Filtres & Tri</h2>
        
        <div className="filter-item">
          <label>Catégorie</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Toutes</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Statut</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
        </div>

        <button className="btn-apply" onClick={filterAndSort}>Appliquer</button>

        {applyFilters && (
          <button className="btn-reset" onClick={reset}>Réinitialiser les filtres</button>
        )}
      </div>

      <div className="search-results">
        <h2>Résultats</h2>
        <p>{filteredResults.length} résultat(s) trouvé(s)</p>
        <div className="results-cards">
          {filteredResults.map((device) => (
            <RoomCard
              key={device.id}
              image={getImagePath(device.category_name)}
              name={device.name}
              status={device.status}
              fill={(device.id * 13) % 100} 
              onClick={() => navigate(`/device/${device.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;