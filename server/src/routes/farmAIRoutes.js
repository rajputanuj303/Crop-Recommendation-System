const express = require('express');
const router = express.Router();
const farmAIController = require('../controllers/farmAIController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'FarmAI API is working!', timestamp: new Date() });
});

// Quick test for text responses
router.get('/quick-test', async (req, res) => {
  try {
    const testQuery = 'Why are my crop leaves turning yellow?';
    // Simulate the textQuery function call
    const result = await new Promise((resolve) => {
      const mockReq = { body: { query: testQuery, lang: 'en' } };
      const mockRes = {
        json: (data) => resolve(data),
        status: () => mockRes
      };
      require('../controllers/farmAIController').textQuery(mockReq, mockRes);
    });
    res.json({ test: 'success', query: testQuery, result });
  } catch (error) {
    res.json({ test: 'error', error: error.message });
  }
});

// Text/voice query endpoint
router.post('/text', farmAIController.textQuery);

// Image upload for disease detection
router.post('/disease', upload.single('image'), farmAIController.diseaseDetection);

// Translation endpoint
router.post('/translate', farmAIController.translateText);

module.exports = router;
