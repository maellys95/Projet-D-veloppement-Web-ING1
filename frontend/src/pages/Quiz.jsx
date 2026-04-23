import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Quiz.css';

const Quiz = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  const questions = [
    {
      questionText: "Réduire le chauffage de 1°C dans une salle permet d'économiser environ :",
      answerOptions: [
        { answerText: '2%', isCorrect: false },
        { answerText: '7%', isCorrect: true },
        { answerText: '12%', isCorrect: false },
        { answerText: '20%', isCorrect: false },
      ],
    },
    {
      questionText: "Quel geste numérique a le plus d'impact immédiat sur la consommation du campus ?",
      answerOptions: [
        { answerText: 'Supprimer 10 e-mails', isCorrect: false },
        { answerText: 'Utiliser le mode sombre', isCorrect: false },
        { answerText: 'Éteindre complètement son écran de PC', isCorrect: true },
        { answerText: 'Vider sa corbeille', isCorrect: false },
      ],
    },
    {
      questionText: "Pourquoi privilégier une gourde aux bouteilles en plastique à la cafétéria ?",
      answerOptions: [
        { answerText: 'Pour le style', isCorrect: false },
        { answerText: 'L\'eau est plus froide', isCorrect: false },
        { answerText: 'Réduire les déchets plastiques à usage unique', isCorrect: true },
        { answerText: 'C\'est obligatoire', isCorrect: false },
      ],
    },
    {
      questionText: "Que faire si vous détectez une anomalie sur un capteur IoT via l'app ?",
      answerOptions: [
        { answerText: 'Ignorer le problème', isCorrect: false },
        { answerText: 'Le signaler via l\'onglet dédié', isCorrect: true },
        { answerText: 'Essayer de le réparer soi-même', isCorrect: false },
        { answerText: 'Attendre la fin du semestre', isCorrect: false },
      ],
    }
  ];

  const handleAnswerClick = (isCorrectOption, index) => {
    if (selectedAnswer !== null) return; // Empêche de cliquer deux fois

    setSelectedAnswer(index);
    setIsCorrect(isCorrectOption);

    if (isCorrectOption) {
      setScore(score + 1);
    }

    // Petit délai pour voir si on a juste ou faux avant de passer à la suite
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setShowScore(true);
      }
    }, 1000);
  };

  return (
    <div className="quiz-wrapper">
      <div className="quiz-card">
        {showScore ? (
          <div className="score-section">
            <h2>Résultat final 🏆</h2>
            <div className="score-circle">
                <span className="score-number">{score}</span>
                <span className="score-total">/ {questions.length}</span>
            </div>
            <p>{score === questions.length ? "Parfait ! Tu es un véritable ambassadeur éco-responsable." : "Bravo ! Continue tes efforts pour le campus."}</p>
            <div className="quiz-actions">
                <button className="btn-auth" onClick={() => navigate('/profile')}>Voir mon profil</button>
                <button className="btn-stats" onClick={() => window.location.reload()}>Recommencer</button>
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
              {questions[currentQuestion].questionText}
            </div>

            <div className="answer-section">
              {questions[currentQuestion].answerOptions.map((option, index) => (
                <button
                  key={index}
                  className={`answer-button ${
                    selectedAnswer === index 
                      ? (option.isCorrect ? 'correct' : 'incorrect') 
                      : ''
                  }`}
                  onClick={() => handleAnswerClick(option.isCorrect, index)}
                  disabled={selectedAnswer !== null}
                >
                  {option.answerText}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Quiz;