// Difficulty descriptions to guide AI prompt quality
const LEVEL_DESCRIPTIONS = {
  1: 'easy, basic, beginner-friendly. Use simple terminology and straightforward concepts.',
  2: 'intermediate, moderately challenging. Include application-based and conceptual questions.',
  3: 'advanced, difficult, expert-level. Include tricky, analytical, and deep-understanding questions.'
};

// Models to try in order (using v1 REST API directly)
const MODELS_TO_TRY = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-pro',
];

// Direct REST call to Gemini API v1 endpoint
const callGeminiREST = async (apiKey, modelName, prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;

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

// Parse AI text into a valid JSON question array
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

export const generateQuestions = async (prompt, numQuestions = 10, level = 1) => {
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

  const apiKey = localStorage.getItem('gemini_api_key') || 'AIzaSyAdLnEQrUNuDSzVO9ZTORyJ-KiSm7cRm-A';

  if (apiKey) {
    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`🔄 Trying model: ${modelName}...`);
        const text = await callGeminiREST(apiKey, modelName, aiPrompt);
        const parsed = parseQuestionJSON(text);

        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`✅ Generated ${parsed.length} questions using ${modelName}`);
          return parsed.map((q, i) => ({
            id: `q_${Date.now()}_${i}`,
            question: q.question || `Question ${i + 1}`,
            options: Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'],
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
          }));
        }
      } catch (error) {
        console.warn(`❌ Model "${modelName}" failed: ${error.message}`);
      }
    }
  }

  // Fallback: Smart local question generator
  console.warn('⚠️ API unavailable. Generating smart local questions.');
  return generateSmartQuestions(prompt, numQuestions, level);
};

// ============================================================
// SMART LOCAL QUESTION GENERATOR (offline fallback)
// Generates topic-aware, realistic questions without API
// ============================================================

