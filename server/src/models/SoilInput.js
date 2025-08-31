const mongoose = require('mongoose');

const soilInputSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  N: {
    type: Number,
    required: [true, 'Nitrogen (N) is required'],
    min: [0, 'Nitrogen cannot be negative'],
    max: [140, 'Nitrogen cannot exceed 140 kg/ha']
  },
  P: {
    type: Number,
    required: [true, 'Phosphorus (P) is required'],
    min: [5, 'Phosphorus cannot be less than 5 kg/ha'],
    max: [145, 'Phosphorus cannot exceed 145 kg/ha']
  },
  K: {
    type: Number,
    required: [true, 'Potassium (K) is required'],
    min: [5, 'Potassium cannot be less than 5 kg/ha'],
    max: [205, 'Potassium cannot exceed 205 kg/ha']
  },
  temperature: {
    type: Number,
    required: [true, 'Temperature is required'],
    min: [8.8, 'Temperature cannot be less than 8.8°C'],
    max: [43.7, 'Temperature cannot exceed 43.7°C']
  },
  humidity: {
    type: Number,
    required: [true, 'Humidity is required'],
    min: [14, 'Humidity cannot be less than 14%'],
    max: [100, 'Humidity cannot exceed 100%']
  },
  ph: {
    type: Number,
    required: [true, 'pH is required'],
    min: [3.5, 'pH cannot be less than 3.5'],
    max: [10.0, 'pH cannot exceed 10.0']
  },
  rainfall: {
    type: Number,
    required: [true, 'Rainfall is required'],
    min: [20, 'Rainfall cannot be less than 20 mm'],
    max: [300, 'Rainfall cannot exceed 300 mm']
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
    },
    // Keep the GeoJSON format for backward compatibility and geospatial queries
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for geospatial queries
soilInputSchema.index({ location: '2dsphere' });

// Index for user queries
soilInputSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SoilInput', soilInputSchema);
