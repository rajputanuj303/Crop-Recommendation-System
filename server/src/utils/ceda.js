const axios = require('axios');

const CEDA_API_KEY = process.env.CEDA_API_KEY || process.env.CEDA_KEY; // support either name
const CEDA_BASE_URL = process.env.CEDA_BASE_URL || 'https://api.ceda.ashoka.edu.in/v1';
const CEDA_PRICES_ENDPOINT = process.env.CEDA_PRICES_ENDPOINT || '/agmarknet/prices';
const CEDA_API_KEY_HEADER = process.env.CEDA_API_KEY_HEADER || 'x-api-key';
const CEDA_API_KEY_QUERY = process.env.CEDA_API_KEY_QUERY || 'x-api-key';
const CEDA_COMMODITIES_ENDPOINT = process.env.CEDA_COMMODITIES_ENDPOINT || '/agmarknet/commodities';
const CEDA_GEOGRAPHIES_ENDPOINT = process.env.CEDA_GEOGRAPHIES_ENDPOINT || '/agmarknet/geographies';
const CEDA_CACHE_TTL_MS = Number(process.env.CEDA_CACHE_TTL_MS || 6 * 60 * 60 * 1000); // 6 hours default

if (!CEDA_API_KEY) {
  console.warn('CEDA_API_KEY is not set. Price endpoints will fail until configured.');
}
// Default base URL set to official CEDA API from docs. Override with CEDA_BASE_URL if needed.

