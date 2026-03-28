import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import FileUpload from '../image/FileUpload';
import { convertGeneral, convertJSON, convertXML } from './api';
import { api } from '../../services/api';
import { categories } from '../../modules/configs/docData';
import '../../App.css';import { t } from '@/i18n';


function DocToolWrapper({ toolName, onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  // Parse tool name (e.g., "DOCX To PDF")
  const [rawSource, rawTarget] = toolName.split(' To ');
  const sourceFormat = rawSource ? rawSource.toUpperCase() : '';
  const targetFormat = rawTarget ? rawTarget.toUpperCase() : '';

  const isPptOrExcelSpecificTool = useMemo(() => {
    const isPptSource = ['PPT', 'PPTX'].includes(sourceFormat);
    const isExcelSource = ['XLSX', 'XLS', 'EXCEL'].includes(sourceFormat);

    if (isPptSource) {
      return ['PDF', 'PNG', 'JPG', 'VIDEO'].includes(targetFormat);
    }
    if (isExcelSource) {
      return ['PPT', 'PDF', 'PNG', 'JPG'].includes(targetFormat);
    }
    return false;
  }, [sourceFormat, targetFormat]);

  const [files, setFiles] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [isConverting, setIsConverting] = useState(false);
  const [results, setResults] = useState({}); // Map file index to result
  const [isWatermarkOpen, setIsWatermarkOpen] = useState(false);
  const [isToolDropdownOpen, setIsToolDropdownOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const [config, setConfig] = useState(() => {
    const defaultConfig = {
      quality: 85,
      backgroundColor: '#ffffff',
      watermark: {
        text: '',
        size: 40,
        opacity: 30,
        angle: 45,
        color: '#cccccc',
        position: 'center'
      }
    };
    try {
      const saved = localStorage.getItem('doc_watermark_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultConfig, watermark: { ...defaultConfig.watermark, ...parsed } };
      }
    } catch (e) {
      console.error('Failed to load watermark settings:', e);
    }
    return defaultConfig;
  });

  // Sync watermark settings to localStorage
  useEffect(() => {
    localStorage.setItem('doc_watermark_settings', JSON.stringify(config.watermark));
  }, [config.watermark]);

  // Additional options from original ToolDetailContent.jsx
  const [convertOptions, setConvertOptions] = useState({
    quality: 85,
    backgroundColor: '#ffffff',
    csvDelimiter: '逗号 (,)',
    yamlIndent: 2,
    orientation: '横向',
    pdfPageSelection: '所有页面',
    animationDelay: 100,
    loopAnimation: true,
    speechSpeed: 1.0,
    speechPitch: 1.0,
    pageSize: 'A4',
    docxPdfPageRange: '',
    pdfCustomRange: '',
    indent: 2
  });

  const [htmlOptions, setHtmlOptions] = useState({
    codeMode: false,
    cssHandling: '保留所有 CSS',
    removeScripts: true,
    compressHtml: false,
    pageSize: 'A4',
    orientation: '纵向'
  });

  const [expandedSections, setExpandedSections] = useState({
    preview: false,
    css: false,
    cleanup: false
  });

  const toggleSection = (section) => {
    if (sourceFormat === 'HTML') {
      // HTML specific behavior: Mutually exclusive expanded sections
      setExpandedSections((prev) => {
        // If the clicked section is already open, close it
        if (prev[section]) {
          return { ...prev, [section]: false };
        }
        // Otherwise, open the clicked section and close all others
        return {
          preview: section === 'preview',
          css: section === 'css',
          cleanup: section === 'cleanup'
        };
      });
    } else {
      // Default behavior for other formats (if any other sections use this state)
      setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    }
  };

  // Calculate sibling tools for breadcrumb dropdown
  const { siblingTools } = useMemo(() => {
    const majorCategory = categories['主要功能'] || [];
    let section = null;
    for (const s of majorCategory) {
      if (s.tools && s.tools.some((t) => t.name === toolName)) {
        section = s;
        break;
      }
    }
    return {
      currentSection: section,
      siblingTools: section ? section.tools.map((t) => t.name) : []
    };
  }, [toolName]);

  const handleToolBreadcrumbToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!siblingTools.length) return;
    setIsToolDropdownOpen((prev) => !prev);
  };

  const handleBreadcrumbToolSelect = (name) => {
    setIsToolDropdownOpen(false);
    if (name === toolName) return;
    const parts = name.split(' To ');
    if (parts.length !== 2) return;
    const src = parts[0].toLowerCase();
    const tgt = parts[1].toLowerCase();
    navigate(`/tool/${src}/${tgt}`);
  };

  const formatToolDisplayName = (name) => {
    if (typeof name !== 'string') return name;
    const parts = name.split(' To ');
    if (parts.length === 2) {
      return t('${source} 转为 ${target}', { source: parts[0], target: parts[1] });
    }
    return t(name);
  };

  const handleNavigate = (path) => {
    if (path === '/') navigate('/');
  };

  const handleConverterClick = () => {
    // 优先使用父组件提供的返回逻辑 (MainPage handleBackToGrid)
    if (onBack) {
      onBack();
      return;
    }

    // Map source format to appropriate route (document types only)
    const formatRoutes = {
      'DOCX': '/tools/docx',
      'HTML': '/tools/html',
      'JSON': '/tools/json',
      'PDF': '/tools/pdf',
      'TXT': '/tools/txt',
      'XML': '/tools/xml',
      'XLSX': '/tools/xlsx',
      'XLS': '/tools/xlsx',
      'EXCEL': '/tools/xlsx',
      'PPT': '/tools/pptx',
      'PPTX': '/tools/pptx'
    };

    const route = formatRoutes[sourceFormat] || '/tools/doc';
    navigate(route);
  };

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // 文件类型映射表，包含扩展名和 MIME 类型以增强过滤
  const FILE_TYPE_MAP = {
    'PDF': ['.pdf', 'application/pdf'],
    'DOCX': ['.doc', '.docx', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'DOC': ['.doc', '.docx', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'HTML': ['.html', '.htm', 'text/html'],
    'JSON': ['.json', 'application/json'],
    'XML': ['.xml', 'text/xml', 'application/xml'],
    'TXT': ['.txt', '.text', 'text/plain'],
    'CSV': ['.csv', 'text/csv'],
    'XLSX': ['.xls', '.xlsx', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'XLS': ['.xls', '.xlsx', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'EXCEL': ['.xls', '.xlsx', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'YAML': ['.yaml', '.yml', 'text/yaml', 'application/x-yaml'],
    'YML': ['.yaml', '.yml', 'text/yaml', 'application/x-yaml'],
    'MD': ['.md', '.markdown', 'text/markdown'],
    'MARKDOWN': ['.md', '.markdown', 'text/markdown'],
    'RTF': ['.rtf', 'application/rtf'],
    'EPUB': ['.epub', 'application/epub+zip'],
    'PPT': ['.ppt', '.pptx', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    'PPTX': ['.ppt', '.pptx', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    'ODT': ['.odt', 'application/vnd.oasis.opendocument.text'],
    'SVG': ['.svg', 'image/svg+xml'],
    'PNG': ['.png', 'image/png'],
    'JPG': ['.jpg', '.jpeg', 'image/jpeg'],
    'JPEG': ['.jpg', '.jpeg', 'image/jpeg'],
    'GIF': ['.gif', 'image/gif'],
    'BMP': ['.bmp', 'image/bmp'],
    'WEBP': ['.webp', 'image/webp'],
    'TIFF': ['.tiff', '.tif', 'image/tiff']
  };

  // 获取允许的文件扩展名（用于逻辑验证）
  const allowedExtensions = useMemo(() => {
    const types = FILE_TYPE_MAP[sourceFormat] || [];
    return types.filter((t) => t.startsWith('.'));
  }, [sourceFormat]);

  // 获取 accept 属性值（用于系统对话框过滤）
  const acceptAttribute = useMemo(() => {
    return (FILE_TYPE_MAP[sourceFormat] || []).join(',');
  }, [sourceFormat]);

  // 验证文件类型
  const isValidFileType = (file) => {
    if (allowedExtensions.length === 0) return true;
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some((ext) => fileName.endsWith(ext.toLowerCase()));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    e.target.value = '';
  };

  const handleFolderSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles, true);
    e.target.value = '';
  };

  const processFiles = (newFiles, isFolder = false) => {
    const validFiles = newFiles.filter(isValidFileType);
    const invalidFiles = newFiles.filter((file) => !isValidFileType(file));

    if (invalidFiles.length > 0) {
      if (isFolder) {
        toast.error(t('文件夹中有 ${count} 个文件格式不符合要求，已自动过滤', { count: invalidFiles.length }));
      } else {
        const invalidNames = invalidFiles.map((f) => f.name).join(', ');
        toast.error(t('只能上传 ${format} 格式的文件\n无效文件: ${names}', { format: sourceFormat, names: invalidNames }));
      }
    }

    if (validFiles.length > 0) {
      setFiles((prev) => {
        // Filter duplicates
        const uniqueFiles = validFiles.filter((file) =>
        !prev.some((f) => {
          const prevFile = f.file || f;
          return prevFile.path && prevFile.path === file.path ||
          prevFile.name === file.name && prevFile.size === file.size;
        })
        );

        // Create wrapper objects with ID
        const newFileObjects = uniqueFiles.map((file) => ({
          id: Date.now() + Math.random().toString(36).substr(2, 9),
          file: file
        }));

        return [...prev, ...newFileObjects];
      });

      if (!isFolder || validFiles.length > 0) {
        toast.success(t('成功添加 ${count} 个文件', { count: validFiles.length }));
      }
    } else if (isFolder && newFiles.length > 0) {
      toast.error(t('文件夹中没有符合 ${format} 格式的文件', { format: sourceFormat }));
    }
  };

  const handleRemoveFile = (id) => {
    setFiles((prev) => prev.filter((f) => (f.id || f) !== id));
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIndices.size === files.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(files.map((_, i) => i)));
    }
  };

  const handleClearAll = () => {
    setFiles([]);
    setResults({});
    setSelectedIndices(new Set());
  };

  const validatePageRange = (range) => {
    if (!range || !range.trim()) return false;
    const cleanRange = range.replace(/\s/g, '');
    if (!/^[\d,-]+$/.test(cleanRange)) return false;
    const parts = cleanRange.split(',');
    for (const part of parts) {
      if (!part) continue;
      if (part.includes('-')) {
        const ranges = part.split('-');
        if (ranges.length !== 2) return false;
        const start = parseInt(ranges[0]);
        const end = parseInt(ranges[1]);
        if (isNaN(start) || isNaN(end)) return false;
        if (start > end) return false;
      } else {
        if (isNaN(parseInt(part))) return false;
      }
    }
    return true;
  };

  const validateHexColor = (color) => {
    if (!color) return true;
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    if (!window.electron) {
      toast.error(t('文档转换功能需要在桌面客户端中运行'));
      return;
    }

    setIsConverting(true);
    // Don't clear results here to allow incremental conversion or retry of failed ones?
    // Or strictly follow "Convert All" semantics? 
    // Let's clear for "Convert All" behavior but maybe we should support converting only pending?
    // For now, clear to match original behavior logic often used.
    setResults({});

    // Map source/target for logic
    const source = sourceFormat;
    const target = targetFormat;
    const watermarkOptions = config.watermark;

    // Validate Page Range for DOCX->PDF
    if (source === 'DOCX' && target === 'PDF' && convertOptions.docxPdfPageRange) {
      if (!validatePageRange(convertOptions.docxPdfPageRange)) {
        toast.error(t('页码范围格式无效 (例如: 1-5, 8, 11-13)'));
        setIsConverting(false);
        return;
      }
    }

    // Validate Page Range for PDF source
    if (source === 'PDF' && convertOptions.pdfPageSelection !== '所有页面' && convertOptions.pdfCustomRange) {
      if (!validatePageRange(convertOptions.pdfCustomRange)) {
        toast.error(t('页码范围格式无效 (例如: 1-5, 8, 11-13)'));
        setIsConverting(false);
        return;
      }
    }

    // Validate Hex Colors
    if (!validateHexColor(config.backgroundColor)) {
      toast.error(t('背景颜色格式无效'));
      setIsConverting(false);
      return;
    }
    if (watermarkOptions.text && !validateHexColor(watermarkOptions.color)) {
      toast.error(t('水印颜色格式无效'));
      setIsConverting(false);
      return;
    }

    for (const fileObj of files) {
      const fileId = fileObj.id;
      // Handle both wrapper and raw file (though we should have wrappers now)
      const file = fileObj.file || fileObj;

      try {
        // Construct options object based on source/target (mapped from original ToolDetailContent.jsx)
        let options = {};
        let result;

        if (source === 'JSON' && (target === 'YAML' || target === 'YML' || target === 'XML')) {
          options.indent = convertOptions.indent;
          const effectiveTargetFormat = target.toLowerCase();
          result = await convertJSON(file, effectiveTargetFormat, options);
        } else if (source === 'XML' && (target === 'JSON' || target === 'YAML' || target === 'YML')) {
          options.indent = convertOptions.indent;
          const effectiveTargetFormat = target.toLowerCase();
          result = await convertXML(file, effectiveTargetFormat, options);
        } else {
          // General document conversion logic
          let effectiveTargetFormat = target.toLowerCase();
          if (target === 'MARKDOWN') effectiveTargetFormat = 'md';
          if (source === 'HTML' && target === 'TEXT') effectiveTargetFormat = 'txt';
          if (source === 'XML' && target === 'TEXT') effectiveTargetFormat = 'txt';
          if (target === 'WORD') effectiveTargetFormat = 'docx';
          if (target === 'SPEECH') effectiveTargetFormat = 'mp3';
          if (target === 'VIDEO') effectiveTargetFormat = 'mp4';

          if (source === 'DOCX') {
            if (['PNG', 'JPG', 'JPEG'].includes(target)) {
              options.quality = config.quality;
              options.backgroundColor = config.backgroundColor;
              options.watermark_text = watermarkOptions.text;
              options.watermark_opacity = watermarkOptions.opacity;
              options.watermark_size = watermarkOptions.size;
              options.watermark_color = watermarkOptions.color;
              options.watermark_angle = watermarkOptions.angle;
              options.watermark_position = watermarkOptions.position;
            }
            if (target === 'PDF') {
              options.page_size = convertOptions.pageSize;
              options.orientation = convertOptions.orientation;
              options.page_range = convertOptions.docxPdfPageRange;
              options.watermark_text = watermarkOptions.text;
              options.watermark_opacity = watermarkOptions.opacity;
              options.watermark_size = watermarkOptions.size;
              options.watermark_color = watermarkOptions.color;
              options.watermark_angle = watermarkOptions.angle;
              options.watermark_position = watermarkOptions.position;
            }
          }

          if (['XLSX', 'XLS', 'EXCEL', 'PPT', 'PPTX'].includes(source)) {
            if (['PNG', 'JPG', 'JPEG', 'PDF'].includes(target)) {
              options.quality = config.quality;
              options.backgroundColor = config.backgroundColor;
              options.watermark_text = watermarkOptions.text;
              options.watermark_opacity = watermarkOptions.opacity;
              options.watermark_size = watermarkOptions.size;
              options.watermark_color = watermarkOptions.color;
              options.watermark_angle = watermarkOptions.angle;
              options.watermark_position = watermarkOptions.position;
            }
            if (target === 'VIDEO') {
              options.fps = convertOptions.fps || 0.5;
              options.resolution = convertOptions.resolution || 1080;
            }
          }

          if (source === 'HTML') {
            options.css_handling = htmlOptions.cssHandling;
            options.remove_scripts = htmlOptions.removeScripts;
            options.compress_html = htmlOptions.compressHtml;
            options.page_size = htmlOptions.pageSize;
            options.orientation = htmlOptions.orientation;
            options.code_mode = htmlOptions.codeMode;
            if (['PNG', 'JPG', 'JPEG', 'GIF', 'SVG'].includes(target)) {
              options.quality = config.quality;
              options.backgroundColor = config.backgroundColor;
            }
          }

          if (source === 'PDF') {
            options.quality = config.quality;
            options.pdf_page_selection = convertOptions.pdfPageSelection;
            if (convertOptions.pdfPageSelection !== '所有页面') {
              options.pdf_page_range = convertOptions.pdfCustomRange;
            }
            if (['PNG', 'JPG', 'JPEG', 'BMP', 'WEBP', 'SVG'].includes(target)) {
              options.backgroundColor = config.backgroundColor;
              options.watermark_text = watermarkOptions.text;
              options.watermark_opacity = watermarkOptions.opacity;
              options.watermark_size = watermarkOptions.size;
              options.watermark_color = watermarkOptions.color;
              options.watermark_angle = watermarkOptions.angle;
              options.watermark_position = watermarkOptions.position;
            }
            if (target === 'GIF') {
              options.animation_delay = convertOptions.animationDelay;
              options.loop_animation = convertOptions.loopAnimation;
              options.backgroundColor = config.backgroundColor;
              options.watermark_text = watermarkOptions.text;
              options.watermark_opacity = watermarkOptions.opacity;
              options.watermark_size = watermarkOptions.size;
              options.watermark_color = watermarkOptions.color;
              options.watermark_angle = watermarkOptions.angle;
              options.watermark_position = watermarkOptions.position;
            }
          }

          if (source === 'TXT') {
            options.page_size = convertOptions.pageSize;
            options.orientation = convertOptions.orientation;
            if (target === 'PDF') {
              options.watermark_text = watermarkOptions.text;
              options.watermark_opacity = watermarkOptions.opacity;
              options.watermark_size = watermarkOptions.size;
              options.watermark_color = watermarkOptions.color;
              options.watermark_angle = watermarkOptions.angle;
              options.watermark_position = watermarkOptions.position;
            }
            if (['PNG', 'JPG', 'JPEG'].includes(target)) {
              options.quality = config.quality;
              options.backgroundColor = config.backgroundColor;
              options.watermark_text = watermarkOptions.text;
              options.watermark_opacity = watermarkOptions.opacity;
              options.watermark_size = watermarkOptions.size;
              options.watermark_color = watermarkOptions.color;
              options.watermark_angle = watermarkOptions.angle;
              options.watermark_position = watermarkOptions.position;
            }
            if (target === 'SPEECH' || target === 'MP3' || target === 'WAV') {
              options.rate = Math.round(convertOptions.speechSpeed * 150);
              options.volume = 1.0;
              options.pitch = convertOptions.speechPitch;
            }
          }

          if (source === 'JSON' || source === 'XML') {
            options.indent = convertOptions.indent;
            if (['PNG', 'JPG', 'JPEG', 'SVG'].includes(target)) {
              options.quality = config.quality;
              options.backgroundColor = config.backgroundColor;
              options.watermark_text = watermarkOptions.text;
              options.watermark_opacity = watermarkOptions.opacity;
              options.watermark_size = watermarkOptions.size;
              options.watermark_color = watermarkOptions.color;
              options.watermark_angle = watermarkOptions.angle;
              options.watermark_position = watermarkOptions.position;
            }
            if (target === 'PDF') {
              options.quality = config.quality;
              options.backgroundColor = config.backgroundColor;
              options.watermark_text = watermarkOptions.text;
              options.watermark_opacity = watermarkOptions.opacity;
              options.watermark_size = watermarkOptions.size;
              options.watermark_color = watermarkOptions.color;
              options.watermark_angle = watermarkOptions.angle;
              options.watermark_position = watermarkOptions.position;
            }
          }

          if (target === 'CSV') {
            const delimiterMap = {
              '逗号 (,)': ',',
              '分号 (;)': ';',
              '制表符 (\t)': '\t',
              '竖线 (|)': '|'
            };
            options.csv_delimiter = delimiterMap[convertOptions.csvDelimiter] || ',';
          }

          // Use the general conversion API with the constructed options
          result = await convertGeneral(file, effectiveTargetFormat, options);
        }

        if (result.success) {
          setResults((prev) => ({
            ...prev,
            [fileId]: {
              success: true,
              url: result.output || result.outputPath || result.download_url || result.output_path,
              output_path: result.output_path,
              filename: result.filename || `converted_${file.name.split('.')[0]}.${targetFormat.toLowerCase()}`
            }
          }));
        } else {
          const errorMsg = result.error || result.message || result.detail || 'Unknown error';
          console.error('Doc conversion failed', result);
          toast.error(errorMsg);
          setResults((prev) => ({
            ...prev,
            [fileId]: { success: false, error: errorMsg }
          }));
        }
      } catch (error) {
        console.error('Doc conversion exception', error);
        toast.error(error.message || 'Conversion error');
        setResults((prev) => ({
          ...prev,
          [fileId]: { success: false, error: error.message || 'Conversion error' }
        }));
      }
    }

    setIsConverting(false);
  };

  const handlePreview = (fileInput) => {
    const file = fileInput.file || fileInput;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewContent(e.target.result);
      setShowPreviewModal(true);
    };
    reader.readAsText(file);
  };

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null);

  const handleSingleDownloadTrigger = (id) => {
    setDownloadingFileId(id);
    setShowDownloadModal(true);
  };

  const handleDownloadAllTrigger = (e) => {
    if (e) e.stopPropagation();
    setDownloadingFileId(null);
    setShowDownloadModal(true);
  };

  const executeDownload = async (useZip = false) => {
    setShowDownloadModal(false);

    const downloadableFiles = downloadingFileId !== null ?
    [results[downloadingFileId]] :
    Object.values(results).filter((res) => res && res.success);

    if (downloadableFiles.length === 0) {
      toast.error(t('没有可下载的文件'));
      return;
    }

    if (useZip) {
      await handleZipDownload(downloadableFiles);
    } else {
      await handleBatchDownload(downloadableFiles);
    }
  };

  const handleBatchDownload = async (downloadableFiles) => {
    if (window.electron) {
      try {
        const dirPath = await window.electron.openDirectoryDialog();
        if (!dirPath) return;

        const toastId = toast.loading(t('正在保存文件...'));
        let successCount = 0;
        let failCount = 0;

        for (const res of downloadableFiles) {
          try {
            const filename = res.filename || `file_${Date.now()}`;
            const separator = dirPath.includes('\\') ? '\\' : '/';
            const destPath = `${dirPath}${separator}${filename}`;

            let result;
            if (res.output_path) {
              result = await window.electron.copyFile(res.output_path, destPath);
            } else if (res.url) {
              const response = await fetch(res.url);
              const blob = await response.blob();
              const buffer = await blob.arrayBuffer();
              result = await window.electron.saveFile(destPath, buffer);
            }

            if (result?.success) successCount++;else
            failCount++;
          } catch (err) {
            failCount++;
          }
        }
        toast.success(t('完成: ${success} 个成功, ${fail} 个失败', { success: successCount, fail: failCount }), { id: toastId });
      } catch (error) {
        toast.error(t('保存失败: ${message}', { message: error.message }));
      }
    } else {
      // Web fallback
      downloadableFiles.forEach((res, i) => {
        setTimeout(() => {
          if (res.url) saveAs(res.url, res.filename);
        }, i * 500);
      });
    }
  };

  const handleZipDownload = async (downloadableFiles) => {
    try {
      const zip = new JSZip();
      const toastId = toast.loading(t('正在打包文件...'));

      const promises = downloadableFiles.map(async (res) => {
        try {
          if (window.electron && res.output_path) {
            const result = await window.electron.readFile(res.output_path);
            if (result.success && result.data) {
              zip.file(res.filename, result.data);
            } else {
              console.warn('Read file failed', result.error);
            }
          } else {
            const url = res.url || res.output_path;
            if (!url) return;
            const response = await fetch(url);
            const blob = await response.blob();
            zip.file(res.filename, blob);
          }
        } catch (e) {
          console.warn('Zip fetch failed', e);
        }
      });

      await Promise.all(promises);
      const content = await zip.generateAsync({ type: 'blob' });
      const zipName = `${toolName.replace(/\s+/g, '_')}_${Date.now()}.zip`;

      if (window.electron) {
        const savePath = await window.electron.saveFileDialog({
          defaultPath: zipName,
          filters: [{ name: 'ZIP', extensions: ['zip'] }]
        });
        if (savePath) {
          const buffer = await content.arrayBuffer();
          await window.electron.saveFile(savePath, buffer);
          toast.success(t('打包保存成功'), { id: toastId });
        } else {
          toast.dismiss(toastId);
        }
      } else {
        saveAs(content, zipName);
        toast.success(t('打包下载成功'), { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error(t('打包失败'));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Watermark change helper
  const updateWatermark = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      watermark: {
        ...prev.watermark,
        [key]: value
      }
    }));
  };

  // Position grid render helper
  const renderPositionGrid = () => {
    const positions = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right'];


    const icons = {
      'top-left': '↖', 'top-center': '↑', 'top-right': '↗',
      'center-left': '←', 'center': '●', 'center-right': '→',
      'bottom-left': '↙', 'bottom-center': '↓', 'bottom-right': '↘'
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '8px' }}>
        {positions.map((pos) =>
        <button
          key={pos}
          onClick={() => updateWatermark('position', pos)}
          style={{
            padding: '8px',
            border: `1px solid ${config.watermark.position === pos ? 'var(--primary-color)' : 'var(--input-border)'}`,
            borderRadius: '4px',
            background: config.watermark.position === pos ? 'var(--primary-light)' : 'var(--card-bg)',
            color: config.watermark.position === pos ? 'var(--primary-color)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px'
          }}
          title={pos}>
          
            {icons[pos]}
          </button>
        )}
      </div>);

  };

  // Helper to determine if target is image
  const isImageTarget = ['PNG', 'JPG', 'JPEG', 'BMP', 'WEBP', 'GIF', 'SVG'].includes(targetFormat);
  const isPdfTarget = targetFormat === 'PDF';

  return (
    <div className="doc-tool-container" style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'var(--font-family, sans-serif)',
      color: 'var(--text-primary)',
      backgroundColor: 'var(--bg-color)',
      minHeight: '100%'
    }}>
      <div className="breadcrumbs">
        <span className="breadcrumb-item" onClick={() => handleNavigate('/')}>{t("首页")}</span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item" onClick={handleConverterClick}>{sourceFormat}{t("转换器")}</span>
        <span className="breadcrumb-separator">/</span>
        <span
          className={`breadcrumb-item active breadcrumb-item-dropdown ${isToolDropdownOpen ? 'open' : ''}`}
          onClick={handleToolBreadcrumbToggle}>
          
          <span>{formatToolDisplayName(toolName)}</span>
          {siblingTools.length > 0 &&
          <svg
            className="breadcrumb-caret"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            
              <polyline points="6 9 12 15 18 9" />
            </svg>
          }
          {isToolDropdownOpen && siblingTools.length > 0 &&
          <div className="breadcrumb-dropdown-menu">
              {siblingTools.map((name) =>
            <button
              key={name}
              className={`breadcrumb-dropdown-item ${name === toolName ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleBreadcrumbToolSelect(name);
              }}>
              
                  {formatToolDisplayName(name)}
                </button>
            )}
            </div>
          }
        </span>
      </div>
      
      <div style={{ marginTop: '20px', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          {sourceFormat}{t("转")}{targetFormat}{t("转换器")}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t("在线将")}
          {sourceFormat}{t("文档转换为")}{targetFormat}{t("格式。免费工具维护文本格式。转换后，您可以下载并共享文档。")}
        </p>
      </div>

      <div className="tool-main-content" style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
        {/* Left Side: Upload Area */}
        <div style={{ flex: '1', minWidth: '300px', height: '420px' }}>
           <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`doc-uploader ${isDragging ? 'is-dragging' : ''}`}
            style={{
              height: '100%',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => fileInputRef.current?.click()}>
            
             <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
               <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                transition: 'all 0.3s ease'
              }}>
                 <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.8">
                   <path d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.3-1.7-4.1-3.9-4.5-.5-3.1-3.1-5.5-6.1-5.5-2.5 0-4.6 1.6-5.4 3.9C4.3 8.1 2 9.8 2 12.5 2 15 4 17 6.5 17h1" strokeLinecap="round" strokeLinejoin="round" />
                   <polyline points="12 12 12 16" strokeLinecap="round" strokeLinejoin="round" />
                   <polyline points="9 13 12 10 15 13" strokeLinecap="round" strokeLinejoin="round" />
                 </svg>
               </div>
               <h3 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>{t("在这里拖放你的")}{sourceFormat}{t("文件或文件夹")}</h3>
               <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '14px' }}>{t("支持批量上传")}
                {allowedExtensions.length > 0 ? `(${allowedExtensions.join(', ')})` : ''}
               </p>
               
               <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                 <button
                  style={{
                    padding: '12px 28px',
                    background: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                    transition: 'all 0.2s'
                  }}>
                  
                   <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>{t("选择文件")}
                </button>
               </div>
               
               <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept={acceptAttribute}
                style={{ display: 'none' }} />
              
               <input
                type="file"
                ref={folderInputRef}
                onChange={handleFolderSelect}
                webkitdirectory="true"
                style={{ display: 'none' }} />
              
             </div>
           </div>
        </div>

        {/* Right Side: Settings */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            height: '420px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
             <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', flexShrink: 0 }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2.5" strokeLinecap="round">
                 <path d="M12 20V10" />
                 <path d="M18 20V4" />
                 <path d="M6 20v-4" />
               </svg>{t("转换选项")}

            </h3>
             
             {/* Wrapper for scrollable content - strictly contained within parent */}
             <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0'
            }}>
               {/* Dynamic Options based on Source/Target */}
            {!isPptOrExcelSpecificTool && (sourceFormat === 'HTML' || targetFormat === 'PDF' || sourceFormat === 'PDF' || sourceFormat === 'DOCX' || targetFormat === 'YAML' || targetFormat === 'YML' || targetFormat === 'JSON' || targetFormat === 'CSV' || targetFormat === 'GIF' || ['JSON', 'XML', 'XLSX', 'XLS', 'PPT', 'PPTX'].includes(sourceFormat) && (isImageTarget || isPdfTarget) || sourceFormat === 'PPT' && targetFormat === 'VIDEO') &&
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  {/* PPT to Video Specific Options */}
                  {sourceFormat === 'PPT' && targetFormat === 'VIDEO' &&
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '16px' }}>
                       <div>
                          <label style={{ fontWeight: '500', display: 'block', marginBottom: '8px', fontSize: '14px' }}>{t("播放速度 (FPS)")}</label>
                          <select
                      value={convertOptions.fps || 0.5}
                      onChange={(e) => setConvertOptions({ ...convertOptions, fps: parseFloat(e.target.value) })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                      
                              <option value="0.2">{t("慢速 (每页 5 秒)")}</option>
                              <option value="0.5">{t("常规 (每页 2 秒)")}</option>
                              <option value="1.0">{t("快速 (每页 1 秒)")}</option>
                              <option value="2.0">{t("极速 (每页 0.5 秒)")}</option>
                          </select>
                       </div>
                       <div>
                          <label style={{ fontWeight: '500', display: 'block', marginBottom: '8px', fontSize: '14px' }}>{t("视频分辨率")}</label>
                          <select
                      value={convertOptions.resolution || 1080}
                      onChange={(e) => setConvertOptions({ ...convertOptions, resolution: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                      
                              <option value="720">720P (HD)</option>
                              <option value="1080">1080P (Full HD)</option>
                              <option value="1440">2K</option>
                              <option value="2160">4K</option>
                          </select>
                       </div>
                    </div>
                }

                  {/* XML/Excel/PPT Source Specific Options (JPG and PDF targets) */}
                  {['XML', 'XLSX', 'XLS', 'PPT', 'PPTX'].includes(sourceFormat) && (isImageTarget || isPdfTarget) &&
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '16px' }}>
                        {/* Case: XML -> PDF (Background Color then Page Size) */}
                        {isPdfTarget &&
                  <>
                                <div>
                                    <label style={{ fontWeight: '500', display: 'block', marginBottom: '12px', fontSize: '14px' }}>{t("背景颜色")}</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                          type="color"
                          value={config.backgroundColor}
                          onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                          style={{ width: '40px', height: '40px', padding: 0, border: '1px solid var(--input-border)', borderRadius: '4px', cursor: 'pointer' }} />
                        
                                        <input
                          type="text"
                          value={config.backgroundColor}
                          onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                          style={{
                            flex: 1,
                            padding: '0 12px',
                            border: '1px solid var(--input-border)',
                            borderRadius: '4px',
                            background: 'var(--input-bg)',
                            height: '40px',
                            color: 'var(--text-primary)'
                          }} />
                        
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '500', display: 'block', marginBottom: '12px', fontSize: '14px' }}>{t("页面大小")}</label>
                                    <select
                        value={convertOptions.pageSize}
                        onChange={(e) => setConvertOptions({ ...convertOptions, pageSize: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                        
                                        <option value="A4">A4</option>
                                        <option value="A3">A3</option>
                                        <option value="Letter">Letter</option>
                                        <option value="Legal">Legal</option>
                                    </select>
                                </div>
                            </>
                  }

                        {/* Case: XML -> Image (Quality then Background Color) */}
                        {isImageTarget && !isPdfTarget && targetFormat === 'JPG' &&
                  <>
                                <div>
                                    <label style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-secondary)', display: 'block', marginBottom: '24px' }}>{t("质量 (1-100)")}</label>
                                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={config.quality}
                        onChange={(e) => setConfig({ ...config, quality: parseInt(e.target.value) })}
                        style={{ width: '100%', accentColor: 'var(--primary-color)', marginBottom: '12px' }} />
                      
                                    <div style={{ textAlign: 'center', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>{config.quality}%</div>
                                </div>
                                <div>
                                    <label style={{ fontWeight: '500', display: 'block', marginBottom: '12px', fontSize: '14px' }}>{t("背景颜色")}</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                          type="color"
                          value={config.backgroundColor}
                          onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                          style={{ width: '40px', height: '40px', padding: 0, border: '1px solid var(--input-border)', borderRadius: '4px', cursor: 'pointer' }} />
                        
                                        <input
                          type="text"
                          value={config.backgroundColor}
                          onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                          style={{
                            flex: 1,
                            padding: '0 12px',
                            border: '1px solid var(--input-border)',
                            borderRadius: '4px',
                            background: 'var(--input-bg)',
                            height: '40px',
                            color: 'var(--text-primary)'
                          }} />
                        
                                    </div>
                                </div>
                            </>
                  }
                    </div>
                }

                  {/* HTML Source Options */}
                  {sourceFormat === 'HTML' &&
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                          <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>{t("HTML 选项")}</label>
                          
                          {/* Preview Section */}
                          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: sourceFormat === 'HTML' ? 'visible' : 'hidden', position: 'relative' }}>
                            <div
                      onClick={() => toggleSection('preview')}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: '500',
                        borderRadius: sourceFormat === 'HTML' ? '8px' : '0'
                      }}>
                      
                              <span>{t("预览选项")}</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedSections.preview ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                            {expandedSections.preview &&
                    <div style={{
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: sourceFormat === 'HTML' ? 'absolute' : 'static',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      background: 'var(--card-bg)',
                      border: sourceFormat === 'HTML' ? '1px solid var(--border-color)' : 'none',
                      borderRadius: '8px',
                      boxShadow: sourceFormat === 'HTML' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                    }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" checked={htmlOptions.codeMode} onChange={(e) => setHtmlOptions({ ...htmlOptions, codeMode: e.target.checked })} />
                                    <span style={{ fontSize: '13px' }}>{t("转换为源代码 (勾选则输出带高亮的代码 PDF)")}</span>
                                </div>
                              </div>
                    }
                          </div>

                          {/* CSS Section */}
                          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: sourceFormat === 'HTML' ? 'visible' : 'hidden', position: 'relative' }}>
                            <div
                      onClick={() => toggleSection('css')}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: '500',
                        borderRadius: sourceFormat === 'HTML' ? '8px' : '0'
                      }}>
                      
                              <span>{t("CSS 选项")}</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedSections.css ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                            {expandedSections.css &&
                    <div style={{
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      position: sourceFormat === 'HTML' ? 'absolute' : 'static',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      background: 'var(--card-bg)',
                      border: sourceFormat === 'HTML' ? '1px solid var(--border-color)' : 'none',
                      borderRadius: '8px',
                      boxShadow: sourceFormat === 'HTML' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                    }}>
                                <div>
                                  <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>{t("CSS 处理")}</label>
                                  <select
                          value={htmlOptions.cssHandling}
                          onChange={(e) => setHtmlOptions({ ...htmlOptions, cssHandling: e.target.value })}
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '13px' }}>
                          
                                      <option value={t("保留所有 CSS")}>{t("保留所有 CSS")}</option>
                                      <option value={t("内联 CSS")}>{t("内联 CSS")}</option>
                                      <option value={t("移除 CSS")}>{t("移除 CSS")}</option>
                                  </select>
                                </div>
                              </div>
                    }
                          </div>

                          {/* Cleanup Section */}
                          <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', overflow: sourceFormat === 'HTML' ? 'visible' : 'hidden', position: 'relative' }}>
                            <div
                      onClick={() => toggleSection('cleanup')}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: '500',
                        borderRadius: sourceFormat === 'HTML' ? '8px' : '0'
                      }}>
                      
                              <span>{t("清理选项")}</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: expandedSections.cleanup ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </div>
                            {expandedSections.cleanup &&
                    <div style={{
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      position: sourceFormat === 'HTML' ? 'absolute' : 'static',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      background: 'var(--card-bg)',
                      border: sourceFormat === 'HTML' ? '1px solid var(--border-color)' : 'none',
                      borderRadius: '8px',
                      boxShadow: sourceFormat === 'HTML' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                    }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                          type="checkbox"
                          id="removeScripts"
                          checked={htmlOptions.removeScripts}
                          onChange={(e) => setHtmlOptions({ ...htmlOptions, removeScripts: e.target.checked })}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        
                                    <label htmlFor="removeScripts" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>{t("移除脚本")}</label>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                          type="checkbox"
                          id="compressHtml"
                          checked={htmlOptions.compressHtml}
                          onChange={(e) => setHtmlOptions({ ...htmlOptions, compressHtml: e.target.checked })}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        
                                    <label htmlFor="compressHtml" style={{ fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>{t("压缩 HTML")}</label>
                                </div>
                              </div>
                    }
                          </div>
                      </div>
                }
                  
                  {/* PDF Target Options (applies when target is PDF) */}
                  {targetFormat === 'PDF' && sourceFormat !== 'JSON' && sourceFormat !== 'XML' && sourceFormat !== 'DOCX' &&
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                          <label style={{ fontWeight: '500' }}>{t("PDF 设置")}</label>
                          <div>
                              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t("页面大小")}</label>
                              <select
                      value={convertOptions.pageSize}
                      onChange={(e) => setConvertOptions({ ...convertOptions, pageSize: e.target.value })}
                      style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                      
                                  <option value="A4">A4</option>
                                  <option value="A3">A3</option>
                                  <option value="Letter">Letter</option>
                                  <option value="Legal">Legal</option>
                              </select>
                          </div>
                           <div>
                              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t("方向")}</label>
                              <select
                      value={convertOptions.orientation}
                      onChange={(e) => setConvertOptions({ ...convertOptions, orientation: e.target.value })}
                      style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                      
                                  <option value={t("纵向")}>{t("纵向 (Portrait)")}</option>
                                  <option value={t("横向")}>{t("横向 (Landscape)")}</option>
                              </select>
                          </div>
                          {sourceFormat === 'DOCX' &&
                  <div>
                                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t("页码范围 (可选)")}</label>
                                  <input
                      type="text"
                      placeholder={t("例如: 1-5, 8, 11-13")}
                      value={convertOptions.docxPdfPageRange}
                      onChange={(e) => setConvertOptions({ ...convertOptions, docxPdfPageRange: e.target.value })}
                      style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }} />
                    
                              </div>
                  }
                      </div>
                }

                  {/* PDF Source Options */}
                  {sourceFormat === 'PDF' &&
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                          <label style={{ fontWeight: '500' }}>{t("页面选择")}</label>
                          <select
                    value={convertOptions.pdfPageSelection}
                    onChange={(e) => setConvertOptions({ ...convertOptions, pdfPageSelection: e.target.value })}
                    style={{ width: '100%', padding: '6px', marginTop: '4px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}>
                    
                                  <option value="所有页面">{t("所有页面")}</option>
                                  <option value="页面范围">{t("页面范围 (如 1-5)")}</option>
                                  <option value="特定页面">{t("特定页面 (如 1,3,5)")}</option>
                          </select>
                          {convertOptions.pdfPageSelection !== '所有页面' &&
                  <input
                    type="text"
                    placeholder={convertOptions.pdfPageSelection === '页面范围' ? t("例如: 1-5, 8-10") : t("例如: 1, 3, 5")}
                    value={convertOptions.pdfCustomRange}
                    onChange={(e) => setConvertOptions({ ...convertOptions, pdfCustomRange: e.target.value })}
                    style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }} />

                  }
                       </div>
                }

                  {/* Indent Options (for JSON/XML/YAML) */}
                  {['YAML', 'YML'].includes(targetFormat) && (sourceFormat === 'XML' || sourceFormat !== 'HTML') &&
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                          <label style={{ fontWeight: '500' }}>{t("YAML 缩进")}</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input
                      type="range"
                      min="2" max="8" step="2"
                      value={convertOptions.indent}
                      onChange={(e) => setConvertOptions({ ...convertOptions, indent: parseInt(e.target.value) })}
                      style={{ flex: 1, accentColor: 'var(--primary-color)' }} />
                    
                            <span style={{ color: 'var(--text-secondary)', width: '20px', textAlign: 'center', fontSize: '14px' }}>{convertOptions.indent}</span>
                          </div>
                       </div>
                }



                  {/* GIF Options */}
                  {targetFormat === 'GIF' &&
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                          <label style={{ fontWeight: '500' }}>{t("动画设置")}</label>
                          <div>
                            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t("帧延迟 (ms)")}</label>
                            <input
                      type="number"
                      min="10" max="1000" step="10"
                      value={convertOptions.animationDelay}
                      onChange={(e) => setConvertOptions({ ...convertOptions, animationDelay: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }} />
                    
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                              <input type="checkbox" checked={convertOptions.loopAnimation} onChange={(e) => setConvertOptions({ ...convertOptions, loopAnimation: e.target.checked })} />
                              <span style={{ fontSize: '13px' }}>{t("循环播放")}</span>
                          </div>
                       </div>
                }

                  {/* CSV Options */}
                  {targetFormat === 'CSV' &&
                <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontWeight: '500', display: 'block', marginBottom: '8px' }}>{t("CSV 分隔符")}</label>
                          <select
                    value={convertOptions.csvDelimiter}
                    onChange={(e) => setConvertOptions({ ...convertOptions, csvDelimiter: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      colorScheme: 'light dark'
                    }}>
                    
                            <option style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={t("逗号 (,)")}>{t("逗号 (,)")}</option>
                            <option style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={t("分号 (;)")}>{t("分号 (;)")}</option>
                            <option style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={t("制表符 (\\t)")}>{t("制表符 (\\t)")}</option>
                            <option style={{ backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' }} value={t("竖线 (|)")}>{t("竖线 (|)")}</option>
                          </select>
                       </div>
                }
               </div>
              }

        {/* TXT -> SPEECH Options */}
        {sourceFormat === 'TXT' && targetFormat === 'SPEECH' &&
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <div style={{ marginTop: '12px' }}>
              <label style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '12px', display: 'block', fontSize: '14px' }}>{t("语音速度")}</label>
              <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={convertOptions.speechSpeed}
                    onChange={(e) => setConvertOptions({ ...convertOptions, speechSpeed: parseFloat(e.target.value) })}
                    style={{ width: '100%', marginBottom: '8px' }} />
                  
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {convertOptions.speechSpeed}x
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '12px', display: 'block', fontSize: '14px' }}>{t("语音音调")}</label>
              <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={convertOptions.speechPitch}
                    onChange={(e) => setConvertOptions({ ...convertOptions, speechPitch: parseFloat(e.target.value) })}
                    style={{ width: '100%', marginBottom: '8px' }} />
                  
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                {convertOptions.speechPitch}
              </div>
            </div>
          </div>
              }

        {/* Quality Slider & Background Color - For Image Targets AND specific PDF conversions */}
             {!isPptOrExcelSpecificTool && (isImageTarget || targetFormat === 'PDF' && ['XML', 'JSON'].includes(sourceFormat)) && sourceFormat !== 'HTML' && sourceFormat !== 'XML' && (sourceFormat !== 'JSON' || targetFormat === 'JPG') &&
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                 <label style={{ fontWeight: '600', display: 'block', marginBottom: '16px', color: 'var(--text-primary)' }}>{t("输出选项")}</label>
                 
                 {/* Quality Slider */}
                 <div style={{ marginBottom: sourceFormat === 'PDF' ? '0' : '24px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                     <label style={{ fontWeight: '500', fontSize: '14px' }}>{t("质量 (1-100)")}</label>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <input
                      type="range"
                      min="1"
                      max="100"
                      value={config.quality}
                      onChange={(e) => setConfig({ ...config, quality: parseInt(e.target.value) })}
                      style={{ flex: 1, accentColor: 'var(--primary-color)' }} />
                    
                     <span style={{ color: 'var(--text-secondary)', width: '30px', textAlign: 'right', fontSize: '14px' }}>{config.quality}%</span>
                   </div>
                 </div>

                 {/* Background Color */}
                 {sourceFormat !== 'PDF' &&
                <div>
                     <label style={{ fontWeight: '500', display: 'block', marginBottom: '8px', fontSize: '14px' }}>{t("背景颜色")}</label>
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      style={{ width: '40px', height: '40px', padding: 0, border: '1px solid var(--input-border)', borderRadius: '4px', cursor: 'pointer' }} />
                    
                       <input
                      type="text"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '0 12px',
                        border: '1px solid var(--input-border)',
                        borderRadius: '4px',
                        background: 'var(--input-bg)',
                        height: '40px',
                        color: 'var(--text-primary)'
                      }} />
                    
                     </div>
                   </div>
                }
               </div>
              }

             {/* Watermark Section (Expandable) */}
             {!isPptOrExcelSpecificTool && (isImageTarget || isPdfTarget) && sourceFormat !== 'HTML' && sourceFormat !== 'PDF' && sourceFormat !== 'TXT' && sourceFormat !== 'XML' && sourceFormat !== 'DOCX' && (sourceFormat !== 'JSON' || targetFormat === 'JPG') &&
              <div>
                 <div
                  onClick={() => setIsWatermarkOpen(!isWatermarkOpen)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    marginBottom: isWatermarkOpen ? '16px' : '0'
                  }}>
                  
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <label style={{ fontWeight: '500', cursor: 'pointer' }}>{t("水印信息")}</label>
                     <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const defaultConfig = {
                          text: '',
                          size: 40,
                          opacity: 30,
                          angle: 45,
                          color: '#cccccc',
                          position: 'center'
                        };
                        setConfig((prev) => ({ ...prev, watermark: defaultConfig }));
                        toast.success(t('水印设置已恢复默认'));
                      }}
                      title={t("恢复默认设置")}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}>
                      
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                         <path d="M3 3v5h5" />
                       </svg>
                     </button>
                   </div>
                   <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                      transform: isWatermarkOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}>
                    
                     <path d="M6 9l6 6 6-6" />
                   </svg>
                 </div>

                 {isWatermarkOpen &&
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     {/* Text Input */}
                     <div>
                       <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{t("文字")}</label>
                       <input
                      type="text"
                      value={config.watermark.text}
                      onChange={(e) => updateWatermark('text', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid var(--input-border)',
                        borderRadius: '4px',
                        background: 'var(--input-bg)',
                        color: 'var(--text-primary)'
                      }} />
                    
                     </div>

                     {/* Size Slider */}
                     <div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                         <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t("大小")}</label>
                         <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{config.watermark.size}</span>
                       </div>
                       <input
                      type="range"
                      min="10"
                      max="100"
                      value={config.watermark.size}
                      onChange={(e) => updateWatermark('size', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
                    
                     </div>

                     {/* Opacity Slider */}
                     <div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                         <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t("不透明度")}</label>
                         <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{config.watermark.opacity}%</span>
                       </div>
                       <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.watermark.opacity}
                      onChange={(e) => updateWatermark('opacity', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
                    
                     </div>

                     {/* Angle Slider */}
                     <div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                         <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t("角度")}</label>
                         <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{config.watermark.angle}°</span>
                       </div>
                       <input
                      type="range"
                      min="0"
                      max="360"
                      value={config.watermark.angle}
                      onChange={(e) => updateWatermark('angle', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
                    
                     </div>

                     {/* Color Picker */}
                     <div>
                       <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{t("颜色")}</label>
                       <div style={{ display: 'flex', gap: '8px' }}>
                         <input
                        type="color"
                        value={config.watermark.color}
                        onChange={(e) => updateWatermark('color', e.target.value)}
                        style={{ width: '40px', height: '36px', padding: 0, border: '1px solid var(--input-border)', borderRadius: '4px', cursor: 'pointer' }} />
                      
                         <input
                        type="text"
                        value={config.watermark.color}
                        onChange={(e) => updateWatermark('color', e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0 12px',
                          border: '1px solid var(--input-border)',
                          borderRadius: '4px',
                          background: 'var(--input-bg)',
                          color: 'var(--text-primary)'
                        }} />
                      
                       </div>
                     </div>

                     {/* Position Grid */}
                     <div>
                       <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{t("位置")}</label>
                       {renderPositionGrid()}
                     </div>
                   </div>
                }
               </div>
              }
               </div>
             </div>
        </div>
      </div>

      {/* File List Section */}
      <div style={{
        marginTop: '24px',
        background: 'var(--card-bg)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{t("文件列表 (")}{files.length})</h3>
          
          <div style={{ display: 'flex', gap: '12px' }}>
             <button
              onClick={handleConvert}
              disabled={isConverting || files.length === 0}
              style={{
                padding: '8px 20px',
                border: 'none',
                borderRadius: '8px',
                background: 'var(--primary-color)',
                color: '#ffffff',
                cursor: 'pointer',
                fontSize: '14px',
                opacity: isConverting || files.length === 0 ? 0.6 : 1,
                fontWeight: '500'
              }}>
               
               {isConverting ? t('转换中...') : t('全部转换')}
              </button>
             <button
              onClick={handleClearAll}
              disabled={files.length === 0}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                opacity: files.length === 0 ? 0.6 : 1
              }}>{t("清空全部")}


            </button>
             <button
              onClick={handleDownloadAllTrigger}
              disabled={Object.keys(results).length === 0}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                opacity: Object.keys(results).length === 0 ? 0.6 : 1
              }}>{t("全部下载")}


            </button>
          </div>
        </div>

        <div style={{
          minHeight: '200px',
          maxHeight: '400px',
          overflowY: files.length > 0 ? 'auto' : 'visible',
          paddingRight: files.length > 0 ? '8px' : '0'
        }}>
          {files.length === 0 ?
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px', flexDirection: 'column', gap: '12px', border: '2px dashed var(--border-color)', borderRadius: '12px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <p>{t("暂无文件，请在上方添加")}</p>
            </div> :

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {files.map((fileObj, index) => {
              const file = fileObj.file || fileObj; // Handle both structures
              const fileId = fileObj.id;
              const result = results[fileId];

              return (
                <div key={fileId || index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', overflow: 'hidden' }}>
                      <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary-color)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                        {sourceFormat}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.name}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {file.size ? (file.size / 1024).toFixed(2) + ' KB' : t('未知')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {result ?
                    result.success ?
                    <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                        onClick={(e) => handleSingleDownloadTrigger(fileId)}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--success-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>{t("下载")}


                      </button>
                          </div> :

                    <span style={{ color: 'var(--error-color)', fontSize: '13px' }}>{t("转换失败")}</span> :


                    isConverting ?
                    <span style={{ color: 'var(--primary-color)', fontSize: '13px' }}>{t("转换中...")}</span> :

                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t("等待转换")}</span>

                    }
                      
                      {sourceFormat === 'HTML' &&
                    <button
                      onClick={() => handlePreview(fileObj)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer' }}
                      title={t("预览")}>
                      
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                    }

                      <button
                      onClick={() => handleRemoveFile(fileId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title={t("删除")}>
                      
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>);

            })}
            </div>
          }
        </div>
      </div>
      {/* Download Choice Modal */}
      {showDownloadModal &&
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }} onClick={() => setShowDownloadModal(false)}>
          <div style={{
          backgroundColor: 'var(--card-bg)',
          width: '400px',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)'
        }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 'bold' }}>{t("选择下载方式")}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
              {downloadingFileId !== null ? t('请选择单个文件的保存方式') : t('请选择多个文件的批量保存方式')}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
              onClick={() => executeDownload(false)}
              style={{
                padding: '12px',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
              
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>{t("直接保存到文件夹")}

            </button>
              <button
              onClick={() => executeDownload(true)}
              style={{
                padding: '12px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
              
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
                </svg>{t("打包为 ZIP 下载")}

            </button>
            </div>
          </div>
        </div>
      }

      {/* Preview Modal */}
      {showPreviewModal &&
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }} onClick={() => setShowPreviewModal(false)}>
          <div style={{
          backgroundColor: 'var(--bg-color)',
          width: '80%',
          height: '80%',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>{t("HTML 预览")}</h3>
              <button
              onClick={() => setShowPreviewModal(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>
              
                ×
              </button>
            </div>
            <div style={{
            flex: 1,
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            padding: '16px',
            overflow: 'auto',
            backgroundColor: '#fff'
          }}>
              <iframe
              srcDoc={previewContent}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Preview" />
            
            </div>
          </div>
        </div>
      }
    </div>);

}

export default DocToolWrapper;
