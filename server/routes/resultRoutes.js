import express from 'express';
import { submitResult, getMyResults, getAllResults, getResultById } from '../controllers/resultController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, submitResult)
  .get(protect, adminOnly, getAllResults);

router.route('/my')
  .get(protect, getMyResults);

router.route('/:id')
  .get(protect, getResultById);

export default router;
