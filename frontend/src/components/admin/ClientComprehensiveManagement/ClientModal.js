import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, AlertTriangle, Link2, Calendar } from 'lucide-react';
import MGButton from '../../common/MGButton';
import ProfileImageInput from '../../common/ProfileImageInput';
import MgEmailFieldWithAutocomplete from '../../common/MgEmailFieldWithAutocomplete';
import StandardizedApi from '../../../utils/standardizedApi';
import UnifiedModal from '../../common/modals/UnifiedModal';
import BadgeSelect from '../../common/BadgeSelect';
import {
  VALIDATION_MESSAGES
} from '../../../constants/messages';
import { isValidVehiclePlateOptional } from '../../../utils/validationUtils';
import SafeText from '../../common/SafeText';
import { formatConsultantGenderLabel, getConsultantAgeYears } from '../../../utils/consultantHelper';
import { getUserGradeKoreanNameSync, getUserGradeIconSync } from '../../../utils/codeHelper';
import { toDisplayString } from '../../../utils/safeDisplay';
import ContentSection from '../../dashboard-v2/content/ContentSection';
import ContentKpiRow from '../../dashboard-v2/content/ContentKpiRow';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import './ClientModal.css';

/** GET with-stats 및 목록 스냅샷 필드에 맞춘 KPI 라벨(완료율 등 오해 소지 필드는 표시하지 않음) */
const CLIENT_MODAL_KPI_LABELS = {
  CURRENT_CONSULTANTS: '연결 상담사',
  TOTAL_SESSIONS: '일정(회기) 건수'
};

