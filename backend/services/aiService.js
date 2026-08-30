import dotenv from 'dotenv';
import { supabase } from './supabase.js';

dotenv.config();

const TYPHOON_API_KEY = process.env.TYPHOON_API_KEY || '';
const TYPHOON_BASE_URL = process.env.TYPHOON_BASE_URL || 'https://api.opentyphoon.ai/v1';
const TYPHOON_MODEL = process.env.TYPHOON_MODEL || 'typhoon-v2.5-30b-a3b-instruct';

// Cache identity context in memory
let cachedIdentity = null;
let lastIdentityFetch = 0;

export async function getUserIdentityContext() {
  const now = Date.now();
  if (cachedIdentity && now - lastIdentityFetch < 30000) {
    return cachedIdentity;
  }

  try {
    const { data: identity } = await supabase.from('user_identity').select('*').limit(1).maybeSingle();
    const { data: profile } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
    
    // Fetch ALL existing projects and activities in Portfolio
    const { data: projects } = await supabase.from('projects').select('title');
    const { data: activities } = await supabase.from('activities').select('title');
    const { data: skills } = await supabase.from('skills').select('name, progress').limit(20);

    const context = {
      name: identity?.name || profile?.name || 'Phakaphol (PK)',
      role: identity?.role || profile?.role || 'QA Engineer & Frontend Developer',
      background: identity?.background || '',
      scholarship: identity?.scholarship || {},
      scb_contract: identity?.scb_contract || {},
      kmutt_student: identity?.kmutt_student || {},
      side_projects: identity?.side_projects || [],
      existing_portfolio_projects: projects?.map(p => p.title).filter(Boolean) || [],
      existing_portfolio_activities: activities?.map(a => a.title).filter(Boolean) || [],
      top_skills: skills?.map(s => s.name) || []
    };

    cachedIdentity = context;
    lastIdentityFetch = now;
    return context;
  } catch (err) {
    console.error('Error fetching identity context:', err);
    return { name: 'PK', role: 'Developer', existing_portfolio_projects: [], existing_portfolio_activities: [] };
  }
}

