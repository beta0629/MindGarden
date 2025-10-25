import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import ConfirmModal from '../common/ConfirmModal';
import MessageSendModal from './MessageSendModal';
import { apiGet } from '../../utils/ajax';

// 일정 모달 컴포넌트
const EventModal = ({ event, mode, onSave, onDelete, onClose, userRole = 'CONSULTANT', onWriteConsultationLog, onConsultationLogSaved }) => {
  // Date 객체를 datetime-local 형식으로 변환하는 함수
  const formatDateForInput = (date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    if (date instanceof Date) {
      // 로컬 시간대로 변환하여 yyyy-MM-ddThh:mm 형식으로 반환
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    return '';
  };

  const [formData, setFormData] = useState({
    title: event?.title || '',
    start: formatDateForInput(event?.start) || '',
    end: formatDateForInput(event?.end) || '',
    clientName: event?.extendedProps?.clientName || '',
    consultationType: event?.extendedProps?.consultationType || '',
    notes: event?.extendedProps?.notes || ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [consultationLogStatus, setConsultationLogStatus] = useState({
    hasRecord: false,
    loading: true,
    recordId: null
  });

  // 상담사는 일정 수정 불가
  const isReadOnly = userRole === 'CONSULTANT';

  // 상담일지 작성 상태 체크
  const checkConsultationLogStatus = async () => {
    if (!event?.id) return;
    
    try {
      setConsultationLogStatus(prev => ({ ...prev, loading: true }));
      
      // consultationId 파싱 (schedule-30 형태 처리)
      const consultationId = event.id ? 
        (typeof event.id === 'string' && event.id.startsWith('schedule-') ? 
          parseInt(event.id.replace('schedule-', '')) : 
          parseInt(event.id)) : 
        null;

      if (consultationId) {
        const response = await apiGet(`/api/schedules/consultation-records?consultationId=${consultationId}`);
        if (response.success && response.data && response.data.length > 0) {
          setConsultationLogStatus({
            hasRecord: true,
            loading: false,
            recordId: response.data[0].id
          });
        } else {
          setConsultationLogStatus({
            hasRecord: false,
            loading: false,
            recordId: null
          });
        }
      }
    } catch (error) {
      console.error('상담일지 상태 체크 오류:', error);
      setConsultationLogStatus({
        hasRecord: false,
        loading: false,
        recordId: null
      });
    }
  };

  // 컴포넌트 마운트 시 상담일지 상태 체크
  useEffect(() => {
    if (event?.id) {
      checkConsultationLogStatus();
    }
  }, [event?.id]);

  // event가 변경될 때 formData 업데이트
  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        start: formatDateForInput(event.start) || '',
        end: formatDateForInput(event.end) || '',
        clientName: event.extendedProps?.clientName || '미지정',
        consultationType: event.extendedProps?.consultationType || '미지정',
        notes: event.extendedProps?.notes || ''
      });
    }
  }, [event]);

  // 상담일지 작성 함수
  const handleWriteConsultationLog = () => {
    if (event?.id && onWriteConsultationLog) {
      onWriteConsultationLog(event, () => {
        // 상담일지 작성 완료 후 상태 재체크
        checkConsultationLogStatus();
      });
    }
  };

  // 메시지 전송 핸들러
  const handleSendMessage = () => {
    setIsMessageModalOpen(true);
  };

  // 메시지 전송 완료 핸들러
  const handleMessageSent = () => {
    setIsMessageModalOpen(false);
  };

  // 컴포넌트 스타일
  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '24px',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      position: 'relative'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '1px solid #e9ecef'
    },
    modalTitle: {
      fontSize: 'var(--font-size-xl)',
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
    formGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      fontSize: 'var(--font-size-sm)',
      fontWeight: '600',
      color: '#495057',
      marginBottom: '8px'
    },
    input: {
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
    inputDisabled: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      backgroundColor: '#f8f9fa',
      color: '#6c757d',
      cursor: 'not-allowed',
      boxSizing: 'border-box'
    },
    inputFocus: {
      borderColor: '#007bff',
      boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.1)'
    },
    select: {
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
    selectDisabled: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      backgroundColor: '#f8f9fa',
      color: '#6c757d',
      cursor: 'not-allowed',
      boxSizing: 'border-box'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      backgroundColor: '#fff',
      color: '#495057',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box'
    },
    textareaDisabled: {
      width: '100%',
      padding: '12px 16px',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      backgroundColor: '#f8f9fa',
      color: '#6c757d',
      minHeight: '80px',
      resize: 'none',
      fontFamily: 'inherit',
      cursor: 'not-allowed',
      boxSizing: 'border-box'
    },
    modalActions: {
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
    deleteBtn: {
      backgroundColor: '#dc3545',
      color: '#fff'
    },
    saveBtn: {
      backgroundColor: '#28a745',
      color: '#fff'
    },
    cancelBtn: {
      backgroundColor: '#6c757d',
      color: '#fff'
    },
    consultationLogBtn: {
      backgroundColor: '#17a2b8',
      color: '#fff'
    },
    messageBtn: {
      backgroundColor: '#6f42c1',
      color: '#fff'
    },
    noticeText: {
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '20px',
      color: '#856404',
      fontSize: 'var(--font-size-sm)',
      textAlign: 'center'
    },
    consultationLogStatus: {
      marginBottom: '20px'
    },
    statusLoading: {
      backgroundColor: '#e3f2fd',
      border: '1px solid #90caf9',
      color: '#1565c0',
      padding: '12px',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    statusCompleted: {
      backgroundColor: '#e8f5e8',
      border: '1px solid #81c784',
      color: '#2e7d32',
      padding: '12px',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    statusPending: {
      backgroundColor: '#fff3e0',
      border: '1px solid #ffb74d',
      color: '#ef6c00',
      padding: '12px',
      borderRadius: '8px',
      fontSize: 'var(--font-size-sm)',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    statusIcon: {
      fontSize: 'var(--font-size-base)'
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onDelete(event.id);
  };

  return (
    <div className="event-modal-overlay">
      <div className="event-modal-content">
        <div className="event-modal-header">
          <h2 className="mg-h3 mg-mb-0">{mode === 'add' ? '새 일정 추가' : '일정 수정'}</h2>
          <button className="mg-v2-modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* 상담사 안내 메시지 */}
          {isReadOnly && (
            <div className="mg-v2-text-sm mg-v2-color-warning mg-mb-md mg-p-sm mg-bg-warning-light mg-radius-md">
              ⚠️ 상담사는 일정을 수정할 수 없습니다. 상담일지 작성만 가능합니다.
            </div>
          )}

          {/* 상담일지 작성 상태 표시 */}
          {isReadOnly && (
            <div className="mg-p-md mg-bg-info-light mg-radius-md mg-mb-md">
              {consultationLogStatus.loading ? (
                <div className="mg-flex mg-align-center mg-gap-sm">
                  <span className="mg-v2-text-lg">⏳</span>
                  상담일지 상태 확인 중...
                </div>
              ) : consultationLogStatus.hasRecord ? (
                <div className="mg-flex mg-align-center mg-gap-sm mg-v2-color-success">
                  <span className="mg-v2-text-lg">✅</span>
                  상담일지가 작성되었습니다
                </div>
              ) : (
                <div className="mg-flex mg-align-center mg-gap-sm mg-v2-color-warning">
                  <span className="mg-v2-text-lg">⚠️</span>
                  상담일지를 작성해야 합니다
                </div>
              )}
            </div>
          )}
          
          <div style={styles.formGroup}>
            <label style={styles.label}>제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              style={isReadOnly ? styles.inputDisabled : styles.input}
              disabled={isReadOnly}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>시작 시간</label>
            <input
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({...formData, start: e.target.value})}
              style={isReadOnly ? styles.inputDisabled : styles.input}
              disabled={isReadOnly}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>종료 시간</label>
            <input
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({...formData, end: e.target.value})}
              style={isReadOnly ? styles.inputDisabled : styles.input}
              disabled={isReadOnly}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>내담자 이름</label>
            <input
              type="text"
              value={formData.clientName || '미지정'}
              style={isReadOnly ? styles.inputDisabled : styles.input}
              disabled={true}
              readOnly
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>상담 유형</label>
            <input
              type="text"
              value={formData.consultationType || '미지정'}
              style={isReadOnly ? styles.inputDisabled : styles.input}
              disabled={true}
              readOnly
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>메모</label>
            <textarea
              value={formData.notes || '메모 없음'}
              rows="3"
              style={isReadOnly ? styles.textareaDisabled : styles.textarea}
              disabled={true}
              readOnly
            />
          </div>
          
          <div style={styles.modalActions}>
            {/* 상담사일 때 상담일지 작성 버튼 표시 */}
            {isReadOnly && (
              <button 
                type="button" 
                style={{...styles.button, ...styles.consultationLogBtn}} 
                onClick={handleWriteConsultationLog}
              >
                {consultationLogStatus.hasRecord ? '📝 상담일지 수정' : '📝 상담일지 작성'}
              </button>
            )}

            {/* 상담사일 때 메시지 전송 버튼 표시 */}
            {isReadOnly && event?.extendedProps?.clientId && (
              <button 
                type="button" 
                style={{...styles.button, ...styles.messageBtn}} 
                onClick={handleSendMessage}
              >
                💬 메시지 보내기
              </button>
            )}
            
            {/* 관리자일 때만 수정/삭제 버튼 표시 */}
            {!isReadOnly && mode === 'edit' && (
              <button 
                type="button" 
                style={{...styles.button, ...styles.deleteBtn}} 
                onClick={handleDelete}
              >
                삭제
              </button>
            )}
            {!isReadOnly && (
              <button 
                type="submit" 
                style={{...styles.button, ...styles.saveBtn}}
              >
                {mode === 'add' ? '추가' : '수정'}
              </button>
            )}
            <button 
              type="button" 
              style={{...styles.button, ...styles.cancelBtn}} 
              onClick={onClose}
            >
              취소
            </button>
          </div>
        </form>
      </div>
      
      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="일정 삭제"
        message="정말로 이 일정을 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        type="danger"
      />

      {/* 메시지 전송 모달 */}
      {isMessageModalOpen && event?.extendedProps?.clientId && (
        <MessageSendModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          clientData={{
            id: event.extendedProps.clientId,
            name: event.extendedProps.clientName || '미지정'
          }}
          scheduleData={{
            id: event.id,
            title: event.title,
            startTime: event.start,
            endTime: event.end,
            consultationType: event.extendedProps?.consultationType || '미지정'
          }}
          onSend={handleMessageSent}
        />
      )}
    </div>
  );
};

export default EventModal;
