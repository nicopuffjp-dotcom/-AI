export default function handler(req, res) {
  const { shop } = req.query;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
  const scopes = 'write_content,read_content,write_publications,read_publications';
  const url = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=abc123`;
  res.redirect(302, url);
}
