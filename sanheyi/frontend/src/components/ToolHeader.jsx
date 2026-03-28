import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { Avatar } from 'antd';
import { UserOutlined, LoadingOutlined } from '@ant-design/icons';
import AdBanner from './AdBanner';
import { useUserStore } from '../stores/useUserStore';
import LoginModal from './LoginModal';
import { useLocale } from '../contexts/LocaleContext';
import '../styles/LoginModal.css';
import '../App.css';
import { t } from '@/i18n';


const translateText = (text) => (typeof text === 'string' ? t(text) : text);
const LOCALE_DISPLAY = {
  ar: { short: 'AR', name: 'Arabic' },
  bn: { short: 'BN', name: 'Bengali' },
  de: { short: 'DE', name: 'German' },
  en: { short: 'EN', name: 'English' },
  es: { short: 'ES', name: 'Spanish' },
  fa: { short: 'FA', name: 'Farsi' },
  fr: { short: 'FR', name: 'French' },
  he: { short: 'HE', name: 'Hebrew' },
  hi: { short: 'HI', name: 'Hindi' },
  id: { short: 'ID', name: 'Indonesian' },
  it: { short: 'IT', name: 'Italian' },
  ja: { short: 'JA', name: 'Japanese' },
  ko: { short: 'KO', name: 'Korean' },
  ms: { short: 'MS', name: 'Malay' },
  nl: { short: 'NL', name: 'Dutch' },
  pl: { short: 'PL', name: 'Polish' },
  pt: { short: 'PT', name: 'Portuguese' },
  pt_BR: { short: 'PT-BR', name: 'Português (BR)' },
  ru: { short: 'RU', name: 'Russian' },
  sw: { short: 'SW', name: 'Swahili' },
  ta: { short: 'TA', name: 'Tamil' },
  th: { short: 'TH', name: 'Thai' },
  tl: { short: 'TL', name: 'Tagalog' },
  tr: { short: 'TR', name: 'Turkish' },
  uk: { short: 'UK', name: 'Ukrainian' },
  ur: { short: 'UR', name: 'Urdu' },
  vi: { short: 'VI', name: 'Vietnamese' },
  zh_CN: { short: '中', name: '中文' },
  zh_TW: { short: '繁', name: '繁體中文' }
};

