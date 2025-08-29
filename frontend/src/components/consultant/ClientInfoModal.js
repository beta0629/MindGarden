import React, { useState, useEffect } from 'react';
import './ClientInfoModal.css';

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

  return (
    <div className="modal-overlay">
      <div className="modal-content client-info-modal">
        <div className="modal-header">
          <h2>
            {mode === 'add' ? '새 내담자 등록' : 
             mode === 'edit' ? '내담자 정보 수정' : '내담자 정보'}
          </h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-sections">
            {/* 기본 정보 섹션 */}
            <div className="form-section">
              <h3 className="section-title">📋 기본 정보</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>이름 *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="내담자 이름"
                  />
                </div>
                <div className="form-group">
                  <label>나이</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="나이"
                    min="1"
                    max="120"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>연락처</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="form-group">
                  <label>이메일</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            {/* 주소 정보 섹션 */}
            <div className="form-section">
              <h3 className="section-title">🏠 주소 정보</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>우편번호</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="우편번호"
                  />
                </div>
                <div className="form-group">
                  <label>주소</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="기본 주소"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>상세주소</label>
                <input
                  type="text"
                  name="addressDetail"
                  value={formData.addressDetail}
                  onChange={handleInputChange}
                  disabled={!isEditing && mode !== 'add'}
                  placeholder="상세 주소"
                />
              </div>
            </div>

            {/* 상담 정보 섹션 */}
            <div className="form-section">
              <h3 className="section-title">💭 상담 정보</h3>
              <div className="form-group">
                <label>상담 목적 *</label>
                <textarea
                  name="consultationPurpose"
                  value={formData.consultationPurpose}
                  onChange={handleInputChange}
                  required
                  disabled={!isEditing && mode !== 'add'}
                  placeholder="어떤 문제로 상담을 원하시나요? (예: 스트레스, 관계 문제, 직장 문제 등)"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>상담 이력</label>
                <textarea
                  name="consultationHistory"
                  value={formData.consultationHistory}
                  onChange={handleInputChange}
                  disabled={!isEditing && mode !== 'add'}
                  placeholder="이전 상담 경험이나 치료 이력이 있다면 기록해주세요"
                  rows="3"
                />
              </div>
            </div>

            {/* 비상연락처 섹션 */}
            <div className="form-section">
              <h3 className="section-title">🚨 비상연락처</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>비상연락처 이름</label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="비상시 연락할 사람"
                  />
                </div>
                <div className="form-group">
                  <label>비상연락처 번호</label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    disabled={!isEditing && mode !== 'add'}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>

            {/* 메모 섹션 */}
            <div className="form-section">
              <h3 className="section-title">📝 메모</h3>
              <div className="form-group">
                <label>추가 메모</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={!isEditing && mode !== 'add'}
                  placeholder="내담자에 대한 추가 정보나 특이사항을 기록해주세요"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="modal-actions">
            {mode === 'view' && (
              <button 
                type="button" 
                className="edit-btn"
                onClick={handleEdit}
              >
                수정
              </button>
            )}
            {(mode === 'add' || isEditing) && (
              <>
                <button type="submit" className="save-btn">
                  {mode === 'add' ? '등록' : '저장'}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={handleCancel}
                  >
                    취소
                  </button>
                )}
              </>
            )}
            <button type="button" className="close-btn-secondary" onClick={onClose}>
              닫기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientInfoModal;
