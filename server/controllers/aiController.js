// Using built-in global fetch (Node 18+)

const LEVEL_DESCRIPTIONS = {
  1: 'easy, basic, beginner-friendly. Use simple terminology and straightforward concepts.',
  2: 'intermediate, moderately challenging. Include application-based and conceptual questions.',
  3: 'advanced, difficult, expert-level. Include tricky, analytical, and deep-understanding questions.'
};

const MODELS_TO_TRY = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
  'gemini-pro-latest'
];

const callGeminiREST = async (apiKey, modelName, prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || response.statusText;
    throw new Error(`${response.status} — ${errMsg}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
};

const parseQuestionJSON = (text) => {
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* continue */ }
  const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  throw new Error('Could not parse AI response');
};

// ============================================================
// SMART LOCAL QUESTION GENERATOR (offline fallback)
// ============================================================

const QUESTION_TEMPLATES = {
  // Generic templates that work for any topic
  generic: [
    { q: "Which of the following best describes {topic}?", opts: ["A systematic approach to {topic}", "An unrelated concept to computing", "A type of hardware device", "A mathematical theorem only"], correct: 0 },
    { q: "What is the primary purpose of {topic}?", opts: ["To complicate processes", "To solve specific problems in its domain", "To replace all other technologies", "It has no practical purpose"], correct: 1 },
    { q: "Which statement about {topic} is TRUE?", opts: ["It was invented in the 1800s", "It has no real-world applications", "It is widely used in modern technology", "It is only theoretical and never implemented"], correct: 2 },
    { q: "What is a key advantage of using {topic}?", opts: ["It makes systems slower", "It increases complexity unnecessarily", "It has no benefits", "It improves efficiency and productivity"], correct: 3 },
    { q: "In the context of {topic}, what does a beginner need to learn first?", opts: ["The fundamental concepts and basics", "Only advanced topics", "Nothing, it's self-explanatory", "Hardware engineering"], correct: 0 },
  ],

  programming: [
    { q: "What is a variable in programming?", opts: ["A named storage location for data", "A type of loop", "A function declaration", "A syntax error"], correct: 0 },
    { q: "Which of the following is a valid data type?", opts: ["paragraph", "integer", "command", "folder"], correct: 1 },
    { q: "What does a function/method do in programming?", opts: ["Deletes files from disk", "Creates new hardware", "Performs a specific task and can be reused", "Changes the operating system"], correct: 2 },
    { q: "What is the purpose of a loop in programming?", opts: ["To make the program crash", "To write comments", "To style the interface", "To repeat a block of code multiple times"], correct: 3 },
  ],

  science: [
    { q: "What is the basic unit of life?", opts: ["Cell", "Atom", "Molecule", "Organ"], correct: 0 },
    { q: "What is the chemical formula for water?", opts: ["CO2", "H2O", "NaCl", "O2"], correct: 1 },
    { q: "What does DNA stand for?", opts: ["Dynamic Nuclear Acid", "Data Network Architecture", "Deoxyribonucleic Acid", "Digital Numeric Array"], correct: 2 },
  ],

  math: [
    { q: "What is the value of π (pi) approximately?", opts: ["3.14159", "2.71828", "1.41421", "1.61803"], correct: 0 },
    { q: "What is the square root of 144?", opts: ["14", "12", "10", "16"], correct: 1 },
  ]
};

const detectCategory = (prompt) => {
  const lower = prompt.toLowerCase();
  const programmingKeywords = ['python', 'java', 'javascript', 'react', 'code', 'programming', 'html', 'css', 'sql', 'database', 'api', 'function', 'variable', 'loop', 'array', 'object'];
  const scienceKeywords = ['science', 'biology', 'chemistry', 'physics', 'cell', 'atom', 'molecule', 'energy'];
  const mathKeywords = ['math', 'algebra', 'geometry', 'calculus', 'trigonometry', 'equation', 'formula'];

  if (programmingKeywords.some(k => lower.includes(k))) return 'programming';
  if (scienceKeywords.some(k => lower.includes(k))) return 'science';
  if (mathKeywords.some(k => lower.includes(k))) return 'math';
  return 'generic';
};

const generateSmartQuestions = async (prompt, numQuestions, level) => {
  const category = detectCategory(prompt);
  const pool = [...QUESTION_TEMPLATES[category], ...QUESTION_TEMPLATES.generic];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const selected = [];
  
  for (let i = 0; i < numQuestions && i < shuffled.length; i++) {
    const template = shuffled[i];
    const topicName = prompt.length > 40 ? prompt.substring(0, 40) : prompt;
    const question = template.q.replace(/\{topic\}/g, topicName);
    const options = template.opts.map(o => o.replace(/\{topic\}/g, topicName));
    selected.push({
      id: `q_${Date.now()}_${i}`,
      question,
      options,
      correctAnswer: template.correct,
    });
  }
  
  while (selected.length < numQuestions) {
    const idx = selected.length % shuffled.length;
    const template = shuffled[idx];
    const topicName = prompt.length > 40 ? prompt.substring(0, 40) : prompt;
    selected.push({
      id: `q_${Date.now()}_${selected.length}`,
      question: template.q.replace(/\{topic\}/g, topicName),
      options: template.opts.map(o => o.replace(/\{topic\}/g, topicName)),
      correctAnswer: template.correct,
    });
  }
  return selected;
};

// @desc    Generate questions using Gemini API
// @route   POST /api/generate
// @access  Private/Admin
export const generateQuestionsFromPrompt = async (req, res) => {
  try {
    const { prompt, numQuestions = 10, level = 1 } = req.body;
    const levelDesc = LEVEL_DESCRIPTIONS[level] || LEVEL_DESCRIPTIONS[1];

    const aiPrompt = `You are an expert exam question generator.

Generate exactly ${numQuestions} multiple-choice questions about the topic: "${prompt}".

Difficulty Level: Level ${level} — ${levelDesc}

Rules:
- Each question must be factually accurate and have exactly ONE correct answer.
- The 4 options should be plausible — avoid obviously wrong distractors.
- Shuffle the position of the correct answer randomly among the 4 options.
- Make sure the correctAnswer index exactly matches the correct option in the options array.

Format your output STRICTLY as a JSON array where each object has:
- "question": the question text (string)
- "options": an array of exactly 4 option strings
- "correctAnswer": the index (0 to 3) of the correct option

Reply ONLY with the raw JSON array. No markdown, no explanation, no code fences.`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      for (const modelName of MODELS_TO_TRY) {
        try {
          console.log(`[AI] Trying model: ${modelName}...`);
          const text = await callGeminiREST(apiKey, modelName, aiPrompt);
          const parsed = parseQuestionJSON(text);

          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`[AI] Generated ${parsed.length} questions using ${modelName}`);
            const questions = parsed.map((q, i) => ({
              id: `q_${Date.now()}_${i}`,
              question: q.question || `Question ${i + 1}`,
              options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
              correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
            }));
            return res.json({ success: true, questions });
          }
        } catch (error) {
          console.warn(`[AI] Model "${modelName}" failed: ${error.message}`);
        }
      }
    }

    console.warn('[AI] API unavailable or failed. Generating smart local questions.');
    const fallbackQuestions = await generateSmartQuestions(prompt, numQuestions, level);
    res.json({ success: true, questions: fallbackQuestions, isFallback: true });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
