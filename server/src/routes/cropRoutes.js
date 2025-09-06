const express = require('express');
const router = express.Router();
const {
  getCropRecommendation,
  getRecommendationHistory,
  getRecommendationById,
  deleteRecommendation,
} = require('../controllers/cropController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/recommend', getCropRecommendation);

// Protected routes
router.get('/history', protect, getRecommendationHistory);
router.get('/:id', protect, getRecommendationById);
router.delete('/:id', protect, deleteRecommendation);

module.exports = router;
