-- Script: verify_and_approve_all_users.sql
-- Description:
-- Ce script sert UNIQUEMENT en phase de test ou de développement.
-- Il permet d'activer tous les utilisateurs en une seule fois
-- en les marquant comme vérifiés (is_verified) et approuvés (is_approved).
--
-- ⚠️ À utiliser uniquement dans les cas suivants :
-- - Tests rapides sans passer par la vérification email
-- - Démonstration du projet en local
-- - Problème avec le système de validation des comptes
--
-- ❌ Ne pas utiliser en production
-- ❌ Normalement inutile pour la prof si la base contient déjà des comptes actifs

UPDATE users
SET is_verified = 1,
    is_approved = 1;
