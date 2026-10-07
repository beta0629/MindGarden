import React, { useState, useEffect, useCallback, useMemo } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import { useSession } from '../../hooks/useSession';
import StandardizedApi from '../../utils/standardizedApi';
import { AlertTriangle, Clock, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import EmptyState from '../common/EmptyState';
import ConsultantSuitePage from './suite/ConsultantSuitePage';
import ConsultantSuiteButton from './suite/ConsultantSuiteButton';
import ConsultantSuiteCard, {
  CONSULTANT_SUITE_CARD_VARIANT,
  ConsultantSuitePill
} from './suite/ConsultantSuiteCard';
import {
  CONSULTANT_SUITE_BUTTON_VARIANT,
  CONSULTANT_SUITE_CLASS,
  CONSULTANT_SUITE_NS,
  CONSULTANT_SUITE_TEST_ID
} from '../../constants/consultantSuite';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import MGButton from '../common/MGButton';
import UnifiedModal from '../common/modals/UnifiedModal';
import EntityRowActions from '../common/molecules/EntityRowActions';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { redirectToLoginPageOnce } from '../../utils/sessionRedirect';
import { formatLocalDateYmd } from '../../utils/erpFinanceDisplay';
import useConfirm from '../../hooks/useConfirm';
import {
  AVAILABILITY_MIN_LEAD_DAYS,
  getAvailabilityMinSelectableDate
} from '../../constants/consultantAvailabilityConstants';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ConsultantAvailability.css';
import { RoleUtils } from '../../constants/roles';
import { useTranslation } from 'react-i18next';

/**
 * HH:mm[:ss] → HH:mm
 * @param {string} [value]
 * @returns {string}
 */
const stripSeconds = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  const parts = value.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return value;
};

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
const API_COMMON_CODES_GROUPS_DURATION = '/api/v1/common-codes/groups/DURATION';


const CONSULTANT_AVAILABILITY_TITLE_ID = 'consultant-availability-page-title';
const CONSULTANT_AVAILABILITY_FORM_ID = 'consultant-availability-slot-form';
const ACTION_ICON_SIZE = 16;
const EMPTY_ICON_SIZE = 40;

/** JS Date#getDay() (0=일) → DayOfWeek enum 키 */
const JS_DAY_TO_DAY_OF_WEEK = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
];

/** DayOfWeek enum 키 → JS Date#getDay() */
const DAY_OF_WEEK_TO_JS_DAY = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

/**
 * Asia/Seoul 캘린더 기준 가능 시간 선택 최소일(YYYY-MM-DD). today + AVAILABILITY_MIN_LEAD_DAYS.
 *
 * @returns {string}
 */
const getMinSelectableDateYmd = () => formatLocalDateYmd(getAvailabilityMinSelectableDate());

/**
 * YYYY-MM-DD → DayOfWeek 키.
 *
 * @param {string} ymd
 * @returns {string}
 */
const dayOfWeekFromYmd = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return JS_DAY_TO_DAY_OF_WEEK[date.getDay()];
};

/**
 * dayOfWeek의 다음 허용 발생일(min 이상). 편집 시 초기 날짜 산출용.
 *
 * @param {string} dayOfWeekKey
 * @returns {string} YYYY-MM-DD
 */
const nextAllowedYmdForDayOfWeek = (dayOfWeekKey) => {
  const targetJsDay = DAY_OF_WEEK_TO_JS_DAY[dayOfWeekKey];
  if (targetJsDay === undefined) {
    return getMinSelectableDateYmd();
  }
  const cursor = getAvailabilityMinSelectableDate();
  while (cursor.getDay() !== targetJsDay) {
    cursor.setDate(cursor.getDate() + 1);
  }
  return formatLocalDateYmd(cursor);
};

