import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Users, Calendar } from 'lucide-react';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import ProfileImageInput from '../../common/ProfileImageInput';
import MgEmailFieldWithAutocomplete from '../../common/MgEmailFieldWithAutocomplete';
import KoreanMobileDuplicateField from '../../common/molecules/KoreanMobileDuplicateField';
import StandardizedApi from '../../../utils/standardizedApi';
import UnifiedModal from '../../common/modals/UnifiedModal';
import BadgeSelect from '../../common/BadgeSelect';
import {
  VALIDATION_MESSAGES
} from '../../../constants/messages';
import { isValidVehiclePlateOptional } from '../../../utils/validationUtils';
import SafeText from '../../common/SafeText';
import { formatConsultantGenderLabel, getConsultantAgeYears } from '../../../utils/consultantHelper';
import { getUserGradeKoreanNameSync } from '../../../utils/codeHelper';
import { toDisplayString } from '../../../utils/safeDisplay';
import { isValidKoreanMobileDigits, normalizeKoreanMobileDigits } from '../../../utils/koreanMobilePhone';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import PsychClientContextSummaryBlock from '../../psych-context/organisms/PsychClientContextSummaryBlock';
import ContentKpiRow from '../../dashboard-v2/content/ContentKpiRow';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import NotificationChannelPreferenceSection from '../../mypage/components/NotificationChannelPreferenceSection';
import { NOTIFICATION_CHANNEL_PREFERENCE_VALUE } from '../../../constants/notificationChannelPreference';
import {
    LOGIN_PASSWORD_FIELD_PLACEHOLDER,
    LOGIN_PASSWORD_POLICY_HINT_ONE_LINE
} from '../../../constants/passwordPolicyUi';
import './ClientModal.css';
import { useTranslation } from 'react-i18next';

const CLIENT_MODAL_KPI_LABEL_FALLBACK = {
  CURRENT_CONSULTANTS: '연결 상담사',
  TOTAL_SESSIONS: '일정(회기) 건수'
};

const CLIENT_MODAL_KPI_ICON_SIZE = 24;

/**
 * 내담자 모달 컴포넌트
 */
