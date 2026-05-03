// Vercel Serverless Function: CWA API Proxy
// Hides API key and avoids CORS issues in production

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

  const { apiCode, locationName } = req.query;

  if (!apiCode) {
    return res.status(400).json({ error: 'Missing apiCode parameter' });
  }

  const CWA_API_KEY = process.env.CWA_API_KEY || 'CWA-39834882-92D7-421E-A5B6-EE3BBF5F5E51';
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${apiCode}?Authorization=${CWA_API_KEY}&format=JSON${locationName ? `&LocationName=${encodeURIComponent(locationName)}` : ''}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ error: `CWA API error: ${response.status}` });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