const ConsultantAvailability = () => {
  const { t } = useTranslation();
  const { t: tSuite } = useTranslation(CONSULTANT_SUITE_NS);
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [confirm, ConfirmModal] = useConfirm();
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => getMinSelectableDateYmd());
  const [durationOptions, setDurationOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // 시간 코드 로드
  const loadDurationCodes = useCallback(async() => {
    try {
      setLoadingCodes(true);
      const response = await StandardizedApi.get(API_COMMON_CODES_GROUPS_DURATION);
      const data = response?.data || response;
      if (data && data.length > 0) {
        setDurationOptions(data.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.codeDescription
        })));
      } else {
        // API 응답이 없을 때 기본값 설정
        setDurationOptions([
          { value: '30_MIN', label: t('common:consultant.ConsultantAvailability.t_ae2424d4'), icon: '⏰', color: 'var(--mg-primary-500)', description: t('common:consultant.ConsultantAvailability.t_87d0c960') },
          { value: '60_MIN', label: t('common:consultant.ConsultantAvailability.t_c1818994'), icon: '⏰', color: 'var(--mg-success-500)', description: t('common:consultant.ConsultantAvailability.t_bde284d8') },
          { value: '90_MIN', label: t('common:consultant.ConsultantAvailability.t_2f5c88ab'), icon: '⏰', color: 'var(--mg-warning-500)', description: t('common:consultant.ConsultantAvailability.t_905f4356') },
          { value: '120_MIN', label: t('common:consultant.ConsultantAvailability.t_ddbc1163'), icon: '⏰', color: 'var(--mg-error-500)', description: t('common:consultant.ConsultantAvailability.t_26e4dbdc') }
        ]);
      }
    } catch (error) {
      console.error('시간 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setDurationOptions([
        { value: '30_MIN', label: t('common:consultant.ConsultantAvailability.t_ae2424d4'), icon: '⏰', color: 'var(--mg-primary-500)', description: t('common:consultant.ConsultantAvailability.t_87d0c960') },
        { value: '60_MIN', label: t('common:consultant.ConsultantAvailability.t_c1818994'), icon: '⏰', color: 'var(--mg-success-500)', description: t('common:consultant.ConsultantAvailability.t_bde284d8') },
        { value: '90_MIN', label: t('common:consultant.ConsultantAvailability.t_2f5c88ab'), icon: '⏰', color: 'var(--mg-warning-500)', description: t('common:consultant.ConsultantAvailability.t_905f4356') },
        { value: '120_MIN', label: t('common:consultant.ConsultantAvailability.t_ddbc1163'), icon: '⏰', color: 'var(--mg-error-500)', description: t('common:consultant.ConsultantAvailability.t_26e4dbdc') }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  }, []);

  // 디버깅을 위한 로그
  console.log('🔍 ConsultantAvailability 상태:', {
    user,
    isLoggedIn,
    sessionLoading,
    userRole: user?.role,
    userId: user?.id,
    userName: user?.name,
    userEmail: user?.email
  });
  
  // 세션 상태 상세 분석
  console.log('🔍 세션 상태 분석:', {
    'user 존재': !!user,
    'user.id': user?.id,
    'user.role': user?.role,
    'isLoggedIn 값': isLoggedIn,
    'sessionLoading 값': sessionLoading
  });

  // 요일 상수
  const DAYS_OF_WEEK = [
    { key: 'MONDAY', label: t('common:consultant.ConsultantAvailability.t_d77265f0'), short: t('common:consultant.ConsultantAvailability.t_75448692') },
    { key: 'TUESDAY', label: t('common:consultant.ConsultantAvailability.t_85674ecb'), short: t('common:consultant.ConsultantAvailability.t_adb4a282') },
    { key: 'WEDNESDAY', label: t('common:consultant.ConsultantAvailability.t_66dadc9b'), short: t('common:consultant.ConsultantAvailability.t_c04eb2ef') },
    { key: 'THURSDAY', label: t('common:consultant.ConsultantAvailability.t_73259471'), short: t('common:consultant.ConsultantAvailability.t_5664a634') },
    { key: 'FRIDAY', label: t('common:consultant.ConsultantAvailability.t_5054e8b8'), short: t('common:consultant.ConsultantAvailability.t_cf5632c7') },
    { key: 'SATURDAY', label: t('common:consultant.ConsultantAvailability.t_618ad44e'), short: t('common:consultant.ConsultantAvailability.t_b9e40662') },
    { key: 'SUNDAY', label: t('common:consultant.ConsultantAvailability.t_4a7e4be4'), short: t('common:consultant.ConsultantAvailability.t_06cf3e90') }
  ];

  // 시간 슬롯 생성 (30분 단위) - 10:00부터 20:00 시작까지(20:00 행 포함)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 10; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 20 && minute > 0) {
          break;
        }
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          value: timeString,
          label: timeString
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // 데이터 로드
  useEffect(() => {
    if (isLoggedIn && user?.id) {
      loadAvailability();
      loadDurationCodes();
    }
  }, [isLoggedIn, user?.id, loadDurationCodes]);

  const loadAvailability = async() => {
    try {
      setLoading(true);
      setError(null);

      console.log('👤 상담사 상담 가능 시간 로드:', user.id);

      const response = await StandardizedApi.get(`/api/v1/consultants/${user.id}/availability`);
      
      if (Array.isArray(response) || response?.success || response?.id || response?.success === undefined) {
        console.log('✅ 상담 가능 시간 로드 성공:', response);
        setAvailability(Array.isArray(response) ? response : (response?.data || []));
      } else {
        console.error('❌ 상담 가능 시간 로드 실패:', response?.message);
        setError(response?.message || t('common:consultant.ConsultantAvailability.t_0381b27b'));
      }
    } catch (err) {
      console.error('❌ 상담 가능 시간 로드 중 오류:', err);
      setError(err?.message || t('common:consultant.ConsultantAvailability.t_5035bbea'));
    } finally {
      setLoading(false);
    }
  };

  // 상담 가능 시간 추가
  const handleAddAvailability = async(formData) => {
    try {
      console.log('➕ 상담 가능 시간 추가:', formData);

      const response = await StandardizedApi.post(`/api/v1/consultants/${user.id}/availability`, formData);
      
      if (Array.isArray(response) || response?.success || response?.id || response?.success === undefined) {
        console.log('✅ 상담 가능 시간 추가 성공');
        await loadAvailability();
        setShowAddModal(false);
      } else {
        console.error('❌ 상담 가능 시간 추가 실패:', response?.message);
        setError(response?.message || t('common:consultant.ConsultantAvailability.t_8abc6dc2'));
      }
    } catch (err) {
      console.error('❌ 상담 가능 시간 추가 중 오류:', err);
      setError(err?.message || t('common:consultant.ConsultantAvailability.t_3f25f524'));
    }
  };

  // 상담 가능 시간 수정
  const handleEditAvailability = async(id, formData) => {
    try {
      console.log('✏️ 상담 가능 시간 수정:', id, formData);

      const response = await StandardizedApi.put(`/api/v1/consultants/availability/${id}`, formData);
      
      if (Array.isArray(response) || response?.success || response?.id || response?.success === undefined) {
        console.log('✅ 상담 가능 시간 수정 성공');
        await loadAvailability();
        setEditingSlot(null);
      } else {
        console.error('❌ 상담 가능 시간 수정 실패:', response?.message);
        setError(response?.message || t('common:consultant.ConsultantAvailability.t_9cc31774'));
      }
    } catch (err) {
      console.error('❌ 상담 가능 시간 수정 중 오류:', err);
      setError(err?.message || t('common:consultant.ConsultantAvailability.t_aa721e53'));
    }
  };

  // 상담 가능 시간 삭제
  const handleDeleteAvailability = async(id) => {
    try {
      const response = await StandardizedApi.delete(`/api/v1/consultants/availability/${id}`);
      if (Array.isArray(response) || response?.success || response?.id || response?.success === undefined) {
        await loadAvailability();
      } else {
        setError(response?.message || t('common:consultant.ConsultantAvailability.t_dcdc1896'));
      }
    } catch (err) {
      setError(err?.message || t('common:consultant.ConsultantAvailability.t_422803c0'));
    }
  };

  const requestDeleteAvailability = async(slot) => {
    const ok = await confirm({
      title: tSuite('availability.deleteConfirmTitle'),
      message: tSuite('availability.deleteConfirmBody'),
      confirmLabel: tSuite('actions.delete'),
      cancelLabel: t('common.actions.cancel'),
      variant: 'danger'
    });
    if (ok) {
      await handleDeleteAvailability(slot.id);
    }
  };

  /** 슬롯이 있는 요일만 · 요일 순서 유지 */
  const slotsWithDays = useMemo(() => {
    const dayOrder = DAYS_OF_WEEK.map((d) => d.key);
    return [...availability]
      .filter((slot) => slot && slot.dayOfWeek)
      .sort((a, b) => {
        const ai = dayOrder.indexOf(a.dayOfWeek);
        const bi = dayOrder.indexOf(b.dayOfWeek);
        if (ai !== bi) {
          return ai - bi;
        }
        return String(a.startTime || '').localeCompare(String(b.startTime || ''));
      });
  }, [availability, DAYS_OF_WEEK]);

  const pageShell = (body, options = {}) => {
    const { title = t('common:consultant.ConsultantAvailability.t_09b4a1ce'), subtitle = t('common:consultant.ConsultantAvailability.t_eecb782f'), actions } = options;
    return (
      <ConsultantSuitePage
        title={title}
        subtitle={subtitle}
        titleId={CONSULTANT_AVAILABILITY_TITLE_ID}
        actions={actions}
        ariaLabel={title}
        testId={CONSULTANT_SUITE_TEST_ID.AVAILABILITY_PAGE}
      >
        {body}
      </ConsultantSuitePage>
    );
  };

  if (!sessionLoading) {
    console.log('🔍 최종 세션 체크:', {
      'useSession user': user,
      'useSession isLoggedIn': isLoggedIn
    });
  }

  const userRole = user?.role;
  // 4종 SSOT: CONSULTANT 또는 ADMIN(레거시 BRANCH_SUPER_ADMIN 포함)
  const hasPermission = RoleUtils.isConsultant(user) || RoleUtils.isAdmin(user);

  const headerActions = (
    <>
      <ConsultantSuiteButton
        variant={CONSULTANT_SUITE_BUTTON_VARIANT.PRIMARY}
        icon={<Plus size={ACTION_ICON_SIZE} aria-hidden />}
        onClick={() => {
          setSelectedDate(getMinSelectableDateYmd());
          setShowAddModal(true);
        }}
      >
        {tSuite('actions.addAvailability')}
      </ConsultantSuiteButton>
      <ConsultantSuiteButton
        icon={<RefreshCw size={ACTION_ICON_SIZE} aria-hidden />}
        onClick={loadAvailability}
      >
        {tSuite('actions.refresh')}
      </ConsultantSuiteButton>
    </>
  );

  const renderContent = () => {
    if (sessionLoading) {
      return (
        <div className="consultant-availability__session-load" aria-busy="true" aria-live="polite">
          <UnifiedLoading type="inline" text={tSuite('availability.loading')} />
        </div>
      );
    }
    if (!isLoggedIn || !user) {
      return pageShell(
        <section className={CONSULTANT_SUITE_CLASS.PANEL}>
          <EmptyState
            className={CONSULTANT_SUITE_CLASS.EMPTY}
            icon={<AlertTriangle size={EMPTY_ICON_SIZE} aria-hidden />}
            title={tSuite('availability.loginTitle')}
            description={tSuite('availability.loginDescription')}
            action={(
              <ConsultantSuiteButton onClick={() => { redirectToLoginPageOnce(); }}>
                {tSuite('actions.login')}
              </ConsultantSuiteButton>
            )}
          />
        </section>,
        { subtitle: t('common:consultant.ConsultantAvailability.t_4f3fe0b5') }
      );
    }
    if (!hasPermission) {
      return pageShell(
        <section className={CONSULTANT_SUITE_CLASS.PANEL}>
          <EmptyState
            className={CONSULTANT_SUITE_CLASS.EMPTY}
            icon={<ShieldAlert size={EMPTY_ICON_SIZE} aria-hidden />}
            title={tSuite('availability.permissionTitle')}
            description={`${tSuite('availability.permissionDescription')} ${tSuite('availability.roleLabel', {
              role: userRole || t('common:consultant.ConsultantAvailability.t_d58fa73a')
            })}`}
            action={(
              <ConsultantSuiteButton onClick={() => window.history.back()}>
                {tSuite('actions.back')}
              </ConsultantSuiteButton>
            )}
          />
        </section>,
        { subtitle: t('common:consultant.ConsultantAvailability.t_466a86db') }
      );
    }
    return (
      <>
        {pageShell(
          <>
            {loading && (
              <div className={CONSULTANT_SUITE_CLASS.LOADING} aria-busy="true" aria-live="polite">
                <UnifiedLoading type="inline" text={tSuite('availability.loading')} />
              </div>
            )}

            {error ? (
              <section className={CONSULTANT_SUITE_CLASS.PANEL} role="alert">
                <EmptyState
                  className={CONSULTANT_SUITE_CLASS.EMPTY}
                  icon={<AlertTriangle size={EMPTY_ICON_SIZE} aria-hidden />}
                  title={error}
                  action={(
                    <ConsultantSuiteButton onClick={loadAvailability}>
                      {tSuite('actions.retry')}
                    </ConsultantSuiteButton>
                  )}
                />
              </section>
            ) : null}

            {!loading && !error && (slotsWithDays.length === 0 ? (
              <section className={CONSULTANT_SUITE_CLASS.PANEL}>
                <EmptyState
                  className={CONSULTANT_SUITE_CLASS.EMPTY}
                  icon={<Clock size={EMPTY_ICON_SIZE} aria-hidden />}
                  title={tSuite('availability.emptyTitle')}
                  description={tSuite('availability.emptyDescription')}
                />
              </section>
            ) : (
              <ul className={CONSULTANT_SUITE_CLASS.CARD_LIST} aria-label={tSuite('availability.listAria')}>
                {slotsWithDays.map((slot) => {
                  const day = DAYS_OF_WEEK.find((d) => d.key === slot.dayOfWeek);
                  const dayLabel = day?.label || slot.dayOfWeek;
                  const start = stripSeconds(slot.startTime);
                  const end = stripSeconds(slot.endTime);
                  const isActive = slot.isActive !== false;
                  return (
                    <li key={slot.id}>
                      <ConsultantSuiteCard
                        variant={CONSULTANT_SUITE_CARD_VARIANT.ROW}
                        className="consultant-availability__slot-card"
                      >
                        <div className="consultant-availability__slot-main">
                          <SafeText tag="h3" className={CONSULTANT_SUITE_CLASS.CARD_TITLE}>
                            {tSuite('availability.slotTitle', { day: dayLabel })}
                          </SafeText>
                          <SafeText tag="p" className={CONSULTANT_SUITE_CLASS.CARD_META}>
                            {tSuite('availability.slotTimeRange', { start, end })}
                          </SafeText>
                        </div>
                        <div className="consultant-availability__slot-aside">
                          <ConsultantSuitePill>
                            {isActive
                              ? tSuite('availability.active')
                              : tSuite('availability.inactive')}
                          </ConsultantSuitePill>
                          <EntityRowActions
                            ariaLabel={tSuite('availability.actionsAria')}
                            items={[
                              {
                                id: 'edit',
                                label: tSuite('actions.edit'),
                                onClick: () => {
                                  setSelectedDate(nextAllowedYmdForDayOfWeek(slot.dayOfWeek));
                                  setEditingSlot(slot);
                                }
                              },
                              {
                                id: 'delete',
                                label: tSuite('actions.delete'),
                                variant: 'destructive',
                                onClick: () => requestDeleteAvailability(slot)
                              }
                            ]}
                          />
                        </div>
                      </ConsultantSuiteCard>
                    </li>
                  );
                })}
              </ul>
            ))}
          </>,
          { actions: headerActions }
        )}

        {(showAddModal || editingSlot) && (
          <AvailabilityModal
            isOpen={showAddModal || !!editingSlot}
            onClose={() => {
              setShowAddModal(false);
              setEditingSlot(null);
            }}
            onSubmit={editingSlot
              ? (data) => handleEditAvailability(editingSlot.id, data)
              : handleAddAvailability}
            initialData={editingSlot}
            timeSlots={timeSlots}
            daysOfWeek={DAYS_OF_WEEK}
            durationOptions={durationOptions}
            selectedDate={selectedDate}
            onSelectedDateChange={setSelectedDate}
            minSelectableDate={getMinSelectableDateYmd()}
          />
        )}
        {ConfirmModal}
      </>
    );
  };

  return (
    <AdminCommonLayout className="mg-v2-dashboard-layout">
      {renderContent()}
    </AdminCommonLayout>
  );
};