const ClientModal = ({
    type,
    client,
    formData,
    setFormData,
    onClose,
    onSave,
    userStatusOptions
}) => {
    const { t } = useTranslation(['admin', 'common']);
    const [emailCheckStatus, setEmailCheckStatus] = useState(null); // 'checking', 'duplicate', 'available', null
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [phoneCheckStatus, setPhoneCheckStatus] = useState(null);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [vehiclePlateError, setVehiclePlateError] = useState('');
    const [clientSummary, setClientSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const clientRef = useRef(client);
    clientRef.current = client;

    const editClientPhoneBaseline = useMemo(() => {
        if (type !== 'edit' || !client?.id) {
            return '';
        }
        return normalizeKoreanMobileDigits(String(client.phone ?? ''));
    }, [type, client?.id, client?.phone]);

    useEffect(() => {
        setPhoneCheckStatus(null);
    }, [type, client?.id]);

    useEffect(() => {
      const c = clientRef.current;
      if (!type || type === 'create' || type === 'delete' || !c?.id) {
        setClientSummary(null);
        setSummaryLoading(false);
        return undefined;
      }

      let cancelled = false;

      setSummaryLoading(true);
      setClientSummary(null);

      (async() => {
        try {
          const data = await StandardizedApi.get(`${API_ENDPOINTS.ADMIN.CLIENTS.WITH_STATS}/${c.id}`);
          if (cancelled) {
            return;
          }
          if (data && typeof data === 'object') {
            setClientSummary({
              currentConsultants: typeof data.currentConsultants === 'number' ? data.currentConsultants : 0,
              totalSessions: typeof data.statistics?.totalSessions === 'number' ? data.statistics.totalSessions : null,
              persistedGrade: data.client?.grade
            });
            const ac = data.client;
            if (ac && typeof ac === 'object' && (type === 'view' || type === 'edit')) {
              setFormData((prev) => ({
                ...prev,
                consultationPurpose: ac.consultationPurpose != null ? ac.consultationPurpose : '',
                consultationHistory: ac.consultationHistory != null ? ac.consultationHistory : '',
                emergencyContact: ac.emergencyContact != null ? ac.emergencyContact : '',
                emergencyPhone: ac.emergencyPhone != null ? ac.emergencyPhone : '',
                notes: ac.notes != null ? ac.notes : prev.notes,
                address: ac.address != null ? ac.address : prev.address,
                addressDetail: ac.addressDetail != null ? ac.addressDetail : prev.addressDetail,
                postalCode: ac.postalCode != null ? ac.postalCode : prev.postalCode,
                gender: ac.gender != null ? ac.gender : prev.gender,
                birthDate: ac.birthDate != null ? ac.birthDate : prev.birthDate,
                age: ac.age != null ? ac.age : prev.age,
                vehiclePlate: ac.vehiclePlate != null ? ac.vehiclePlate : prev.vehiclePlate,
                grade: ac.grade != null ? ac.grade : prev.grade,
                status: ac.status != null ? ac.status : prev.status,
                profileImageUrl: ac.profileImageUrl != null ? ac.profileImageUrl : prev.profileImageUrl,
                phone: ac.phone != null ? ac.phone : prev.phone,
                name: ac.name != null ? ac.name : prev.name
              }));
            }
          } else {
            setClientSummary({
              currentConsultants: typeof c.currentConsultants === 'number' ? c.currentConsultants : 0,
              totalSessions: typeof c.statistics?.totalSessions === 'number' ? c.statistics.totalSessions : null,
              persistedGrade: c.grade
            });
          }
        } catch (err) {
          console.error('내담자 with-stats 요약 로드 실패:', err);
          if (!cancelled) {
            setClientSummary({
              currentConsultants: typeof c.currentConsultants === 'number' ? c.currentConsultants : 0,
              totalSessions: typeof c.statistics?.totalSessions === 'number' ? c.statistics.totalSessions : null,
              persistedGrade: c.grade
            });
          }
        } finally {
          if (!cancelled) {
            setSummaryLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [type, client?.id, setFormData]);

    useEffect(() => {
      if (!client?.id || (type !== 'view' && type !== 'edit')) {
        return undefined;
      }
      let cancelled = false;
      (async() => {
        try {
          const profile = await StandardizedApi.get(`/api/v1/users/profile/${client.id}`);
          if (cancelled || !profile) {
            return;
          }
          setFormData((prev) => ({
            ...prev,
            notificationChannelPreference:
              profile.notificationChannelPreference || NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT,
            tenantNotificationChannelKakaoAvailable: profile.tenantNotificationChannelKakaoAvailable,
            tenantNotificationChannelSmsAvailable: profile.tenantNotificationChannelSmsAvailable,
            tenantDefaultNotificationChannelHint: profile.tenantDefaultNotificationChannelHint,
            notificationChannelPreferenceUiAdjusted: profile.notificationChannelPreferenceUiAdjusted,
            notificationChannelPreferenceEditableByCaller:
              profile.notificationChannelPreferenceEditableByCaller !== false
          }));
        } catch (err) {
          console.debug('내담자 알림 채널 선호 로드 생략:', err);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [client?.id, type, setFormData]);

    const summaryKpiItems = useMemo(() => {
      if (!clientSummary) {
        return [];
      }
      const sessionsVal = clientSummary.totalSessions;
      return [
        {
          id: 'currentConsultants',
          icon: <Users size={CLIENT_MODAL_KPI_ICON_SIZE} aria-hidden />,
          label: t('admin:clientModal.summary.kpi.currentConsultants', CLIENT_MODAL_KPI_LABEL_FALLBACK.CURRENT_CONSULTANTS),
          value: clientSummary.currentConsultants,
          iconVariant: 'blue'
        },
        {
          id: 'totalSessions',
          icon: <Calendar size={CLIENT_MODAL_KPI_ICON_SIZE} aria-hidden />,
          label: t('admin:clientModal.summary.kpi.totalSessions', CLIENT_MODAL_KPI_LABEL_FALLBACK.TOTAL_SESSIONS),
          value: sessionsVal == null ? '—' : sessionsVal,
          iconVariant: 'green'
        }
      ];
    }, [clientSummary, t]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'vehiclePlate') {
            if (value.trim() && !isValidVehiclePlateOptional(value)) {
                setVehiclePlateError(VALIDATION_MESSAGES.INVALID_VEHICLE_PLATE);
            } else {
                setVehiclePlateError('');
            }
        }

        // 이메일 입력 시 중복 확인 상태 초기화
        if (name === 'email') {
            setEmailCheckStatus(null);
        }
        if (name === 'phone') {
            setPhoneCheckStatus(null);
        }
    };

    const handleClientPhoneDuplicateCheck = useCallback(async() => {
        const raw = String(formData.phone ?? '').trim();
        const normalized = normalizeKoreanMobileDigits(raw);
        if (!normalized || !isValidKoreanMobileDigits(normalized)) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: VALIDATION_MESSAGES.INVALID_PHONE, type: 'warning' }
            }));
            setPhoneCheckStatus(null);
            return;
        }
        setIsCheckingPhone(true);
        try {
            const params = { phone: normalized };
            if (type === 'edit' && client?.id) {
                params.excludeUserId = client.id;
            }
            const response = await StandardizedApi.get(API_ENDPOINTS.ADMIN.DUPLICATE_CHECK.PHONE, params);
            if (response && typeof response.isDuplicate === 'boolean') {
                if (response.isDuplicate === false && response.available === false) {
                    setPhoneCheckStatus(null);
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: response.message || VALIDATION_MESSAGES.INVALID_PHONE, type: 'warning' }
                    }));
                    return;
                }
                if (response.isDuplicate) {
                    setPhoneCheckStatus('duplicate');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.PHONE_EXISTS, type: 'error' }
                    }));
                } else {
                    setPhoneCheckStatus('available');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.PHONE_AVAILABLE, type: 'success' }
                    }));
                }
            } else {
                setPhoneCheckStatus(null);
            }
        } catch (error) {
            console.error('휴대폰 중복 확인 오류:', error);
            setPhoneCheckStatus(null);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: VALIDATION_MESSAGES.PHONE_DUPLICATE_CHECK_ERROR, type: 'error' }
            }));
        } finally {
            setIsCheckingPhone(false);
        }
    }, [formData.phone, type, client?.id]);
    
    const handleEmailDuplicateCheck = async() => {
        const email = formData.email?.trim();
        if (!email) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: VALIDATION_MESSAGES.REQUIRED_EMAIL, type: 'warning' }
            }));
            return;
        }
        
        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: VALIDATION_MESSAGES.INVALID_EMAIL_FORMAT, type: 'warning' }
            }));
            return;
        }
        
        setIsCheckingEmail(true);
        setEmailCheckStatus('checking');
        
        try {
            const response = await StandardizedApi.get(API_ENDPOINTS.ADMIN.DUPLICATE_CHECK.EMAIL, { email });
            console.log('📧 이메일 중복 확인 응답:', response);
            
            if (response && typeof response.isDuplicate === 'boolean') {
                if (response.isDuplicate) {
                    setEmailCheckStatus('duplicate');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.EMAIL_EXISTS, type: 'error' }
                    }));
                } else {
                    setEmailCheckStatus('available');
                    window.dispatchEvent(new CustomEvent('showNotification', {
                        detail: { message: VALIDATION_MESSAGES.EMAIL_AVAILABLE, type: 'success' }
                    }));
                }
            } else {
                setEmailCheckStatus(null);
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: VALIDATION_MESSAGES.EMAIL_DUPLICATE_CHECK_ERROR, type: 'error' }
                }));
            }
        } catch (error) {
            console.error('❌ 이메일 중복 확인 오류:', error);
            setEmailCheckStatus(null);
            window.dispatchEvent(new CustomEvent('showNotification', {
                detail: { message: VALIDATION_MESSAGES.EMAIL_DUPLICATE_CHECK_ERROR, type: 'error' }
            }));
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const plateRaw = formData.vehiclePlate;
        if (plateRaw != null && String(plateRaw).trim() !== '' && !isValidVehiclePlateOptional(plateRaw)) {
            setVehiclePlateError(VALIDATION_MESSAGES.INVALID_VEHICLE_PLATE);
            return undefined;
        }
        setVehiclePlateError('');
        const phoneNorm = normalizeKoreanMobileDigits(String(formData.phone ?? '').trim());
        if (phoneNorm && isValidKoreanMobileDigits(phoneNorm)) {
            if (type === 'create' && phoneCheckStatus !== 'available') {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: VALIDATION_MESSAGES.PHONE_DUPLICATE_CHECK_REQUIRED, type: 'warning' }
                }));
                return undefined;
            }
            if (type === 'edit' && phoneNorm !== editClientPhoneBaseline && phoneCheckStatus !== 'available') {
                window.dispatchEvent(new CustomEvent('showNotification', {
                    detail: { message: VALIDATION_MESSAGES.PHONE_DUPLICATE_CHECK_REQUIRED, type: 'warning' }
                }));
                return undefined;
            }
        }
        return onSave(formData);
    };

    const getTitle = () => {
        switch (type) {
            case 'create': return t('admin:clientModal.title.create');
            case 'edit': return t('admin:clientModal.title.edit');
            case 'delete': return t('admin:clientModal.title.delete');
            case 'view': return t('admin:clientModal.title.view');
            default: return t('admin:clientModal.title.default');
        }
    };

    const getSubmitText = () => {
        switch (type) {
            case 'create': return t('admin:actions.register');
            case 'edit': return t('admin:actions.edit');
            case 'delete': return t('admin:actions.delete');
            case 'view': return t('common:action.close');
            default: return t('common:action.save');
        }
    };

    const renderSummaryStrip = () => {
        // 삭제 모달은 '누적 지표' 영역이 의미가 없으므로 렌더하지 않는다 (P1 hotfix:
        // 빈 ContentSection 노출 회귀 차단). view/edit 진입 시에만 KPI 카드를 보여준다.
        if (type === 'create' || type === 'delete' || !client?.id) {
            return null;
        }
        const persistedGrade = clientSummary?.persistedGrade;
        const hasGradeCode = persistedGrade != null && String(persistedGrade).trim() !== '';
        const gradeKorean = hasGradeCode ? getUserGradeKoreanNameSync(persistedGrade) : '—';

        const summaryTitle = t('admin:clientModal.summary.title');
        const gradeLabel = t('admin:clientModal.summary.gradeLabel');

        return (
            <ContentSection
                title={summaryTitle}
                noCard
                className="mg-v2-client-modal__summary"
            >
                {summaryLoading ? (
                    <p className="mg-v2-client-modal__summary-loading">
                        <SafeText>{t('admin:clientModal.summary.loading')}</SafeText>
                    </p>
                ) : (
                    <ContentKpiRow items={summaryKpiItems} />
                )}
                {!summaryLoading && clientSummary ? (
                    <div className="mg-v2-ad-b0kla__client-modal-grade">
                        <span className="mg-v2-ad-b0kla__client-modal-grade__label">
                            {gradeLabel}
                        </span>
                                               <div
                            className="mg-v2-ad-b0kla__client-modal-grade__value"
                            aria-label={`${gradeLabel} ${toDisplayString(gradeKorean, '—')}`}
                        >
                            <span className="mg-v2-ad-b0kla__client-modal-grade__name">
                                <SafeText>{toDisplayString(gradeKorean, '—')}</SafeText>
                            </span>
                        </div>
                    </div>
                ) : null}
            </ContentSection>
        );
    };

    const renderDeleteContent = () => (
        <div className="mg-v2-modal-content">
            <div className="mg-v2-delete-confirmation">
                <h3>{t('admin:clientModal.delete.confirmTitle')}</h3>
                <p>{t('admin:clientModal.delete.description')}</p>
                <div className="mg-v2-client-info">
                    <p><strong>{t('admin:labels.name')}:</strong> <SafeText>{client?.name}</SafeText></p>
                    <p><strong>{t('admin:labels.email')}:</strong> <SafeText>{client?.email}</SafeText></p>
                    <p><strong>{t('admin:labels.phone')}:</strong> <SafeText>{client?.phone}</SafeText></p>
                </div>
                <p className="mg-v2-warning-text">
                    {t('admin:clientModal.delete.warning')}
                </p>
            </div>
        </div>
    );

    const renderFormContent = () => {
        const safeFormData = {
            name: formData.name || '',
            email: formData.email || '',
            password: formData.password || '',
            phone: formData.phone || '',
            status: formData.status || 'ACTIVE',
            grade: formData.grade || 'BRONZE',
            notes: formData.notes || '',
            profileImageUrl: formData.profileImageUrl || '',
            rrnFirst6: formData.rrnFirst6 || '',
            rrnLast1: formData.rrnLast1 || '',
            address: formData.address || '',
            addressDetail: formData.addressDetail || '',
            postalCode: formData.postalCode || '',
            vehiclePlate: formData.vehiclePlate || '',
            gender: formData.gender || '',
            birthDate: formData.birthDate ?? null,
            age: formData.age != null && formData.age !== '' ? formData.age : null,
            consultationPurpose: formData.consultationPurpose || '',
            consultationHistory: formData.consultationHistory || '',
            emergencyContact: formData.emergencyContact || '',
            emergencyPhone: formData.emergencyPhone || ''
        };

        const demographicAgeYears = getConsultantAgeYears({
            gender: safeFormData.gender,
            birthDate: safeFormData.birthDate,
            age: safeFormData.age
        });
        const demographicGenderText = formatConsultantGenderLabel(safeFormData.gender) || '—';
        const demographicAgeText = demographicAgeYears != null ? `${demographicAgeYears}세` : '—';

        return (
            <form onSubmit={handleSubmit} className="mg-v2-form">
                {type === 'create' && (
                    <div className="mg-v2-info-box mg-v2-ad-b0kla-info-box">
                        <p className="mg-v2-info-text">
                            {t('admin:clientModal.form.passwordHint')}
                        </p>
                    </div>
                )}
                <ProfileImageInput
                    key={formData.profileImageUrl ? 'profile-has-image' : 'profile-no-image'}
                    value={formData.profileImageUrl || ''}
                    onChange={(url) => setFormData(prev => ({ ...prev, profileImageUrl: url || '' }))}
                    maxBytes={2 * 1024 * 1024}
                    cropSize={400}
                    maxSize={512}
                    quality={0.85}
                    helpText={t('admin:clientModal.form.profileImageHelp')}
                    disabled={type === 'view'}
                />
                {/* 공통 순서: 1. 주민번호 2. 이름 3. 전화번호 4. 주소 → 나머지 */}
                <div className="mg-v2-form-group">
                    {type === 'edit' && (
                        <small className="mg-v2-form-help">{t('admin:clientModal.form.editHelp')}</small>
                    )}
                    <div className={`mg-v2-form-row mg-v2-form-row--two mg-v2-client-modal__form-row-two${type === 'edit' ? ' mg-v2-client-modal__form-row-two--edit-spaced' : ''}`}>
                        <div className="mg-v2-form-group">
                            <label htmlFor="client-rrnFirst6" className="mg-v2-form-label">{t('admin:clientModal.form.rrnFirstLabel')}</label>
                            <input
                                type="text"
                                id="client-rrnFirst6"
                                name="rrnFirst6"
                                value={safeFormData.rrnFirst6}
                                onChange={handleInputChange}
                                placeholder="900101"
                                maxLength={6}
                                inputMode="numeric"
                                className="mg-v2-form-input"
                                readOnly={type === 'view'}
                            />
                        </div>
                        <div className="mg-v2-form-group">
                            <label htmlFor="client-rrnLast1" className="mg-v2-form-label">{t('admin:clientModal.form.rrnLastLabel')}</label>
                            <input
                                type="text"
                                id="client-rrnLast1"
                                name="rrnLast1"
                                value={safeFormData.rrnLast1}
                                onChange={handleInputChange}
                                placeholder="1"
                                maxLength={1}
                                inputMode="numeric"
                                className="mg-v2-form-input"
                                readOnly={type === 'view'}
                            />
                        </div>
                    </div>
                </div>
                {(type === 'view' || type === 'edit') && (
                    <div className="mg-v2-form-group">
                        <div className="mg-v2-form-row mg-v2-form-row--two mg-v2-client-modal__form-row-two">
                            <div className="mg-v2-form-group">
                                <span className="mg-v2-form-label" id="client-demographic-gender-label">{t('admin:clientModal.form.demoGenderLabel')}</span>
                                <input
                                    type="text"
                                    readOnly
                                    className="mg-v2-form-input"
                                    value={demographicGenderText}
                                    aria-labelledby="client-demographic-gender-label"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <span className="mg-v2-form-label" id="client-demographic-age-label">{t('admin:clientModal.form.demoAgeLabel')}</span>
                                <input
                                    type="text"
                                    readOnly
                                    className="mg-v2-form-input"
                                    value={demographicAgeText}
                                    aria-labelledby="client-demographic-age-label"
                                />
                            </div>
                        </div>
                        {type === 'edit' ? (
                            <small className="mg-v2-form-help">
                                {t('admin:clientModal.form.rrnAgeHelp')}
                            </small>
                        ) : null}
                    </div>
                )}
                <div className="mg-v2-form-group">
                    <label htmlFor="name" className="mg-v2-form-label">{t('admin:labels.name')} {type === 'create' && '*'}</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={safeFormData.name}
                        onChange={handleInputChange}
                        required={type === 'create'}
                        placeholder={t('admin:clientModal.namePlaceholder')}
                        className="mg-v2-form-input"
                        readOnly={type === 'view'}
                    />
                </div>
                <KoreanMobileDuplicateField
                    mode={type === 'view' ? 'inputOnly' : 'withDuplicate'}
                    label={t('admin:clientModal.form.phoneLabel')}
                    id="phone"
                    name="phone"
                    value={safeFormData.phone}
                    onChange={handleInputChange}
                    onBlur={type === 'view' ? undefined : (e) => {
                        const raw = String(e.target.value ?? '').trim();
                        const n = raw ? normalizeKoreanMobileDigits(raw) : '';
                        setFormData((prev) => (prev.phone === n ? prev : { ...prev, phone: n }));
                    }}
                    onDuplicateClick={type === 'view' ? undefined : handleClientPhoneDuplicateCheck}
                    isCheckingDuplicate={isCheckingPhone}
                    duplicateButtonDataAction="client-modal-phone-duplicate-check"
                    duplicateButtonLabel={VALIDATION_MESSAGES.BUTTON_DUPLICATE_CHECK}
                    checkStatus={type === 'view' ? null
                        : (phoneCheckStatus === 'duplicate' ? 'duplicate' : phoneCheckStatus === 'available' ? 'available' : null)}
                    messageDuplicate={VALIDATION_MESSAGES.PHONE_EXISTS}
                    messageAvailable={VALIDATION_MESSAGES.PHONE_AVAILABLE}
                    disabled={type === 'view'}
                    duplicateDisabled={type === 'view'}
                    placeholder={t('admin:clientModal.form.phonePlaceholder', '010-1234-5678')}
                    readOnly={type === 'view'}
                >
                    {type === 'create' ? (
                        <small className="mg-v2-form-help">
                            {VALIDATION_MESSAGES.HELP_EMAIL_OR_PHONE_ONE_REQUIRED}
                        </small>
                    ) : null}
                </KoreanMobileDuplicateField>
                <div className="mg-v2-form-group">
                    <label htmlFor="client-vehiclePlate" className="mg-v2-form-label">{t('admin:clientModal.form.vehiclePlateLabel')}</label>
                    <input
                        type="text"
                        id="client-vehiclePlate"
                        name="vehiclePlate"
                        value={safeFormData.vehiclePlate}
                        onChange={handleInputChange}
                        placeholder={t('admin:clientModal.form.vehiclePlatePlaceholder')}
                        maxLength={32}
                        className={`mg-v2-form-input${vehiclePlateError ? ' mg-v2-form-input--error' : ''}`}
                        readOnly={type === 'view'}
                        autoComplete="off"
                        aria-invalid={vehiclePlateError ? true : undefined}
                        aria-describedby={vehiclePlateError ? 'client-vehiclePlate-error' : undefined}
                    />
                    <small className="mg-v2-form-help">{t('admin:clientModal.form.vehiclePlateHelp')}</small>
                    {vehiclePlateError ? (
                        <small id="client-vehiclePlate-error" className="mg-v2-form-help mg-v2-form-help--error" role="alert">
                            ⚠️ <SafeText>{vehiclePlateError}</SafeText>
                        </small>
                    ) : null}
                </div>
                <div className="mg-v2-form-group">
                    <label className="mg-v2-form-label">{t('admin:clientModal.form.addressLabel')}</label>
                    <div className="mg-v2-address-search-row mg-v2-client-modal__address-row">
                        <MGButton
                            type="button"
                            variant="secondary"
                            size="medium"
                            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            disabled={type === 'view'}
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.daum && window.daum.Postcode) {
                                    new window.daum.Postcode({
                                        oncomplete: function(data) {
                                            setFormData(prev => ({
                                                ...prev,
                                                postalCode: data.zonecode || '',
                                                address: data.address || ''
                                            }));
                                        }
                                    }).open();
                                } else {
                                    window.dispatchEvent(new CustomEvent('showNotification', {
                                        detail: { message: t('admin:clientModal.form.addressLoadFailed'), type: 'info' }
                                    }));
                                }
                            }}
                        >
                            {t('admin:clientModal.form.addressBtn')}
                        </MGButton>
                        <input
                            type="text"
                            readOnly
                            className="mg-v2-form-input mg-v2-client-modal__address-input"
                            value={safeFormData.address}
                            placeholder={t('admin:clientModal.form.addressInputPlaceholder')}
                        />
                    </div>
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="client-addressDetail" className="mg-v2-form-label">{t('admin:clientModal.form.addressDetailLabel')}</label>
                    <input
                        type="text"
                        id="client-addressDetail"
                        name="addressDetail"
                        value={safeFormData.addressDetail}
                        onChange={handleInputChange}
                        placeholder={t('admin:clientModal.form.addressDetailPlaceholder')}
                        className="mg-v2-form-input"
                        readOnly={type === 'view'}
                    />
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="client-postalCode" className="mg-v2-form-label">{t('admin:clientModal.form.postalLabel')}</label>
                    <input
                        type="text"
                        id="client-postalCode"
                        name="postalCode"
                        value={safeFormData.postalCode}
                        onChange={handleInputChange}
                        placeholder="00000"
                        maxLength={5}
                        className="mg-v2-form-input"
                        readOnly={type === 'view'}
                    />
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="email" className="mg-v2-form-label">
                        {type === 'create' ? t('admin:clientModal.form.emailLabel') : VALIDATION_MESSAGES.LABEL_EMAIL_REQUIRED}
                    </label>
                    <div className="mg-v2-form-email-row">
                        <div className="mg-v2-form-email-row__input-wrap">
                            <MgEmailFieldWithAutocomplete
                                id="email"
                                name="email"
                                value={safeFormData.email}
                                onChange={handleInputChange}
                                placeholder={t('admin:clientModal.form.emailPlaceholder', 'example@email.com')}
                                required={false}
                                disabled={type === 'edit'}
                                autocompleteMode="datalist"
                            />
                        </div>
                        {type === 'create' && (
                            <MGButton
                                type="button"
                                variant="secondary"
                                size="medium"
                                onClick={handleEmailDuplicateCheck}
                                disabled={isCheckingEmail || !safeFormData.email?.trim()}
                                className={buildErpMgButtonClassName({
                                    variant: 'secondary',
                                    size: 'md',
                                    loading: isCheckingEmail,
                                    className: 'mg-v2-button--compact'
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                data-action="email-duplicate-check"
                                loading={isCheckingEmail}
                            >
                                {VALIDATION_MESSAGES.BUTTON_DUPLICATE_CHECK}
                            </MGButton>
                        )}
                    </div>
                    {type === 'edit' && (
                        <small className="mg-v2-form-help">{VALIDATION_MESSAGES.HELP_EMAIL_READONLY}</small>
                    )}
                    {type === 'create' && emailCheckStatus === 'duplicate' && (
                        <small className="mg-v2-form-help mg-v2-form-help--error">⚠️ {VALIDATION_MESSAGES.EMAIL_EXISTS}</small>
                    )}
                    {type === 'create' && emailCheckStatus === 'available' && (
                        <small className="mg-v2-form-help mg-v2-form-help--success">✅ {VALIDATION_MESSAGES.EMAIL_AVAILABLE}</small>
                    )}
                </div>
                {type === 'create' && (
                    <div className="mg-v2-form-group">
                        <label htmlFor="password" className="mg-v2-form-label">{t('admin:clientModal.form.passwordLabel')}</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={safeFormData.password}
                            onChange={handleInputChange}
                            placeholder={LOGIN_PASSWORD_FIELD_PLACEHOLDER}
                            className="mg-v2-form-input"
                        />
                        <small className="mg-v2-form-help">
                            {LOGIN_PASSWORD_POLICY_HINT_ONE_LINE}{t('admin:clientModal.form.passwordHelpSuffix')}
                        </small>
                    </div>
                )}
                <div className="mg-v2-form-group">
                    <label htmlFor="status" className="mg-v2-form-label">{t('admin:labels.status')}</label>
                    <BadgeSelect
                        value={safeFormData.status}
                        onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                        disabled={type === 'view'}
                        options={userStatusOptions && userStatusOptions.length > 0
                            ? userStatusOptions.map(option => ({
                                value: option.codeValue || option.code,
                                label: option.codeLabel || option.name || option.codeValue || option.code
                              }))
                            : [
                                { value: 'ACTIVE', label: t('admin:labels.active') },
                                { value: 'INACTIVE', label: t('admin:labels.inactive') },
                                { value: 'PENDING', label: t('admin:labels.pending') }
                              ]}
                        placeholder={t('admin:messages.pleaseSelect')}
                        className="mg-v2-form-badge-select"
                    />
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="grade" className="mg-v2-form-label">{t('admin:clientModal.form.gradeLabel')}</label>
                    <BadgeSelect
                        value={safeFormData.grade}
                        onChange={(val) => setFormData(prev => ({ ...prev, grade: val }))}
                        disabled={type === 'view'}
                        options={[
                            { value: 'BRONZE', label: t('admin:clientModal.gradeOption.bronze') },
                            { value: 'SILVER', label: t('admin:clientModal.gradeOption.silver') },
                            { value: 'GOLD', label: t('admin:clientModal.gradeOption.gold') },
                            { value: 'PLATINUM', label: t('admin:clientModal.gradeOption.platinum') },
                            { value: 'DIAMOND', label: t('admin:clientModal.gradeOption.diamond') }
                        ]}
                        placeholder={t('admin:messages.pleaseSelect')}
                        className="mg-v2-form-badge-select"
                    />
                </div>
                {(type === 'view' || type === 'edit') && client?.id ? (
                    <div className="mg-v2-client-modal__notification-channel">
                        <NotificationChannelPreferenceSection
                            subjectRole="CLIENT"
                            isEditing={type === 'edit'}
                            readOnlyDueToPolicy={
                                type === 'view' || formData.notificationChannelPreferenceEditableByCaller === false
                            }
                            readOnlyHintI18nKey="admin.userProfile.notificationChannel.staffReadOnlyHint"
                            preferenceValue={
                                formData.notificationChannelPreference
                                || NOTIFICATION_CHANNEL_PREFERENCE_VALUE.TENANT_DEFAULT
                            }
                            tenantKakaoAvailable={formData.tenantNotificationChannelKakaoAvailable}
                            tenantSmsAvailable={formData.tenantNotificationChannelSmsAvailable}
                            tenantDefaultHint={formData.tenantDefaultNotificationChannelHint}
                            preferenceUiAdjusted={formData.notificationChannelPreferenceUiAdjusted}
                            onPreferenceChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    notificationChannelPreference: e.target.value
                                }));
                            }}
                        />
                    </div>
                ) : null}
                <ContentSection title={t('admin:clientModal.section.consultation')} noCard className="mg-v2-client-modal__subsection">
                    <div className="mg-v2-form-group">
                        <label htmlFor="client-consultationPurpose" className="mg-v2-form-label">{t('admin:clientModal.consultationPurpose')}</label>
                        <textarea
                            id="client-consultationPurpose"
                            name="consultationPurpose"
                            value={safeFormData.consultationPurpose}
                            onChange={handleInputChange}
                            rows={3}
                            className="mg-v2-form-textarea"
                            readOnly={type === 'view'}
                            placeholder={t('admin:clientModal.consultationPurposePlaceholder')}
                        />
                    </div>
                    <div className="mg-v2-form-group">
                        <label htmlFor="client-consultationHistory" className="mg-v2-form-label">{t('admin:clientModal.consultationHistory')}</label>
                        <textarea
                            id="client-consultationHistory"
                            name="consultationHistory"
                            value={safeFormData.consultationHistory}
                            onChange={handleInputChange}
                            rows={3}
                            className="mg-v2-form-textarea"
                            readOnly={type === 'view'}
                            placeholder={t('admin:clientModal.consultationHistoryPlaceholder')}
                        />
                    </div>
                </ContentSection>
                <ContentSection title={t('admin:clientModal.section.emergency')} noCard className="mg-v2-client-modal__subsection">
                    <div className="mg-v2-form-row mg-v2-form-row--two mg-v2-client-modal__form-row-two">
                        <div className="mg-v2-form-group">
                            <label htmlFor="client-emergencyContact" className="mg-v2-form-label">{t('admin:clientModal.emergencyContact')}</label>
                            <input
                                type="text"
                                id="client-emergencyContact"
                                name="emergencyContact"
                                value={safeFormData.emergencyContact}
                                onChange={handleInputChange}
                                className="mg-v2-form-input"
                                readOnly={type === 'view'}
                            />
                        </div>
                        <div className="mg-v2-form-group">
                            <label htmlFor="client-emergencyPhone" className="mg-v2-form-label">{t('admin:clientModal.emergencyPhone')}</label>
                            <input
                                type="tel"
                                id="client-emergencyPhone"
                                name="emergencyPhone"
                                value={safeFormData.emergencyPhone}
                                onChange={handleInputChange}
                                className="mg-v2-form-input"
                                readOnly={type === 'view'}
                            />
                        </div>
                    </div>
                </ContentSection>
                <div className="mg-v2-form-group">
                    <label htmlFor="notes" className="mg-v2-form-label">{t('common:label.memo')}</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={safeFormData.notes}
                        onChange={handleInputChange}
                        rows={4}
                        className="mg-v2-form-textarea"
                        readOnly={type === 'view'}
                    />
                </div>
            </form>
        );
    };

    if (!type) return null;

    return (
        <UnifiedModal
            isOpen={!!type}
            onClose={onClose}
            title={getTitle()}
            size="large"
            className="mg-v2-ad-b0kla"
            backdropClick
            showCloseButton
            actions={
                <>
                    <MGButton
                        variant="secondary"
                        size="medium"
                        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={onClose}
                        preventDoubleClick={true}
                    >
                        {t('admin:actions.cancel')}
                    </MGButton>
                    <MGButton
                        variant={type === 'delete' ? 'danger' : 'primary'}
                        type="button"
                        size="medium"
                        className={buildErpMgButtonClassName({
                            variant: type === 'delete' ? 'danger' : 'primary',
                            size: 'md',
                            loading: false
                        })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔘 모달 저장 버튼 클릭', { type });
                            if (type === 'view') {
                                return onClose();
                            }
                            if (type === 'delete') {
                                return onSave(formData);
                            }
                            const result = handleSubmit(e);
                            console.log('🔘 모달 handleSubmit 반환', { type, hasResult: result != null });
                            return result;
                        }}
                        preventDoubleClick={true}
                        clickDelay={1000}
                    >
                        {getSubmitText()}
                    </MGButton>
                </>
            }
        >
            <div className="mg-v2-modal-body">
                {renderSummaryStrip()}
                {(type === 'view' || type === 'edit') && client?.id ? (
                  <PsychClientContextSummaryBlock clientId={client.id} variant="clientModal" />
                ) : null}
                {type === 'delete' ? renderDeleteContent() : renderFormContent()}
            </div>
        </UnifiedModal>
    );
};

export default ClientModal;
