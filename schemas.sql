-- ============================================================
-- SMART CAMPUS IOT PLATFORM — DATABASE SCHEMA
-- Version finale sans administration, avec authentification
-- ============================================================
-- select * from users ; 
-- delete from users where pseudo='prof_test_jean' or pseudo='prof_test_marie' ;
-- $2b$10$XrZK01yiqUNTMUl5CztTkuyk9mdqPIzmrwqTWm3ofrsljyOtuN4Cu Test_123

DROP DATABASE IF EXISTS smart_campus;
-- DROP TABLE IF EXISTS notifications;
-- DROP TABLE IF EXISTS news;
-- DROP TABLE IF EXISTS room_presence_logs;
-- DROP TABLE IF EXISTS room_occupancy;
-- TABLE IF EXISTS room_reservations;
-- DROP TABLE IF EXISTS device_data;
-- DROP TABLE IF EXISTS device_attributes;
-- DROP TABLE IF EXISTS devices;
-- DROP TABLE IF EXISTS services;
-- DROP TABLE IF EXISTS events;
-- DROP TABLE IF EXISTS connection_logs;
-- DROP TABLE IF EXISTS user_actions;
-- DROP TABLE IF EXISTS rooms;
-- DROP TABLE IF EXISTS device_categories;
-- DROP TABLE IF EXISTS users;
-- Crée la base de données smart_campus si elle n'existe pas
CREATE DATABASE IF NOT EXISTS smart_campus
-- Définit l'encodage pour gérer accents, caractères spéciaux, etc.
CHARACTER SET utf8mb4
-- Définit les règles de comparaison du texte
COLLATE utf8mb4_unicode_ci;

-- Sélectionne la base de données à utiliser
USE smart_campus;

-- ============================================================
-- USERS
-- ============================================================

