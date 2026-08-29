import dotenv from 'dotenv';
dotenv.config();
import { supabase } from './services/supabase.js';

const knowledgeItems = [
  // ==========================================
  // CAREER & EXPERIENCE
  // ==========================================
  {
    category: 'career',
    summary: 'QA Automation Engineer — SCB (Siam Commercial Bank)',
    content: `## QA Automation Engineer at SCB (Siam Commercial Bank)

**Role:** QA Engineer / Automation Testing  
**Organization:** Siam Commercial Bank (SCB)  
**Period:** 2025 – Present  

### Key Responsibilities & Engineering Practices:
- **Test Automation & Quality Assurance:** Design and execute automated test scripts for enterprise banking applications, ensuring zero-defect deployments.
- **API & Integration Testing:** Verify backend REST APIs, payload schemas, and response assertions using Postman and automated test suites.
- **Regression & End-to-End Testing:** Maintain robust test suites covering critical customer journeys, edge cases, and high-concurrency transaction flows.
- **CI/CD Integration:** Integrate automated test pipelines into CI/CD workflows for rapid feedback and continuous delivery.
- **Bug Life Cycle & Root Cause Analysis:** Collaborate closely with developers, product owners, and system analysts to investigate defects and implement preventive solutions.`,
    tags: ['SCB', 'QA Engineer', 'Automation Testing', 'API Testing', 'Banking', 'CI/CD']
  },
  {
    category: 'career',
    summary: 'Frontend Developer & Technical Blogger — BornToDev (Devinit)',
    content: `## Frontend Developer & Technical Blogger at BornToDev (Devinit)

**Role:** Content Writer & Frontend Developer  
**Organization:** BornToDev  
**Period:** 2024  

### Key Accomplishments:
- **Technical Articles & Educational Content:** Authored developer tutorials focusing on modern frontend technologies, React.js fundamentals, GSAP scroll animations, and CSS mastery.
- **Interactive Demos:** Built hands-on code examples and interactive web components to illustrate complex programming concepts clearly to developer communities.
- **Community Engagement:** Shared best practices in web development and animation techniques with thousands of aspiring Thai developers.`,
    tags: ['BornToDev', 'Frontend Developer', 'Technical Writing', 'React.js', 'GSAP', 'Community']
  },

  // ==========================================
  // PROJECTS & ARCHITECTURE
  // ==========================================
  {
    category: 'project-log',
    summary: 'PK Brain — Personal Autonomous Second Brain Ecosystem',
    content: `## PK Brain — Autonomous Second Brain & Knowledge Ecosystem

**Type:** Autonomous Knowledge Hub & Portfolio Synchronizer  
**Tech Stack:** React 18, Vite 6, TailwindCSS, Node.js, Express, SCB 10X Typhoon 2.5 AI, Supabase PostgreSQL, Tailscale Mesh VPN  
**Status:** Live on Homelab Node  

### Architecture & Capabilities:
1. **Autonomous Knowledge Extraction:** Ingests notes, code snippets, and lecture slides via chat or clipboard screenshots (WebP/AVIF).
2. **Context-Aware Deduplication:** Employs SCB 10X Typhoon 2.5 30B LLM to extract structured knowledge, classify categories, and generate portfolio proposals without data duplication.
3. **1-Click Portfolio Sync:** Directly writes approved project and activity proposals into Supabase tables, updating the live Portfolio in real time.
4. **Ultra-Low Resource Optimization:** Unified single-process production mode consuming under 80MB RAM with 0.0% idle CPU footprint.
5. **Private Homelab Security:** Secured via Tailscale mesh VPN with no public attack surface.`,
    tags: ['PK Brain', 'Typhoon AI', 'Supabase', 'Second Brain', 'Node.js', 'React', 'Tailscale', 'Homelab']
  },
  {
    category: 'project-log',
    summary: 'CogniSync — AI-Powered Platform for Neurodiversity Support in the Workplace',
    content: `## CogniSync — AI Workplace Support Platform for Neurodivergent Employees

**Type:** AI-Powered Accessibility Web Application  
**Tech Stack:** React, Node.js, Express, LLM Integration, CSS, JWT Authentication  
**Live Demo:** https://cogni-sync.vercel.app/  

### Purpose & Problem Solved:
CogniSync bridges the communication and cognitive gap for employees with autism, ADHD, or learning differences in professional environments. It provides cognitive load balancing tools, automated communication reframing, and structured workplace task support.

### Technical Implementation:
- **Role-Based Authentication & State Management:** Implemented secure token-based authentication with role-tailored UIs for employees and managers.
- **Accessible UI/UX Design:** Designed low-cognitive-load user interfaces following WCAG accessibility guidelines with customizable sensory themes.
- **LLM Integration:** Integrated generative AI to simplify complex workplace instructions and summarize lengthy task descriptions into actionable steps.`,
    tags: ['CogniSync', 'AI', 'Accessibility', 'Neurodiversity', 'React', 'Node.js', 'LLM']
  },
  {
    category: 'project-log',
    summary: 'GTA 6 Clone — Cinematic Scroll-Driven Web Experience with GSAP',
    content: `## GTA 6 Clone — Cinematic Scroll-Driven Motion Website

**Type:** Interactive Motion Design & Frontend Clone  
**Tech Stack:** React, Tailwind CSS, GSAP (GreenSock), ScrollTrigger, Video Sync  
**Live Demo:** https://phakaphol-gta6-clone.vercel.app/  

### Key Technical Highlights:
- **Scroll-Driven Storytelling:** Utilized GSAP ScrollTrigger to pin viewport sections, synchronize high-resolution video playback with scroll delta, and create seamless parallax transitions.
- **Cinematic Image Masking:** Implemented SVG clip-paths and hardware-accelerated transforms for fluid, gaming-grade visual animations.
- **Performance Tuning:** Optimized video buffering, memory usage, and layout reflows to maintain a steady 60 FPS across desktop and mobile devices.`,
    tags: ['GTA 6 Clone', 'GSAP', 'ScrollTrigger', 'React', 'TailwindCSS', 'Motion Design', 'Frontend']
  },
  {
    category: 'project-log',
    summary: 'IOTSMARTSCAN AI — Real-Time IoT Object Detection with YOLO AI',
    content: `## IOTSMARTSCAN AI — Real-Time Computer Vision & IoT Scanning System

**Type:** Full-Stack IoT & AI Web Application  
**Tech Stack:** React, Node.js, Express, YOLO AI Computer Vision, IoT Hardware, CSS  
**Repository:** https://github.com/IOT4NHOR/Frontend  

### System Architecture:
- **Computer Vision Pipeline:** Processes live visual camera feeds through a YOLO object detection model for instant item identification and classification.
- **IoT Hardware Telemetry:** Communicates asynchronously between microcontrollers, sensor nodes, and backend servers.
- **Real-Time Monitoring Dashboard:** Full-stack dashboard providing instant detection feeds, alert logging, and historical analytics.`,
    tags: ['IOTSMARTSCAN', 'YOLO AI', 'Computer Vision', 'IoT', 'React', 'Node.js', 'Hardware']
  },
  {
    category: 'project-log',
    summary: 'PK Movie Hub (PKFLIX) — Cloud-Integrated Movie Streaming Simulation',
    content: `## PK Movie Hub (PKFLIX) — Entertainment Web App with Cloud DB

**Type:** Web Entertainment & Media Platform  
**Tech Stack:** React, CSS, Node.js, Supabase Cloud Database  
**Live Demo:** https://pk-movie-hub.vercel.app/  

### Key Features & Engineering:
- **Dynamic Content Banners & Carousels:** Designed responsive media galleries inspired by Netflix and modern streaming platforms.
- **Supabase Cloud Integration:** Migrated static media datasets to a scalable Supabase PostgreSQL backend, enabling dynamic filtering by genre and search queries.
- **Component-Driven Layout:** Modular React component architecture with lazy-loaded media cards and smooth hover preview interactions.`,
    tags: ['PK Movie Hub', 'PKFLIX', 'Supabase', 'React', 'Streaming UI', 'Cloud Database']
  },
  {
    category: 'project-log',
    summary: 'IT 3KINGS 19TH — Scalable Tournament Management System for KMUTT',
    content: `## IT 3KINGS 19TH — Web-Based Sports Tournament Management System

**Type:** University Event Management Web Application  
**Organization:** Faculty of Information Technology, KMUTT  
**Tech Stack:** Next.js, TypeScript, CSS, Axios, react-zoom-pan-pinch  
**Live URL:** https://it3k.sit.kmutt.ac.th/  

### Technical Implementation:
- **Dynamic Tournament Brackets:** Built an interactive, pannable and zoomable match bracket viewer for badminton, ping pong, and esports competitions.
- **Next.js Scalable Architecture:** Leveraged Next.js App Router, dynamic route segments, and optimized server-side rendering for real-time score updates.
- **Dual-Audience UI:** Separate responsive experiences for public attendees checking live results and event administrators inputting scores.`,
    tags: ['IT 3Kings', 'KMUTT', 'Next.js', 'TypeScript', 'Tournament System', 'Frontend']
  },
  {
    category: 'project-log',
    summary: 'Demon Slayer: Infinity Castle — Scroll-Driven Next.js Landing Page',
    content: `## Demon Slayer: Kimetsu no Yaiba (Infinity Castle Arc) Landing Page

**Type:** Anime Thematic Landing Page & Motion Web Experience  
**Tech Stack:** Next.js, GSAP, ScrollTrigger, Tailwind CSS  
**Live Demo:** https://phakaphol-yaiba.vercel.app/  

### Highlights:
- Dynamic data rendering from structured JavaScript objects showcasing characters and Infinity Castle lore.
- Deep cinematic animations powered by GSAP ScrollTrigger with custom timeline sequencing.
- Fully responsive dark-mode layout with custom typography and particle visual effects.`,
    tags: ['Demon Slayer', 'Next.js', 'GSAP', 'TailwindCSS', 'Motion UI']
  },

  // ==========================================
  // TEACHING & EXTRACURRICULAR ACTIVITIES
  // ==========================================
  {
    category: 'activity',
    summary: 'IT#32 Starter Pack — Frontend Development Instructor at KMUTT',
    content: `## IT#32 Starter Pack — Frontend Development Instructor

**Event:** IT#32 Starter Pack  
**Role:** Frontend Development Instructor  
**Organization:** Faculty of Information Technology, KMUTT  
**Audience:** First-year Information Technology students  

### Educational Objectives & Curriculum Delivered:
1. **DOM Manipulation:** Selecting, creating, updating, and removing HTML elements dynamically with Vanilla JavaScript.
2. **DOM Event Handling & Propagation:** Capturing user actions (clicks, keyboard input, form submissions) and understanding Event Bubbling and Event Capturing.
3. **Frontend–Backend API Communication:** Using Fetch API and Async/Await to send HTTP requests, consume REST APIs, and render dynamic responses into the DOM.
4. **Hands-on Coding Mentorship:** Facilitated live coding exercises and guided students through real-world debugging workflows.`,
    tags: ['IT#32 Starter Pack', 'KMUTT', 'Instructor', 'JavaScript', 'DOM', 'Fetch API', 'Teaching']
  },
  {
    category: 'activity',
    summary: 'TPR Camp & SIT Extracurricular Leadership at KMUTT',
    content: `## TPR Camp & Student Leadership Activities

**Role:** Camp Facilitator & Senior Volunteer  
**Organization:** Faculty of Information Technology, KMUTT  

### Contributions:
- Mentored junior IT students in university adaptation, teamwork, and technical problem solving.
- Facilitated group activities, leadership workshops, and technical sharing sessions.`,
    tags: ['TPR Camp', 'KMUTT', 'Leadership', 'Mentorship', 'Student Activity']
  },

  // ==========================================
  // CORE TECHNICAL COMPETENCIES
  // ==========================================
  {
    category: 'technical',
    summary: 'Full-Stack Web Architecture & Animation Systems Matrix',
    content: `## Technical Competencies: Modern Web Architecture & Animation Systems

### Core Strengths:
1. **Modern Frontend:** React.js, Next.js, TypeScript, JavaScript (ES6+), TailwindCSS, CSS3 Flexbox/Grid, Responsive Design.
2. **Web Animation & Motion:** GSAP (GreenSock), ScrollTrigger, Parallax Effects, Canvas/SVG, Hardware-Accelerated Transitions.
3. **Backend & Cloud Services:** Node.js, Express.js, Supabase, PostgreSQL, RESTful API Design, Webhooks Architecture.
4. **Quality Assurance & Testing:** Automated Test Scripting, API Contract Testing, Regression Verification, CI/CD Pipelines.
5. **AI & Emerging Technologies:** SCB 10X Typhoon LLM, Computer Vision with YOLO AI, Prompt Engineering, Structured Data Ingestion.
6. **Infrastructure & Security:** Tailscale Private Mesh VPN, Docker Containerization, Linux Administration, Git Version Control.`,
    tags: ['Technical Skills', 'React', 'Next.js', 'Node.js', 'Supabase', 'GSAP', 'PostgreSQL', 'Tailscale']
  }
];

