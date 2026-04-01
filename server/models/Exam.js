import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }
});

const examSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  createdAt: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: Date.now },
  questions: [questionSchema],
  version: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model('Exam', examSchema);
