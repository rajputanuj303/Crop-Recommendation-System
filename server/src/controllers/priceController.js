const { fetchCurrent, fetchHistory } = require('../utils/ceda');

exports.getCurrentPrice = async (req, res, next) => {
  try {
    if (!process.env.CEDA_API_KEY) {
      return res.status(500).json({ message: 'CEDA API not configured. Set CEDA_API_KEY in server environment.' });
    }
    const { crop, state, district, block } = req.query;
    if (!crop && !state && !district && !block) {
      return res.status(400).json({ message: 'Provide at least one of: crop, state, district, block' });
    }
    const current = await fetchCurrent({ crop, state, district, block });
    res.json({ current });
  } catch (err) {
    next(err);
  }
};

exports.getHistoricalPrices = async (req, res, next) => {
  try {
    if (!process.env.CEDA_API_KEY) {
      return res.status(500).json({ message: 'CEDA API not configured. Set CEDA_API_KEY in server environment.' });
    }
    const { crop, state, district, block, limit } = req.query;
    if (!crop && !state && !district && !block) {
      return res.status(400).json({ message: 'Provide at least one of: crop, state, district, block' });
    }
    const history = await fetchHistory({ crop, state, district, block, limit: Number(limit) || 50 });
    res.json({ history });
  } catch (err) {
    next(err);
  }
};