const CLIENT_MODAL_SUMMARY_SECTION_TITLE = '누적 지표';
const CLIENT_MODAL_GRADE_LABEL = '현재 등급(저장값)';

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
    const [emailCheckStatus, setEmailCheckStatus] = useState(null); // 'checking', 'duplicate', 'available', null
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [vehiclePlateError, setVehiclePlateError] = useState('');
    const [clientSummary, setClientSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const clientRef = useRef(client);
    clientRef.current = client;

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

      (async () => {
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

    const summaryKpiItems = useMemo(() => {
      if (!clientSummary) {
        return [];
      }
      const sessionsVal = clientSummary.totalSessions;
      return [
        {
          id: 'currentConsultants',
          icon: <Link2 size={24} />,
          label: CLIENT_MODAL_KPI_LABELS.CURRENT_CONSULTANTS,
          value: clientSummary.currentConsultants,
          iconVariant: 'blue'
        },
        {
          id: 'totalSessions',
          icon: <Calendar size={24} />,
          label: CLIENT_MODAL_KPI_LABELS.TOTAL_SESSIONS,
          value: sessionsVal == null ? '—' : sessionsVal,
          iconVariant: 'green'
        }
      ];
    }, [clientSummary]);

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
    };
    
    const handleEmailDuplicateCheck = async () => {
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
            const response = await StandardizedApi.get('/api/v1/admin/duplicate-check/email', { email });
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
        return onSave(formData);
    };

    const getTitle = () => {
        switch (type) {
            case 'create': return '새 내담자 등록';
            case 'edit': return '내담자 정보 수정';
            case 'delete': return '내담자 삭제';
            case 'view': return '내담자 상세 정보';
            default: return '내담자 관리';
        }
    };

    const getSubmitText = () => {
        switch (type) {
            case 'create': return '등록';
            case 'edit': return '수정';
            case 'delete': return '삭제';
            case 'view': return '닫기';
            default: return '저장';
        }
    };

    const renderSummaryStrip = () => {
        if (type === 'create' || !client?.id) {
            return null;
        }
        const persistedGrade = clientSummary?.persistedGrade;
        const hasGradeCode = persistedGrade != null && String(persistedGrade).trim() !== '';
        const gradeIcon = hasGradeCode ? getUserGradeIconSync(persistedGrade) : '';
        const gradeKorean = hasGradeCode ? getUserGradeKoreanNameSync(persistedGrade) : '—';

        return (
            <ContentSection
                title={CLIENT_MODAL_SUMMARY_SECTION_TITLE}
                noCard
                className="mg-v2-client-modal__summary"
            >
                {summaryLoading ? (
                    <p className="mg-v2-client-modal__summary-loading">
                        <SafeText>불러오는 중…</SafeText>
                    </p>
                ) : (
                    <ContentKpiRow items={summaryKpiItems} />
                )}
                {!summaryLoading && clientSummary ? (
                    <div className="mg-v2-ad-b0kla__client-modal-grade">
                        <span className="mg-v2-ad-b0kla__client-modal-grade__label">
                            {CLIENT_MODAL_GRADE_LABEL}
                        </span>
                        <div
                            className="mg-v2-ad-b0kla__client-modal-grade__value"
                            aria-label={`${CLIENT_MODAL_GRADE_LABEL} ${toDisplayString(gradeKorean, '—')}`}
                        >
                            {gradeIcon ? (
                                <span className="mg-v2-ad-b0kla__client-modal-grade__icon" aria-hidden="true">
                                    {gradeIcon}
                                </span>
                            ) : null}
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
                <h3>정말로 삭제하시겠습니까?</h3>
                <p>다음 내담자의 정보가 영구적으로 삭제됩니다:</p>
                <div className="mg-v2-client-info">
                    <p><strong>이름:</strong> <SafeText>{client?.name}</SafeText></p>
                    <p><strong>이메일:</strong> <SafeText>{client?.email}</SafeText></p>
                    <p><strong>전화번호:</strong> <SafeText>{client?.phone}</SafeText></p>
                </div>
                <p className="mg-v2-warning-text">
                    ⚠️ 이 작업은 되돌릴 수 없습니다.
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
                            💡 비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.
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
                    helpText="이미지 파일만 가능, 최대 2MB (리사이즈·크롭 적용)"
                    disabled={type === 'view'}
                />
                {/* 공통 순서: 1. 주민번호 2. 이름 3. 전화번호 4. 주소 → 나머지 */}
                <div className="mg-v2-form-group">
                    {type === 'edit' && (
                        <small className="mg-v2-form-help">수정 시 기존 값은 표시하지 않습니다. 변경할 때만 입력해 주세요.</small>
                    )}
                    <div className="mg-v2-form-row mg-v2-form-row--two" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: type === 'edit' ? '8px' : 0 }}>
                        <div className="mg-v2-form-group">
                            <label htmlFor="client-rrnFirst6" className="mg-v2-form-label">주민번호 앞 6자리 (선택)</label>
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
                            <label htmlFor="client-rrnLast1" className="mg-v2-form-label">주민번호 뒤 1자리 (선택)</label>
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
                        <div className="mg-v2-form-row mg-v2-form-row--two" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div className="mg-v2-form-group">
                                <span className="mg-v2-form-label" id="client-demographic-gender-label">성별</span>
                                <input
                                    type="text"
                                    readOnly
                                    className="mg-v2-form-input"
                                    value={demographicGenderText}
                                    aria-labelledby="client-demographic-gender-label"
                                />
                            </div>
                            <div className="mg-v2-form-group">
                                <span className="mg-v2-form-label" id="client-demographic-age-label">나이 (만)</span>
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
                                주민번호 앞 6자리·뒤 1자리를 입력해 저장하면 생년·성별·나이가 갱신됩니다.
                            </small>
                        ) : null}
                    </div>
                )}
                <div className="mg-v2-form-group">
                    <label htmlFor="name" className="mg-v2-form-label">이름 {type === 'create' && '*'}</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={safeFormData.name}
                        onChange={handleInputChange}
                        required={type === 'create'}
                        placeholder="내담자 이름"
                        className="mg-v2-form-input"
                        readOnly={type === 'view'}
                    />
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="phone" className="mg-v2-form-label">전화번호</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={safeFormData.phone}
                        onChange={handleInputChange}
                        placeholder="010-1234-5678"
                        className="mg-v2-form-input"
                        readOnly={type === 'view'}
                    />
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="client-vehiclePlate" className="mg-v2-form-label">차량번호 (선택)</label>
                    <input
                        type="text"
                        id="client-vehiclePlate"
                        name="vehiclePlate"
                        value={safeFormData.vehiclePlate}
                        onChange={handleInputChange}
                        placeholder="예: 12가 3456"
                        maxLength={32}
                        className={`mg-v2-form-input${vehiclePlateError ? ' mg-v2-form-input--error' : ''}`}
                        readOnly={type === 'view'}
                        autoComplete="off"
                        aria-invalid={vehiclePlateError ? true : undefined}
                        aria-describedby={vehiclePlateError ? 'client-vehiclePlate-error' : undefined}
                    />
                    <small className="mg-v2-form-help">숫자, 한글, 영문, 하이픈, 공백만 가능 (최대 32자)</small>
                    {vehiclePlateError ? (
                        <small id="client-vehiclePlate-error" className="mg-v2-form-help mg-v2-form-help--error" role="alert">
                            ⚠️ <SafeText>{vehiclePlateError}</SafeText>
                        </small>
                    ) : null}
                </div>
                <div className="mg-v2-form-group">
                    <label className="mg-v2-form-label">주소 검색</label>
                    <div className="mg-v2-address-search-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            className="mg-v2-button mg-v2-button-secondary"
                            disabled={type === 'view'}
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.daum && window.daum.Postcode) {
                                    new window.daum.Postcode({
                                        oncomplete: function (data) {
                                            setFormData(prev => ({
                                                ...prev,
                                                postalCode: data.zonecode || '',
                                                address: data.address || ''
                                            }));
                                        }
                                    }).open();
                                } else {
                                    window.dispatchEvent(new CustomEvent('showNotification', {
                                        detail: { message: '주소 검색 서비스를 불러올 수 없습니다.', type: 'info' }
                                    }));
                                }
                            }}
                        >
                            주소 검색
                        </button>
                        <input
                            type="text"
                            readOnly
                            className="mg-v2-form-input"
                            style={{ flex: 1, minWidth: '200px' }}
                            value={safeFormData.address}
                            placeholder="주소 검색 버튼을 눌러 주소를 입력하세요."
                        />
                    </div>
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="client-addressDetail" className="mg-v2-form-label">상세 주소</label>
                    <input
                        type="text"
                        id="client-addressDetail"
                        name="addressDetail"
                        value={safeFormData.addressDetail}
                        onChange={handleInputChange}
                        placeholder="동, 호수, 상세 주소를 입력하세요."
                        className="mg-v2-form-input"
                        readOnly={type === 'view'}
                    />
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="client-postalCode" className="mg-v2-form-label">우편번호</label>
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
                    <label htmlFor="email" className="mg-v2-form-label">{VALIDATION_MESSAGES.LABEL_EMAIL_REQUIRED}</label>
                    <div className="mg-v2-form-email-row">
                        <div className="mg-v2-form-email-row__input-wrap">
                            <MgEmailFieldWithAutocomplete
                                id="email"
                                name="email"
                                value={safeFormData.email}
                                onChange={handleInputChange}
                                placeholder="example@email.com"
                                required
                                disabled={type === 'edit'}
                                autocompleteMode="datalist"
                            />
                        </div>
                        {type === 'create' && (
                            <button
                                type="button"
                                onClick={handleEmailDuplicateCheck}
                                disabled={isCheckingEmail || !safeFormData.email?.trim()}
                                className="mg-v2-button mg-v2-button-secondary mg-v2-button--compact"
                                data-action="email-duplicate-check"
                            >
                                {isCheckingEmail ? VALIDATION_MESSAGES.BUTTON_CHECKING : VALIDATION_MESSAGES.BUTTON_DUPLICATE_CHECK}
                            </button>
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
                        <label htmlFor="password" className="mg-v2-form-label">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={safeFormData.password}
                            onChange={handleInputChange}
                            placeholder="비밀번호를 입력하지 않으면 자동 생성됩니다"
                            className="mg-v2-form-input"
                        />
                        <small className="mg-v2-form-help">비밀번호를 입력하지 않으면 임시 비밀번호가 자동으로 생성됩니다.</small>
                    </div>
                )}
                <div className="mg-v2-form-group">
                    <label htmlFor="status" className="mg-v2-form-label">상태</label>
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
                                { value: 'ACTIVE', label: '활성' },
                                { value: 'INACTIVE', label: '비활성' },
                                { value: 'PENDING', label: '대기' }
                              ]}
                        placeholder="선택하세요"
                        className="mg-v2-form-badge-select"
                    />
                </div>
                <div className="mg-v2-form-group">
                    <label htmlFor="grade" className="mg-v2-form-label">등급</label>
                    <BadgeSelect
                        value={safeFormData.grade}
                        onChange={(val) => setFormData(prev => ({ ...prev, grade: val }))}
                        disabled={type === 'view'}
                        options={[
                            { value: 'BRONZE', label: '브론즈' },
                            { value: 'SILVER', label: '실버' },
                            { value: 'GOLD', label: '골드' },
                            { value: 'PLATINUM', label: '플래티넘' },
                            { value: 'DIAMOND', label: '다이아몬드' }
                        ]}
                        placeholder="선택하세요"
                        className="mg-v2-form-badge-select"
                    />
                </div>
                <ContentSection title="상담 정보" noCard className="mg-v2-client-modal__subsection">
                    <div className="mg-v2-form-group">
                        <label htmlFor="client-consultationPurpose" className="mg-v2-form-label">상담 목적</label>
                        <textarea
                            id="client-consultationPurpose"
                            name="consultationPurpose"
                            value={safeFormData.consultationPurpose}
                            onChange={handleInputChange}
                            rows={3}
                            className="mg-v2-form-textarea"
                            readOnly={type === 'view'}
                            placeholder="상담을 받는 목적을 입력하세요"
                        />
                    </div>
                    <div className="mg-v2-form-group">
                        <label htmlFor="client-consultationHistory" className="mg-v2-form-label">상담 이력</label>
                        <textarea
                            id="client-consultationHistory"
                            name="consultationHistory"
                            value={safeFormData.consultationHistory}
                            onChange={handleInputChange}
                            rows={3}
                            className="mg-v2-form-textarea"
                            readOnly={type === 'view'}
                            placeholder="이전 상담 이력을 입력하세요"
                        />
                    </div>
                </ContentSection>
                <ContentSection title="비상 연락처" noCard className="mg-v2-client-modal__subsection">
                    <div className="mg-v2-form-row mg-v2-form-row--two" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div className="mg-v2-form-group">
                            <label htmlFor="client-emergencyContact" className="mg-v2-form-label">비상 연락처 이름</label>
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
                            <label htmlFor="client-emergencyPhone" className="mg-v2-form-label">비상 연락처 전화</label>
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
                    <label htmlFor="notes" className="mg-v2-form-label">메모</label>
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
                        onClick={onClose}
                        preventDoubleClick={true}
                    >
                        취소
                    </MGButton>
                    <MGButton
                        variant={type === 'delete' ? 'danger' : 'primary'}
                        type="button"
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
                        {type === 'delete' ? (
                            <AlertTriangle size={18} />
                        ) : (
                            <CheckCircle size={18} />
                        )}
                        {getSubmitText()}
                    </MGButton>
                </>
            }
        >
            <div className="mg-v2-modal-body">
                {renderSummaryStrip()}
                {type === 'delete' ? renderDeleteContent() : renderFormContent()}
            </div>
        </UnifiedModal>
    );
};

export default ClientModal;
