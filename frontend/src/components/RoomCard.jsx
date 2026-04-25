import React from "react";
import "./RoomCard.css";

const RoomCard = ({ image, name, status, fill, onClick }) => {
  const isOccupied = status === "Occupé";

  return (
    <article className="room-card" onClick={onClick}>
      <div
        className="room-card-bg"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="room-card-overlay" />
      <div className="room-card-body">
        <div className="room-card-top">
          <span
            className={`room-badge ${isOccupied ? "room-badge--occupied" : "room-badge--free"}`}
          >
            <span className="room-badge-dot" />
            {isOccupied ? "Occupé" : "Libre"}
          </span>
        </div>

        <div className="room-card-bottom">
          <h3 className="room-card-name">{name}</h3>
          {fill !== undefined && (
            <>
              <div className="room-progress-bar">
                <div className="room-progress-fill" style={{ width: `${fill}%` }} />
              </div>
              <p className="room-progress-label">{fill}% de capacité utilisée</p>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default RoomCard;