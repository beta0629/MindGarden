import React, { useState, useEffect } from 'react';
import './ProfileImageUpload.css';
import notificationManager from '../../../utils/notification';

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
  const [forceUpdate, setForceUpdate] = useState(0);

  // profileImage 변경 감지
  useEffect(() => {
    console.log('🖼️ ProfileImageUpload profileImage 변경 감지:', {
      profileImage: profileImage ? profileImage.substring(0, 50) + '...' : 'null',
      profileImageType
    });
  }, [profileImage, profileImageType]);

  // 프로필 이미지 우선순위 결정 (forceUpdate 의존성 추가)
  const getProfileImageUrl = React.useCallback(() => {
    console.log('🖼️ getProfileImageUrl 호출:', {
      profileImage: profileImage ? profileImage.substring(0, 50) + '...' : 'null',
      profileImageType,
      socialProfileImage: socialProfileImage ? socialProfileImage.substring(0, 50) + '...' : 'null',
      forceUpdate
    });
    
    // 1. 사용자가 등록한 이미지 우선 (크롭된 이미지 포함)
    if (profileImage && profileImageType === 'USER_PROFILE') {
      console.log('✅ USER_PROFILE 이미지 반환 (교체됨)');
      return profileImage;
    }
    
    // 2. 소셜 이미지
    if (socialProfileImage && profileImageType === 'SOCIAL_IMAGE') {
      console.log('✅ SOCIAL_IMAGE 이미지 반환');
      return socialProfileImage;
    }
    
    // 3. 기본 아이콘 (기존 이미지가 없을 때만)
    console.log('✅ 기본 아이콘 반환: 인라인 SVG');
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f0f0f0 -> var(--mg-custom-f0f0f0)
        <circle cx="60" cy="60" r="60" fill="#f0f0f0"/>
        <g fill="var(--mg-gray-500)">
          <circle cx="60" cy="45" r="18"/>
          <path d="M30 100 C30 80, 45 70, 60 70 C75 70, 90 80, 90 100 L90 110 L30 110 Z"/>
        </g>
        <circle cx="60" cy="60" r="60" fill="none" stroke="var(--mg-gray-300)" stroke-width="2"/>
      </svg>
    `);
  }, [profileImage, profileImageType, socialProfileImage, forceUpdate]);

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
        notificationManager.show('이미지 파일만 업로드 가능합니다.', 'info');
      }
    }
  };

  // 크롭 이미지 처리
  const handleCropImage = () => {
    console.log('🖼️ 크롭 완료 버튼 클릭됨!');
    console.log('🖼️ cropImage 상태:', cropImage ? '있음' : '없음');
    
    if (cropImage) {
      console.log('🖼️ 크롭 시작:', cropImage.substring(0, 50) + '...');
      
      // 실제 크롭 로직 구현
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        console.log('🖼️ 이미지 로드 완료:', img.width, 'x', img.height);
        
        // 크롭 영역 계산 (간단한 중앙 크롭)
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        
        canvas.width = 200;
        canvas.height = 200;
        
        // 이미지 그리기
        ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);
        
        // 크롭된 이미지를 base64로 변환
        const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
        console.log('🖼️ 크롭 완료:', croppedImage.substring(0, 50) + '...');
        
        // 부모 컴포넌트에 전달 (기존 이미지 완전 교체)
        if (onImageChange) {
          onImageChange(croppedImage);
          console.log('✅ onImageChange 호출 완료 - 이미지 교체');
        } else {
          console.error('❌ onImageChange 함수가 없습니다');
        }
        
        setIsCropping(false);
        setCropImage(null);
        
        // 강제 리렌더링으로 이미지 즉시 반영
        setForceUpdate(prev => prev + 1);
        console.log('🔄 강제 리렌더링 실행');
        
        // 추가 강제 리렌더링으로 확실히 반영
        setTimeout(() => {
          setForceUpdate(prev => prev + 1);
          console.log('🔄 추가 강제 리렌더링 실행');
        }, 50);
        
        // 한 번 더 강제 리렌더링
        setTimeout(() => {
          setForceUpdate(prev => prev + 1);
          console.log('🔄 최종 강제 리렌더링 실행');
        }, 100);
      };
      
      img.onerror = (error) => {
        console.error('❌ 이미지 로드 실패:', error);
      };
      
      img.src = cropImage;
    } else {
      console.error('❌ cropImage가 없습니다');
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

  // 이미지 삭제 기능
  const handleDeleteImage = () => {
    console.log('🗑️ 이미지 삭제 요청');
    
    // 부모 컴포넌트에 null 전달하여 이미지 삭제
    if (onImageChange) {
      onImageChange(null);
      console.log('✅ 이미지 삭제 완료 - 기본 아바타로 복원');
    } else {
      console.error('❌ onImageChange 함수가 없습니다');
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
              console.log('🖼️ 이미지 로드 실패, 기본 아바타로 대체');
              console.log('🖼️ 실패한 이미지 src:', e.target.src);
              e.target.src = '/default-avatar.svg';
            }}
            onLoad={(e) => {
              console.log('🖼️ 이미지 로드 성공');
              console.log('🖼️ 로드된 이미지 src:', e.target.src);
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
              <div className="image-controls">
                <label htmlFor="profile-image-input" className="file-upload-btn">
                  <i className="bi bi-file-earmark-image"></i>
                  파일 선택
                </label>
                {profileImage && profileImageType === 'USER_PROFILE' && profileImage.startsWith('data:image/') && (
                  <button 
                    className="delete-image-btn"
                    onClick={handleDeleteImage}
                    title="이미지 삭제"
                  >
                    <i className="bi bi-trash"></i>
                    삭제
                  </button>
                )}
              </div>
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
                  className="crop-image profile-image-preview"
                  draggable="false"
                />
                <div className="crop-preview">
                  <div className="crop-preview-label">미리보기:</div>
                  <div className="crop-preview-image">
                    <img 
                      src={cropImage} 
                      alt="크롭 미리보기"
                      className="crop-preview-img"
                    />
                  </div>
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
