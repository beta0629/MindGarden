import React, { useState, useEffect } from 'react';
import ProfileImageUpload from './ProfileImageUpload';
import AddressInput from './AddressInput';
import StandardizedApi from '../../../utils/standardizedApi';
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
  const [genderOptions, setGenderOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // 성별 코드 로드
  useEffect(() => {
    const loadGenderCodes = async () => {
      try {
        setLoading(true);
        const response = await StandardizedApi.get('/api/v1/common-codes', { codeGroup: 'GENDER' });
        if (response && response.length > 0) {
          const options = response.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode
          }));
          setGenderOptions(options);
        }
      } catch (error) {
        console.error('성별 코드 로드 실패:', error);
        // 실패 시 기본값 설정
        setGenderOptions([
          { value: 'MALE', label: '남성', icon: '♂️', color: 'var(--mg-primary-500)' },
          { value: 'FEMALE', label: '여성', icon: '♀️', color: 'var(--mg-pink-600)' },
          { value: 'OTHER', label: '기타', icon: '⚧', color: 'var(--mg-gray-500)' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadGenderCodes();
  }, []);

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
      console.log('🚀 프로필 정보 저장 시작 (주소 포함)');
      
      // onSave 호출하여 백엔드에 저장
      if (onSave) {
        await onSave(e, formData);
        console.log('✅ 프로필 정보 저장 완료');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('❌ 프로필 업데이트 실패:', error);
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

        <div className="mg-form__group">
          <label>이름</label>
          <input
            type="text"
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
        </div>

        <div className="mg-form__group">
          <label>닉네임</label>
          <input
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
        </div>

        <div className="mg-form__group">
          <label>이메일</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={!isEditing}
          />
        </div>

        <div className="mg-form__group">
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

        <div className="mg-form__group">
          <label>성별</label>
          <select
            name="gender"
            value={formData.gender || ''}
            onChange={handleInputChange}
            disabled={!isEditing || loading}
          >
            <option value="">선택하세요</option>
            {genderOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label} ({option.value})
              </option>
            ))}
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
