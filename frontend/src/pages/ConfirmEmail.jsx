import React, { useEffect, useState, useRef } from 'react';

const ConfirmEmail = () => {
  const [message, setMessage] = useState('Confirmation en cours...');
  const hasCalled = useRef(false); // 👈 IMPORTANT

  useEffect(() => {
    if (hasCalled.current) return; // évite double appel
    hasCalled.current = true;

    const token = new URLSearchParams(window.location.search).get('token');

    fetch(`http://localhost:5000/confirm-email?token=${token}`)
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Erreur serveur'));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Confirmation Email</h2>
      <p>{message}</p>
    </div>
  );
};

export default ConfirmEmail;