import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  videoCategories,
  imageCategories,
  docCategories,
  audioCategories } from
'../modules/configs';
import { useHistoryStore } from '../stores/useHistoryStore';
import ToolHeader from '../components/ToolHeader';
import ToolSidebar from '../components/ToolSidebar';
// 导入统一组件映射
import { componentMap as unifiedComponentMap } from '../modules/maps/unifiedComponentMap';
// 导入示例业务组件
import DemoFeature from '../components/features/DemoFeature';
import '../App.css';import { t } from '@/i18n';


function findToolSelection(categoryData, source, target, moduleType) {
  let initialSection = categoryData && categoryData.length > 0 ? categoryData[0] : null;

  if (source && target && categoryData) {
    const toolName = `${source.toUpperCase()} To ${target.toUpperCase()}`;
    for (const section of categoryData) {
      const tool = section.tools.find((t) => t.name.toLowerCase() === toolName.toLowerCase());
      if (tool) {
        return { initialSection: section, initialSelectedTool: tool.name };
      }
    }
  } else if (moduleType && categoryData) {
    // Try to find a section that matches the moduleType (e.g. "html" matches "HTML 转换器")
    const match = categoryData.find((s) => s.name.toLowerCase().includes(moduleType.toLowerCase()));
    if (match) {
      initialSection = match;
    }
  }

  return { initialSection, initialSelectedTool: null };
}

