const express = require('express');
const router = express.Router();
const priceCtrl = require('../controllers/priceController');

// GET /api/prices/current?crop=...&state=...&district=...&block=...
router.get('/current', priceCtrl.getCurrentPrice);

// GET /api/prices/history?crop=...&state=...&district=...&block=...&limit=50
router.get('/history', priceCtrl.getHistoricalPrices);

module.exports = router;
