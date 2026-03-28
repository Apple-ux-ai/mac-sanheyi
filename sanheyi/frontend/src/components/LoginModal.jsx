import React from 'react';
import { Modal, Button, Avatar, Typography, message } from 'antd';
import { UserOutlined, LoadingOutlined, LogoutOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useUserStore } from '../stores/useUserStore';
import '../styles/LoginModal.css';import { t } from '@/i18n';


const { Text, Title, Paragraph } = Typography;

const LoginModal = () => {
  const {
    userInfo,
    isLoggedIn,
    isPolling,
    isLoginModalVisible,
    hideLoginModal,
    startLoginProcess,
    stopLoginProcess,
    logout
  } = useUserStore();

  // Handle Modal Close
  const handleClose = () => {
    hideLoginModal();
  };

  const handleLogin = () => {
    startLoginProcess();
  };

  const handleCancelLogin = () => {
    stopLoginProcess();
    message.info(t('已取消登录'));
  };

  const handleLogout = () => {
    logout();
  };

  // Render Content based on state
  const renderContent = () => {
    if (isLoggedIn && userInfo) {
      return (
        <div className="login-modal-content">
                    <div className="login-modal-avatar-container">
                        <Avatar size={80} src={userInfo.avatar} icon={<UserOutlined />} />
                        <div className="avatar-badge">
                            <SafetyCertificateOutlined />
                        </div>
                    </div>
                    <Title level={4} className="login-modal-title">{userInfo.nickname}</Title>
                    <Text className="login-modal-subtitle">{t("已登录鲲穹账户")}</Text>

                    <div className="login-modal-buttons">
                        <Button
              danger
              block
              size="large"
              className="login-modal-btn-secondary"
              icon={<LogoutOutlined />}
              onClick={handleLogout}>{t("退出当前账号")}


            </Button>
                        <Button
              type="text"
              block
              className="login-modal-btn-text"
              onClick={handleClose}>{t("关闭窗口")}


            </Button>
                    </div>
                </div>);

    }

    if (isPolling) {
      return (
        <div className="login-modal-content">
                    <div className="login-polling-container">
                        <LoadingOutlined className="login-polling-icon" spin />
                        <div className="login-polling-title">{t("等待登录...")}</div>
                        <div className="login-polling-desc">{t("请在浏览器中完成登录验证")}</div>
                    </div>

                    <div className="login-modal-buttons">
                        <Button
              size="large"
              block
              className="login-modal-btn-secondary"
              onClick={handleCancelLogin}>{t("取消登录")}


            </Button>
                    </div>
                </div>);

    }

    // Guest State
    return (
      <div className="login-modal-content">
                <div className="login-modal-avatar-container">
                    <Avatar size={80} icon={<UserOutlined />} />
                </div>
                <Title level={4} className="login-modal-title">{t("登录鲲穹账户")}</Title>
                <Paragraph className="login-modal-subtitle">{t("登录后即可保存您的个性设置")}
          <br />{t("并享受更多高级功能")}
        </Paragraph>

                <div className="login-modal-buttons">
                    <Button
            type="primary"
            size="large"
            block
            className="login-modal-btn-primary"
            onClick={handleLogin}
            icon={<UserOutlined />}>{t("立即登录")}


          </Button>
                    <Button
            type="text"
            size="small"
            block
            className="login-modal-btn-text"
            onClick={handleClose}>{t("下次再说")}


          </Button>
                </div>
            </div>);

  };

  return (
    <Modal
      open={isLoginModalVisible}
      onCancel={handleClose}
      footer={null}
      width={340}
      centered
      maskClosable={true}
      destroyOnHidden={true}
      closable={false} // Clean look
      className="custom-login-modal"
      rootClassName="custom-login-modal-root"
      getContainer={() => document.querySelector('.app-container') || document.body}
      styles={{
        mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 'var(--main-radius)' },
        content: { borderRadius: 'var(--main-radius)', padding: '12px', backgroundColor: 'var(--card-bg)' }
      }}>
      
            {renderContent()}
        </Modal>);

};

export default LoginModal;
