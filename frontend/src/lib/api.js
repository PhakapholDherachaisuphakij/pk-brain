const API_BASE = '/api';

function getHeaders(custom = {}) {
  const token = localStorage.getItem('pk_brain_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...custom
  };
}

async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: getHeaders(options.headers || {})
  });
  if (res.status === 401 && !url.includes('/auth/')) {
    localStorage.removeItem('pk_brain_token');
    window.dispatchEvent(new Event('pk-brain-auth-required'));
  }
  return res;
}

export const api = {
  // Auth
  async verifyPin(pin) {
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Passcode ไม่ถูกต้อง');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('pk_brain_token', data.token);
    }
    return data;
  },

  async checkAuth() {
    try {
      const res = await authFetch(`${API_BASE}/auth/check`);
      return res.ok;
    } catch {
      return false;
    }
  },

  logout() {
    localStorage.removeItem('pk_brain_token');
    window.dispatchEvent(new Event('pk-brain-auth-required'));
  },

  // Chat
  async sendMessage(message, sessionId = null, imageUrls = []) {
    const urls = Array.isArray(imageUrls) ? imageUrls : (imageUrls ? [imageUrls] : []);
    const res = await authFetch(`${API_BASE}/chat`, {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        sessionId, 
        imageUrls: urls,
        imageUrl: urls[0] || null 
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  },

  // Image Upload
  async uploadImage(imageBase64, filename = 'image.png') {
    const res = await authFetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: JSON.stringify({ imageBase64, filename })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload image');
    }
    return res.json();
  },

  async getSessions() {
    const res = await authFetch(`${API_BASE}/chat/sessions`);
    if (!res.ok) throw new Error('Failed to load sessions');
    return res.json();
  },

  async getSessionMessages(sessionId) {
    const res = await authFetch(`${API_BASE}/chat/sessions/${sessionId}/messages`);
    if (!res.ok) throw new Error('Failed to load messages');
    return res.json();
  },

  // Knowledge
  async getKnowledge(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await authFetch(`${API_BASE}/knowledge?${query}`);
    if (!res.ok) throw new Error('Failed to load knowledge');
    return res.json();
  },

  async getKnowledgeStats() {
    const res = await authFetch(`${API_BASE}/knowledge/stats`);
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  },

  async deleteKnowledge(id) {
    const res = await authFetch(`${API_BASE}/knowledge/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete knowledge');
    return res.json();
  },

  // Portfolio Proposals
  async getProposals(status = 'all') {
    const res = await authFetch(`${API_BASE}/portfolio/proposals?status=${status}`);
    if (!res.ok) throw new Error('Failed to load proposals');
    return res.json();
  },

  async approveProposal(id, customData = {}) {
    const res = await authFetch(`${API_BASE}/portfolio/proposals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(customData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve proposal');
    }
    return res.json();
  },

  async rejectProposal(id) {
    const res = await authFetch(`${API_BASE}/portfolio/proposals/${id}/reject`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reject proposal');
    return res.json();
  },

  // ==========================================
  // FULL PORTFOLIO STUDIO (CRUD)
  // ==========================================
  async getAllPortfolio() {
    const res = await authFetch(`${API_BASE}/portfolio/all`);
    if (!res.ok) throw new Error('Failed to load portfolio data');
    return res.json();
  },

  // Projects
  async createProject(project) {
    const res = await authFetch(`${API_BASE}/portfolio/projects`, {
      method: 'POST',
      body: JSON.stringify(project)
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateProject(id, project) {
    const res = await authFetch(`${API_BASE}/portfolio/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project)
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async deleteProject(id) {
    const res = await authFetch(`${API_BASE}/portfolio/projects/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  // Activities
  async createActivity(activity) {
    const res = await authFetch(`${API_BASE}/portfolio/activities`, {
      method: 'POST',
      body: JSON.stringify(activity)
    });
    if (!res.ok) throw new Error('Failed to create activity');
    return res.json();
  },

  async updateActivity(id, activity) {
    const res = await authFetch(`${API_BASE}/portfolio/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activity)
    });
    if (!res.ok) throw new Error('Failed to update activity');
    return res.json();
  },

  async deleteActivity(id) {
    const res = await authFetch(`${API_BASE}/portfolio/activities/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete activity');
    return res.json();
  },

  // Skills
  async createSkill(skill) {
    const res = await authFetch(`${API_BASE}/portfolio/skills`, {
      method: 'POST',
      body: JSON.stringify(skill)
    });
    if (!res.ok) throw new Error('Failed to create skill');
    return res.json();
  },

  async updateSkill(id, skill) {
    const res = await authFetch(`${API_BASE}/portfolio/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(skill)
    });
    if (!res.ok) throw new Error('Failed to update skill');
    return res.json();
  },

  async deleteSkill(id) {
    const res = await authFetch(`${API_BASE}/portfolio/skills/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete skill');
    return res.json();
  },

  // Experience
  async createExperience(exp) {
    const res = await authFetch(`${API_BASE}/portfolio/experience`, {
      method: 'POST',
      body: JSON.stringify(exp)
    });
    if (!res.ok) throw new Error('Failed to create experience');
    return res.json();
  },

  async updateExperience(id, exp) {
    const res = await authFetch(`${API_BASE}/portfolio/experience/${id}`, {
      method: 'PUT',
      body: JSON.stringify(exp)
    });
    if (!res.ok) throw new Error('Failed to update experience');
    return res.json();
  },

  async deleteExperience(id) {
    const res = await authFetch(`${API_BASE}/portfolio/experience/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete experience');
    return res.json();
  },

  // Profile
  async updateProfile(profile) {
    const res = await authFetch(`${API_BASE}/portfolio/profile`, {
      method: 'PUT',
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  }
};