const QUESTION_TEMPLATES = {
  // Generic templates that work for any topic
  generic: [
    { q: "Which of the following best describes {topic}?", opts: ["A systematic approach to {topic}", "An unrelated concept to computing", "A type of hardware device", "A mathematical theorem only"], correct: 0 },
    { q: "What is the primary purpose of {topic}?", opts: ["To complicate processes", "To solve specific problems in its domain", "To replace all other technologies", "It has no practical purpose"], correct: 1 },
    { q: "Which statement about {topic} is TRUE?", opts: ["It was invented in the 1800s", "It has no real-world applications", "It is widely used in modern technology", "It is only theoretical and never implemented"], correct: 2 },
    { q: "What is a key advantage of using {topic}?", opts: ["It makes systems slower", "It increases complexity unnecessarily", "It has no benefits", "It improves efficiency and productivity"], correct: 3 },
    { q: "In the context of {topic}, what does a beginner need to learn first?", opts: ["The fundamental concepts and basics", "Only advanced topics", "Nothing, it's self-explanatory", "Hardware engineering"], correct: 0 },
    { q: "Which field commonly uses {topic}?", opts: ["Ancient agriculture only", "Software development and technology", "Medieval art history", "Underwater basket weaving"], correct: 1 },
    { q: "What is a common misconception about {topic}?", opts: ["It is widely used", "It has practical applications", "It is easy to master without practice", "It requires learning fundamentals first"], correct: 2 },
    { q: "How has {topic} evolved over the years?", opts: ["It has remained exactly the same", "It has become less relevant", "It has not changed at all", "It has significantly improved and expanded"], correct: 3 },
    { q: "Which skill is essential for mastering {topic}?", opts: ["Logical thinking and problem solving", "Speed typing only", "Memorizing random facts", "Physical fitness"], correct: 0 },
    { q: "What role does {topic} play in industry?", opts: ["No role at all", "A critical role in modern development", "It is banned in most countries", "Only used in games"], correct: 1 },
  ],

  // Programming-specific
  programming: [
    { q: "What is a variable in programming?", opts: ["A named storage location for data", "A type of loop", "A function declaration", "A syntax error"], correct: 0 },
    { q: "Which of the following is a valid data type?", opts: ["paragraph", "integer", "command", "folder"], correct: 1 },
    { q: "What does a function/method do in programming?", opts: ["Deletes files from disk", "Creates new hardware", "Performs a specific task and can be reused", "Changes the operating system"], correct: 2 },
    { q: "What is the purpose of a loop in programming?", opts: ["To make the program crash", "To write comments", "To style the interface", "To repeat a block of code multiple times"], correct: 3 },
    { q: "What is a conditional statement?", opts: ["Code that executes based on a condition being true or false", "A statement that always runs", "A type of variable", "A way to import libraries"], correct: 0 },
    { q: "What is an array?", opts: ["A single value", "A collection of elements stored in a single variable", "A type of function", "A database query"], correct: 1 },
    { q: "What does 'debugging' mean?", opts: ["Adding new features", "Deleting the program", "Finding and fixing errors in code", "Running the program faster"], correct: 2 },
    { q: "What is an API?", opts: ["A programming language", "A type of database", "A hardware component", "An interface that allows software to communicate"], correct: 3 },
    { q: "What is object-oriented programming (OOP)?", opts: ["A paradigm based on objects containing data and methods", "A way to write HTML", "A database management technique", "A network protocol"], correct: 0 },
    { q: "What is the difference between '==' and '==='?", opts: ["No difference", "'==' checks value, '===' checks value and type", "'===' is not valid syntax", "'==' is used only for strings"], correct: 1 },
    { q: "What is a class in OOP?", opts: ["A CSS styling rule", "A HTML tag", "A blueprint for creating objects", "A type of variable"], correct: 2 },
    { q: "What is recursion?", opts: ["A sorting algorithm", "A type of variable", "A loop statement", "A function that calls itself"], correct: 3 },
    { q: "What is the purpose of 'return' in a function?", opts: ["To send a value back from the function", "To print output to console", "To create a new variable", "To start a loop"], correct: 0 },
    { q: "What is a string in programming?", opts: ["A hardware cable", "A sequence of characters", "A number with decimals", "A boolean value"], correct: 1 },
    { q: "What does 'compile' mean?", opts: ["To delete source code", "To run a program directly", "To convert source code into executable code", "To debug errors"], correct: 2 },
    { q: "What is exception handling used for?", opts: ["Styling web pages", "Creating databases", "Writing documentation", "Managing runtime errors gracefully"], correct: 3 },
    { q: "What is a boolean data type?", opts: ["A value that is either true or false", "A decimal number", "A text string", "An array of numbers"], correct: 0 },
    { q: "What is inheritance in OOP?", opts: ["A file system feature", "A mechanism where a class acquires properties of another class", "A network protocol", "A type of algorithm"], correct: 1 },
    { q: "What is a constructor?", opts: ["A loop type", "A conditional statement", "A special method called when an object is created", "A global variable"], correct: 2 },
    { q: "What is polymorphism in OOP?", opts: ["A database feature", "A network concept", "A CSS technique", "The ability of objects to take many forms"], correct: 3 },
    { q: "What is encapsulation?", opts: ["Bundling data and methods that operate on them together", "A sorting method", "A type of inheritance", "A compilation step"], correct: 0 },
    { q: "What is a lambda/arrow function?", opts: ["A server configuration", "A concise anonymous function expression", "A database query", "A file format"], correct: 1 },
    { q: "What is the purpose of version control (e.g., Git)?", opts: ["To speed up code execution", "To design user interfaces", "To track changes and collaborate on code", "To compile programs faster"], correct: 2 },
    { q: "What is an algorithm?", opts: ["A programming language", "A web framework", "A code editor", "A step-by-step procedure to solve a problem"], correct: 3 },
    { q: "What is a syntax error?", opts: ["An error caused by incorrect code grammar/structure", "A logical mistake in the program", "A runtime crash", "A network error"], correct: 0 },
    { q: "What is the difference between a stack and a queue?", opts: ["There is no difference", "Stack is LIFO, Queue is FIFO", "Stack is FIFO, Queue is LIFO", "Both are the same data structure"], correct: 1 },
    { q: "What is a pointer?", opts: ["A UI element", "A type of function", "A variable that stores a memory address", "A CSS selector"], correct: 2 },
    { q: "What is the time complexity of binary search?", opts: ["O(n²)", "O(n)", "O(1)", "O(log n)"], correct: 3 },
    { q: "What is a linked list?", opts: ["A data structure where elements are connected via pointers", "A type of array", "A sorting algorithm", "A CSS layout model"], correct: 0 },
    { q: "What is the purpose of a database index?", opts: ["To delete data faster", "To speed up data retrieval queries", "To encrypt data", "To compress files"], correct: 1 },
  ],

  // Science / general knowledge  
  science: [
    { q: "What is the basic unit of life?", opts: ["Cell", "Atom", "Molecule", "Organ"], correct: 0 },
    { q: "What is the chemical formula for water?", opts: ["CO2", "H2O", "NaCl", "O2"], correct: 1 },
    { q: "What does DNA stand for?", opts: ["Dynamic Nuclear Acid", "Data Network Architecture", "Deoxyribonucleic Acid", "Digital Numeric Array"], correct: 2 },
    { q: "What is the speed of light approximately?", opts: ["340 m/s", "1,000 km/h", "150,000 km/s", "300,000 km/s"], correct: 3 },
    { q: "What is Newton's first law of motion about?", opts: ["Inertia — objects at rest stay at rest", "Gravity", "Electromagnetic force", "Thermodynamics"], correct: 0 },
    { q: "What planet is known as the Red Planet?", opts: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
    { q: "What is the powerhouse of the cell?", opts: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"], correct: 2 },
    { q: "What is the most abundant gas in Earth's atmosphere?", opts: ["Oxygen", "Carbon Dioxide", "Hydrogen", "Nitrogen"], correct: 3 },
    { q: "What does pH measure?", opts: ["Acidity or alkalinity of a solution", "Temperature of a liquid", "Weight of a substance", "Volume of a gas"], correct: 0 },
    { q: "What is photosynthesis?", opts: ["Animal reproduction", "The process by which plants convert sunlight into energy", "A type of chemical bond", "A geological process"], correct: 1 },
  ],

  // Math
  math: [
    { q: "What is the value of π (pi) approximately?", opts: ["3.14159", "2.71828", "1.41421", "1.61803"], correct: 0 },
    { q: "What is the square root of 144?", opts: ["14", "12", "10", "16"], correct: 1 },
    { q: "What is the formula for the area of a circle?", opts: ["2πr", "πd", "πr²", "r²"], correct: 2 },
    { q: "What is 15% of 200?", opts: ["20", "25", "15", "30"], correct: 3 },
    { q: "In a right triangle, what does the Pythagorean theorem state?", opts: ["a² + b² = c²", "a + b = c", "a × b = c", "a² - b² = c²"], correct: 0 },
    { q: "What type of number is -7?", opts: ["Natural number", "Negative integer", "Irrational number", "Fraction"], correct: 1 },
    { q: "What is the derivative of x²?", opts: ["x", "x²", "2x", "2x²"], correct: 2 },
    { q: "What is the value of 5! (5 factorial)?", opts: ["25", "15", "55", "120"], correct: 3 },
    { q: "What is a prime number?", opts: ["A number divisible only by 1 and itself", "Any even number", "A number divisible by 3", "A negative number"], correct: 0 },
    { q: "What is the slope of a horizontal line?", opts: ["Undefined", "0", "1", "Infinity"], correct: 1 },
  ],
};

// Detect the best category from the prompt
const detectCategory = (prompt) => {
  const lower = prompt.toLowerCase();
  const programmingKeywords = ['python', 'java', 'javascript', 'react', 'code', 'programming', 'html', 'css', 'sql', 'database', 'api', 'function', 'variable', 'loop', 'array', 'object', 'class', 'oop', 'algorithm', 'data structure', 'web', 'software', 'development', 'coding', 'c++', 'c#', 'node', 'typescript', 'git', 'framework', 'library', 'frontend', 'backend', 'fullstack'];
  const scienceKeywords = ['science', 'biology', 'chemistry', 'physics', 'cell', 'atom', 'molecule', 'energy', 'force', 'planet', 'earth', 'dna', 'evolution', 'genetics', 'ecology', 'organism'];
  const mathKeywords = ['math', 'algebra', 'geometry', 'calculus', 'trigonometry', 'equation', 'formula', 'number', 'arithmetic', 'statistics', 'probability'];

  if (programmingKeywords.some(k => lower.includes(k))) return 'programming';
  if (scienceKeywords.some(k => lower.includes(k))) return 'science';
  if (mathKeywords.some(k => lower.includes(k))) return 'math';
  return 'generic';
};

const generateSmartQuestions = async (prompt, numQuestions, level) => {
  await new Promise(r => setTimeout(r, 600));

  const category = detectCategory(prompt);
  const pool = [...QUESTION_TEMPLATES[category], ...QUESTION_TEMPLATES.generic];

  // Shuffle the pool
  const shuffled = pool.sort(() => Math.random() - 0.5);

  // Pick questions up to numQuestions
  const selected = [];
  for (let i = 0; i < numQuestions && i < shuffled.length; i++) {
    const template = shuffled[i];
    const topicName = prompt.length > 40 ? prompt.substring(0, 40) : prompt;

    // Replace {topic} placeholder with actual topic
    const question = template.q.replace(/\{topic\}/g, topicName);
    const options = template.opts.map(o => o.replace(/\{topic\}/g, topicName));

    selected.push({
      id: `q_${Date.now()}_${i}`,
      question,
      options,
      correctAnswer: template.correct,
    });
  }

  // If we need more questions than the pool has, duplicate with variations
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
