import express from 'express';
import { getExams, getExamById, createExam, deleteExam } from '../controllers/examController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getExams)
  .post(protect, adminOnly, createExam);

router.route('/:id')
  .get(protect, getExamById)
  .delete(protect, adminOnly, deleteExam);

export default router;
