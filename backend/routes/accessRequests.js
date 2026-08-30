import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

// GET all access requests
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
