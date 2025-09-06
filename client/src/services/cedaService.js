export async function getCommodities({ refresh } = {}) {
  const url = new URL('/api/ceda/commodities', window.location.origin);
  if (refresh) url.searchParams.set('refresh', 'true');
  url.searchParams.set('_ts', Date.now());
  const res = await fetch(url.toString().replace(window.location.origin, ''), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load commodities');
  return res.json();
}

export async function getGeographies({ refresh } = {}) {
  const url = new URL('/api/ceda/geographies', window.location.origin);
  if (refresh) url.searchParams.set('refresh', 'true');
  url.searchParams.set('_ts', Date.now());
  const res = await fetch(url.toString().replace(window.location.origin, ''), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load geographies');
  return res.json();
}

export async function getMarkets({ commodityId, stateId, districtId, refresh } = {}) {
  const res = await fetch('/api/ceda/markets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify({ commodityId, stateId, districtId, refresh }),
  });
  if (!res.ok) throw new Error('Failed to load markets');
  return res.json();
}

export async function searchPricesByIds(payload) {
  const res = await fetch('/api/ceda/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = `Failed to fetch prices (${res.status})`;
    try {
      const d = await res.json();
      if (d?.message) msg = d.message;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
