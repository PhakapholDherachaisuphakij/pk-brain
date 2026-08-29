import express from 'express';
import { supabase } from '../services/supabase.js';
import { analyzeAndExtractKnowledge } from '../services/aiService.js';

export const webhooksRouter = express.Router();

// POST /api/webhooks/ingest - Universal webhook for LEB2, GitHub, Discord bots
webhooksRouter.post('/ingest', async (req, res) => {
  try {
    const { source = 'webhook', content, title, tags = [], metadata = {} } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Auto-analyze via Typhoon
    const analysis = await analyzeAndExtractKnowledge(content, title || '');

    const { data: entry, error } = await supabase
      .from('knowledge_entries')
      .insert({
        content,
        summary: analysis.summary || title || content.slice(0, 100),
        category: analysis.category || 'general',
        source,
        metadata: {
          ...metadata,
          source_title: title,
          tags: [...tags, ...(analysis.tags || [])]
        }
      })
      .select()
      .single();

    if (error) throw error;

    const allTags = Array.from(new Set([...tags, ...(analysis.tags || [])]));
    if (allTags.length > 0) {
      const tagRows = allTags.map(t => ({ entry_id: entry.id, tag: t.toLowerCase() }));
      await supabase.from('knowledge_tags').insert(tagRows);
    }

    res.json({
      success: true,
      message: 'Ingested into PK Brain successfully',
      entry_id: entry.id,
      category: analysis.category
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
