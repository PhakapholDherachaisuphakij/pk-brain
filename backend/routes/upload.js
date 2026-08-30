import express from 'express';
import { supabase } from '../services/supabase.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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

    // 1. Upload to permanent free CDN (Catbox.moe) for instant global access (0$, No Domain, No Git)
    let cdnUrl = null;
    try {
      const blob = new Blob([buffer], { type: mimeType });
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('fileToUpload', blob, randomName);

      const cdnRes = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: formData
      });
      const returnedUrl = (await cdnRes.text()).trim();
      if (returnedUrl.startsWith('https://')) {
        cdnUrl = returnedUrl;
      }
    } catch (cdnErr) {
      console.warn('CDN upload warning:', cdnErr.message);
    }

    // 2. Local Backup: Upload to Supabase Storage
    let publicUrl = '';
    try {
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
        await supabase
          .storage
          .from('image')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true
          }).catch(() => {});
      }

      const { data: publicUrlData } = supabase
        .storage
        .from(targetBucket)
        .getPublicUrl(filePath);

      publicUrl = publicUrlData?.publicUrl || '';
      if (publicUrl.includes('/storage/v1/object/public/')) {
        publicUrl = '/storage/v1/object/public/' + publicUrl.split('/storage/v1/object/public/')[1];
      }
    } catch (e) {
      console.warn('Local Supabase storage backup warning:', e.message);
    }

    const finalUrl = cdnUrl || publicUrl;

    res.json({
      success: true,
      url: finalUrl,
      filename: randomName
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});
