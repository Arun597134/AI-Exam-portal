import Exam from '../models/Exam.js';
import Result from '../models/Result.js';

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getExams = async (req, res) => {
  try {
    // If student, maybe only show exams they haven't passed?
    // For now, return all exams.
    const exams = await Exam.find({}).sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single exam by ID
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findOne({ id: req.params.id });
    if (exam) {
      res.json(exam);
    } else {
      res.status(404).json({ message: 'Exam not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new exam (Admin)
// @route   POST /api/exams
// @access  Private/Admin
export const createExam = async (req, res) => {
  try {
    const { id, title, duration, questions } = req.body;

    const exam = await Exam.create({
      id,
      title,
      duration,
      questions
    });

    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an exam (Admin)
// @route   DELETE /api/exams/:id
// @access  Private/Admin
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ id: req.params.id });

    if (exam) {
      await Exam.deleteOne({ id: req.params.id });
      // Optionally delete all results associated with this exam
      await Result.deleteMany({ examId: req.params.id });
      
      res.json({ message: 'Exam removed' });
    } else {
      res.status(404).json({ message: 'Exam not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