export async function callOllama(messages, model = process.env.OLLAMA_MODEL || 'hermes3:8b', temperature = 0.6, maxTokens = 1000) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';
  try {
    const response = await fetch(`${ollamaUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    return null;
  }
}

export async function callTyphoon(messages, temperature = 0.6, maxTokens = 1000) {
  if (TYPHOON_API_KEY) {
    try {
      const response = await fetch(`${TYPHOON_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TYPHOON_API_KEY}`
        },
        body: JSON.stringify({
          model: TYPHOON_MODEL,
          messages,
          temperature,
          max_tokens: maxTokens
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err) {
      console.warn('Typhoon API request error, attempting Ollama fallback:', err.message);
    }
  }

  // Fallback to local Ollama (Hermes / Llama) if Typhoon is unreachable
  const localReply = await callOllama(messages, process.env.OLLAMA_MODEL || 'hermes3:8b', temperature, maxTokens);
  if (localReply) return localReply;

  throw new Error('All AI engines (Typhoon API and Local Ollama) are currently unavailable');
}

export async function generateChatResponse(chatHistory, userMessage) {
  const identity = await getUserIdentityContext();

  const systemPrompt = `คุณคือ "PK Brain" (Jarvis) ผู้ช่วย AI อัจฉริยะและคลังสมองส่วนที่สอง (Second Brain) ของ ${identity.name}

สไตล์การตอบแบบ "Quick Logger" (กระชับ คม ได้ใจความ ไม่เยิ่นเย้อ):
1. สรุปสิ่งที่ ${identity.name} เล่าออกมาเป็น Bullet Points ที่ชัดเจนทันที:
   - 📌 **สาระสำคัญ / สิ่งที่ทำ (Action Taken)**
   - 💡 **บทเรียน & สิ่งที่ได้เรียนรู้ (Key Insights & Skills)**
   - 🏷️ **หมวดหมู่ & แท็ก (Category & Tags)**
2. แจ้งสถานะสั้นๆ ว่าระบบได้บันทึกเข้า Knowledge Vault และเตรียม Proposal (ถ้ามี) เรียบร้อยแล้ว
3. บริบทของ ${identity.name}:
   - บทบาท: ${identity.role} (นักศึกษา KMUTT, SCB QA Engineer, Frontend Developer & Instructor)
   - ทักษะสำคัญ: ${identity.top_skills.join(', ')}
   - โปรเจกต์ในพอร์ต: ${identity.existing_portfolio_projects.join(', ')}
   - กิจกรรมในพอร์ต: ${identity.existing_portfolio_activities.join(', ')}
4. ห้ามถามซักไซ้เยิ่นเย้อ เน้นความเร็ว ประสิทธิภาพ และความพร้อมใช้งานใน Portfolio/Resume ทันที`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-8),
    { role: 'user', content: userMessage }
  ];

  return await callTyphoon(messages, 0.5, 800);
}

export async function analyzeAndExtractKnowledge(userMessage, assistantReply) {
  const identity = await getUserIdentityContext();
  const existingProjects = identity.existing_portfolio_projects || [];
  const existingActivities = identity.existing_portfolio_activities || [];

  const prompt = `วิเคราะห์ข้อความที่ User (${identity.name}) พิมพ์เข้ามา และสกัดข้อมูลเป็น JSON ตามเงื่อนไขอย่างเคร่งครัด:

ข้อความของ User:
"""
${userMessage}
"""

รายการที่มีอยู่แล้วใน Portfolio ปัจจุบัน:
- โปรเจกต์เดิม: [${existingProjects.map(p => `"${p}"`).join(', ')}]
- กิจกรรมเดิม: [${existingActivities.map(a => `"${a}"`).join(', ')}]

กฎการจัดหมวดหมู่และตรวจจับ Proposal:
1. วิเคราะห์เฉพาะสิ่งที่ "User" เป็นคนพูด/ทำ
2. หมวดหมู่ (category):
   - "activity": หากเป็นการสอน (Instructor/TA), วิทยากร, จัด Workshop, กิจกรรมมหาวิทยาลัย (KMUTT), ค่ายอาสา (Camp/Volunteer), การแข่งขัน (Hackathon/Competition), หรือทุนการศึกษา
   - "project-log": หากเป็นการสร้าง/เขียนโปรเจกต์ ซอฟต์แวร์ เว็บแอปพลิเคชัน
   - "learning": หากเป็นการจดโน้ตสรุปความรู้ทั่วไป, ทฤษฎี, การแก้ปัญหาทางเทคนิค
   - "career": ประสบการณ์ทำงาน, SCB QA
3. การเสนอเข้า Portfolio:
   A) ถ้าเป็น Activity / การสอน / ค่าย / Hackathon ใหม่ที่ยังไม่อยู่ในรายการกิจกรรมเดิม:
      - "is_major_activity": true
      - "activity_details": {
          "title": "ชื่อกิจกรรม/บทบาท เช่น Frontend Development — JavaScript & API Integration (Frontend Instructor)",
          "semester": "Semester 1",
          "period_label": "Frontend Instructor",
          "description": "คำอธิบายสรุปบทบาทและสิ่งทีได้ทำ/ได้สอน"
        }
   B) ถ้าเป็น Project พัฒนาซอฟต์แวร์ใหม่ที่ยังไม่อยู่ในรายการโปรเจกต์เดิม:
      - "is_major_project": true
      - "project_details": {
          "title": "ชื่อโปรเจกต์",
          "description": "คำอธิบายโปรเจกต์",
          "tech_stack": ["React", "Node.js"],
          "experience_text": "สิ่งที่ได้เรียนรู้หรือแก้ปัญหา",
          "link": ""
        }
   C) ถ้าเป็นความรู้ทั่วไปหรือมีใน Portfolio อยู่แล้ว ให้ is_major_project = false และ is_major_activity = false

