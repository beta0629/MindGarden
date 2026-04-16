import React, { useState } from 'react';
import { User, Mail, Phone, Home, MapPin, MessageSquare, AlertCircle, FileText } from 'lucide-react';
import UnifiedModal from '../common/modals/UnifiedModal';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
// 내담자 상세 정보 모달 컴포넌트
const ClientDetailModal = ({ client, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    age: client?.age || '',
    phone: client?.phone || '',
    email: client?.email || '',
    address: client?.address || '',
    addressDetail: client?.addressDetail || '',
    postalCode: client?.postalCode || '',
    consultationPurpose: client?.consultationPurpose || '',
    consultationHistory: client?.consultationHistory || '',
    emergencyContact: client?.emergencyContact || '',
    emergencyPhone: client?.emergencyPhone || '',
    notes: client?.notes || ''
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: client?.name || '',
      age: client?.age || '',
      phone: client?.phone || '',
      email: client?.email || '',
      address: client?.address || '',
      addressDetail: client?.addressDetail || '',
      postalCode: client?.postalCode || '',
      consultationPurpose: client?.consultationPurpose || '',
      consultationHistory: client?.consultationHistory || '',
      emergencyContact: client?.emergencyContact || '',
      emergencyPhone: client?.emergencyPhone || '',
      notes: client?.notes || ''
    });
  };

  if (!isOpen) return null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="내담자 상세 정보"
      size="large"
      backdropClick={true}
      showCloseButton={true}
      actions={
        isEditing ? (
          <>
            <MGButton
              variant="outline"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleCancel}
              preventDoubleClick={false}
            >
              취소
            </MGButton>
            <MGButton
              variant="primary"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleSave}
              preventDoubleClick={false}
            >
              저장
            </MGButton>
          </>
        ) : (
          <>
            <MGButton
              variant="outline"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={onClose}
              preventDoubleClick={false}
            >
              닫기
            </MGButton>
            <MGButton
              variant="primary"
              size="medium"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleEdit}
              preventDoubleClick={false}
            >
              수정
            </MGButton>
          </>
        )
      }
    >
          <div className="mg-v2-form-sections">
            {/* 기본 정보 */}
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title">
                <User size={20} className="mg-v2-section-title-icon" />
                기본 정보
              </h3>
              <div className="mg-v2-form-row">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">이름 <span className="mg-v2-form-label-required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mg-v2-form-input"
                  />
                </div>
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">나이</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mg-v2-form-input"
                  />
                </div>
              </div>
              
              <div className="mg-v2-form-row">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">
                    <Phone size={16} className="mg-v2-form-label-icon" />
                    전화번호
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mg-v2-form-input"
                  />
                </div>
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">
                    <Mail size={16} className="mg-v2-form-label-icon" />
                    이메일
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mg-v2-form-input"
                  />
                </div>
              </div>
            </div>

            {/* 주소 정보 */}
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title">
                <Home size={20} className="mg-v2-section-title-icon" />
                주소 정보
              </h3>
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">
                  <MapPin size={16} className="mg-v2-form-label-icon" />
                  주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mg-v2-form-input"
                  placeholder="기본 주소"
                />
              </div>
              
              <div className="mg-v2-form-row">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">상세 주소</label>
                  <input
                    type="text"
                    name="addressDetail"
                    value={formData.addressDetail}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mg-v2-form-input"
                  />
                </div>
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">우편번호</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mg-v2-form-input"
                  />
                </div>
              </div>
            </div>
            
            {/* 상담 정보 */}
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title">
                <MessageSquare size={20} className="mg-v2-section-title-icon" />
                상담 정보
              </h3>
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">상담 목적</label>
                <textarea
                  name="consultationPurpose"
                  value={formData.consultationPurpose}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mg-v2-form-textarea"
                  rows="3"
                  placeholder="상담을 받는 목적을 입력하세요"
                />
              </div>
              
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">상담 이력</label>
                <textarea
                  name="consultationHistory"
                  value={formData.consultationHistory}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mg-v2-form-textarea"
                  rows="3"
                  placeholder="이전 상담 이력을 입력하세요"
                />
              </div>
            </div>
            
            {/* 비상 연락처 */}
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title">
                <AlertCircle size={20} className="mg-v2-section-title-icon" />
                비상 연락처
              </h3>
              <div className="mg-v2-form-row">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">비상 연락처</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mg-v2-form-input"
                  />
                </div>
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">비상 연락처 전화번호</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mg-v2-form-input"
                  />
                </div>
              </div>
            </div>
            
            {/* 메모 */}
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title">
                <FileText size={20} className="mg-v2-section-title-icon" />
                메모
              </h3>
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">기타 메모</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="mg-v2-form-textarea"
                  rows="3"
                  placeholder="기타 참고사항을 입력하세요"
                />
              </div>
            </div>
          </div>
    </UnifiedModal>
  );
};

export default ClientDetailModal;
