import express from 'express';
import { supabase } from '../services/supabase.js';

export const portfolioRouter = express.Router();

const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  const publicBase = process.env.SUPABASE_PUBLIC_URL || 'https://homelab.tail7d4c51.ts.net';
  return url.replace(/^http:\/\/localhost:8000/, publicBase);
};

const normalizeArrayUrls = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(normalizeUrl);
};

// GET /api/portfolio/all - Get all portfolio content in one call
portfolioRouter.get('/all', async (req, res) => {
  try {
    const [
      { data: projects },
      { data: activities },
      { data: skills },
      { data: experience },
      { data: profiles },
      { data: socialLinks },
      { data: proposals }
    ] = await Promise.all([
      supabase.from('projects').select('*').order('order_idx', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('activities').select('*').order('order_idx', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('skills').select('*').order('order_idx', { ascending: true }),
      supabase.from('experience').select('*').order('order_idx', { ascending: true }),
      supabase.from('profiles').select('*').limit(1).maybeSingle(),
      supabase.from('social_links').select('*').order('order_idx', { ascending: true }),
      supabase.from('portfolio_proposals').select('*').order('created_at', { ascending: false })
    ]);

    const cleanProjects = (projects || []).map(p => ({ ...p, image_url: normalizeUrl(p.image_url) }));
    const cleanActivities = (activities || []).map(a => ({
      ...a,
      main_image: normalizeUrl(a.main_image),
      gallery: normalizeArrayUrls(a.gallery)
    }));
    const cleanSkills = (skills || []).map(s => ({ ...s, image_url: normalizeUrl(s.image_url) }));
    const cleanProfile = profiles ? { ...profiles, avatar_url: normalizeUrl(profiles.avatar_url) } : {};
    const cleanProposals = (proposals || []).map(p => ({
      ...p,
      proposed_image_url: normalizeUrl(p.proposed_image_url),
      gallery: normalizeArrayUrls(p.gallery)
    }));

    res.json({
      projects: cleanProjects,
      activities: cleanActivities,
      skills: cleanSkills,
      experience: experience || [],
      profile: cleanProfile,
      socialLinks: socialLinks || [],
      proposals: cleanProposals
    });
  } catch (err) {
    console.error('Error fetching all portfolio data:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PROPOSALS (List, Approve, Reject)
// ==========================================

// GET /api/portfolio/proposals - List all proposals
portfolioRouter.get('/proposals', async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    let query = supabase
      .from('portfolio_proposals')
      .select('*, knowledge_entries(content, summary)')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio/proposals/:id/approve - Approve proposal & insert into Portfolio
portfolioRouter.post('/proposals/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { customTitle, customDescription, customTechStack, customImage, customLink, customExperience } = req.body;

    const { data: proposal, error: pErr } = await supabase
      .from('portfolio_proposals')
      .select('*')
      .eq('id', id)
      .single();

    if (pErr || !proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const title = customTitle || proposal.proposed_title;
    const description = customDescription || proposal.proposed_description;
    const defaultPublic = process.env.SUPABASE_PUBLIC_URL || 'https://homelab.tail7d4c51.ts.net';
    const imageUrl = customImage || proposal.proposed_image_url || `${defaultPublic}/storage/v1/object/public/portfolio-assets/assets/Project/yaiba.jfif`;
    const link = customLink || proposal.proposed_link || '';
    const experienceText = customExperience || proposal.experience_text || '';

    const isActivity = proposal.proposal_type === 'activity';

    if (isActivity) {
      const semester = proposal.metadata?.semester || 'Semester 1';
      const periodLabel = proposal.metadata?.period_label || 'Instructor';
      const mainImage = customImage || proposal.proposed_image_url || proposal.gallery?.[0] || `${defaultPublic}/storage/v1/object/public/portfolio-assets/assets/Devinit/devinit.jpg`;
      const gallery = proposal.gallery && proposal.gallery.length > 0 ? proposal.gallery : [mainImage];

      const { data: newActivity, error: actErr } = await supabase
        .from('activities')
        .insert({
          title,
          semester,
          period_label: periodLabel,
          description,
          main_image: mainImage,
          gallery,
          order_idx: 0
        })
        .select()
        .single();

      if (actErr) throw actErr;

      await supabase
        .from('portfolio_proposals')
        .update({
          status: 'approved',
          reviewed_at: new Date()
        })
        .eq('id', id);

      return res.json({
        success: true,
        message: `🎉 เพิ่มกิจกรรม "${title}" เข้าสู่หน้า Portfolio (Activities) เรียบร้อยแล้ว!`,
        activity: newActivity
      });
    }

    const { data: newProject, error: prjErr } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        tech_stack: techStack,
        image_url: imageUrl,
        link,
        experience_text: experienceText,
        order_idx: 0
      })
      .select()
      .single();

    if (prjErr) throw prjErr;

    await supabase
      .from('portfolio_proposals')
      .update({
        status: 'approved',
        reviewed_at: new Date()
      })
      .eq('id', id);

    res.json({
      success: true,
      message: `🎉 เพิ่มโปรเจกต์ "${title}" เข้าสู่หน้า Portfolio (Projects) เรียบร้อยแล้ว!`,
      project: newProject
    });

  } catch (err) {
    console.error('Approve proposal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio/proposals/:id/reject - Reject proposal
portfolioRouter.post('/proposals/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('portfolio_proposals')
      .update({
        status: 'rejected',
        reviewed_at: new Date()
      })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Proposal rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PROJECTS CRUD
// ==========================================

// POST /api/portfolio/projects - Add new project
portfolioRouter.post('/projects', async (req, res) => {
  try {
    const { title, description, tech_stack, image_url, link, experience_text, order_idx = 0 } = req.body;
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        tech_stack: Array.isArray(tech_stack) ? tech_stack : (typeof tech_stack === 'string' ? tech_stack.split(',').map(s => s.trim()).filter(Boolean) : []),
        image_url: image_url || '',
        link: link || '',
        experience_text: experience_text || '',
        order_idx
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, project: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/portfolio/projects/:id - Update project
portfolioRouter.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tech_stack, image_url, link, experience_text, order_idx } = req.body;
    
    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (tech_stack !== undefined) {
      updatePayload.tech_stack = Array.isArray(tech_stack) 
        ? tech_stack 
        : (typeof tech_stack === 'string' ? tech_stack.split(',').map(s => s.trim()).filter(Boolean) : []);
    }
    if (image_url !== undefined) updatePayload.image_url = image_url;
    if (link !== undefined) updatePayload.link = link;
    if (experience_text !== undefined) updatePayload.experience_text = experience_text;
    if (order_idx !== undefined) updatePayload.order_idx = order_idx;

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, project: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/projects/:id - Delete project
portfolioRouter.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted project successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ACTIVITIES CRUD
// ==========================================

// POST /api/portfolio/activities - Add new activity
portfolioRouter.post('/activities', async (req, res) => {
  try {
    const { title, semester = 'Semester 1', period_label = 'Activity', description, main_image, gallery = [], order_idx = 0 } = req.body;
    const { data, error } = await supabase
      .from('activities')
      .insert({
        title,
        semester,
        period_label,
        description,
        main_image: main_image || gallery[0] || '',
        gallery: Array.isArray(gallery) ? gallery : [],
        order_idx
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, activity: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/portfolio/activities/:id - Update activity
portfolioRouter.put('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, semester, period_label, description, main_image, gallery, order_idx } = req.body;

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (semester !== undefined) updatePayload.semester = semester;
    if (period_label !== undefined) updatePayload.period_label = period_label;
    if (description !== undefined) updatePayload.description = description;
    if (main_image !== undefined) updatePayload.main_image = main_image;
    if (gallery !== undefined) updatePayload.gallery = Array.isArray(gallery) ? gallery : [];
    if (order_idx !== undefined) updatePayload.order_idx = order_idx;

    const { data, error } = await supabase
      .from('activities')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, activity: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/activities/:id - Delete activity
portfolioRouter.delete('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted activity successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SKILLS CRUD
// ==========================================

// POST /api/portfolio/skills - Add skill
portfolioRouter.post('/skills', async (req, res) => {
  try {
    const { name, progress = 80, level = 'Advanced', image_url = '', is_main = false, order_idx = 0 } = req.body;
    const { data, error } = await supabase
      .from('skills')
      .insert({ name, progress, level, image_url, is_main, order_idx })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, skill: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/portfolio/skills/:id - Update skill
portfolioRouter.put('/skills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, progress, level, image_url, is_main, order_idx } = req.body;

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name;
    if (progress !== undefined) updatePayload.progress = progress;
    if (level !== undefined) updatePayload.level = level;
    if (image_url !== undefined) updatePayload.image_url = image_url;
    if (is_main !== undefined) updatePayload.is_main = is_main;
    if (order_idx !== undefined) updatePayload.order_idx = order_idx;

    const { data, error } = await supabase
      .from('skills')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, skill: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/skills/:id - Delete skill
portfolioRouter.delete('/skills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('skills').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted skill successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// EXPERIENCE CRUD
// ==========================================

// POST /api/portfolio/experience - Add experience
portfolioRouter.post('/experience', async (req, res) => {
  try {
    const { period, title, company, description, color = '#3b82f6', order_idx = 0 } = req.body;
    const { data, error } = await supabase
      .from('experience')
      .insert({ period, title, company, description, color, order_idx })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, experience: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/portfolio/experience/:id - Update experience
portfolioRouter.put('/experience/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { period, title, company, description, color, order_idx } = req.body;

    const updatePayload = {};
    if (period !== undefined) updatePayload.period = period;
    if (title !== undefined) updatePayload.title = title;
    if (company !== undefined) updatePayload.company = company;
    if (description !== undefined) updatePayload.description = description;
    if (color !== undefined) updatePayload.color = color;
    if (order_idx !== undefined) updatePayload.order_idx = order_idx;

    const { data, error } = await supabase
      .from('experience')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, experience: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/experience/:id - Delete experience
portfolioRouter.delete('/experience/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('experience').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted experience successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PROFILE UPDATE
// ==========================================

// PUT /api/portfolio/profile - Update profile details
portfolioRouter.put('/profile', async (req, res) => {
  try {
    const { name, nickname, level, role, description, quote, avatar_url, streak, total_xp } = req.body;
    
    // Check if profile exists
    const { data: existing } = await supabase.from('profiles').select('id').limit(1).maybeSingle();

    let data, error;
    if (existing) {
      ({ data, error } = await supabase
        .from('profiles')
        .update({ name, nickname, level, role, description, quote, avatar_url, streak, total_xp })
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('profiles')
        .insert({ name, nickname, level, role, description, quote, avatar_url, streak, total_xp })
        .select()
        .single());
    }

    if (error) throw error;
    res.json({ success: true, profile: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
