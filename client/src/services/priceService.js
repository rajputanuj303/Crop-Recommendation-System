export async function getCurrentPrice(params) {
  const url = new URL('/api/prices/current', window.location.origin);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString().replace(window.location.origin, ''), { method: 'GET' });
  if (!res.ok) {
    let msg = `Failed to fetch current price (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch (_) {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function getHistoricalPrices(params) {
  const url = new URL('/api/prices/history', window.location.origin);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString().replace(window.location.origin, ''), { method: 'GET' });
  if (!res.ok) {
    let msg = `Failed to fetch history (${res.status})`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch (_) {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}
