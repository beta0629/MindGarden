/**
 * 시스템 설정 관리 페이지 — 웰니스 시스템 설정 전담.
 *
 * 트랙 B PR-4 (2026-05-24): AI provider 라디오 + 4종 키 입력 폼은 분리된
 * `AiProviderManagementPage` (`/admin/system/ai-providers`) 로 이전됨.
 * 본 페이지는 **웰니스 자동 발송·발송 시간·대상 역할** 만 잔류 (사용자 컨펌 Q3=(a)).
 *
 * @author Core Solution
 * @author MindGarden
 * @since 2025-01-21
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Database, Cpu, ExternalLink, BellRing } from 'lucide-react';
import { apiGet, apiPost } from '../../utils/ajax';
import StandardizedApi from '../../utils/standardizedApi';
import { getCommonCodes } from '../../utils/commonCodeApi';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import { USER_ROLES } from '../../constants/roles';
import UnifiedLoading from '../common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal';
import MGButton from '../common/MGButton';
import ChipMultiSelect from '../common/ChipMultiSelect';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './SystemConfigManagement.css';

const API_ADMIN_SYSTEM_CONFIG_WELLNESS_AUTO_SEND_ENABLED = '/api/v1/admin/system-config/WELLNESS_AUTO_SEND_ENABLED';
const API_ADMIN_SYSTEM_CONFIG_WELLNESS_SEND_TIME = '/api/v1/admin/system-config/WELLNESS_SEND_TIME';
const API_ADMIN_SYSTEM_CONFIG_WELLNESS_TARGET_ROLES = '/api/v1/admin/system-config/WELLNESS_TARGET_ROLES';

/**
 * PR-2 (2026-05-25): 알림 자동 발송 스케줄러 4 종 어드민 토글 API 베이스 경로.
 * 단일 키 PUT 은 본 베이스 + `/{key}` 형태로 호출한다.
 */
const API_ADMIN_NOTIFICATION_SCHEDULER_FLAGS = '/api/v1/admin/notification-scheduler/flags';

/**
 * PR-2 키 SSOT — 백엔드 {@code NotificationSchedulerFlagKeys} 와 1:1 매핑.
 * UI 표시 라벨(i18n)·아이콘 렌더 순서를 정의한다 (alphabetical 정렬은 백엔드가 보장).
 */
const NOTIFICATION_SCHEDULER_FLAG_KEYS = Object.freeze({
  WELLNESS_TIP: 'notification.scheduler.wellness-tip.enabled',
  CONSULTATION_RECORD_ALERT: 'notification.scheduler.consultation-record-alert.enabled',
  WORKFLOW_AUTOMATION: 'notification.scheduler.workflow-automation.enabled',
  RESERVATION_REMINDER: 'notification.scheduler.reservation-reminder.enabled'
});

/**
 * PR-2 표시 순서 (UI). 운영자가 가장 자주 토글하는 채널 우선.
 */
const NOTIFICATION_SCHEDULER_FLAG_ORDER = Object.freeze([
  NOTIFICATION_SCHEDULER_FLAG_KEYS.WELLNESS_TIP,
  NOTIFICATION_SCHEDULER_FLAG_KEYS.CONSULTATION_RECORD_ALERT,
  NOTIFICATION_SCHEDULER_FLAG_KEYS.WORKFLOW_AUTOMATION,
  NOTIFICATION_SCHEDULER_FLAG_KEYS.RESERVATION_REMINDER
]);

/**
 * PR-2 (2026-05-25): 표시 시각 포맷 — 시·분만 노출하여 토글 UI 의 가독성을 높인다.
 * Date 파싱 실패 시 원문을 그대로 반환한다.
 *
 * @param {string|null|undefined} updatedAt ISO-8601 문자열 또는 null
 * @returns {string} 'YYYY-MM-DD HH:mm' 또는 원문
 */
const formatLastUpdatedAt = (updatedAt) => {
  if (!updatedAt) {
    return '';
  }
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return String(updatedAt);
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
};

/** 웰니스 대상 역할 풀 소스 — 공통코드 그룹 'ROLE' (tenant 우선, core 폴백) */
const ROLE_COMMON_CODE_GROUP = 'ROLE';

