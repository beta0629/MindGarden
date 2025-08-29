import React, { useState } from 'react';
import ProfileImageUpload from './ProfileImageUpload';
import AddressInput from './AddressInput';
import './ProfileSection.css';

const ProfileSection = ({ 
  user, 
  formData, 
  onFormDataChange, 
  onSave,
  formatPhoneNumber
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 휴대폰 번호 자동 하이픈 포맷팅
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      onFormDataChange(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      onFormDataChange(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };



  const handleImageChange = (newImage) => {
    onFormDataChange(prev => ({
      ...prev,
      profileImage: newImage
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(e, formData);
      setIsEditing(false);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    }
  };

  return (
    <div className="mypage-section">
      <div className="section-header">
        <h2>프로필 정보</h2>
        <button
          className="edit-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? '취소' : '수정'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <ProfileImageUpload
          profileImage={formData.profileImage}
          onImageChange={handleImageChange}
          isEditing={isEditing}
        />

        <div className="form-group">
          <label>이름</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
        </div>

        <div className="form-group">
          <label>닉네임</label>
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleInputChange}
            disabled={!isEditing}
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
          />
        </div>

        <div className="form-group">
          <label>휴대폰 번호</label>
          <input
            type="tel"
            name="phone"
            value={formatPhoneNumber(formData.phone)}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="010-0000-0000"
          />
        </div>

        <div className="form-group">
          <label>성별</label>
          <select
            name="gender"
            value={formData.gender || ''}
            onChange={handleInputChange}
            disabled={!isEditing}
          >
            <option value="">선택하세요</option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
            <option value="OTHER">기타</option>
          </select>
        </div>

        <AddressInput
          postalCode={formData.postalCode}
          address={formData.address}
          addressDetail={formData.addressDetail}
          onAddressChange={(addressData) => {
            onFormDataChange(prev => ({
              ...prev,
              ...addressData
            }));
          }}
          isEditing={isEditing}
        />

        {isEditing && (
          <div className="form-actions">
            <button type="submit" className="save-btn">
              저장
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileSection;
