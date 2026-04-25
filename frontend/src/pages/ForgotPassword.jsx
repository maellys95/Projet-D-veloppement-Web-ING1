import React, { useState } from 'react';
import './css/Auth.css';
import bgLogin from '../assets/background-login.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('http://localhost:5000/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div className="login-page" style={{
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${bgLogin})`
    }}>
      <div className="login-card">
        <h2>Mot de passe <span>oublié</span></h2>

        {message && (
          <div className="success-alert">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Ton email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="btn-login" type="submit">
            Envoyer le lien
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;