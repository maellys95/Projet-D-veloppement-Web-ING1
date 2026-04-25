-- ============================================================
-- REQUÊTES SQL UTILES — SMART CAMPUS
-- ============================================================

-- IMPORTANT :
-- Vérifier que la base existe puis la sélectionner avant d’exécuter les requêtes
USE smart_campus;

-- ============================================================
-- TEST RAPIDE (OPTIONNEL)
-- ============================================================

-- Vérifier que toutes les tables existent
SHOW TABLES;

-- Vérifier que la table users contient des données
SELECT * FROM users LIMIT 5;

-- ============================================================
-- 1. AFFICHER TOUTES LES SALLES
-- ============================================================
-- Affiche toutes les salles enregistrées dans la base
SELECT * 
FROM rooms;

-- ============================================================
-- 2. AFFICHER TOUTES LES SALLES LIBRES EN TEMPS RÉEL
-- ============================================================
-- Récupère les salles dont l’état d’occupation est libre
SELECT r.id, r.name, r.building, r.floor, r.capacity
FROM rooms r
JOIN room_occupancy ro ON r.id = ro.room_id
WHERE ro.is_occupied = 0
  AND ro.occupancy_type = 'libre';

-- ============================================================
-- 3. AFFICHER TOUTES LES SALLES OCCUPÉES
-- ============================================================
-- Récupère les salles actuellement occupées avec le nombre de personnes
SELECT r.id, r.name, r.building, ro.current_count, ro.occupancy_type, ro.last_update
FROM rooms r
JOIN room_occupancy ro ON r.id = ro.room_id
WHERE ro.is_occupied = 1;

-- ============================================================
-- 4. VOIR LE NOMBRE DE PERSONNES DANS CHAQUE SALLE
-- ============================================================
-- Permet d’afficher l’occupation actuelle de chaque salle
SELECT r.name AS salle, ro.current_count AS nombre_personnes
FROM rooms r
JOIN room_occupancy ro ON r.id = ro.room_id
ORDER BY ro.current_count DESC;

-- ============================================================
-- 5. RECHERCHER LES SALLES D’UN BÂTIMENT PRÉCIS
-- ============================================================
-- Exemple avec le Bâtiment Principal
SELECT *
FROM rooms
WHERE building = 'Bâtiment Principal';

-- ============================================================
-- 6. RECHERCHER LES SALLES AVEC UNE CAPACITÉ MINIMALE
-- ============================================================
-- Exemple : salles avec au moins 30 places
SELECT *
FROM rooms
WHERE capacity >= 30
ORDER BY capacity DESC;

-- ============================================================
-- 7. VOIR TOUS LES OBJETS CONNECTÉS D’UNE SALLE
-- ============================================================
-- Exemple : objets de l’Amphi A
SELECT d.id, d.uid, d.name, d.brand, d.model, d.status
FROM devices d
JOIN rooms r ON d.room_id = r.id
WHERE r.name = 'Amphi A';

-- ============================================================
-- 8. VOIR LES OBJETS CONNECTÉS PAR CATÉGORIE
-- ============================================================
-- Liste chaque appareil avec sa catégorie et sa salle
SELECT d.name AS objet, c.name AS categorie, r.name AS salle
FROM devices d
JOIN device_categories c ON d.category_id = c.id
LEFT JOIN rooms r ON d.room_id = r.id
ORDER BY c.name;

-- ============================================================
-- 9. RECHERCHER LES OBJETS ACTIFS
-- ============================================================
-- Affiche uniquement les appareils dont l’état est Actif
SELECT *
FROM devices
WHERE status = 'Actif';

-- ============================================================
-- 10. RECHERCHER LES CAPTEURS DE PRÉSENCE
-- ============================================================
-- Affiche les appareils de catégorie Présence
SELECT d.id, d.uid, d.name, r.name AS salle
FROM devices d
JOIN device_categories c ON d.category_id = c.id
LEFT JOIN rooms r ON d.room_id = r.id
WHERE c.name = 'Présence';

-- ============================================================
-- 11. VOIR LES ATTRIBUTS D’UN APPAREIL
-- ============================================================
-- Exemple : attributs du Thermostat Amphi A
SELECT d.name AS objet, da.attr_key, da.attr_value, da.unit
FROM device_attributes da
JOIN devices d ON da.device_id = d.id
WHERE d.name = 'Thermostat Amphi A';

