import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileQuestion, Award, AlertTriangle, Settings, Trash2, Clock, BarChart3, Eye } from 'lucide-react';
import { apiFetch } from '../../api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, averageScore: 0, cheatingIncidents: 0, totalExams: 0, totalResponses: 0 });
  const [exams, setExams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [cheatingReport, setCheatingReport] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedExamFilter, setSelectedExamFilter] = useState('all');

  const loadData = async () => {
    try {
      // Fetch all required data concurrently from the backend
      const [fetchedExams, fetchedResults, fetchedStudents] = await Promise.all([
        apiFetch('/exams'),
        apiFetch('/results'),
        apiFetch('/auth/students')
      ]);

      setExams(fetchedExams);
      setSubmissions(fetchedResults);

      let totalScore = 0;
      let cheatingCount = 0;
      fetchedResults.forEach(r => {
        totalScore += parseFloat(r.score || 0);
        if (r.cheatingScore > 30) cheatingCount++;
      });

      setStats({
        totalStudents: fetchedStudents.length,
        averageScore: fetchedResults.length > 0 ? (totalScore / fetchedResults.length).toFixed(1) : 0,
        cheatingIncidents: cheatingCount,
        totalExams: fetchedExams.length,
        totalResponses: fetchedResults.length,
      });

      // Leaderboard — Best of top 5 unique students by highest score
      const studentBest = {};
      fetchedResults.forEach(r => {
        const key = r.studentEmail || r.studentName;
        const score = parseFloat(r.score || 0);
        if (!studentBest[key] || score > studentBest[key].score) {
          studentBest[key] = { studentName: r.studentName, score, accuracy: r.accuracy, examTitle: r.examTitle || 'Exam', cheatingScore: r.cheatingScore || 0 };
        }
      });
      const top5 = Object.values(studentBest).sort((a, b) => b.score - a.score).slice(0, 5);
      setLeaderboard(top5);

      // Cheating Report
      const flagged = fetchedResults.filter(r => r.cheatingScore > 0)
        .sort((a, b) => b.cheatingScore - a.cheatingScore).slice(0, 10);
      setCheatingReport(flagged);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const deleteExam = async (examId) => {
    if (!window.confirm('Delete this exam and all its results?')) return;
    try {
      await apiFetch(`/exams/${examId}`, { method: 'DELETE' });
      loadData(); // Reload stats and lists after delete
    } catch (error) {
      alert('Failed to delete exam');
      console.error(error);
    }
  };

  const filteredSubmissions = selectedExamFilter === 'all'
    ? submissions
    : submissions.filter(s => s.examId === selectedExamFilter);

  // Compute per-exam response count
  const examResponseCount = {};
  submissions.forEach(s => {
    examResponseCount[s.examId] = (examResponseCount[s.examId] || 0) + 1;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Link to="/admin/generator">
          <button className="flex items-center gap-2"><FileQuestion size={16} /> Generate New Exam</button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {[
          { icon: <Users size={22} />, label: 'Students', value: stats.totalStudents, color: '#4f46e5' },
          { icon: <FileQuestion size={22} />, label: 'Exams', value: stats.totalExams, color: '#10b981' },
          { icon: <BarChart3 size={22} />, label: 'Responses', value: stats.totalResponses, color: '#8b5cf6' },
          { icon: <Award size={22} />, label: 'Avg Score', value: `${stats.averageScore}%`, color: '#0ea5e9' },
          { icon: <AlertTriangle size={22} />, label: 'Cheating', value: stats.cheatingIncidents, color: '#ef4444' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <div className="stat-icon" style={{ background: `${s.color}10`, margin: '0 auto 0.5rem' }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
            <p className="font-bold text-xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Published Exams */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileQuestion className="text-primary" size={18} /> Published Exams
        </h2>
        {exams.length === 0 ? (
          <p className="text-muted text-sm">No exams published yet.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr><th>Title</th><th>Questions</th><th>Duration</th><th>Responses</th><th>Created</th><th style={{ textAlign: 'right' }}>Action</th></tr>
              </thead>
              <tbody>
                {exams.map(exam => (
                  <tr key={exam.id}>
                    <td className="font-medium">{exam.title}</td>
                    <td>{exam.questions.length}</td>
                    <td><Clock size={13} className="text-muted" style={{ display: 'inline', marginRight: 4 }} />{exam.duration}m</td>
                    <td><span className="badge primary">{examResponseCount[exam.id] || 0} responses</span></td>
                    <td className="text-muted text-sm">{new Date(exam.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="danger" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }} onClick={() => deleteExam(exam.id)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Submissions */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Eye className="text-primary" size={18} /> Student Submissions
          </h2>
          <select
            value={selectedExamFilter}
            onChange={e => setSelectedExamFilter(e.target.value)}
            style={{ width: 'auto', marginBottom: 0, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            <option value="all">All Exams</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        {filteredSubmissions.length === 0 ? (
          <p className="text-muted text-sm">No submissions received yet.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr><th>#</th><th>Student</th><th>Exam</th><th>Score</th><th>Correct</th><th>Integrity</th><th>Submitted</th></tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((s, i) => {
                  const sc = parseFloat(s.score || 0);
                  return (
                    <tr key={s.id}>
                      <td className="text-muted">{i + 1}</td>
                      <td>
                        <div className="font-medium" style={{ fontSize: '0.85rem' }}>{s.studentName}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>{s.studentEmail || ''}</div>
                      </td>
                      <td className="text-sm">{s.examTitle || '—'}</td>
                      <td>
                        <span className={`font-bold ${sc >= 50 ? 'text-success' : 'text-danger'}`}>{s.score}%</span>
                      </td>
                      <td className="text-sm">
                        <span className="text-success font-bold">{s.correctAnswers || '—'}</span>
                        <span className="text-muted"> / {s.totalQuestions || '—'}</span>
                      </td>
                      <td>
                        <span className={`badge ${s.cheatingScore > 30 ? 'danger' : s.cheatingScore > 0 ? 'warning' : 'success'}`}>
                          {s.cheatingScore > 30 ? 'Flagged' : s.cheatingScore > 0 ? 'Minor' : 'Clean'}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(s.submittedAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leaderboard + Cheating Report side by side */}
      <div className="grid grid-cols-2 mb-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="text-success" size={18} /> 🏆 Leaderboard — Top 5
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-muted text-sm">No results yet.</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead><tr><th>Rank</th><th>Student</th><th>Best Score</th><th>Exam</th></tr></thead>
                <tbody>
                  {leaderboard.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: '50%', fontSize: '0.75rem', fontWeight: 700,
                          background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : 'var(--bg-color)',
                          color: index < 3 ? 'white' : 'var(--text-main)',
                        }}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="font-medium">{row.studentName}</td>
                      <td className="text-success font-bold">{row.score}%</td>
                      <td className="text-muted text-sm">{row.examTitle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-danger" size={18} /> Cheating Report
          </h2>
          {cheatingReport.length === 0 ? (
            <p className="text-muted text-sm">No cheating incidents detected! 🎉</p>
          ) : (
            <div className="table-responsive">
              <table>
                <thead><tr><th>Student</th><th>Score</th><th>Severity</th><th>Incidents</th></tr></thead>
                <tbody>
                  {cheatingReport.map(row => (
                    <tr key={row.id}>
                      <td className="font-medium text-sm">{row.studentName}</td>
                      <td className="text-sm">{row.score}%</td>
                      <td>
                        <span className={`badge ${row.cheatingScore > 30 ? 'danger' : 'warning'}`}>
                          {row.cheatingScore}%
                        </span>
                      </td>
                      <td className="text-muted text-sm">{(row.incidents || []).length} events</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Removed local API settings card */}
    </div>
  );
};

export default AdminDashboard;
