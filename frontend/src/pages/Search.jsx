import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./css/Search.css";

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("q") || "";
  const typeFilter = searchParams.get("type") || "";
  const zoneFilter = searchParams.get("zone") || "";

  useEffect(() => {
    if (query || typeFilter || zoneFilter) {
      // Simulation des données de ton schema.sql
      const mockResults = [
        { id: 1, name: "Thermostat Amphi A", type: "capteur", zone: "Bat-A", status: "Actif" },
        { id: 2, name: "Capteur Fumée TP 101", type: "capteur", zone: "Bat-B", status: "Actif" }
      ];
      
      const filtered = mockResults.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.type === typeFilter ||
        item.zone === zoneFilter
      );
      setResults(filtered);
    }
  }, [location.search, query, typeFilter, zoneFilter]);

  return (
    <div className="search-results-page">
      <h1>Résultats pour : "{query}"</h1>
      <div className="results-list">
        {results.length > 0 ? (
          results.map((item) => (
            <div key={item.id} className="result-item-card" onClick={() => navigate(`/device/${item.id}`)}>
              <h3>{item.name}</h3>
              <p>📍 {item.zone} | Type: {item.type}</p>
            </div>
          ))
        ) : (
          <p>Aucun objet trouvé dans la base SQL.</p>
        )}
      </div>
    </div>
  );
};

export default Search;