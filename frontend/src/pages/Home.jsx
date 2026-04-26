import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Home.css';
import RoomCard from '../components/RoomCard';
import { getRoomImage, getDeviceImage } from '../utils/imageUtils';

import campusImg from '../assets/background.png';
import imgTemperature from '../assets/temp.png';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/rooms')
      .then((res) => res.json())
      .then((data) => setRooms(data.slice(0, 3)))
      .catch((err) => console.error('Erreur salles :', err));

    fetch('http://localhost:5000/devices')
      .then((res) => res.json())
      .then((data) => setDevices(data.slice(0, 3)))
      .catch((err) => console.error('Erreur équipements :', err));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-wrapper">

      {/* ── 1. HERO ── */}
      <section id="hero" className="hero-fullscreen">
        <div className="hero-background-img" style={{ backgroundImage: `url(${campusImg})` }} />
        <div className="hero-overlay" />
        <div className="hero-content reveal">
          <h2>SMART CAMPUS : CY TECH</h2>
          <h3>
            Protégez votre futur avec notre système de gestion de sécurité
            et d'évacuation intelligente en temps réel.
          </h3>
          <div className="more-info-container">
            <button
              className="link-more"
              onClick={() => document.getElementById('flux').scrollIntoView({ behavior: 'smooth' })}
            >
              Explorer le campus →
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. OCCUPATION DES SALLES ── */}
      <section id="flux" className="section-full">
        <div className="container reveal">
          <div className="section-title">
            <h2>Occupation des Salles</h2>
            <p>Visualisez en temps réel l'état des amphis et salles de TP.</p>
          </div>

          <div className="cards-grid">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                image={getRoomImage(room.name)}
                name={room.name}
                status="Libre"
                onClick={() => navigate(`/room/${room.id}`)}
              />
            ))}
          </div>

          <div className="more-info-container">
            <button className="link-more" onClick={() => navigate('/rooms')}>
              Voir toutes les salles →
            </button>
          </div>
        </div>
      </section>

      {/* ── 3. ÉQUIPEMENTS INTELLIGENTS ── */}
      <section className="section-full bg-accent">
        <div className="container reveal">
          <div className="section-title">
            <h2>Équipements Intelligents</h2>
            <p>La technologie IoT au service de la sécurité.</p>
          </div>

          <div className="cards-grid mt-4">
            {devices.map((device) => (
              <article
                key={device.id}
                className="smart-card device-preview-card"
                onClick={() => navigate(`/device/${device.id}`)}
              >
                <div className="smart-card-img-wrap">
                  <img
                    src={getDeviceImage(device.category_name)}
                    alt={device.name}
                    className="smart-card-img"
                  />
                </div>
                <span className="device-category-tag">{device.category_name}</span>
                <h3>{device.name}</h3>
                <p className="device-room-info">{device.room_name || 'Non assignée'}</p>
                <span className={`smart-badge smart-badge--${device.status?.toLowerCase()}`}>
                  {device.status}
                </span>
              </article>
            ))}
          </div>

          <div className="more-info-container">
            <button className="link-more" onClick={() => navigate('/devices')}>
              Voir tous les objets →
            </button>
          </div>
        </div>
      </section>

      {/* ── 4. PRÉVENTION & SÉCURITÉ ── */}
      <section id="prevention" className="section-full">
        <div className="container reveal">
          <div className="section-title text-center">
            <h2>Gestes Sécurité & Prévention</h2>
            <p>Protocoles d'évacuation pilotés par nos capteurs IoT.</p>
          </div>

          <div className="cards-grid">
            <article className="smart-card">
              <div className="smart-card-icon">🏃</div>
              <h3>Évacuation Intelligente</h3>
              <p>Nos capteurs orientent la foule vers les sorties les moins encombrées.</p>
            </article>
            <article className="smart-card">
              <div className="smart-card-icon">🚨</div>
              <h3>Alertes & Notifications</h3>
              <p>Toute anomalie détectée déclenche une notification immédiate.</p>
            </article>
            <article className="smart-card">
              <div className="smart-card-icon">🛡️</div>
              <h3>Points de Rassemblement</h3>
              <p>Le système compte automatiquement les personnes présentes.</p>
            </article>
          </div>

          <div className="more-info-container mt-5">
            <div className="quiz-integration-box">
              <p>Prêt à tester vos connaissances ?</p>
              <div className="button-group-harmonized">
                <button className="link-more" onClick={() => navigate('/quiz')}>Lancer le Quiz</button>
                <span className="separator">|</span>
                <button className="link-more" onClick={() => navigate('/prevention')}>En savoir plus</button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;