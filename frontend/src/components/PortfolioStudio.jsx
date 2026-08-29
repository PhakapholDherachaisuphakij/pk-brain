import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderKanban, GraduationCap, Zap, Briefcase, User, 
  Plus, Edit3, Trash2, ExternalLink, Save, X, 
  Search, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw,
  Upload, Star, Loader2, ArrowUpRight
} from 'lucide-react';
import { api } from '../lib/api';

export default function PortfolioStudio({ isOpen, onClose, onRefreshData }) {
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [data, setData] = useState({
    projects: [],
    activities: [],
    skills: [],
    experience: [],
    profile: {},
    socialLinks: []
  });

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null); // 'project' | 'activity' | 'skill' | 'experience' | 'profile'
  const [isNew, setIsNew] = useState(false);

  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadPortfolioData();
    }
  }, [isOpen]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      const res = await api.getAllPortfolio();
      setData(res);
    } catch (err) {
      console.error('Error loading portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (type, item = null) => {
    setEditingType(type);
    setIsNew(!item);
    if (!item) {
      if (type === 'project') {
        setEditingItem({ title: '', description: '', tech_stack: ['React', 'Node.js'], image_url: '', link: '', experience_text: '', order_idx: 0 });
      } else if (type === 'activity') {
        setEditingItem({ title: '', semester: 'Semester 1', period_label: 'Activity', description: '', main_image: '', gallery: [], order_idx: 0 });
      } else if (type === 'skill') {
        setEditingItem({ name: '', progress: 85, level: 'Advanced', image_url: '', is_main: true, order_idx: 0 });
      } else if (type === 'experience') {
        setEditingItem({ period: '2025 - Present', title: '', company: 'SCB', description: '', color: '#3b82f6', order_idx: 0 });
      }
    } else {
      setEditingItem({ ...item });
    }
  };

  // Upload single file helper
  const handleSingleImageUpload = async (file) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const res = await api.uploadImage(e.target.result, file.name);
          if (res.url) {
            setEditingItem(prev => ({
              ...prev,
              image_url: res.url,
              main_image: res.url,
              avatar_url: res.url
            }));
          }
        } catch (uploadErr) {
          alert('อัปโหลดรูปไม่สำเร็จ: ' + uploadErr.message);
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingImage(false);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message);
    }
  };

  // Upload multiple files for Activity Gallery
  const handleGalleryUpload = async (files) => {
    if (!files || files.length === 0) return;
    try {
      setUploadingImage(true);
      const newUrls = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await api.uploadImage(base64, file.name);
        if (res.url) {
          newUrls.push(res.url);
        }
      }

      setEditingItem(prev => {
        const currentGallery = prev.gallery || [];
        const updatedGallery = [...currentGallery, ...newUrls];
        return {
          ...prev,
          gallery: updatedGallery,
          main_image: prev.main_image || updatedGallery[0] || ''
        };
      });
    } catch (err) {
      alert('อัปโหลดรูปไม่สำเร็จ: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Paste handler in edit modal
  const handleModalPaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (editingType === 'activity') {
            await handleGalleryUpload([file]);
          } else {
            await handleSingleImageUpload(file);
          }
          break;
        }
      }
    }
  };

  const handleSaveItem = async () => {
    try {
      setSaving(true);
      if (editingType === 'project') {
        if (isNew) {
          await api.createProject(editingItem);
        } else {
          await api.updateProject(editingItem.id, editingItem);
        }
      } else if (editingType === 'activity') {
        if (isNew) {
          await api.createActivity(editingItem);
        } else {
          await api.updateActivity(editingItem.id, editingItem);
        }
      } else if (editingType === 'skill') {
        if (isNew) {
          await api.createSkill(editingItem);
        } else {
          await api.updateSkill(editingItem.id, editingItem);
        }
      } else if (editingType === 'experience') {
        if (isNew) {
          await api.createExperience(editingItem);
        } else {
          await api.updateExperience(editingItem.id, editingItem);
        }
      } else if (editingType === 'profile') {
        await api.updateProfile(editingItem);
      }

      setEditingItem(null);
      await loadPortfolioData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (type, id, title) => {
    if (!window.confirm(`ยืนยันการลบ "${title}" ออกจาก Portfolio?`)) return;
    try {
      if (type === 'project') await api.deleteProject(id);
      if (type === 'activity') await api.deleteActivity(id);
      if (type === 'skill') await api.deleteSkill(id);
      if (type === 'experience') await api.deleteExperience(id);
      await loadPortfolioData();
      if (onRefreshData) onRefreshData();
    } catch (err) {
      alert('ลบไม่สำเร็จ: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[90vh] bg-[#0c0e14] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#111420]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-glow">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Portfolio Studio & Content Editor
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Supabase Sync
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                แก้ไขข้อมูล projects, activities, skills, และรูปภาพทั้งหมดแบบ Real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="http://homelab.tail7d4c51.ts.net:5173"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium border border-white/10 transition-colors"
            >
              <span>ดู Portfolio สด</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={loadPortfolioData}
              title="รีเฟรชข้อมูล"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 border-b border-white/5 bg-[#0e1017] flex items-center justify-between overflow-x-auto scrollbar-none gap-2">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'projects', label: 'Projects', icon: FolderKanban, count: data.projects.length },
              { id: 'activities', label: 'Activities', icon: GraduationCap, count: data.activities.length },
              { id: 'skills', label: 'Skills', icon: Zap, count: data.skills.length },
              { id: 'experience', label: 'Experience', icon: Briefcase, count: data.experience.length },
              { id: 'profile', label: 'Profile', icon: User, count: null },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-glow' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab !== 'profile' && (
            <button
              onClick={() => handleOpenEdit(activeTab.slice(0, -1))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มใหม่</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="text-xs text-gray-400">กำลังโหลดข้อมูลจาก Portfolio Supabase...</span>
            </div>
          ) : (
            <>
              {/* PROJECTS TAB */}
              {activeTab === 'projects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.projects.map(proj => (
                    <div key={proj.id} className="p-4 rounded-2xl bg-[#131622] border border-white/5 hover:border-white/15 transition-all flex gap-4 group">
                      {/* Project Image Thumbnail */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 relative group/thumb">
                        <img
                          src={proj.image_url || 'https://frpbnexgcxfjpsrlsylt.supabase.co/storage/v1/object/public/portfolio-assets/assets/Project/yaiba.jfif'}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleOpenEdit('project', proj)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white text-[10px] font-medium transition-opacity"
                        >
                          เปลี่ยนรูป
                        </button>
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                              {proj.title}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEdit('project', proj)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-600/30 text-gray-400 hover:text-blue-300 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem('project', proj.id, proj.title)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600/30 text-gray-400 hover:text-rose-300 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                            {proj.description || 'ไม่มีคำอธิบาย'}
                          </p>

                          {/* Tech Stack */}
                          {proj.tech_stack && proj.tech_stack.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {proj.tech_stack.slice(0, 4).map((t, idx) => (
                                <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-gray-300 font-mono">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Link */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                          {proj.link ? (
                            <a href={proj.link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[200px]">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{proj.link}</span>
                            </a>
                          ) : (
                            <span className="text-gray-500">Overview Only</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ACTIVITIES TAB */}
              {activeTab === 'activities' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.activities.map(act => (
                    <div key={act.id} className="p-4 rounded-2xl bg-[#131622] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between group">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                              {act.period_label || act.semester || 'Activity'}
                            </span>
                            <h3 className="text-sm font-bold text-white mt-1.5 group-hover:text-indigo-400 transition-colors">
                              {act.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEdit('activity', act)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-600/30 text-gray-400 hover:text-indigo-300 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem('activity', act.id, act.title)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-600/30 text-gray-400 hover:text-rose-300 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                          {act.description || 'ไม่มีคำอธิบาย'}
                        </p>

                        {/* Gallery Thumbnails */}
                        {act.gallery && act.gallery.length > 0 && (
                          <div className="flex gap-1.5 mb-2">
                            {act.gallery.slice(0, 5).map((img, idx) => (
                              <img key={idx} src={img} alt="thumb" className="w-10 h-10 rounded-lg object-cover border border-white/10 shadow-sm" />
                            ))}
                            {act.gallery.length > 5 && (
                              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                                +{act.gallery.length - 5}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                        <span>รูปภาพทั้งหมด: {act.gallery?.length || (act.main_image ? 1 : 0)} ใบ</span>
                        <button
                          onClick={() => handleOpenEdit('activity', act)}
                          className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>จัดการรูปภาพ</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SKILLS TAB */}
              {activeTab === 'skills' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data.skills.map(skill => (
                    <div key={skill.id} className="p-3.5 rounded-2xl bg-[#131622] border border-white/5 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-white truncate">{skill.name}</span>
                          <span className="text-[10px] font-mono text-purple-300 font-bold">{skill.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${skill.progress}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleOpenEdit('skill', skill)} className="p-1 rounded bg-white/5 hover:text-blue-300 text-gray-400">
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteItem('skill', skill.id, skill.name)} className="p-1 rounded bg-white/5 hover:text-rose-300 text-gray-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* EXPERIENCE TAB */}
              {activeTab === 'experience' && (
                <div className="space-y-3">
                  {data.experience.map(exp => (
                    <div key={exp.id} className="p-4 rounded-2xl bg-[#131622] border border-white/5 flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono text-blue-400 font-bold">{exp.period}</span>
                        <h4 className="text-sm font-bold text-white">{exp.title} — <span className="text-gray-300 font-normal">{exp.company}</span></h4>
                        <p className="text-xs text-gray-400 mt-1">{exp.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleOpenEdit('experience', exp)} className="p-1.5 rounded-lg bg-white/5 hover:text-blue-300 text-gray-400">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteItem('experience', exp.id, exp.title)} className="p-1.5 rounded-lg bg-white/5 hover:text-rose-300 text-gray-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="max-w-2xl bg-[#131622] border border-white/5 rounded-2xl p-5 space-y-4">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-black/40 border-2 border-white/10 relative group/av shrink-0">
                      <img
                        src={data.profile?.avatar_url || 'https://frpbnexgcxfjpsrlsylt.supabase.co/storage/v1/object/public/portfolio-assets/assets/Project/yaiba.jfif'}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white block mb-1">รูปโปรไฟล์ (Avatar)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleSingleImageUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium border border-white/10 flex items-center gap-1.5"
                        >
                          {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>เลือกรูปใหม่</span>
                        </button>
                        <span className="text-[11px] text-gray-500">หรือวาง URL ด้านล่าง</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">ชื่อเต็ม</label>
                      <input
                        type="text"
                        value={data.profile?.name || ''}
                        onChange={(e) => setData({ ...data, profile: { ...data.profile, name: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">บทบาท / ตำแหน่ง</label>
                      <input
                        type="text"
                        value={data.profile?.role || ''}
                        onChange={(e) => setData({ ...data, profile: { ...data.profile, role: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Quote / คำคมประจำตัว</label>
                    <input
                      type="text"
                      value={data.profile?.quote || ''}
                      onChange={(e) => setData({ ...data, profile: { ...data.profile, quote: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">คำอธิบายประวัติส่วนตัว</label>
                    <textarea
                      rows={3}
                      value={data.profile?.description || ''}
                      onChange={(e) => setData({ ...data, profile: { ...data.profile, description: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setEditingType('profile');
                      setEditingItem(data.profile);
                      handleSaveItem();
                    }}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึก Profile</span>
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* EDIT MODAL DIALOG */}
      {editingItem && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onPaste={handleModalPaste}
        >
          <div className="w-full max-w-xl max-h-[90vh] bg-[#111420] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-left overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isNew ? '✨ เพิ่ม' : '✏️ แก้ไข'} {editingType.toUpperCase()}</span>
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PROJECT FORM */}
            {editingType === 'project' && (
              <div className="space-y-3.5">
                {/* Project Image Upload & Preview */}
                <div>
                  <label className="text-[11px] text-gray-300 font-semibold block mb-1.5">รูปภาพหน้าปก Project</label>
                  <div className="flex gap-3 items-start">
                    <div className="w-28 h-20 rounded-xl overflow-hidden bg-black/50 border border-white/15 shrink-0 relative">
                      {editingItem.image_url ? (
                        <img src={editingItem.image_url} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-[10px]">
                          <ImageIcon className="w-5 h-5 mb-1" />
                          <span>ไม่มีรูป</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleSingleImageUpload(e.target.files[0]);
                        }}
                        className="hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-glow"
                        >
                          {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>อัปโหลดรูปภาพ</span>
                        </button>
                        <span className="text-[10px] text-gray-400">(หรือกด Ctrl+V วางรูปได้เลย)</span>
                      </div>
                      <input
                        type="text"
                        value={editingItem.image_url || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                        placeholder="หรือใส่ Image URL..."
                        className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 font-semibold block mb-1">ชื่อโปรเจกต์</label>
                  <input
                    type="text"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    placeholder="เช่น PK Movie Hub"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 font-semibold block mb-1">ลิงก์ Project (URL)</label>
                  <input
                    type="text"
                    value={editingItem.link || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono"
                    placeholder="https://pk-movie-hub.vercel.app/"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 font-semibold block mb-1">Tech Stack (คั่นด้วยจุลภาค)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingItem.tech_stack) ? editingItem.tech_stack.join(', ') : (editingItem.tech_stack || '')}
                    onChange={(e) => setEditingItem({ ...editingItem, tech_stack: e.target.value.split(',').map(s => s.trim()) })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    placeholder="React, TailwindCSS, Node.js"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 font-semibold block mb-1">คำอธิบายโปรเจกต์</label>
                  <textarea
                    rows={3}
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 font-semibold block mb-1">สิ่งที่ได้เรียนรู้ (Experience Text)</label>
                  <textarea
                    rows={2}
                    value={editingItem.experience_text || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, experience_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            )}

            {/* ACTIVITY FORM (With Multi-Image Gallery Manager) */}
            {editingType === 'activity' && (
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] text-gray-300 font-semibold block mb-1">ชื่อกิจกรรม / Event</label>
                  <input
                    type="text"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    placeholder="เช่น IT#32 Starter Pack — Frontend Instructor"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-300 font-semibold block mb-1">บทบาท / Role Badge</label>
                    <input
                      type="text"
                      value={editingItem.period_label || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, period_label: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                      placeholder="เช่น Frontend Instructor, Volunteer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-300 font-semibold block mb-1">Semester / หมวด</label>
                    <input
                      type="text"
                      value={editingItem.semester || 'Semester 1'}
                      onChange={(e) => setEditingItem({ ...editingItem, semester: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-300 font-semibold block mb-1">คำอธิบายกิจกรรม</label>
                  <textarea
                    rows={3}
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>

                {/* Multi-Image Gallery Manager */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] text-gray-300 font-semibold flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>รูปภาพ Gallery ทั้งหมด ({editingItem.gallery?.length || 0} รูป)</span>
                    </label>

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      ref={galleryInputRef}
                      onChange={(e) => {
                        if (e.target.files) handleGalleryUpload(e.target.files);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow-glow"
                    >
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>+ เพิ่มรูปภาพ (เลือกได้หลายรูป)</span>
                    </button>
                  </div>

                  {/* Gallery Grid */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10 grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto">
                    {editingItem.gallery && editingItem.gallery.length > 0 ? (
                      editingItem.gallery.map((img, idx) => (
                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group/gimg bg-black/50">
                          <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover" />
                          
                          {/* Main Image Badge */}
                          {editingItem.main_image === img && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-bold">
                              หน้าปก
                            </span>
                          )}

                          {/* Controls Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/gimg:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                            <button
                              type="button"
                              title="ตั้งเป็นรูปหน้าปก"
                              onClick={() => setEditingItem({ ...editingItem, main_image: img })}
                              className="p-1 rounded bg-amber-500 text-black text-xs hover:scale-110 transition-transform"
                            >
                              <Star className="w-3 h-3 fill-black" />
                            </button>
                            <button
                              type="button"
                              title="ลบรูปนี้"
                              onClick={() => {
                                const newGal = editingItem.gallery.filter((_, i) => i !== idx);
                                setEditingItem({
                                  ...editingItem,
                                  gallery: newGal,
                                  main_image: editingItem.main_image === img ? (newGal[0] || '') : editingItem.main_image
                                });
                              }}
                              className="p-1 rounded bg-rose-600 text-white text-xs hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-6 text-center text-gray-500 text-xs">
                        ยังไม่มีรูปภาพ (กดปุ่ม "เพิ่มรูปภาพ" หรือกด Ctrl+V เพื่อวางรูป)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SKILL FORM */}
            {editingType === 'skill' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">ชื่อทักษะ</label>
                  <input
                    type="text"
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">ความชำนาญ: {editingItem.progress}%</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editingItem.progress || 80}
                    onChange={(e) => setEditingItem({ ...editingItem, progress: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* EXPERIENCE FORM */}
            {editingType === 'experience' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">ตำแหน่ง / Title</label>
                  <input
                    type="text"
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">องค์กร / บริษัท</label>
                  <input
                    type="text"
                    value={editingItem.company || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">ช่วงเวลา (Period)</label>
                  <input
                    type="text"
                    value={editingItem.period || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, period: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveItem}
                disabled={saving || uploadingImage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-glow disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
