import fs from 'fs';

const LOCAL_SUPABASE_URL = 'http://localhost:8000';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

async function updateDatabaseUrls() {
  // 1. Upload local pk-brain.png
  try {
    const fileData = fs.readFileSync('/home/phakaphol/projects/Portfolio/frontend/public/projects/pk-brain.png');
    const upRes = await fetch(`${LOCAL_SUPABASE_URL}/storage/v1/object/portfolio-assets/projects/pk-brain.png`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true'
      },
      body: fileData
    });
    console.log('✅ pk-brain.png uploaded to local storage, status:', upRes.status);
  } catch (e) {
    console.error('Error uploading pk-brain.png:', e.message);
  }

  // 2. Normalize projects image_url
  const pRes = await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/projects?select=*`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  const projects = await pRes.json();
  console.log(`Checking ${projects.length} projects...`);

  for (const p of projects) {
    let newUrl = p.image_url;
    if (newUrl) {
      if (newUrl.includes('frpbnexgcxfjpsrlsylt.supabase.co')) {
        // Change from cloud supabase to homelab / storage path
        newUrl = newUrl.replace('https://frpbnexgcxfjpsrlsylt.supabase.co', 'https://homelab.tail7d4c51.ts.net');
      } else if (newUrl.startsWith('http://localhost:8000')) {
        newUrl = newUrl.replace('http://localhost:8000', 'https://homelab.tail7d4c51.ts.net');
      }
      
      if (p.title?.toLowerCase().includes('brain')) {
        newUrl = 'https://homelab.tail7d4c51.ts.net/storage/v1/object/public/portfolio-assets/projects/pk-brain.png';
      }

      if (newUrl !== p.image_url) {
        await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/projects?id=eq.${p.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image_url: newUrl })
        });
        console.log(`Updated project "${p.title}" -> ${newUrl}`);
      }
    }
  }

  // 3. Normalize activities main_image & gallery
  const aRes = await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/activities?select=*`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  const activities = await aRes.json();
  console.log(`Checking ${activities.length} activities...`);

  for (const a of activities) {
    let newImage = a.main_image;
    let newGallery = a.gallery || [];
    let changed = false;

    if (newImage && newImage.includes('frpbnexgcxfjpsrlsylt.supabase.co')) {
      newImage = newImage.replace('https://frpbnexgcxfjpsrlsylt.supabase.co', 'https://homelab.tail7d4c51.ts.net');
      changed = true;
    }
    if (newImage && newImage.startsWith('http://localhost:8000')) {
      newImage = newImage.replace('http://localhost:8000', 'https://homelab.tail7d4c51.ts.net');
      changed = true;
    }

    if (Array.isArray(newGallery)) {
      const updatedG = newGallery.map(g => {
        if (typeof g === 'string') {
          return g.replace('https://frpbnexgcxfjpsrlsylt.supabase.co', 'https://homelab.tail7d4c51.ts.net')
                  .replace('http://localhost:8000', 'https://homelab.tail7d4c51.ts.net');
        }
        return g;
      });
      if (JSON.stringify(updatedG) !== JSON.stringify(newGallery)) {
        newGallery = updatedG;
        changed = true;
      }
    }

    if (changed) {
      await fetch(`${LOCAL_SUPABASE_URL}/rest/v1/activities?id=eq.${a.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ main_image: newImage, gallery: newGallery })
      });
      console.log(`Updated activity "${a.title}"`);
    }
  }

  console.log('🎉 All Database URLs Normalized to homelab Supabase!');
}

updateDatabaseUrls();
