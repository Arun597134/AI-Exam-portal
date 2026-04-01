import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, AlertTriangle, ArrowLeft, ShieldAlert, CheckCircle, XCircle, Brain, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { apiFetch } from '../../api';

// Generate AI-style feedback for wrong answers locally
const generateFeedback = (question, options, correctAnswer, studentAnswer) => {
  const correctOption = options[correctAnswer];
  const studentOption = studentAnswer >= 0 ? options[studentAnswer] : 'Not answered';

  if (studentAnswer < 0) {
    return `You didn't answer this question. The correct answer is "${correctOption}". Make sure to attempt all questions even if unsure — there's no negative marking!`;
  }

  return `You selected "${studentOption}", but the correct answer is "${correctOption}". 

💡 Explanation: "${correctOption}" is correct because it accurately represents the concept being asked about. "${studentOption}" is a common misconception or relates to a different concept. 

📖 Tip: Review this topic carefully. Understanding the difference between these options will strengthen your fundamentals and help avoid similar mistakes in future assessments.`;
};

// Certificate download using Canvas
const downloadCertificate = (result) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1200, 850);

  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 1140, 790);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(45, 45, 1110, 760);

  const drawCorner = (x, y, dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * 40);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * 40, y);
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 4;
    ctx.stroke();
  };
  drawCorner(50, 50, 1, 1);
  drawCorner(1150, 50, -1, 1);
  drawCorner(50, 800, 1, -1);
  drawCorner(1150, 800, -1, -1);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AI EXAM PLATFORM', 600, 110);

  ctx.beginPath();
  ctx.arc(600, 170, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px serif';
  ctx.fillText('★', 600, 180);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 42px Georgia, serif';
  ctx.fillText('Certificate of Achievement', 600, 260);

  ctx.beginPath();
  ctx.moveTo(350, 285);
  ctx.lineTo(850, 285);
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '400 18px Inter, sans-serif';
  ctx.fillText('This is to certify that', 600, 330);

  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillText(result.studentName || 'Student', 600, 385);

  ctx.beginPath();
  ctx.moveTo(300, 400);
  ctx.lineTo(900, 400);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '400 18px Inter, sans-serif';
  ctx.fillText('has successfully passed the assessment', 600, 450);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText(`"${result.examTitle || 'Online Exam'}"`, 600, 500);

  ctx.fillStyle = '#475569';
  ctx.font = '400 16px Inter, sans-serif';
  ctx.fillText(`with a score of ${result.score}%`, 600, 545);

  const badgeWidth = 120;
  const badgeX = 600 - badgeWidth / 2;
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(badgeX, 560, badgeWidth, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText(`SCORE: ${result.score}%`, 600, 582);

  const dateStr = new Date(result.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillStyle = '#64748b';
  ctx.font = '400 14px Inter, sans-serif';
  ctx.fillText(`Date: ${dateStr}`, 600, 640);
  ctx.fillText(`Questions: ${result.correctAnswers || '—'}/${result.totalQuestions || '—'} correct`, 600, 665);

  const intLabel = (result.cheatingScore || 0) === 0 ? 'Clean Exam — No Violations' : `Integrity: ${100 - (result.cheatingScore || 0)}%`;
  ctx.fillStyle = (result.cheatingScore || 0) === 0 ? '#10b981' : '#f59e0b';
  ctx.font = '500 13px Inter, sans-serif';
  ctx.fillText(`🛡️ ${intLabel}`, 600, 695);

  ctx.beginPath(); ctx.moveTo(200, 760); ctx.lineTo(450, 760);
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#64748b'; ctx.font = '400 12px Inter, sans-serif';
  ctx.fillText('AI Exam Platform', 325, 780);

  ctx.beginPath(); ctx.moveTo(750, 760); ctx.lineTo(1000, 760); ctx.stroke();
  ctx.fillText('Authorized Signature', 875, 780);

  ctx.fillStyle = '#94a3b8'; ctx.font = '400 10px Inter, sans-serif';
  ctx.fillText(`Certificate ID: ${result.id}`, 600, 815);

  const link = document.createElement('a');
  link.download = `Certificate_${result.studentName?.replace(/\s+/g, '_') || 'Student'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

const ResultPage = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await apiFetch(`/results/${resultId}`);
        setResult(data);
      } catch (error) {
        console.error('Error fetching result:', error);
      }
    };
    fetchResult();
  }, [resultId]);

  const toggleQuestion = (idx) => {
    setExpandedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (!result) return <div className="p-4 text-center">Loading result...</div>;

  const score = parseFloat(result.score);
  const passed = score >= 50;
  const risk = result.cheatingScore === 0
    ? { label: 'Clean', color: 'success' }
    : result.cheatingScore < 40
    ? { label: 'Moderate', color: 'warning' }
    : { label: 'High Risk', color: 'danger' };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <Link to="/student" className="flex items-center gap-2 mb-6 text-muted" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* Score Summary Card */}
      <div className="card mb-6">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', textAlign: 'center' }}>
          <div>
            <Award size={36} className={passed ? 'text-success' : 'text-danger'} style={{ margin: '0 auto 0.5rem' }} />
            <p className="text-muted" style={{ fontSize: '0.75rem' }}>Final Score</p>
            <p className={`font-bold ${passed ? 'text-success' : 'text-danger'}`} style={{ fontSize: '2.25rem' }}>{result.score}%</p>
            <span className={`badge ${passed ? 'success' : 'danger'}`}>{passed ? 'PASSED' : 'FAILED'}</span>
          </div>
          <div style={{ borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
              <div>
                <CheckCircle size={24} className="text-success" style={{ margin: '0 auto 0.25rem' }} />
                <p className="text-muted" style={{ fontSize: '0.7rem' }}>Correct</p>
                <p className="font-bold text-success" style={{ fontSize: '1.5rem' }}>{result.correctAnswers || 0}</p>
              </div>
              <div>
                <XCircle size={24} className="text-danger" style={{ margin: '0 auto 0.25rem' }} />
                <p className="text-muted" style={{ fontSize: '0.7rem' }}>Wrong</p>
                <p className="font-bold text-danger" style={{ fontSize: '1.5rem' }}>{result.wrongAnswers || 0}</p>
              </div>
            </div>
            <p className="text-muted mt-2" style={{ fontSize: '0.7rem' }}>out of {result.totalQuestions || '—'} questions</p>
          </div>
          <div>
            <ShieldAlert size={36} className={`text-${risk.color}`} style={{ margin: '0 auto 0.5rem' }} />
            <p className="text-muted" style={{ fontSize: '0.75rem' }}>Integrity</p>
            <p className="font-bold" style={{ fontSize: '1.35rem', color: risk.color === 'success' ? 'var(--secondary)' : risk.color === 'warning' ? 'var(--warning)' : 'var(--danger)' }}>{risk.label}</p>
            <span className={`badge ${risk.color}`}>{result.cheatingScore}% flagged</span>
          </div>
        </div>

        {/* Download Certificate for Passed Students */}
        {passed && (
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.25rem', paddingTop: '1.25rem', textAlign: 'center' }}>
            <p className="text-success font-bold mb-2" style={{ fontSize: '0.85rem' }}>🎉 Congratulations! You passed the exam.</p>
            <button
              className="success flex justify-center items-center gap-2"
              style={{ margin: '0 auto', padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}
              onClick={() => downloadCertificate(result)}
            >
              <Download size={15} /> Download Certificate
            </button>
          </div>
        )}
      </div>

      {/* Detailed Question Review */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Brain className="text-primary" size={20} /> Detailed Question Review
        </h2>
        <p className="text-muted text-sm mb-6">Click on any incorrect question to see AI-powered feedback and explanation.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(result.questionReview || []).map((qr, idx) => {
            const isExpanded = expandedQuestions[idx];
            const studentLabel = qr.studentAnswer >= 0 ? String.fromCharCode(65 + qr.studentAnswer) : '—';
            const correctLabel = String.fromCharCode(65 + qr.correctAnswer);

            return (
              <div
                key={idx}
                style={{
                  border: `1.5px solid ${qr.isCorrect ? 'var(--secondary)' : 'var(--danger)'}`,
                  borderRadius: 'var(--radius)',
                  background: qr.isCorrect ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)',
                  overflow: 'hidden',
                }}
              >
                {/* Question Header — always visible */}
                <div
                  onClick={() => !qr.isCorrect && toggleQuestion(idx)}
                  style={{
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: qr.isCorrect ? 'default' : 'pointer',
                  }}
                >
                  {qr.isCorrect ? (
                    <CheckCircle size={20} className="text-success" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={20} className="text-danger" style={{ flexShrink: 0 }} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-medium" style={{ fontSize: '0.85rem' }}>
                      <span className="text-muted" style={{ marginRight: '0.3rem' }}>Q{idx + 1}.</span>
                      {qr.question}
                    </p>
                  </div>

                  <div className="flex items-center gap-4" style={{ flexShrink: 0, fontSize: '0.75rem' }}>
                    <div>
                      <span className="text-muted">Your: </span>
                      <span className={`font-bold ${qr.isCorrect ? 'text-success' : 'text-danger'}`}>{studentLabel}</span>
                    </div>
                    <div>
                      <span className="text-muted">Ans: </span>
                      <span className="font-bold text-success">{correctLabel}</span>
                    </div>
                    {!qr.isCorrect && (
                      isExpanded ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />
                    )}
                  </div>
                </div>

                {/* Expanded AI Feedback — only for wrong answers */}
                {!qr.isCorrect && isExpanded && (
                  <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border-color)' }}>
                    {/* Options Display */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.75rem', marginBottom: '1rem' }}>
                      {qr.options.map((opt, optIdx) => {
                        const isCorrectOpt = optIdx === qr.correctAnswer;
                        const isStudentChoice = optIdx === qr.studentAnswer;
                        let bg = 'var(--bg-color)';
                        let borderCol = 'var(--border-color)';

                        if (isCorrectOpt) { bg = 'rgba(16,185,129,0.08)'; borderCol = 'var(--secondary)'; }
                        else if (isStudentChoice) { bg = 'rgba(239,68,68,0.08)'; borderCol = 'var(--danger)'; }

                        return (
                          <div key={optIdx} style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius)',
                            border: `1.5px solid ${borderCol}`,
                            background: bg,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                          }}>
                            <span className={`badge ${isCorrectOpt ? 'success' : isStudentChoice ? 'danger' : 'primary'}`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span style={{ flex: 1 }}>{opt}</span>
                            {isCorrectOpt && <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 700 }}>✓ CORRECT</span>}
                            {isStudentChoice && !isCorrectOpt && <span style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 700 }}>✗ YOUR PICK</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Feedback */}
                    <div style={{
                      background: 'rgba(79,70,229,0.04)',
                      border: '1px solid rgba(79,70,229,0.15)',
                      borderRadius: 'var(--radius)',
                      padding: '1rem',
                    }}>
                      <p className="flex items-center gap-2 font-bold text-sm mb-2" style={{ color: 'var(--primary)' }}>
                        <Brain size={16} /> AI Feedback
                      </p>
                      <p style={{ fontSize: '0.825rem', lineHeight: 1.8, color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>
                        {generateFeedback(qr.question, qr.options, qr.correctAnswer, qr.studentAnswer)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(!result.questionReview || result.questionReview.length === 0) && (
          <p className="text-muted text-sm">Detailed question data is not available for this exam result.</p>
        )}
      </div>

      {/* Cheating Incidents */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-danger" size={20} /> Incident Report ({(result.incidents || []).length} events)
        </h2>

        {(!result.incidents || result.incidents.length === 0) ? (
          <p className="text-success flex items-center gap-2 font-bold text-sm">
            <ShieldAlert size={18} /> No irregularities detected during the exam. Great job!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {result.incidents.map((inc, idx) => (
              <div key={idx} className="flex justify-between items-center" style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius)', padding: '0.6rem 0.85rem' }}>
                <span className="text-danger font-medium text-sm">{inc.type}</span>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(inc.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPage;
