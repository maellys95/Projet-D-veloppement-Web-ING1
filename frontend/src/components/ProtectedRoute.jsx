import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * 
 * Protège les routes d'accès admin (complexe, avancé, expert)
 * Redirige les utilisateurs non-autorisés vers home
 */
const ProtectedRoute = ({ children }) => {
  // Récupère l'utilisateur du localStorage
  const userJson = localStorage.getItem('user');

  // Si pas connecté → Redirection login
  if (!userJson) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userJson);

    // ✅ Vérifier les droits d'accès
    // Accès si: user_level='complexe' OU experience_level dans ['avancé', 'expert']
    const canAccess = 
      user.user_level === 'complexe' ||
      (user.experience_level && ['avancé', 'expert'].includes(user.experience_level.toLowerCase()));

    // Si pas d'accès → Redirection home
    if (!canAccess) {
      console.warn(`❌ Access denied for user: ${user.email}`);
      return <Navigate to="/" replace />;
    }

    // ✅ Accès autorisé
    return children;

  } catch (error) {
    console.error('❌ Error parsing user data:', error);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;