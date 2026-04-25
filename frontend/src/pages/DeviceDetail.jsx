import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./css/DeviceDetail.css";

function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/devices")
      .then((res) => res.json())
      .then((data) => {
        const foundDevice = data.find((item) => String(item.id) === String(id));
        setDevice(foundDevice || null);
      })
      .catch((err) => console.error("Erreur chargement device :", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="device-detail-loading">Chargement...</p>;

  if (!device) {
    return (
      <main className="device-detail-page">
        <p>Objet introuvable.</p>
        <button onClick={() => navigate("/devices")}>Retour aux objets</button>
      </main>
    );
  }

  return (
    <main className="device-detail-page">
      <button className="back-button" onClick={() => navigate("/devices")}>
        ← Retour aux objets
      </button>

      <section className="device-detail-card">
        <div className="device-detail-top">
          <span className="device-category">{device.category_name}</span>
          <span className={`device-status ${device.status.toLowerCase()}`}>
            {device.status}
          </span>
        </div>

        <h1>{device.name}</h1>
        <p className="device-uid">{device.uid}</p>

        <div className="device-info-grid">
          <div>
            <h3>Salle</h3>
            <p>{device.room_name || "Non assignée"}</p>
          </div>

          <div>
            <h3>Catégorie</h3>
            <p>{device.category_name}</p>
          </div>

          <div>
            <h3>État</h3>
            <p>{device.status}</p>
          </div>

          <div>
            <h3>Identifiant</h3>
            <p>{device.uid}</p>
          </div>
        </div>

        <section className="device-actions">
          <h2>Actions disponibles</h2>
          <p>
            Cette zone servira plus tard à modifier l’état de l’objet selon le
            niveau de l’utilisateur.
          </p>

          <button disabled={device.status === "Actif"}>
            Activer
          </button>

          <button disabled={device.status === "Inactif"}>
            Désactiver
          </button>

          <button disabled={device.status === "Maintenance"}>
            Mettre en maintenance
          </button>
        </section>
      </section>
    </main>
  );
}

export default DeviceDetail;