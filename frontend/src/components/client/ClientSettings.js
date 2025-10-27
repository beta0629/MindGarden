import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import UnifiedLoading from '../common/UnifiedLoading';
import './ClientSettings.css';

const ClientSettings = () => {
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    privacyMode: false,
    maxConcurrentSessions: 1
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id]);

  const loadSettings = async () => {
    try {
      const response = await apiGet(`/api/clients/${user.id}/settings`);
      if (response.success && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      const response = await apiPost(`/api/clients/${user.id}/settings`, newSettings);
      
      if (response.success) {
        setSettings(newSettings);
        setMessage('설정이 저장되었습니다.');
        setTimeout(() => setMessage(null), 3000);
      } else {
        notificationManager.error('설정 저장 실패', response.message || '설정을 저장할 수 없습니다.');
      }
    } catch (error) {
      console.error('설정 저장 실패:', error);
      notificationManager.error('오류', '설정 저장 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <SimpleLayout title="설정">
        <UnifiedLoading text="설정을 불러오는 중..." />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="설정">
      <div className="client-settings-container">
        <div className="client-settings-card">
          <div className="client-settings-header">
            <h2 className="client-settings-title">
              <i className="bi bi-gear"></i>
              계정 설정
            </h2>
            <p className="client-settings-subtitle">
              개인정보 및 알림 설정을 관리할 수 있습니다.
            </p>
          </div>

          {message && (
            <div className="client-settings-message">
              <i className="bi bi-check-circle"></i> {message}
            </div>
          )}

          <div className="client-settings-content">
            {/* 알림 설정 */}
            <div className="client-settings-section">
              <h3 className="client-settings-section-title">
                <i className="bi bi-bell"></i>
                알림 설정
              </h3>
              
              <div className="client-settings-options">
                <div className="client-settings-option">
                  <div>
                    <h4>전체 알림</h4>
                    <p>모든 알림을 받습니다</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input client-settings-switch"
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    />
                  </div>
                </div>

                <div className="client-settings-option">
                  <div>
                    <h4>이메일 알림</h4>
                    <p>이메일로 알림을 받습니다</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input client-settings-switch"
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    />
                  </div>
                </div>

                <div className="client-settings-option">
                  <div>
                    <h4>SMS 알림</h4>
                    <p>SMS로 알림을 받습니다</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input client-settings-switch"
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 프라이버시 설정 */}
            <div className="client-settings-section">
              <h3 className="client-settings-section-title">
                <i className="bi bi-shield-check"></i>
                프라이버시
              </h3>
              
              <div className="client-settings-options">
                <div className="client-settings-option">
                  <div>
                    <h4>프라이버시 모드</h4>
                    <p>개인정보를 더 안전하게 보호합니다</p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input client-settings-switch"
                      type="checkbox"
                      checked={settings.privacyMode}
                      onChange={(e) => handleSettingChange('privacyMode', e.target.checked)}
                    />
                  </div>
                </div>

                <div className="client-settings-option">
                  <label>동시 상담 제한</label>
                  <select
                    className="client-settings-select"
                    value={settings.maxConcurrentSessions}
                    onChange={(e) => handleSettingChange('maxConcurrentSessions', parseInt(e.target.value))}
                  >
                    <option value={1}>1개</option>
                    <option value={2}>2개</option>
                    <option value={3}>3개</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="client-settings-footer">
              <button 
                className="btn btn-primary client-settings-save-btn"
                onClick={() => setMessage('설정이 저장되었습니다.')}
              >
                설정 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ClientSettings;
