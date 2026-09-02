import React, { useState, useEffect, useCallback } from 'react';
import ProfileImageUpload from './ProfileImageUpload';
import NotificationChannelPreferenceSection from './NotificationChannelPreferenceSection';
import AddressInput from './AddressInput';
import PhoneChangeModal from './PhoneChangeModal';
import EmailChangeModal from './EmailChangeModal';
import StandardizedApi from '../../../utils/standardizedApi';
import { sessionManager } from '../../../utils/sessionManager';
import MGButton from '../../common/MGButton';
import Avatar from '../../common/Avatar';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { isLikelyNumericPrimaryKey } from '../../../utils/mypageProfilePayload';
import {
  getMypageRoleDisplayLabel,
  resolveMypageCenterName,
  isCounselingDualRole
} from '../../../constants/mypageProfileRoles';
import { useTranslation } from 'react-i18next';

const API_COMMON_CODES = '/api/v1/common-codes';

const PROFESSIONAL_FIELDS = [
  { name: 'specialty', label: '전문 분야' },
  { name: 'qualifications', label: '자격' },
  { name: 'experience', label: '경력' },
  { name: 'availableTime', label: '상담 가능 시간' },
  { name: 'detailedIntroduction', label: '상세 소개', multiline: true },
  { name: 'education', label: '학력', multiline: true },
  { name: 'awards', label: '수상', multiline: true },
  { name: 'research', label: '연구', multiline: true },
  { name: 'memo', label: '메모', multiline: true }
];

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
  return null;
};

