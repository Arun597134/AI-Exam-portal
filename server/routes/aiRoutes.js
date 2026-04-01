import express from 'express';
import { generateQuestionsFromPrompt } from '../controllers/aiController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, adminOnly, generateQuestionsFromPrompt);

export default router;
