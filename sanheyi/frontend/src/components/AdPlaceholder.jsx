import React, { useState, useEffect } from 'react';
import { PictureOutlined } from '@ant-design/icons';
import '../styles/AdPlaceholder.css';import { t } from '@/i18n';


const AdPlaceholder = ({
  ratio,
  label,
  className = '',
  width = '100%',
  height = 'auto',
  style: customStyle
}) => {
  const [logoUrl, setLogoUrl] = useState('');
  useEffect(() => {
    const loadLogo = async () => {
      try {
        // eslint-disable-next-line no-undef
        const electron = window.require ? window.require('electron') : null;
        if (electron?.ipcRenderer) {
          const url = await electron.ipcRenderer.invoke('get-resource-url', 'kq.png');
          if (url) {
            setLogoUrl(url);
          }
        }
      } catch (e) {
        console.error('Failed to load placeholder logo', e);
      }
    };
    loadLogo();
  }, []);

  const displayLabel = typeof label === 'string' ? t(label) : label;
  const loadingKeyword = t('加载中');
  const isLoading = typeof displayLabel === 'string' && displayLabel.includes(loadingKeyword);
  const containerStyle = {
    aspectRatio: ratio ? `${ratio}` : undefined,
    width,
    height,
    borderRadius: '8px',
    boxSizing: 'border-box',
    WebkitAppRegion: 'no-drag',
    cursor: 'default',
    padding: '12px',
    ...customStyle
  };

  const isSmall = ratio && ratio > 3; // For 4:1 banner (small height)

  return (
    <div className={`ad-placeholder ${className} ${isLoading ? 'loading' : ''}`} style={containerStyle}>
            {isLoading ?
      // Loading State
      <>
                    <div className="ad-placeholder-shimmer"></div>
                    <span className="ad-placeholder-text">{displayLabel}</span>
                </> :

      // Branding State (Empty Ad)
      <div className={`ad-branding-container ${isSmall ? 'small' : ''}`}>
                    {logoUrl ?
        <img src={logoUrl} alt="Logo" className="ad-branding-logo" /> :

        <PictureOutlined className="ad-branding-icon" />
        }
                    <div className="ad-branding-content">
                        <div className="ad-branding-title">{t("鲲穹AI")}</div>
                        <div className="ad-branding-slogan">{t("让办公更高效")}</div>
                    </div>
                </div>
      }
        </div>);

};

export default AdPlaceholder;
