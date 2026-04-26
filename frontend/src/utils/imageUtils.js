// ============================================================
// IMAGE UTILS - Sélection d'images dynamiques par catégorie ET salle
// ============================================================

// Import des images de catégories/devices
import imgTemperature from '../assets/temp.png';
import imgCamera from '../assets/camera.png';
import imgEclairage from '../assets/eclairage.png';
import imgCapteurAir from '../assets/capteur_qualite_air.png';
import imgCompteurElec from '../assets/compteur_electrique.png';
import imgControleAcces from '../assets/controle_acces.png';
import imgWifi from '../assets/point_acces_wifi.png';
import imgProjecteur from '../assets/projecteur.png';

// Import des images de salles
import imgAmphi1 from '../assets/amphi1.png';
import imgAmphi2 from '../assets/amphi2.png';
import imgAmphi3 from '../assets/amphi3.png';
import imgSalleInfo1 from '../assets/salle_info1.png';
import imgSalleInfo2 from '../assets/salle_info2.png';
import imgSalle1 from '../assets/salle1.png';
import imgSalle2 from '../assets/salle2.png';
import imgSalle3 from '../assets/salle3.png';

// Mapping des catégories d'objets connectés
export const DEVICE_CATEGORY_IMAGES = {
  'Thermostat': imgTemperature,
  'Caméra': imgCamera,
  'Éclairage': imgEclairage,
  'Capteur qualité': imgCapteurAir,
  'Capteur Air': imgCapteurAir,
  'Consommation': imgCompteurElec,
  'Compteur': imgCompteurElec,
  'Accès': imgControleAcces,
  'Contrôle Accès': imgControleAcces,
  'Réseau': imgWifi,
  'WiFi': imgWifi,
  'Multimédia': imgProjecteur,
  'Projecteur': imgProjecteur,
};

// Mapping des salles
export const ROOM_IMAGES = {
  'Amphi A': imgAmphi1,
  'Amphi B': imgAmphi2,
  'Amphi C': imgAmphi3,
  'TP 101': imgSalleInfo1,
  'TP 102': imgSalleInfo2,
  'Laboratoire': imgSalle2,
  'Bibliothèque': imgSalle3,
  'Salle Réunion': imgSalle1,
};

/**
 * Retourne l'image d'une salle en fonction de son nom
 * @param {string} roomName - Nom de la salle
 * @returns {string} - Chemin de l'image
 */
export const getRoomImage = (roomName) => {
  if (!roomName) return imgSalle1; // Image par défaut

  const name = roomName.toLowerCase();

  // Recherche par correspondance exacte d'abord
  for (const [key, image] of Object.entries(ROOM_IMAGES)) {
    if (key.toLowerCase() === name) {
      return image;
    }
  }

  // Recherche par inclusion
  if (name.includes('amphi a')) return imgAmphi1;
  if (name.includes('amphi b')) return imgAmphi2;
  if (name.includes('amphi')) return imgAmphi3;
  if (name.includes('tp 101')) return imgSalleInfo1;
  if (name.includes('tp 102')) return imgSalleInfo2;
  if (name.includes('labo')) return imgSalle2;
  if (name.includes('biblio')) return imgSalle3;

  return imgSalle1; // Image par défaut
};

/**
 * Retourne l'image d'un objet en fonction de sa catégorie
 * @param {string} categoryName - Nom de la catégorie
 * @returns {string} - Chemin de l'image
 */
export const getDeviceImage = (categoryName) => {
  if (!categoryName) return imgTemperature; // Image par défaut

  // Recherche par correspondance exacte
  if (DEVICE_CATEGORY_IMAGES[categoryName]) {
    return DEVICE_CATEGORY_IMAGES[categoryName];
  }

  // Recherche par inclusion
  const category = categoryName.toLowerCase();
  if (category.includes('thermo')) return imgTemperature;
  if (category.includes('caméra') || category.includes('camera')) return imgCamera;
  if (category.includes('éclairage') || category.includes('eclairage')) return imgEclairage;
  if (category.includes('capteur') && category.includes('air')) return imgCapteurAir;
  if (category.includes('compteur') || category.includes('consommation')) return imgCompteurElec;
  if (category.includes('accès') || category.includes('access') || category.includes('contrôle')) return imgControleAcces;
  if (category.includes('wifi') || category.includes('réseau') || category.includes('reseau')) return imgWifi;
  if (category.includes('projecteur') || category.includes('multimedia')) return imgProjecteur;

  return imgTemperature; // Image par défaut
};

/**
 * Retourne l'image combinée (salle + objet) ou juste celle de l'objet
 * @param {object} device - Objet device avec {room_name, category_name}
 * @returns {string} - Chemin de l'image
 */
export const getCombinedDeviceImage = (device) => {
  // Priorité à l'image de catégorie (plus visible)
  return getDeviceImage(device.category_name);
};