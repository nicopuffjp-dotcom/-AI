import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    const domain = Array.isArray(fields.domain) ? fields.domain[0] : fields.domain;
    const token = Array.isArray(fields.token) ? fields.token[0] : fields.token;

    if (!file || !domain || !token) {
      return res.status(400).json({ error: 'image, domain, token が必要です' });
    }

    try {
      const fileData = fs.readFileSync(file.filepath);
      const base64 = fileData.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      const filename = file.originalFilename || 'upload.jpg';

      const shopifyRes = await fetch(
        `https://${domain}/admin/api/2025-01/graphql.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
              stagedUploadsCreate(input: $input) {
                stagedTargets {
                  url
                  resourceUrl
                  parameters { name value }
                }
                userErrors { field message }
              }
            }`,
            variables: {
              input: [{
                filename,
                mimeType,
                resource: 'IMAGE',
                fileSize: String(fileData.length),
              }],
            },
          }),
        }
      );

      const gqlData = await shopifyRes.json();
      const target = gqlData?.data?.stagedUploadsCreate?.stagedTargets?.[0];

      if (!target) {
        return res.status(500).json({ error: 'Shopifyステージング失敗' });
      }

      const formData = new FormData();
      target.parameters.forEach(p => formData.append(p.name, p.value));
      formData.append('file', new Blob([fileData], { type: mimeType }), filename);

      await fetch(target.url, { method: 'POST', body: formData });

      return res.status(200).json({ url: target.resourceUrl, filename });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
}
