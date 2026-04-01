import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  question: { type: String },
  options: [{ type: String }],
  correctAnswer: { type: Number },
  studentAnswer: { type: Number },
  isCorrect: { type: Boolean }
});

const incidentSchema = new mongoose.Schema({
  type: { type: String },
  timestamp: { type: Date }
});

const resultSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  examId: { type: String, required: true },
  examTitle: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  wrongAnswers: { type: Number, required: true },
  score: { type: String, required: true },
  accuracy: { type: String, required: true },
  cheatingScore: { type: Number, default: 0 },
  
  incidents: [incidentSchema],
  questionReview: [reviewSchema],
  isAutoSubmit: { type: Boolean, default: false },
  
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Result', resultSchema);
