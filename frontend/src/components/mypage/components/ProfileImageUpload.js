import React, { useState, useEffect, useCallback } from 'react';
import UnifiedModal from '../../common/modals/UnifiedModal';
import notificationManager from '../../../utils/notification';

const ProfileImageUpload = ({
  profileImage,
  profileImageType,
  socialProvider,
  socialProfileImage,
  onImageChange,
  isEditing,
  showPreview = true
}) => {
  const [isCropping, setIsCropping] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const getProfileImageUrl = useCallback(() => {
    if (profileImage && profileImageType === 'USER_PROFILE') {
      return profileImage;
    }
    if (socialProfileImage && profileImageType === 'SOCIAL_IMAGE') {
      return socialProfileImage;
    }
    if (profileImage && typeof profileImage === 'string' && profileImage.startsWith('http')) {
      return profileImage;
    }
    return '/default-avatar.svg';
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

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isEditing) return;
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (!isEditing) return;
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropImage(ev.target.result);
        setIsCropping(true);
      };
      reader.readAsDataURL(files[0]);
    } else {
      notificationManager.show('이미지 파일만 업로드할 수 있습니다.', 'warning');
    }
  };

  const handleCropImage = () => {
    if (!cropImage) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      canvas.width = 200;
      canvas.height = 200;
      ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200);
      const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
      if (onImageChange) {
        onImageChange(croppedImage);
      }
      setIsCropping(false);
      setCropImage(null);
      setForceUpdate((p) => p + 1);
    };
    img.onerror = () => {
      notificationManager.show('이미지를 불러올 수 없습니다.', 'error');
    };
    img.src = cropImage;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCropImage(ev.target.result);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = () => {
    if (onImageChange) {
      onImageChange(null);
    }
  };

  useEffect(() => {
    if (!isEditing) {
      setDragActive(false);
    }
  }, [isEditing]);

  return (
    <>
      <div
        className={`mg-mypage__profile-image-drop${isEditing ? ' mg-mypage__profile-image-drop--editing' : ''}${
          dragActive ? ' mg-mypage__profile-image-drop--drag' : ''
        }`}
        onDrop={isEditing && showPreview ? handleDrop : undefined}
        onDragOver={isEditing && showPreview ? handleDragOver : undefined}
        onDragLeave={isEditing && showPreview ? handleDragLeave : undefined}
      >
        {showPreview ? (
          <img
            className="mg-mypage__profile-image-preview"
            src={getProfileImageUrl()}
            alt=""
            onError={(ev) => {
              ev.target.src = '/default-avatar.svg';
            }}
          />
        ) : null}
        <span className="mg-mypage__image-type-badge">{getProfileImageTypeText()}</span>
        {isEditing ? (
          <div className="mg-mypage__profile-image-controls">
            <label className="mg-v2-button mg-v2-button--primary">
              사진 변경
              <input
                className="mg-mypage__visually-hidden"
                type="file"
                accept="image/*"
                tabIndex={-1}
                aria-hidden="true"
                onChange={handleFileSelect}
              />
            </label>
            {profileImage && profileImageType === 'USER_PROFILE' && profileImage.startsWith('data:image/') ? (
              <button
                type="button"
                className="mg-v2-button mg-v2-button--outline mg-v2-button--danger"
                onClick={handleDeleteImage}
              >
                삭제
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <UnifiedModal
        isOpen={isCropping && !!cropImage}
        onClose={() => {
          setIsCropping(false);
          setCropImage(null);
        }}
        title="이미지 자르기"
        size="medium"
        backdropClick
        showCloseButton
        actions={
          <>
            <button
              type="button"
              className="mg-v2-button mg-v2-button--outline"
              onClick={() => {
                setIsCropping(false);
                setCropImage(null);
              }}
            >
              취소
            </button>
            <button type="button" className="mg-v2-button mg-v2-button--primary" onClick={handleCropImage}>
              적용
            </button>
          </>
        }
      >
        <div className="mg-mypage__crop-preview-wrap">
          {cropImage ? (
            <img className="mg-mypage__crop-preview-img" src={cropImage} alt="" draggable={false} />
          ) : null}
          <p className="mg-mypage__section-description">이미지 중앙 기준으로 정사각형으로 잘립니다.</p>
        </div>
      </UnifiedModal>
    </>
  );
};

export default ProfileImageUpload;