-- ============================================================
-- 12. VOIR L’HISTORIQUE DES DONNÉES D’UN APPAREIL
-- ============================================================
-- Exemple : historique du Compteur Électrique
SELECT d.name AS objet, dd.attr_key, dd.value, dd.recorded_at
FROM device_data dd
JOIN devices d ON dd.device_id = d.id
WHERE d.name = 'Compteur Électrique'
ORDER BY dd.recorded_at DESC;

-- ============================================================
-- 13. VOIR TOUTES LES RÉSERVATIONS DE SALLES
-- ============================================================
-- Affiche les réservations avec le nom de la salle et l’utilisateur
SELECT rr.id, r.name AS salle, u.pseudo AS utilisateur, rr.reservation_type,
       rr.title, rr.start_time, rr.end_time, rr.status
FROM room_reservations rr
JOIN rooms r ON rr.room_id = r.id
JOIN users u ON rr.user_id = u.id
ORDER BY rr.start_time ASC;

-- ============================================================
-- 14. VOIR LES RÉSERVATIONS À VENIR
-- ============================================================
-- Affiche uniquement les réservations futures actives
SELECT rr.id, r.name AS salle, u.pseudo AS utilisateur, rr.title,
       rr.start_time, rr.end_time
FROM room_reservations rr
JOIN rooms r ON rr.room_id = r.id
JOIN users u ON rr.user_id = u.id
WHERE rr.start_time >= NOW()
  AND rr.status = 'active'
ORDER BY rr.start_time ASC;

-- ============================================================
-- 15. VOIR LES RÉSERVATIONS D’UN UTILISATEUR
-- ============================================================
-- Exemple : réservations de yasmine
SELECT u.pseudo, r.name AS salle, rr.title, rr.start_time, rr.end_time, rr.status
FROM room_reservations rr
JOIN users u ON rr.user_id = u.id
JOIN rooms r ON rr.room_id = r.id
WHERE u.pseudo = 'yasmine'
ORDER BY rr.start_time ASC;

-- ============================================================
-- 16. VÉRIFIER SI UNE SALLE EST DÉJÀ RÉSERVÉE SUR UN CRÉNEAU
-- ============================================================
-- Vérifie si la salle 3 est occupée entre deux horaires
SELECT *
FROM room_reservations
WHERE room_id = 3
  AND status = 'active'
  AND (
    '2026-04-25 10:00:00' < end_time
    AND '2026-04-25 12:00:00' > start_time
  );

-- ============================================================
-- 17. VOIR QUI EST PASSÉ DANS UNE SALLE
-- ============================================================
-- Affiche les personnes détectées dans une salle donnée
SELECT r.name AS salle, u.pseudo, u.member_type, rpl.detected_at
FROM room_presence_logs rpl
JOIN rooms r ON rpl.room_id = r.id
LEFT JOIN users u ON rpl.user_id = u.id
WHERE r.name = 'Amphi A'
ORDER BY rpl.detected_at DESC;

-- ============================================================
-- 18. VOIR SI UN ENSEIGNANT A ÉTÉ DÉTECTÉ DANS UNE SALLE
-- ============================================================
-- Filtre les logs de présence pour garder uniquement les enseignants
SELECT r.name AS salle, u.pseudo, u.member_type, rpl.detected_at
FROM room_presence_logs rpl
JOIN rooms r ON rpl.room_id = r.id
JOIN users u ON rpl.user_id = u.id
WHERE u.member_type = 'Enseignant'
ORDER BY rpl.detected_at DESC;

-- ============================================================
-- 19. VOIR LES UTILISATEURS SIMPLES
-- ============================================================
-- Affiche les utilisateurs ayant le niveau simple
SELECT id, pseudo, email, member_type, user_level
FROM users
WHERE user_level = 'simple';

-- ============================================================
-- 20. VOIR LES UTILISATEURS COMPLEXES
-- ============================================================
-- Affiche les utilisateurs ayant le niveau complexe
SELECT id, pseudo, email, member_type, user_level
FROM users
WHERE user_level = 'complexe';

