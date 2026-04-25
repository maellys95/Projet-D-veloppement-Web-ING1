import React from "react";
import "./DeviceCard.css";  // Assurez-vous de créer un fichier CSS adapté si nécessaire

const DeviceCard = ({ image, name, status, onClick }) => {
  const isActive = status === "Actif";
  const statusClass = isActive ? "device-status--active" : "device-status--inactive";

  return (
    <article className="device-card" onClick={onClick}>
      <div className="device-card-bg" style={{ backgroundImage: `url(${image})` }} />
      <div className="device-card-overlay" />
      <div className="device-card-body">
        <div className="device-card-top">
          <span className={`device-status ${statusClass}`}>{status}</span>
        </div>

        <div className="device-card-bottom">
          <h3 className="device-card-name">{name}</h3>
        </div>
      </div>
    </article>
  );
};

export default DeviceCard;