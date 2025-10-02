import React, { useState, useEffect } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { apiPost, apiGet } from '../../utils/ajax';
import UnifiedLoading from "../common/UnifiedLoading";
import notificationManager from '../../utils/notification';

/**
 * 내담자 메시지 전송 모달 컴포넌트
 * 상담일지 작성 완료 후 내담자에게 메시지를 보낼 수 있는 모달
 */
const MessageSendModal = ({ 
  isOpen, 
  onClose, 
  clientData, 
  scheduleData,
  onSend 
}) => {
  const { user } = useSession();
  
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    messageType: 'GENERAL',
    isImportant: false,
    isUrgent: false
  });
  const [messageTypeOptions, setMessageTypeOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // 메시지 유형 코드 로드
  useEffect(() => {
    const loadMessageTypeCodes = async () => {
      try {
        setLoadingCodes(true);
        const response = await apiGet('/api/common-codes/group/MESSAGE_TYPE');
        if (response && response.length > 0) {
          const options = response.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode,
            description: code.description
          }));
          setMessageTypeOptions(options);
        }
      } catch (error) {
        console.error('메시지 유형 코드 로드 실패:', error);
        // 실패 시 기본값 설정
        setMessageTypeOptions([
          { value: 'GENERAL', label: '일반 메시지', icon: '💬', color: '#6c757d', description: '일반적인 메시지' },
          { value: 'FOLLOW_UP', label: '후속 조치', icon: '🔄', color: '#007bff', description: '후속 조치 안내 메시지' },
          { value: 'HOMEWORK', label: '과제 안내', icon: '📝', color: '#28a745', description: '과제 및 숙제 안내 메시지' },
          { value: 'APPOINTMENT', label: '약속 안내', icon: '📅', color: '#ffc107', description: '약속 및 일정 안내 메시지' },
          { value: 'EMERGENCY', label: '긴급 안내', icon: '🚨', color: '#dc3545', description: '긴급 상황 안내 메시지' }
        ]);
      } finally {
        setLoadingCodes(false);
      }
    };

    loadMessageTypeCodes();
  }, []);

  // 안전한 날짜 변환 함수
  const safeFormatDateTime = (dateValue) => {
    if (!dateValue) return '확인 필요';
    
    try {
      if (typeof dateValue === 'string') {
        return new Date(dateValue).toLocaleString('ko-KR');
      } else if (dateValue instanceof Date) {
        return dateValue.toLocaleString('ko-KR');
      } else {
        return new Date(dateValue).toLocaleString('ko-KR');
      }
    } catch (error) {
      console.warn('날짜 변환 오류:', error);
      return '확인 필요';
    }
  };

  // 폼 초기화
  useEffect(() => {
    if (isOpen && clientData && scheduleData) {
      const startTime = safeFormatDateTime(scheduleData.startTime);

      setFormData({
        title: `상담 일지 작성 완료 - ${scheduleData.title || '상담'}`,
        content: `안녕하세요 ${clientData.name}님,\n\n상담 일지가 작성되었습니다.\n\n상담 일시: ${startTime}\n\n추가 문의사항이 있으시면 언제든지 연락주세요.\n\n감사합니다.`,
        messageType: 'GENERAL',
        isImportant: false,
        isUrgent: false
      });
    }
  }, [isOpen, clientData, scheduleData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      notificationManager.show('제목과 내용을 입력해주세요.', 'error');
      return;
    }

    try {
      setSending(true);
      
      // consultationId를 숫자로 변환 (schedule-30 -> 30)
      const consultationId = scheduleData.id ? 
        (typeof scheduleData.id === 'string' && scheduleData.id.startsWith('schedule-') ? 
          parseInt(scheduleData.id.replace('schedule-', '')) : 
          parseInt(scheduleData.id)) : 
        null;

      const messageData = {
        consultantId: user.id,
        clientId: clientData.id,
        consultationId: consultationId,
        senderType: 'CONSULTANT',
        title: formData.title,
        content: formData.content,
        messageType: formData.messageType,
        isImportant: formData.isImportant,
        isUrgent: formData.isUrgent
      };

      const response = await apiPost('/api/consultation-messages', messageData);

      if (response.success) {
        notificationManager.show('메시지가 성공적으로 전송되었습니다.', 'success');
        onSend && onSend(response.data);
        onClose();
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

  if (!isOpen) return null;

  // 컴포넌트 스타일
  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
      position: 'relative'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 24px',
      borderBottom: '1px solid #e9ecef',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px 12px 0 0'
    },
    headerTitle: {
      fontSize: 'var(--font-size-lg)',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: 'var(--font-size-xxl)',
      cursor: 'pointer',
      color: '#6c757d',
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    },
    content: {
      padding: '24px'
    },
    clientInfo: {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '20px',
      border: '1px solid #e9ecef'
    },
    clientInfoTitle: {
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      color: '#495057',
      marginBottom: '8px'
    },
    clientInfoText: {
      fontSize: 'var(--font-size-sm)',
      color: '#6c757d'
    },
    formGroup: {
      marginBottom: '20px'
    },
    formLabel: {
      display: 'block',
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      color: '#495057',
      marginBottom: '8px'
    },
    formInput: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      backgroundColor: '#fff',
      color: '#495057',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    formSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      backgroundColor: '#fff',
      color: '#495057',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    formTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      backgroundColor: '#fff',
      color: '#495057',
      minHeight: '120px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    checkboxGroup: {
      display: 'flex',
      gap: '16px',
      marginTop: '8px'
    },
    checkboxItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    checkbox: {
      width: '16px',
      height: '16px',
      cursor: 'pointer'
    },
    checkboxLabel: {
      fontSize: 'var(--font-size-sm)',
      color: '#495057',
      cursor: 'pointer'
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end',
      marginTop: '24px',
      paddingTop: '20px',
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
      backgroundColor: '#007bff',
      color: '#fff'
    },
    secondaryButton: {
      backgroundColor: '#6c757d',
      color: '#fff'
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }
  };

  return (
    <div className="message-send-modal-overlay">
      <div className="message-send-modal-content">
        {/* 헤더 */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>📨 내담자에게 메시지 보내기</h1>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.content}>
          {/* 내담자 정보 */}
          {clientData && (
            <div style={styles.clientInfo}>
              <div style={styles.clientInfoTitle}>👤 수신자</div>
              <div style={styles.clientInfoText}>
                {clientData.name} ({clientData.age}세, {clientData.gender})
              </div>
            </div>
          )}

          {/* 메시지 작성 폼 */}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>제목 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="메시지 제목을 입력하세요"
              style={styles.formInput}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>메시지 타입</label>
            <select
              name="messageType"
              value={formData.messageType}
              onChange={handleInputChange}
              style={styles.formSelect}
            >
              {messageTypeOptions.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label} ({type.value})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>내용 *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="메시지 내용을 입력하세요"
              style={styles.formTextarea}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>옵션</label>
            <div style={styles.checkboxGroup}>
              <div style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="isImportant"
                  checked={formData.isImportant}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>중요 메시지</label>
              </div>
              <div style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleInputChange}
                  style={styles.checkbox}
                />
                <label style={styles.checkboxLabel}>긴급 메시지</label>
              </div>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={{...styles.button, ...styles.secondaryButton}}
              disabled={sending}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSend}
              style={{...styles.button, ...styles.primaryButton}}
              disabled={sending}
            >
              {sending ? <UnifiedLoading variant="dots" size="small" type="inline" /> : '📤 메시지 전송'}
            </button>
          </div>
        </div>

        {/* 로딩 오버레이 */}
        {sending && (
          <div style={styles.loadingOverlay}>
            <UnifiedLoading variant="pulse" size="large" text="메시지 전송 중..." type="inline" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSendModal;