function ToolHeader() {
  const { isLoggedIn, userInfo, isPolling, showLoginModal, init } = useUserStore();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const { moduleType, source } = useParams();
  const { locale, availableLocales, setLocale } = useLocale();
  const [isLocaleMenuOpen, setIsLocaleMenuOpen] = useState(false);
  const localeDropdownRef = useRef(null);
  const activeLocaleOptionRef = useRef(null);

  // 动态确定当前模块
  const getModuleConfig = () => {
    if (location.pathname === '/') {
      return {
        title: '鲲穹转换大师',
        subtitle: '简单、高效、全能',
        logo: 'home_logo.png'
      };
    }

    // 检查路径参数
    const type = moduleType || '';
    const src = source || '';

    // 图片类判断
    if (type === 'image' || ['jpg', 'png', 'svg', 'webp', 'bmp', 'gif', 'tiff', 'ico', 'avif'].includes(src.toLowerCase())) {
      return {
        title: '鲲穹转换大师',
        subtitle: '鲲穹AI旗下产品',
        logo: 'img_logo.ico'
      };
    }

    // 文档类判断
    if (type === 'doc' || ['pdf', 'docx', 'doc', 'txt', 'json', 'xml', 'yaml', 'yml', 'csv', 'epub', 'html', 'xlsx', 'xls', 'excel', 'pptx', 'ppt'].includes(src.toLowerCase())) {
      return {
        title: '鲲穹转换大师',
        subtitle: '鲲穹AI旗下产品',
        logo: 'doc_logo.ico'
      };
    }

    // 默认或视频类
    return {
      title: '鲲穹转换大师',
      subtitle: '鲲穹AI旗下产品',
      logo: 'video_logo.png'
    };
  };

  const config = getModuleConfig();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (localeDropdownRef.current && !localeDropdownRef.current.contains(event.target)) {
        setIsLocaleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isLocaleMenuOpen && activeLocaleOptionRef.current) {
      activeLocaleOptionRef.current.scrollIntoView({
        block: 'nearest'
      });
    }
  }, [isLocaleMenuOpen, locale]);

  const renderUserArea = () => {
    if (isLoggedIn && userInfo) {
      return (
        <div className="user-profile-trigger" onClick={showLoginModal}>
          <Avatar size={24} src={userInfo.avatar} icon={<UserOutlined />} />
          <span className="user-nickname">{userInfo.nickname}</span>
        </div>);

    }

    if (isPolling) {
      return (
        <button className="user-btn user-btn-polling" onClick={showLoginModal}>
          <LoadingOutlined spin />
          <span>{t("登录中...")}</span>
        </button>);

    }

      return (
        <button className="user-btn" onClick={showLoginModal}>{t("登录")}

        </button>);

  };

  const localeBadge = LOCALE_DISPLAY[locale]?.short || locale?.toUpperCase() || '??';
  const isLocaleToggleDisabled = !availableLocales || availableLocales.length <= 1;

  const handleLocaleSelect = (targetLocale) => {
    if (targetLocale === locale) {
      setIsLocaleMenuOpen(false);
      return;
    }
    setLocale(targetLocale);
    setIsLocaleMenuOpen(false);
  };

  const electronApi = window.electron;
  const handleMin = () => electronApi?.minimizeWindow?.();
  const handleMax = () => electronApi?.toggleMaximizeWindow?.();
  const handleClose = () => electronApi?.closeWindow?.();

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <div className="nav-logo-wrapper">
          {/* Use imported logo or relative path. Since it is in public, we can use absolute path if server root is correct.
               But with base: './', we should use relative path without leading slash or rely on import if we moved it to assets.
               However, since it is in public, we can just remove the leading slash. */}
          <img src={config.logo} alt="Logo" className="nav-app-icon" />
          <div className="nav-app-info">
            <div className="nav-app-title">{translateText(config.title)}</div>
            <div className="nav-app-subtitle">{translateText(config.subtitle)}</div>
          </div>
        </div>
      </div>

      <div className="nav-right">
        <AdBanner
          positions={['adv_position_01']}
          ratio={4}
          placeholderLabel="AD (4:1)"
          width={160} />
        
        <div className="user-btn-container">
          {renderUserArea()}
        </div>

        {/* Theme Toggle */}
        <button
          className="window-control-btn"
          onClick={toggleTheme}
          title={theme === 'light' ? t('切换深色模式') : t('切换浅色模式')}>
          
          {theme === 'light' ?
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg> :

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          }
        </button>

        <div
          className={`locale-dropdown ${isLocaleMenuOpen ? 'open' : ''}`}
          ref={localeDropdownRef}>
          <button
            className="locale-switcher-btn"
            onClick={() => setIsLocaleMenuOpen((prev) => !prev)}
            disabled={isLocaleToggleDisabled}
            title={t('切换语言')}>
            <span className="locale-switcher-label">{localeBadge}</span>
            <svg className="locale-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {isLocaleMenuOpen && !isLocaleToggleDisabled && (
            <div className="locale-menu">
              {availableLocales.map((code) => {
                const display = LOCALE_DISPLAY[code] || { short: code.toUpperCase(), name: code };
                return (
                  <button
                    key={code}
                    ref={locale === code ? activeLocaleOptionRef : null}
                    className={`locale-option ${locale === code ? 'active' : ''}`}
                    onClick={() => handleLocaleSelect(code)}>
                    <span className="locale-option-short">{display.short}</span>
                    <span className="locale-option-name">{display.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 窗口控制器 - 方案 C */}
        <div className="window-controls">
          <button className="window-control-btn" onClick={handleMin} title={t("最小化")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button className="window-control-btn" onClick={handleMax} title={t("最大化/还原")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="5" width="14" height="14" rx="2" ry="2"></rect>
            </svg>
          </button>
          <button className="window-control-btn close-btn" onClick={handleClose} title={t("关闭")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <LoginModal />
    </nav>);

}

export default ToolHeader;
