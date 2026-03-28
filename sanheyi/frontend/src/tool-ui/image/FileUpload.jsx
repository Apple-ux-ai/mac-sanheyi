import { useState, useRef } from 'react';
import '../../App.css';import { t } from '@/i18n';


function FileUpload({ onFileSelect, acceptedFormats = ".png", sourceFormat = "PNG" }) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // 支持多文件拖拽
      Array.from(e.dataTransfer.files).forEach((file) => {
        onFileSelect(file);
      });
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      // 支持多文件选择
      Array.from(e.target.files).forEach((file) => {
        onFileSelect(file);
      });
      // 重置 input value，允许重复选择同一文件
      e.target.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats}
          onChange={handleChange}
          style={{ display: 'none' }}
          multiple // 允许选择多个文件
        />
        
        <div className="upload-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        
        <div className="upload-text">
          <p className="upload-title">{t("将您的")}{sourceFormat}{t("文件拖拽到此处")}</p>
          <p className="upload-subtitle">{t("或点击浏览文件")}</p>
        </div>
        
        <button className="select-file-btn" type="button">{t("+ 选择文件")}

        </button>
      </div>
    </div>);

}

export default FileUpload;