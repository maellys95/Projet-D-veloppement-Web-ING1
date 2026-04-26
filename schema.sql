-- ============================================================
--  Smart Campus IoT Platform — Database Schema
--  Université Intelligente
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_campus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_campus;

-- ----------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  pseudo        VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(50),
  last_name     VARCHAR(50),
  age           INT,
  gender        ENUM('Homme','Femme','Autre','Non précisé') DEFAULT 'Non précisé',
  birth_date    DATE,
  member_type   ENUM('Étudiant','Enseignant','Administratif','Directeur','Chercheur','Stagiaire') DEFAULT 'Étudiant',
  photo_url     VARCHAR(255) DEFAULT NULL,
  level         ENUM('débutant','intermédiaire','avancé','expert') DEFAULT 'débutant',
  points        DECIMAL(10,2) DEFAULT 0.00,
  is_verified   TINYINT(1) DEFAULT 0,
  verify_token  VARCHAR(255) DEFAULT NULL,
  is_approved   TINYINT(1) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- CONNECTION LOGS
-- ----------------------------------------------------------------
CREATE TABLE connection_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  logged_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- USER ACTIONS
-- ----------------------------------------------------------------
CREATE TABLE user_actions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  description TEXT,
  points_earned DECIMAL(5,2) DEFAULT 0.00,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- IOT DEVICE CATEGORIES
-- ----------------------------------------------------------------
CREATE TABLE device_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  icon        VARCHAR(50) DEFAULT 'cpu'
);

-- ----------------------------------------------------------------
-- ROOMS / ZONES
-- ----------------------------------------------------------------
CREATE TABLE rooms (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  building    VARCHAR(100),
  floor       INT DEFAULT 0,
  capacity    INT DEFAULT 0,
  description TEXT
);

