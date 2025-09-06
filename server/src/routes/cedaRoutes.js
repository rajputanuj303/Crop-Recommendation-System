const express = require('express');
const router = express.Router();
const cedaCtrl = require('../controllers/cedaController');

// Force no-store so intermediaries don't reply 304 without body
router.use((req, res, next) => {
	res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
	res.setHeader('Pragma', 'no-cache');
	res.setHeader('Expires', '0');
	next();
});

router.get('/commodities', cedaCtrl.listCommodities);
router.get('/geographies', cedaCtrl.listGeographies);
router.post('/markets', cedaCtrl.listMarkets);
router.post('/prices', cedaCtrl.searchPricesByIds);

module.exports = router;
