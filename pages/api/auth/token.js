export default function handler(req, res) {
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/shopify_token=([^;]+)/);
  const domainMatch = cookies.match(/shopify_domain=([^;]+)/);
  if (!tokenMatch || !domainMatch) return res.status(404).json({ error: 'no token' });
  return res.status(200).json({ token: tokenMatch[1], domain: domainMatch[1] });
}
