import express from 'express';
import { supabase } from '../services/supabase.js';

export const knowledgeRouter = express.Router();

// GET /api/knowledge - Query knowledge entries
knowledgeRouter.get('/', async (req, res) => {
  try {
    const { category, tag, q, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('knowledge_entries')
      .select('*, knowledge_tags(tag)')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (q && q.trim()) {
      query = query.ilike('content', `%${q.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let filtered = data || [];
    if (tag && tag.trim()) {
      filtered = filtered.filter(item => 
        item.knowledge_tags?.some(t => t.tag.toLowerCase() === tag.trim().toLowerCase())
      );
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/knowledge/stats - Overview statistics of PK Brain
knowledgeRouter.get('/stats', async (req, res) => {
  try {
    const { data: entries, error } = await supabase
      .from('knowledge_entries')
      .select('category, is_pinned');

    if (error) throw error;

    const { data: tagsData } = await supabase
      .from('knowledge_tags')
      .select('tag');

    const { count: proposalCount } = await supabase
      .from('portfolio_proposals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const categoryCounts = {};
    (entries || []).forEach(e => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });

    const tagCounts = {};
    (tagsData || []).forEach(t => {
      tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
    });

    res.json({
      total_entries: entries?.length || 0,
      pinned_count: entries?.filter(e => e.is_pinned)?.length || 0,
      pending_proposals: proposalCount || 0,
      categories: categoryCounts,
      top_tags: Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag, count]) => ({ tag, count }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/knowledge - Direct create knowledge entry
knowledgeRouter.post('/', async (req, res) => {
  try {
    const { content, summary, category = 'general', tags = [], source = 'manual' } = req.body;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    const { data: entry, error } = await supabase
      .from('knowledge_entries')
      .insert({ content, summary: summary || content.slice(0, 100), category, source })
      .select()
      .single();

    if (error) throw error;

    if (tags.length > 0) {
      const tagRows = tags.map(t => ({ entry_id: entry.id, tag: t.toLowerCase() }));
      await supabase.from('knowledge_tags').insert(tagRows);
    }

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/knowledge/:id
knowledgeRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('knowledge_entries').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
