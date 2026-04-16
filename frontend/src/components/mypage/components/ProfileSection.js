import React, { useState, useEffect, useCallback } from 'react';
import ProfileImageUpload from './ProfileImageUpload';
import AddressInput from './AddressInput';
import StandardizedApi from '../../../utils/standardizedApi';
import { sessionManager } from '../../../utils/sessionManager';
import notificationManager from '../../../utils/notification';
import { ROLE_DISPLAY_LABELS } from '../../../constants/mypageUi';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { isLikelyNumericPrimaryKey } from '../../../utils/mypageProfilePayload';

const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || '—';
  const [local, domain] = email.split('@');
  const vis = local.slice(0, 2);
  return `${vis}***@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone) return '—';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 8) return phone;
  const tail = digits.slice(-4);
  return `010-****-${tail}`;
};

const getProfileAvatarSrc = (fd) => {
  if (fd.profileImage && fd.profileImageType === 'USER_PROFILE') {
    return fd.profileImage;
  }
  if (fd.socialProfileImage && fd.profileImageType === 'SOCIAL_IMAGE') {
    return fd.socialProfileImage;
  }
  if (fd.profileImage && typeof fd.profileImage === 'string' && fd.profileImage.startsWith('http')) {
    return fd.profileImage;
  }
  return '/default-avatar.svg';
};

const ProfileSection = ({
  user,
  displayUser,
  formData,
  onFormDataChange,
  onUserChange,
  onSave,
  formatPhoneNumber
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [genderOptions, setGenderOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  const role = displayUser?.role;
  const roleLabel = role ? ROLE_DISPLAY_LABELS[role] || role : '—';
  const tenantName =
    displayUser?.tenantName ||
    displayUser?.companyName ||
    displayUser?.branchName ||
    user?.tenantName ||
    user?.companyName ||
    '';

  useEffect(() => {
    const loadGenderCodes = async() => {
      try {
        setLoadingCodes(true);
        const response = await StandardizedApi.get('/api/v1/common-codes', { codeGroup: 'GENDER' });
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.codes)
            ? response.codes
            : [];
        if (list.length > 0) {
          setGenderOptions(
            list.map((code) => ({
              value: code.codeValue,
              label: code.codeLabel,
              icon: code.icon,
              color: code.colorCode
            }))
          );
        }
      } catch (error) {
        console.error('성별 코드 로드 실패:', error);
        setGenderOptions([
          { value: 'MALE', label: '남성', icon: '♂️' },
          { value: 'FEMALE', label: '여성', icon: '♀️' },
          { value: 'OTHER', label: '기타', icon: '⚧' }
        ]);
      } finally {
        setLoadingCodes(false);
      }
    };

    loadGenderCodes();
  }, []);

  const applyEditingState = useCallback((next) => {
    setIsEditing(next);
    if (next) {
      sessionManager.startProfileEditing();
    } else {
      sessionManager.endProfileEditing();
    }
  }, []);

  useEffect(() => {
    return () => sessionManager.endProfileEditing();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      onFormDataChange((prev) => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      onFormDataChange((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (newImage) => {
    if (newImage === null) {
      const imageToSet = '/default-avatar.svg';
      const imageTypeToSet = 'DEFAULT_ICON';
      onFormDataChange((prev) => ({
        ...prev,
        profileImage: imageToSet,
        profileImageType: imageTypeToSet
      }));
      if (onUserChange) {
        onUserChange((prev) => ({
          ...prev,
          profileImage: imageToSet,
          profileImageType: imageTypeToSet
        }));
      }
    } else {
      onFormDataChange((prev) => ({
        ...prev,
        profileImage: newImage,
        profileImageType: 'USER_PROFILE'
      }));
      if (onUserChange) {
        onUserChange((prev) => ({
          ...prev,
          profileImage: newImage,
          profileImageType: 'USER_PROFILE'
        }));
      }
    }

    if (newImage && newImage.startsWith('data:image/')) {
      setTimeout(() => {
        if (onSave) {
          onSave(null, {
            ...formData,
            profileImage: newImage,
            profileImageType: 'USER_PROFILE'
          });
        }
      }, 0);
    }
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    try {
      if (onSave) {
        await onSave(e, formData);
      }
      applyEditingState(false);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    }
  };

  const handleCancelEdit = () => {
    applyEditingState(false);
  };

  const nameFieldForDisplay = isLikelyNumericPrimaryKey(formData.userId) ? '' : formData.userId;
  const displayName = formData.nickname || nameFieldForDisplay || displayUser?.name || '—';

  return (
    <>
      <article
        className="mg-v2-ad-b0kla__card mg-mypage__card"
        aria-labelledby="mg-mypage-profile-header-title"
      >
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-profile-header-title" className="mg-mypage__section-title">
              프로필
            </h2>
            <p className="mg-mypage__section-description">다른 사용자에게 보이는 정보입니다.</p>
          </div>
          <div className="mg-mypage__section-action">
            <MGButton
              type="button"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => applyEditingState(!isEditing)}
              variant="outline"
              preventDoubleClick={false}
            >
              {isEditing ? '취소' : '편집'}
            </MGButton>
          </div>
        </div>
        <div className="mg-mypage__card-body">
          <div className="mg-mypage__profile-header">
            <div className="mg-mypage__avatar-wrap">
              <img
                className="mg-mypage__avatar"
                src={getProfileAvatarSrc(formData)}
                alt=""
                width={96}
                height={96}
                onError={(ev) => {
                  ev.target.src = '/default-avatar.svg';
                }}
              />
            </div>
            <div className="mg-mypage__profile-summary">
              <p className="mg-mypage__display-name">{displayName}</p>
              <span className="mg-v2-status-badge mg-v2-badge--info" role="status">
                {roleLabel}
              </span>
              {tenantName ? <p className="mg-mypage__tenant-name">{tenantName}</p> : null}
            </div>
          </div>
          <div className="mg-mypage__card-divider" aria-hidden="true" />
          <div className="mg-mypage__profile-image-block">
            <ProfileImageUpload
              profileImage={formData.profileImage}
              profileImageType={formData.profileImageType}
              socialProvider={formData.socialProvider}
              socialProfileImage={formData.socialProfileImage}
              onImageChange={handleImageChange}
              isEditing={isEditing}
              showPreview={false}
            />
          </div>
        </div>
      </article>

      <article
        className="mg-v2-ad-b0kla__card mg-mypage__card"
        aria-labelledby="mg-mypage-profile-basic-title"
      >
        <div className="mg-mypage__section-head">
          <span className="mg-mypage__section-accent" aria-hidden="true" />
          <div className="mg-mypage__section-head-text">
            <h2 id="mg-mypage-profile-basic-title" className="mg-mypage__section-title">
              기본 정보
            </h2>
          </div>
        </div>
        <form className="mg-mypage__card-body" onSubmit={handleSubmit}>
          <fieldset className="mg-mypage__fieldset">
            <legend className="mg-mypage__visually-hidden">기본 프로필 필드</legend>

            <div className="mg-mypage__form-row">
              <label className="mg-mypage__form-label" htmlFor="mg-mypage-user-id">
                이름
              </label>
              <input
                className="mg-mypage__form-control"
                id="mg-mypage-user-id"
                name="userId"
                type="text"
                value={nameFieldForDisplay}
                onChange={handleInputChange}
                disabled={!isEditing}
                autoComplete="name"
              />
            </div>

            <div className="mg-mypage__form-row">
              <label className="mg-mypage__form-label" htmlFor="mg-mypage-nickname">
                닉네임
              </label>
              <input
                className="mg-mypage__form-control"
                id="mg-mypage-nickname"
                name="nickname"
                type="text"
                value={formData.nickname}
                onChange={handleInputChange}
                disabled={!isEditing}
                autoComplete="nickname"
              />
            </div>

            <div className="mg-mypage__form-row mg-mypage__form-row--stack">
              <span className="mg-mypage__form-label" id="mg-mypage-email-label">
                이메일
              </span>
              <div className="mg-mypage__readonly-row">
                <p className="mg-mypage__readonly-value" aria-labelledby="mg-mypage-email-label">
                  {maskEmail(formData.email)}
                </p>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() =>
                    notificationManager.show('이메일 변경은 보안 절차 준비 중입니다.', 'info')
                  }
                  variant="outline"
                  preventDoubleClick={false}
                >
                  변경
                </MGButton>
              </div>
            </div>

            <div className="mg-mypage__form-row mg-mypage__form-row--stack">
              <span className="mg-mypage__form-label" id="mg-mypage-phone-label">
                휴대전화
              </span>
              <div className="mg-mypage__readonly-row">
                <p className="mg-mypage__readonly-value" aria-labelledby="mg-mypage-phone-label">
                  {maskPhone(formData.phone)}
                </p>
                <MGButton
                  type="button"
                  className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={() =>
                    notificationManager.show('휴대전화 변경은 보안 절차 준비 중입니다.', 'info')
                  }
                  variant="outline"
                  preventDoubleClick={false}
                >
                  변경
                </MGButton>
              </div>
            </div>

            <div className="mg-mypage__form-row">
              <label className="mg-mypage__form-label" htmlFor="mg-mypage-gender">
                성별
              </label>
              <select
                className="mg-mypage__form-control"
                id="mg-mypage-gender"
                name="gender"
                value={formData.gender || ''}
                onChange={handleInputChange}
                disabled={!isEditing || loadingCodes}
              >
                <option value="">선택하세요</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon ? `${option.icon} ` : ''}
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <AddressInput
              postalCode={formData.postalCode}
              address={formData.address}
              addressDetail={formData.addressDetail}
              onAddressChange={(addressData) => {
                onFormDataChange((prev) => ({
                  ...prev,
                  ...addressData
                }));
              }}
              isEditing={isEditing}
            />
          </fieldset>

          {isEditing ? (
            <div className="mg-v2-card-actions">
              <MGButton
                type="submit"
                className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                variant="primary"
              >
                저장
              </MGButton>
              <MGButton
                type="button"
                className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleCancelEdit}
                variant="outline"
                preventDoubleClick={false}
              >
                취소
              </MGButton>
            </div>
          ) : null}
        </form>
      </article>
    </>
  );
};

export default ProfileSection;
