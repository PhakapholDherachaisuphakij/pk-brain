import fs from 'fs';
import path from 'path';

const CLOUD_BASE = 'https://frpbnexgcxfjpsrlsylt.supabase.co/storage/v1/object/public/portfolio-assets';
const LOCAL_SUPABASE_URL = 'http://localhost:8000';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

// List of all known assets from Data.js & database
const assetsToMigrate = [
  'assets/pkshop.jfif',
  'assets/crypto.jfif',
  'assets/iot.png',
  'assets/TPR/tprport.png',
  'assets/TPR/tpr1.jpeg',
  'assets/TPR/tpr2.jpeg',
  'assets/TPR/tpr3.jpeg',
  'assets/TPR/tpr4.jpeg',
  'assets/Devinit/devinit.jpg',
  'assets/Devinit/gsap.png',
  'assets/Devinit/css.png',
  'assets/Devinit/react.png',
  'IOT/iot.jpg',
  'IOT/iotmain.jpg',
  'IOT/iot2.jpg',
  'IOT/iot3.jpg',
  'IOT/iot4.jpg',
  'IOT/iot5.jpg',
  'assets/IT3K/3klogo.png',
  'assets/GTA6/gta6.png',
  'assets/Project/yaiba.jfif',
  'assets/Helloworld/helloworldhippo.png',
  'assets/pkflix.png',
  'assets/cognisync.png',
  'assets/pheeraphat-port.png',
  'assets/iphone.png',
  'assets/it-fun-slide.png',
  'assets/accordion/helloworld.jpg',
  'assets/accordion/Teacher.jpg',
  'assets/ecom.png',
  'projects/jarvis-trade-1.png',
  'projects/pk-brain.png',
  'assets/starterpack pk/sit_photo (2 of 96).jpg',
  'assets/starterpack pk/sit_photo (13 of 115).jpg',
  'assets/starterpack pk/sit_photo (14 of 115).jpg',
  'assets/starterpack pk/sit_photo (25 of 149).jpg',
  'assets/starterpack pk/sit_photo (3 of 149).jpg',
  'assets/starterpack pk/sit_photo (45 of 149).jpg',
  'assets/starterpack pk/sit_photo (46 of 149).jpg',
  'assets/starterpack pk/sit_photo (6 of 149).jpg',
  'assets/starterpack pk/sit_photo (63 of 149).jpg',
  'assets/starterpack pk/sit_photo (80 of 149).jpg',
  'assets/starterpack pk/sit_photo (101 of 149).jpg',
  'assets/starterpack pk/sit_photo (137 of 149).jpg',
  'assets/starterpack pk/sit_photo (138 of 149).jpg',
  'assets/starterpack pk/sit_photo (149 of 149).jpg',
  'assets/starterpack pk/sit_photo (12 of 61).jpg',
  'assets/starterpack pk/sit_photo (27 of 61).jpg',
  'assets/starterpack pk/sit_photo (3 of 61).jpg',
  'assets/starterpack pk/sit_photo (31 of 61).jpg',
  'assets/starterpack pk/sit_photo (32 of 61).jpg',
  'assets/starterpack pk/sit_photo (54 of 61).jpg',
  'assets/starterpack pk/sit_photo (55 of 61).jpg',
  'assets/starterpack pk/sit_photo (9 of 61).jpg',
  'assets/starterpack pk/sit_photo (14 of 96).jpg',
  'assets/starterpack pk/sit_photo (32 of 96).jpg',
  'assets/starterpack pk/sit_photo (33 of 96).jpg',
  'assets/starterpack pk/sit_photo (43 of 96).jpg',
  'assets/starterpack pk/sit_photo (44 of 96).jpg',
  'assets/starterpack pk/sit_photo (47 of 96).jpg',
  'assets/starterpack pk/sit_photo (50 of 96).jpg',
  'assets/starterpack pk/sit_photo (72 of 96).jpg'
];

async function migrate() {
  console.log(`🚀 Starting migration of ${assetsToMigrate.length} assets to local Supabase...`);
  let success = 0;
  let failed = 0;

  for (const assetPath of assetsToMigrate) {
    const cloudUrl = `${CLOUD_BASE}/${encodeURI(assetPath)}`;
    try {
      const res = await fetch(cloudUrl);
      if (!res.ok) {
        console.warn(`⚠️ Could not fetch from cloud (${res.status}): ${assetPath}`);
        failed++;
        continue;
      }

      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'application/octet-stream';

      // Upload to local Supabase Storage
      const uploadUrl = `${LOCAL_SUPABASE_URL}/storage/v1/object/portfolio-assets/${encodeURI(assetPath)}`;
      const upRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true'
        },
        body: buffer
      });

      if (upRes.ok) {
        console.log(`✅ Uploaded: ${assetPath}`);
        success++;
      } else {
        const errText = await upRes.text();
        console.error(`❌ Failed to upload ${assetPath}: ${errText}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ Error on ${assetPath}:`, err.message);
      failed++;
    }
  }

  console.log(`\n🎉 Migration finished! Success: ${success}, Failed: ${failed}`);
}

migrate();