function MainPageContent({ categoryData, source, target, moduleType }) {
  const navigate = useNavigate();
  const { initialSection, initialSelectedTool } = findToolSelection(categoryData, source, target, moduleType);

  const [activeSection, setActiveSection] = useState(() => initialSection);
  const [selectedTool, setSelectedTool] = useState(() => initialSelectedTool);
  const [isMaximized, setIsMaximized] = useState(false);

  const addToHistory = useHistoryStore((state) => state.addToHistory);

  // 监听 props 变化，强制更新状态 (修复导航后再次点击无法进入的问题)
  useEffect(() => {
    const { initialSection: newSection, initialSelectedTool: newTool } = findToolSelection(categoryData, source, target, moduleType);
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setActiveSection(newSection);
      setSelectedTool(newTool);

      // 如果有选中的工具，添加到历史记录
      if (newTool && source && target) {
        addToHistory({
          path: `/tool/${source.toLowerCase()}/${target.toLowerCase()}`,
          title: newTool,
          moduleType: moduleType || 'unknown',
          source: source.toLowerCase(),
          target: target.toLowerCase(),
          timestamp: Date.now()
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [categoryData, source, target, moduleType, addToHistory]);

  useEffect(() => {
    const electronApi = window.electron;
    if (!electronApi) return;

    electronApi.isWindowMaximized?.().then(setIsMaximized).catch(() => {});

    const handleMaximizedStateChange = (state) => {
      setIsMaximized(Boolean(state));
    };
    electronApi.onWindowMaximizedStateChanged?.(handleMaximizedStateChange);
    return () => {
      electronApi.removeWindowMaximizedStateChangedListener?.();
    };
  }, []);

  const handleBackToGrid = () => {
    // 导航回当前类别的根路径，不带工具参数
    // 如果是从 /tool/jpg/pdf 进入，返回 /tools/jpg
    // 如果是从 /tools/jpg 进入，这里保持在 /tools/jpg，但重置选中状态
    if (source && target) {
      // 尝试推断类别并导航
      const category = moduleType || source.toLowerCase(); // 简化逻辑，如果 moduleType 存在则用它，否则尝试用 source
      // 注意：这里可能需要更复杂的逻辑来确定确切的 moduleType (如 video/image/audio)
      // 但实际上，只要 navigate 到 /tools/jpg (如果 jpg 是支持的格式) 或 /tools/image 都可以
      // 鉴于我们的路由逻辑支持 /tools/:moduleType 并且 moduleType 可以是具体格式
      // 我们优先使用 source 作为返回的类别锚点
      navigate(`/tools/${source.toLowerCase()}`);
    } else {
      setSelectedTool(null);
    }
  };

  const translate = (value) => (typeof value === 'string' ? t(value) : value);

  const handleToolNavigation = (toolName) => {
    // 封锁 MP3 相关工具的跳转（仅对非文档类工具生效）
    const lowerName = toolName.toLowerCase();
    const isDocTool = activeSection?.name === '主要功能'; // 文档转换工具所在的分类

    if (lowerName.includes('mp3') && !isDocTool) {
      return;
    }

    const parts = toolName.split(' To ');
    if (parts.length === 2) {
      const src = parts[0].toLowerCase();
      const tgt = parts[1].toLowerCase();

      // 再次确认源或目标格式是否包含 mp3 (仅对非文档类工具拦截)
      if ((src === 'mp3' || tgt === 'mp3') && !isDocTool) {
        return;
      }

      navigate(`/tool/${src}/${tgt}`);
    } else {
      setSelectedTool(toolName);
    }
  };

  // 渲染具体业务组件的函数
  // 你应该在这里根据 selectedTool 渲染不同的组件
  const renderFeatureComponent = () => {
    if (!selectedTool) return null;

    const ToolComponent = unifiedComponentMap[selectedTool];
    if (ToolComponent) {
      return <ToolComponent toolName={selectedTool} onBack={handleBackToGrid} />;
    }

    return (
      <DemoFeature
        toolName={selectedTool}
        onBack={handleBackToGrid} />);


  };

  if (!activeSection) return null;

  return (
    <div className={`app-container ${isMaximized ? 'maximized' : ''}`}>
      <ToolHeader />
      <div className="main-layout">
        <ToolSidebar
          sections={categoryData}
          activeSection={activeSection}
          onSectionClick={(section) => {
            setActiveSection(section);
            // 切换 Section 时，清除选中工具并导航回列表页
            // 这里我们可能无法轻易知道 section 对应的 moduleType 路径
            // 暂时只重置 selectedTool，如果 section 变化，URL 不变可能不太好
            // 但考虑到 Sidebar 主要是在当前大类下切换，URL 保持 /tools/xxx 可能还可以
            // 不过为了最佳体验，最好能更新 URL。但在目前结构下，Section 对象没有存储对应的 URL slug
            setSelectedTool(null);
          }}
          onToolClick={(tool, section) => {
            setActiveSection(section);
            handleToolNavigation(tool.name);
          }} />
        
        <main className="content-area">
          <div className="content-wrapper">
            {/* Persistent Back to Home Button */}
            <div
              onClick={() => navigate('/')}
              className="nav-back-home-btn"
              style={{
                position: 'absolute',
                top: '24px',
                right: '40px',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'var(--card-bg)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '99px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover-bg)';
                e.currentTarget.style.color = 'var(--primary-color)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md), 0 0 10px var(--border-glow)';
                e.currentTarget.style.borderColor = 'var(--primary-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card-bg)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}>
              
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>{t("返回主页")}</span>
            </div>

            {selectedTool ?
            renderFeatureComponent() :

            <>
                <div className="section-header">
                  <div className="section-divider"></div>
                  <h2 className="section-title">{translate(activeSection.name)}</h2>
                </div>
                
                {/* 网格视图 */}
                <div className="card-grid">
                  {activeSection.tools.
                filter((tool) => !tool.name.toLowerCase().includes('mp3')).
                map((tool) => {
                  // 解析工具名称，提取源格式和目标格式 (例如 "AVI To JPG")
                  const nameParts = tool.name.split(' To ');
                  const sourceFormat = nameParts[0];
                  const targetFormat = nameParts[1];

                  const displayToolName = translate(tool.name);
                  const displayDescription = translate(tool.description);
                  const sectionBaseName = typeof activeSection.name === 'string' ? activeSection.name.split(' ')[0] || activeSection.name : activeSection.name;
                  const sectionBaseNameTranslated = translate(sectionBaseName);
                  const sectionTag = typeof sectionBaseNameTranslated === 'string' ? t('section_tool_badge', { section: sectionBaseNameTranslated }) : sectionBaseNameTranslated;

                  return (
                    <div
                      key={tool.name}
                      className="tool-card"
                      onClick={() => handleToolNavigation(tool.name)}>
                      
                        <div className="tool-card-icon">
                          {targetFormat ?
                        <>
                              <span className="format-text source">{sourceFormat}</span>
                              <div className="format-divider"></div>
                              <span className="format-text target">{targetFormat}</span>
                            </> :

                        <tool.icon className="tool-icon" />
                        }
                        </div>
                        <div className="card-content">
                          <div className="card-header-row">
                            <h3 className="card-title">{displayToolName}</h3>
                            <div className="card-tags">
                              <span className="tag">{sectionTag}</span>
                            </div>
                          </div>
                          <p className="card-desc">{displayDescription}</p>
                        </div>
                      </div>);

                })}
                </div>
              </>
            }
          </div>
        </main>
      </div>
    </div>);

}

function MainPage() {
  const { moduleType, source, target } = useParams();

  let rawData = {};

  // Helper to determine category based on source format if moduleType is missing
  const getCategoryBySource = (src) => {
    if (!src) return videoCategories; // Default fallback
    const s = src.toLowerCase();

    // GIF 在本项目里属于“视频处理”下的 GIF 转换器（否则会错误落到图片类 JPG 转换器等）
    if (s === 'gif') {
      return videoCategories;
    }

    // Document formats
    if (['docx', 'doc', 'pdf', 'html', 'htm', 'txt', 'md', 'markdown', 'xml', 'json', 'csv', 'epub', 'mobi', 'azw3', 'xlsx', 'xls', 'excel', 'pptx', 'ppt'].includes(s)) {
      return docCategories;
    }
    // Image formats
    if (['jpg', 'jpeg', 'png', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif', 'heic', 'heif', 'raw'].includes(s)) {
      return imageCategories;
    }
    // Audio formats
    if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'aiff'].includes(s)) {
      return audioCategories;
    }

    // Default to video for others (mp4, avi, etc.)
    return videoCategories;
  };

  if (moduleType) {
    // 优先匹配大类名称
    switch (moduleType.toLowerCase()) {
      case 'video':rawData = videoCategories;break;
      case 'image':rawData = imageCategories;break;
      case 'audio':rawData = audioCategories;break;
      default:
        // 尝试作为具体格式匹配 (例如 jpg, mp3, docx)
        rawData = getCategoryBySource(moduleType);
    }
  } else {
    // If accessed via /tool/:source/:target, infer category from source
    rawData = getCategoryBySource(source);
  }

  // Ensure rawData is an object before trying to extract values
  const categoryData = rawData ? Object.values(rawData).flat() : [];

  return (
    <MainPageContent
      key={`${moduleType ?? ''}:${source ?? ''}:${target ?? ''}`}
      categoryData={categoryData}
      source={source}
      target={target}
      moduleType={moduleType} />);


}

export default MainPage;
