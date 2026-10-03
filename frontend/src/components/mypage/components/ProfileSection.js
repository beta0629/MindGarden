import React, { useState, useEffect, useCallback, useRef } from 'react';
import NotificationChannelPreferenceSection from './NotificationChannelPreferenceSection';
import AddressInput from './AddressInput';
import PhoneChangeModal from './PhoneChangeModal';
import EmailChangeModal from './EmailChangeModal';
import StandardizedApi from '../../../utils/standardizedApi';
import { sessionManager } from '../../../utils/sessionManager';
import { redirectToLoginPageOnce } from '../../../utils/sessionRedirect';
import { resolveAvatarSourceUri } from '../../../utils/resolveAvatarSourceUri';
import { getSpecialtyKoreanName } from '../../../utils/codeHelper';
import ProfileImageInput from '../../common/ProfileImageInput';
import SafeText from '../../common/SafeText';
import MypageSectionPanel from '../layout/MypageSectionPanel';
import MypageDefinitionRows from '../layout/MypageDefinitionRows';
import MypageActionButton from '../layout/MypageActionButton';
import { isLikelyNumericPrimaryKey } from '../../../utils/mypageProfilePayload';
import {
  NOTIFICATION_CHANNEL_PREFERENCE_VALUE,
  tNotificationChannel
} from '../../../constants/notificationChannelPreference';
import { shouldShowNotificationChannelPreference } from '../../../constants/mypageProfileRoles';
import {
  MYPAGE_SECTION_KEYS,
  MYPAGE_SECTION_LABELS,
  MYPAGE_SECTION_CAPTIONS,
  MYPAGE_HIDE_FIELDS,
  MYPAGE_LAYOUT_COPY,
  MYPAGE_FIELD_LABELS,
  MYPAGE_SPECIALTY_CODE_GROUP,
  MYPAGE_SPECIALTY_SEPARATOR,
  MYPAGE_NOTIFY_COPY_OVERRIDES
} from '../../../constants/mypageRoleLayout';

const API_COMMON_CODES = '/api/v1/common-codes';

const BASIC_FORM_ID = 'mypage-basic-form';
const COUNSEL_FORM_ID = 'mypage-counsel-form';
const NOTIFY_FORM_ID = 'mypage-notify-form';

