import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Anti-AI Exam API is running successfully!');
});

app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/ai', aiRoutes);

// Database connection
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
