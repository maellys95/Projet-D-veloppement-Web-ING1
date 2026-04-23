// Affiche les détails d'un objet IoT spécifique
// Permet de consulter les paramètres de l'objet, son statut et éventuellement de le contrôler (si l'utilisateur a les permissions nécessaires).
// Affichage des historiques d'utilisation et de consommation.



import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";  // Pour récupérer l'ID de l'objet depuis l'URL

const DeviceDetail = () => {
  const { id } = useParams();  // Récupère l'ID de l'objet depuis l'URL
  const [device, setDevice] = useState(null);

  useEffect(() => {
    // Simuler la récupération des détails d'un objet en fonction de son ID
    const deviceDetails = { id, name: "Thermostat 1", status: "actif" };  // Remplace avec un appel API
    setDevice(deviceDetails);
  }, [id]);

  // Fonction pour changer l'état de l'objet (actif/inactif)
  const toggleStatus = () => {
    setDevice((prev) => ({
      ...prev,
      status: prev.status === "actif" ? "inactif" : "actif",
    }));
  };

  if (!device) return <p>Chargement...</p>;  // En attendant que les détails de l'objet soient récupérés

  return (
    <div>
      <h1>{device.name}</h1>
      <p>Status : {device.status}</p>
      <button onClick={toggleStatus}>
        {device.status === "actif" ? "Désactiver" : "Activer"}
      </button>  {/* Permet de changer l'état */}
    </div>
  );
};

export default DeviceDetail;