import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { videoCategories } from '../modules/configs';
import ToolHeader from '../components/ToolHeader';
import ToolSidebar from '../components/ToolSidebar';
import AVIToJPGUI from '../tool-ui/video/AVIToJPGUI'; // Import the tool UI directly
import AVIToMPEGUI from '../tool-ui/video/AVIToMPEGUI'; // Import AVI To MPE UI
import '../App.css';import { t } from '@/i18n';


function VideoTools() {
  const categoryData = videoCategories;
  const [activeSection, setActiveSection] = useState(() => categoryData?.[0] ?? null);
  const translate = (value) => (typeof value === 'string' ? t(value) : value);

  // Determine if we are showing a specific tool or the list
  const [currentTool, setCurrentTool] = useState(null);

  // Handle back button or direct navigation logic if needed
  const handleBackToList = () => {
    setCurrentTool(null);
  };

  if (!categoryData?.length) return <Navigate to="/" replace />;
  if (!activeSection) return null;

  return (
    <div className="app-container">
      <ToolHeader />
      <div className="main-layout">
        <ToolSidebar
          sections={categoryData}
          activeSection={activeSection}
          onSectionClick={(section) => {
            setActiveSection(section);
            setCurrentTool(null); // Reset to list view when changing sections
          }} />
        
        <main className="content-area">
          <div className="content-wrapper">
            {currentTool === 'AVI To JPG' ?
            // Render the specific tool UI inside the content area
            <AVIToJPGUI onBack={handleBackToList} /> :
            currentTool === 'AVI To MPE' ?
            // Render the specific tool UI inside the content area
            <AVIToMPEGUI onBack={handleBackToList} /> :

            // Render the list of tools
            <>
                <div className="section-header">
                  <div className="section-divider"></div>
                   <h2 className="section-title">{translate(activeSection.name)}</h2>
                </div>
                
                <div className="card-grid">
                  {activeSection.tools.map((tool) => {
                const [sourceFormat = 'FILE', targetFormat = 'FILE'] = tool.split(' To ');
                const tagLabel = t('${format} 工具', { format: sourceFormat });
                const description = t('一款在线${source}转${target}转换器，支持自定义参数，提供多种分辨率选项，助您轻松完成格式转换。', { source: sourceFormat, target: targetFormat });
                return (
                <div
                  key={tool}
                  className="tool-card"
                  onClick={() => {
                    if (tool === "AVI To JPG" || tool === "AVI To MPE" || tool === "AVI To MOV" || tool === "AVI To WAV") {
                      setCurrentTool(tool);
                    } else {
                      alert(t('该功能尚未实现 UI，请先试用 AVI To JPG'));
                    }
                  }}
                  style={{ cursor: 'pointer' }}>
                  
                      <div className="card-icon-wrapper">
                        <div className="file-icon source">{sourceFormat}</div>
                        <div className="arrow-icon">→</div>
                        <div className="file-icon target">{targetFormat}</div>
                      </div>
                      <div className="card-content">
                        <h3 className="card-title">{translate(tool)}</h3>
                        <div className="card-tags">
                          <span className="tag">{tagLabel}</span>
                        </div>
                        <p className="card-desc">{description}</p>
                      </div>
                    </div>
                );
              })}
                </div>
              </>
            }
          </div>
        </main>
      </div>
    </div>);

}

export default VideoTools;
