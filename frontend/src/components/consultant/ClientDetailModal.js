import React, { useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';

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
    <div className="modal-overlay">
      <div className="modal-content client-detail-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="bi bi-person-circle"></i>
            내담자 상세 정보
          </h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="client-detail-form">
            <div className="form-row">
              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>나이</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>전화번호</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>주소</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-control"
                placeholder="기본 주소"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>상세 주소</label>
                <input
                  type="text"
                  name="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>우편번호</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>상담 목적</label>
              <textarea
                name="consultationPurpose"
                value={formData.consultationPurpose}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-control"
                rows="3"
                placeholder="상담을 받는 목적을 입력하세요"
              />
            </div>
            
            <div className="form-group">
              <label>상담 이력</label>
              <textarea
                name="consultationHistory"
                value={formData.consultationHistory}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-control"
                rows="3"
                placeholder="이전 상담 이력을 입력하세요"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>비상 연락처</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>비상 연락처 전화번호</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>기타 메모</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="form-control"
                rows="3"
                placeholder="기타 참고사항을 입력하세요"
              />
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          {isEditing ? (
            <>
              <button className="btn btn-secondary" onClick={handleCancel}>
                <i className="bi bi-x-circle"></i>
                취소
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                <i className="bi bi-check-circle"></i>
                저장
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                <i className="bi bi-x-circle"></i>
                닫기
              </button>
              <button className="btn btn-primary" onClick={handleEdit}>
                <i className="bi bi-pencil"></i>
                수정
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;