const ProfileSection = ({
  user,
  displayUser,
  formData,
  onFormDataChange,
  onUserChange,
  onSave,
  onReloadProfile,
  formatPhoneNumber
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [genderOptions, setGenderOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [isPhoneChangeOpen, setIsPhoneChangeOpen] = useState(false);
  const [isEmailChangeOpen, setIsEmailChangeOpen] = useState(false);

  const showProfessionalFields = isCounselingDualRole(displayUser);
  const roleLabel = getMypageRoleDisplayLabel(displayUser);
  const centerName = resolveMypageCenterName(displayUser);

  const openPhoneChangeModal = useCallback(() => setIsPhoneChangeOpen(true), []);
  const closePhoneChangeModal = useCallback(() => setIsPhoneChangeOpen(false), []);
  const handlePhoneChangeSuccess = useCallback(
    (response) => {
      if (response && response.phone) {
        onFormDataChange?.((prev) => ({
          ...prev,
          phone: response.phone
        }));
      }
      if (typeof onReloadProfile === 'function') {
        onReloadProfile();
      }
    },
    [onFormDataChange, onReloadProfile]
  );

  const openEmailChangeModal = useCallback(() => setIsEmailChangeOpen(true), []);
  const closeEmailChangeModal = useCallback(() => setIsEmailChangeOpen(false), []);
  const handleEmailChangeSuccess = useCallback(async () => {
    try {
      await sessionManager.logout();
    } catch (logoutError) {
      console.warn('이메일 변경 후 로그아웃 처리 중 오류 — 안전 리다이렉트로 진행:', logoutError);
    }
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  }, []);

  useEffect(() => {
    const loadGenderCodes = async() => {
      try {
        setLoadingCodes(true);
        const response = await StandardizedApi.get(API_COMMON_CODES, { codeGroup: 'GENDER' });
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.codes)
            ? response.codes
            : [];
        if (list.length > 0) {
          setGenderOptions(
            list.map((code) => ({
              value: code.codeValue,
              label: code.codeLabel
            }))
          );
        }
      } catch (error) {
        console.error('성별 코드 로드 실패:', error);
        setGenderOptions([
          { value: 'MALE', label: '남성' },
          { value: 'FEMALE', label: '여성' },
          { value: 'OTHER', label: '기타' }
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

  useEffect(() => () => sessionManager.endProfileEditing(), []);

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
      return;
    }
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

  const nameFieldForDisplay = isLikelyNumericPrimaryKey(formData.userId) ? '' : formData.userId;
  const displayName = formData.nickname || nameFieldForDisplay || displayUser?.name || '—';

  return (
    <>
      <article
        className="mg-mypage-clinic-os__section"
        aria-labelledby="mg-mypage-profile-header-title"
      >
        <div className="mg-mypage-clinic-os__section-head">
          <div className="mg-mypage-clinic-os__section-head-text">
            <h2 id="mg-mypage-profile-header-title" className="mg-mypage-clinic-os__section-title">
              {t('common.labels.profile')}
            </h2>
            <p className="mg-mypage-clinic-os__section-description">다른 사용자에게 보이는 정보입니다.</p>
          </div>
          <div className="mg-mypage-clinic-os__section-action">
            <MGButton
              type="button"
              variant="ghost"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'ghost', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => applyEditingState(!isEditing)}
              preventDoubleClick={false}
            >
              {isEditing ? '취소' : '편집'}
            </MGButton>
          </div>
        </div>
        <div className="mg-mypage-clinic-os__section-body">
          <div className="mg-mypage-clinic-os__profile-header">
            <div className="mg-mypage-clinic-os__avatar-wrap">
              <Avatar
                profileImageUrl={getProfileAvatarSrc(formData)}
                displayName={displayName}
                className="mg-mypage-clinic-os__avatar"
                size={96}
              />
            </div>
            <div className="mg-mypage-clinic-os__profile-summary">
              <p className="mg-mypage-clinic-os__display-name">{displayName}</p>
              <span className="mg-v2-status-badge mg-v2-badge--info" role="status">
                {roleLabel}
              </span>
              {centerName ? (
                <p className="mg-mypage-clinic-os__center-name">센터: {centerName}</p>
              ) : null}
            </div>
          </div>
          <hr className="mg-mypage-clinic-os__section-divider" aria-hidden="true" />
          <div className="mg-mypage-clinic-os__profile-image-block">
            <ProfileImageUpload
              userId={displayUser?.id || user?.id || formData.userPk || formData.id}
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
        className="mg-mypage-clinic-os__section"
        aria-labelledby="mg-mypage-profile-basic-title"
      >
        <div className="mg-mypage-clinic-os__section-head">
          <div className="mg-mypage-clinic-os__section-head-text">
            <h2 id="mg-mypage-profile-basic-title" className="mg-mypage-clinic-os__section-title">
              기본 정보
            </h2>
          </div>
        </div>
        <form className="mg-mypage-clinic-os__section-body" onSubmit={handleSubmit}>
          <fieldset className="mg-mypage-clinic-os__fieldset">
            <legend className="mg-mypage-clinic-os__visually-hidden">기본 프로필 필드</legend>

            <div className="mg-mypage-clinic-os__form-row">
              <label className="mg-mypage-clinic-os__form-label" htmlFor="mg-mypage-user-id">
                {t('common.labels.name')}
              </label>
              <input
                className="mg-mypage-clinic-os__form-control"
                id="mg-mypage-user-id"
                name="userId"
                type="text"
                value={nameFieldForDisplay}
                onChange={handleInputChange}
                disabled={!isEditing}
                autoComplete="name"
              />
            </div>

            <div className="mg-mypage-clinic-os__form-row">
              <label className="mg-mypage-clinic-os__form-label" htmlFor="mg-mypage-nickname">
                닉네임
              </label>
              <input
                className="mg-mypage-clinic-os__form-control"
                id="mg-mypage-nickname"
                name="nickname"
                type="text"
                value={formData.nickname}
                onChange={handleInputChange}
                disabled={!isEditing}
                autoComplete="nickname"
              />
            </div>

            <div className="mg-mypage-clinic-os__form-row">
              <span className="mg-mypage-clinic-os__form-label" id="mg-mypage-email-label">
                {t('common.labels.email')}
              </span>
              <div className="mg-mypage-clinic-os__action-row">
                <p className="mg-mypage-clinic-os__readonly-value" aria-labelledby="mg-mypage-email-label">
                  {maskEmail(formData.email)}
                </p>
                <MGButton
                  type="button"
                  variant="ghost"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'ghost', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={openEmailChangeModal}
                  preventDoubleClick={false}
                  aria-label="이메일 변경"
                >
                  변경
                </MGButton>
              </div>
            </div>

            <div className="mg-mypage-clinic-os__form-row">
              <span className="mg-mypage-clinic-os__form-label" id="mg-mypage-phone-label">
                휴대전화
              </span>
              <div className="mg-mypage-clinic-os__action-row">
                <p className="mg-mypage-clinic-os__readonly-value" aria-labelledby="mg-mypage-phone-label">
                  {maskPhone(formData.phone)}
                </p>
                <MGButton
                  type="button"
                  variant="ghost"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'ghost', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={openPhoneChangeModal}
                  preventDoubleClick={false}
                  aria-label="휴대전화 번호 변경"
                >
                  변경
                </MGButton>
              </div>
            </div>

            <div className="mg-mypage-clinic-os__form-row">
              <label className="mg-mypage-clinic-os__form-label" htmlFor="mg-mypage-gender">
                성별
              </label>
              <select
                className="mg-mypage-clinic-os__form-control"
                id="mg-mypage-gender"
                name="gender"
                value={formData.gender || ''}
                onChange={handleInputChange}
                disabled={!isEditing || loadingCodes}
              >
                <option value="">{t('common.messages.pleaseSelect')}</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
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

            <NotificationChannelPreferenceSection
              displayUser={displayUser}
              isEditing={isEditing}
              preferenceValue={formData.notificationChannelPreference || 'TENANT_DEFAULT'}
              tenantKakaoAvailable={user?.tenantNotificationChannelKakaoAvailable}
              tenantSmsAvailable={user?.tenantNotificationChannelSmsAvailable}
              tenantDefaultHint={user?.tenantDefaultNotificationChannelHint}
              preferenceUiAdjusted={user?.notificationChannelPreferenceUiAdjusted}
              onPreferenceChange={(e) => {
                onFormDataChange((prev) => ({
                  ...prev,
                  notificationChannelPreference: e.target.value
                }));
              }}
            />
          </fieldset>

          {isEditing ? (
            <div className="mg-mypage-clinic-os__card-actions">
              <MGButton
                type="submit"
                variant="primary"
                size="medium"
                className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              >
                {t('common.actions.save')}
              </MGButton>
              <MGButton
                type="button"
                variant="ghost"
                size="medium"
                className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => applyEditingState(false)}
                preventDoubleClick={false}
              >
                {t('common.actions.cancel')}
              </MGButton>
            </div>
          ) : null}
        </form>
      </article>

      {showProfessionalFields ? (
        <article
          className="mg-mypage-clinic-os__section"
          aria-labelledby="mg-mypage-profile-professional-title"
        >
          <div className="mg-mypage-clinic-os__section-head">
            <div className="mg-mypage-clinic-os__section-head-text">
              <h2 id="mg-mypage-profile-professional-title" className="mg-mypage-clinic-os__section-title">
                상담 전문 정보
              </h2>
              <p className="mg-mypage-clinic-os__section-description">
                상담사 프로필에 표시되는 전문 정보입니다.
              </p>
            </div>
          </div>
          <div className="mg-mypage-clinic-os__section-body">
            {PROFESSIONAL_FIELDS.map((field) => (
              <div key={field.name} className="mg-mypage-clinic-os__form-row">
                <label className="mg-mypage-clinic-os__form-label" htmlFor={`mg-mypage-${field.name}`}>
                  {field.label}
                </label>
                {field.multiline ? (
                  <textarea
                    className="mg-mypage-clinic-os__form-control mg-mypage-clinic-os__form-control--textarea"
                    id={`mg-mypage-${field.name}`}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={3}
                  />
                ) : (
                  <input
                    className="mg-mypage-clinic-os__form-control"
                    id={`mg-mypage-${field.name}`}
                    name={field.name}
                    type="text"
                    value={formData[field.name] || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                  />
                )}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <PhoneChangeModal
        isOpen={isPhoneChangeOpen}
        onClose={closePhoneChangeModal}
        onSuccess={handlePhoneChangeSuccess}
      />

      <EmailChangeModal
        isOpen={isEmailChangeOpen}
        onClose={closeEmailChangeModal}
        onSuccess={handleEmailChangeSuccess}
      />
    </>
  );
};

export default ProfileSection;