-- ----------------------------------------------------------------
-- IOT DEVICES
-- ----------------------------------------------------------------
CREATE TABLE devices (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  uid             VARCHAR(50) NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  category_id     INT,
  room_id         INT,
  brand           VARCHAR(100),
  model           VARCHAR(100),
  status          ENUM('Actif','Inactif','Maintenance','Erreur') DEFAULT 'Actif',
  connectivity    ENUM('Wi-Fi','Bluetooth','Zigbee','Z-Wave','Ethernet','LoRa') DEFAULT 'Wi-Fi',
  signal_strength ENUM('Faible','Moyen','Fort') DEFAULT 'Fort',
  battery_level   INT DEFAULT 100,
  firmware_version VARCHAR(20) DEFAULT '1.0.0',
  ip_address      VARCHAR(45),
  last_seen       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES device_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------
-- DEVICE ATTRIBUTES (key-value store for sensor data)
-- ----------------------------------------------------------------
CREATE TABLE device_attributes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  device_id  INT NOT NULL,
  attr_key   VARCHAR(100) NOT NULL,
  attr_value VARCHAR(255),
  unit       VARCHAR(20),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- DEVICE DATA HISTORY
-- ----------------------------------------------------------------
CREATE TABLE device_data (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  device_id  INT NOT NULL,
  attr_key   VARCHAR(100) NOT NULL,
  value      VARCHAR(255),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- DELETION REQUESTS (complexe → admin)
-- ----------------------------------------------------------------
CREATE TABLE deletion_requests (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  device_id   INT NOT NULL,
  requested_by INT NOT NULL,
  reason      TEXT,
  status      ENUM('pending','approved','rejected') DEFAULT 'pending',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- NEWS / ACTUALITES
-- ----------------------------------------------------------------
CREATE TABLE news (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  category   VARCHAR(100),
  image_url  VARCHAR(255),
  author_id  INT,
  published  TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------
CREATE TABLE events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  location    VARCHAR(255),
  event_date  DATETIME,
  category    VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- SERVICES
-- ----------------------------------------------------------------
CREATE TABLE services (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  icon        VARCHAR(50) DEFAULT 'settings',
  is_active   TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  SEED DATA
-- ============================================================

-- Categories
INSERT INTO device_categories (name, description, icon) VALUES
('Thermostat',       'Régulation de la température',         'thermometer'),
('Caméra',           'Surveillance et sécurité',              'camera'),
('Éclairage',        'Gestion intelligente de la lumière',    'lightbulb'),
('Capteur qualité',  'Qualité de l\'air et environnement',   'wind'),
('Consommation',     'Compteurs énergie et eau',              'zap'),
('Accès',            'Contrôle d\'accès et serrures',         'lock'),
('Réseau',           'Points d\'accès Wi-Fi et réseau',       'wifi'),
('Multimédia',       'Projecteurs et écrans interactifs',     'monitor');

-- Rooms
INSERT INTO rooms (name, building, floor, capacity, description) VALUES
('Amphi A',         'Bâtiment Principal', 0,  300, 'Grand amphithéâtre principal'),
('Amphi B',         'Bâtiment Principal', 0,  150, 'Amphithéâtre secondaire'),
('Salle TP 101',    'Bâtiment Info',      1,   30, 'Salle de travaux pratiques informatique'),
('Salle TP 102',    'Bâtiment Info',      1,   30, 'Salle de travaux pratiques réseau'),
('Laboratoire Recherche', 'Bâtiment R&D', 2,   20, 'Laboratoire de recherche'),
('Bibliothèque',    'Bâtiment Culture',   0,  200, 'Bibliothèque universitaire'),
('Cafétéria',       'Bâtiment Social',    0,  150, 'Restaurant universitaire'),
('Salle Réunion A', 'Bâtiment Admin',     1,   15, 'Salle de réunion administrative'),
('Hall d\'entrée',  'Bâtiment Principal', 0,  500, 'Hall principal d\'accueil'),
('Parking',         'Extérieur',          0, 1000, 'Parking principal du campus');

-- Devices
INSERT INTO devices (uid, name, description, category_id, room_id, brand, model, status, connectivity, signal_strength, battery_level, ip_address) VALUES
('THERM-A001', 'Thermostat Amphi A',        'Contrôle température Amphi A',     1, 1,  'Nest',      'Learning 3',  'Actif',      'Wi-Fi',    'Fort',  NULL, '192.168.1.10'),
('THERM-B001', 'Thermostat Amphi B',        'Contrôle température Amphi B',     1, 2,  'Nest',      'Learning 3',  'Actif',      'Wi-Fi',    'Fort',  NULL, '192.168.1.11'),
('THERM-TP101','Thermostat TP 101',         'Contrôle température salle TP',    1, 3,  'Honeywell', 'T6 Pro',      'Actif',      'Wi-Fi',    'Moyen', NULL, '192.168.1.12'),
('CAM-H001',   'Caméra Hall Entrée',        'Surveillance entrée principale',   2, 9,  'Axis',      'P3245-V',     'Actif',      'Ethernet', 'Fort',  NULL, '192.168.2.10'),
('CAM-PARK01', 'Caméra Parking',            'Surveillance parking extérieur',   2, 10, 'Axis',      'P1448-LE',    'Actif',      'Ethernet', 'Fort',  NULL, '192.168.2.11'),
('CAM-TP101',  'Caméra TP 101',             'Surveillance salle TP',            2, 3,  'Hikvision', 'DS-2CD2143',  'Inactif',    'Wi-Fi',    'Faible',NULL, '192.168.2.12'),
('LIGHT-A001', 'Éclairage Amphi A',         'Système éclairage intelligent',    3, 1,  'Philips',   'Hue Pro',     'Actif',      'Zigbee',   'Fort',  NULL, NULL),
('LIGHT-B001', 'Éclairage Amphi B',         'Système éclairage intelligent',    3, 2,  'Philips',   'Hue Pro',     'Actif',      'Zigbee',   'Fort',  NULL, NULL),
('LIGHT-BIB',  'Éclairage Bibliothèque',    'Éclairage adaptatif bibliothèque', 3, 6,  'Philips',   'Hue White',   'Actif',      'Zigbee',   'Moyen', NULL, NULL),
('AIR-TP101',  'Capteur Air TP 101',        'Qualité air CO2/température',      4, 3,  'Netatmo',   'Healthy Home',  'Actif',    'Wi-Fi',    'Fort',  78,  '192.168.3.10'),
('AIR-LAB',    'Capteur Air Laboratoire',   'Qualité air labo recherche',       4, 5,  'Netatmo',   'Weather',     'Actif',      'Wi-Fi',    'Fort',  92,  '192.168.3.11'),
('ELEC-MAIN',  'Compteur Électrique',       'Consommation électrique campus',   5, NULL,'Schneider','iEM3255',     'Actif',      'Ethernet', 'Fort',  NULL, '192.168.4.10'),
('WATER-MAIN', 'Compteur Eau',              'Consommation eau campus',          5, NULL,'Itron',    'Cyble 5',     'Actif',      'LoRa',     'Moyen', 65,  NULL),
('ACCESS-H001','Contrôle Accès Hall',       'Badge accès hall principal',       6, 9,  'HID',       'EDGE EVO',    'Actif',      'Ethernet', 'Fort',  NULL, '192.168.5.10'),
('ACCESS-LAB', 'Contrôle Accès Labo',       'Badge accès laboratoire sécurisé', 6, 5,  'HID',       'EDGE EVO',    'Actif',      'Ethernet', 'Fort',  NULL, '192.168.5.11'),
('WIFI-A001',  'Point Accès Wi-Fi Amphi A', 'Réseau sans fil Amphi A',          7, 1,  'Cisco',     'Aironet 2800','Actif',      'Ethernet', 'Fort',  NULL, '192.168.6.10'),
('WIFI-BIB',   'Point Accès Wi-Fi Biblio',  'Réseau sans fil bibliothèque',     7, 6,  'Cisco',     'Aironet 2800','Actif',      'Ethernet', 'Fort',  NULL, '192.168.6.11'),
('PROJ-A001',  'Projecteur Amphi A',        'Vidéoprojecteur 4K interactif',    8, 1,  'Epson',     'EB-L615U',    'Actif',      'Wi-Fi',    'Fort',  NULL, '192.168.7.10'),
('PROJ-B001',  'Projecteur Amphi B',        'Vidéoprojecteur interactif',       8, 2,  'Epson',     'EB-L510U',    'Maintenance','Wi-Fi',    'Moyen', NULL, '192.168.7.11'),
('SCREEN-TP101','Écran Interactif TP 101',  'Tableau numérique interactif',     8, 3,  'Samsung',   'Flip 3',      'Actif',      'Wi-Fi',    'Fort',  NULL, '192.168.7.12');

-- Device Attributes
INSERT INTO device_attributes (device_id, attr_key, attr_value, unit) VALUES
(1,  'temperature_actuelle', '21',  '°C'),
(1,  'temperature_cible',    '22',  '°C'),
(1,  'mode',                 'Automatique', NULL),
(2,  'temperature_actuelle', '19',  '°C'),
(2,  'temperature_cible',    '21',  '°C'),
(2,  'mode',                 'Manuel', NULL),
(3,  'temperature_actuelle', '23',  '°C'),
(3,  'temperature_cible',    '22',  '°C'),
(3,  'mode',                 'Automatique', NULL),
(10, 'co2',                  '650', 'ppm'),
(10, 'humidite',             '45',  '%'),
(10, 'temperature',          '22',  '°C'),
(11, 'co2',                  '420', 'ppm'),
(11, 'humidite',             '50',  '%'),
(12, 'consommation_jour',    '1245','kWh'),
(12, 'consommation_mois',    '38200','kWh'),
(13, 'consommation_jour',    '12.5','m³'),
(13, 'consommation_mois',    '380', 'm³'),
(7,  'luminosite',           '80',  '%'),
(7,  'couleur',              '4000','K'),
(8,  'luminosite',           '60',  '%'),
(9,  'luminosite',           '70',  '%'),
(16, 'clients_connectes',    '87',  NULL),
(16, 'debit_montant',        '245', 'Mbps'),
(17, 'clients_connectes',    '134', NULL),
(17, 'debit_montant',        '312', 'Mbps');

-- Device historical data (last 7 days simulation)
INSERT INTO device_data (device_id, attr_key, value, recorded_at) VALUES
(12, 'consommation', '1180', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(12, 'consommation', '1320', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(12, 'consommation', '980',  DATE_SUB(NOW(), INTERVAL 4 DAY)),
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
(1,  'temperature',  '20',   DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1,  'temperature',  '21',   DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1,  'temperature',  '22',   DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1,  'temperature',  '20',   DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1,  'temperature',  '21',   DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1,  'temperature',  '21',   DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1,  'temperature',  '21',   NOW());

-- News
INSERT INTO news (title, content, category, published) VALUES
('Ouverture du nouveau laboratoire de Cybersécurité',  'Nous sommes ravis d\'annoncer l\'inauguration du nouveau laboratoire de cybersécurité. Équipé de matériel de pointe, il accueillera 20 étudiants en master.', 'Infrastructure', 1),
('Journée Portes Ouvertes 2026',  'Le campus organise sa journée portes ouvertes le 15 avril 2026. Venez découvrir nos formations, nos laboratoires et rencontrer nos enseignants.', 'Événement', 1),
('Résultats exceptionnels aux examens de janvier',  'Les étudiants ont obtenu un taux de réussite de 87% aux examens de janvier, un record pour notre établissement.', 'Académique', 1),
('Partenariat avec Airbus pour les stages',  'Un nouveau partenariat a été signé avec Airbus, ouvrant 50 offres de stage pour nos étudiants en ingénierie.', 'Partenariat', 1),
('Maintenance programmée du réseau Wi-Fi',  'Une maintenance du réseau Wi-Fi campus est prévue samedi de 22h à 6h. Certains services pourront être interrompus.', 'Maintenance', 1),
('Conférence IA et Robotique — Dr. Marie Curie 2.0',  'Le Pr. Antoine Leblanc donnera une conférence sur l\'avenir de l\'IA dans l\'enseignement supérieur, vendredi 10 avril à 14h en Amphi A.', 'Conférence', 1);

-- Events
INSERT INTO events (title, description, location, event_date, category) VALUES
('Hackathon IoT Campus 2026',    'Compétition de 48h autour des objets connectés. Équipes de 3-5 personnes.', 'Amphi A', DATE_ADD(NOW(), INTERVAL 10 DAY), 'Compétition'),
('Journée Portes Ouvertes',      'Découverte du campus pour futurs étudiants et parents.', 'Campus entier', DATE_ADD(NOW(), INTERVAL 10 DAY), 'Institutionnel'),
('Conférence IA & Enseignement', 'Conférence sur l\'intelligence artificielle dans l\'éducation.', 'Amphi A', DATE_ADD(NOW(), INTERVAL 5 DAY), 'Conférence'),
('Atelier Python Débutant',      'Atelier d\'introduction à la programmation Python.', 'Salle TP 101', DATE_ADD(NOW(), INTERVAL 3 DAY), 'Formation'),
('Forum des Entreprises',        'Rencontre entre étudiants et recruteurs. Plus de 50 entreprises présentes.', 'Hall d\'entrée', DATE_ADD(NOW(), INTERVAL 20 DAY), 'Emploi'),
('Tournoi de Jeux Vidéo',        'Tournoi inter-filières League of Legends et Valorant.', 'Bibliothèque', DATE_ADD(NOW(), INTERVAL 7 DAY), 'Loisirs');

-- Services
INSERT INTO services (name, description, category, icon, is_active) VALUES
('Réservation de salles',     'Réservez une salle ou un équipement pour vos cours et projets.',           'Logistique',    'calendar',       1),
('Suivi consommation énergie','Consultez en temps réel la consommation électrique du campus.',            'Énergie',       'zap',            1),
('Suivi consommation eau',    'Consultez en temps réel la consommation d\'eau du campus.',                'Énergie',       'droplets',       1),
('Gestion des accès',         'Contrôle des accès aux zones sécurisées du campus.',                       'Sécurité',      'lock',           1),
('Qualité de l\'air',         'Monitoring en temps réel de la qualité de l\'air dans les salles.',        'Environnement', 'wind',           1),
('Réseau Wi-Fi',              'État du réseau sans fil et statistiques de connexion.',                    'Réseau',        'wifi',           1),
('Alertes & Notifications',   'Système d\'alertes pour la maintenance et les événements critiques.',      'Sécurité',      'bell',           1),
('Rapports & Statistiques',   'Génération de rapports détaillés sur l\'utilisation des ressources.',      'Analyse',       'bar-chart-2',    1);

-- Admin user (password: Admin1234!)
INSERT INTO users (pseudo, email, password_hash, first_name, last_name, member_type, level, points, is_verified, is_approved) VALUES
('admin', 'admin@campus.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Campus', 'Directeur', 'expert', 100, 1, 1);
