import React, { useState } from 'react';import { t } from '@/i18n';


export const FileUploaderV2 = ({
  files = [],
  fileInfos = {},
  onAddFile,
  onAddFolder,
  onRemoveFile,
  onSetGlobalPath,
  onSetCustomPath,
  onPreview,
  activeFile,
  onSelectFile, // External selection if needed, but we'll handle multi-select internally for path setting
  results = {}, // { filePath: resultDirPath }
  customPaths = {}, // { filePath: customPath }
  globalPath = '',
  showAudioInfo = true,
  hidePreview = false,
  uploadPlaceholder = "将您的文件拖拽到此处"
}) => {
  const hasFiles = files && files.length > 0;
  const [isDragging, setIsDragging] = useState(false);
  const placeholderText = typeof uploadPlaceholder === 'string' ? t(uploadPlaceholder) : uploadPlaceholder;

  // Internal selection state for path setting operations
  const [selectedForPath, setSelectedForPath] = useState(new Set());

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0 && onAddFile) {
      // Create a mock event to match the input change handler if needed, 
      // but usually we can just pass the files to onAddFile if it supports it.
      // Checking existing code, onAddFile is usually a function that opens dialog.
      // We need to check how individual GUI components implement onAddFile.
      onAddFile(droppedFiles);
    }
  };

  const handleItemClick = (file, e) => {
    // Prevent triggering if clicking actions
    e.stopPropagation();

    // Toggle selection
    const newSelection = new Set(selectedForPath);
    if (newSelection.has(file)) {
      newSelection.delete(file);
    } else {
      newSelection.add(file);
    }
    setSelectedForPath(newSelection);

    // Also trigger external select if provided (for preview etc)
    if (onSelectFile) {
      onSelectFile(file);
    }
  };

  const handleSetPath = (e) => {
    e.stopPropagation();
    if (selectedForPath.size > 0 && onSetCustomPath) {
      onSetCustomPath(Array.from(selectedForPath));
      // Optional: Clear selection after setting path? Let's keep it for now user might want to change it again
      setSelectedForPath(new Set());
    }
  };

  const handleOpenResult = (path, e) => {
    e.stopPropagation();
    if (!path) return;

    let target = path;
    if (typeof target === 'object') {
      target = target.path || target.output || target.outputPath || '';
    }

    if (window.electron && window.electron.openPath && target) {
      const segments = target.split(/[/\\]/);
      const last = segments[segments.length - 1];
      let targetPath = target;
      if (last && last.includes('.')) {
        segments.pop();
        if (segments.length > 0) {
          const sep = target.includes('\\') ? '\\' : '/';
          targetPath = segments.join(sep);
        }
      }
      window.electron.openPath(targetPath);
    }
  };

  return (
    <div
      className={`file-uploader video-specific-uploader ${hasFiles ? 'has-files' : ''} ${isDragging ? 'is-dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}>
      
      {!hasFiles ?
      <div className="file-uploader-empty" onClick={() => onAddFile && onAddFile()}>
          <input
          type="file"
          id="file-input"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => onAddFile && onAddFile(e.target.files)} />
        
          <div className="upload-content-wrapper" style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="upload-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19a5.5 5.5 0 0 0 0-11h-1.2a7 7 0 1 0-13.8 2.5 5.5 5.5 0 0 0 0 8.5"></path>
                <polyline points="12 13 12 7 15 10"></polyline>
                <polyline points="12 7 9 10"></polyline>
                <path d="M12 7v12"></path>
              </svg>
            </div>
            <div className="upload-text">{placeholderText}</div>
            <div className="upload-subtext">{t("或者点击浏览文件")}</div>
            <div className="upload-actions">
              <button className="upload-btn" style={{ pointerEvents: 'auto' }} onClick={(e) => {e.stopPropagation();onAddFile();}}><span>+</span>{t("选择文件")}</button>
            </div>
          </div>
        </div> :

      <>
          <div className="file-uploader-header">
             <div className="header-actions">
               <button className="header-btn primary" onClick={onAddFile}>
                 <span>+</span>{t("继续导入")}
            </button>
               {onAddFolder &&
            <button className="header-btn" onClick={onAddFolder}>
                   <span>📂</span>{t("导入文件夹")}
            </button>
            }
               
               {/* New Path Management Buttons */}
               <button
              className="header-btn"
              onClick={onSetGlobalPath}
               title={globalPath ? t('当前全局路径: ${path}', { path: globalPath }) : t('设置全局输出路径')}>
              
                 <span>🌐</span>{t("全局配置")}
            </button>
               
               <button
              className={`header-btn ${selectedForPath.size === 0 ? 'disabled' : ''}`}
              onClick={handleSetPath}
              disabled={selectedForPath.size === 0}
              style={{ opacity: selectedForPath.size === 0 ? 0.5 : 1 }}>
               
                  <span>📍</span>{t('设置路径 (${count})', { count: selectedForPath.size })}
                </button>
             </div>
          </div>
          <div className="file-list">
            {files.map((file, index) => {
            const info = fileInfos[file];
            const trackCount = info?.audio_tracks_count;
            const isSelected = selectedForPath.has(file);
            const isActive = activeFile === file; // Keep original active concept for preview if needed
            const filePath = typeof file === 'string' ? file : file.path;
            const hasCustomPath = customPaths[filePath];
            const resultPath = results[filePath];

            return (
              <div
                key={index}
                className={`file-item ${isSelected ? 'selected-for-path' : ''} ${isActive ? 'active' : ''}`}
                onClick={(e) => handleItemClick(file, e)}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  margin: isSelected ? '0px' : '1px', // Compensate for border width difference to prevent layout shift
                  backgroundColor: isSelected ? 'rgba(var(--primary-rgb), 0.05)' : undefined,
                  outline: 'none',
                  userSelect: 'none'
                }}>
                
                  <div className="file-icon">🎬</div>
                  <div className="file-info">
                    <div className="file-name">
                        {typeof file === 'string' ? file.split(/[/\\]/).pop() : file.name}
                        {hasCustomPath && <span className="path-badge custom" title={t("已设置自定义路径")}>📍</span>}
                    </div>
                    <div className="file-path">{filePath}</div>
                  </div>
                  <div className="file-actions-inline">
                     {/* Result Folder Button - Shows when processing is done */}
                     {resultPath &&
                  <button
                    className="btn-preview-small"
                    onClick={(e) => handleOpenResult(resultPath, e)}
                    title={t("打开结果文件夹")}
                    style={{ marginRight: '8px', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                    
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                           </svg>
                        </button>
                  }

                     {showAudioInfo && trackCount !== undefined &&
                  <div className="audio-track-badge" title={t("该视频包含 ${trackCount} 条音轨", { "trackCount": trackCount })}>
                           <span>🎧</span> {trackCount}{t("音轨")}
                  </div>
                  }
                     {!hidePreview &&
                  <button
                    className="btn-preview-small"
                    onClick={(e) => {e.stopPropagation();onPreview && onPreview(file);}}
                    title={t("预览视频")}>
                    
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                             <circle cx="12" cy="12" r="3"></circle>
                           </svg>
                        </button>
                  }
                     <div className="file-remove" onClick={(e) => {e.stopPropagation();onRemoveFile(index);}} title={t("移除文件")}>
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <line x1="18" y1="6" x2="6" y2="18"></line>
                         <line x1="6" y1="6" x2="18" y2="18"></line>
                       </svg>
                     </div>
                  </div>
                </div>);

          })}
          </div>
        </>
      }
    </div>);

};
