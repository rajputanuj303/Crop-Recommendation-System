const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  soilInputId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SoilInput',
    required: true
  },
  crop: {
    type: String,
    required: [true, 'Crop recommendation is required'],
    trim: true
  },
  confidence: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  confidenceScore: {
    type: Number,
    min: [0, 'Confidence score cannot be negative'],
    max: [1, 'Confidence score cannot exceed 1']
  },
  alternativeCrops: [{
    crop: String,
    confidence: String,
    confidenceScore: Number
  }],
  reasoning: {
    type: String,
    trim: true,
    maxlength: [1000, 'Reasoning cannot exceed 1000 characters']
  },
  mlModelVersion: {
    type: String,
    default: '1.0.0'
  },
  processingTime: {
    type: Number,
    min: [0, 'Processing time cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  errorMessage: {
    type: String,
    trim: true
  },
  location: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90 degrees'],
      max: [90, 'Latitude must be between -90 and 90 degrees']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180 degrees'],
      max: [180, 'Longitude must be between -180 and 180 degrees']
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Location name cannot exceed 100 characters']
    }
  }
}, {
  timestamps: true
});

// Index for user queries
recommendationSchema.index({ userId: 1, createdAt: -1 });

// Index for soil input queries
recommendationSchema.index({ soilInputId: 1 });

// Index for crop queries
recommendationSchema.index({ crop: 1 });

// Virtual for full recommendation data
recommendationSchema.virtual('fullRecommendation').get(function () {
  return {
    id: this._id,
    crop: this.crop,
    confidence: this.confidence,
    confidenceScore: this.confidenceScore,
    alternativeCrops: this.alternativeCrops,
    reasoning: this.reasoning,
    createdAt: this.createdAt,
    processingTime: this.processingTime
  };
});

// Ensure virtual fields are serialized
recommendationSchema.set('toJSON', { virtuals: true });
recommendationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Recommendation', recommendationSchema);
