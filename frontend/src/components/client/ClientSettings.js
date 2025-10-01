import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import SimpleLayout from '../layout/SimpleLayout';

const ClientSettings = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    privacyMode: false,
    language: 'ko'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!sessionLoading && !isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }
  }, [user, isLoggedIn, sessionLoading, navigate]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 실제 API 호출로 설정 저장
      const response = await fetch('/api/client/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        setMessage('설정이 성공적으로 저장되었습니다.');
        console.log('✅ 클라이언트 설정 저장 성공:', data);
        
        // 성공 시 3초 후 메시지 제거
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || '설정 저장에 실패했습니다.');
        console.error('❌ 클라이언트 설정 저장 실패:', data);
        
        // 실패 시 5초 후 메시지 제거
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('❌ 클라이언트 설정 저장 오류:', error);
      setMessage('설정 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      
      // 오류 시 5초 후 메시지 제거
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <SimpleLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">로딩중...</span>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="설정">
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)',
        minHeight: '100vh'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: 'var(--font-size-xxl)',
              fontWeight: '700',
              color: '#2c3e50',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <i className="bi bi-gear" style={{ color: '#3498db', fontSize: 'var(--font-size-xxxl)' }}></i>
              계정 설정
            </h2>
            <p style={{
              fontSize: 'var(--font-size-base)',
              color: '#6c757d',
              margin: '0'
            }}>
              개인정보 및 알림 설정을 관리할 수 있습니다.
            </p>
          </div>

          {message && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '24px',
              borderRadius: '8px',
              background: '#d4edda',
              color: '#155724',
              border: '1px solid #c3e6cb'
            }}>
              <i className="bi bi-check-circle"></i> {message}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 알림 설정 */}
            <div style={{
              padding: '24px',
              background: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '600',
                color: '#495057',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-bell" style={{ color: '#3498db' }}></i>
                알림 설정
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <div>
                    <h4 style={{ margin: '0', fontSize: 'var(--font-size-base)', color: '#495057' }}>전체 알림</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: '#6c757d' }}>
                      모든 알림을 받습니다
                    </p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <div>
                    <h4 style={{ margin: '0', fontSize: 'var(--font-size-base)', color: '#495057' }}>이메일 알림</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: '#6c757d' }}>
                      상담 예약 및 리마인더를 이메일로 받습니다
                    </p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.emailAlerts}
                      onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0'
                }}>
                  <div>
                    <h4 style={{ margin: '0', fontSize: 'var(--font-size-base)', color: '#495057' }}>SMS 알림</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: '#6c757d' }}>
                      긴급 알림을 SMS로 받습니다
                    </p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.smsAlerts}
                      onChange={(e) => handleSettingChange('smsAlerts', e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 개인정보 설정 */}
            <div style={{
              padding: '24px',
              background: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '600',
                color: '#495057',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="bi bi-shield-check" style={{ color: '#3498db' }}></i>
                개인정보 보호
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #dee2e6'
                }}>
                  <div>
                    <h4 style={{ margin: '0', fontSize: 'var(--font-size-base)', color: '#495057' }}>프라이버시 모드</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: '#6c757d' }}>
                      상담사가 내 정보를 볼 수 없도록 제한합니다
                    </p>
                  </div>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings.privacyMode}
                      onChange={(e) => handleSettingChange('privacyMode', e.target.checked)}
                      style={{ transform: 'scale(1.2)' }}
                    />
                  </div>
                </div>

                <div style={{
                  padding: '12px 0'
                }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--font-size-base)', color: '#495057' }}>
                    언어 설정
                  </label>
                  <select
                    className="form-select"
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    style={{ maxWidth: '200px' }}
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '12px 32px',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '600',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">저장중...</span>
                    </div>
                    저장중...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle"></i>
                    설정 저장
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ClientSettings;
