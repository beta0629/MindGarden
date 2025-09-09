import React, { useState } from 'react';
import ProfileImageUpload from './ProfileImageUpload';
import AddressInput from './AddressInput';
import './ProfileSection.css';

const ProfileSection = ({ 
  user, 
  formData, 
  onFormDataChange, 
  onUserChange,
  onSave, // Added back for auto-save
  formatPhoneNumber,
  onEditingChange // 수정 모드 상태 변경 콜백 추가
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
    console.log('🖼️ ProfileSection handleImageChange 호출:', newImage ? newImage.substring(0, 50) + '...' : 'null');
    
    // 이미지 삭제 시 기본 아바타로 복원
    if (newImage === null) {
      console.log('🗑️ 이미지 삭제 - 기본 아바타로 복원');
      const imageToSet = '/default-avatar.svg';
      const imageTypeToSet = 'DEFAULT_ICON';
      
      // formData 업데이트 (기본 아바타로 복원)
      onFormDataChange(prev => {
        const updatedData = {
          ...prev,
          profileImage: imageToSet,
          profileImageType: imageTypeToSet
        };
        console.log('✅ ProfileSection formData 업데이트 완료 (기본 아바타 복원):', updatedData);
        return updatedData;
      });
      
      // user 상태도 즉시 업데이트하여 UI에 바로 반영 (기본 아바타로 복원)
      if (onUserChange) {
        onUserChange(prev => ({
          ...prev,
          profileImage: imageToSet,
          profileImageType: imageTypeToSet
        }));
        console.log('✅ user 상태 즉시 업데이트 완료 - 기본 아바타 복원');
      }
    } else {
      // 새 이미지 설정
      const imageToSet = newImage;
      
      // formData 업데이트 (새 이미지 설정)
      onFormDataChange(prev => {
        const updatedData = {
          ...prev,
          profileImage: imageToSet,
          profileImageType: 'USER_PROFILE'
        };
        console.log('✅ ProfileSection formData 업데이트 완료 (새 이미지 설정):', updatedData);
        return updatedData;
      });
      
      // user 상태도 즉시 업데이트하여 UI에 바로 반영 (새 이미지 설정)
      if (onUserChange) {
        onUserChange(prev => ({
          ...prev,
          profileImage: imageToSet,
          profileImageType: 'USER_PROFILE'
        }));
        console.log('✅ user 상태 즉시 업데이트 완료 - 새 이미지 설정');
      }
    }
    
    // 백엔드 저장 없이 프론트엔드에서만 즉시 적용
    console.log('🖼️ 이미지 즉시 적용 완료 - 백엔드 저장 없음');
    
    // 크롭된 이미지가 있으면 자동으로 백엔드에 저장
    if (newImage && newImage.startsWith('data:image/')) {
      console.log('🖼️ 크롭된 이미지 감지 - 자동 저장 시작');
      setTimeout(() => {
        if (onSave) {
          onSave(null, {
            ...formData,
            profileImage: newImage,
            profileImageType: 'USER_PROFILE'
          });
          console.log('✅ 크롭된 이미지 자동 저장 완료');
        }
      }, 100);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // onSave 호출 제거 - 크롭된 이미지는 백엔드에 저장하지 않음
      console.log('프로필 정보 저장 (이미지 제외)');
      setIsEditing(false);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    }
  };

  return (
    <div className={`mypage-section profile-section ${isEditing ? 'editing' : 'readonly'}`}>
      <div className="section-header">
        <h2>프로필 정보</h2>
        <button
          className="edit-btn"
          onClick={() => {
            const newEditingState = !isEditing;
            setIsEditing(newEditingState);
            if (onEditingChange) {
              onEditingChange(newEditingState);
            }
          }}
        >
          {isEditing ? '취소' : '수정'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <ProfileImageUpload
          profileImage={formData.profileImage}
          profileImageType={formData.profileImageType}
          socialProvider={formData.socialProvider}
          socialProfileImage={formData.socialProfileImage}
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
            value={formData.phone}
            onChange={handleInputChange}
            disabled={!isEditing}
            placeholder="010-0000-0000"
            maxLength="13"
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
