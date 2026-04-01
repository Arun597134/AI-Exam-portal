import React, { useState } from 'react';
import { apiFetch } from '../../api';
import { FileQuestion, Cpu, Save, Trash2, Zap, Hash, Pencil, Check, X } from 'lucide-react';

const LEVELS = [
  { value: 1, label: 'Level 1 — Easy', description: 'Basic, beginner-friendly questions', color: '#10b981' },
  { value: 2, label: 'Level 2 — Medium', description: 'Intermediate, application-based', color: '#f59e0b' },
  { value: 3, label: 'Level 3 — Hard', description: 'Advanced, expert-level questions', color: '#ef4444' },
];

const QUESTION_COUNTS = [10, 20, 30];

const QuestionGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [questions, setQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [level, setLevel] = useState(1);
  const [numQuestions, setNumQuestions] = useState(10);

  // Editing state: tracks which question is being edited
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState(null);

  const handleGenerate = async () => {
    if (!prompt) return alert('Please enter a prompt');

    setIsGenerating(true);
    try {
      const res = await apiFetch('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, numQuestions, level })
      });
      
      if (res.success && res.questions) {
        setQuestions([...questions, ...res.questions]);
      } else {
        alert('Failed to generate questions: ' + (res.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to generate questions. Is the backend running?');
      console.error(error);
    }
    setIsGenerating(false);
    setPrompt('');
  };

  const handlePublish = async () => {
    if (questions.length === 0) return alert('No questions generated');
    if (!examTitle) return alert('Enter exam title');

    try {
      const newExam = {
        id: Date.now().toString(),
        title: examTitle,
        duration: parseInt(duration),
        level: level,
        questions: questions
      };

      await apiFetch('/exams', {
        method: 'POST',
        body: JSON.stringify(newExam)
      });

      alert('Exam successfully published! Students can now take it.');
      setQuestions([]);
      setExamTitle('');
      setDuration(30);
    } catch (error) {
      alert('Failed to publish exam. Is the backend running?');
      console.error(error);
    }
  };

  // Start editing a question
  const startEditing = (idx) => {
    const q = questions[idx];
    setEditingIndex(idx);
    setEditData({
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
    });
  };

  // Save edits
  const saveEdit = () => {
    if (editingIndex === null || !editData) return;
    const updated = [...questions];
    updated[editingIndex] = {
      ...updated[editingIndex],
      question: editData.question,
      options: editData.options,
      correctAnswer: editData.correctAnswer,
    };
    setQuestions(updated);
    setEditingIndex(null);
    setEditData(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  // Update a specific option in edit mode
  const updateEditOption = (optIdx, value) => {
    const newOpts = [...editData.options];
    newOpts[optIdx] = value;
    setEditData({ ...editData, options: newOpts });
  };

  const selectedLevel = LEVELS.find(l => l.value === level);

  return (
    <div className="generator-container">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Cpu className="text-primary" /> AI Question Generator
      </h1>

      <div className="grid grid-cols-2 gap-6 generator-grid">
        {/* Left Sidebar */}
        <div className="card h-fit" style={{ position: 'sticky', top: 80 }}>
          <h2 className="text-xl font-bold mb-4">Exam Settings</h2>

          <label>Exam Title</label>
          <input
            type="text"
            placeholder="e.g. Midterm JavaScript"
            value={examTitle}
            onChange={e => setExamTitle(e.target.value)}
          />

          <label>Duration (Minutes)</label>
          <input
            type="number"
            min="1"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />

          {/* Difficulty Level */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <label className="flex items-center gap-2 mb-4">
              <Zap size={14} /> Difficulty Level
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {LEVELS.map(l => (
                <div
                  key={l.value}
                  onClick={() => setLevel(l.value)}
                  className="option-box m-0"
                  style={{
                    padding: '0.6rem 0.85rem',
                    marginBottom: 0,
                    cursor: 'pointer',
                    borderColor: level === l.value ? l.color : 'var(--border-color)',
                    background: level === l.value ? `${l.color}10` : 'var(--bg-color)',
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: level === l.value ? l.color : 'var(--border-color)', flexShrink: 0,
                  }}></div>
                  <div>
                    <div className="font-medium" style={{ fontSize: '0.8rem', color: level === l.value ? l.color : 'var(--text-main)' }}>
                      {l.label}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.65rem' }}>{l.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
            <label className="flex items-center gap-2 mb-4">
              <Hash size={14} /> Number of Questions
            </label>
            <div className="flex gap-2">
              {QUESTION_COUNTS.map(count => (
                <button
                  key={count}
                  type="button"
                  className={numQuestions === count ? '' : 'secondary'}
                  onClick={() => setNumQuestions(count)}
                  style={{ flex: 1, padding: '0.5rem' }}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
            <label>Topic / Concept Prompt</label>
            <textarea
              rows="5"
              placeholder="Enter a detailed topic description. Examples:&#10;• React Hooks (useState, useEffect, useContext)&#10;• Python OOP concepts — classes, inheritance, polymorphism&#10;• Data Structures — arrays, linked lists, trees, graphs"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              style={{ resize: 'vertical', minHeight: '100px' }}
            ></textarea>

            <div className="flex items-center gap-2 mb-4" style={{ fontSize: '0.75rem', color: selectedLevel.color }}>
              <Zap size={12} /> {selectedLevel.label} · {numQuestions} Questions
            </div>

            <button
              className="flex justify-center items-center gap-2 m-0"
              style={{ width: '100%' }}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <Cpu size={16} /> {isGenerating ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>

          {/* Publish */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1rem' }}>
            <button
              className="flex justify-center items-center gap-2 m-0 success"
              style={{ width: '100%' }}
              onClick={handlePublish}
              disabled={questions.length === 0}
            >
              <Save size={16} /> Publish Exam
            </button>
          </div>
        </div>

        {/* Right — Question List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Generated Questions ({questions.length})</h2>
            {questions.length > 0 && (
              <button className="danger" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => setQuestions([])}>
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>

          {questions.length === 0 ? (
            <div className="card text-center text-muted" style={{ padding: '4rem 2rem' }}>
              <FileQuestion size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
              <p className="mt-4">No questions generated yet. Enter a prompt to start.</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const isEditing = editingIndex === idx;

              return (
                <div key={idx} className="card mb-4">
                  {/* Question Header */}
                  <div className="flex justify-between items-start mb-4">
                    {isEditing ? (
                      <input
                        className="edit-input font-bold"
                        style={{ flex: 1, fontSize: '0.95rem', marginRight: '0.5rem' }}
                        value={editData.question}
                        onChange={e => setEditData({ ...editData, question: e.target.value })}
                      />
                    ) : (
                      <h3 className="font-bold" style={{ fontSize: '0.95rem', flex: 1 }}>
                        <span className="text-primary" style={{ marginRight: '0.4rem' }}>Q{idx + 1}.</span>
                        {q.question}
                      </h3>
                    )}

                    <div className="flex gap-2" style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
                      {isEditing ? (
                        <>
                          <button className="success" style={{ padding: '0.3rem 0.6rem' }} onClick={saveEdit}>
                            <Check size={14} />
                          </button>
                          <button className="secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={cancelEdit}>
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => startEditing(idx)}>
                            <Pencil size={14} className="text-primary" />
                          </button>
                          <button className="secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => {
                            const updated = [...questions];
                            updated.splice(idx, 1);
                            setQuestions(updated);
                          }}>
                            <Trash2 size={14} className="text-danger" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {(isEditing ? editData.options : q.options).map((opt, optIdx) => {
                      const isCorrect = isEditing ? editData.correctAnswer === optIdx : q.correctAnswer === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`option-box m-0 ${isCorrect ? 'correct' : ''}`}
                          style={{ padding: '0.6rem 0.8rem', fontSize: '0.825rem', marginBottom: 0, cursor: isEditing ? 'pointer' : 'default' }}
                          onClick={() => {
                            if (isEditing) setEditData({ ...editData, correctAnswer: optIdx });
                          }}
                        >
                          <span className={`badge ${isCorrect ? 'success' : 'primary'}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          {isEditing ? (
                            <input
                              className="edit-input"
                              style={{ flex: 1, margin: 0, fontSize: '0.8rem' }}
                              value={opt}
                              onClick={e => e.stopPropagation()}
                              onChange={e => updateEditOption(optIdx, e.target.value)}
                            />
                          ) : (
                            <span style={{ flex: 1 }}>{opt}</span>
                          )}
                          {isCorrect && (
                            <span className="text-success font-bold" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>✓ Correct</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {isEditing && (
                    <p className="text-muted mt-2" style={{ fontSize: '0.7rem' }}>
                      💡 Click on an option card to set it as the correct answer.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionGenerator;
