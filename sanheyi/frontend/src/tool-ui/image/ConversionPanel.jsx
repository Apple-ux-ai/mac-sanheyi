import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import UTIF from 'utif';
import FileUpload from './FileUpload';
import ParamConfig from './ParamConfig';
import { convertPNG, convertJPG, convertTIFF, convertSVG, API_BASE_URL } from './api';
import { categories as imageCategories } from '../../modules/configs/imageData';
import { audioCategories } from '../../modules/configs/audioData';
import '../../App.css';
import { t } from '@/i18n';

const translateLabel = (value) => (typeof value === 'string' ? t(value) : value);

function ConversionPanel({ toolName, onBack, sectionName, onSwitchSection, onSwitchTool }) {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [globalConverting, setGlobalConverting] = useState(false);
  const [config, setConfig] = useState({
    quality: 85,
    optimize: true,
    lossless: false,
    duration: 100,
    loop: undefined,
    compression_level: 6,
    background_color: '#FFFFFF',
    icon_size: 48,
    merge_pdf: false,
    merge_document: false,
    pdf_orientation: 'portrait',
    dpi: 300,
    scale: 1.0,
    compression: 'lzw',
    audio_bitrate: '128k',
    audio_sample_rate: '44100'
  });
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Conversion State Management
  const [hasConverted, setHasConverted] = useState(false);
  const [showReconvertConfirm, setShowReconvertConfirm] = useState(false);

  // Drag and Drop Visual Feedback
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const sectionMenuTimeoutRef = useRef(null);
  const toolMenuTimeoutRef = useRef(null);
  const [showSectionMenu, setShowSectionMenu] = useState(false);
  const [showToolMenu, setShowToolMenu] = useState(false);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.preview && f.preview.startsWith('blob:')) {
          URL.revokeObjectURL(f.preview);
        }
      });
    };
  }, []);

  // Reset when tool changes
  useEffect(() => {
    files.forEach((f) => {
      if (f.preview && f.preview.startsWith('blob:')) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setFiles([]);
    setGlobalConverting(false);
    setHasConverted(false);
  }, [toolName]);

  // Derive source and target formats
  const sourceFormat = toolName.split(' To ')[0]?.toUpperCase() || '';
  const targetFormat = toolName.split(' To ')[1]?.toLowerCase() || '';

  // Derive sibling tools and current section (Unified Logic)
  const { siblingTools, siblingSections, currentSectionName } = useMemo(() => {
    let section = null;
    let parentCategory = [];

    // Check Image Categories
    if (imageCategories && imageCategories['图片类']) {
      const imgCats = imageCategories['图片类'];
      for (const s of imgCats) {
        if (s.tools && s.tools.some((t) => t.name === toolName)) {
          section = s;
          parentCategory = imgCats;
          break;
        }
      }
    }

    // Check Audio Categories if not found
    if (!section && audioCategories) {
      for (const s of audioCategories) {
        if (s.tools && s.tools.some((t) => t.name === toolName)) {
          section = s;
          parentCategory = audioCategories;
          break;
        }
      }
    }

    // Fallback if sectionName prop is provided (from reference logic)
    if (!section && sectionName) {

      // logic to find by sectionName if needed, but toolName search is usually sufficient
    }
    return {
      currentSectionName: section ? section.name : sectionName || '工具箱',
      siblingTools: section ? section.tools : [],
      siblingSections: parentCategory
    };
  }, [toolName, sectionName]);

  const displayCurrentSectionName = translateLabel(currentSectionName);

  const getAcceptedFormats = () => {
    const formatMap = {
      'PNG': '.png',
      'JPG': '.jpg,.jpeg',
      'JPEG': '.jpg,.jpeg',
      'BMP': '.bmp',
      'GIF': '.gif',
      'WEBP': '.webp',
      'TIFF': '.tiff,.tif',
      'ICO': '.ico',
      'SVG': '.svg',
      'AI': '.ai',
      'PDF': '.pdf',
      'DOCX': '.docx',
      'DOC': '.doc',
      'TXT': '.txt',
      'HTML': '.html',
      'XML': '.xml',
      'JSON': '.json'
    };
    return formatMap[sourceFormat] || '.png';
  };

  const getConvertAPI = () => {
    const apiMap = {
      'PNG': convertPNG,
      'JPG': convertJPG,
      'JPEG': convertJPG,
      'TIFF': convertTIFF,
      'TIF': convertTIFF,
      'SVG': convertSVG
    };
    return apiMap[sourceFormat] || convertPNG;
  };

  const handleFileSelect = async (newFile) => {
    if (files.some((f) => f.file.name === newFile.name && f.file.size === newFile.size)) {
      return;
    }

    const isTiff = newFile.name.toLowerCase().endsWith('.tif') ||
    newFile.name.toLowerCase().endsWith('.tiff') ||
    newFile.type === 'image/tiff' ||
    newFile.type === 'image/tif';

    let previewUrl = null;

    if (isTiff) {
      try {
        const arrayBuffer = await newFile.arrayBuffer();
        const ifds = UTIF.decode(arrayBuffer);
        UTIF.decodeImage(arrayBuffer, ifds[0]);
        const rgba = UTIF.toRGBA8(ifds[0]);
        const width = ifds[0].width;
        const height = ifds[0].height;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);
        previewUrl = canvas.toDataURL('image/png');
      } catch (error) {
        console.error('TIFF preview generation failed:', error);
        previewUrl = null;
      }
    } else {
      previewUrl = URL.createObjectURL(newFile);
    }

    setFiles((prev) => [...prev, {
      id: Date.now() + Math.random(),
      file: newFile,
      preview: previewUrl,
      status: 'pending',
      result: null,
      error: null,
      selected: true
    }]);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== undefined && index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) {
      handleDragEnd();
      return;
    }
    setFiles((prev) => {
      const newFiles = [...prev];
      const [draggedItem] = newFiles.splice(dragIndex, 1);
      newFiles.splice(dropIndex, 0, draggedItem);
      return newFiles;
    });
    handleDragEnd();
  };

  const handleToggleSelect = (id) => {
    setFiles((prev) => {
      const updated = prev.map((f) =>
      f.id === id ? { ...f, selected: !f.selected } : f
      );
      return updated.sort((a, b) => (b.selected ? 1 : 0) - (a.selected ? 1 : 0));
    });
  };

  const handleSelectAll = () => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: true })));
  };

  const handleDeselectAll = () => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: false })));
  };

  const handleReconvertConfirm = () => {
    setFiles((prev) => prev.map((f) =>
    f.selected ? { ...f, status: 'pending', result: null, error: null } : f
    ));
    setShowReconvertConfirm(false);
    setHasConverted(false);
    setTimeout(() => {
      handleConvertSelectedFiles();
    }, 100);
  };

  const handleConvertSelectedFiles = async () => {
    const selectedPendingFiles = files.filter((f) => f.selected && (f.status === 'pending' || f.status === 'error'));
    if (selectedPendingFiles.length === 0) return;

    setGlobalConverting(true);
    const convertAPI = getConvertAPI();
    const documentFormats = ['ppt', 'docx', 'doc', 'html', 'xls', 'txt'];
    const shouldMerge = targetFormat === 'gif' && selectedPendingFiles.length > 1 ||
    targetFormat === 'pdf' && config.merge_pdf && selectedPendingFiles.length > 1 ||
    documentFormats.includes(targetFormat) && config.merge_document && selectedPendingFiles.length > 1;

    const isTiffToPdf = sourceFormat === 'TIFF' && targetFormat === 'pdf';
    const effectiveShouldMerge = isTiffToPdf ?
    selectedPendingFiles.length > 1 :
    shouldMerge;

    if (effectiveShouldMerge) {
      setFiles((prev) => prev.map((f) =>
      selectedPendingFiles.some((pf) => pf.id === f.id) ? { ...f, status: 'converting', error: null } : f
      ));

      try {
        const fileObjects = selectedPendingFiles.map((f) => f.file);
        const response = await convertAPI(fileObjects, targetFormat, config);

        setFiles((prev) => prev.map((f) => {
          const pendingIndex = selectedPendingFiles.findIndex((pf) => pf.id === f.id);
          if (pendingIndex === 0) {
            return { ...f, status: 'success', result: response };
          } else if (pendingIndex > 0) {
            return { ...f, status: 'success', result: { merged: true, size: response?.size } };
          }
          return f;
        }));

        const mergedCount = selectedPendingFiles.length;
        let successMessage = '';
        if (targetFormat === 'gif') {
          successMessage = t('成功将 ${count} 张图片合成为动态GIF', { count: mergedCount });
        } else if (targetFormat === 'pdf') {
          successMessage = t('成功将 ${count} 张图片合并为PDF', { count: mergedCount });
        } else {
          successMessage = t('成功将 ${count} 张图片合并为${format}文档', { count: mergedCount, format: targetFormat.toUpperCase() });
        }
        toast.success(successMessage);
      } catch (err) {
        setFiles((prev) => prev.map((f) =>
        selectedPendingFiles.some((pf) => pf.id === f.id) ?
        { ...f, status: 'error', error: err.message || '转换失败' } :
        f
        ));
        toast.error(`合并失败: ${err.message}`);
      }
    } else {
      const tasks = selectedPendingFiles.map(async (fileItem) => {
        setFiles((prev) => prev.map((f) =>
        f.id === fileItem.id ? { ...f, status: 'converting', error: null } : f
        ));

        try {
          const response = await convertAPI(fileItem.file, targetFormat, config);
          setFiles((prev) => prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: 'success', result: response } : f
          ));
          return { success: true };
        } catch (err) {
          setFiles((prev) => prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: 'error', error: err.message || '转换失败' } : f
          ));
          return { success: false };
        }
      });

      const results = await Promise.all(tasks);
      const successCount = results.filter((r) => r.success).length;
      const errorCount = results.filter((r) => !r.success).length;

      if (errorCount === 0) {
        toast.success(t('成功转换 ${successCount} 个文件', { successCount }));
      } else if (successCount === 0) {
        toast.error(t('转换失败 ${errorCount} 个文件', { errorCount }));
      } else {
        toast(t('成功转换 ${successCount} 个，失败 ${errorCount} 个', { successCount, errorCount }), {
          icon: '⚠️',
          style: { background: 'var(--card-bg)', color: 'var(--text-primary)' }
        });
      }
    }

    setGlobalConverting(false);
    setHasConverted(true);
  };

  const handleConvertAll = () => {
    const hasPendingOrErrorSelected = files.some(
      (f) => f.selected && (f.status === 'pending' || f.status === 'error')
    );
    const hasSuccessOrErrorSelected = files.some(
      (f) => f.selected && (f.status === 'success' || f.status === 'error')
    );

    if (hasConverted && hasSuccessOrErrorSelected && !hasPendingOrErrorSelected) {
      setShowReconvertConfirm(true);
    } else {
      handleConvertSelectedFiles();
    }
  };

  const handleRemoveFile = (id) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove && fileToRemove.preview && fileToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleClearAll = () => {
    files.forEach((f) => {
      if (f.preview && f.preview.startsWith('blob:')) {
        URL.revokeObjectURL(f.preview);
      }
    });
    setFiles([]);
    setHasConverted(false);
  };

  const handleDownloadAll = () => {
    const hasSuccess = files.some((f) => f.status === 'success');
    if (!hasSuccess) return;
    if (targetFormat === 'zip') {
      handleDownloadAllSeparate();
      return;
    }
    setShowDownloadModal(true);
  };

  const handleSectionMouseEnter = () => {
    if (sectionMenuTimeoutRef.current) {
      clearTimeout(sectionMenuTimeoutRef.current);
      sectionMenuTimeoutRef.current = null;
    }
    setShowSectionMenu(true);
  };

  const handleSectionMouseLeave = () => {
    if (sectionMenuTimeoutRef.current) {
      clearTimeout(sectionMenuTimeoutRef.current);
    }
    sectionMenuTimeoutRef.current = setTimeout(() => {
      setShowSectionMenu(false);
    }, 150);
  };

  const handleToolMouseEnter = () => {
    if (toolMenuTimeoutRef.current) {
      clearTimeout(toolMenuTimeoutRef.current);
      toolMenuTimeoutRef.current = null;
    }
    setShowToolMenu(true);
  };

  const handleToolMouseLeave = () => {
    if (toolMenuTimeoutRef.current) {
      clearTimeout(toolMenuTimeoutRef.current);
    }
    toolMenuTimeoutRef.current = setTimeout(() => {
      setShowToolMenu(false);
    }, 150);
  };

  const buildDownloadUrl = (result) => {
    if (!result?.file_url) return null;
    return `${API_BASE_URL}${result.file_url}`;
  };

  const handleDownloadAllSeparate = async () => {
    setShowDownloadModal(false);
    const successFiles = files.filter((f) => f.status === 'success' && f.result);
    if (successFiles.length === 0) return;
    const downloadableFiles = successFiles.filter((f) => f.result?.file_url);
    if (downloadableFiles.length === 0) return;
    const isMergedMode = successFiles.length > downloadableFiles.length;

    // Use window.electron instead of window.electronAPI
    if (window.electron?.downloadAllFiles) {
      try {
        const filesData = downloadableFiles.
        map((f) => ({
          url: buildDownloadUrl(f.result),
          filename: f.result.filename
        })).
        filter((f) => f.url);

        const result = await window.electron.downloadAllFiles(filesData);
        if (result.success) {
          const successCount = result.results.filter((r) => r.success).length;
          const failedCount = result.results.filter((r) => !r.success && !r.canceled).length;

          if (failedCount > 0) {
            if (isMergedMode) {
              toast.error(`下载失败 ${failedCount} 个文件，成功 ${successCount} 个（已合并为单个文件）`);
            } else {
              toast.error(`下载失败 ${failedCount} 个，成功 ${successCount}/${downloadableFiles.length} 个文件`);
            }
          } else {
            if (isMergedMode) {
              toast.success(`成功下载 ${successCount} 个文件（已合并为单个文件）`);
            } else {
              toast.success(`成功下载 ${successCount}/${downloadableFiles.length} 个文件`);
            }
          }
        } else {
          toast.error('下载失败: ' + result.error);
        }
      } catch {
        toast.error('下载处理器不可用，请重启应用后重试');
      }
    } else {
      let downloadedCount = 0;
      for (const f of downloadableFiles) {
        const url = buildDownloadUrl(f.result);
        if (!url) continue;
        try {
          const response = await fetch(url);
          if (!response.ok) continue;
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = f.result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          downloadedCount++;
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch {
          console.error('下载失败:', f.result.filename);
        }
      }
      if (isMergedMode) {
        toast.success(`成功下载 ${downloadedCount} 个文件（已合并为单个文件）`);
      } else {
        toast.success(`成功下载 ${downloadedCount}/${downloadableFiles.length} 个文件`);
      }
    }
  };

  const handleDownloadAsZip = async () => {
    setShowDownloadModal(false);
    const successFiles = files.filter((f) => f.status === 'success' && f.result);
    if (successFiles.length === 0) return;

    try {
      const zip = new JSZip();
      for (const fileItem of successFiles) {
        const url = buildDownloadUrl(fileItem.result);
        if (!url) continue;
        const response = await fetch(url);
        const blob = await response.blob();
        zip.file(fileItem.result.filename, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'arraybuffer' });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const defaultFilename = `converted_images_${timestamp}.zip`;

      if (window.electron?.saveZip) {
        try {
          const result = await window.electron.saveZip(zipBlob, defaultFilename);
          if (result.success) {
            toast.success(`压缩包已保存到: ${result.filePath}`);
          } else if (!result.canceled) {
            toast.error('保存失败: ' + result.error);
          }
        } catch {
          toast.error('保存处理器不可用，请重启应用后重试');
        }
      } else {
        const url = URL.createObjectURL(new Blob([zipBlob]));
        const link = document.createElement('a');
        link.href = url;
        link.download = defaultFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error('打包下载失败: ' + error.message);
    }
  };

  const handleDownloadSingle = async (fileItem) => {
    if (!fileItem.result) return;
    if (!fileItem.result.file_url) {
      if (fileItem.result.merged) {
        toast('该模式已合并为单个文件，请在“全部下载”中下载合并后的文件', {
          icon: 'ℹ️',
          style: { background: 'var(--card-bg)', color: 'var(--text-primary)' }
        });
      }
      return;
    }

    const url = buildDownloadUrl(fileItem.result);
    if (!url) return;
    const filename = fileItem.result.filename;

    if (window.electron?.downloadFile) {
      try {
        const result = await window.electron.downloadFile(url, filename);
        if (result.success) {
          toast.success(`文件已保存到: ${result.filePath}`);
        } else if (!result.canceled) {
          toast.error('下载失败: ' + result.error);
        }
      } catch {
        toast.error('下载处理器不可用，请重启应用后重试');
      }
    } else {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`下载失败: ${response.status}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } catch (error) {
        toast.error('下载失败: ' + error.message);
      }
    }
  };

  const getShortDescription = () => {
    const s = sourceFormat;
    const target = targetFormat.toUpperCase();
    if (target === 'PDF') return t('将${s}高效转换为PDF文档，支持多图合并与页面方向调整。', { s });
    if (target === 'GIF') return t('将多张图片合成动态GIF，可自定义帧延迟与循环选项。');
    if (target === 'ICO') return t('制作专业图标文件，支持多种尺寸选择与透明背景填充。');
    if (target === 'ZIP') return t('批量打包${s}文件为压缩包，支持自定义压缩强度。', { s });
    if (target === 'TIFF') return t('转换为专业印刷级TIFF格式，支持多种行业标准压缩算法。');
    if (target === 'WEBP' || target === 'AVIF') return t('转换为现代高效图像格式，提供无损压缩与质量调节选项。');
    return t('快速转换${s}为${t}格式，支持画质调节、背景填充及体积优化。', { s, t: target });
  };

  const formatFileSize = (bytes) => {
    if (bytes === null || bytes === undefined || Number.isNaN(bytes)) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const totalFiles = files.length;
  const finishedFiles = files.filter((f) => f.status === 'success' || f.status === 'error').length;
  let listTitle = t('文件列表 (${count})', { count: totalFiles });
  if (globalConverting) {
    listTitle = t('转换进度 (${finished}/${total})', { finished: finishedFiles, total: totalFiles });
  } else if (finishedFiles > 0) {
    listTitle = t('转换结束 (${finished}/${total})', { finished: finishedFiles, total: totalFiles });
  }

  const hasPendingOrErrorSelected = files.some((f) => f.selected && (f.status === 'pending' || f.status === 'error'));
  const hasSuccessOrErrorSelected = files.some((f) => f.selected && (f.status === 'success' || f.status === 'error'));
  const canReconvertSelected = hasConverted && hasSuccessOrErrorSelected;
  const isConvertDisabled = globalConverting || (!hasPendingOrErrorSelected && !canReconvertSelected);
  const convertButtonLabel = globalConverting ? t('转换中...') : hasConverted ? t('重新转换') : t('全部转换');

  return (
    <div className="conversion-panel">
      <nav className="breadcrumb-modern">
        <div className="breadcrumb-item home" onClick={() => navigate('/')} title={t("返回首页")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item dropdown-container" onMouseEnter={handleSectionMouseEnter} onMouseLeave={handleSectionMouseLeave}>
          <button className="breadcrumb-trigger" onClick={() => navigate(`/tools/${sourceFormat.toLowerCase()}`)}>
            {displayCurrentSectionName}
            <svg className="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {showSectionMenu && siblingSections.length > 0 &&
          <div className="breadcrumb-dropdown-menu">
              {siblingSections.map((section) =>
            <div key={section.name} className={`dropdown-item ${section.name === currentSectionName ? 'active' : ''}`} onClick={(e) => {
              e.stopPropagation();
              if (onSwitchSection) {
                onSwitchSection(section);
              } else {
                // 修复：增加兜底跳转逻辑，跳转到对应格式的工具列表页
                const format = section.name.split(' ')[0].toLowerCase();
                navigate(`/tools/${format}`);
              }
              setShowSectionMenu(false);
            }}>
                  {translateLabel(section.name)}
                </div>
            )}
            </div>
          }
        </div>
        <span className="breadcrumb-separator">/</span>
        <div className="breadcrumb-item dropdown-container" onMouseEnter={handleToolMouseEnter} onMouseLeave={handleToolMouseLeave}>
          <span className="breadcrumb-current-trigger">
            {toolName}
            <svg className="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
          {showToolMenu && siblingTools.length > 0 &&
          <div className="breadcrumb-dropdown-menu scrollable">
              {siblingTools.map((tool) =>
            <div key={tool.name} className={`dropdown-item ${tool.name === toolName ? 'active' : ''}`} onClick={(e) => {
              e.stopPropagation();
              if (onSwitchTool) {
                onSwitchTool(tool.name);
              } else {
                // Internal navigation logic since we don't have onSwitchTool passed often
                const parts = tool.name.split(' To ');
                if (parts.length === 2) {
                  navigate(`/tool/${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`);
                }
              }
              setShowToolMenu(false);
            }}>
                  {translateLabel(tool.name)}
                </div>
            )}
            </div>
          }
        </div>
      </nav>

      <div className="panel-header-row">
        <button className="back-button-circle" onClick={onBack} title={t("返回上一级")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div className="panel-header-content">
          <h2 className="panel-title">{toolName}</h2>
          <p className="panel-subtitle">{getShortDescription()}</p>
        </div>
      </div>

      <div className="conversion-layout">
        <div className="layout-top-section">
          <div className="upload-box-wrapper">
            <FileUpload onFileSelect={handleFileSelect} acceptedFormats={getAcceptedFormats()} sourceFormat={sourceFormat} />
          </div>
          <div className="config-box-wrapper">
            <div className="config-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>{t("转换选项")}

            </div>
            <div className="config-content-scroll">
              <ParamConfig targetFormat={targetFormat} sourceFormat={sourceFormat} config={config} onChange={setConfig} />
            </div>
          </div>
        </div>

        <div className="file-list-container">
          <div className="file-list-header">
            <h3>{listTitle}</h3>
            <div className="actions-toolbar">
              <button className="btn-action btn-secondary" onClick={handleSelectAll} disabled={globalConverting || files.length === 0 || files.every((f) => f.selected)}>{t("全选")}

              </button>
              <button className="btn-action btn-secondary" onClick={handleDeselectAll} disabled={globalConverting || files.length === 0 || files.every((f) => !f.selected)}>{t("取消全选")}

              </button>
              <button className="btn-action btn-primary" onClick={handleConvertAll} disabled={isConvertDisabled}>
                {convertButtonLabel}
              </button>
              <button className="btn-action btn-secondary" onClick={handleClearAll} disabled={files.length === 0 || globalConverting}>{t("清空全部")}

              </button>
              <button className="btn-action btn-success" onClick={handleDownloadAll} disabled={files.filter((f) => f.status === 'success').length === 0}>{t("全部下载")}

              </button>
            </div>
          </div>

          {files.length > 0 ?
          <div className="file-list-section">
              {files.map((file, index) =>
            <div
              key={file.id}
              className={`file-card status-${file.status}${draggedIndex === index ? ' dragging' : ''}${dragOverIndex === index ? ' drag-over' : ''}${!file.selected ? ' unselected' : ''}`}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}>
              
                  <div className="drag-handle" title={t("拖拽排序")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="6" r="1.5" fill="currentColor" />
                      <circle cx="15" cy="6" r="1.5" fill="currentColor" />
                      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                      <circle cx="9" cy="18" r="1.5" fill="currentColor" />
                      <circle cx="15" cy="18" r="1.5" fill="currentColor" />
                    </svg>
                  </div>
                  <input
                type="checkbox"
                className="file-card-checkbox"
                checked={file.selected}
                onChange={() => handleToggleSelect(file.id)}
                disabled={file.status === 'converting'} />
              
                  <span className="file-index">{index + 1}</span>
                  <div className="file-info">
                    <div className="file-preview">
                      {file.preview ?
                  <img src={file.preview} alt={file.file.name} /> :

                  <div className="file-icon-placeholder">
                          {file.file.name.split('.').pop().toUpperCase()}
                        </div>
                  }
                    </div>
                    <div className="file-details">
                      <span className="file-name" title={file.file.name}>{file.file.name}</span>
                      <span className="file-meta">
                        {formatFileSize(file.file.size)}
                        {file.status === 'success' && file.result &&
                    <>
                            <span className="arrow">→</span>
                            {formatFileSize(file.result.size)}
                          </>
                    }
                      </span>
                    </div>
                  </div>
                  <div className="file-status">
                    {file.status === 'pending' && <span className="status-badge pending">{t("待处理")}</span>}
                    {file.status === 'converting' && <span className="status-badge converting">{t("转换中...")}</span>}
                    {file.status === 'success' && <span className="status-badge success">{t("成功")}</span>}
                    {file.status === 'error' && <span className="status-badge error" title={file.error}>{t("失败")}</span>}
                  </div>
                  <div className="file-actions">
                    {file.status === 'success' ?
                <button className="btn-icon download" onClick={() => handleDownloadSingle(file)} title={t("下载")}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </button> :

                <button className="btn-icon remove" onClick={() => handleRemoveFile(file.id)} disabled={file.status === 'converting'} title={t("移除")}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                }
                  </div>
                </div>
            )}
            </div> :

          <div className="empty-state-placeholder">
              <p>{t("暂无文件，请在上方添加")}</p>
            </div>
          }
        </div>
      </div>

      {showDownloadModal &&
      <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{t("选择下载方式")}</h3>
            <div className="modal-options">
              <button className="modal-option-btn" onClick={handleDownloadAsZip}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="11" x2="12" y2="17"></line>
                  <polyline points="9 14 12 17 15 14"></polyline>
                </svg>
                <div>
                  <div className="option-title">{t("下载为压缩包")}</div>
                  <div className="option-desc">{t("将所有文件打包为一个 ZIP 文件")}</div>
                </div>
              </button>
              <button className="modal-option-btn" onClick={handleDownloadAllSeparate}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <div>
                  <div className="option-title">{t("批量下载")}</div>
                  <div className="option-desc">{t("逐个选择保存位置并下载")}</div>
                </div>
              </button>
            </div>
            <button className="modal-close-btn" onClick={() => setShowDownloadModal(false)}>{t("取消")}</button>
          </div>
        </div>
      }

      {/* 重新转换确认弹窗 */}
      {showReconvertConfirm &&
      <div className="modal-overlay" onClick={() => setShowReconvertConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{t("确认重新转换")}</h3>
            <p className="modal-desc">{t("确定要重新转换已勾选的文件吗？这将重置这些文件的状态并重新执行转换。")}

          </p>
            <div className="modal-buttons">
              <button
              className="btn-action btn-primary"
              onClick={handleReconvertConfirm}>{t("确认转换")}


            </button>
              <button
              className="btn-action btn-secondary"
              onClick={() => setShowReconvertConfirm(false)}>{t("取消")}


            </button>
            </div>
          </div>
        </div>
      }
    </div>);

}

export default ConversionPanel;