-- Table des utilisateurs de la plateforme
CREATE TABLE users (
  -- Identifiant unique de l'utilisateur
  id                INT AUTO_INCREMENT PRIMARY KEY,

  -- Pseudo unique de l'utilisateur
  pseudo            VARCHAR(50) NOT NULL UNIQUE,

  -- Email unique de l'utilisateur
  email             VARCHAR(100) NOT NULL UNIQUE,

  -- Mot de passe hashé
  password_hash     VARCHAR(255) NOT NULL,

  -- Prénom
  first_name        VARCHAR(50),

  -- Nom
  last_name         VARCHAR(50),

  -- Âge
  age               INT,

  -- Genre
  gender            ENUM('Homme','Femme','Autre','Non précisé') DEFAULT 'Non précisé',

  -- Date de naissance
  birth_date        DATE,

  -- Type d'utilisateur dans l'établissement
  member_type       ENUM('Étudiant','Enseignant','Administratif','Directeur','Chercheur','Stagiaire') DEFAULT 'Étudiant',

  -- Niveau de droits sur la plateforme
  user_level        ENUM('simple','complexe') DEFAULT 'simple',

  -- Lien vers la photo de profil
  photo_url         VARCHAR(255) DEFAULT NULL,

  -- Niveau d'expérience de l'utilisateur
  experience_level  ENUM('débutant','intermédiaire','avancé','expert') DEFAULT 'débutant',
-- Nombre de points accumulés
points            DECIMAL(10,2) DEFAULT 0.00,

-- Indique si l'utilisateur a confirmé son email
is_verified       TINYINT(1) DEFAULT 0,

-- Token utilisé pour confirmer l'email
verify_token      VARCHAR(255) DEFAULT NULL,

-- Date d'expiration du token de confirmation
verify_token_expires DATETIME DEFAULT NULL,

-- Indique si l'utilisateur est autorisé à utiliser la plateforme
is_approved       TINYINT(1) DEFAULT 1,

-- Token utilisé pour réinitialiser le mot de passe
reset_token       VARCHAR(255) DEFAULT NULL,

-- Date d'expiration du token de réinitialisation
reset_token_expires DATETIME DEFAULT NULL,

-- Date de création du compte
created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 

  -- Date de dernière mise à jour du compte
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- MIGRATION: Add chosen_level column to users table
-- ============================================================

-- Ajoute une colonne pour le niveau choisi par l'utilisateur
ALTER TABLE users ADD COLUMN chosen_level ENUM('débutant','intermédiaire','avancé','expert') DEFAULT 'débutant' AFTER experience_level;

-- Met à jour chosen_level avec la valeur actuelle d'experience_level pour tous les utilisateurs existants
UPDATE users SET chosen_level = experience_level WHERE chosen_level IS NULL OR chosen_level = 'débutant';

-- Vérifie que la migration s'est bien passée
SELECT id, pseudo, experience_level, chosen_level, points FROM users;

-- ============================================================
-- CONNECTION LOGS
-- ============================================================

-- Table qui stocke les connexions des utilisateurs
CREATE TABLE connection_logs (
  -- Identifiant unique de la connexion
  id          INT AUTO_INCREMENT PRIMARY KEY,

  -- Référence vers l'utilisateur connecté
  user_id     INT NOT NULL,

  -- Date et heure de connexion
  logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Adresse IP utilisée lors de la connexion
  ip_address  VARCHAR(45),

  -- Clé étrangère vers la table users
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- USER ACTIONS
-- ============================================================

-- Table qui stocke les actions faites par les utilisateurs
CREATE TABLE user_actions (
  -- Identifiant unique de l'action
  id             INT AUTO_INCREMENT PRIMARY KEY,

  -- Référence vers l'utilisateur ayant fait l'action
  user_id        INT NOT NULL,

  -- Type d'action effectuée
  action_type    VARCHAR(100) NOT NULL,

  -- Description détaillée de l'action
  description    TEXT,

  -- Nombre de points gagnés grâce à l'action
  points_earned  DECIMAL(5,2) DEFAULT 0.00,

  -- Date et heure de l'action
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Clé étrangère vers users
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- DEVICE CATEGORIES
-- ============================================================

-- Table des catégories d'objets connectés
CREATE TABLE device_categories (
  -- Identifiant unique de la catégorie
  id           INT AUTO_INCREMENT PRIMARY KEY,

  -- Nom de la catégorie
  name         VARCHAR(100) NOT NULL,

  -- Description de la catégorie
  description  TEXT,

  -- Icône associée à la catégorie
  icon         VARCHAR(50) DEFAULT 'cpu'
);

-- ============================================================
-- ROOMS
-- ============================================================

-- Table des salles du campus
CREATE TABLE rooms (
  -- Identifiant unique de la salle
  id           INT AUTO_INCREMENT PRIMARY KEY,

  -- Nom de la salle
  name         VARCHAR(100) NOT NULL,

  -- Bâtiment dans lequel se trouve la salle
  building     VARCHAR(100),

  -- Étage de la salle
  floor        INT DEFAULT 0,

  -- Capacité maximale de la salle
  capacity     INT DEFAULT 0,

  -- Description de la salle
  description  TEXT
);

-- ============================================================
-- DEVICES
-- ============================================================

-- Table des objets connectés
CREATE TABLE devices (
  -- Identifiant unique interne
  id                INT AUTO_INCREMENT PRIMARY KEY,

  -- Identifiant unique métier de l'objet
  uid               VARCHAR(50) NOT NULL UNIQUE,

  -- Nom de l'objet
  name              VARCHAR(100) NOT NULL,

  -- Description de l'objet
  description       TEXT,

  -- Catégorie de l'objet
  category_id       INT,

  -- Salle dans laquelle l'objet est installé
  room_id           INT,

  -- Marque de l'objet
  brand             VARCHAR(100),

  -- Modèle de l'objet
  model             VARCHAR(100),

  -- État actuel de l'objet
  status            ENUM('Actif','Inactif','Maintenance','Erreur') DEFAULT 'Actif',

  -- Type de connectivité
  connectivity      ENUM('Wi-Fi','Bluetooth','Zigbee','Z-Wave','Ethernet','LoRa') DEFAULT 'Wi-Fi',

  -- Force du signal
  signal_strength   ENUM('Faible','Moyen','Fort') DEFAULT 'Fort',

  -- Niveau de batterie
  battery_level     INT DEFAULT 100,

  -- Version du firmware
  firmware_version  VARCHAR(20) DEFAULT '1.0.0',

  -- Adresse IP de l'objet
  ip_address        VARCHAR(45),

  -- Dernière fois où l'objet a été vu
  last_seen         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Date d'ajout de l'objet
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Date de dernière mise à jour
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Clé étrangère vers les catégories
  FOREIGN KEY (category_id) REFERENCES device_categories(id) ON DELETE SET NULL,

  -- Clé étrangère vers les salles
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- ============================================================
-- DEVICE ATTRIBUTES
-- ============================================================

-- Table des attributs instantanés d'un objet connecté
CREATE TABLE device_attributes (
  -- Identifiant unique de l'attribut
  id          INT AUTO_INCREMENT PRIMARY KEY,

  -- Référence vers l'objet
  device_id   INT NOT NULL,

  -- Nom de l'attribut
  attr_key    VARCHAR(100) NOT NULL,

  -- Valeur de l'attribut
  attr_value  VARCHAR(255),

  -- Unité associée
  unit        VARCHAR(20),

  -- Date de dernière mise à jour
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Clé étrangère vers devices
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- ============================================================
-- DEVICE DATA HISTORY
-- ============================================================

-- Table de l'historique des mesures des objets connectés
CREATE TABLE device_data (
  -- Identifiant unique de la mesure
  id           INT AUTO_INCREMENT PRIMARY KEY,

  -- Référence vers l'objet
  device_id    INT NOT NULL,

  -- Nom de la donnée mesurée
  attr_key     VARCHAR(100) NOT NULL,

  -- Valeur mesurée
  value        VARCHAR(255),

  -- Date d'enregistrement de la mesure
  recorded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Clé étrangère vers devices
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- ============================================================
-- ROOM RESERVATIONS
-- ============================================================

-- Table des réservations de salles
CREATE TABLE room_reservations (
  -- Identifiant unique de la réservation
  id                INT AUTO_INCREMENT PRIMARY KEY,

  -- Salle réservée
  room_id           INT NOT NULL,

  -- Utilisateur ayant réservé
  user_id           INT NOT NULL,

  -- Type de réservation
  reservation_type  ENUM('cours','reunion','personnel') DEFAULT 'personnel',

  -- Titre de la réservation
  title             VARCHAR(255) NOT NULL,

  -- Description complémentaire
  description       TEXT,

  -- Début de la réservation
  start_time        DATETIME NOT NULL,

  -- Fin de la réservation
  end_time          DATETIME NOT NULL,

  -- Statut de la réservation
  status            ENUM('active','annulee','terminee') DEFAULT 'active',

  -- Date de création
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Clé étrangère vers rooms
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,

  -- Clé étrangère vers users
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- ROOM OCCUPANCY
-- ============================================================

-- Table de l'occupation actuelle des salles
CREATE TABLE room_occupancy (
  -- Identifiant unique
  id             INT AUTO_INCREMENT PRIMARY KEY,

  -- Salle concernée
  room_id        INT NOT NULL UNIQUE,

  -- Capteur ou objet lié à cette occupation
  device_id      INT,

  -- Nombre actuel de personnes dans la salle
  current_count  INT DEFAULT 0,

  -- Indique si la salle est occupée ou non
  is_occupied    TINYINT(1) DEFAULT 0,

  -- Type d'occupation détecté
  occupancy_type ENUM('cours','reunion','libre','inconnu') DEFAULT 'inconnu',

  -- Dernière mise à jour
  last_update    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Clé étrangère vers rooms
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,

  -- Clé étrangère vers devices
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
);

-- ============================================================
-- ROOM PRESENCE LOGS
-- ============================================================

-- Table de journalisation de présence dans les salles
CREATE TABLE room_presence_logs (
  -- Identifiant unique du log
  id                     INT AUTO_INCREMENT PRIMARY KEY,

  -- Salle concernée
  room_id                INT NOT NULL,

  -- Utilisateur détecté
  user_id                INT NULL,

  -- Appareil ayant détecté la présence
  detected_by_device_id  INT NULL,

  -- Date et heure de détection
  detected_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Clé étrangère vers rooms
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,

  -- Clé étrangère vers users
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

  -- Clé étrangère vers devices
  FOREIGN KEY (detected_by_device_id) REFERENCES devices(id) ON DELETE SET NULL
);

-- ============================================================
-- NEWS
-- ============================================================

-- Table des actualités affichées sur la plateforme
CREATE TABLE news (
  -- Identifiant unique de l'actualité
  id          INT AUTO_INCREMENT PRIMARY KEY,

  -- Titre de l'actualité
  title       VARCHAR(255) NOT NULL,

  -- Contenu de l'actualité
  content     TEXT NOT NULL,

  -- Catégorie de l'actualité
  category    VARCHAR(100),

  -- Image associée
  image_url   VARCHAR(255),

  -- Auteur de l'actualité
  author_id   INT,

  -- Indique si l'actualité est publiée
  published   TINYINT(1) DEFAULT 1,

  -- Date de création
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Clé étrangère vers users
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- EVENTS
-- ============================================================

-- Table des événements du campus
CREATE TABLE events (
  -- Identifiant unique de l'événement
  id           INT AUTO_INCREMENT PRIMARY KEY,

  -- Titre de l'événement
  title        VARCHAR(255) NOT NULL,

  -- Description de l'événement
  description  TEXT,

  -- Lieu de l'événement
  location     VARCHAR(255),

  -- Date de l'événement
  event_date   DATETIME,

  -- Catégorie de l'événement
  category     VARCHAR(100),

  -- Date de création
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SERVICES
-- ============================================================

-- Table des services proposés par la plateforme
CREATE TABLE services (
  -- Identifiant unique du service
  id           INT AUTO_INCREMENT PRIMARY KEY,

  -- Nom du service
  name         VARCHAR(100) NOT NULL,

  -- Description du service
  description  TEXT,

  -- Catégorie du service
  category     VARCHAR(100),

  -- Icône associée
  icon         VARCHAR(50) DEFAULT 'settings',

  -- Indique si le service est actif
  is_active    TINYINT(1) DEFAULT 1,

  -- Date de création
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Table des notifications des utilisateurs
CREATE TABLE notifications (
  -- Identifiant unique de la notification
  id          INT AUTO_INCREMENT PRIMARY KEY,

  -- Utilisateur concerné
  user_id     INT NOT NULL,

  -- Message de la notification
  message     TEXT NOT NULL,

  -- Indique si la notification a été lue
  is_read     TINYINT(1) DEFAULT 0,

  -- Date de création
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Clé étrangère vers users
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Index pour accélérer la recherche des appareils par salle
CREATE INDEX idx_devices_room_id ON devices(room_id);

-- Index pour accélérer la recherche des appareils par catégorie
CREATE INDEX idx_devices_category_id ON devices(category_id);

-- Index pour accélérer la recherche des attributs par appareil
CREATE INDEX idx_device_attributes_device_id ON device_attributes(device_id);

-- Index pour accélérer la recherche de l'historique par appareil
CREATE INDEX idx_device_data_device_id ON device_data(device_id);

-- Index pour accélérer la recherche des connexions par utilisateur
CREATE INDEX idx_connection_logs_user_id ON connection_logs(user_id);

-- Index pour accélérer la recherche des actions par utilisateur
CREATE INDEX idx_user_actions_user_id ON user_actions(user_id);

-- Index pour accélérer la recherche des réservations par salle
CREATE INDEX idx_reservations_room_id ON room_reservations(room_id);

-- Index pour accélérer la recherche des réservations par utilisateur
CREATE INDEX idx_reservations_user_id ON room_reservations(user_id);

-- Index pour accélérer la recherche des présences par salle
CREATE INDEX idx_presence_room_id ON room_presence_logs(room_id);

-- Index pour accélérer la recherche des présences par utilisateur
CREATE INDEX idx_presence_user_id ON room_presence_logs(user_id);

-- Index pour accélérer la recherche des notifications par utilisateur
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ============================================================
-- SEED DATA
-- ============================================================
-- ============================================================
-- INSERT COMPLETE USERS WITH TEST PROFESSORS
-- ============================================================

INSERT INTO users 
(pseudo, email, password_hash, first_name, last_name, age, gender, birth_date, member_type, user_level, photo_url, experience_level, chosen_level, points, is_verified, is_approved) 
VALUES 
-- ÉTUDIANTS (Niveau Simple)
('alice_m', 'alice.martin@etu.cyu.fr', '$2a$10$rY3O.8G1/YvT2Z.E1B.oUeXpW9vR', 'Alice', 'Martin', 20, 'Femme', '2005-03-14', 'Étudiant', 'simple', '/uploads/pp_oiseau.png', 'débutant', 'débutant', 2.00, 1, 1),
('yasmine_b', 'yasmine.benali@etu.cyu.fr', '$2a$10$rY3O.8G1/YvT2Z.E1B.oUeXpW9vR', 'Yasmine', 'Benali', 21, 'Femme', '2004-08-09', 'Étudiant', 'simple', '/uploads/pp_lavande.png', 'intermédiaire', 'intermédiaire', 4.50, 1, 1),
('samir_a', 'samir.ait@etu.cyu.fr', '$2a$10$rY3O.8G1/YvT2Z.E1B.oUeXpW9vR', 'Samir', 'Ait', 22, 'Homme', '2003-11-02', 'Étudiant', 'simple', '/uploads/pp_chat.png', 'débutant', 'débutant', 1.50, 1, 1),

-- ENSEIGNANTS (Niveau Complexe / Expert) - Existing
('pauldurand', 'paul.durand@cyu.fr', '$2a$10$rY3O.8G1/YvT2Z.E1B.oUeXpW9vR', 'Paul', 'Durand', 42, 'Homme', '1983-01-20', 'Enseignant', 'complexe', NULL, 'avancé', 'avancé', 8.00, 1, 1),
('nadialeroy', 'nadia.leroy@cyu.fr', '$2a$10$rY3O.8G1/YvT2Z.E1B.oUeXpW9vR', 'Nadia', 'Leroy', 35, 'Femme', '1990-06-12', 'Enseignant', 'complexe', NULL, 'expert', 'expert', 15.75, 1, 1),

-- TEST PROFESSORS (NEW) - Pour tester
-- $2b$10$XrZK01yiqUNTMUl5CztTkuyk9mdqPIzmrwqTWm3ofrsljyOtuN4Cu Test_123
('prof_test_jean', 'jean.test@cyu.fr', '$2b$10$XrZK01yiqUNTMUl5CztTkuyk9mdqPIzmrwqTWm3ofrsljyOtuN4Cu', 'Jean', 'Test', 45, 'Homme', '1980-05-15', 'Enseignant', 'complexe', '/uploads/pp_lavande.png', 'débutant', 'débutant', 10.00, 1, 1),
('prof_test_marie', 'marie.test@cyu.fr', '$2b$10$XrZK01yiqUNTMUl5CztTkuyk9mdqPIzmrwqTWm3ofrsljyOtuN4Cu', 'Marie', 'Test', 38, 'Femme', '1987-08-22', 'Enseignant', 'complexe', '/uploads/pp_oiseau.png', 'débutant', 'débutant', 10.00, 1, 1);

-- ============================================================
-- VERIFY INSERTION
-- ============================================================

SELECT id, pseudo, email, member_type, experience_level, chosen_level, points 
FROM users 
ORDER BY id;

-- ============================================================
-- PASSWORD REMINDER
-- ============================================================
-- All users use password: test123 (hashed with bcrypt)
-- Hash: $2a$10$rY3O.8G1/YvT2Z.E1B.oUeXpW9vR

-- Test Professors can login with:
-- Email: jean.test@cyu.fr
-- Password: Test_123

-- Email: marie.test@cyu.fr
-- Password: Test_123
-- Données de test pour les catégories d'appareils
INSERT INTO device_categories (name, description, icon) VALUES
('Thermostat', 'Régulation de la température', 'thermometer'),
('Caméra', 'Surveillance et sécurité', 'camera'),
('Éclairage', 'Gestion intelligente de la lumière', 'lightbulb'),
('Capteur qualité', 'Qualité de l’air et environnement', 'wind'),
('Consommation', 'Compteurs énergie et eau', 'zap'),
('Accès', 'Contrôle d’accès et serrures', 'lock'),
('Réseau', 'Points d’accès Wi-Fi et réseau', 'wifi'),
('Multimédia', 'Projecteurs et écrans interactifs', 'monitor'),
('Présence', 'Capteurs de présence et comptage', 'users');

-- Données de test pour les salles
INSERT INTO rooms (name, building, floor, capacity, description) VALUES
('Amphi A', 'Bâtiment Principal', 0, 300, 'Grand amphithéâtre principal'),
('Amphi B', 'Bâtiment Principal', 0, 150, 'Amphithéâtre secondaire'),
('Salle TP 101', 'Bâtiment Info', 1, 30, 'Salle de travaux pratiques informatique'),
('Salle TP 102', 'Bâtiment Info', 1, 30, 'Salle de travaux pratiques réseau'),
('Laboratoire Recherche', 'Bâtiment R&D', 2, 20, 'Laboratoire de recherche'),
('Bibliothèque', 'Bâtiment Culture', 0, 200, 'Bibliothèque universitaire'),
('Cafétéria', 'Bâtiment Social', 0, 150, 'Restaurant universitaire'),
('Salle Réunion A', 'Bâtiment Admin', 1, 15, 'Salle de réunion administrative'),
('Hall d''entrée', 'Bâtiment Principal', 0, 500, 'Hall principal d’accueil'),
('Parking', 'Extérieur', 0, 1000, 'Parking principal du campus');

-- Données de test pour les appareils connectés
INSERT INTO devices
(uid, name, description, category_id, room_id, brand, model, status, connectivity, signal_strength, battery_level, ip_address)
VALUES
('THERM-A001', 'Thermostat Amphi A', 'Contrôle température Amphi A', 1, 1, 'Nest', 'Learning 3', 'Actif', 'Wi-Fi', 'Fort', NULL, '192.168.1.10'),
('THERM-B001', 'Thermostat Amphi B', 'Contrôle température Amphi B', 1, 2, 'Nest', 'Learning 3', 'Actif', 'Wi-Fi', 'Fort', NULL, '192.168.1.11'),
('THERM-TP101', 'Thermostat TP 101', 'Contrôle température salle TP', 1, 3, 'Honeywell', 'T6 Pro', 'Actif', 'Wi-Fi', 'Moyen', NULL, '192.168.1.12'),
('CAM-H001', 'Caméra Hall Entrée', 'Surveillance entrée principale', 2, 9, 'Axis', 'P3245-V', 'Actif', 'Ethernet', 'Fort', NULL, '192.168.2.10'),
('CAM-PARK01', 'Caméra Parking', 'Surveillance parking extérieur', 2, 10, 'Axis', 'P1448-LE', 'Actif', 'Ethernet', 'Fort', NULL, '192.168.2.11'),
('CAM-TP101', 'Caméra TP 101', 'Surveillance salle TP', 2, 3, 'Hikvision', 'DS-2CD2143', 'Inactif', 'Wi-Fi', 'Faible', NULL, '192.168.2.12'),
('LIGHT-A001', 'Éclairage Amphi A', 'Système éclairage intelligent', 3, 1, 'Philips', 'Hue Pro', 'Actif', 'Zigbee', 'Fort', NULL, NULL),
('LIGHT-B001', 'Éclairage Amphi B', 'Système éclairage intelligent', 3, 2, 'Philips', 'Hue Pro', 'Actif', 'Zigbee', 'Fort', NULL, NULL),
('LIGHT-BIB', 'Éclairage Bibliothèque', 'Éclairage adaptatif bibliothèque', 3, 6, 'Philips', 'Hue White', 'Actif', 'Zigbee', 'Moyen', NULL, NULL),
('AIR-TP101', 'Capteur Air TP 101', 'Qualité air CO2/température', 4, 3, 'Netatmo', 'Healthy Home', 'Actif', 'Wi-Fi', 'Fort', 78, '192.168.3.10'),
('AIR-LAB', 'Capteur Air Laboratoire', 'Qualité air labo recherche', 4, 5, 'Netatmo', 'Weather', 'Actif', 'Wi-Fi', 'Fort', 92, '192.168.3.11'),
('ELEC-MAIN', 'Compteur Électrique', 'Consommation électrique campus', 5, NULL, 'Schneider', 'iEM3255', 'Actif', 'Ethernet', 'Fort', NULL, '192.168.4.10'),
('WATER-MAIN', 'Compteur Eau', 'Consommation eau campus', 5, NULL, 'Itron', 'Cyble 5', 'Actif', 'LoRa', 'Moyen', 65, NULL),
('ACCESS-H001', 'Contrôle Accès Hall', 'Badge accès hall principal', 6, 9, 'HID', 'EDGE EVO', 'Actif', 'Ethernet', 'Fort', NULL, '192.168.5.10'),
('ACCESS-LAB', 'Contrôle Accès Labo', 'Badge accès laboratoire sécurisé', 6, 5, 'HID', 'EDGE EVO', 'Actif', 'Ethernet', 'Fort', NULL, '192.168.5.11'),
('WIFI-A001', 'Point Accès Wi-Fi Amphi A', 'Réseau sans fil Amphi A', 7, 1, 'Cisco', 'Aironet 2800', 'Actif', 'Ethernet', 'Fort', NULL, '192.168.6.10'),
('WIFI-BIB', 'Point Accès Wi-Fi Biblio', 'Réseau sans fil bibliothèque', 7, 6, 'Cisco', 'Aironet 2800', 'Actif', 'Ethernet', 'Fort', NULL, '192.168.6.11'),
('PROJ-A001', 'Projecteur Amphi A', 'Vidéoprojecteur 4K interactif', 8, 1, 'Epson', 'EB-L615U', 'Actif', 'Wi-Fi', 'Fort', NULL, '192.168.7.10'),
('PROJ-B001', 'Projecteur Amphi B', 'Vidéoprojecteur interactif', 8, 2, 'Epson', 'EB-L510U', 'Maintenance', 'Wi-Fi', 'Moyen', NULL, '192.168.7.11'),
('SCREEN-TP101', 'Écran Interactif TP 101', 'Tableau numérique interactif', 8, 3, 'Samsung', 'Flip 3', 'Actif', 'Wi-Fi', 'Fort', NULL, '192.168.7.12'),
('PRES-A001', 'Capteur Présence Amphi A', 'Capteur de présence à l’entrée', 9, 1, 'Bosch', 'Presence X1', 'Actif', 'Wi-Fi', 'Fort', 90, '192.168.8.10'),
('PRES-TP101', 'Capteur Présence TP 101', 'Capteur de présence à l’entrée', 9, 3, 'Bosch', 'Presence X1', 'Actif', 'Wi-Fi', 'Fort', 88, '192.168.8.11'),
('PRES-REUN1', 'Capteur Présence Salle Réunion A', 'Capteur de présence à l’entrée', 9, 8, 'Bosch', 'Presence X1', 'Actif', 'Wi-Fi', 'Fort', 91, '192.168.8.12');

-- Données de test pour les attributs instantanés des appareils
INSERT INTO device_attributes (device_id, attr_key, attr_value, unit) VALUES
(1, 'temperature_actuelle', '21', '°C'),
(1, 'temperature_cible', '22', '°C'),
(1, 'mode', 'Automatique', NULL),
(2, 'temperature_actuelle', '19', '°C'),
(2, 'temperature_cible', '21', '°C'),
(2, 'mode', 'Manuel', NULL),
(3, 'temperature_actuelle', '23', '°C'),
(3, 'temperature_cible', '22', '°C'),
(3, 'mode', 'Automatique', NULL),
(10, 'co2', '650', 'ppm'),
(10, 'humidite', '45', '%'),
(10, 'temperature', '22', '°C'),
(11, 'co2', '420', 'ppm'),
(11, 'humidite', '50', '%'),
(12, 'consommation_jour', '1245', 'kWh'),
(12, 'consommation_mois', '38200', 'kWh'),
(13, 'consommation_jour', '12.5', 'm³'),
(13, 'consommation_mois', '380', 'm³'),
(7, 'luminosite', '80', '%'),
(7, 'couleur', '4000', 'K'),
(8, 'luminosite', '60', '%'),
(9, 'luminosite', '70', '%'),
(16, 'clients_connectes', '87', NULL),
(16, 'debit_montant', '245', 'Mbps'),
(17, 'clients_connectes', '134', NULL),
(17, 'debit_montant', '312', 'Mbps'),
(21, 'personnes_detectees', '120', 'personnes'),
(22, 'personnes_detectees', '18', 'personnes'),
(23, 'personnes_detectees', '6', 'personnes');

-- Données de test pour l'historique des appareils
INSERT INTO device_data (device_id, attr_key, value, recorded_at) VALUES
(12, 'consommation', '1180', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(12, 'consommation', '1320', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(12, 'consommation', '980', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(12, 'consommation', '1450', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(12, 'consommation', '1100', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(12, 'consommation', '1280', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(12, 'consommation', '1245', NOW()),
(13, 'consommation', '11.2', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(13, 'consommation', '13.8', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(13, 'consommation', '10.5', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(13, 'consommation', '14.2', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(13, 'consommation', '11.9', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(13, 'consommation', '13.1', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(13, 'consommation', '12.5', NOW()),
(1, 'temperature', '20', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1, 'temperature', '21', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 'temperature', '22', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 'temperature', '20', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 'temperature', '21', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1, 'temperature', '21', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 'temperature', '21', NOW());

-- Données de test pour l'occupation actuelle des salles
INSERT INTO room_occupancy (room_id, device_id, current_count, is_occupied, occupancy_type) VALUES
(1, 21, 120, 1, 'cours'),
(3, 22, 18, 1, 'cours'),
(8, 23, 6, 1, 'reunion'),
(2, NULL, 0, 0, 'libre'),
(4, NULL, 0, 0, 'libre'),
(5, NULL, 3, 1, 'reunion'),
(6, NULL, 25, 1, 'inconnu');

-- Données de test pour les réservations
INSERT INTO room_reservations
(room_id, user_id, reservation_type, title, description, start_time, end_time, status)
VALUES
(1, 3, 'cours', 'Cours Bases de données', 'Cours de SQL pour les étudiants ING1', DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 2 HOUR), 'active'),
(8, 3, 'reunion', 'Réunion pédagogique', 'Réunion entre enseignants', DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 1 HOUR), 'active'),
(3, 2, 'personnel', 'Révision en groupe', 'Travail de groupe pour projet web', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 3 DAY), INTERVAL 2 HOUR), 'active');

-- Données de test pour les logs de présence
INSERT INTO room_presence_logs (room_id, user_id, detected_by_device_id, detected_at) VALUES
(1, 3, 21, NOW()),
(1, 2, 21, NOW()),
(3, 1, 22, NOW()),
(8, 3, 23, NOW());

-- Données de test pour les connexions
INSERT INTO connection_logs (user_id, ip_address) VALUES
(1, '192.168.0.21'),
(2, '192.168.0.22'),
(3, '192.168.0.23'),
(4, '192.168.0.24'),
(5, '192.168.0.25');

-- Données de test pour les actions utilisateurs
INSERT INTO user_actions (user_id, action_type, description, points_earned) VALUES
(1, 'consultation_salle', 'Consultation des salles disponibles', 0.50),
(2, 'consultation_profil', 'Consultation du profil utilisateur', 0.25),
(3, 'reservation_salle', 'Réservation de la Salle Réunion A', 1.00),
(4, 'consultation_statistiques', 'Consultation des statistiques d’occupation', 0.75),
(5, 'consultation_salle', 'Consultation des salles libres', 0.50);

-- Données de test pour les actualités
INSERT INTO news (title, content, category, author_id, published) VALUES
('Ouverture du nouveau laboratoire de Cybersécurité', 'Nous sommes ravis d’annoncer l’inauguration du nouveau laboratoire de cybersécurité.', 'Infrastructure', 4, 1),
('Journée Portes Ouvertes 2026', 'Le campus organise sa journée portes ouvertes le 15 avril 2026.', 'Événement', 3, 1),
('Résultats exceptionnels aux examens de janvier', 'Les étudiants ont obtenu un taux de réussite de 87% aux examens de janvier.', 'Académique', 3, 1),
('Partenariat avec Airbus pour les stages', 'Un nouveau partenariat a été signé avec Airbus.', 'Partenariat', 4, 1),
('Maintenance programmée du réseau Wi-Fi', 'Une maintenance du réseau Wi-Fi campus est prévue samedi de 22h à 6h.', 'Maintenance', 3, 1),
('Conférence IA et Robotique', 'Le Pr. Antoine Leblanc donnera une conférence sur l’avenir de l’IA.', 'Conférence', 4, 1);

-- Données de test pour les événements
INSERT INTO events (title, description, location, event_date, category) VALUES
('Hackathon IoT Campus 2026', 'Compétition de 48h autour des objets connectés.', 'Amphi A', DATE_ADD(NOW(), INTERVAL 10 DAY), 'Compétition'),
('Journée Portes Ouvertes', 'Découverte du campus pour futurs étudiants et parents.', 'Campus entier', DATE_ADD(NOW(), INTERVAL 10 DAY), 'Institutionnel'),
('Conférence IA & Enseignement', 'Conférence sur l’intelligence artificielle dans l’éducation.', 'Amphi A', DATE_ADD(NOW(), INTERVAL 5 DAY), 'Conférence'),
('Atelier Python Débutant', 'Atelier d’introduction à la programmation Python.', 'Salle TP 101', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Formation'),
('Forum des Entreprises', 'Rencontre entre étudiants et recruteurs.', 'Hall d''entrée', DATE_ADD(NOW(), INTERVAL 20 DAY), 'Emploi'),
('Tournoi de Jeux Vidéo', 'Tournoi inter-filières League of Legends et Valorant.', 'Bibliothèque', DATE_ADD(NOW(), INTERVAL 7 DAY), 'Loisirs');

-- Données de test pour les services
INSERT INTO services (name, description, category, icon, is_active) VALUES
('Réservation de salles', 'Réservez une salle ou un équipement pour vos cours et projets.', 'Logistique', 'calendar', 1),
('Suivi consommation énergie', 'Consultez en temps réel la consommation électrique du campus.', 'Énergie', 'zap', 1),
('Suivi consommation eau', 'Consultez en temps réel la consommation d’eau du campus.', 'Énergie', 'droplets', 1),
('Gestion des accès', 'Contrôle des accès aux zones sécurisées du campus.', 'Sécurité', 'lock', 1),
('Qualité de l’air', 'Monitoring en temps réel de la qualité de l’air dans les salles.', 'Environnement', 'wind', 1),
('Réseau Wi-Fi', 'État du réseau sans fil et statistiques de connexion.', 'Réseau', 'wifi', 1),
('Alertes & Notifications', 'Système d’alertes pour les événements critiques.', 'Sécurité', 'bell', 1),
('Rapports & Statistiques', 'Génération de rapports détaillés sur l’utilisation des ressources.', 'Analyse', 'bar-chart-2', 1);

-- Données de test pour les notifications
INSERT INTO notifications (user_id, message, is_read) VALUES
(1, 'Votre réservation pour la Salle TP 101 commence dans 30 minutes.', 0),
(2, 'Une salle libre correspondant à votre recherche est disponible.', 0),
(3, 'Votre réunion pédagogique a bien été enregistrée.', 1),
(4, 'Nouvelle statistique disponible sur les salles les plus utilisées.', 0),
(5, 'Pensez à compléter votre profil utilisateur.', 0);


-- ================================================================
-- QUIZ SYSTEM TABLES
-- ================================================================
 
-- ----------------------------------------------------------------
-- QUIZZES (Quiz Definitions)
-- ----------------------------------------------------------------
CREATE TABLE quizzes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  difficulty_level  ENUM('débutant', 'intermédiaire', 'avancé', 'expert') DEFAULT 'débutant',
  category          VARCHAR(100),
  points_reward     INT DEFAULT 5,
  is_active         TINYINT(1) DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
 
-- ----------------------------------------------------------------
-- QUIZ QUESTIONS
-- ----------------------------------------------------------------
CREATE TABLE quiz_questions (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id          INT NOT NULL,
  question_text    TEXT NOT NULL,
  question_order   INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);
 
-- ----------------------------------------------------------------
-- QUIZ ANSWERS
-- ----------------------------------------------------------------
CREATE TABLE quiz_answers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  question_id    INT NOT NULL,
  answer_text    TEXT NOT NULL,
  is_correct     TINYINT(1) DEFAULT 0,
  answer_order   INT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);
 
-- ----------------------------------------------------------------
-- QUIZ RESULTS (User Quiz Completions)
-- ----------------------------------------------------------------
CREATE TABLE quiz_results (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  quiz_id          INT NOT NULL,
  score            INT,
  total_questions  INT,
  is_passed        TINYINT(1) DEFAULT 0,
  points_earned    INT DEFAULT 0,
  completed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);
 
-- ----------------------------------------------------------------
-- USER QUIZ PROGRESS
-- ----------------------------------------------------------------
CREATE TABLE user_quiz_progress (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  quiz_id        INT NOT NULL,
  is_completed   TINYINT(1) DEFAULT 0,
  is_passed      TINYINT(1) DEFAULT 0,
  attempts       INT DEFAULT 0,
  best_score     INT,
  unlocked_at    TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id, quiz_id)
);


-- ============================================================
-- QUIZ 1: DÉBUTANT - Chauffage et Température
-- ============================================================
 
INSERT INTO quizzes (title, description, difficulty_level, category, points_reward, is_active) 
VALUES ('Chauffage et Température', 'Comprendre l\'impact du chauffage sur la consommation énergétique', 'débutant', 'Énergie', 5, 1);
 
SET @quiz1 = LAST_INSERT_ID();
 
-- Questions
INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES
(@quiz1, 'Réduire le chauffage de 1°C dans une salle permet d\'économiser environ :', 1),
(@quiz1, 'À quelle température devrait-on garder une salle sans occupation ?', 2),
(@quiz1, 'Quel est l\'équipement le plus gourmand en énergie au campus ?', 3);
 
-- Question 1 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(1, '2%', 0, 1),
(1, '7%', 1, 2),
(1, '12%', 0, 3),
(1, '20%', 0, 4);
 
-- Question 2 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(2, '20°C', 1, 1),
(2, '22°C', 0, 2),
(2, '25°C', 0, 3),
(2, '28°C', 0, 4);
 
-- Question 3 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(3, 'Les ordinateurs', 0, 1),
(3, 'Le chauffage', 1, 2),
(3, 'L\'éclairage', 0, 3),
(3, 'Les climatiseurs', 0, 4);
 
-- ============================================================
-- QUIZ 2: DÉBUTANT - Gestes Numériques
-- ============================================================
 
INSERT INTO quizzes (title, description, difficulty_level, category, points_reward, is_active) 
VALUES ('Gestes Numériques', 'Réduire l\'impact digital au campus', 'débutant', 'Numérique', 5, 1);
 
SET @quiz2 = LAST_INSERT_ID();
 
INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES
(@quiz2, 'Quel geste numérique a le plus d\'impact immédiat sur la consommation du campus ?', 1),
(@quiz2, 'À quelle fréquence devriez-vous vider votre corbeille e-mail ?', 2);
 
-- Question 1 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(4, 'Supprimer 10 e-mails', 0, 1),
(4, 'Utiliser le mode sombre', 0, 2),
(4, 'Éteindre complètement son écran de PC', 1, 3),
(4, 'Vider sa corbeille', 0, 4);
 
-- Question 2 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(5, 'Une fois par mois', 0, 1),
(5, 'Une fois par semaine', 1, 2),
(5, 'Jamais', 0, 3),
(5, 'Tous les jours', 0, 4);
 
-- ============================================================
-- QUIZ 3: DÉBUTANT - Plastique & Déchets
-- ============================================================
 
INSERT INTO quizzes (title, description, difficulty_level, category, points_reward, is_active) 
VALUES ('Plastique & Déchets', 'Éviter les déchets à usage unique', 'débutant', 'Recyclage', 5, 1);
 
SET @quiz3 = LAST_INSERT_ID();
 
INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES
(@quiz3, 'Pourquoi privilégier une gourde aux bouteilles en plastique à la cafétéria ?', 1),
(@quiz3, 'Combien de temps faut-il pour qu\'une bouteille en plastique se décompose ?', 2);
 
-- Question 1 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(6, 'Pour le style', 0, 1),
(6, 'L\'eau est plus froide', 0, 2),
(6, 'Réduire les déchets plastiques à usage unique', 1, 3),
(6, 'C\'est obligatoire', 0, 4);
 
-- Question 2 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(7, 'Entre 5 et 10 ans', 0, 1),
(7, 'Entre 50 et 100 ans', 0, 2),
(7, 'Entre 400 et 1000 ans', 1, 3),
(7, 'Elle ne se décompose jamais', 0, 4);
 
-- ============================================================
-- QUIZ 4: DÉBUTANT - Capteurs IoT
-- ============================================================
 
INSERT INTO quizzes (title, description, difficulty_level, category, points_reward, is_active) 
VALUES ('Capteurs IoT', 'Comment utiliser les capteurs IoT du campus', 'débutant', 'IoT', 5, 1);
 
SET @quiz4 = LAST_INSERT_ID();
 
INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES
(@quiz4, 'Que faire si vous détectez une anomalie sur un capteur IoT via l\'app ?', 1),
(@quiz4, 'Quel type de données peuvent transmettre les capteurs de qualité de l\'air ?', 2);
 
-- Question 1 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(8, 'Ignorer le problème', 0, 1),
(8, 'Le signaler via l\'onglet dédié', 1, 2),
(8, 'Essayer de le réparer soi-même', 0, 3),
(8, 'Attendre la fin du semestre', 0, 4);
 
-- Question 2 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(9, 'Uniquement la température', 0, 1),
(9, 'Température, humidité et CO2', 1, 2),
(9, 'Uniquement le CO2', 0, 3),
(9, 'Données de localisation GPS', 0, 4);
 
-- ============================================================
-- QUIZ 5: INTERMÉDIAIRE - Optimisation Énergétique
-- ============================================================
 
INSERT INTO quizzes (title, description, difficulty_level, category, points_reward, is_active) 
VALUES ('Optimisation Énergétique', 'Gérer activement la consommation énergétique', 'intermédiaire', 'Énergie', 10, 1);
 
SET @quiz5 = LAST_INSERT_ID();
 
INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES
(@quiz5, 'Quel est le principal consommateur d\'énergie dans un bâtiment universitaire ?', 1),
(@quiz5, 'Quel pourcentage d\'économies peut-on réaliser avec une gestion intelligente du chauffage ?', 2),
(@quiz5, 'Quel est l\'impact d\'une isolation thermique correcte sur la consommation ?', 3);
 
-- Question 1 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(10, 'L\'éclairage', 0, 1),
(10, 'Le chauffage/climatisation', 1, 2),
(10, 'Les appareils informatiques', 0, 3),
(10, 'Les ascenseurs', 0, 4);
 
-- Question 2 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(11, 'Moins de 5%', 0, 1),
(11, 'Entre 15 et 30%', 1, 2),
(11, 'Entre 40 et 50%', 0, 3),
(11, 'Plus de 60%', 0, 4);
 
-- Question 3 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(12, 'Réduit la consommation de 10%', 0, 1),
(12, 'Réduit la consommation de 20 à 40%', 1, 2),
(12, 'N\'a aucun impact', 0, 3),
(12, 'Augmente la consommation', 0, 4);
 
-- ============================================================
-- QUIZ 6: INTERMÉDIAIRE - Qualité de l'Air
-- ============================================================
 
INSERT INTO quizzes (title, description, difficulty_level, category, points_reward, is_active) 
VALUES ('Qualité de l\'Air', 'Monitorer et améliorer la qualité de l\'air intérieur', 'intermédiaire', 'Environnement', 10, 1);
 
SET @quiz6 = LAST_INSERT_ID();
 
INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES
(@quiz6, 'À quel niveau de CO2 commence-t-on à sentir une baisse de concentration ?', 1),
(@quiz6, 'Quel est le meilleur moyen de réduire le CO2 dans une salle ?', 2),
(@quiz6, 'Quelle est la norme de CO2 idéale dans un bâtiment ?', 3);
 
-- Question 1 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(13, '400 ppm', 0, 1),
(13, '800 ppm', 1, 2),
(13, '1200 ppm', 0, 3),
(13, '2000 ppm', 0, 4);
 
-- Question 2 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(14, 'Aérer régulièrement les salles', 1, 1),
(14, 'Fermer toutes les fenêtres', 0, 2),
(14, 'Allumer la climatisation au maximum', 0, 3),
(14, 'Rien, c\'est naturel', 0, 4);
 
-- Question 3 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(15, 'Moins de 500 ppm', 0, 1),
(15, 'Entre 400 et 600 ppm', 1, 2),
(15, 'Entre 1000 et 1200 ppm', 0, 3),
(15, 'Plus de 2000 ppm', 0, 4);
 
-- ============================================================
-- QUIZ 7: AVANCÉ - Durabilité Stratégique
-- ============================================================
 
INSERT INTO quizzes (title, description, difficulty_level, category, points_reward, is_active) 
VALUES ('Durabilité Stratégique', 'Planifier pour la durabilité du campus', 'avancé', 'Stratégie', 15, 1);
 
SET @quiz7 = LAST_INSERT_ID();
 
INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES
(@quiz7, 'Qu\'est-ce que l\'empreinte carbone d\'un bâtiment ?', 1),
(@quiz7, 'Quel est l\'objectif de réduction carbone du campus pour 2030 ?', 2),
(@quiz7, 'Quel est le rôle des données IoT dans la durabilité ?', 3);
 
-- Question 1 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(16, 'Uniquement la consommation électrique', 0, 1),
(16, 'Les émissions totales de gaz à effet de serre liées au bâtiment', 1, 2),
(16, 'Le coût de la construction', 0, 3),
(16, 'La taille du bâtiment', 0, 4);
 
-- Question 2 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(17, 'Réduire de 10%', 0, 1),
(17, 'Réduire de 30%', 0, 2),
(17, 'Réduire de 50%', 1, 3),
(17, 'Zéro carbone', 0, 4);
 
-- Question 3 Answers
INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
(18, 'Permettre la surveillance et l\'optimisation en temps réel', 1, 1),
(18, 'Augmenter la consommation d\'énergie', 0, 2),
(18, 'Remplacer les humains dans la gestion', 0, 3),
(18, 'N\'a aucun rôle', 0, 4);
 
-- ============================================================
-- VERIFICATION
-- ============================================================
 
SELECT COUNT(*) as total_quizzes FROM quizzes;
SELECT COUNT(*) as total_questions FROM quiz_questions;
SELECT COUNT(*) as total_answers FROM quiz_answers;
 
SELECT id, title, difficulty_level, points_reward FROM quizzes ORDER BY difficulty_level;