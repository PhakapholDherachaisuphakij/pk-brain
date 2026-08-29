import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Brain, User, Sparkles, Check, Copy, BookOpen, Tag } from 'lucide-react';
import ProposalCard from './ProposalCard';

export default function ChatArea({ messages, loading, onSelectPrompt, onProposalResolved }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const suggestions = [
    {
      title: "🚀 บันทึกโปรเจกต์ใหม่",
      prompt: "วันนี้ผมพัฒนาโปรเจกต์ใหม่ชื่อว่า... ใช้เทคโนโลยี... สิ่งที่ได้เรียนรู้และแก้ปัญหาคือ..."
    },
    {
      title: "💡 บันทึกความรู้ Technical",
      prompt: "สรุปความเข้าใจเรื่อง Docker Networking และ Multi-stage build สำหรับงานในอนาคต"
    },
    {
      title: "💼 อัปเดตงาน QA ที่ SCB",
      prompt: "บันทึกสรุปผลงานการทำ Automation Testing และ Best Practices ที่ได้จาก SCB ในสัปดาห์นี้"
    },
    {
      title: "🎯 วางแผนเป้าหมาย & สกิลใหม่",
      prompt: "วิเคราะห์จุดแข็งและทักษะที่ควรพัฒนาต่อของผม เพื่อเป้าหมายในการเป็น Senior Software Engineer"
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-between">
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="my-auto flex flex-col items-center justify-center text-center py-12 animate-fadeIn">
            {/* Center Brand Icon */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-[2px] mb-5 shadow-glow">
              <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
              PK Brain
            </h1>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed mb-8">
              ศูนย์รวมความรู้ ทักษะ การงาน และเรื่องราวความก้าวหน้าของ PK บันทึกทุกอย่างไว้ที่นี่เพื่อใช้ต่อยอดในอนาคต
            </p>

            {/* Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl text-left">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectPrompt(s.prompt)}
                  className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-white/15 transition-all text-xs text-gray-300 group cursor-pointer"
                >
                  <div className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-gray-400 line-clamp-2">
                    {s.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message List */}
        {messages.length > 0 && (
          <div className="space-y-6 pb-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const meta = msg.metadata || {};
              const proposal = meta.proposal || msg.proposal;

              return (
                <div
                  key={index}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[1px] shrink-0 mt-0.5 shadow-glow">
                      <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                        <Brain className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                  )}

                  <div className={`max-w-[88%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble */}
                    <div
                      className={`p-4 rounded-3xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-br-md shadow-glow'
                          : 'bg-[#13151f] text-gray-200 border border-white/10 rounded-bl-md shadow-xl'
                      }`}
                    >
                      {/* Attached Images (Single or Multi-image Grid) */}
                      {(() => {
                        const imgs = meta.image_urls || msg.image_urls || (meta.image_url || msg.image_url ? [meta.image_url || msg.image_url] : []);
                        if (imgs.length === 0) return null;

                        return (
                          <div className={`mb-3 grid gap-2 rounded-2xl overflow-hidden ${
                            imgs.length === 1 ? 'grid-cols-1 max-h-80' : imgs.length === 2 ? 'grid-cols-2 max-h-60' : 'grid-cols-2 sm:grid-cols-3 max-h-80'
                          }`}>
                            {imgs.map((url, iIdx) => (
                              <div
                                key={iIdx}
                                className="relative overflow-hidden rounded-xl bg-black/40 border border-white/10 group/img aspect-video cursor-pointer"
                                onClick={() => window.open(url, '_blank')}
                              >
                                <img
                                  src={url}
                                  alt={`Attachment ${iIdx + 1}`}
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      <div className="prose-custom">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* Knowledge Tag Badge on Assistant response */}
                      {!isUser && meta.knowledge_saved && (
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <BookOpen className="w-3 h-3" />
                            บันทึกเข้า Knowledge:
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                            {meta.category || 'learning'}
                          </span>
                          {meta.tags && meta.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400 text-[10px]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interactive Project Proposal Card */}
                    {!isUser && proposal && (
                      <ProposalCard
                        proposal={proposal}
                        onResolved={onProposalResolved}
                      />
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold text-gray-300">
                      PK
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading typing indicator */}
            {loading && (
              <div className="flex gap-3.5 justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 p-[1px] shrink-0 mt-0.5 shadow-glow">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
                  </div>
                </div>
                <div className="bg-[#13151f] border border-white/10 rounded-3xl rounded-bl-md p-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-gray-400 ml-1.5">PK Brain กำลังคิดและจัดหมวดหมู่...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
}
