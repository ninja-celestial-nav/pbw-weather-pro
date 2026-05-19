// Vercel Serverless Function: CWA API Proxy
// Hides API key and avoids CORS issues in production

// Simple in-memory counter for serverless environment (resets on cold start)
let requestCount = 0;
let lastReset = Date.now();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

  // Reset counter daily (roughly, based on instance lifetime)
  const now = Date.now();
  if (now - lastReset > 24 * 60 * 60 * 1000) {
    requestCount = 0;
    lastReset = now;
  }
  requestCount++;

  // C15: Log rate limit metrics for monitoring
  console.log(`[CWA API Proxy] Request #${requestCount} since ${new Date(lastReset).toISOString()}`);

  const { apiCode, locationName } = req.query;

  if (!apiCode) {
    return res.status(400).json({ error: 'Missing apiCode parameter' });
  }

  const CWA_API_KEY = process.env.CWA_API_KEY;
  if (!CWA_API_KEY) {
    console.error('[CWA API Proxy] CWA_API_KEY environment variable is not set');
    return res.status(500).json({ error: 'Server configuration error: missing API key' });
  }
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${apiCode}?Authorization=${CWA_API_KEY}&format=JSON${locationName ? `&LocationName=${encodeURIComponent(locationName)}` : ''}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[CWA API Proxy] Error ${response.status} from upstream`);
      return res.status(response.status).json({ error: `CWA API error: ${response.status}` });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error(`[CWA API Proxy] Internal Error:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}
