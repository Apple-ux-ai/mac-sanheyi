import React from 'react';
import {
  SettingsPanel,
  SettingSlider,
  SettingPresets } from
'../../tool-ui/common/SharedUI';import { t } from '@/i18n';


const GIFToVideoParamConfig = ({
  fps, setFps,
  preset, setPreset
}) => {

  const handlePresetSelect = (p) => {
    setPreset(p);
    switch (p) {
      case '低质量':
        setFps(15);
        break;
      case '中等质量':
        setFps(24);
        break;
      case '高质量':
        setFps(30);
        break;
      case '社交媒体':
        setFps(25);
        break;
      default:
        break;
    }
  };

  return (
    <SettingsPanel title={t("转换选项")}>
      <SettingPresets
        label={t("快速预设")}
        presets={['低质量', '中等质量', '高质量', '社交媒体']}
        currentPreset={preset}
        onSelect={handlePresetSelect}
        columns={2} />
      
      <SettingSlider
        label={t("帧率")}
        value={fps}
        unit=" FPS"
        min={1}
        max={60}
        step={1}
        onChange={(val) => {
          setFps(val);
          setPreset('自定义');
        }} />
      
    </SettingsPanel>);

};

export default GIFToVideoParamConfig;