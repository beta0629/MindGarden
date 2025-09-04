import React, { useState } from 'react';
import './ProfileImageUpload.css';

const ProfileImageUpload = ({ 
  profileImage, 
  profileImageType,
  socialProvider,
  socialProfileImage,
  onImageChange, 
  isEditing 
}) => {
  const [isCropping, setIsCropping] = useState(false);
  const [cropImage, setCropImage] = useState(null);

  // 프로필 이미지 우선순위 결정
  const getProfileImageUrl = () => {
    // 1. 사용자가 등록한 이미지 우선
    if (profileImage && profileImageType === 'USER_PROFILE') {
      return profileImage;
    }
    
    // 2. 소셜 이미지
    if (socialProfileImage && profileImageType === 'SOCIAL_IMAGE') {
      return socialProfileImage;
    }
    
            // 3. 기본 아이콘
        return '/default-avatar.svg';
  };

  const getProfileImageTypeText = () => {
    switch (profileImageType) {
      case 'USER_PROFILE':
        return '사용자 등록 이미지';
      case 'SOCIAL_IMAGE':
        return `${socialProvider === 'KAKAO' ? '카카오' : socialProvider === 'NAVER' ? '네이버' : socialProvider} 프로필`;
      case 'DEFAULT_ICON':
        return '기본 아이콘';
      default:
        return '기본 아이콘';
    }
  };

  // 드래그 앤 드롭 핸들러들
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCropImage(e.target.result);
          setIsCropping(true);
        };
        reader.readAsDataURL(file);
      } else {
        alert('이미지 파일만 업로드 가능합니다.');
      }
    }
  };

  // 크롭 이미지 처리
  const handleCropImage = () => {
    if (cropImage) {
      onImageChange(cropImage);
      setIsCropping(false);
      setCropImage(null);
    }
  };

  // 이미지 파일 선택 시 크롭 모달 열기
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImage(e.target.result);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="profile-image-section">
        <div 
          className={`profile-image ${isEditing ? 'editable' : ''}`}
          onDrop={isEditing ? handleDrop : undefined}
          onDragOver={isEditing ? handleDragOver : undefined}
          onDragEnter={isEditing ? handleDragEnter : undefined}
          onDragLeave={isEditing ? handleDragLeave : undefined}
        >
          <img
            src={getProfileImageUrl()}
            alt="프로필 이미지"
            onError={(e) => {
              e.target.src = '/default-avatar.svg';
            }}
          />
          <div className="profile-image-type">
            <span className="image-type-badge">{getProfileImageTypeText()}</span>
          </div>
          {isEditing && (
            <>
              <div className="drag-overlay">
                <i className="bi bi-cloud-upload"></i>
                <p>이미지를 여기에 드래그하세요</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="image-upload"
                id="profile-image-input"
              />
              <label htmlFor="profile-image-input" className="file-upload-btn">
                <i className="bi bi-file-earmark-image"></i>
                파일 선택
              </label>
            </>
          )}
        </div>
      </div>

      {/* 크롭 모달 */}
      {isCropping && cropImage && (
        <div className="crop-modal-overlay">
          <div className="crop-modal">
            <div className="crop-modal-header">
              <h3>이미지 크롭</h3>
              <button 
                className="close-btn"
                onClick={() => setIsCropping(false)}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="crop-container">
              <div className="crop-area">
                <img 
                  src={cropImage} 
                  alt="크롭할 이미지"
                  className="crop-image"
                  draggable="false"
                />
                <div className="crop-frame">
                  <div className="crop-handle top-left"></div>
                  <div className="crop-handle top-right"></div>
                  <div className="crop-handle bottom-left"></div>
                  <div className="crop-handle bottom-right"></div>
                </div>
              </div>
            </div>
            <div className="crop-actions">
              <button 
                className="crop-btn"
                onClick={handleCropImage}
              >
                크롭 완료
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setIsCropping(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileImageUpload;
