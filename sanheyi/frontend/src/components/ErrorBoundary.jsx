import { Component } from 'react';import { t } from '@/i18n';


class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled React error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f7',
            color: '#333',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}>
          
          <h1 style={{ fontSize: '20px', marginBottom: '12px' }}>{t("界面渲染出错")}</h1>
          <p style={{ marginBottom: '8px' }}>{t("请关闭当前窗口后重新打开工具。")}</p>
          <p style={{ fontSize: '12px', color: '#888' }}>{t("错误信息:")}
            {this.state.error ? String(this.state.error.message || this.state.error) : t('未知错误')}
          </p>
        </div>);

    }

    return this.props.children;
  }
}

export default ErrorBoundary;
