import React, { useState, useEffect, useCallback } from 'react';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import notificationManager from '../../../utils/notification';
import StandardizedApi from '../../../utils/standardizedApi';
import { useTranslation } from 'react-i18next';

// P0 영구 대책 Phase 2 (2026-06-09): base64 dataURI → multipart 업로드 endpoint 로 전환.
// 동일 정책 BE: ProfileImageUploadController#uploadProfileImage. 사이즈/MIME 검증은 서버 권위.
const PROFILE_IMAGE_UPLOAD_ENDPOINT = (userId) => `/api/v1/users/profile/${userId}/image`;
const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const PROFILE_IMAGE_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const PROFILE_IMAGE_CROPPED_WIDTH = 200;

const ProfileImageUpload = ({
  userId,
  profileImage,
  profileImageType,
  socialProvider,
  socialProfileImage,
  onImageChange,
  onUploaded,
  isEditing,
  showPreview = true
}) => {
  const { t } = useTranslation();
  const [isCropping, setIsCropping] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  const validateClientSide = (file) => {
    if (!file) {
      return '파일을 선택해 주세요.';
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      return '파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.';
    }
    if (file.type && !PROFILE_IMAGE_ALLOWED_MIME.includes(file.type)) {
      return '지원하지 않는 파일 형식입니다. PNG, JPG, WEBP만 업로드 가능합니다.';
    }
    return null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (!isEditing) return;
    const { files } = e.dataTransfer;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      const validationError = validateClientSide(files[0]);
      if (validationError) {
        notificationManager.show(validationError, 'warning');
        return;
      }
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

  // canvas.toBlob 콜백을 Promise 로 래핑 — Safari/Firefox 등 일부 환경 호환성 확보.
  const canvasToBlobAsync = (canvas, mimeType, quality) =>
    new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 변환 실패: blob 생성 불가'));
              return;
            }
            resolve(blob);
          },
          mimeType,
          quality
        );
      } catch (err) {
        reject(err);
      }
    });

  const uploadBlobToServer = async (blob) => {
    if (!userId) {
      throw new Error('사용자 정보를 확인할 수 없어 업로드할 수 없습니다.');
    }
    const formData = new FormData();
    formData.append('file', blob, `profile_${Date.now()}.jpg`);
    return StandardizedApi.postFormData(PROFILE_IMAGE_UPLOAD_ENDPOINT(userId), formData);
  };

  const extractProfileImageUrl = (response) => {
    if (!response || typeof response !== 'object') {
      return null;
    }
    if (typeof response.profileImageUrl === 'string') {
      return response.profileImageUrl;
    }
    const data = response.data;
    if (data && typeof data === 'object' && typeof data.profileImageUrl === 'string') {
      return data.profileImageUrl;
    }
    return null;
  };

  const handleCropImage = async () => {
    if (!cropImage) return;
    setIsUploading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const loaded = new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
      });
      img.src = cropImage;
      await loaded;
      const size = Math.min(img.width, img.height);
      const x = (img.width - size) / 2;
      const y = (img.height - size) / 2;
      canvas.width = PROFILE_IMAGE_CROPPED_WIDTH;
      canvas.height = PROFILE_IMAGE_CROPPED_WIDTH;
      ctx.drawImage(img, x, y, size, size, 0, 0, PROFILE_IMAGE_CROPPED_WIDTH, PROFILE_IMAGE_CROPPED_WIDTH);

      const blob = await canvasToBlobAsync(canvas, 'image/jpeg', 0.85);
      const response = await uploadBlobToServer(blob);
      const uploadedUrl = extractProfileImageUrl(response);
      if (!uploadedUrl) {
        throw new Error('서버 응답에서 업로드된 URL을 찾을 수 없습니다.');
      }
      if (onImageChange) {
        onImageChange(uploadedUrl);
      }
      if (onUploaded) {
        onUploaded(uploadedUrl);
      }
      notificationManager.show('프로필 이미지를 업데이트했습니다.', 'success');
      setIsCropping(false);
      setCropImage(null);
      setForceUpdate((p) => p + 1);
    } catch (err) {
      console.error('프로필 이미지 업로드 실패:', err);
      const message = err && err.message ? err.message : '프로필 이미지 업로드에 실패했습니다.';
      notificationManager.show(message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    const validationError = validateClientSide(file);
    if (validationError) {
      notificationManager.show(validationError, 'warning');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImage(ev.target.result);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
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
                accept="image/png,image/jpeg,image/webp"
                tabIndex={-1}
                aria-hidden="true"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
            {profileImage && profileImageType === 'USER_PROFILE' ? (
              <MGButton
                type="button"
                variant="danger"
                size="small"
                className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleDeleteImage}
                disabled={isUploading}
              >
                {t('common.actions.delete')}
              </MGButton>
            ) : null}
          </div>
        ) : null}
      </div>

      <UnifiedModal
        isOpen={isCropping && !!cropImage}
        onClose={() => {
          if (isUploading) return;
          setIsCropping(false);
          setCropImage(null);
        }}
        title="이미지 자르기"
        size="medium"
        backdropClick={!isUploading}
        showCloseButton={!isUploading}
        actions={
          <>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => {
                setIsCropping(false);
                setCropImage(null);
              }}
              preventDoubleClick={false}
              disabled={isUploading}
            >
              {t('common.actions.cancel')}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isUploading })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleCropImage}
              preventDoubleClick={false}
              loading={isUploading}
              disabled={isUploading}
            >
              {isUploading ? '업로드 중…' : '적용'}
            </MGButton>
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