โปรดตอบในรูปแบบ JSON Schema นี้เท่านั้น (ห้ามมี Markdown หรือข้อความอื่น):
{
  "should_save": true,
  "category": "activity" | "learning" | "career" | "project-log" | "milestone" | "tech-stack" | "scb-work" | "kmutt-study" | "idea" | "general",
  "summary": "สรุปสาระสำคัญ 1-2 ประโยคสำหรับใช้เป็น Knowledge",
  "tags": ["แท็ก1", "แท็ก2"],
  "is_major_project": false,
  "project_details": null,
  "is_major_activity": false,
  "activity_details": null
}`;

  try {
    const raw = await callTyphoon([
      { role: 'system', content: 'You are a strict and accurate metadata extractor. Output raw JSON only.' },
      { role: 'user', content: prompt }
    ], 0.1, 800);

    let clean = raw.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(clean);

    // Robust title fallback & validation
    if (parsed.is_major_activity && parsed.activity_details) {
      if (!parsed.activity_details.title || parsed.activity_details.title.length < 3 || parsed.activity_details.title === '...') {
        const headingMatch = userMessage.match(/^#+\s*(.+)$/m);
        parsed.activity_details.title = headingMatch ? headingMatch[1].trim() : 'IT#32 Starter Pack — Frontend Development Instructor';
      }
      if (!parsed.activity_details.description || parsed.activity_details.description === '...') {
        parsed.activity_details.description = userMessage.slice(0, 300);
      }
      if (!parsed.activity_details.period_label) {
        parsed.activity_details.period_label = 'Frontend Instructor';
      }
    }

    // Heuristic override: If user explicitly writes Markdown headers for an Event / Teaching Role
    const isInstructorMessage = /Frontend\s+(Development\s+)?Instructor/i.test(userMessage) || /Starter\s*Pack/i.test(userMessage) || /Event:\s*/i.test(userMessage);
    if (isInstructorMessage && !parsed.is_major_activity) {
      const headingMatch = userMessage.match(/^#+\s*(.+)$/m);
      parsed.category = 'activity';
      parsed.is_major_activity = true;
      parsed.activity_details = {
        title: headingMatch ? headingMatch[1].trim() : 'IT#32 Starter Pack — Frontend Development Instructor',
        semester: 'Semester 1',
        period_label: 'Frontend Instructor',
        description: userMessage.slice(0, 300)
      };
    }

    // Safety filter: Only block if EXACT same title already exists in activities
    if (parsed.is_major_activity && parsed.activity_details?.title) {
      const proposedTitle = parsed.activity_details.title.toLowerCase().trim();
      const isExactDuplicate = existingActivities.some(ea => proposedTitle === ea.toLowerCase().trim());
      if (isExactDuplicate) {
        parsed.is_major_activity = false;
        parsed.activity_details = null;
      }
    }

    if (parsed.is_major_project && parsed.project_details?.title) {
      const proposedTitle = parsed.project_details.title.toLowerCase().trim();
      const isExactDuplicate = existingProjects.some(ep => proposedTitle === ep.toLowerCase().trim());
      if (isExactDuplicate) {
        parsed.is_major_project = false;
        parsed.project_details = null;
      }
    }

    return parsed;
  } catch (err) {
    console.error('Knowledge extraction parse error:', err);
    // Fallback heuristic for teaching/event
    const isActivity = /Instructor|Workshop|Hackathon|Starter Pack|Event:/i.test(userMessage);
    const headingMatch = userMessage.match(/^#+\s*(.+)$/m);

    return {
      should_save: true,
      category: isActivity ? 'activity' : 'learning',
      summary: userMessage.slice(0, 150),
      tags: ['Frontend Development', 'JavaScript', 'KMUTT', 'Teaching'],
      is_major_project: false,
      project_details: null,
      is_major_activity: isActivity,
      activity_details: isActivity ? {
        title: headingMatch ? headingMatch[1].trim() : 'IT#32 Starter Pack — Frontend Development Instructor',
        semester: 'Semester 1',
        period_label: 'Frontend Instructor',
        description: userMessage.slice(0, 300)
      } : null
    };
  }
}
