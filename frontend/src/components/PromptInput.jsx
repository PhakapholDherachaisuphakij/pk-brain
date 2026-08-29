import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Image as ImageIcon, X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function PromptInput({ onSend, loading }) {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]); // Array of { id, base64, name }
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text]);

  const addImageObject = (base64, name = 'image.png') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setImages(prev => [...prev, { id, base64, name }]);
  };

  const readAndAddFile = (file) => {
    // Supports all image types including webp, avif, png, jpeg, gif, svg
    if (!file.type || !file.type.startsWith('image/')) {
      // Check extension if type is generic or empty
      const isImgExt = /\.(webp|png|jpe?g|gif|avif|bmp|svg)$/i.test(file.name || '');
      if (!isImgExt) return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      addImageObject(event.target.result, file.name || `image-${Date.now()}.${file.type?.split('/')[1] || 'png'}`);
    };
    reader.readAsDataURL(file);
  };

  // Robust Clipboard Paste Handler (Supports multiple images, WebP, screenshots, and copied web images)
  useEffect(() => {
    const handlePaste = async (e) => {
      const clipboardData = e.clipboardData || e.originalEvent?.clipboardData;
      if (!clipboardData) return;

      let foundImage = false;

      // 1. Check direct files (e.g. copied from file explorer or screenshot)
      if (clipboardData.files && clipboardData.files.length > 0) {
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i];
          if (file.type.startsWith('image/') || /\.(webp|png|jpe?g|gif|avif|bmp|svg)$/i.test(file.name || '')) {
            readAndAddFile(file);
            foundImage = true;
          }
        }
      }

      // 2. Check clipboard items
      if (!foundImage && clipboardData.items) {
        for (let i = 0; i < clipboardData.items.length; i++) {
          const item = clipboardData.items[i];
          if (item.type.indexOf('image') !== -1 || item.kind === 'file') {
            const file = item.getAsFile();
            if (file) {
              readAndAddFile(file);
              foundImage = true;
            }
          }
        }
      }

      // 3. Fallback for Web images (e.g. copied from web page where browser puts HTML or URL)
      if (!foundImage) {
        const html = clipboardData.getData('text/html');
        if (html) {
          const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            const src = imgMatch[1];
            if (src.startsWith('data:image/')) {
              addImageObject(src, 'pasted-web-image.png');
              foundImage = true;
            } else if (src.startsWith('http://') || src.startsWith('https://')) {
              try {
                // Fetch image url and convert to base64
                const resp = await fetch(src);
                const blob = await resp.blob();
                readAndAddFile(new File([blob], 'web-image.webp', { type: blob.type || 'image/webp' }));
                foundImage = true;
              } catch (fetchErr) {
                // If CORS blocks direct fetch, add as URL
                console.log('Direct image fetch blocked by CORS, passing URL directly');
              }
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        readAndAddFile(files[i]);
      }
    }
    e.target.value = '';
  };

  const handleRemoveImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && images.length === 0) || loading || uploading) return;

    let uploadedUrls = [];

    if (images.length > 0) {
      try {
        setUploading(true);
        // Upload all images in parallel
        const uploadPromises = images.map(img => 
          api.uploadImage(img.base64, img.name)
        );
        const results = await Promise.all(uploadPromises);
        uploadedUrls = results.map(r => r.url).filter(Boolean);
      } catch (err) {
        alert('อัปโหลดรูปภาพไม่สำเร็จ: ' + err.message);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    onSend(text.trim(), uploadedUrls);
    setText('');
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isReady = (text.trim() || images.length > 0) && !loading && !uploading;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-5 pt-2">
      <form
        onSubmit={handleSubmit}
        className="relative bg-[#11131a]/80 backdrop-blur-2xl border border-white/10 hover:border-white/20 focus-within:border-blue-500/50 rounded-3xl p-2.5 shadow-2xl transition-all group"
      >
        {/* Attached Images Gallery Preview */}
        {images.length > 0 && (
          <div className="mb-2 p-2.5 bg-white/5 rounded-2xl border border-white/10 animate-fadeIn">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                แนบรูปภาพทั้งหมด {images.length} รูป (รองรับ WebP, PNG, JPEG)
              </span>
              <button
                type="button"
                onClick={() => setImages([])}
                className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
              >
                ลบทั้งหมด
              </button>
            </div>

            {/* Horizontal Scroll of Thumbnails */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {images.map((img, idx) => (
                <div 
                  key={img.id}
                  className="relative w-16 h-16 rounded-xl overflow-hidden bg-black/60 border border-white/15 shrink-0 group/item"
                >
                  <img
                    src={img.base64}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
                    title="ลบรูปนี้"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-gray-300 text-center py-0.5 truncate px-1 font-mono">
                    {idx + 1}
                  </div>
                </div>
              ))}

              {/* Add more button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-blue-400 flex flex-col items-center justify-center text-gray-400 hover:text-blue-400 shrink-0 transition-colors cursor-pointer"
                title="เพิ่มรูปภาพอีก"
              >
                <Plus className="w-4 h-4 mb-0.5" />
                <span className="text-[9px]">เพิ่มอีก</span>
              </button>
            </div>
          </div>
        )}

        {/* Textarea Input + Action Buttons */}
        <div className="flex items-end gap-2 px-2 py-1">
          {/* Mobile Camera / Photo Upload Button (multiple enabled) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-blue-400 border border-white/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="แนบรูป / ถ่ายรูป (เลือกได้หลายรูป)"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.webp,.png,.jpg,.jpeg,.gif,.avif,.svg"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={images.length > 0 ? `พิมพ์คำอธิบายสำหรับทั้ง ${images.length} รูป...` : "What do you want to learn, record, or build today, PK?"}
            disabled={loading || uploading}
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none resize-none max-h-44 py-1.5 leading-relaxed font-sans"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!isReady}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isReady
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-glow'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
            title="ส่งข้อความ (Enter)"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Bottom subtle metadata */}
        <div className="flex items-center justify-between px-3 pt-2 text-[10px] text-gray-500 border-t border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Typhoon 2.5 AI Active</span>
          </div>
          <span className="hidden sm:inline text-gray-500">
            วางรูปจาก Clipboard (Ctrl+V) ได้หลายรูปพร้อมกัน (รองรับ WebP) · กด Enter เพื่อส่ง
          </span>
        </div>
      </form>
    </div>
  );
}
