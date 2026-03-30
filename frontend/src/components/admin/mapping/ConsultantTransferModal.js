import React, { useState, useEffect } from 'react';
import { XCircle, Users, Package, Calendar } from 'lucide-react';
import notificationManager from '../../../utils/notification';
import { toErrorMessage, toDisplayString } from '../../../utils/safeDisplay';
import SafeText from '../../common/SafeText';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import CustomSelect from '../../common/CustomSelect';
/**
 * 상담사 변경 모달 컴포넌트
/**
 * 
/**
 * @param {Object} props - 컴포넌트 props
/**
 * @param {boolean} props.isOpen - 모달 열림 상태
/**
 * @param {Function} props.onClose - 모달 닫기 함수
/**
 * @param {Object} props.currentMapping - 현재 매핑 정보
/**
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
      
      const response = await fetch('/api/v1/admin/mappings/transfer', {
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
        notificationManager.show(`상담사 변경에 실패했습니다: ${toErrorMessage(result)}`, 'info');
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
        <UnifiedModal
          isOpen={isOpen}
          onClose={handleClose}
          title="상담사 변경"
          size="large"
          className="mg-v2-ad-b0kla"
          backdropClick
          showCloseButton
          loading={loading}
          actions={
            <>
              <MGButton
                type="button"
                variant="outline"
                size="medium"
                onClick={handleClose}
                disabled={loading}
                preventDoubleClick={false}
              >
                <XCircle size={18} />
                취소
              </MGButton>
              <MGButton
                type="button"
                variant="primary"
                size="medium"
                onClick={handleSubmit}
                disabled={loading}
                loading={loading}
                loadingText="변경 중..."
                preventDoubleClick
              >
                상담사 변경
              </MGButton>
            </>
          }
        >
        
        <div className="mg-v2-modal-body">
          {/* 현재 매핑 정보 */}
          {currentMapping && (
            <div className="mg-v2-ad-b0kla__card mg-v2-info-box">
              <h3 className="mg-v2-info-box-title">
                <Users size={20} className="mg-v2-section-title-icon" />
                현재 매핑 정보
              </h3>
              <div className="mg-v2-info-grid">
                <div className="mg-v2-info-row">
                  <span className="mg-v2-info-label">내담자:</span>
                  <span className="mg-v2-info-value"><SafeText>{currentMapping.clientName}</SafeText></span>
                </div>
                <div className="mg-v2-info-row">
                  <span className="mg-v2-info-label">현재 상담사:</span>
                  <span className="mg-v2-info-value"><SafeText>{currentMapping.consultantName}</SafeText></span>
                </div>
                <div className="mg-v2-info-row">
                  <span className="mg-v2-info-label">남은 회기수:</span>
                  <span className="mg-v2-info-value"><Calendar size={16} className="mg-v2-icon-inline" /><SafeText>{currentMapping.remainingSessions}</SafeText>회</span>
                </div>
                <div className="mg-v2-info-row">
                  <span className="mg-v2-info-label">패키지:</span>
                  <span className="mg-v2-info-value"><Package size={16} className="mg-v2-icon-inline" /><SafeText>{currentMapping.packageName}</SafeText></span>
                </div>
              </div>
            </div>
          )}
          
          {/* 상담사 변경 폼 */}
          <form onSubmit={handleSubmit}>
            <h3 className="mg-v2-section-title">변경 정보 입력</h3>
            
            {/* 새 상담사 선택 */}
            <div className="mg-v2-form-group">
              <label htmlFor="newConsultantId" className="mg-v2-form-label">
                새 상담사 <span className="mg-v2-form-label-required">*</span>
              </label>
              <CustomSelect
                value={formData.newConsultantId ?? ''}
                onChange={(val) => {
                  setFormData(prev => ({ ...prev, newConsultantId: val }));
                  if (errors.newConsultantId) {
                    setErrors(prev => ({ ...prev, newConsultantId: '' }));
                  }
                }}
                options={[
                  { value: '', label: '상담사를 선택해주세요' },
                  ...consultants.map(consultant => ({
                    value: consultant.id,
                    label: `${toDisplayString(consultant.name)} (${toDisplayString(consultant.email)})`
                  }))
                ]}
                placeholder="상담사를 선택해주세요"
                className={`mg-v2-form-select ${errors.newConsultantId ? 'mg-v2-form-input-error' : ''}`}
                error={!!errors.newConsultantId}
              />
              {errors.newConsultantId && (
                <span className="mg-v2-form-error">{errors.newConsultantId}</span>
              )}
            </div>
            
            {/* 변경 사유 */}
            <div className="mg-v2-form-group">
              <label htmlFor="transferReason" className="mg-v2-form-label">
                변경 사유 <span className="mg-v2-form-label-required">*</span>
              </label>
              <textarea
                id="transferReason"
                name="transferReason"
                value={formData.transferReason}
                onChange={handleInputChange}
                className={`mg-v2-form-textarea ${errors.transferReason ? 'mg-v2-form-input-error' : ''}`}
                placeholder="상담사 변경 사유를 입력해주세요"
                required
              />
              {errors.transferReason && (
                <span className="mg-v2-form-error">{errors.transferReason}</span>
              )}
            </div>
            
            {/* 특별 고려사항 */}
            <div className="mg-v2-form-group">
              <label htmlFor="specialConsiderations" className="mg-v2-form-label">
                특별 고려사항
              </label>
              <textarea
                id="specialConsiderations"
                name="specialConsiderations"
                value={formData.specialConsiderations}
                onChange={handleInputChange}
                className="mg-v2-form-textarea"
                placeholder="새 상담사에게 전달할 특별 고려사항이 있다면 입력해주세요"
              />
            </div>
            
            {/* 회기수 설정 */}
            <div className="mg-v2-form-row">
              <div className="mg-v2-form-group">
                <label htmlFor="totalSessions" className="mg-v2-form-label">
                  총 회기수
                </label>
                <input
                  type="number"
                  id="totalSessions"
                  name="totalSessions"
                  value={formData.totalSessions}
                  onChange={handleInputChange}
                  className={`mg-v2-form-input ${errors.totalSessions ? 'mg-v2-form-input-error' : ''}`}
                  placeholder="기본값: 현재 남은 회기수"
                  min="1"
                />
                {errors.totalSessions && (
                  <span className="mg-v2-form-error">{errors.totalSessions}</span>
                )}
              </div>
              
              <div className="mg-v2-form-group">
                <label htmlFor="remainingSessions" className="mg-v2-form-label">
                  남은 회기수
                </label>
                <input
                  type="number"
                  id="remainingSessions"
                  name="remainingSessions"
                  value={formData.remainingSessions}
                  onChange={handleInputChange}
                  className={`mg-v2-form-input ${errors.remainingSessions ? 'mg-v2-form-input-error' : ''}`}
                  placeholder="기본값: 현재 남은 회기수"
                  min="0"
                />
                {errors.remainingSessions && (
                  <span className="mg-v2-form-error">{errors.remainingSessions}</span>
                )}
              </div>
            </div>
            
            {/* 패키지 정보 */}
            <div className="mg-v2-form-row">
              <div className="mg-v2-form-group">
                <label htmlFor="packageName" className="mg-v2-form-label">
                  패키지명
                </label>
                <input
                  type="text"
                  id="packageName"
                  name="packageName"
                  value={formData.packageName}
                  onChange={handleInputChange}
                  className="mg-v2-form-input"
                  placeholder="기본값: 현재 패키지명"
                />
              </div>
              
              <div className="mg-v2-form-group">
                <label htmlFor="packagePrice" className="mg-v2-form-label">
                  패키지 가격
                </label>
                <input
                  type="number"
                  id="packagePrice"
                  name="packagePrice"
                  value={formData.packagePrice}
                  onChange={handleInputChange}
                  className={`mg-v2-form-input ${errors.packagePrice ? 'mg-v2-form-input-error' : ''}`}
                  placeholder="기본값: 현재 패키지 가격"
                  min="0"
                />
                {errors.packagePrice && (
                  <span className="mg-v2-form-error">{errors.packagePrice}</span>
                )}
              </div>
            </div>
          </form>
        </div>
        </UnifiedModal>
  );
};

export default ConsultantTransferModal;
