import '../../App.css';import { t } from '@/i18n';


function ResultDisplay({ result, onReset }) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `http://127.0.0.1:8000${result.file_url}`;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="result-display-container">
      <div className="result-success-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      
      <h3 className="result-title">{t("转换成功!")}</h3>
      
      <div className="result-info">
        <div className="result-info-item">
          <span className="result-label">{t("文件名:")}</span>
          <span className="result-value">{result.filename}</span>
        </div>
        <div className="result-info-item">
          <span className="result-label">{t("文件大小:")}</span>
          <span className="result-value">{formatFileSize(result.size)}</span>
        </div>
      </div>
      
      <div className="result-actions">
        <button className="btn-download" onClick={handleDownload}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>{t("全部下载")}

        </button>
        <button className="btn-convert-another" onClick={onReset}>{t("转换另一个文件")}

        </button>
      </div>
    </div>);

}

export default ResultDisplay;