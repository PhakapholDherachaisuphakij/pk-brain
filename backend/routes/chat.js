import express from 'express';
import { supabase } from '../services/supabase.js';
import { generateChatResponse, analyzeAndExtractKnowledge } from '../services/aiService.js';

export const chatRouter = express.Router();

// GET /api/chat/sessions - Get recent chat sessions
chatRouter.get('/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions/:id/messages - Get messages in a session
chatRouter.get('/sessions/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat - Send message, get AI response, extract knowledge & proposals
chatRouter.post('/', async (req, res) => {
  try {
    const { message, sessionId, imageUrl, imageUrls } = req.body;

    const allImageUrls = Array.isArray(imageUrls) 
      ? imageUrls.filter(Boolean) 
      : (imageUrl ? [imageUrl] : []);

    if ((!message || !message.trim()) && allImageUrls.length === 0) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    const effectiveMessage = message?.trim() || (allImageUrls.length > 0 ? `แนบรูปภาพ (${allImageUrls.length} รูป)` : '');
    let activeSessionId = sessionId;

    // 1. Create or verify session
    if (!activeSessionId) {
      const summaryTitle = effectiveMessage.slice(0, 35) + (effectiveMessage.length > 35 ? '...' : '');
      const { data: newSession, error: sErr } = await supabase
        .from('chat_sessions')
        .insert({ title: summaryTitle })
        .select()
        .single();
      if (sErr) throw sErr;
      activeSessionId = newSession.id;
    }

    // 2. Fetch recent conversation history
    const { data: historyData } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', activeSessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    const history = (historyData || []).map(m => ({ role: m.role, content: m.content }));

    // 3. Save user message to database
    await supabase.from('chat_messages').insert({
      session_id: activeSessionId,
      role: 'user',
      content: effectiveMessage,
      metadata: allImageUrls.length > 0 ? { 
        image_urls: allImageUrls, 
        image_url: allImageUrls[0] 
      } : {}
    });

    // 4. Generate AI response via Typhoon
    const reply = await generateChatResponse(history, effectiveMessage);

    // 5. Analyze & Extract Knowledge & Project Detection in parallel
    const analysis = await analyzeAndExtractKnowledge(effectiveMessage, reply);

    let savedKnowledge = null;
    let createdProposal = null;

    if (analysis.should_save) {
      // Deduplication check: check if an identical or near-identical entry exists in last 12 hours
      const contentSnippet = effectiveMessage.slice(0, 80);
      const { data: existingDup } = await supabase
        .from('knowledge_entries')
        .select('id, metadata')
        .ilike('content', `%${contentSnippet}%`)
        .limit(1)
        .maybeSingle();

      if (existingDup) {
        // Update existing entry with any new images/tags instead of creating duplicate
        const existingImages = existingDup.metadata?.image_urls || [];
        const mergedImages = Array.from(new Set([...existingImages, ...allImageUrls]));
        const { data: updatedEntry } = await supabase
          .from('knowledge_entries')
          .update({
            summary: analysis.summary,
            category: analysis.category,
            metadata: {
              ...existingDup.metadata,
              tags: analysis.tags || [],
              image_urls: mergedImages,
              image_url: mergedImages[0] || null,
              assistant_reply: reply.slice(0, 200)
            },
            updated_at: new Date()
          })
          .eq('id', existingDup.id)
          .select()
          .single();

        savedKnowledge = updatedEntry || existingDup;
      } else {
        // Insert new entry
        const { data: kEntry, error: kErr } = await supabase
          .from('knowledge_entries')
          .insert({
            content: effectiveMessage,
            summary: analysis.summary,
            category: analysis.category,
            source: 'chat',
            metadata: {
              tags: analysis.tags || [],
              image_urls: allImageUrls,
              image_url: allImageUrls[0] || null,
              assistant_reply: reply.slice(0, 200)
            }
          })
          .select()
          .single();

        if (!kErr && kEntry) {
          savedKnowledge = kEntry;

          // Insert tags into knowledge_tags
          if (Array.isArray(analysis.tags) && analysis.tags.length > 0) {
            const tagRows = analysis.tags.map(t => ({
              entry_id: kEntry.id,
              tag: t.trim().toLowerCase()
            }));
            await supabase.from('knowledge_tags').insert(tagRows);
          }
        }
      }

      if (savedKnowledge) {
        // A) If it is an Activity proposal (Instructor, Workshop, Camp, Hackathon, Event)
        if (analysis.is_major_activity && analysis.activity_details) {
          const ad = analysis.activity_details;
          const { data: proposal } = await supabase
            .from('portfolio_proposals')
            .insert({
              knowledge_entry_id: savedKnowledge.id,
              proposal_type: 'activity',
              proposed_title: ad.title || 'Untitled Activity',
              proposed_description: ad.description || '',
              proposed_tech_stack: [],
              proposed_image_url: allImageUrls[0] || null,
              gallery: allImageUrls,
              metadata: {
                semester: ad.semester || 'Semester 1',
                period_label: ad.period_label || 'Instructor'
              },
              status: 'pending'
            })
            .select()
            .single();

          if (proposal) {
            createdProposal = proposal;
          }
        }
        // B) If it is a Project proposal (Software, Web App)
        else if (analysis.is_major_project && analysis.project_details) {
          const pd = analysis.project_details;
          const { data: proposal } = await supabase
            .from('portfolio_proposals')
            .insert({
              knowledge_entry_id: savedKnowledge.id,
              proposal_type: 'project',
              proposed_title: pd.title || 'Untitled Project',
              proposed_description: pd.description || '',
              proposed_tech_stack: Array.isArray(pd.tech_stack) ? pd.tech_stack : ['Fullstack'],
              proposed_image_url: allImageUrls[0] || null,
              gallery: allImageUrls,
              proposed_link: pd.link || '',
              experience_text: pd.experience_text || '',
              status: 'pending'
            })
            .select()
            .single();

          if (proposal) {
            createdProposal = proposal;
          }
        }
      }
    }

    // 6. Save assistant reply with metadata
    await supabase.from('chat_messages').insert({
      session_id: activeSessionId,
      role: 'assistant',
      content: reply,
      metadata: {
        knowledge_saved: Boolean(savedKnowledge),
        knowledge_id: savedKnowledge?.id,
        category: analysis.category,
        tags: analysis.tags,
        proposal: createdProposal
      }
    });

    // Update session timestamp
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date() })
      .eq('id', activeSessionId);

    return res.json({
      sessionId: activeSessionId,
      reply,
      analysis: {
        category: analysis.category,
        tags: analysis.tags || [],
        savedKnowledge,
        createdProposal
      }
    });

  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/sessions/:id - Delete a chat session and its messages
chatRouter.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('chat_messages').delete().eq('session_id', id);
    const { error } = await supabase.from('chat_sessions').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
