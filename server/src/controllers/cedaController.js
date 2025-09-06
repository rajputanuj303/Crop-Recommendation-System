const { getCommodities, getGeographies, fetchMarkets, fetchPrices } = require('../utils/ceda');

exports.listCommodities = async (req, res, next) => {
  try {
  const items = await getCommodities(req.query.refresh === 'true');
    res.json({ commodities: items });
  } catch (err) {
    if (err.statusCode && [429, 500, 502, 503, 504].includes(err.statusCode)) {
      return res.json({ commodities: [] });
    }
    next(err);
  }
};

exports.listGeographies = async (req, res, next) => {
  try {
  const geos = await getGeographies(req.query.refresh === 'true');
    res.json({ geographies: geos });
  } catch (err) {
    if (err.statusCode && [429, 500, 502, 503, 504].includes(err.statusCode)) {
      return res.json({ geographies: [] });
    }
    next(err);
  }
};

exports.listMarkets = async (req, res, next) => {
  try {
  const { commodityId, stateId, districtId, refresh } = req.body || {};
    if (!commodityId || !stateId) return res.status(400).json({ message: 'commodityId and stateId are required' });
  const items = await fetchMarkets({ commodityId, stateId, districtId, refresh: Boolean(refresh) });
    res.json({ markets: items });
  } catch (err) { next(err); }
};

exports.searchPricesByIds = async (req, res, next) => {
  try {
    const { commodityId, stateId, districtId, marketId, fromDate, toDate, limit } = req.body || {};
    if (!commodityId || !stateId) return res.status(400).json({ message: 'commodityId and stateId are required' });
    const data = await fetchPrices({ commodityId, stateId, districtId, marketId, fromDate, toDate, limit });
    res.json({ results: data });
  } catch (err) { next(err); }
};
