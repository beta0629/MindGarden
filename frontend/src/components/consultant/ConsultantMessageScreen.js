import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { apiGet, apiPost } from '../../utils/ajax';
import { getLucideIcon } from '../../utils/iconUtils';
import UnifiedLoading from '../common/UnifiedLoading';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { CONSULTANT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';

/**
 * 상담사 메시지 전송 화면
/**
 * 상담일지 완료 후 내담자에게 메시지를 전송할 수 있는 화면
 */
const ConsultantMessageScreen = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [client, setClient] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [consultationRecord, setConsultationRecord] = useState(null);
  
  // 메시지 폼 데이터
  const [messageData, setMessageData] = useState({
    title: '',
    content: '',
    messageType: 'GENERAL',
    isImportant: false,
    isUrgent: false
  });

  const messageTypes = [
    { value: 'GENERAL', label: '일반', icon: 'MessageCircle', color: 'var(--mg-secondary-500)' },
    { value: 'FOLLOW_UP', label: '후속 조치', icon: 'ClipboardList', color: 'var(--mg-primary-500)' },
    { value: 'HOMEWORK', label: '과제 안내', icon: 'FileText', color: 'var(--mg-success-500)' },
    { value: 'REMINDER', label: '알림', icon: 'Bell', color: 'var(--mg-warning-500)' },
    { value: 'URGENT', label: '긴급', icon: 'AlertTriangle', color: 'var(--mg-error-500)' }
  ];

  // 컴포넌트 스타일
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: 'var(--mg-gray-100)',
      padding: '20px'
    },
    header: {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.1) -> var(--mg-custom-color)
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
      border: '1px solid #e9ecef'
    },
    headerTitle: {
      fontSize: 'var(--font-size-xxl)',
      fontWeight: '700',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
      color: '#2c3e50',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    headerSubtitle: {
      fontSize: 'var(--font-size-base)',
      color: 'var(--mg-secondary-500)',
      marginBottom: '20px'
    },
    clientInfoCard: {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.1) -> var(--mg-custom-color)
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
      border: '1px solid #e9ecef'
    },
    clientInfoTitle: {
      fontSize: 'var(--font-size-xl)',
      fontWeight: '600',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
      color: '#2c3e50',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    clientInfoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px'
    },
    clientInfoItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    clientInfoLabel: {
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      color: 'var(--mg-secondary-500)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    clientInfoValue: {
      fontSize: 'var(--font-size-base)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
      color: '#2c3e50',
      fontWeight: '500'
    },
    messageCard: {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.1) -> var(--mg-custom-color)
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
      border: '1px solid #e9ecef'
    },
    messageTitle: {
      fontSize: 'var(--font-size-xl)',
      fontWeight: '600',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
      color: '#2c3e50',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    formLabel: {
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
      color: '#495057',
      marginBottom: '4px'
    },
    formInput: {
      padding: '12px 16px',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      transition: 'all 0.2s ease',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      backgroundColor: '#fff'
    },
    formTextarea: {
      padding: '12px 16px',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      minHeight: '120px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      backgroundColor: '#fff'
    },
    formSelect: {
      padding: '12px 16px',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      backgroundColor: '#fff',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    formInputFocus: {
      borderColor: 'var(--mg-primary-500)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,123,255,0.1) -> var(--mg-custom-color)
      boxShadow: '0 0 0 3px rgba(0,123,255,0.1)'
    },
    checkboxGroup: {
      display: 'flex',
      gap: '20px',
      alignItems: 'center'
    },
    checkboxItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer'
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    checkboxLabel: {
      fontSize: 'var(--font-size-sm)',
      fontWeight: '500',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
      color: '#495057',
      cursor: 'pointer'
    },
    messageTypeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px'
    },
    messageTypeItem: {
      padding: '16px',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      backgroundColor: '#fff'
    },
    messageTypeItemSelected: {
      borderColor: 'var(--mg-primary-500)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f8f9ff -> var(--mg-custom-f8f9ff)
      backgroundColor: '#f8f9ff'
    },
    messageTypeIcon: {
      fontSize: 'var(--font-size-xxl)',
      marginBottom: '8px'
    },
    messageTypeLabel: {
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #495057 -> var(--mg-custom-495057)
      color: '#495057'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '24px',
      paddingTop: '20px',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
      borderTop: '1px solid #e9ecef'
    },
    button: {
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      backgroundColor: 'var(--mg-primary-500)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      color: '#fff'
    },
    secondaryButton: {
      backgroundColor: 'var(--mg-secondary-500)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      color: '#fff'
    },
    successButton: {
      backgroundColor: 'var(--mg-success-500)',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
      color: '#fff'
    },
    loadingOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.5) -> var(--mg-custom-color)
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    },
    statusBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: 'var(--font-size-xs)',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  };

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [consultationId]);

  const loadData = async() => {
    try {
      setLoading(true);
      
      // location.state에서 데이터 가져오기
      if (location.state) {
        setClient(location.state.client);
        setConsultation(location.state.consultation);
        setConsultationRecord(location.state.consultationRecord);
        
        // 기본 메시지 제목 설정
        setMessageData(prev => ({
          ...prev,
          title: `상담 완료 안내 - ${toDisplayString(location.state.client?.name, '고객')}님`
        }));
      } else {
        // state가 없는 경우 API에서 데이터 로드
        const consultationResponse = await apiGet(`/api/v1/schedules/${consultationId}`);
        if (consultationResponse.success) {
          setConsultation(consultationResponse.data);
          
          if (consultationResponse.data.clientId) {
            const clientResponse = await apiGet(`/api/admin/users`);
            if (clientResponse.success) {
              const clientData = clientResponse.data.find(u => u.id === consultationResponse.data.clientId);
              if (clientData) {
                setClient(clientData);
                setMessageData(prev => ({
                  ...prev,
                  title: `상담 완료 안내 - ${toDisplayString(clientData.name, '고객')}님`
                }));
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      notificationManager.show('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMessageData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMessageTypeSelect = (messageType) => {
    setMessageData(prev => ({
      ...prev,
      messageType: messageType
    }));
  };

  const handleSendMessage = async() => {
    try {
      setSending(true);
      
      const messagePayload = {
        consultantId: user.id,
        clientId: client.id,
        consultationId: parseInt(consultationId),
        senderType: 'CONSULTANT',
        title: messageData.title,
        content: messageData.content,
        messageType: messageData.messageType,
        isImportant: messageData.isImportant,
        isUrgent: messageData.isUrgent
      };

      const response = await apiPost('/api/v1/consultation-messages', messagePayload);

      if (response.success) {
        notificationManager.show('메시지가 전송되었습니다.', 'success');
        navigate('/consultant/schedule');
      } else {
        throw new Error(response.message || '메시지 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      notificationManager.show('메시지 전송 중 오류가 발생했습니다.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSkipMessage = () => {
    navigate('/consultant/schedule');
  };

  if (loading) {
    return (
      <AdminCommonLayout title="메시지">
        <div className="mg-dashboard-layout">
          <div className="mg-dashboard-header">
            <h1 className="mg-dashboard-title">
              💬 내담자에게 메시지 전송
            </h1>
            <p className="mg-dashboard-subtitle">
              상담일지 작성이 완료되었습니다. 내담자에게 메시지를 전송하거나 건너뛸 수 있습니다.
            </p>
          </div>
          <div aria-busy="true" aria-live="polite" className="mg-mt-lg">
            <UnifiedLoading type="inline" text="로딩중..." />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  if (!client || !consultation) {
    return (
      <AdminCommonLayout title="메시지">
        <div className="mg-dashboard-layout">
          <div className="mg-dashboard-header">
            <h1 className="mg-dashboard-title">메시지 전송</h1>
            <p className="mg-dashboard-subtitle">상담 정보를 불러올 수 없습니다.</p>
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="메시지">
      <div className="mg-dashboard-layout">
      {/* 헤더 */}
      <div className="mg-dashboard-header">
        <h1 className="mg-dashboard-title">
          💬 내담자에게 메시지 전송
        </h1>
        <p className="mg-dashboard-subtitle">
          상담일지 작성이 완료되었습니다. 내담자에게 메시지를 전송하거나 건너뛸 수 있습니다.
        </p>
      </div>

      {/* 내담자 정보 카드 */}
      <div className="mg-v2-card mg-mb-lg">
        <h2 className="mg-h3 mg-mb-md mg-flex mg-align-center mg-gap-sm">
          👤 내담자 정보
        </h2>
        <div className="mg-grid mg-grid-cols-2 mg-gap-md">
          <div className="mg-flex mg-flex-col">
            <span className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary">이름</span>
            <span className="mg-v2-text-base mg-font-medium"><SafeText>{client.name}</SafeText></span>
          </div>
          <div className="mg-flex mg-flex-col">
            <span className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary">이메일</span>
            <span className="mg-v2-text-base mg-font-medium"><SafeText fallback="정보 없음">{client.email}</SafeText></span>
          </div>
          <div className="mg-flex mg-flex-col">
            <span className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary">전화번호</span>
            <span className="mg-v2-text-base mg-font-medium"><SafeText fallback="정보 없음">{client.phone}</SafeText></span>
          </div>
          <div className="mg-flex mg-flex-col">
            <span className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary">주소</span>
            <span className="mg-v2-text-base mg-font-medium"><SafeText fallback="정보 없음">{client.address}</SafeText></span>
          </div>
          <div className="mg-flex mg-flex-col">
            <span className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary">상담일</span>
            <span className="mg-v2-text-base mg-font-medium"><SafeText>{consultation.startTime?.split('T')[0]}</SafeText></span>
          </div>
          <div className="mg-flex mg-flex-col">
            <span className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary">상담시간</span>
            <span className="mg-v2-text-base mg-font-medium">
              {consultation.startTime?.split('T')[1]?.slice(0, 5)} - {consultation.endTime?.split('T')[1]?.slice(0, 5)}
            </span>
          </div>
          <div className="mg-flex mg-flex-col">
            <span className="mg-v2-label mg-v2-text-sm mg-v2-color-text-secondary">상담사</span>
            <span className="mg-v2-text-base mg-font-medium"><SafeText>{user.name}</SafeText></span>
          </div>
        </div>
      </div>

      {/* 메시지 작성 카드 */}
      <div style={styles.messageCard}>
        <h2 style={styles.messageTitle}>
          📝 메시지 작성
        </h2>
        
        <div style={styles.formGrid}>
          {/* 메시지 유형 선택 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>메시지 유형 *</label>
            <div style={styles.messageTypeGrid}>
              {messageTypes.map(type => (
                <div
                  key={type.value}
                  style={{
                    ...styles.messageTypeItem,
                    ...(messageData.messageType === type.value ? styles.messageTypeItemSelected : {})
                  }}
                  onClick={() => handleMessageTypeSelect(type.value)}
                >
                  <div style={styles.messageTypeIcon}>{getLucideIcon(type.icon, { size: 24 })}</div>
                  <div style={styles.messageTypeLabel}><SafeText>{type.label}</SafeText></div>
                </div>
              ))}
            </div>
          </div>

          {/* 메시지 제목 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>제목 *</label>
            <input
              type="text"
              name="title"
              value={messageData.title}
              onChange={handleInputChange}
              placeholder="메시지 제목을 입력하세요"
              style={{ ...styles.formInput, ...styles.formInputFocus }}
              required
            />
          </div>

          {/* 메시지 내용 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>내용 *</label>
            <textarea
              name="content"
              value={messageData.content}
              onChange={handleInputChange}
              placeholder="내담자에게 전달할 메시지 내용을 입력하세요"
              style={styles.formTextarea}
              required
            />
          </div>

          {/* 중요도 설정 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>중요도 설정</label>
            <div style={styles.checkboxGroup}>
              <div style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="isImportant"
                  checked={messageData.isImportant}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>⭐ 중요 메시지</label>
              </div>
              <div style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={messageData.isUrgent}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>⚠️ 긴급 메시지</label>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div style={styles.buttonGroup}>
          <MGButton
            type="button"
            variant="secondary"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleSkipMessage}
            disabled={sending}
          >
            건너뛰기
          </MGButton>
          <MGButton
            type="button"
            variant="success"
            className={buildErpMgButtonClassName({ variant: 'success', size: 'md', loading: sending })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleSendMessage}
            disabled={sending || !messageData.title.trim() || !messageData.content.trim()}
            loading={sending}
          >
            📤 메시지 전송
          </MGButton>
        </div>
      </div>
      </div>
    </AdminCommonLayout>
  );
};

export default ConsultantMessageScreen;
