import React, { useState } from 'react';
import './css/Auth.css';
import bgLogin from '../assets/background-login.png';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const token = new URLSearchParams(window.location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('http://localhost:5000/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password })
    });

    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div className="login-page" style={{
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${bgLogin})`
    }}>
      <div className="login-card">
        <h2>Nouveau <span>mot de passe</span></h2>

        {message && (
          <div className="error-alert">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn-login" type="submit">
            Modifier le mot de passe
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;