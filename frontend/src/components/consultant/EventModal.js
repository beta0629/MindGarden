import React, { useState } from 'react';
import ConfirmModal from '../common/ConfirmModal';

// 일정 모달 컴포넌트
const EventModal = ({ event, mode, onSave, onDelete, onClose }) => {
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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{mode === 'add' ? '새 일정 추가' : '일정 수정'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>시작 시간</label>
            <input
              type="datetime-local"
              value={formData.start}
              onChange={(e) => setFormData({...formData, start: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>종료 시간</label>
            <input
              type="datetime-local"
              value={formData.end}
              onChange={(e) => setFormData({...formData, end: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label>내담자 이름</label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({...formData, clientName: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>상담 유형</label>
            <select
              value={formData.consultationType}
              onChange={(e) => setFormData({...formData, consultationType: e.target.value})}
            >
              <option value="">선택하세요</option>
              <option value="초기상담">초기상담</option>
              <option value="진행상담">진행상담</option>
              <option value="종결상담">종결상담</option>
              <option value="가족상담">가족상담</option>
              <option value="부부상담">부부상담</option>
              <option value="그룹상담">그룹상담</option>
              <option value="긴급상담">긴급상담</option>
              <option value="사후관리">사후관리</option>
              <option value="평가상담">평가상담</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>메모</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows="3"
            />
          </div>
          
          <div className="modal-actions">
            {mode === 'edit' && (
              <button type="button" className="delete-btn" onClick={handleDelete}>
                삭제
              </button>
            )}
            <button type="submit" className="save-btn">
              {mode === 'add' ? '추가' : '수정'}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
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
    </div>
  );
};

export default EventModal;
