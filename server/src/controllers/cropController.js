const SoilInput = require('../models/SoilInput');
const Recommendation = require('../models/Recommendation');
const { callMLService } = require('../utils/apiCaller');

// @desc    Get crop recommendation
// @route   POST /api/crops/recommend
// @access  Public
const getCropRecommendation = async (req, res) => {
  try {
    const startTime = Date.now();
    const {
      N, P, K, temperature, humidity, ph, rainfall,
      location, notes, userId = null
    } = req.body;

    // Validate required fields
    if (!N || !P || !K || !temperature || !humidity || !ph || !rainfall) {
      return res.status(400).json({
        message: 'All soil and climate parameters are required'
      });
    }

    // Validate location if provided
    if (location) {
      if (!location.latitude || !location.longitude) {
        return res.status(400).json({
          message: 'Location must include both latitude and longitude'
        });
      }

      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);

      if (lat < -90 || lat > 90) {
        return res.status(400).json({
          message: 'Latitude must be between -90 and 90 degrees'
        });
      }

      if (lng < -180 || lng > 180) {
        return res.status(400).json({
          message: 'Longitude must be between -180 and 180 degrees'
        });
      }
    }

    // Validate ranges
    const validationErrors = [];
    if (N < 0 || N > 140) validationErrors.push('Nitrogen (N) must be between 0-140 kg/ha');
    if (P < 5 || P > 145) validationErrors.push('Phosphorus (P) must be between 5-145 kg/ha');
    if (K < 5 || K > 205) validationErrors.push('Potassium (K) must be between 5-205 kg/ha');
    if (temperature < 8.8 || temperature > 43.7) validationErrors.push('Temperature must be between 8.8-43.7°C');
    if (humidity < 14 || humidity > 100) validationErrors.push('Humidity must be between 14-100%');
    if (ph < 3.5 || ph > 10.0) validationErrors.push('pH must be between 3.5-10.0');
    if (rainfall < 20 || rainfall > 300) validationErrors.push('Rainfall must be between 20-300 mm');

    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation errors',
        errors: validationErrors
      });
    }

    // Prepare data for ML service
    const mlInput = {
      N: parseFloat(N),
      P: parseFloat(P),
      K: parseFloat(K),
      temperature: parseFloat(temperature),
      humidity: parseFloat(parseFloat(humidity)),
      ph: parseFloat(ph),
      rainfall: parseFloat(rainfall)
    };

    // Add location data to ML input if available
    if (location) {
      mlInput.latitude = parseFloat(location.latitude);
      mlInput.longitude = parseFloat(location.longitude);
    }

    // Call ML service
    let mlResponse;
    try {
      mlResponse = await callMLService(mlInput);
    } catch (error) {
      console.error('ML service error:', error);
      return res.status(503).json({
        message: 'ML service is currently unavailable. Please try again later.'
      });
    }

    const processingTime = Date.now() - startTime;

    // Save soil input if user is authenticated
    let soilInput = null;
    if (userId) {
      soilInput = await SoilInput.create({
        userId,
        ...mlInput,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name || ''
        } : undefined,
        notes
      });
    }

    // Save recommendation
    const recommendation = await Recommendation.create({
      userId: userId || 'anonymous',
      soilInputId: soilInput?._id,
      crop: mlResponse.crop,
      confidence: mlResponse.confidence || 'High',
      confidenceScore: mlResponse.confidence_score || 0.85,
      alternativeCrops: mlResponse.alternative_crops || [],
      reasoning: mlResponse.reasoning || 'Based on soil and climate analysis',
      mlModelVersion: mlResponse.model_version || '1.0.0',
      processingTime,
      status: 'completed',
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name || ''
      } : undefined
    });

    // Return response
    res.json({
      crop: recommendation.crop,
      confidence: recommendation.confidence,
      confidenceScore: recommendation.confidenceScore,
      alternativeCrops: recommendation.alternativeCrops,
      reasoning: recommendation.reasoning,
      processingTime: `${processingTime}ms`,
      recommendationId: recommendation._id,
      location: recommendation.location
    });

  } catch (error) {
    console.error('Crop recommendation error:', error);
    res.status(500).json({
      message: 'Failed to get crop recommendation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get recommendation history
// @route   GET /api/crops/history
// @access  Private
const getRecommendationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, crop } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (crop) {
      query.crop = { $regex: crop, $options: 'i' };
    }

    const recommendations = await Recommendation.find(query)
      .populate('soilInputId', 'N P K temperature humidity ph rainfall createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Recommendation.countDocuments(query);

    res.json({
      recommendations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to get recommendation history' });
  }
};

// @desc    Get recommendation by ID
// @route   GET /api/crops/:id
// @access  Private
const getRecommendationById = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id)
      .populate('soilInputId')
      .populate('userId', 'name email');

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    // Check if user owns this recommendation or is admin
    if (recommendation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(recommendation);

  } catch (error) {
    console.error('Get recommendation error:', error);
    res.status(500).json({ message: 'Failed to get recommendation' });
  }
};

// @desc    Get all recommendations (Admin only)
// @route   GET /api/crops/admin/all
// @access  Private/Admin
const getAllRecommendations = async (req, res) => {
  try {
    const { page = 1, limit = 20, crop, status, startDate, endDate } = req.query;

    const query = {};
    if (crop) query.crop = { $regex: crop, $options: 'i' };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const recommendations = await Recommendation.find(query)
      .populate('userId', 'name email')
      .populate('soilInputId', 'N P K temperature humidity ph rainfall')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Recommendation.countDocuments(query);

    res.json({
      recommendations,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Get all recommendations error:', error);
    res.status(500).json({ message: 'Failed to get recommendations' });
  }
};

// @desc    Delete recommendation
// @route   DELETE /api/crops/:id
// @access  Private
const deleteRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findById(req.params.id);

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    // Check if user owns this recommendation or is admin
    if (recommendation.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await recommendation.remove();
    res.json({ message: 'Recommendation deleted successfully' });

  } catch (error) {
    console.error('Delete recommendation error:', error);
    res.status(500).json({ message: 'Failed to delete recommendation' });
  }
};

module.exports = {
  getCropRecommendation,
  getRecommendationHistory,
  getRecommendationById,
  getAllRecommendations,
  deleteRecommendation,
};
