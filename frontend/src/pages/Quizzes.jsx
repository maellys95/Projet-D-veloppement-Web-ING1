import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Quiz.css';

const Quizzes = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── PROTECTION ──
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

  // ── FETCH AVAILABLE QUIZZES FOR USER LEVEL (using EMAIL) ──
  useEffect(() => {
    if (!user) return;

    // Utilise l'EMAIL au lieu de l'ID
    fetch(`http://localhost:5000/quizzes/${user.email}`)
      .then(res => res.json())
      .then(data => {
        console.log('📚 Available quizzes:', data);
        setQuizzes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching quizzes:', err);
        setLoading(false);
      });
  }, [user]);

  const getLevelEmoji = (level) => {
    const emojis = {
      'débutant': '🌱',
      'intermédiaire': '📈',
      'avancé': '⭐',
      'expert': '👑'
    };
    return emojis[level?.toLowerCase()] || '📊';
  };

  const getLevelColor = (level) => {
    const colors = {
      'débutant': '#3b82f6',
      'intermédiaire': '#f59e0b',
      'avancé': '#f97316',
      'expert': '#ef4444'
    };
    return colors[level?.toLowerCase()] || '#666';
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Chargement des quiz...</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <section style={{ marginBottom: '40px' }}>
        <h1>Les Quiz SmartCampus 📚</h1>
        <p style={{ color: '#a0aec0', fontSize: '1.1rem' }}>
          Teste tes connaissances et progresse dans les niveaux!
        </p>
      </section>

      {/* Quizzes par niveau */}
      {['débutant', 'intermédiaire', 'avancé', 'expert'].map(difficulty => {
        const quizzesOfLevel = quizzes.filter(q => q.difficulty_level === difficulty);
        
        if (quizzesOfLevel.length === 0) return null;

        return (
          <section key={difficulty} style={{ marginBottom: '50px' }}>
            <h2 style={{ color: getLevelColor(difficulty), display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span>{getLevelEmoji(difficulty)}</span>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {quizzesOfLevel.map(quiz => (
                <div 
                  key={quiz.id}
                  style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8))',
                    border: `2px solid ${getLevelColor(quiz.difficulty_level)}`,
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  className="quiz-card-hover"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = `0 8px 16px ${getLevelColor(quiz.difficulty_level)}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Badge de complétion */}
                  {quiz.is_passed && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: '#4ade80',
                      color: '#000',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      ✅ Réussi
                    </div>
                  )}

                  {/* Titre */}
                  <h3 style={{ color: '#fff', marginBottom: '8px', marginTop: '5px' }}>
                    {quiz.title}
                  </h3>

                  {/* Description */}
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '12px', minHeight: '40px' }}>
                    {quiz.description}
                  </p>

                  {/* Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', marginBottom: '15px' }}>
                    <span style={{ color: '#a0aec0' }}>
                      📝 {quiz.total_questions} questions
                    </span>
                    <span style={{ color: getLevelColor(quiz.difficulty_level), fontWeight: 'bold' }}>
                      +{quiz.points_reward} pts
                    </span>
                  </div>

                  {/* Status */}
                  {quiz.is_completed && (
                    <p style={{ color: '#93c5fd', fontSize: '0.85rem', marginBottom: '12px' }}>
                      Meilleur score: {quiz.best_score}/{quiz.total_questions}
                    </p>
                  )}

                  {/* Button */}
                  <button
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: getLevelColor(quiz.difficulty_level),
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'opacity 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    {quiz.is_passed ? 'Refaire' : 'Démarrer'} →
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {quizzes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
          <p>Aucun quiz disponible pour votre niveau</p>
          <button className="btn-auth" onClick={() => navigate('/profile')} style={{ marginTop: '20px' }}>
            Retour au profil
          </button>
        </div>
      )}
    </div>
  );
};

export default Quizzes;