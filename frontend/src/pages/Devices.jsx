// Liste des objets IoT (thermostats, caméras, capteurs, etc.) disponibles dans les salles.
// Filtres pour rechercher des objets par type, état (actif/inactif), et autres critères.
// Les utilisateurs simples peuvent consulter les objets mais pas les modifier.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Devices.css";

function Devices() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/devices")
      .then((res) => res.json())
      .then((data) => setDevices(data))
      .catch((err) => console.error("Erreur chargement devices :", err));
  }, []);

  const categories = [...new Set(devices.map((d) => d.category_name).filter(Boolean))];

  const filteredDevices = devices.filter((device) => {
    const text = `${device.name} ${device.uid} ${device.room_name} ${device.category_name}`.toLowerCase();

    const matchSearch = text.includes(search.toLowerCase());
    const matchStatus = statusFilter === "" || device.status === statusFilter;
    const matchCategory = categoryFilter === "" || device.category_name === categoryFilter;

    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <main className="devices-page">
      <section className="devices-header">
        <h1>Objets connectés</h1>
        <p>Consultez les équipements IoT du campus en temps réel.</p>
      </section>

      <section className="devices-layout">
        <aside className="devices-filters">
          <h2>Filtres</h2>

          <input
            type="text"
            placeholder="Rechercher un objet, une salle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tous les états</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Toutes les catégories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </aside>

        <section className="devices-grid">
          {filteredDevices.map((device) => (
            <article
              key={device.id}
              className="device-card"
              onClick={() => navigate(`/device/${device.id}`)}
            >
              <div className="device-card-top">
                <span className="device-category">{device.category_name}</span>
                <span className={`device-status ${device.status.toLowerCase()}`}>
                  {device.status}
                </span>
              </div>

              <h2>{device.name}</h2>
              <p className="device-uid">{device.uid}</p>
              <p className="device-room">
                Salle : {device.room_name || "Non assignée"}
              </p>
            </article>
          ))}

          {filteredDevices.length === 0 && (
            <p className="no-result">Aucun objet trouvé.</p>
          )}
        </section>
      </section>
    </main>
  );
}

export default Devices;