import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './css/Quiz.css';

const Quiz = () => {
  const navigate = useNavigate();
  const { quizId } = useParams();
  
  const [user, setUser] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextQuizAvailable, setNextQuizAvailable] = useState(null);

  // ── PROTECTION ──
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

  // ── FETCH QUIZ DATA (using EMAIL) ──
  useEffect(() => {
    if (!user || !quizId) return;

    // Utilise l'EMAIL au lieu de l'ID
    fetch(`http://localhost:5000/quiz/${quizId}/${user.email}`)
      .then(res => res.json())
      .then(data => {
        console.log('📚 Quiz data:', data);
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching quiz:', err);
        setLoading(false);
      });
  }, [user, quizId]);

  const handleAnswerClick = (answerIndex) => {
    if (selectedAnswer !== null) return;

    const selectedAnswerOption = questions[currentQuestion].answers[answerIndex];
    setSelectedAnswer(answerIndex);
    setIsCorrect(selectedAnswerOption.is_correct);

    if (selectedAnswerOption.is_correct) {
      setScore(score + 1);
    }

    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        submitQuizResult(score + (selectedAnswerOption.is_correct ? 1 : 0), questions.length);
      }
    }, 1000);
  };

  // ── SUBMIT QUIZ RESULT (using EMAIL) ──
  const submitQuizResult = async (finalScore, totalQuestions) => {
    const isPassed = finalScore === totalQuestions;

    try {
      const response = await fetch(`http://localhost:5000/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,  // Utilise EMAIL au lieu de userID
          score: finalScore,
          totalQuestions: totalQuestions
        })
      });

      const result = await response.json();
      console.log('✅ Quiz submitted:', result);

      if (isPassed) {
        fetchNextQuiz();
      }

      setShowScore(true);
    } catch (err) {
      console.error('❌ Error submitting quiz:', err);
      setShowScore(true);
    }
  };

  // ── FETCH NEXT QUIZ IF PASSED (using EMAIL) ──
  const fetchNextQuiz = async () => {
    try {
      const response = await fetch(`http://localhost:5000/quiz/next/${user.email}`);  // Utilise EMAIL
      const data = await response.json();
      console.log('🎯 Next quiz info:', data);
      
      if (data.canUnlock) {
        const quizzesRes = await fetch(`http://localhost:5000/quizzes/${user.email}`);  // Utilise EMAIL
        const quizzes = await quizzesRes.json();
        
        const nextLevel = data.nextLevel;
        const nextQuiz = quizzes.find(q => 
          q.difficulty_level === nextLevel && !q.is_passed
        );
        
        if (nextQuiz) {
          setNextQuizAvailable(nextQuiz);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching next quiz:', err);
    }
  };

  if (loading) {
    return <div className="quiz-wrapper"><p>Chargement du quiz...</p></div>;
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="quiz-wrapper">
        <div className="quiz-card">
          <p>❌ Quiz non trouvé</p>
          <button className="btn-auth" onClick={() => navigate('/quizzes')}>
            Retour aux quiz
          </button>
        </div>
      </div>
    );
  }

  const isPassed = score === questions.length;

  return (
    <div className="quiz-wrapper">
      <div className="quiz-card">
        {/* Quiz Header */}
        <div className="quiz-header" style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2>{quiz.title}</h2>
          <p style={{ color: '#a0aec0', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
            Niveau: <span style={{ color: getLevelColor(quiz.difficulty_level), fontWeight: 'bold', textTransform: 'capitalize' }}>
              {quiz.difficulty_level}
            </span> • {quiz.points_reward} pts
          </p>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '5px 0 0 0' }}>
            {quiz.description}
          </p>
        </div>

        {showScore ? (
          <div className="score-section">
            <h2>Résultat final 🏆</h2>
            <div className="score-circle">
              <span className="score-number">{score}</span>
              <span className="score-total">/ {questions.length}</span>
            </div>
            
            {isPassed ? (
              <>
                <p style={{ color: '#4ade80', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  ✅ Parfait ! Tu as réussi ce quiz!
                </p>
                <p style={{ color: '#93c5fd', marginTop: '10px' }}>
                  +{quiz.points_reward} pts bonus ajoutés à ton compte
                </p>
                {nextQuizAvailable && (
                  <p style={{ color: '#fbbf24', marginTop: '15px', fontStyle: 'italic' }}>
                    🎯 Un nouveau quiz te attend: <strong>{nextQuizAvailable.title}</strong>!
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ color: '#fbbf24', fontSize: '1rem' }}>
                  Encore un effort! Continue tes progrès pour le campus. 💪
                </p>
                <p style={{ color: '#cbd5e1', marginTop: '10px', fontSize: '0.9rem' }}>
                  Tu as besoin de 100% pour débloquer le prochain niveau.
                </p>
              </>
            )}

            <div className="quiz-actions">
              {nextQuizAvailable && isPassed ? (
                <button 
                  className="btn-auth" 
                  onClick={() => navigate(`/quiz/${nextQuizAvailable.id}`)}
                  style={{ backgroundColor: '#4ade80' }}
                >
                  Démarrer le prochain quiz →
                </button>
              ) : (
                <button className="btn-auth" onClick={() => navigate('/quizzes')}>
                  Voir tous les quiz
                </button>
              )}
              <button className="btn-stats" onClick={() => navigate('/profile')}>
                Voir mon profil
              </button>
              {!isPassed && (
                <button className="btn-stats" onClick={() => {
                  setCurrentQuestion(0);
                  setScore(0);
                  setShowScore(false);
                  setSelectedAnswer(null);
                  setIsCorrect(null);
                }}>
                  Recommencer
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="question-header">
              <h3>Question {currentQuestion + 1}<span>/{questions.length}</span></h3>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="question-text">
              {questions[currentQuestion].question_text}
            </div>

            <div className="answer-section">
              {questions[currentQuestion].answers.map((answer, index) => (
                <button
                  key={index}
                  className={`answer-button ${
                    selectedAnswer === index 
                      ? (answer.is_correct ? 'correct' : 'incorrect') 
                      : ''
                  }`}
                  onClick={() => handleAnswerClick(index)}
                  disabled={selectedAnswer !== null}
                >
                  {answer.answer_text}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
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

export default Quiz;