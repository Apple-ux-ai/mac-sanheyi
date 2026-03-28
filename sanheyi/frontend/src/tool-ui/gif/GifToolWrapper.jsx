import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UnifiedToolHeader,
  SettingsPanel,
  SettingSlider,
  SettingSelect,
  ActionBar,
  ToolLayout,
  AlertModal } from
'../common/SharedUI';
import { FileUploaderV2 } from '../common/FileUploaderV2';
import { api } from '../../services/api';
import { applyConversionNotificationRule, ConversionScenario } from '../../rules/conversionNotificationRules';import { t } from '@/i18n';


function GifToolWrapper({ toolName, onBack }) {
  // Extract target format from tool name (e.g., "GIF To MP4" -> "MP4")
  const targetFormat = toolName.split(' To ')[1];
  const commandName = `convert-gif-to-${targetFormat.toLowerCase()}`;

  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);
  const [convertCount, setConvertCount] = useState({ current: 0, total: 0 });
  const [globalPath, setGlobalPath] = useState('');
  const [customPaths, setCustomPaths] = useState({});
  const [results, setResults] = useState({});
  const [lastOutputDir, setLastOutputDir] = useState(null);

  // Configuration state
  const [config, setConfig] = useState({
    fps: 24,
    quality: 90,
    interval: 100,
    pageSize: 'A4',
    orientation: 'Original'
  });

  const isCancelledRef = useRef(false);
  const currentFileIndexRef = useRef(0);
  const currentFileRef = useRef(null);
  const currentTargetsRef = useRef(null);

  // Define breadcrumbs
  const breadcrumbItems = [
  { label: 'GIF 转换器', onClick: onBack },
  { label: toolName }];


  // Helper to determine if we need FPS settings (Video formats)
  const isVideoTarget = ['MP4', 'AVI', 'MOV', 'WEBM', 'MKV'].includes(targetFormat);
  // Helper to determine if we need Quality settings (Image formats)
  const isImageTarget = ['JPG', 'JPEG', 'WEBP'].includes(targetFormat);
  // Helper to determine if we need PDF settings
  const isPdfTarget = targetFormat === 'PDF';

  // API Progress Listener
  useEffect(() => {
    if (!api.isAvailable()) return;

    const handleProgress = (data) => {
      if (isCancelledRef.current) return;

      if (data && data.type === 'output') {
        let output = null;
        if (Array.isArray(data.targets) && data.targets.length > 0) {
          currentTargetsRef.current = data.targets;
          output = data.output || data.outputPath || data.targets[0];
        } else if (data.output) {
          currentTargetsRef.current = [data.output];
          output = data.output;
        }
        if (currentFileRef.current && output) {
          const key = typeof currentFileRef.current === 'string' ?
          currentFileRef.current :
          currentFileRef.current.path;
          setResults((prev) => ({ ...prev, [key]: output }));
        }
        return;
      }

      if (data.percent !== undefined && files.length > 0) {
        const currentFilePercent = data.percent;
        const total = files.length;
        const currentIdx = currentFileIndexRef.current;
        const globalPercent = Math.round((currentIdx * 100 + currentFilePercent) / total);
        setConvertProgress(globalPercent);
      }
    };

    api.onProgress(handleProgress);
    return () => {
      api.removeProgressListener();
    };
  }, [files.length]);

  const handleAddFile = async (droppedFiles = null) => {
    let selected = [];
    if (droppedFiles) {
      const allFiles = Array.from(droppedFiles).map((f) => f.path || f.name);
      selected = allFiles.filter((f) => f.toLowerCase().endsWith('.gif'));
      if (selected.length < allFiles.length) {
        showAlert('提示', '已自动过滤非 GIF 文件');
      }
    } else if (api.isAvailable()) {
      selected = await api.openFileDialog([
      { name: 'GIF Images', extensions: ['gif'] }]
      );
    } else {
      document.getElementById('file-input-gif')?.click();
      return;
    }

    if (selected && selected.length > 0) {
      setFiles((prev) => [...new Set([...prev, ...selected])]);
    }
  };

  const handleWebFileChange = (e) => {
    const newFiles = Array.from(e.target.files).map((f) => f.path || f.name);
    setFiles((prev) => [...new Set([...prev, ...newFiles])]);
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetGlobalPath = async () => {
    if (api.isAvailable()) {
      const path = await api.openDirectoryDialog();
      if (path) setGlobalPath(path);
    }
  };

  const handleSetCustomPath = async (filesToSet) => {
    if (!filesToSet || filesToSet.length === 0) return;
    if (api.isAvailable()) {
      const path = await api.openDirectoryDialog();
      if (path) {
        setCustomPaths((prev) => {
          const next = { ...prev };
          filesToSet.forEach((file) => {
            const filePath = typeof file === 'string' ? file : file.path;
            next[filePath] = path;
          });
          return next;
        });
      }
    }
  };

  // Alert/Modal helpers (using simple alert for now or implement AlertModal if needed)
  // Since SharedUI doesn't export AlertModal hook, we might need to handle it locally or skip for brevity
  // For now, we'll use window.alert for critical errors if notification rules fail, 
  // but preferably use the notification rule system which expects a `showAlert` function.
  // To match the polished UI, we should implement the AlertModal state.

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onClose: null,
    buttonText: '确定'
  });

  const showAlert = (title, message, onConfirm = null, buttonText = '确定', onClose = null) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      onConfirm: onConfirm || (() => setAlertModal((prev) => ({ ...prev, isOpen: false }))),
      onClose: onClose || (() => setAlertModal((prev) => ({ ...prev, isOpen: false }))),
      buttonText
    });
  };

  const handleConvert = async () => {
    if (files.length === 0) {
      showAlert('提示', '请先选择 GIF 文件');
      return;
    }

    // Check paths
    const missingPath = files.some((file) => {
      const key = typeof file === 'string' ? file : file.path;
      return !customPaths[key] && !globalPath && !lastOutputDir;
    });

    if (missingPath) {
      showAlert('提示', '请设置输出路径（全局或自定义）');
      return;
    }

    isCancelledRef.current = false;
    setConvertProgress(0);
    setConvertCount({ current: 0, total: files.length });
    setIsConverting(true);

    try {
      if (api.isAvailable()) {
        for (let index = 0; index < files.length; index++) {
          if (isCancelledRef.current) break;

          currentFileIndexRef.current = index;
          const file = files[index];
          currentFileRef.current = file;
          currentTargetsRef.current = null;

          const key = typeof file === 'string' ? file : file.path;
          const outputDir = customPaths[key] || globalPath || lastOutputDir;

          if (!outputDir) continue;
          if (!lastOutputDir) setLastOutputDir(outputDir);

          // Prepare params based on target format
          const params = {};
          if (isVideoTarget) params.fps = config.fps;
          if (isImageTarget) {
            params.quality = config.quality;
            params.interval = config.interval;
          }
          if (isPdfTarget) {
            params.pageSize = config.pageSize;
            params.orientation = config.orientation;
          }

          const result = await api.convert(commandName, {
            sourcePath: file,
            outputDir: outputDir,
            params
          });

          if (isCancelledRef.current) break;

          if (!result.success) {
            applyConversionNotificationRule({
              scene: ConversionScenario.ERROR_SINGLE,
              ui: { showAlert },
              data: {
                filePath: key,
                errorMessage: result.error || result.message
              }
            });
            break; // Or continue? The original code breaks on error.
          }

          setConvertCount({ current: index + 1, total: files.length });
        }

        if (!isCancelledRef.current) {
          setConvertProgress(0);
          setConvertCount({ current: 0, total: 0 });
          applyConversionNotificationRule({
            scene: ConversionScenario.SUCCESS_BATCH_ALL,
            ui: { showAlert },
            data: {
              customTitle: '完成',
              customMessage: `所有文件已成功转换为 ${targetFormat}！`,
              buttonText: '确定',
              onClose: () => setAlertModal((prev) => ({ ...prev, isOpen: false }))
            }
          });
        }
      }
    } catch (error) {
      console.error('Conversion failed:', error);
      applyConversionNotificationRule({
        scene: ConversionScenario.ERROR_SINGLE,
        ui: { showAlert },
        data: { errorMessage: '转换过程中发生错误: ' + error.message }
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <ToolLayout>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="tool-container-full">
        
        <UnifiedToolHeader
          breadcrumbs={breadcrumbItems}
          title={toolName}
          description={t("将 GIF 转换为 ${targetFormat}", { "targetFormat": targetFormat })}
          icon="🎞️" />
        
        
        <FileUploaderV2
          files={files}
          onAddFile={handleAddFile}
          onRemoveFile={handleRemoveFile}
          onSetGlobalPath={handleSetGlobalPath}
          onSetCustomPath={handleSetCustomPath}
          activeFile={activeFile}
          onSelectFile={setActiveFile}
          globalPath={globalPath}
          customPaths={customPaths}
          results={results}
          uploadPlaceholder={t("拖拽 GIF 文件到此处")} />
        
        
        {/* Hidden input for web fallback */}
        <input
          type="file"
          id="file-input-gif"
          multiple
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
          accept=".gif" />
        

        <SettingsPanel title={t("转换设置")}>
          {isVideoTarget &&
          <SettingSlider
            label={t("帧率 (FPS)")}
            value={config.fps}
            min={1}
            max={60}
            unit="fps"
            onChange={(v) => setConfig((prev) => ({ ...prev, fps: v }))} />

          }
          
          {isImageTarget &&
          <>
              <SettingSlider
              label={t("质量")}
              value={config.quality}
              min={1}
              max={100}
              unit="%"
              onChange={(v) => setConfig((prev) => ({ ...prev, quality: v }))} />
            
               <SettingSlider
              label={t("间隔 (ms)")}
              value={config.interval}
              min={10}
              max={1000}
              step={10}
              unit="ms"
              onChange={(v) => setConfig((prev) => ({ ...prev, interval: v }))} />
            
            </>
          }

          {isPdfTarget &&
          <SettingSelect
            label={t("页面大小")}
            value={config.pageSize}
            options={['A4', 'A3', 'Letter', 'Legal']}
            onChange={(v) => setConfig((prev) => ({ ...prev, pageSize: v }))} />

          }
        </SettingsPanel>

        <ActionBar
          onConvert={handleConvert}
          onClear={() => {
            setFiles([]);
            setResults({});
            setConvertProgress(0);
          }}
          isConverting={isConverting}
          progress={convertProgress}
          convertCount={convertCount} />
        

        <AlertModal
          isOpen={alertModal.isOpen}
          title={alertModal.title}
          message={alertModal.message}
          onConfirm={alertModal.onConfirm}
          onClose={alertModal.onClose || (() => setAlertModal((prev) => ({ ...prev, isOpen: false })))}
          buttonText={alertModal.buttonText} />
        
      </motion.div>
    </ToolLayout>);

}

// I need to add AlertModal to imports. 
// Re-checking SharedUI imports in the code block above... 
// I missed AlertModal in the top imports. Adding it now.

export default GifToolWrapper;