import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentPrice, getHistoricalPrices } from '../services/priceService';
import { getCommodities, getGeographies, getMarkets, searchPricesByIds } from '../services/cedaService';

const geoSupported = () => typeof navigator !== 'undefined' && 'geolocation' in navigator;

export default function CropPriceFinder() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState({ commodityId: '', stateId: '', districtId: '', marketId: '' });
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [commodities, setCommodities] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [geoRaw, setGeoRaw] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [marketsLoading, setMarketsLoading] = useState(false);

  const title = 'Crop-Price-Finder AI';
  const description = 'Discover real-time mandi prices near you and explore historical trends to plan better selling decisions.';

  const canSearch = useMemo(() => !!(form.commodityId && form.stateId), [form]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onCommodityChange = (e) => {
    setForm((f) => ({ ...f, commodityId: e.target.value, marketId: '' }));
  };
  const onStateChange = (e) => {
    const newState = e.target.value;
    setForm((f) => ({ ...f, stateId: newState, districtId: '', marketId: '' }));
  };
  const onDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setForm((f) => ({ ...f, districtId: newDistrict, marketId: '' }));
  };
  const onMarketChange = (e) => setForm((f) => ({ ...f, marketId: e.target.value }));

  const handleDetect = async () => {
    if (!geoSupported()) return;
    setDetecting(true);
    setError('');
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
      });
      // We don't have reverse geocoding here; inform user to enter state/district if needed.
      setError(t('Fetching weather data for your location...'));
    } catch (e) {
      setError(t('Unable to retrieve your location.'));
    } finally {
      setDetecting(false);
    }
  };

  const search = async () => {
    setLoading(true); setError('');
    try {
      // Prefer server-side ID-based search via /api/ceda/prices
      const { results } = await searchPricesByIds({
        commodityId: form.commodityId,
        stateId: form.stateId,
        districtId: form.districtId || undefined,
        marketId: form.marketId || undefined,
        limit: 50,
      });
      const latest = Array.isArray(results) && results.length ? results[0] : null;
      setCurrent(latest);
      setHistory(results || []);
    } catch (e) {
      setError(e.message || 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  // Geographies now normalized by server to { states: [{ id, name, districts: [{ id, name }] }] }

  useEffect(() => {
    // Load CEDA lists with localStorage cache and network refresh
  (async () => {
      setMetaLoading(true);
      try {
        // try cache first
        const cCache = JSON.parse(localStorage.getItem('ceda:commodities') || 'null');
        const gCache = JSON.parse(localStorage.getItem('ceda:geographies') || 'null');
    const last = JSON.parse(localStorage.getItem('ceda:lastUpdated') || 'null');
        const now = Date.now();
        const ttl = 6 * 60 * 60 * 1000; // 6h
        if (cCache && cCache.expiresAt > now) setCommodities(cCache.data || []);
        if (gCache && gCache.expiresAt > now) {
          const geoPayload = gCache.data?.geographies ?? gCache.data;
          setGeoRaw(geoPayload);
          const stateListC = Array.isArray(geoPayload?.states) ? geoPayload.states : [];
          setStates(stateListC.map((s) => ({ id: s.id, name: s.name, raw: s })).filter((x) => x.id && x.name));
        }
    if (last) setLastUpdated(last);

        // then refresh from network
        const [c, g] = await Promise.all([getCommodities(), getGeographies()]);
        const comms = c.commodities || [];
        setCommodities(comms);
        localStorage.setItem('ceda:commodities', JSON.stringify({ data: comms, expiresAt: now + ttl }));

  setGeoRaw(g.geographies || g);
  const stateList = Array.isArray((g?.geographies || g)?.states) ? (g.geographies || g).states : [];
  const mappedStates = stateList.map((s) => ({ id: s.id, name: s.name, raw: s })).filter((x) => x.id && x.name);
        setStates(mappedStates);
        localStorage.setItem('ceda:geographies', JSON.stringify({ data: g, expiresAt: now + ttl }));
    localStorage.setItem('ceda:lastUpdated', JSON.stringify(now));
    setLastUpdated(now);
      } catch (e) {
        if (!commodities.length || !states.length) setError('Failed to load CEDA metadata');
      } finally {
        setMetaLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
  // Update districts when state changes
  const st = states.find((s) => String(s.id) === String(form.stateId));
  if (!st) { setDistricts([]); return; }
  const raw = st.raw;
  const distList = Array.isArray(raw?.districts) ? raw.districts : [];
  const mapped = distList.map((d) => ({ id: d.id, name: d.name })).filter((x) => x.id && x.name);
  setDistricts(mapped);
  }, [form.stateId, states]);

  useEffect(() => {
    // Load markets when commodity/state/district set
    (async () => {
      if (!form.commodityId || !form.stateId) { setMarkets([]); return; }
      try {
        setMarketsLoading(true);
        const { markets: m } = await getMarkets({ commodityId: form.commodityId, stateId: form.stateId, districtId: form.districtId || undefined });
        setMarkets(m || []);
      } catch { setMarkets([]); }
      finally { setMarketsLoading(false); }
    })();
  }, [form.commodityId, form.stateId, form.districtId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-emerald-50 to-sky-50">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-emerald-700 to-sky-700 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
          <div className="hidden sm:block">
            <button
              onClick={search}
              disabled={!canSearch || loading}
              className="px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 shadow"
            >
              {loading ? t('Processing...') : 'Find Prices'}
            </button>
            <button
              onClick={async ()=>{ setError(''); setMetaLoading(true); try { const [c,g]=await Promise.all([getCommodities({refresh:true}), getGeographies({refresh:true})]); const now=Date.now(); setCommodities(c.commodities||[]); setGeoRaw(g.geographies||g); const stateList = Array.isArray(g?.geographies?.states)?g.geographies.states:Array.isArray(g?.geographies)?g.geographies:Array.isArray(g)?g:[]; setStates(stateList.map((s)=>({id:s.id||s.state_id||s.code||s.value,name:s.name||s.state||s.state_name,raw:s})).filter((x)=>x.id&&x.name)); localStorage.setItem('ceda:lastUpdated', JSON.stringify(now)); setLastUpdated(now); } catch(e){ setError('Refresh failed'); } finally { setMetaLoading(false); } }}
              className="ml-2 px-4 py-2 rounded-full border text-emerald-700 border-emerald-600 hover:bg-emerald-50"
            >
              Refresh lists
            </button>
            {lastUpdated && (
              <span className="ml-3 text-xs text-gray-500">Last updated: {new Date(lastUpdated).toLocaleString()}</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 border">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">Commodity</label>
              {metaLoading && commodities.length === 0 ? (
                <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
              ) : (
                <select name="commodityId" value={form.commodityId} onChange={onCommodityChange} className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="" disabled={metaLoading}>{metaLoading ? 'Loading…' : 'Select Commodity'}</option>
                  {commodities.length === 0 && !metaLoading && <option disabled>No commodities available</option>}
                  {commodities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">State</label>
              {metaLoading && states.length === 0 ? (
                <div className="h-10 rounded-md bg-gray-100 animate-pulse" />
              ) : (
                <select name="stateId" value={form.stateId} onChange={onStateChange} className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="" disabled={metaLoading}>{metaLoading ? 'Loading…' : 'Select State'}</option>
                  {states.length === 0 && !metaLoading && <option disabled>No states available</option>}
                  {states.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">District</label>
              <select name="districtId" value={form.districtId} onChange={onDistrictChange} className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white" disabled={!form.stateId}>
                <option value="">Select District</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {!form.stateId && (
                <span className="text-xs text-gray-500">Choose a state to load districts</span>
              )}
            </div>

      <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">Market (optional)</label>
              <select name="marketId" value={form.marketId} onChange={onMarketChange} className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 bg-white" disabled={!form.stateId || !form.commodityId}>
        <option value="">{marketsLoading ? 'Loading markets…' : 'Select Market (optional)'}</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {(!form.stateId || !form.commodityId) && (
                <span className="text-xs text-gray-500">Select commodity and state to load markets</span>
              )}
            </div>
          </div>
          <div className="sm:hidden mt-3">
            <button
              onClick={search}
              disabled={!canSearch || loading}
              className="w-full px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 shadow"
            >
              {loading ? t('Processing...') : 'Find Prices'}
            </button>
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-600">{error}</div>
          )}
          {metaLoading && (
            <div className="mt-3 text-sm text-gray-500">Loading CEDA lists…</div>
          )}
        </div>

        {/* Current price card */}
        {current && (
          <div className="mt-6 bg-white rounded-2xl shadow p-5 border">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-emerald-700">Real-Time Mandi Price</h2>
                <p className="text-gray-600 text-sm">Latest reported price for your selection</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold text-sky-700">{current.modal ? `₹${current.modal}` : '—'} <span className="text-base font-medium text-gray-500">{current.unit || '₹/quintal'}</span></div>
                <div className="text-xs text-gray-500">{current.date ? new Date(current.date).toLocaleString() : ''}</div>
              </div>
            </div>
            <div className="mt-3 text-gray-700">
              <div className="flex flex-wrap gap-2 text-sm">
                {current.commodity && <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border">{current.commodity}</span>}
                {current.state && <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 border">{current.state}</span>}
                {current.district && <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border">{current.district}</span>}
                {current.block && <span className="px-2 py-1 rounded-full bg-fuchsia-50 text-fuchsia-700 border">{current.block}</span>}
                {current.mandi && <span className="px-2 py-1 rounded-full bg-lime-50 text-lime-700 border">{current.mandi}</span>}
              </div>
              <div className="mt-2 text-sm text-gray-600">Min: {current.min ? `₹${current.min}` : '—'} • Max: {current.max ? `₹${current.max}` : '—'}</div>
            </div>
          </div>
        )}

        {/* History table */}
        {history?.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow border overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-800">Historical Prices (Latest first)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white">
                  <tr className="text-left">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Commodity</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Block</th>
                    <th className="px-4 py-3">Mandi</th>
                    <th className="px-4 py-3">Min</th>
                    <th className="px-4 py-3">Modal</th>
                    <th className="px-4 py-3">Max</th>
                    <th className="px-4 py-3">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((h, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">{h.date ? new Date(h.date).toLocaleString() : ''}</td>
                      <td className="px-4 py-2">{h.commodity}</td>
                      <td className="px-4 py-2">{h.state}</td>
                      <td className="px-4 py-2">{h.district}</td>
                      <td className="px-4 py-2">{h.block}</td>
                      <td className="px-4 py-2">{h.mandi}</td>
                      <td className="px-4 py-2">{h.min != null ? `₹${h.min}` : '—'}</td>
                      <td className="px-4 py-2 font-semibold">{h.modal != null ? `₹${h.modal}` : '—'}</td>
                      <td className="px-4 py-2">{h.max != null ? `₹${h.max}` : '—'}</td>
                      <td className="px-4 py-2">{h.unit || '₹/quintal'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