/** ProfileSection 이 그리는 섹션 (formData + 기존 handleSubmit 저장) */
export const PROFILE_OWNED_SECTIONS = Object.freeze([
  MYPAGE_SECTION_KEYS.BASIC,
  MYPAGE_SECTION_KEYS.COUNSEL,
  MYPAGE_SECTION_KEYS.NOTIFY
]);

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
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  const vis = local.slice(0, 2);
  return `${vis}***@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 8) return phone;
  const tail = digits.slice(-4);
  return `010-****-${tail}`;
};

export const getProfileAvatarSrc = (fd) => {
  if (!fd) return null;
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

const translateNotifyCopy = (key) => MYPAGE_NOTIFY_COPY_OVERRIDES[key] || tNotificationChannel(key);

const NOTIFY_OPTION_KEYS = {
  [NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT]: {
    label: 'tenantProfile.notificationChannel.optionTenantDefault',
    desc: 'tenantProfile.notificationChannel.optionTenantDefaultDescription'
  },
  [NOTIFICATION_CHANNEL_PREFERENCE_VALUE.KAKAO]: {
    label: 'tenantProfile.notificationChannel.optionKakao',
    desc: 'tenantProfile.notificationChannel.optionKakaoDescription'
  },
  [NOTIFICATION_CHANNEL_PREFERENCE_VALUE.SMS]: {
    label: 'tenantProfile.notificationChannel.optionSms',
    desc: 'tenantProfile.notificationChannel.optionSmsDescription'
  }
};

/**
 * @param {unknown} response
 * @returns {object[]}
 */
const toCodeList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.codes)) return response.codes;
  return [];
};

/**
 * 마이페이지 기본 정보 · 상담 정보 · 알림 받는 방법 패널.
 * 저장은 기존 onSave(handleSubmit) 하나로만 — payload 는 mypageProfilePayload 그대로.
 */
const ProfileSection = ({
  user,
  displayUser,
  formData,
  onFormDataChange,
  onUserChange,
  onSave,
  onReloadProfile,
  onPhoneChanged,
  formatPhoneNumber,
  sections = PROFILE_OWNED_SECTIONS,
  hideFields = [],
  activeEditSection = null,
  onEditSectionChange,
  notifyExtra = null
}) => {
  const [genderOptions, setGenderOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [specialtyLabels, setSpecialtyLabels] = useState({});
  const [saving, setSaving] = useState(false);
  const [isPhoneChangeOpen, setIsPhoneChangeOpen] = useState(false);
  const [isEmailChangeOpen, setIsEmailChangeOpen] = useState(false);
  const snapshotRef = useRef(null);

  const visibleSections = PROFILE_OWNED_SECTIONS.filter((key) => sections.includes(key));
  const showCounsel = visibleSections.includes(MYPAGE_SECTION_KEYS.COUNSEL);
  const showNotify = visibleSections.includes(MYPAGE_SECTION_KEYS.NOTIFY)
    && shouldShowNotificationChannelPreference(displayUser);
  const hideGender = hideFields.includes(MYPAGE_HIDE_FIELDS.GENDER);
  const hideAddress = hideFields.includes(MYPAGE_HIDE_FIELDS.ADDRESS);

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
      if (typeof onPhoneChanged === 'function') {
        onPhoneChanged(response);
      }
    },
    [onFormDataChange, onReloadProfile, onPhoneChanged]
  );

  const openEmailChangeModal = useCallback(() => setIsEmailChangeOpen(true), []);
  const closeEmailChangeModal = useCallback(() => setIsEmailChangeOpen(false), []);
  const handleEmailChangeSuccess = useCallback(async() => {
    try {
      await sessionManager.logout();
    } catch (logoutError) {
      console.warn('이메일 변경 후 로그아웃 처리 중 오류 — 안전 리다이렉트로 진행:', logoutError);
    }
    redirectToLoginPageOnce();
  }, []);

  useEffect(() => {
    const loadGenderCodes = async() => {
      try {
        setLoadingCodes(true);
        const response = await StandardizedApi.get(API_COMMON_CODES, { codeGroup: 'GENDER' });
        const list = toCodeList(response);
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

  useEffect(() => {
    if (!showCounsel) {
      return undefined;
    }
    let cancelled = false;
    const loadSpecialtyCodes = async() => {
      try {
        const response = await StandardizedApi.get(API_COMMON_CODES, {
          codeGroup: MYPAGE_SPECIALTY_CODE_GROUP
        });
        const map = {};
        toCodeList(response).forEach((code) => {
          if (code?.codeValue) {
            map[code.codeValue] = code.codeLabel || code.koreanName || '';
          }
        });
        if (!cancelled) {
          setSpecialtyLabels(map);
        }
      } catch (error) {
        console.warn('전문 분야 코드 로드 실패 — 기본 한글명으로 표시:', error);
      }
    };
    loadSpecialtyCodes();
    return () => {
      cancelled = true;
    };
  }, [showCounsel]);

  useEffect(() => () => sessionManager.endProfileEditing(), []);

  const startEdit = (sectionKey) => {
    snapshotRef.current = { ...formData };
    sessionManager.startProfileEditing();
    onEditSectionChange?.(sectionKey);
  };

  const finishEdit = () => {
    snapshotRef.current = null;
    sessionManager.endProfileEditing();
    onEditSectionChange?.(null);
  };

  const cancelEdit = () => {
    const snapshot = snapshotRef.current;
    if (snapshot) {
      onFormDataChange(snapshot);
      if (onUserChange) {
        onUserChange((prev) => ({
          ...prev,
          profileImage: snapshot.profileImage,
          profileImageType: snapshot.profileImageType
        }));
      }
    }
    finishEdit();
  };

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
    if (newImage === null || newImage === '') {
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
      setSaving(true);
      if (onSave) {
        await onSave(e, formData);
      }
      finishEdit();
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const nameFieldForDisplay = isLikelyNumericPrimaryKey(formData.userId) ? '' : formData.userId;
  const profileImageRaw = getProfileAvatarSrc(formData);
  const profileImageSlotValue = profileImageRaw
    ? (resolveAvatarSourceUri(profileImageRaw) || '')
    : '';

  const genderLabel = (() => {
    if (!formData.gender) return '';
    const found = genderOptions.find((option) => option.value === formData.gender);
    return found ? found.label : '';
  })();

  const addressText = [
    formData.postalCode ? `(${formData.postalCode})` : '',
    formData.address || '',
    formData.addressDetail || ''
  ].filter(Boolean).join(' ');

  const specialtyNames = String(formData.specialty || '')
    .split(MYPAGE_SPECIALTY_SEPARATOR)
    .map((code) => code.trim())
    .filter(Boolean)
    .map((code) => specialtyLabels[code] || getSpecialtyKoreanName(code));

  const panelProps = (sectionKey) => ({
    sectionKey,
    title: MYPAGE_SECTION_LABELS[sectionKey],
    caption: MYPAGE_SECTION_CAPTIONS[sectionKey],
    editable: true,
    editing: activeEditSection === sectionKey,
    editDisabled: activeEditSection != null && activeEditSection !== sectionKey,
    onEdit: () => startEdit(sectionKey),
    onCancel: cancelEdit,
    saving
  });

  const contactRows = [
    {
      key: 'email',
      label: MYPAGE_FIELD_LABELS.EMAIL,
      value: maskEmail(formData.email),
      action: (
        <MypageActionButton variant="ghost" onClick={openEmailChangeModal} aria-label="이메일 변경">
          {MYPAGE_LAYOUT_COPY.CHANGE}
        </MypageActionButton>
      )
    },
    {
      key: 'phone',
      label: MYPAGE_FIELD_LABELS.PHONE,
      value: maskPhone(formData.phone),
      action: (
        <MypageActionButton variant="ghost" onClick={openPhoneChangeModal} aria-label="휴대전화 번호 변경">
          {MYPAGE_LAYOUT_COPY.CHANGE}
        </MypageActionButton>
      )
    }
  ];

  const renderBasic = () => {
    const props = panelProps(MYPAGE_SECTION_KEYS.BASIC);
    if (!props.editing) {
      return (
        <MypageSectionPanel key={MYPAGE_SECTION_KEYS.BASIC} {...props}>
          <MypageDefinitionRows
            testId="mypage-basic-rows"
            rows={[
              { key: 'name', label: MYPAGE_FIELD_LABELS.NAME, value: nameFieldForDisplay },
              { key: 'nickname', label: MYPAGE_FIELD_LABELS.NICKNAME, value: formData.nickname },
              ...contactRows,
              hideGender ? null : { key: 'gender', label: MYPAGE_FIELD_LABELS.GENDER, value: genderLabel },
              hideAddress ? null : { key: 'address', label: MYPAGE_FIELD_LABELS.ADDRESS, value: addressText }
            ]}
          />
        </MypageSectionPanel>
      );
    }
    return (
      <MypageSectionPanel key={MYPAGE_SECTION_KEYS.BASIC} {...props} formId={BASIC_FORM_ID}>
        <form id={BASIC_FORM_ID} className="mg-mypage-form" onSubmit={handleSubmit} noValidate>
          <div className="mg-mypage-form__field">
            <span className="mg-v2-form-label">{MYPAGE_FIELD_LABELS.PROFILE_IMAGE}</span>
            <ProfileImageInput
              value={profileImageSlotValue}
              onChange={handleImageChange}
              helpText={MYPAGE_FIELD_LABELS.PROFILE_IMAGE_HELP}
              hideLabel
              selectVariant="outline"
              actionSize="small"
            />
          </div>
          <div className="mg-mypage-form__field">
            <label className="mg-v2-form-label" htmlFor="mg-mypage-user-id">
              {MYPAGE_FIELD_LABELS.NAME}
            </label>
            <input
              className="mg-v2-form-input"
              id="mg-mypage-user-id"
              name="userId"
              type="text"
              value={nameFieldForDisplay}
              onChange={handleInputChange}
              autoComplete="name"
            />
          </div>
          <div className="mg-mypage-form__field">
            <label className="mg-v2-form-label" htmlFor="mg-mypage-nickname">
              {MYPAGE_FIELD_LABELS.NICKNAME}
            </label>
            <input
              className="mg-v2-form-input"
              id="mg-mypage-nickname"
              name="nickname"
              type="text"
              value={formData.nickname || ''}
              onChange={handleInputChange}
              autoComplete="nickname"
            />
          </div>
          <MypageDefinitionRows rows={contactRows} />
          {hideGender ? null : (
            <div className="mg-mypage-form__field">
              <label className="mg-v2-form-label" htmlFor="mg-mypage-gender">
                {MYPAGE_FIELD_LABELS.GENDER}
              </label>
              <select
                className="mg-v2-form-select"
                id="mg-mypage-gender"
                name="gender"
                value={formData.gender || ''}
                onChange={handleInputChange}
                disabled={loadingCodes}
              >
                <option value="">{MYPAGE_FIELD_LABELS.SELECT_PLACEHOLDER}</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {hideAddress ? null : (
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
              isEditing
            />
          )}
        </form>
      </MypageSectionPanel>
    );
  };

  const renderCounsel = () => {
    const props = panelProps(MYPAGE_SECTION_KEYS.COUNSEL);
    if (!props.editing) {
      return (
        <MypageSectionPanel key={MYPAGE_SECTION_KEYS.COUNSEL} {...props}>
          <MypageDefinitionRows
            testId="mypage-counsel-rows"
            rows={PROFESSIONAL_FIELDS.map((field) => {
              if (field.name === 'specialty') {
                return {
                  key: field.name,
                  label: field.label,
                  value: specialtyNames,
                  display: (
                    <span className="mg-mypage-chip-list" data-testid="mypage-specialty-chips">
                      {specialtyNames.map((name) => (
                        <span key={name} className="mg-mypage-chip">
                          <SafeText>{name}</SafeText>
                        </span>
                      ))}
                    </span>
                  )
                };
              }
              return {
                key: field.name,
                label: field.label,
                value: formData[field.name],
                clamp: Boolean(field.multiline)
              };
            })}
          />
        </MypageSectionPanel>
      );
    }
    return (
      <MypageSectionPanel key={MYPAGE_SECTION_KEYS.COUNSEL} {...props} formId={COUNSEL_FORM_ID}>
        <form id={COUNSEL_FORM_ID} className="mg-mypage-form" onSubmit={handleSubmit} noValidate>
          {PROFESSIONAL_FIELDS.map((field) => (
            <div key={field.name} className="mg-mypage-form__field">
              <label className="mg-v2-form-label" htmlFor={`mg-mypage-${field.name}`}>
                {field.label}
              </label>
              {field.multiline ? (
                <textarea
                  className="mg-v2-form-input mg-mypage-form__textarea"
                  id={`mg-mypage-${field.name}`}
                  name={field.name}
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                  rows={3}
                />
              ) : (
                <input
                  className="mg-v2-form-input"
                  id={`mg-mypage-${field.name}`}
                  name={field.name}
                  type="text"
                  value={formData[field.name] || ''}
                  onChange={handleInputChange}
                />
              )}
              {field.name === 'specialty' && specialtyNames.length > 0 ? (
                <span className="mg-v2-form-help">
                  <SafeText>{specialtyNames.join(', ')}</SafeText>
                </span>
              ) : null}
            </div>
          ))}
        </form>
      </MypageSectionPanel>
    );
  };

  const renderNotify = () => {
    const props = panelProps(MYPAGE_SECTION_KEYS.NOTIFY);
    const preference = formData.notificationChannelPreference
      || NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT;
    const optionKeys = NOTIFY_OPTION_KEYS[preference]
      || NOTIFY_OPTION_KEYS[NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT];
    const channelSection = (
      <NotificationChannelPreferenceSection
        displayUser={displayUser}
        isEditing={props.editing}
        preferenceValue={preference}
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
        translate={translateNotifyCopy}
        hideHeading
      />
    );
    return (
      <MypageSectionPanel
        key={MYPAGE_SECTION_KEYS.NOTIFY}
        {...props}
        formId={props.editing ? NOTIFY_FORM_ID : undefined}
      >
        {props.editing ? (
          <form id={NOTIFY_FORM_ID} className="mg-mypage-form" onSubmit={handleSubmit} noValidate>
            {channelSection}
          </form>
        ) : (
          <MypageDefinitionRows
            testId="mypage-notify-rows"
            rows={[
              {
                key: 'notify-channel',
                label: MYPAGE_FIELD_LABELS.NOTIFY_CHANNEL,
                value: translateNotifyCopy(optionKeys.label),
                caption: translateNotifyCopy(optionKeys.desc)
              }
            ]}
          />
        )}
        {notifyExtra}
      </MypageSectionPanel>
    );
  };

  const renderers = {
    [MYPAGE_SECTION_KEYS.BASIC]: renderBasic,
    [MYPAGE_SECTION_KEYS.COUNSEL]: renderCounsel,
    [MYPAGE_SECTION_KEYS.NOTIFY]: showNotify ? renderNotify : () => null
  };

  return (
    <>
      {visibleSections.map((key) => renderers[key]())}

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
