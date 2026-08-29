import express from 'express';
import { supabase } from '../services/supabase.js';
import crypto from 'crypto';

export const uploadRouter = express.Router();

// POST /api/upload - Upload image (supports base64 dataUrl or binary)
uploadRouter.post('/', async (req, res) => {
  try {
    const { imageBase64, filename, bucket = 'portfolio-assets' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 data is required' });
    }

    // Extract mime type and clean buffer
    let mimeType = 'image/png';
    let rawBase64 = imageBase64;
    let ext = 'png';

    if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      mimeType = parts[0].replace('data:', '');
      rawBase64 = parts[1];
      ext = mimeType.split('/')[1] || 'png';
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    const randomName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = `uploads/${randomName}`;

    // Also persist locally to Portfolio public/uploads for instant 0ms CDN sync
    try {
      const portfolioPublicUploads = '/home/phakaphol/projects/Portfolio/frontend/public/uploads';
      fs.mkdirSync(portfolioPublicUploads, { recursive: true });
      fs.writeFileSync(path.join(portfolioPublicUploads, randomName), buffer);
    } catch (e) {
      console.warn('Local public sync warning:', e.message);
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadErr } = await supabase
      .storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true
      });

    let targetBucket = bucket;
    if (uploadErr) {
      targetBucket = 'image';
      // Fallback to 'image' bucket if portfolio-assets errors
      const { data: fallbackData, error: fallbackErr } = await supabase
        .storage
        .from('image')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true
        });
      if (fallbackErr) throw fallbackErr;
    }

    // Generate public URL
    const { data: publicUrlData } = supabase
      .storage
      .from(targetBucket)
      .getPublicUrl(filePath);

    let publicUrl = publicUrlData?.publicUrl || '';
    const publicBase = process.env.SUPABASE_PUBLIC_URL;
    const internalBase = process.env.SUPABASE_URL;
    if (publicBase && internalBase && publicUrl.startsWith(internalBase)) {
      publicUrl = publicUrl.replace(internalBase, publicBase);
    }

    res.json({
      success: true,
      url: publicUrl,
      filename: randomName
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});