// 상담 가능 시간 모달 컴포넌트
const AvailabilityModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  timeSlots,
  daysOfWeek,
  durationOptions,
  selectedDate,
  onSelectedDateChange,
  minSelectableDate
}) => {
  const { t } = useTranslation();
  const { t: tSuite } = useTranslation(CONSULTANT_SUITE_NS);
  const [formData, setFormData] = useState({
    dayOfWeek: dayOfWeekFromYmd(selectedDate) || initialData?.dayOfWeek || 'MONDAY',
    startTime: initialData?.startTime || '09:00',
    endTime: initialData?.endTime || '20:00',
    duration: initialData?.duration || 60,
    isActive: initialData?.isActive !== false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!selectedDate) {
      return;
    }
    const nextDayOfWeek = dayOfWeekFromYmd(selectedDate);
    setFormData((prev) => (
      prev.dayOfWeek === nextDayOfWeek
        ? prev
        : { ...prev, dayOfWeek: nextDayOfWeek }
    ));
  }, [selectedDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectedDateChange = (e) => {
    const nextYmd = e.target.value;
    if (!nextYmd) {
      return;
    }
    if (nextYmd < minSelectableDate) {
      setErrors(prev => ({
        ...prev,
        selectedDate: t('common:consultant.ConsultantAvailability.t_lead_days_denied')
      }));
      return;
    }
    onSelectedDateChange(nextYmd);
    if (errors.selectedDate) {
      setErrors(prev => ({
        ...prev,
        selectedDate: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedDate || selectedDate < minSelectableDate) {
      newErrors.selectedDate = t('common:consultant.ConsultantAvailability.t_lead_days_denied');
    }

    if (!formData.dayOfWeek) {
      newErrors.dayOfWeek = t('common:consultant.ConsultantAvailability.t_lead_days_denied');
    }

    if (!formData.startTime) {
      newErrors.startTime = t('common:consultant.ConsultantAvailability.t_73dc954c');
    }

    if (!formData.endTime) {
      newErrors.endTime = t('common:consultant.ConsultantAvailability.t_eda41253');
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      if (start >= end) {
        newErrors.endTime = t('common:consultant.ConsultantAvailability.t_d4fc48de');
      }
    }

    if (!formData.duration || formData.duration < 30) {
      newErrors.duration = t('common:consultant.ConsultantAvailability.t_2e4219bc');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        dayOfWeek: dayOfWeekFromYmd(selectedDate)
      });
    }
  };

  const selectedDayLabel = daysOfWeek.find((day) => day.key === formData.dayOfWeek)?.label;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? '상담 가능 시간 수정' : t('common:consultant.ConsultantAvailability.t_49a945a6')}
      size="medium"
      variant="form"
      className="mg-v2-ad-b0kla"
      backdropClick
      showCloseButton
      actions={(
        <>
          <MGButton
            type="button"
            variant="outline"
            size="medium"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onClose}
            preventDoubleClick={false}
          >
            {t('common.actions.cancel')}
          </MGButton>
          <MGButton
            type="submit"
            form={CONSULTANT_AVAILABILITY_FORM_ID}
            variant="primary"
            size="medium"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            preventDoubleClick={false}
          >
            {initialData ? tSuite('actions.edit') : t('common:consultant.ConsultantAvailability.t_57942995')}
          </MGButton>
        </>
      )}
    >
      <form
        id={CONSULTANT_AVAILABILITY_FORM_ID}
        onSubmit={handleSubmit}
        className="mg-v2-form availability-modal__form"
      >
        <div className="mg-v2-form-group">
          <label className="mg-v2-label" htmlFor="availability-selected-date">
            {t('common:consultant.ConsultantAvailability.t_selected_date_label')} *
          </label>
          <input
            id="availability-selected-date"
            type="date"
            name="selectedDate"
            value={selectedDate}
            min={minSelectableDate}
            onChange={handleSelectedDateChange}
            className={`mg-v2-form-input${errors.selectedDate ? ' mg-v2-form-input--error' : ''}`}
            required
          />
          <p className="consultant-availability-lead-helper">
            {t('common:consultant.ConsultantAvailability.t_lead_days_helper', {
              days: AVAILABILITY_MIN_LEAD_DAYS
            })}
          </p>
          {errors.selectedDate ? (
            <p className="mg-v2-form-error" role="alert">{errors.selectedDate}</p>
          ) : null}
        </div>

        <div className="mg-v2-form-group">
          <label className="mg-v2-label" htmlFor="availability-day-display">요일 *</label>
          <input
            id="availability-day-display"
            type="text"
            name="dayOfWeekDisplay"
            value={toDisplayString(selectedDayLabel, formData.dayOfWeek)}
            className="mg-v2-form-input"
            readOnly
            aria-readonly="true"
          />
          <input type="hidden" name="dayOfWeek" value={formData.dayOfWeek} />
        </div>

        <div className="mg-v2-form-row">
          <div className="mg-v2-form-group">
            <label className="mg-v2-label" htmlFor="availability-start-time">시작 시간 *</label>
            <select
              id="availability-start-time"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className={`mg-v2-form-select${errors.startTime ? ' mg-v2-form-input--error' : ''}`}
              required
            >
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {toDisplayString(slot.label, '—')}
                </option>
              ))}
            </select>
            {errors.startTime ? (
              <p className="mg-v2-form-error" role="alert">{errors.startTime}</p>
            ) : null}
          </div>

          <div className="mg-v2-form-group">
            <label className="mg-v2-label" htmlFor="availability-end-time">종료 시간 *</label>
            <select
              id="availability-end-time"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className={`mg-v2-form-select${errors.endTime ? ' mg-v2-form-input--error' : ''}`}
              required
            >
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {toDisplayString(slot.label, '—')}
                </option>
              ))}
            </select>
            {errors.endTime ? (
              <p className="mg-v2-form-error" role="alert">{errors.endTime}</p>
            ) : null}
          </div>
        </div>

        <div className="mg-v2-form-group">
          <label className="mg-v2-label" htmlFor="availability-duration">상담 시간 (분) *</label>
          <select
            id="availability-duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            className={`mg-v2-form-select${errors.duration ? ' mg-v2-form-input--error' : ''}`}
            required
          >
            {durationOptions && durationOptions.length > 0 ? (
              durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {toDisplayString(option.label, '—')}
                </option>
              ))
            ) : (
              <option disabled>시간 옵션을 불러오는 중...</option>
            )}
          </select>
          {errors.duration ? (
            <p className="mg-v2-form-error" role="alert">{errors.duration}</p>
          ) : null}
        </div>

        <div className="mg-v2-form-group">
          <label className="mg-v2-form-checkbox" htmlFor="isActive">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({
                ...prev,
                isActive: e.target.checked
              }))}
              className="mg-v2-form-checkbox__input"
              id="isActive"
            />
            <span className="mg-v2-form-checkbox__label">활성화</span>
          </label>
        </div>
      </form>
    </UnifiedModal>
  );
};

export default ConsultantAvailability;
