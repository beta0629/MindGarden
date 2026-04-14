import React, { useState, useEffect } from 'react';
import { User, Home, MessageSquare, AlertCircle, FileText, Mail, Phone, UserPlus, MapPin } from 'lucide-react';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';

const ClientInfoModal = ({ client, isOpen, onClose, onSave, mode = 'view' }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    email: '',
    address: '',
    addressDetail: '',
    postalCode: '',
    consultationPurpose: '',
    consultationHistory: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        age: client.age || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        addressDetail: client.addressDetail || '',
        postalCode: client.postalCode || '',
        consultationPurpose: client.consultationPurpose || '',
        consultationHistory: client.consultationHistory || '',
        emergencyContact: client.emergencyContact || '',
        emergencyPhone: client.emergencyPhone || '',
        notes: client.notes || ''
      });
    }
  }, [client]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (client) {
      setFormData({
        name: client.name || '',
        age: client.age || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        addressDetail: client.addressDetail || '',
        postalCode: client.postalCode || '',
        consultationPurpose: client.consultationPurpose || '',
        consultationHistory: client.consultationHistory || '',
        emergencyContact: client.emergencyContact || '',
        emergencyPhone: client.emergencyPhone || '',
        notes: client.notes || ''
      });
    }
  };

  if (!isOpen) return null;

  const modalTitle = mode === 'add' ? '새 내담자 등록' : 
                     mode === 'edit' ? '내담자 정보 수정' : '내담자 정보';

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="large"
      backdropClick
      showCloseButton
      actions={
        <>
          {mode === 'view' && !isEditing && (
            <MGButton type="button" variant="primary" size="medium" onClick={handleEdit} preventDoubleClick={false}>
              수정
            </MGButton>
          )}
          {(mode === 'add' || isEditing) && (
            <>
              <MGButton type="submit" form="client-info-modal-form" variant="primary" size="medium" preventDoubleClick={false}>
                {mode === 'add' ? '등록' : '저장'}
              </MGButton>
              {isEditing && (
                <MGButton type="button" variant="outline" size="medium" onClick={handleCancel} preventDoubleClick={false}>
                  취소
                </MGButton>
              )}
            </>
          )}
          <MGButton type="button" variant="outline" size="medium" onClick={onClose} preventDoubleClick={false}>
            닫기
          </MGButton>
        </>
      }
    >
        <form id="client-info-modal-form" onSubmit={handleSubmit} className="mg-v2-modal-body">
          <div className="mg-v2-form-sections">
            {/* 기본 정보 섹션 */}
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
                    required
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="내담자 이름"
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
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="나이"
                    min="1"
                    max="120"
                    className="mg-v2-form-input"
                  />
                </div>
              </div>

              <div className="mg-v2-form-row">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">
                    <Phone size={16} className="mg-v2-form-label-icon" />
                    연락처
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="010-0000-0000"
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
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="email@example.com"
                    className="mg-v2-form-input"
                  />
                </div>
              </div>
            </div>

            {/* 주소 정보 섹션 */}
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title">
                <Home size={20} className="mg-v2-section-title-icon" />
                주소 정보
              </h3>
              <div className="mg-v2-form-row">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">우편번호</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="우편번호"
                    className="mg-v2-form-input"
                  />
                </div>
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
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="기본 주소"
                    className="mg-v2-form-input"
                  />
                </div>
              </div>
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">상세주소</label>
                <input
                  type="text"
                  name="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleInputChange}
                  disabled={!isEditing && mode !== 'add'}
                  placeholder="상세 주소"
                  className="mg-v2-form-input"
                />
              </div>
            </div>

            {/* 상담 정보 섹션 */}
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title">
                <MessageSquare size={20} className="mg-v2-section-title-icon" />
                상담 정보
              </h3>
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">상담 목적 <span className="mg-v2-form-label-required">*</span></label>
                <textarea
                  name="consultationPurpose"
                  value={formData.consultationPurpose}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing && mode !== 'add'}
                  placeholder="어떤 문제로 상담을 원하시나요? (예: 스트레스, 관계 문제, 직장 문제 등)"
                  rows="3"
                  className="mg-v2-form-textarea"
                />
              </div>
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">상담 이력</label>
                <textarea
                  name="consultationHistory"
                  value={formData.consultationHistory}
                  onChange={handleInputChange}
                  disabled={!isEditing && mode !== 'add'}
                  placeholder="이전 상담 경험이나 치료 이력이 있다면 기록해주세요"
                  rows="3"
                  className="mg-v2-form-textarea"
                />
              </div>
            </div>

            {/* 비상연락처 섹션 */}
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title">
                <AlertCircle size={20} className="mg-v2-section-title-icon" />
                비상연락처
              </h3>
              <div className="mg-v2-form-row">
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">비상연락처 이름</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="비상시 연락할 사람"
                    className="mg-v2-form-input"
                  />
                </div>
                <div className="mg-v2-form-group">
                  <label className="mg-v2-form-label">비상연락처 번호</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="010-0000-0000"
                    className="mg-v2-form-input"
                  />
                </div>
              </div>
            </div>

            {/* 메모 섹션 */}
            <div className="mg-v2-form-section">
              <h3 className="mg-v2-section-title">
                <FileText size={20} className="mg-v2-section-title-icon" />
                메모
              </h3>
              <div className="mg-v2-form-group">
                <label className="mg-v2-form-label">추가 메모</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={!isEditing && mode !== 'add'}
                  placeholder="내담자에 대한 추가 정보나 특이사항을 기록해주세요"
                  rows="3"
                  className="mg-v2-form-textarea"
                />
              </div>
            </div>
          </div>
        </form>
    </UnifiedModal>
  );
};

export default ClientInfoModal;
