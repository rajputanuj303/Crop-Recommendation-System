const express = require('express');
const router = express.Router();
const {
  getCropRecommendation,
  getRecommendationHistory,
  getRecommendationById,
  getAllRecommendations,
  deleteRecommendation,
} = require('../controllers/cropController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/recommend', getCropRecommendation);

// Protected routes
router.get('/history', protect, getRecommendationHistory);
router.get('/:id', protect, getRecommendationById);
router.delete('/:id', protect, deleteRecommendation);

// Admin routes
router.get('/admin/all', protect, admin, getAllRecommendations);

module.exports = router;
