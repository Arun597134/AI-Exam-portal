import Result from '../models/Result.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';

// @desc    Submit an exam result
// @route   POST /api/results
// @access  Private (Student)
export const submitResult = async (req, res) => {
  try {
    const { examId, examTitle, totalQuestions, correctAnswers, wrongAnswers, score, accuracy, cheatingScore, incidents, questionReview, isAutoSubmit } = req.body;

    // Check if the exam exists
    const exam = await Exam.findOne({ id: examId });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const studentId = req.user._id;
    const studentName = req.user.name;
    const studentEmail = req.user.email;

    const result = await Result.create({
      id: `res_${Date.now()}`,
      examId,
      examTitle,
      studentId,
      studentName,
      studentEmail,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      score,
      accuracy,
      cheatingScore,
      incidents,
      questionReview,
      isAutoSubmit
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's results
// @route   GET /api/results/my
// @access  Private
export const getMyResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user._id }).sort({ submittedAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all results (Admin)
// @route   GET /api/results
// @access  Private/Admin
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find({}).sort({ submittedAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single result by ID
// @route   GET /api/results/:id
// @access  Private
export const getResultById = async (req, res) => {
  try {
    const result = await Result.findOne({ id: req.params.id });
    
    // Ensure the result exists and the user is either the owner or an admin
    if (result) {
      // mongoose _id comparison requires .equals() or toString()
      if (req.user.role === 'admin' || result.studentId.toString() === req.user._id.toString()) {
        res.json(result);
      } else {
        res.status(403).json({ message: 'Not authorized to view this result' });
      }
    } else {
      res.status(404).json({ message: 'Result not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
