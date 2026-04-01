import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AntiCheatWrapper from '../../components/AntiCheatWrapper';
import WebcamMonitor from '../../components/WebcamMonitor';
import { Clock, AlertTriangle, ChevronRight, ChevronLeft, CheckCircle, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../../api';

const ExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [cheatLog, setCheatLog] = useState([]);
  const [recentAlert, setRecentAlert] = useState(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = await apiFetch(`/exams/${examId}`);
        setExam(data);
        setTimeLeft(data.duration * 60);
      } catch (error) {
        console.error('Error fetching exam:', error);
        navigate('/student');
      }
    };
    fetchExam();
  }, [examId, navigate]);

  useEffect(() => {
    if (submitted || !exam) return;
    if (timeLeft <= 0 && exam) {
      doSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, exam, submitted]);

  const handleCheatingDetected = (updatedLog, latestType) => {
    if (!latestType) return;
    setRecentAlert(latestType);
    setTimeout(() => setRecentAlert(null), 3000);
  };

  const handleOptionSelect = (qIndex, optionIndex) => {
    setAnswers({ ...answers, [qIndex]: optionIndex });
  };

  const doSubmit = async (isAuto = false) => {
    if (submitted) return;
    setSubmitted(true);
    setShowConfirm(false);

    let correctCount = 0;
    const questionReview = exam.questions.map((q, idx) => {
      const studentAnswer = answers[idx] !== undefined ? answers[idx] : -1;
      const isCorrect = studentAnswer === q.correctAnswer;
      if (isCorrect) correctCount++;

      return {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        studentAnswer: studentAnswer,
        isCorrect: isCorrect,
      };
    });

    const totalQuestions = exam.questions.length;
    const scorePercent = ((correctCount / totalQuestions) * 100).toFixed(1);
    const cheatingScore = Math.min((cheatLog.length * 12), 100);

    try {
      const resultData = {
        examId: exam.id,
        examTitle: exam.title,
        totalQuestions: totalQuestions,
        correctAnswers: correctCount,
        wrongAnswers: totalQuestions - correctCount,
        score: scorePercent,
        accuracy: scorePercent,
        cheatingScore: cheatingScore,
        incidents: cheatLog,
        questionReview: questionReview,
        isAutoSubmit: isAuto
      };

      const savedResult = await apiFetch('/results', {
        method: 'POST',
        body: JSON.stringify(resultData)
      });

      // Signal anti-cheat to stop logging
      if (window.__examSubmitting) {
        window.__examSubmitting.current = true;
      }

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Navigate to result page
      setTimeout(() => {
        navigate(`/student/result/${savedResult.id}`);
      }, 300);

    } catch (error) {
      alert('Failed to submit exam payload.');
      console.error(error);
      setSubmitted(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!exam) return <div className="p-4 text-center">Loading Exam...</div>;

  const currentQ = exam.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;

  return (
    <AntiCheatWrapper
      onCheatingDetected={handleCheatingDetected}
      cheatLog={cheatLog}
      setCheatLog={setCheatLog}
    >
      <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>

        {recentAlert && (
          <div className="cheating-alert">
            <AlertTriangle size={18} />
            Warning: {recentAlert}!
          </div>
        )}

        {/* Custom Submit Confirmation Modal */}
        {showConfirm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div className="card" style={{ maxWidth: 440, textAlign: 'center', padding: '2rem' }}>
              <ShieldAlert size={48} className="text-primary" style={{ margin: '0 auto 1rem' }} />
              <h2 className="text-xl font-bold mb-2">Submit Exam?</h2>
              <p className="text-muted mb-2" style={{ fontSize: '0.875rem' }}>
                You have answered <strong className="text-primary">{answeredCount}</strong> out of <strong>{exam.questions.length}</strong> questions.
              </p>
              {answeredCount < exam.questions.length && (
                <p className="text-danger mb-4" style={{ fontSize: '0.8rem' }}>
                  ⚠️ {exam.questions.length - answeredCount} question(s) are still unanswered!
                </p>
              )}
              <p className="text-muted mb-6" style={{ fontSize: '0.8rem' }}>
                You cannot change your answers after submission.
              </p>
              <div className="flex gap-4 justify-center">
                <button className="secondary" onClick={() => setShowConfirm(false)} style={{ padding: '0.6rem 1.5rem' }}>
                  Go Back
                </button>
                <button className="danger" onClick={() => doSubmit(false)} style={{ padding: '0.6rem 1.5rem' }}>
                  Yes, Submit Final
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{exam.title}</h1>
            <p className="text-muted text-sm">{answeredCount} of {exam.questions.length} answered</p>
          </div>
          <div className={`card flex items-center gap-2 ${timeLeft < 60 ? 'text-danger' : 'text-primary'}`}
            style={{ padding: '0.5rem 1rem', display: 'flex', border: timeLeft < 60 ? '2px solid var(--danger)' : '1px solid var(--border-color)' }}>
            <Clock size={18} />
            <span className="font-bold text-xl">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="exam-grid" style={{ display: 'grid', gap: '1.5rem', flex: 1 }}>
          {/* Navigation Panel */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="font-bold mb-4 text-sm">Navigator</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
              {exam.questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = currentQuestion === idx;
                return (
                  <button
                    key={idx}
                    style={{
                      padding: '0.4rem',
                      fontSize: '0.75rem',
                      background: isCurrent ? 'var(--primary)' : isAnswered ? 'var(--secondary)' : 'var(--bg-color)',
                      color: (isCurrent || isAnswered) ? 'white' : 'var(--text-main)',
                      border: '1px solid ' + (isCurrent ? 'var(--primary)' : isAnswered ? 'var(--secondary)' : 'var(--border-color)'),
                    }}
                    onClick={() => setCurrentQuestion(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1rem', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div className="flex items-center gap-2" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 12, height: 12, background: 'var(--secondary)', borderRadius: 3 }}></div> Answered
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 12, height: 12, background: 'var(--bg-color)', borderRadius: 3, border: '1px solid var(--border-color)' }}></div> Not answered
              </div>
            </div>

            <button className="danger" style={{ width: '100%', marginTop: '1rem', fontSize: '0.75rem', padding: '0.4rem 0.5rem' }} onClick={() => setShowConfirm(true)}>
              Submit Exam
            </button>
          </div>

          {/* Question Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p className="text-muted text-sm mb-2">Question {currentQuestion + 1} of {exam.questions.length}</p>
              <h2 className="font-bold mb-6" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>{currentQ.question}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {currentQ.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className={`option-box m-0 ${answers[currentQuestion] === optIdx ? 'selected' : ''}`}
                    style={{ marginBottom: 0, cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name={`q_${currentQuestion}`}
                      checked={answers[currentQuestion] === optIdx}
                      onChange={() => handleOptionSelect(currentQuestion, optIdx)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: '50%', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
                      background: answers[currentQuestion] === optIdx ? 'var(--primary)' : 'var(--bg-color)',
                      color: answers[currentQuestion] === optIdx ? 'white' : 'var(--text-muted)',
                      border: '1px solid ' + (answers[currentQuestion] === optIdx ? 'var(--primary)' : 'var(--border-color)'),
                    }}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between" style={{ marginTop: '2rem' }}>
              <button
                className="secondary flex items-center gap-2"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              {currentQuestion === exam.questions.length - 1 ? (
                <button
                  className="success flex items-center gap-2"
                  onClick={() => setShowConfirm(true)}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  Submit <CheckCircle size={14} />
                </button>
              ) : (
                <button
                  className="flex items-center gap-2"
                  onClick={() => setCurrentQuestion(prev => Math.min(exam.questions.length - 1, prev + 1))}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <WebcamMonitor
          onCheatingDetected={handleCheatingDetected}
          cheatLog={cheatLog}
          setCheatLog={setCheatLog}
        />
      </div>
    </AntiCheatWrapper>
  );
};

export default ExamPage;
