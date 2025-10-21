import React, { useState, useEffect } from 'react';
import './ConsultantTransferModal.css';
import notificationManager from '../../../utils/notification';

/**
 * 상담사 변경 모달 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {Object} props.currentMapping - 현재 매핑 정보
 * @param {Function} props.onTransfer - 상담사 변경 처리 함수
 */
const ConsultantTransferModal = ({ 
  isOpen, 
  onClose, 
  currentMapping, 
  onTransfer 
}) => {
  const [formData, setFormData] = useState({
    newConsultantId: '',
    transferReason: '',
    specialConsiderations: '',
    totalSessions: '',
    remainingSessions: '',
    packageName: '',
    packagePrice: ''
  });
  
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 상담사 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadConsultants();
      // 현재 매핑 정보로 폼 초기화
      if (currentMapping) {
        setFormData({
          newConsultantId: '',
          transferReason: '',
          specialConsiderations: currentMapping.specialConsiderations || '',
          totalSessions: currentMapping.remainingSessions || '',
          remainingSessions: currentMapping.remainingSessions || '',
          packageName: currentMapping.packageName || '',
          packagePrice: currentMapping.packagePrice || ''
        });
      }
    }
  }, [isOpen, currentMapping]);

  // 상담사 목록 로드
  const loadConsultants = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/admin/consultants/with-vacation?date=${today}`);
      const data = await response.json();
      
      if (data.success) {
        // 현재 상담사 제외
        const filteredConsultants = data.data.filter(
          consultant => consultant.id !== currentMapping?.consultantId
        );
        setConsultants(filteredConsultants);
      }
    } catch (error) {
      console.error('상담사 목록 로드 실패:', error);
    }
  };

  // 폼 입력 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.newConsultantId) {
      newErrors.newConsultantId = '새 상담사를 선택해주세요.';
    }
    
    if (!formData.transferReason.trim()) {
      newErrors.transferReason = '변경 사유를 입력해주세요.';
    }
    
    if (formData.totalSessions && (isNaN(formData.totalSessions) || formData.totalSessions < 1)) {
      newErrors.totalSessions = '총 회기수는 1 이상의 숫자여야 합니다.';
    }
    
    if (formData.remainingSessions && (isNaN(formData.remainingSessions) || formData.remainingSessions < 0)) {
      newErrors.remainingSessions = '남은 회기수는 0 이상의 숫자여야 합니다.';
    }
    
    if (formData.packagePrice && (isNaN(formData.packagePrice) || formData.packagePrice < 0)) {
      newErrors.packagePrice = '패키지 가격은 0 이상의 숫자여야 합니다.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 상담사 변경 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const transferData = {
        currentMappingId: currentMapping.id,
        newConsultantId: parseInt(formData.newConsultantId),
        transferReason: formData.transferReason.trim(),
        specialConsiderations: formData.specialConsiderations.trim(),
        transferredBy: '관리자', // 실제로는 현재 로그인한 관리자 정보
        totalSessions: formData.totalSessions ? parseInt(formData.totalSessions) : null,
        remainingSessions: formData.remainingSessions ? parseInt(formData.remainingSessions) : null,
        packageName: formData.packageName.trim() || null,
        packagePrice: formData.packagePrice ? parseInt(formData.packagePrice) : null
      };
      
      const response = await fetch('/api/admin/mappings/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        notificationManager.show('상담사가 성공적으로 변경되었습니다.', 'info');
        onTransfer(result.data);
        onClose();
      } else {
        notificationManager.show(`상담사 변경에 실패했습니다: ${result.message}`, 'info');
      }
    } catch (error) {
      console.error('상담사 변경 실패:', error);
      notificationManager.show('상담사 변경 중 오류가 발생했습니다.', 'info');
    } finally {
      setLoading(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setFormData({
      newConsultantId: '',
      transferReason: '',
      specialConsiderations: '',
      totalSessions: '',
      remainingSessions: '',
      packageName: '',
      packagePrice: ''
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="transfer-modal-overlay">
      <div className="transfer-modal">
        <div className="transfer-modal-header">
          <h2 className="transfer-modal-title">상담사 변경</h2>
          <button 
            type="button" 
            className="transfer-modal-close"
            onClick={handleClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        
        <div className="transfer-modal-content">
          {/* 현재 매핑 정보 */}
          {currentMapping && (
            <div className="transfer-current-info">
              <h3 className="transfer-section-title">현재 매핑 정보</h3>
              <div className="transfer-info-card">
                <div className="transfer-info-item">
                  <span className="transfer-info-label">내담자:</span>
                  <span className="transfer-info-value">{currentMapping.clientName}</span>
                </div>
                <div className="transfer-info-item">
                  <span className="transfer-info-label">현재 상담사:</span>
                  <span className="transfer-info-value">{currentMapping.consultantName}</span>
                </div>
                <div className="transfer-info-item">
                  <span className="transfer-info-label">남은 회기수:</span>
                  <span className="transfer-info-value">{currentMapping.remainingSessions}회</span>
                </div>
                <div className="transfer-info-item">
                  <span className="transfer-info-label">패키지:</span>
                  <span className="transfer-info-value">{currentMapping.packageName}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* 상담사 변경 폼 */}
          <form onSubmit={handleSubmit} className="transfer-form">
            <h3 className="transfer-section-title">변경 정보 입력</h3>
            
            {/* 새 상담사 선택 */}
            <div className="transfer-form-group">
              <label htmlFor="newConsultantId" className="transfer-form-label">
                새 상담사 <span className="required">*</span>
              </label>
              <select
                id="newConsultantId"
                name="newConsultantId"
                value={formData.newConsultantId}
                onChange={handleInputChange}
                className={`transfer-form-select ${errors.newConsultantId ? 'error' : ''}`}
                required
              >
                <option value="">상담사를 선택해주세요</option>
                {consultants.map(consultant => (
                  <option key={consultant.id} value={consultant.id}>
                    {consultant.name} ({consultant.email})
                  </option>
                ))}
              </select>
              {errors.newConsultantId && (
                <span className="transfer-form-error">{errors.newConsultantId}</span>
              )}
            </div>
            
            {/* 변경 사유 */}
            <div className="transfer-form-group">
              <label htmlFor="transferReason" className="transfer-form-label">
                변경 사유 <span className="required">*</span>
              </label>
              <textarea
                id="transferReason"
                name="transferReason"
                value={formData.transferReason}
                onChange={handleInputChange}
                className={`transfer-form-textarea ${errors.transferReason ? 'error' : ''}`}
                placeholder="상담사 변경 사유를 입력해주세요"
                required
              />
              {errors.transferReason && (
                <span className="transfer-form-error">{errors.transferReason}</span>
              )}
            </div>
            
            {/* 특별 고려사항 */}
            <div className="transfer-form-group">
              <label htmlFor="specialConsiderations" className="transfer-form-label">
                특별 고려사항
              </label>
              <textarea
                id="specialConsiderations"
                name="specialConsiderations"
                value={formData.specialConsiderations}
                onChange={handleInputChange}
                className="transfer-form-textarea"
                placeholder="새 상담사에게 전달할 특별 고려사항이 있다면 입력해주세요"
              />
            </div>
            
            {/* 회기수 설정 */}
            <div className="transfer-form-row">
              <div className="transfer-form-group">
                <label htmlFor="totalSessions" className="transfer-form-label">
                  총 회기수
                </label>
                <input
                  type="number"
                  id="totalSessions"
                  name="totalSessions"
                  value={formData.totalSessions}
                  onChange={handleInputChange}
                  className={`transfer-form-input ${errors.totalSessions ? 'error' : ''}`}
                  placeholder="기본값: 현재 남은 회기수"
                  min="1"
                />
                {errors.totalSessions && (
                  <span className="transfer-form-error">{errors.totalSessions}</span>
                )}
              </div>
              
              <div className="transfer-form-group">
                <label htmlFor="remainingSessions" className="transfer-form-label">
                  남은 회기수
                </label>
                <input
                  type="number"
                  id="remainingSessions"
                  name="remainingSessions"
                  value={formData.remainingSessions}
                  onChange={handleInputChange}
                  className={`transfer-form-input ${errors.remainingSessions ? 'error' : ''}`}
                  placeholder="기본값: 현재 남은 회기수"
                  min="0"
                />
                {errors.remainingSessions && (
                  <span className="transfer-form-error">{errors.remainingSessions}</span>
                )}
              </div>
            </div>
            
            {/* 패키지 정보 */}
            <div className="transfer-form-row">
              <div className="transfer-form-group">
                <label htmlFor="packageName" className="transfer-form-label">
                  패키지명
                </label>
                <input
                  type="text"
                  id="packageName"
                  name="packageName"
                  value={formData.packageName}
                  onChange={handleInputChange}
                  className="transfer-form-input"
                  placeholder="기본값: 현재 패키지명"
                />
              </div>
              
              <div className="transfer-form-group">
                <label htmlFor="packagePrice" className="transfer-form-label">
                  패키지 가격
                </label>
                <input
                  type="number"
                  id="packagePrice"
                  name="packagePrice"
                  value={formData.packagePrice}
                  onChange={handleInputChange}
                  className={`transfer-form-input ${errors.packagePrice ? 'error' : ''}`}
                  placeholder="기본값: 현재 패키지 가격"
                  min="0"
                />
                {errors.packagePrice && (
                  <span className="transfer-form-error">{errors.packagePrice}</span>
                )}
              </div>
            </div>
          </form>
        </div>
        
        <div className="transfer-modal-footer">
          <button
            type="button"
            className="transfer-btn transfer-btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="submit"
            className="transfer-btn transfer-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '변경 중...' : '상담사 변경'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultantTransferModal;
