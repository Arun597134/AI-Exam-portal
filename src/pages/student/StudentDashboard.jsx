import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, PlayCircle, Award, Eye } from 'lucide-react';
import { apiFetch } from '../../api';

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedExams, fetchedResults] = await Promise.all([
          apiFetch('/exams'),
          apiFetch('/results/my')
        ]);
        setExams(fetchedExams);
        setResults(fetchedResults);
      } catch (error) {
        console.error('Failed to load student dashboard:', error);
      }
    };
    loadData();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Available Exams</h1>

      {exams.length === 0 ? (
        <div className="card text-center text-muted" style={{ padding: '3rem' }}>
          <BookOpen size={40} style={{ margin: '0 auto', opacity: 0.3 }} />
          <p className="mt-4">No exams available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2">
          {exams.map((exam) => (
            <div key={exam.id} className="card">
              <h2 className="font-bold mb-2" style={{ fontSize: '1.05rem' }}>{exam.title}</h2>
              <div className="flex items-center gap-4 text-muted mb-4" style={{ fontSize: '0.8rem' }}>
                <span className="flex items-center gap-1"><BookOpen size={14} /> {exam.questions.length} Questions</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {exam.duration} Min</span>
              </div>
              <Link to={`/student/exam/${exam.id}`}>
                <button className="flex justify-center items-center gap-2 m-0" style={{ width: '100%', padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
                  <PlayCircle size={15} /> Start Exam
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold mt-6 mb-4">Past Results</h2>

      {results.length === 0 ? (
        <p className="text-muted text-sm">You haven't taken any exams yet.</p>
      ) : (
        <div className="grid grid-cols-3">
          {results.map((r) => {
            const passed = parseFloat(r.score) >= 50;
            return (
              <div key={r.id} className="card text-center">
                <h3 className="font-bold mb-1" style={{ fontSize: '0.9rem' }}>{r.examTitle || 'Exam'}</h3>
                <p className="text-muted mb-2" style={{ fontSize: '0.7rem' }}>
                  {new Date(r.submittedAt).toLocaleDateString()}
                </p>
                <p className="font-bold mb-2" style={{ fontSize: '1.75rem', color: passed ? 'var(--secondary)' : 'var(--danger)' }}>
                  {r.score}%
                </p>
                <span className={`badge ${passed ? 'success' : 'danger'}`}>
                  {passed ? 'Passed' : 'Failed'}
                </span>
                <div className="flex justify-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <Link to={`/student/result/${r.id}`}>
                    <button className="secondary flex items-center gap-1" style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}>
                      <Eye size={12} /> View
                    </button>
                  </Link>
                  {passed && (
                    <button
                      className="success flex items-center gap-1"
                      style={{ padding: '0.3rem 0.7rem', fontSize: '0.7rem' }}
                      onClick={() => downloadCertificate(r)}
                    >
                      <Award size={12} /> Certificate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Generate and download certificate as an image
// Generate and download certificate as an image
const downloadCertificate = (result) => {
  const collegeLogo = new Image();
  collegeLogo.src = '/college brand banner.jpg';

  const drawAndDownload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 850);

    // Border
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1140, 790);

    // Inner border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, 1110, 760);

    // Decorative corner accents
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

    // Top subtitle
    if (collegeLogo.complete && collegeLogo.naturalWidth > 0) {
      const maxLogoWidth = 750;
      const maxLogoHeight = 100;
      const scale = Math.min(maxLogoWidth / collegeLogo.naturalWidth, maxLogoHeight / collegeLogo.naturalHeight);
      const logoWidth = collegeLogo.naturalWidth * scale;
      const logoHeight = collegeLogo.naturalHeight * scale;
      ctx.drawImage(collegeLogo, 600 - logoWidth / 2, 60, logoWidth, logoHeight);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '500 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AI EXAM PLATFORM', 600, 110);
    }

    // Gold award icon (circle)
    ctx.beginPath();
  ctx.arc(600, 170, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px serif';
  ctx.fillText('★', 600, 180);

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText('Intro to AI/ML Workshop', 600, 260);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(350, 285);
  ctx.lineTo(850, 285);
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2;
  ctx.stroke();

  // "This is to certify that"
  ctx.fillStyle = '#64748b';
  ctx.font = '400 18px Inter, sans-serif';
  ctx.fillText('This is to certify that', 600, 330);

  // Student name
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillText(result.studentName || 'Student', 600, 385);

  // Name underline
  ctx.beginPath();
  ctx.moveTo(300, 400);
  ctx.lineTo(900, 400);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Description
  ctx.fillStyle = '#475569';
  ctx.font = '400 18px Inter, sans-serif';
  ctx.fillText('has successfully passed the assessment', 600, 450);

  // Exam title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText(`"${result.examTitle || 'Online Exam'}"`, 600, 500);

  // Score
  ctx.fillStyle = '#475569';
  ctx.font = '400 16px Inter, sans-serif';
  ctx.fillText(`with a score of ${result.score}%`, 600, 545);

  // Score badge
  const badgeWidth = 120;
  const badgeX = 600 - badgeWidth / 2;
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(badgeX, 560, badgeWidth, 34, 17);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText(`SCORE: ${result.score}%`, 600, 582);

  // Date
  ctx.fillStyle = '#64748b';
  ctx.font = '400 14px Inter, sans-serif';
  const dateStr = new Date(result.submittedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  ctx.fillText(`Date: ${dateStr}`, 600, 640);

  // Correct / Total
  ctx.fillText(`Questions: ${result.correctAnswers || '—'}/${result.totalQuestions || '—'} correct`, 600, 665);

  // Integrity
  const intLabel = (result.cheatingScore || 0) === 0 ? 'Clean Exam — No Violations' : `Integrity: ${100 - (result.cheatingScore || 0)}%`;
  ctx.fillStyle = (result.cheatingScore || 0) === 0 ? '#10b981' : '#f59e0b';
  ctx.font = '500 13px Inter, sans-serif';
  ctx.fillText(`🛡️ ${intLabel}`, 600, 695);

  // Signature line left
  ctx.beginPath();
  ctx.moveTo(200, 760);
  ctx.lineTo(450, 760);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.font = '400 12px Inter, sans-serif';
    ctx.fillText('AI Exam Platform', 325, 780);

  // Signature line right  
  ctx.beginPath();
  ctx.moveTo(750, 760);
  ctx.lineTo(1000, 760);
  ctx.stroke();
  ctx.fillText('Authorized Signature', 875, 780);

  // Certificate ID
  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 10px Inter, sans-serif';
  ctx.fillText(`Certificate ID: ${result.id}`, 600, 815);

    // Download
    const link = document.createElement('a');
    link.download = `Certificate_${result.studentName?.replace(/\s+/g, '_') || 'Student'}_${result.examTitle?.replace(/\s+/g, '_') || 'Exam'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  collegeLogo.onload = drawAndDownload;
  collegeLogo.onerror = drawAndDownload;
};

export default StudentDashboard;