const DEFAULT_WELLNESS = Object.freeze({
  wellnessAutoSendEnabled: true,
  wellnessSendTime: '09:00',
  wellnessTargetRoles: 'CLIENT,ROLE_CLIENT'
});

/**
 * DB 저장 형식(콤마 구분 문자열) → 칩 배열 변환.
 *
 * 빈 문자열·null 은 빈 배열, 양 옆 공백 제거.
 *
 * @param {string|null|undefined} csv 콤마 구분 문자열
 * @returns {string[]} 칩 배열
 */
const parseTargetRolesCsv = (csv) => {
  if (typeof csv !== 'string' || csv.trim().length === 0) {
    return [];
  }
  return csv
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
};

/**
 * 칩 배열 → DB 저장 형식(콤마 구분 문자열) 변환.
 *
 * @param {string[]} roles 선택된 역할 배열
 * @returns {string} 콤마 구분 문자열
 */
const stringifyTargetRoles = (roles) => {
  if (!Array.isArray(roles)) {
    return '';
  }
  return roles.map((role) => String(role).trim()).filter((role) => role.length > 0).join(',');
};

const SystemConfigManagement = () => {
  const { user, isLoggedIn, hasCheckedSession } = useSession();
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wellness, setWellness] = useState(DEFAULT_WELLNESS);
  const [roleCodes, setRoleCodes] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // PR-2 (2026-05-25): 알림 자동 발송 스케줄러 4 종 토글 상태.
  // schedulerFlags 는 key 별 메타(value/updatedBy/updatedAt) 를 담은 dict.
  const [schedulerFlags, setSchedulerFlags] = useState({});
  const [schedulerLoading, setSchedulerLoading] = useState(true);
  const [schedulerSavingKey, setSchedulerSavingKey] = useState(null);
  // 토글 확인 모달 상태 — null 이면 닫힘. { key, label, nextValue } 객체로 보관.
  const [schedulerConfirm, setSchedulerConfirm] = useState(null);

  const legacyLabelSuffix = t('systemConfig.wellness.targetRoles.legacy', '(레거시)');

  const targetRoleValues = useMemo(
    () => parseTargetRolesCsv(wellness.wellnessTargetRoles),
    [wellness.wellnessTargetRoles]
  );

  /**
   * DB 역할 풀 + 현재 저장값에 포함되었지만 풀에 없는 값(레거시)도 칩으로 보이도록 옵션 합성.
   *
   * - 활성 역할(공통코드 ROLE 그룹): `koreanName` 또는 `codeLabel` + `(codeValue)` 라벨.
   * - extraData.isDeprecated === true 또는 saved 값이지만 풀에 없는 경우: `(레거시)` 라벨 부착.
   */
  const targetRoleOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    (Array.isArray(roleCodes) ? roleCodes : []).forEach((code) => {
      if (!code || !code.codeValue) {
        return;
      }
      const value = String(code.codeValue);
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
      const rawName = code.koreanName || code.codeLabel || '';
      const hasName = typeof rawName === 'string' && rawName.trim().length > 0 && rawName !== value;
      const baseLabel = hasName
        ? t(
            'systemConfig.wellness.targetRoles.optionLabel',
            '{{name}} ({{code}})',
            { name: rawName, code: value }
          )
        : value;
      let isDeprecated = false;
      try {
        const extra = typeof code.extraData === 'string' ? JSON.parse(code.extraData) : code.extraData;
        if (extra && (extra.isDeprecated === true || extra.deprecated === true)) {
          isDeprecated = true;
        }
      } catch (_e) {
        // extraData JSON 파싱 실패는 무시 (필수 메타 아님)
      }
      const label = isDeprecated ? `${baseLabel} ${legacyLabelSuffix}`.trim() : baseLabel;
      options.push({
        value,
        label,
        chipLabel: isDeprecated ? `${value} ${legacyLabelSuffix}`.trim() : value,
        deprecated: isDeprecated
      });
    });

    // saved 값이지만 DB 풀에 없는 값(예: 운영 잔존 'ROLE_CLIENT')은 레거시 옵션으로 추가
    targetRoleValues.forEach((value) => {
      if (!seen.has(value)) {
        seen.add(value);
        const legacyLabel = `${value} ${legacyLabelSuffix}`.trim();
        options.push({
          value,
          label: legacyLabel,
          chipLabel: legacyLabel,
          deprecated: true
        });
      }
    });
    return options;
  }, [roleCodes, targetRoleValues, t, legacyLabelSuffix]);

  const handleTargetRolesChange = useCallback((next) => {
    setWellness((prev) => ({ ...prev, wellnessTargetRoles: stringifyTargetRoles(next) }));
  }, []);

  const formatRemoveLabel = useCallback(
    (label) => t('systemConfig.wellness.targetRoles.remove', '{{role}} 제거', { role: label }),
    [t]
  );

  const loadRoleOptions = useCallback(async() => {
    try {
      setRolesLoading(true);
      const codes = await getCommonCodes(ROLE_COMMON_CODE_GROUP);
      setRoleCodes(Array.isArray(codes) ? codes : []);
    } catch (error) {
      console.error('역할 공통코드 로드 실패:', error);
      setRoleCodes([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  /**
   * PR-2 (2026-05-25): 알림 자동 발송 스케줄러 4 종 플래그 일괄 조회.
   *
   * 응답 스펙: {@code { success, flags: [{ key, value, description, updatedBy, updatedAt }, ...] }}
   * 실패 시 schedulerFlags 는 빈 객체로 초기화한다 (UI 는 fallback OFF 표시).
   *
   * 의존성 메모: 기존 {@code loadConfigs}/{@code loadRoleOptions} 와 동일하게 빈 deps 로
   * 안정 참조를 유지한다 (useEffect 재실행 루프 방지). 토스트 메시지는 한국어 리터럴로 직접
   * 전달하며 i18n 키는 UI 렌더링 시점(t 호출) 에서만 사용한다.
   */
  const loadSchedulerFlags = useCallback(async() => {
    try {
      setSchedulerLoading(true);
      const response = await StandardizedApi.get(API_ADMIN_NOTIFICATION_SCHEDULER_FLAGS);
      const flagsArray = Array.isArray(response?.flags) ? response.flags : [];
      const map = {};
      flagsArray.forEach((flag) => {
        if (flag && typeof flag.key === 'string') {
          map[flag.key] = {
            key: flag.key,
            value: !!flag.value,
            updatedBy: flag.updatedBy || '',
            updatedAt: flag.updatedAt || ''
          };
        }
      });
      setSchedulerFlags(map);
    } catch (error) {
      console.error('알림 스케줄러 플래그 로드 실패:', error);
      notificationManager.show('스케줄러 플래그를 불러오지 못했습니다.', 'error');
      setSchedulerFlags({});
    } finally {
      setSchedulerLoading(false);
    }
  }, []);

  /**
   * PR-2 (2026-05-25): 토글 클릭 — 확인 모달 오픈만 수행. 실제 PUT 은 confirm 핸들러에서.
   *
   * @param {string} key 플래그 키 (NOTIFICATION_SCHEDULER_FLAG_KEYS)
   * @param {string} label 사용자 표시용 라벨 (i18n 적용된 채널명)
   * @param {boolean} currentValue 현재 값
   */
  const handleSchedulerToggleRequest = useCallback((key, label, currentValue) => {
    setSchedulerConfirm({ key, label, nextValue: !currentValue });
  }, []);

  const handleSchedulerConfirmCancel = useCallback(() => {
    setSchedulerConfirm(null);
  }, []);

  /**
   * PR-2 (2026-05-25): 확인 모달 → API 호출.
   *
   * 성공: 응답의 flag 메타로 schedulerFlags 즉시 갱신 + 성공 토스트 + 4 키 재조회로 완전 동기화.
   * 실패: 에러 토스트 + 모달 유지 (사용자가 다시 시도하거나 취소 결정).
   */
  const handleSchedulerConfirmProceed = useCallback(async() => {
    if (!schedulerConfirm) {
      return;
    }
    const { key, nextValue } = schedulerConfirm;
    try {
      setSchedulerSavingKey(key);
      const response = await StandardizedApi.put(
        `${API_ADMIN_NOTIFICATION_SCHEDULER_FLAGS}/${encodeURIComponent(key)}`,
        { value: nextValue }
      );
      const flag = response?.flag;
      if (flag && typeof flag.key === 'string') {
        setSchedulerFlags((prev) => ({
          ...prev,
          [flag.key]: {
            key: flag.key,
            value: !!flag.value,
            updatedBy: flag.updatedBy || '',
            updatedAt: flag.updatedAt || ''
          }
        }));
      }
      notificationManager.show('스케줄러 플래그가 저장되었습니다.', 'success');
      setSchedulerConfirm(null);
      await loadSchedulerFlags();
    } catch (error) {
      console.error('알림 스케줄러 플래그 저장 실패:', error);
      const backendMsg = error?.response?.data?.message || error?.data?.message;
      notificationManager.show(
        backendMsg || '스케줄러 플래그 저장에 실패했습니다.',
        'error'
      );
    } finally {
      setSchedulerSavingKey(null);
    }
  }, [schedulerConfirm, loadSchedulerFlags]);

  const loadConfigs = useCallback(async() => {
    try {
      setLoading(true);
      const [wEnabled, wTime, wRoles] = await Promise.all([
        apiGet(API_ADMIN_SYSTEM_CONFIG_WELLNESS_AUTO_SEND_ENABLED).catch(() => null),
        apiGet(API_ADMIN_SYSTEM_CONFIG_WELLNESS_SEND_TIME).catch(() => null),
        apiGet(API_ADMIN_SYSTEM_CONFIG_WELLNESS_TARGET_ROLES).catch(() => null)
      ]);
      setWellness({
        wellnessAutoSendEnabled: wEnabled?.success ? wEnabled.configValue === 'true' : DEFAULT_WELLNESS.wellnessAutoSendEnabled,
        wellnessSendTime: wTime?.success ? wTime.configValue : DEFAULT_WELLNESS.wellnessSendTime,
        wellnessTargetRoles: wRoles?.success ? wRoles.configValue : DEFAULT_WELLNESS.wellnessTargetRoles
      });
    } catch (error) {
      console.error('설정 로드 실패:', error);
      notificationManager.show('설정을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 세션 복원 완료 전에는 가드 발동을 보류 (새로고침 race 방지)
    if (!hasCheckedSession) {
      return;
    }
    if (!isLoggedIn || !user) {
      notificationManager.show('로그인이 필요합니다.', 'error');
      setLoading(false);
      return;
    }
    const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.STAFF];
    if (!allowedRoles.includes(user.role)) {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      setLoading(false);
      return;
    }
    loadConfigs();
    loadRoleOptions();
    loadSchedulerFlags();
  }, [hasCheckedSession, isLoggedIn, user, loadConfigs, loadRoleOptions, loadSchedulerFlags]);

  const handleSave = async() => {
    try {
      setSaving(true);
      await Promise.all([
        apiPost(API_ADMIN_SYSTEM_CONFIG_WELLNESS_AUTO_SEND_ENABLED, {
          configValue: String(wellness.wellnessAutoSendEnabled),
          description: '웰니스 자동 발송',
          category: 'WELLNESS'
        }),
        apiPost(API_ADMIN_SYSTEM_CONFIG_WELLNESS_SEND_TIME, {
          configValue: wellness.wellnessSendTime,
          description: '웰니스 발송 시간',
          category: 'WELLNESS'
        }),
        apiPost(API_ADMIN_SYSTEM_CONFIG_WELLNESS_TARGET_ROLES, {
          configValue: wellness.wellnessTargetRoles,
          description: '웰니스 대상 역할',
          category: 'WELLNESS'
        })
      ]);
      notificationManager.show('웰니스 설정이 저장되었습니다.', 'success');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      const backendMsg = error?.response?.data?.message || error?.data?.message;
      notificationManager.show(backendMsg || '설정 저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!hasCheckedSession || loading) {
    const loadingText = !hasCheckedSession ? '세션을 확인하는 중...' : '설정을 불러오는 중...';
    return (
      <AdminCommonLayout title="시스템 설정 관리">
        <div className="mg-v2-ad-b0kla mg-v2-system-config-management">
          <div className="mg-v2-ad-b0kla__container" aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text={loadingText} variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="시스템 설정 관리">
      <div className="mg-v2-ad-b0kla mg-v2-system-config-management">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea>
            <ContentHeader
              title="시스템 설정 관리"
              subtitle="웰니스 자동 발송 등 시스템 설정을 관리합니다. AI API 키·프로바이더 선택은 'AI 프로바이더 관리'로 이전되었습니다."
              actions={
                <MGButton
                  type="button"
                  variant="primary"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'md',
                    loading: saving,
                    className: 'mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary'
                  })}
                  onClick={handleSave}
                  disabled={saving}
                  title="설정 저장"
                  loading={saving}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                  설정 저장
                </MGButton>
              }
            />

            {/* PR-2 (2026-05-25): 알림 자동 발송 스케줄러 4 종 토글 (DB SSOT) */}
            <NotificationSchedulerSection
              t={t}
              flags={schedulerFlags}
              loading={schedulerLoading}
              savingKey={schedulerSavingKey}
              onToggleRequest={handleSchedulerToggleRequest}
            />

            {/* AI 프로바이더 관리 안내 카드 — 이전 사용자 동선 보존 */}
            <div className="mg-v2-ad-b0kla__card mg-v2-system-config__section mg-v2-system-config__section--notice">
              <h2 className="mg-v2-ad-b0kla__section-title">
                <Cpu size={20} aria-hidden="true" />
                AI 프로바이더 관리 (분리됨)
              </h2>
              <p className="mg-v2-system-config__section-desc">
                AI API 키 등록·프로바이더 선택·사용 통계·호출 로그는 별도 페이지로 이전되었습니다.
              </p>
              <div className="mg-v2-system-config__notice-actions">
                <Link
                  to={ADMIN_ROUTES.AI_PROVIDERS}
                  className="mg-v2-system-config__notice-link"
                  aria-label="AI 프로바이더 관리 페이지로 이동"
                >
                  <span>AI 프로바이더 관리로 이동</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* 웰니스 설정 섹션 (잔류) */}
            <div className="mg-v2-ad-b0kla__card mg-v2-system-config__section">
              <h2 className="mg-v2-ad-b0kla__section-title">
                <Database size={20} aria-hidden="true" />
                웰니스 시스템 설정
              </h2>
              <p className="mg-v2-system-config__section-desc">
                {t(
                  'systemConfig.wellness.sectionDesc',
                  '매일 지정된 시간에 등록된 사용자에게 웰니스 팁을 자동 발송합니다. 대상 역할은 다중 선택할 수 있습니다.'
                )}
              </p>
              <div className="config-grid">
                <div className="config-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={wellness.wellnessAutoSendEnabled}
                      onChange={(e) => setWellness((prev) => ({ ...prev, wellnessAutoSendEnabled: e.target.checked }))}
                    />
                    {' '}
                    자동 발송 활성화
                  </label>
                  <small className="help-text">매일 지정된 시간에 웰니스 팁을 자동으로 발송합니다.</small>
                </div>
                <div className="config-item">
                  <label htmlFor="sendTime">발송 시간</label>
                  <input
                    id="sendTime"
                    type="time"
                    value={wellness.wellnessSendTime}
                    onChange={(e) => setWellness((prev) => ({ ...prev, wellnessSendTime: e.target.value }))}
                    className="mg-v2-input"
                  />
                </div>
                <div className="config-item">
                  <label htmlFor="targetRoles" id="targetRoles-label">
                    {t('systemConfig.wellness.targetRoles.label', '대상 역할')}
                  </label>
                  <ChipMultiSelect
                    id="targetRoles"
                    options={targetRoleOptions}
                    value={targetRoleValues}
                    onChange={handleTargetRolesChange}
                    placeholder={rolesLoading
                      ? t('systemConfig.wellness.targetRoles.placeholderLoading', '역할 로딩 중...')
                      : t('systemConfig.wellness.targetRoles.placeholder', '역할 선택')}
                    emptyOptionsText={t(
                      'systemConfig.wellness.targetRoles.emptyOptions',
                      '선택 가능한 역할이 없습니다.'
                    )}
                    disabled={rolesLoading}
                    ariaLabelledBy="targetRoles-label"
                    formatRemoveLabel={formatRemoveLabel}
                  />
                  <small className="help-text">
                    {t(
                      'systemConfig.wellness.targetRoles.hint',
                      '웰니스 알림을 수신할 역할을 선택하세요. 다중 선택 가능.'
                    )}
                  </small>
                </div>
              </div>
            </div>
          </ContentArea>
        </div>
      </div>

      {/* PR-2 (2026-05-25): 토글 확인 모달 — UnifiedModal 표준 */}
      <NotificationSchedulerConfirmModal
        t={t}
        confirm={schedulerConfirm}
        saving={schedulerSavingKey === schedulerConfirm?.key}
        onProceed={handleSchedulerConfirmProceed}
        onCancel={handleSchedulerConfirmCancel}
      />
    </AdminCommonLayout>
  );
};

/**
 * PR-2 (2026-05-25): 알림 자동 발송 스케줄러 4 종 토글 섹션 (presentational).
 *
 * 부모로부터 i18n {@code t}, 플래그 dict, 로딩/저장 상태, 토글 요청 핸들러를 주입받아 렌더링한다.
 * 4 종 라벨/힌트는 i18n 키로 정적 정의하며, role="switch" + aria-checked 로 접근성을 보장한다.
 *
 * @param {object} props
 * @param {(key: string, fallback: string, vars?: object) => string} props.t i18n 함수
 * @param {Object<string, {value: boolean, updatedBy: string, updatedAt: string}>} props.flags 키별 메타
 * @param {boolean} props.loading 4 키 일괄 로딩 중
 * @param {string|null} props.savingKey 저장 진행 중인 키 (해당 토글만 disabled)
 * @param {(key: string, label: string, currentValue: boolean) => void} props.onToggleRequest 토글 요청 핸들러
 */
const NotificationSchedulerSection = ({ t, flags, loading, savingKey, onToggleRequest }) => {
  const items = [
    {
      key: NOTIFICATION_SCHEDULER_FLAG_KEYS.WELLNESS_TIP,
      labelKey: 'systemConfig.notificationScheduler.wellnessTip',
      labelFallback: '웰니스 일일 팁',
      hintKey: 'systemConfig.notificationScheduler.wellnessTipHint',
      hintFallback: '매일 09:00 KST 등록된 사용자에게 자동 발송합니다.'
    },
    {
      key: NOTIFICATION_SCHEDULER_FLAG_KEYS.CONSULTATION_RECORD_ALERT,
      labelKey: 'systemConfig.notificationScheduler.consultationRecordAlert',
      labelFallback: '상담 기록 미작성 알림',
      hintKey: 'systemConfig.notificationScheduler.consultationRecordAlertHint',
      hintFallback: '일·주·월 배치로 상담사에게 미작성 건을 통지합니다.'
    },
    {
      key: NOTIFICATION_SCHEDULER_FLAG_KEYS.WORKFLOW_AUTOMATION,
      labelKey: 'systemConfig.notificationScheduler.workflowAutomation',
      labelFallback: '워크플로우 자동화',
      hintKey: 'systemConfig.notificationScheduler.workflowAutomationHint',
      hintFallback: '예약 리마인더·미완료 알림·일/월 성과 자동화 4종을 일괄 제어합니다.'
    },
    {
      key: NOTIFICATION_SCHEDULER_FLAG_KEYS.RESERVATION_REMINDER,
      labelKey: 'systemConfig.notificationScheduler.reservationReminder',
      labelFallback: '예약 D-1·D-2 리마인더',
      hintKey: 'systemConfig.notificationScheduler.reservationReminderHint',
      hintFallback: '매일 09:00 KST 예약 D-2 안내를 일괄 발송합니다.'
    }
  ];
  // 표시 순서 강제 — 키만 반복하여 i18n 라벨 + flags 메타 매핑.
  const orderedItems = NOTIFICATION_SCHEDULER_FLAG_ORDER
    .map((key) => items.find((item) => item.key === key))
    .filter(Boolean);

  return (
    <section
      className="mg-v2-ad-b0kla__card mg-v2-system-config__section mg-v2-notification-scheduler"
      aria-labelledby="notification-scheduler-title"
    >
      <h2
        id="notification-scheduler-title"
        className="mg-v2-ad-b0kla__section-title"
      >
        <BellRing size={20} aria-hidden="true" />
        {t('systemConfig.notificationScheduler.title', '알림 자동 발송')}
      </h2>
      <p className="mg-v2-system-config__section-desc">
        {t(
          'systemConfig.notificationScheduler.description',
          '운영자가 자동 발송 채널을 즉시 ON/OFF 할 수 있습니다. 변경 즉시 다음 cron 시점부터 반영됩니다.'
        )}
      </p>
      {loading ? (
        <UnifiedLoading
          type="inline"
          text={t(
            'systemConfig.notificationScheduler.loading',
            '스케줄러 플래그를 불러오는 중...'
          )}
          variant="pulse"
        />
      ) : (
        <ul className="mg-v2-notification-scheduler__list">
          {orderedItems.map((item) => {
            const flag = flags[item.key];
            const value = !!(flag && flag.value);
            const label = t(item.labelKey, item.labelFallback);
            const hint = t(item.hintKey, item.hintFallback);
            const statusLabel = value
              ? t('systemConfig.notificationScheduler.status.on', '켜짐')
              : t('systemConfig.notificationScheduler.status.off', '꺼짐');
            const ariaLabel = value
              ? t('systemConfig.notificationScheduler.toggleAriaOff', '{{label}} 끄기', { label })
              : t('systemConfig.notificationScheduler.toggleAriaOn', '{{label}} 켜기', { label });
            const lastUpdatedText = flag && flag.updatedAt
              ? t('systemConfig.notificationScheduler.lastUpdated', '마지막 변경: {{updatedBy}} ({{updatedAt}})', {
                updatedBy: flag.updatedBy || '-',
                updatedAt: formatLastUpdatedAt(flag.updatedAt)
              })
              : t('systemConfig.notificationScheduler.lastUpdatedNever', '마지막 변경 이력 없음');
            const isSaving = savingKey === item.key;
            return (
              <li
                key={item.key}
                className="mg-v2-notification-scheduler__item"
              >
                <div className="mg-v2-notification-scheduler__item-main">
                  <p className="mg-v2-notification-scheduler__item-label">{label}</p>
                  <p className="mg-v2-notification-scheduler__item-hint">{hint}</p>
                  <p className="mg-v2-notification-scheduler__item-meta">{lastUpdatedText}</p>
                </div>
                <div className="mg-v2-notification-scheduler__item-control">
                  <span
                    className={`mg-v2-notification-scheduler__status mg-v2-notification-scheduler__status--${value ? 'on' : 'off'}`}
                    role="status"
                  >
                    {statusLabel}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={value}
                    aria-label={ariaLabel}
                    disabled={isSaving}
                    className={`mg-v2-notification-scheduler__switch mg-v2-notification-scheduler__switch--${value ? 'on' : 'off'}`}
                    onClick={() => onToggleRequest(item.key, label, value)}
                  >
                    <span className="mg-v2-notification-scheduler__switch-knob" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

/**
 * PR-2 (2026-05-25): 토글 확인 모달.
 *
 * UnifiedModal 표준 (className="mg-v2-ad-b0kla") 을 사용한다. 켜기/끄기에 따라
 * 메시지가 달라지며 (즉시 중단 vs 다음 cron), 처리 중에는 확인 버튼이 disabled 가 된다.
 */
const NotificationSchedulerConfirmModal = ({ t, confirm, saving, onProceed, onCancel }) => {
  const isOpen = !!confirm;
  const message = !confirm
    ? ''
    : confirm.nextValue
      ? t('systemConfig.notificationScheduler.confirmOn', '켜면 다음 cron 시점부터 자동 발송됩니다. 진행할까요?')
      : t('systemConfig.notificationScheduler.confirmOff', '끄면 자동 발송이 즉시 중단됩니다. 진행할까요?');

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onCancel}
      title={t('systemConfig.notificationScheduler.confirmTitle', '자동 발송 토글 확인')}
      subtitle={confirm ? confirm.label : ''}
      size="small"
      className="mg-v2-ad-b0kla"
      backdropClick={!saving}
      showCloseButton
      actions={
        <>
          <MGButton
            type="button"
            variant="secondary"
            size="medium"
            className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onCancel}
            disabled={saving}
          >
            {t('systemConfig.notificationScheduler.cancel', '취소')}
          </MGButton>
          <MGButton
            type="button"
            variant="primary"
            size="medium"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: saving })}
            loading={saving}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={onProceed}
            preventDoubleClick={false}
          >
            {t('systemConfig.notificationScheduler.confirm', '확인')}
          </MGButton>
        </>
      }
    >
      <p className="mg-v2-info-text">{message}</p>
    </UnifiedModal>
  );
};

export default SystemConfigManagement;
