import express from 'express';
import { registerUser, loginUser, getUserProfile, getStudents } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getUserProfile);
router.get('/students', protect, adminOnly, getStudents);

export default router;