-- ============================================================
-- 21. VOIR LE NOMBRE DE CONNEXIONS PAR UTILISATEUR
-- ============================================================
-- Compte combien de connexions chaque utilisateur a effectuées
SELECT u.pseudo, COUNT(cl.id) AS nombre_connexions
FROM users u
LEFT JOIN connection_logs cl ON u.id = cl.user_id
GROUP BY u.id, u.pseudo
ORDER BY nombre_connexions DESC;

-- ============================================================
-- 22. VOIR LES ACTIONS EFFECTUÉES PAR LES UTILISATEURS
-- ============================================================
-- Affiche les actions enregistrées avec les points gagnés
SELECT u.pseudo, ua.action_type, ua.description, ua.points_earned, ua.created_at
FROM user_actions ua
JOIN users u ON ua.user_id = u.id
ORDER BY ua.created_at DESC;

-- ============================================================
-- 23. CALCULER LE TOTAL DE POINTS PAR UTILISATEUR
-- ============================================================
-- Additionne les points de base et les points gagnés via les actions
SELECT u.pseudo, u.points + COALESCE(SUM(ua.points_earned), 0) AS total_points
FROM users u
LEFT JOIN user_actions ua ON u.id = ua.user_id
GROUP BY u.id, u.pseudo, u.points
ORDER BY total_points DESC;

-- ============================================================
-- 24. VOIR LES ACTUALITÉS PUBLIÉES
-- ============================================================
-- Affiche les actualités visibles sur la plateforme
SELECT title, category, created_at
FROM news
WHERE published = 1
ORDER BY created_at DESC;

-- ============================================================
-- 25. VOIR LES ÉVÉNEMENTS À VENIR
-- ============================================================
-- Affiche uniquement les événements futurs
SELECT title, location, event_date, category
FROM events
WHERE event_date >= NOW()
ORDER BY event_date ASC;

-- ============================================================
-- 26. VOIR LES SERVICES ACTIFS
-- ============================================================
-- Affiche les services actuellement disponibles
SELECT name, category, description
FROM services
WHERE is_active = 1
ORDER BY name ASC;

-- ============================================================
-- 27. VOIR LES NOTIFICATIONS NON LUES D’UN UTILISATEUR
-- ============================================================
-- Exemple : notifications non lues de alice
SELECT u.pseudo, n.message, n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.pseudo = 'alice'
  AND n.is_read = 0
ORDER BY n.created_at DESC;

-- ============================================================
-- 28. VOIR LES SALLES LES PLUS UTILISÉES
-- ============================================================
-- Compte combien de fois chaque salle a été réservée
SELECT r.name AS salle, COUNT(rr.id) AS nb_reservations
FROM rooms r
LEFT JOIN room_reservations rr ON r.id = rr.room_id
GROUP BY r.id, r.name
ORDER BY nb_reservations DESC;

-- ============================================================
-- 29. VOIR LES SALLES AVEC LE PLUS DE PERSONNES ACTUELLEMENT
-- ============================================================
-- Classe les salles par nombre de personnes détectées
SELECT r.name AS salle, ro.current_count
FROM rooms r
JOIN room_occupancy ro ON r.id = ro.room_id
ORDER BY ro.current_count DESC;

-- ============================================================
-- 30. VOIR LES APPAREILS EN MAINTENANCE OU EN ERREUR
-- ============================================================
-- Permet d’identifier rapidement les appareils ayant un problème
SELECT d.name, d.status, r.name AS salle
FROM devices d
LEFT JOIN rooms r ON d.room_id = r.id
WHERE d.status IN ('Maintenance', 'Erreur');

-- ============================================================
-- 31. TAUX D’OCCUPATION DES SALLES (STYLE AFFLUENCES)
-- ============================================================
-- Cette requête affiche :
-- - le nom de la salle
-- - le nombre de places occupées
-- - la capacité maximale
-- - un affichage du type "18 / 30"
-- - le taux d’occupation en pourcentage
--
-- NULLIF(r.capacity, 0) évite une division par 0
SELECT 
  r.name AS salle,
  ro.current_count AS places_occupees,
  r.capacity AS places_max,
  CONCAT(ro.current_count, ' / ', r.capacity) AS affichage,
  ROUND((ro.current_count / NULLIF(r.capacity, 0)) * 100, 1) AS taux_occupation
FROM rooms r
JOIN room_occupancy ro ON r.id = ro.room_id
ORDER BY taux_occupation DESC;