function getClient() {
  if (!CEDA_API_KEY) throw new Error('CEDA API not configured: missing CEDA_API_KEY');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  return axios.create({
    baseURL: CEDA_BASE_URL,
    timeout: 20000,
    headers,
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function requestWithAuth(method, path, body) {
  const client = getClient();
  const tries = [
    // Headers
    { headers: { 'x-api-key': CEDA_API_KEY } },
    { headers: { [CEDA_API_KEY_HEADER]: CEDA_API_KEY } },
    { headers: { 'X-API-Key': CEDA_API_KEY } },
    { headers: { 'X-API-KEY': CEDA_API_KEY } },
    { headers: { 'api-key': CEDA_API_KEY } },
    { headers: { 'apikey': CEDA_API_KEY } },
    { headers: { 'api_key': CEDA_API_KEY } },
    { headers: { Authorization: `ApiKey ${CEDA_API_KEY}` } },
    { headers: { Authorization: `Bearer ${CEDA_API_KEY}` } },
    // Query param variants
    { query: { [CEDA_API_KEY_QUERY]: CEDA_API_KEY } },
    { query: { 'x-api-key': CEDA_API_KEY } },
    { query: { 'X-API-Key': CEDA_API_KEY } },
    { query: { 'X-API-KEY': CEDA_API_KEY } },
    { query: { 'api_key': CEDA_API_KEY } },
    { query: { 'apikey': CEDA_API_KEY } },
    { query: { 'api-key': CEDA_API_KEY } },
    { query: { 'key': CEDA_API_KEY } },
  ];

  let lastErr;
  const maxRetries = 2; // small retry budget for throttling
  let attempt = 0;
  for (const t of tries) {
    try {
      const url = t.query ? `${path}?${new URLSearchParams(t.query).toString()}` : path;
      const cfg = t.headers ? { headers: t.headers } : undefined;
      const resp = method === 'get'
        ? await client.get(url, cfg)
        : await client.post(url, body, cfg);
      return resp.data;
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      if (status === 429 || status === 503) {
        // Respect Retry-After header if provided
        const ra = err.response?.headers?.['retry-after'];
        let waitMs = 300 * Math.pow(2, attempt);
        if (ra) {
          const n = Number(ra);
          if (!Number.isNaN(n)) waitMs = Math.max(waitMs, n * 1000);
        }
        if (attempt < maxRetries) {
          attempt += 1;
          await sleep(waitMs);
          continue; // retry same auth variant
        }
      }
      if (status && status !== 401) break; // other error -> stop trying
    }
  }
  if (lastErr?.response) {
    const status = lastErr.response.status;
    const data = lastErr.response.data;
    const msg = (data && (data.message || data.error || JSON.stringify(data))) || lastErr.message || 'CEDA request failed';
    const e = new Error(`CEDA ${method.toUpperCase()} ${path} failed (${status}): ${msg}`);
    e.statusCode = status;
    throw e;
  }
  const e = new Error('CEDA request failed');
  e.statusCode = 502;
  throw e;
}

function ymd(date) {
  const d = new Date(date);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Level inference: national/state/district/market
function inferLevel({ state, district, market }) {
  if (market) return 'market';
  if (district) return 'district';
  if (state) return 'state';
  return 'national';
}

async function fetchPrices({ crop, commodity, state, district, market, fromDate, toDate, limit = 50, sort = 'desc', commodityId: cid, stateId: sid, districtId: did, marketId: mid }) {
  try {
  // Resolve IDs first (commodity, state, optionally district/market) if missing
  const { commodityId } = cid ? { commodityId: cid } : await resolveCommodityId(crop || commodity);
  const geo = sid || did ? { stateId: sid, districtId: did } : await resolveGeoIds(state, district);
  const stateId = geo.stateId;
  const districtId = geo.districtId;

    const start = ymd(fromDate || new Date(Date.now() - 60 * 24 * 3600 * 1000)); // last 60 days
    const end = ymd(toDate || new Date());

    const base = {
      limit,
      sort,
    };

    const bodies = [
      // Common snake_case ids + start/end_date
      { ...base, commodity_id: commodityId, state_id: stateId, district_id: districtId || undefined, start_date: start, end_date: end },
      // camelCase ids + start/end
      { ...base, commodityId, stateId, districtId, start, end },
      // names with _id suffix for some keys and from/to
      { ...base, commodity_id: commodityId, state_id: stateId, district_id: districtId || undefined, from: start, to: end },
      // mixed: commodity/state as ids but keys without _id
      { ...base, commodity: commodityId, state: stateId, district: districtId || undefined, start_date: start, end_date: end },
      // explicit level field if they require it
      { ...base, level: inferLevel({ state, district, market }), commodity_id: commodityId, state_id: stateId, start_date: start, end_date: end },
    ];

    let lastErr;
    for (const reqBody of bodies) {
      try {
        const data = await requestWithAuth('post', CEDA_PRICES_ENDPOINT, reqBody);
        const list = Array.isArray(data?.results || data?.data || data) ? (data.results || data.data || data) : [];
        const normalized = list.map(normalizeRecord).filter(Boolean);
        normalized.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (normalized.length) return normalized;
        // If empty, keep trying next variant once
      } catch (err) {
        lastErr = err;
        if (err?.response?.status && err.response.status !== 400 && err.response.status !== 422 && err.response.status !== 401) {
          break;
        }
      }
    }
    const code = lastErr?.response?.status;
    const bodyErr = lastErr?.response?.data;
    const message = bodyErr?.message || bodyErr?.error || lastErr?.message;
    throw new Error(`CEDA prices request failed${code ? ` (${code})` : ''}: ${message}`);
  } catch (err) {
    const code = err.response?.status;
    const body = err.response?.data;
    const message = body?.message || body?.error || err.message;
    throw new Error(`CEDA prices request failed${code ? ` (${code})` : ''}: ${message}`);
  }
}

// Normalize a record from CEDA to a common shape
function normalizeRecord(r) {
  if (!r) return null;
  return {
    commodity: r.commodity || r.crop || r.product || '',
    state: r.state || r.state_name || '',
    district: r.district || r.district_name || '',
    block: r.block || r.block_name || r.subdistrict || '',
    mandi: r.mandi || r.market || r.market_name || '',
    unit: r.unit || r.price_unit || '₹/quintal',
    date: r.date || r.reported_on || r.arrival_date || r.timestamp || null,
    min: Number(r.min_price ?? r.min ?? r.minimum) || null,
    max: Number(r.max_price ?? r.max ?? r.maximum) || null,
    modal: Number(r.modal_price ?? r.modal ?? r.average) || null,
    raw: r,
  };
}

async function fetchHistory({ crop, state, district, block, limit = 50 }) {
  // block may not map directly; CEDA expects market; ignore here
  return fetchPrices({ crop, state, district, limit, sort: 'desc' });
}

async function fetchCurrent({ crop, state, district, block }) {
  try {
    const items = await fetchPrices({ crop, state, district, limit: 10, sort: 'desc' });
    return items[0] || null;
  } catch (err) {
    const code = err.response?.status;
    const body = err.response?.data;
    const message = body?.message || body?.error || err.message;
    throw new Error(`CEDA current request failed${code ? ` (${code})` : ''}: ${message}`);
  }
}

module.exports = {
  fetchPrices,
  fetchHistory,
  fetchCurrent,
  getCommodities,
  getGeographies,
  fetchMarkets,
};

// --- Helpers: resolve IDs ---
let _commoditiesCache = null; // { data, expiresAt }
let _geosCache = null; // { data, expiresAt }
const _marketsCache = new Map(); // key -> { data, expiresAt }

function pickId(obj, candidates) {
  for (const k of candidates) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
  }
  return undefined;
}

function pickName(obj, candidates) {
  for (const k of candidates) {
    if (obj && typeof obj[k] === 'string') return obj[k];
  }
  return undefined;
}

async function getCommodities(refresh = false) {
  const now = Date.now();
  if (!refresh && _commoditiesCache && _commoditiesCache.expiresAt > now) return _commoditiesCache.data;
  let data;
  try {
    data = await requestWithAuth('get', CEDA_COMMODITIES_ENDPOINT);
  } catch (err) {
    // On upstream throttle or server error, serve stale cache if available
    if (_commoditiesCache && _commoditiesCache.data && err.statusCode && [429, 500, 502, 503, 504].includes(err.statusCode)) {
      return _commoditiesCache.data;
    }
    throw err;
  }

  // Helper: ensure array from either array or object map, preserving keys as IDs when needed
  const toArray = (x) => {
    if (Array.isArray(x)) return x;
    if (x && typeof x === 'object') {
      return Object.entries(x).map(([key, val]) => {
        if (val && typeof val === 'object') return val; // already an object; mapping will pick id/name
        // primitive value -> construct minimal object preserving key as id
        return { id: key, name: String(val), value: val };
      });
    }
    return [];
  };

  // Try multiple candidate locations/shapes
  const candidates = [
    data?.commodities,
    data?.data?.commodities,
    data?.results,
    data?.items,
    data?.payload,
    data?.list,
    data?.data,
    data,
  ];

  let arr = [];
  for (const c of candidates) {
    const asArr = toArray(c);
    if (asArr.length) { arr = asArr; break; }
  }

  const mapped = arr.map((c) => ({
    id: pickId(c, ['id', 'commodity_id', 'commodityId', 'code', 'value', '_id', 'uid']) || c?.id,
    name: pickName(c, ['name', 'commodity', 'commodity_name', 'label', 'short_name', 'display', 'text', 'title']) || c?.name,
    raw: c,
  })).filter((x) => x.id && x.name);

  // Only cache non-empty results to avoid caching bad/empty payloads
  if (mapped.length) {
    _commoditiesCache = { data: mapped, expiresAt: now + CEDA_CACHE_TTL_MS };
  }
  return mapped;
}

async function getGeographies(refresh = false) {
  const now = Date.now();
  if (!refresh && _geosCache && _geosCache.expiresAt > now) return _geosCache.data;
  let data;
  try {
    data = await requestWithAuth('get', CEDA_GEOGRAPHIES_ENDPOINT);
  } catch (err) {
    if (_geosCache && _geosCache.data && err.statusCode && [429, 500, 502, 503, 504].includes(err.statusCode)) {
      return _geosCache.data;
    }
    throw err;
  }
  // Normalize to { states: [{ id, name, districts: [{ id, name }] }] }
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z]/g, '');
  const getKey = (obj, names) => {
    if (!obj || typeof obj !== 'object') return undefined;
    const map = new Map(Object.keys(obj).map((k) => [norm(k), k]));
    for (const n of names) { const k = map.get(norm(n)); if (k) return obj[k]; }
    return undefined;
  };
  const toArray = (x) => Array.isArray(x) ? x : (x && typeof x === 'object' ? Object.entries(x).map(([k,v]) => (typeof v==='object'? v : { id: k, name: String(v), value: v })) : []);

  const root = data?.geographies ?? data?.data ?? data?.output ?? data?.payload ?? data;
  const rawStates = getKey(root, ['states','state','states_list','state_list']) ?? root;
  const statesArr = toArray(rawStates).map((s) => {
    const sid = s.id || s.state_id || s.code || s.value;
    const sname = s.name || s.state || s.state_name;
    const rawD = getKey(s, ['districts','district','districts_list','district_list','children']) ?? s.districts ?? s.children ?? s.district_list ?? s.districts_list ?? [];
    const districts = toArray(rawD).map((d) => ({ id: d.id || d.district_id || d.code || d.value, name: d.name || d.district || d.district_name })).filter((x)=>x.id && x.name);
    return { id: sid, name: sname, districts };
  }).filter((x)=>x.id && x.name);

  const normalized = { states: statesArr };
  _geosCache = { data: normalized, expiresAt: now + CEDA_CACHE_TTL_MS };
  return normalized;
}

async function resolveCommodityId(name) {
  if (!name) throw new Error('Commodity name is required');
  const items = await getCommodities();
  const n = String(name).trim().toLowerCase();
  const found = items.find((x) => x.name.toLowerCase() === n) || items.find((x) => x.name.toLowerCase().includes(n));
  if (!found) throw new Error(`Unknown commodity: ${name}`);
  return { commodityId: found.id, commodityName: found.name };
}

async function resolveGeoIds(stateName, districtName) {
  const data = await getGeographies();
  // Try several shapes: { states: [...] } or flat arrays
  const states = Array.isArray(data?.states) ? data.states : (Array.isArray(data) ? data : []);

  const sname = String(stateName || '').trim().toLowerCase();
  let stateEntry = states.find((s) => (pickName(s, ['name', 'state', 'state_name']) || '').toLowerCase() === sname)
    || states.find((s) => (pickName(s, ['name', 'state', 'state_name']) || '').toLowerCase().includes(sname));

  if (!stateEntry && !sname) return { stateId: undefined, districtId: undefined };
  if (!stateEntry) throw new Error(`Unknown state: ${stateName}`);

  const stateId = pickId(stateEntry, ['id', 'state_id', 'stateId', 'code', 'value']);

  let districtId;
  if (districtName) {
    const districts = Array.isArray(stateEntry?.districts) ? stateEntry.districts
      : (Array.isArray(stateEntry?.children) ? stateEntry.children : []);
    const dname = String(districtName).trim().toLowerCase();
    const dEntry = districts.find((d) => (pickName(d, ['name', 'district', 'district_name']) || '').toLowerCase() === dname)
      || districts.find((d) => (pickName(d, ['name', 'district', 'district_name']) || '').toLowerCase().includes(dname));
    districtId = pickId(dEntry || {}, ['id', 'district_id', 'districtId', 'code', 'value']);
    if (districtName && !districtId) {
      throw new Error(`Unknown district: ${districtName} (state: ${stateName})`);
    }
  }

  return { stateId, districtId };
}

async function fetchMarkets({ commodityId, stateId, districtId, refresh = false }) {
  const key = `${commodityId}|${stateId}|${districtId || ''}`;
  const now = Date.now();
  if (!refresh && _marketsCache.has(key)) {
    const entry = _marketsCache.get(key);
    if (entry.expiresAt > now) return entry.data;
  }
  const toArray = (x) => {
    if (Array.isArray(x)) return x;
    if (x && typeof x === 'object') return Object.entries(x).map(([k, v]) => (typeof v === 'object' ? v : { id: k, name: String(v), value: v }));
    return [];
  };
  const bodyVariants = [
    { commodity_id: commodityId, state_id: stateId, district_id: districtId },
    { commodityId, stateId, districtId },
    { commodity: commodityId, state: stateId, district: districtId },
  ];
  let lastErr;
  for (const b of bodyVariants) {
    try {
      const data = await requestWithAuth('post', '/agmarknet/markets', b);
      const candidate = data?.results ?? data?.data ?? data?.items ?? data;
      const list = toArray(candidate);
      const mapped = list.map((m) => ({
        id: pickId(m, ['id', 'market_id', 'marketId', 'code', 'value']),
        name: pickName(m, ['name', 'market', 'market_name', 'label']),
        raw: m,
      })).filter((x) => x.id && x.name);
      _marketsCache.set(key, { data: mapped, expiresAt: now + CEDA_CACHE_TTL_MS });
      return mapped;
    } catch (err) {
      lastErr = err;
      if (err?.response?.status && ![400, 401, 422].includes(err.response.status)) break;
    }
  }
  throw lastErr || new Error('CEDA markets request failed');
}
