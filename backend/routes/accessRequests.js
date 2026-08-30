import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const cloudUrl = process.env.SUPABASE_CLOUD_URL || 'https://frpbnexgcxfjpsrlsylt.supabase.co';
const cloudKey = process.env.SUPABASE_CLOUD_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZycGJuZXhnY3hmanBzcmxzeWx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY0NzI4NiwiZXhwIjoyMDk0MjIzMjg2fQ.yuAKh44jIVoSgxpmHY_a-kx2FrtkxfoENgygBDEZiuk';

const supabase = createClient(cloudUrl, cloudKey, {
  auth: { persistSession: false }
});

// GET all access requests from Supabase Cloud
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('note_access_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, requests: data || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH approve request
router.patch('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('note_access_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, request: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH reject request
router.patch('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('note_access_requests')
      .update({ status: 'rejected' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, request: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE request
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('note_access_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, deleted: id });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
