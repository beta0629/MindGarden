import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Calendar, XCircle, Save, Trash2, FileText, MessageSquare, AlertTriangle } from 'lucide-react';
import UnifiedLoading from '../common/UnifiedLoading';
import ConfirmModal from '../common/ConfirmModal';
import MessageSendModal from './MessageSendModal';
import MGButton from '../common/MGButton';
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

  if (!event) return null;
  
  const portalTarget = document.body || document.createElement('div');

  return ReactDOM.createPortal(
    <div className="mg-v2-modal-overlay" onClick={onClose}>
      <div className="mg-v2-modal mg-v2-modal-medium" onClick={(e) => e.stopPropagation()}>
        <div className="mg-v2-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <Calendar size={28} className="mg-v2-modal-title-icon" />
            <h2 className="mg-v2-modal-title">{mode === 'add' ? '새 일정 추가' : '일정 수정'}</h2>
          </div>
          <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
            <XCircle size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="mg-v2-modal-body">
          {/* 상담사 안내 메시지 */}
          {isReadOnly && (
            <div className="mg-v2-alert mg-v2-alert--warning mg-v2-mb-md">
              <AlertTriangle size={20} className="mg-v2-section-title-icon" />
              상담사는 일정을 수정할 수 없습니다. 상담일지 작성만 가능합니다.
            </div>
          )}

          {/* 상담일지 작성 상태 표시 */}
          {isReadOnly && (
            <div className="mg-v2-info-box mg-v2-mb-md">
              {consultationLogStatus.loading ? (
                <div className="mg-v2-info-box-title">
                  <span className="mg-v2-text-lg">⏳</span>
                  상담일지 상태 확인 중...
                </div>
              ) : consultationLogStatus.hasRecord ? (
                <div className="mg-v2-info-box-title mg-v2-color-success">
                  <span className="mg-v2-text-lg">✅</span>
                  상담일지가 작성되었습니다
                </div>
              ) : (
                <div className="mg-v2-info-box-title mg-v2-color-warning">
                  <span className="mg-v2-text-lg">⚠️</span>
                  상담일지를 작성해야 합니다
                </div>
              )}
            </div>
          )}
          
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className={`mg-v2-form-input ${isReadOnly ? 'mg-v2-form-input--disabled' : ''}`}
              disabled={isReadOnly}
              required
            />
          </div>
          
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">시작 시간</label>
            <input
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({...formData, start: e.target.value})}
              className={`mg-v2-form-input ${isReadOnly ? 'mg-v2-form-input--disabled' : ''}`}
              disabled={isReadOnly}
              required
            />
          </div>
          
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">종료 시간</label>
            <input
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({...formData, end: e.target.value})}
              className={`mg-v2-form-input ${isReadOnly ? 'mg-v2-form-input--disabled' : ''}`}
              disabled={isReadOnly}
              required
            />
          </div>
          
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">내담자 이름</label>
            <input
              type="text"
              value={formData.clientName || '미지정'}
              className="mg-v2-form-input mg-v2-form-input--disabled"
              disabled={true}
              readOnly
            />
          </div>
          
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">상담 유형</label>
            <input
              type="text"
              value={formData.consultationType || '미지정'}
              className="mg-v2-form-input mg-v2-form-input--disabled"
              disabled={true}
              readOnly
            />
          </div>
          
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">메모</label>
            <textarea
              value={formData.notes || '메모 없음'}
              rows="3"
              className="mg-v2-form-textarea mg-v2-form-textarea--disabled"
              disabled={true}
              readOnly
            />
          </div>
          
          <div className="mg-v2-modal-footer">
            {/* 상담사일 때 상담일지 작성 버튼 표시 */}
            {isReadOnly && (
              <MGButton 
                type="button" 
                variant="info"
                onClick={handleWriteConsultationLog}
              >
                <FileText size={20} className="mg-v2-icon-inline" />
                {consultationLogStatus.hasRecord ? '상담일지 수정' : '상담일지 작성'}
              </MGButton>
            )}

            {/* 상담사일 때 메시지 전송 버튼 표시 */}
            {isReadOnly && event?.extendedProps?.clientId && (
              <MGButton 
                type="button" 
                variant="info"
                onClick={handleSendMessage}
              >
                <MessageSquare size={20} className="mg-v2-icon-inline" />
                메시지 보내기
              </MGButton>
            )}
            
            {/* 관리자일 때만 수정/삭제 버튼 표시 */}
            {!isReadOnly && mode === 'edit' && (
              <MGButton 
                type="button" 
                variant="danger"
                onClick={handleDelete}
              >
                <Trash2 size={20} className="mg-v2-icon-inline" />
                삭제
              </MGButton>
            )}
            {!isReadOnly && (
              <MGButton 
                type="submit" 
                variant="success"
              >
                <Save size={20} className="mg-v2-icon-inline" />
                {mode === 'add' ? '추가' : '수정'}
              </MGButton>
            )}
            <MGButton 
              type="button" 
              variant="secondary"
              onClick={onClose}
            >
              <XCircle size={20} className="mg-v2-icon-inline" />
              취소
            </MGButton>
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
    </div>,
    portalTarget
  );
};

export default EventModal;
