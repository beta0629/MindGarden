import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { MessageSquare, XCircle, Send, User, Bell, AlertTriangle } from 'lucide-react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useSession } from '../../contexts/SessionContext';
import { apiPost, apiGet } from '../../utils/ajax';
import notificationManager from '../../utils/notification';

/**
 * 내담자 메시지 전송 모달 컴포넌트
/**
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
        const response = await apiGet('/api/v1/common-codes/MESSAGE_TYPE');
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
          { value: 'GENERAL', label: '일반 메시지', icon: '💬', color: 'var(--mg-secondary-500)', description: '일반적인 메시지' },
          { value: 'FOLLOW_UP', label: '후속 조치', icon: '🔄', color: 'var(--mg-primary-500)', description: '후속 조치 안내 메시지' },
          { value: 'HOMEWORK', label: '과제 안내', icon: '📝', color: 'var(--mg-success-500)', description: '과제 및 숙제 안내 메시지' },
          { value: 'APPOINTMENT', label: '약속 안내', icon: '📅', color: 'var(--mg-warning-500)', description: '약속 및 일정 안내 메시지' },
          { value: 'EMERGENCY', label: '긴급 안내', icon: '🚨', color: 'var(--mg-error-500)', description: '긴급 상황 안내 메시지' }
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

      const response = await apiPost('/api/v1/consultation-messages', messageData);

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

  const portalTarget = document.body || document.createElement('div');

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal mg-v2-modal-medium" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <MessageSquare size={28} className="mg-v2-modal-title-icon" />
            <h2 className="mg-v2-modal-title">내담자에게 메시지 보내기</h2>
          </div>
          <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
            <XCircle size={24} />
          </button>
        </div>

        <div className="mg-v2-modal-body">
          {/* 내담자 정보 */}
          {clientData && (
            <div className="mg-v2-info-box">
              <h4 className="mg-v2-info-box-title">
                <User size={20} className="mg-v2-section-title-icon" />
                수신자
              </h4>
              <div className="mg-v2-info-text">
                {clientData.name} ({clientData.age}세, {clientData.gender})
              </div>
            </div>
          )}

          {/* 메시지 작성 폼 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">제목 <span className="mg-v2-form-label-required">*</span></label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="메시지 제목을 입력하세요"
              className="mg-v2-form-input"
              required
            />
          </div>

          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">메시지 타입</label>
            <select
              name="messageType"
              value={formData.messageType}
              onChange={handleInputChange}
              className="mg-v2-form-select"
            >
              {messageTypeOptions.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label} ({type.value})
                </option>
              ))}
            </select>
          </div>

          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">내용 <span className="mg-v2-form-label-required">*</span></label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="메시지 내용을 입력하세요"
              className="mg-v2-form-textarea"
              required
            />
          </div>

          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">옵션</label>
            <div className="mg-v2-form-checkbox-group">
              <label className="mg-v2-form-checkbox">
                <input
                  type="checkbox"
                  name="isImportant"
                  checked={formData.isImportant}
                  onChange={handleInputChange}
                />
                <Bell size={16} className="mg-v2-icon-inline" />
                중요 메시지
              </label>
              <label className="mg-v2-form-checkbox">
                <input
                  type="checkbox"
                  name="isUrgent"
                  checked={formData.isUrgent}
                  onChange={handleInputChange}
                />
                <AlertTriangle size={16} className="mg-v2-icon-inline" />
                긴급 메시지
              </label>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="mg-v2-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="mg-v2-button mg-v2-button--secondary"
            disabled={sending}
          >
            <XCircle size={20} className="mg-v2-icon-inline" />
            취소
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="mg-v2-button mg-v2-button--primary"
            disabled={sending}
          >
            {sending ? <div className="mg-loading">로딩중...</div> : (
              <>
                <Send size={20} className="mg-v2-icon-inline" />
                메시지 전송
              </>
            )}
          </button>
        </div>

        {/* 로딩 오버레이 */}
        {sending && (
          <div className="mg-v2-loading-overlay">
            <div className="mg-loading">로딩중...</div>
          </div>
        )}
      </div>
    </div>,
    portalTarget
  );
};

export default MessageSendModal;
