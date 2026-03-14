import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    if (!file) return res.status(400).json({ error: 'image が必要です' });

    try {
      const fileData = fs.readFileSync(file.filepath);
      const base64 = fileData.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      const filename = file.originalFilename || 'upload.jpg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return res.status(200).json({ url: dataUrl, filename });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
}
