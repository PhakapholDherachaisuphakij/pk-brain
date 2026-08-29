import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import PromptInput from './components/PromptInput';
import KnowledgeVault from './components/KnowledgeVault';
import ProposalsModal from './components/ProposalsModal';
import PortfolioStudio from './components/PortfolioStudio';
import PinLockModal from './components/PinLockModal';
import { api } from './lib/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('pk_brain_auth') === 'true';
  });
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'vault' | 'proposals' | 'studio' | null

  const fetchStats = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getKnowledgeStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const handleSendMessage = async (text, imageUrls = []) => {
    const urls = Array.isArray(imageUrls) ? imageUrls : (imageUrls ? [imageUrls] : []);
    const userMsg = { 
      role: 'user', 
      content: text || (urls.length > 0 ? `แนบรูปภาพ (${urls.length} รูป)` : ''),
      metadata: urls.length > 0 ? { image_urls: urls, image_url: urls[0] } : {}
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.sendMessage(text, sessionId, urls);
      if (res.sessionId && !sessionId) {
        setSessionId(res.sessionId);
      }

      const assistantMsg = {
        role: 'assistant',
        content: res.reply,
        metadata: {
          knowledge_saved: Boolean(res.analysis?.savedKnowledge),
          category: res.analysis?.category,
          tags: res.analysis?.tags,
          proposal: res.analysis?.createdProposal
        }
      };

      setMessages((prev) => [...prev, assistantMsg]);
      fetchStats();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ขออภัยครับ เกิดข้อผิดพลาดในการประมวลผล: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setActiveModal(null);
  };

  const handleProposalResolved = (id, status) => {
    fetchStats();
  };

  const handleLock = () => {
    localStorage.removeItem('pk_brain_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <PinLockModal onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-gray-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Header
        stats={stats}
        onOpenVault={() => setActiveModal(activeModal === 'vault' ? null : 'vault')}
        onOpenProposals={() => setActiveModal(activeModal === 'proposals' ? null : 'proposals')}
        onOpenStudio={() => setActiveModal(activeModal === 'studio' ? null : 'studio')}
        onNewChat={handleNewChat}
        onLock={handleLock}
        activeTab={activeModal}
      />

      {/* Main Chat Flow */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <ChatArea
          messages={messages}
          loading={loading}
          onSelectPrompt={handleSendMessage}
          onProposalResolved={handleProposalResolved}
        />

        <PromptInput
          onSend={handleSendMessage}
          loading={loading}
        />
      </main>

      {/* Knowledge Vault Slide-over */}
      <KnowledgeVault
        isOpen={activeModal === 'vault'}
        onClose={() => setActiveModal(null)}
        onRefreshStats={fetchStats}
      />

      {/* Proposals Modal */}
      <ProposalsModal
        isOpen={activeModal === 'proposals'}
        onClose={() => setActiveModal(null)}
        onRefreshStats={fetchStats}
      />

      {/* Portfolio Studio Editor */}
      <PortfolioStudio
        isOpen={activeModal === 'studio'}
        onClose={() => setActiveModal(null)}
        onRefreshData={fetchStats}
      />
    </div>
  );
}