async function seedKnowledge() {
  console.log('🚀 Starting Knowledge Vault Optimization & Deduplication...');

  // 1. Clear old duplicate / fragmented entries
  const { error: delTagsErr } = await supabase.from('knowledge_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: delErr } = await supabase.from('knowledge_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (delErr) {
    console.error('Error clearing old entries:', delErr);
    return;
  }
  console.log('🧹 Cleared old fragmented knowledge entries');

  // 2. Insert verified, structured knowledge items
  let insertedCount = 0;
  for (const item of knowledgeItems) {
    const { data: entry, error: insertErr } = await supabase
      .from('knowledge_entries')
      .insert({
        category: item.category,
        summary: item.summary,
        content: item.content,
        source: 'portfolio-system',
        is_pinned: item.category === 'career' || item.category === 'project-log',
        metadata: {
          verified: true,
          tags: item.tags,
          created_by: 'PK Brain Knowledge Synthesizer'
        }
      })
      .select()
      .single();

    if (insertErr) {
      console.error(`Failed to insert ${item.summary}:`, insertErr);
      continue;
    }

    // Insert associated tags
    if (item.tags && item.tags.length > 0) {
      const tagInserts = item.tags.map(t => ({
        entry_id: entry.id,
        tag: t
      }));
      await supabase.from('knowledge_tags').insert(tagInserts);
    }

    insertedCount++;
    console.log(`✅ [${item.category.toUpperCase()}] ${item.summary}`);
  }

  console.log(`\n🎉 Successfully synthesized and stored ${insertedCount} high-accuracy Knowledge Items into Knowledge Vault!`);
}

seedKnowledge();
