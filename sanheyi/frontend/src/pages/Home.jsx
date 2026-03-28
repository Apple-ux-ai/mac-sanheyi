import React from 'react';
import { useNavigate } from 'react-router-dom';
import ToolHeader from '../components/ToolHeader';
import ProblemFeedback from '../components/ProblemFeedback';
import { useHistoryStore } from '../stores/useHistoryStore';
import { Clock, Trash2, ChevronRight, X } from 'lucide-react';
import '../App.css';

// Map display names to URL slugs and styling info
import { t } from '@/i18n';
const categoryMap = {
  '视频类': {
    slug: 'video',
    title: '视频格式转换大师',
    desc: 'AVI, MP4, GIF 等视频格式互转',
    icon:
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="7" x2="7" y2="7"></line>
          <line x1="2" y1="17" x2="7" y2="17"></line>
          <line x1="17" y1="17" x2="22" y2="17"></line>
          <line x1="17" y1="7" x2="22" y2="7"></line>
       </svg>,

    color: '#8b5cf6' // Violet
  },
  '图片类': {
    slug: 'image',
    title: '全能图转',
    desc: 'JPG, PNG, SVG 等图片处理工具',
    icon:
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
       </svg>,

    color: '#ec4899' // Pink
  },
  '文档类': {
    slug: 'doc',
    title: '文档转换器',
    desc: 'PDF, DOCX, JSON 等文档转换',
    icon:
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>,

    color: '#3b82f6' // Blue
  },
  '音频类': {
    slug: 'audio',
    title: '音频格式转换',
    desc: 'MP3, WAV 等音频格式转换',
    icon:
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13"></path>
        <circle cx="6" cy="18" r="3"></circle>
        <circle cx="18" cy="16" r="3"></circle>
      </svg>,

    color: '#10b981' // Emerald
  }
};

function Home() {
  const navigate = useNavigate();
  const history = useHistoryStore((state) => state.history);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const removeFromHistory = useHistoryStore((state) => state.removeFromHistory);

  return (
    <div className="app-container">
      <ToolHeader />
      <div className="main-layout" style={{
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start', // 修改为 flex-start
        background: 'var(--bg-color)',
        overflowY: 'auto'
      }}>
        <div style={{ maxWidth: '1000px', width: '100%', padding: '40px 20px', textAlign: 'center' }}>
            {/* Hero Section */}
            <div style={{ marginBottom: '60px', marginTop: '20px' }}>
                <h1 style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '-0.5px' }}>{t("鲲穹转换大师")}

            </h1>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>{t("简单、高效的在线文件格式转换工具集。支持视频、图片、文档、音频等多种格式互转。")}

            </p>
            </div>

            {/* Grid */}
            <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            padding: '0 10px'
          }}>
              {Object.entries(categoryMap).
            filter(([key, data]) => data.slug !== 'audio') // 隐藏音频类入口
            .map(([key, data]) =>
            <div
              key={key}
              className="tool-card"
              onClick={() => {
                navigate(`/tools/${data.slug}`);
              }}
              style={{
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '40px 24px',
                gap: '20px',
                border: '1px solid var(--border-color)',
                background: 'var(--card-bg)',
                cursor: 'pointer'
              }}>
              
                  <div className="tool-card-icon" style={{
                width: '80px',
                height: '80px',
                borderRadius: '24px',
                color: data.color,
                background: `linear-gradient(135deg, ${data.color}15 0%, ${data.color}05 100%)`,
                marginBottom: '8px'
              }}>
                    {React.cloneElement(data.icon, { width: 36, height: 36 })}
                  </div>
                  <div>
                      <h3 className="card-title" style={{ fontSize: '20px', marginBottom: '12px' }}>{t(data.title)}</h3>
                      <p className="card-desc" style={{ fontSize: '14px', lineHeight: '1.6' }}>{t(data.desc)}</p>
                  </div>
                </div>
            )}
            </div>

            {/* History Section */}
            {history.length > 0 &&
          <div style={{ marginTop: '60px', marginBottom: '40px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '0 4px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} className="text-blue-500" />{t("最近使用")}

              </h2>
                  <button
                onClick={clearHistory}
                className="clear-history-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.background = 'transparent';
                }}>
                
                    <Trash2 size={14} />{t("清空记录")}

              </button>
                </div>
                
                <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '16px',
              padding: '0 4px'
            }}>
                  {history.map((item, index) => {
                // Try to resolve icon and color
                let categoryKey = '视频类';
                if (['jpg', 'png', 'svg', 'webp', 'bmp', 'ico', 'tiff', 'heic'].includes(item.source) || item.moduleType === 'image') categoryKey = '图片类';else
                if (['pdf', 'docx', 'doc', 'html', 'json', 'txt', 'md', 'epub', 'xml', 'xlsx', 'pptx'].includes(item.source) || item.moduleType === 'doc') categoryKey = '文档类';else
                if (['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(item.source) || item.moduleType === 'audio') categoryKey = '音频类';

                const catData = categoryMap[categoryKey] || categoryMap['视频类'];

                return (
                  <div
                    key={`${item.path}-${index}`}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'var(--card-bg)',
                      border: '1.5px solid var(--border-color)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      boxShadow: 'var(--shadow-sm)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md), 0 0 12px var(--border-glow)';
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                    }}>
                    
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `${catData.color}15`,
                        color: catData.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px'
                      }}>
                            {/* Clone element to modify props if needed, or just render */}
                            {React.cloneElement(catData.icon, { width: 20, height: 20 })}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                            <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{typeof item.title === 'string' ? t(item.title) : item.title}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                        style={{
                          color: 'var(--text-secondary)',
                          opacity: 0.5,
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        className="history-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item.path);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                          e.currentTarget.style.color = '#ef4444';
                          e.currentTarget.style.opacity = 1;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.opacity = 0.5;
                        }}
                        title={t("删除此记录")}>
                        
                            <X size={16} />
                          </div>
                          <div style={{
                        color: 'var(--text-secondary)',
                        opacity: 0.5
                      }}>
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </div>);

              })}
                </div>
              </div>
          }

            {/* Problem Feedback Section */}
            <div style={{ maxWidth: '260px', margin: '40px auto 0' }}>
              <ProblemFeedback />
            </div>
        </div>
      </div>
    </div>);

}

export default Home;
