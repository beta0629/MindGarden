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
import { Database, Cpu, ExternalLink } from 'lucide-react';
import { apiGet, apiPost } from '../../utils/ajax';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import { LEGACY_USER_ROLES, USER_ROLES } from '../../constants/roles';
import UnifiedLoading from '../common/UnifiedLoading';
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

const DEFAULT_WELLNESS = Object.freeze({
  wellnessAutoSendEnabled: true,
  wellnessSendTime: '09:00',
  wellnessTargetRoles: 'CLIENT,ROLE_CLIENT'
});

/** 표준 역할 풀 (USER_ROLES 순서 보존) */
const STANDARD_ROLE_OPTIONS = Object.values(USER_ROLES).map((role) => ({
  value: role,
  label: role,
  deprecated: false
}));

/** 레거시 역할 풀 — 운영 데이터 호환을 위해 유지 (선택은 가능하되 라벨에 (레거시) 부착) */
const LEGACY_ROLE_OPTIONS = Object.values(LEGACY_USER_ROLES).map((role) => ({
  value: role,
  deprecated: true,
  __legacyRaw: role
}));

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
  const { user, isLoggedIn } = useSession();
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wellness, setWellness] = useState(DEFAULT_WELLNESS);

  const legacyLabelSuffix = t('systemConfig.wellness.targetRoles.legacy', '(레거시)');

  const targetRoleOptions = useMemo(() => {
    const legacyDecorated = LEGACY_ROLE_OPTIONS.map((opt) => ({
      value: opt.value,
      label: `${opt.__legacyRaw} ${legacyLabelSuffix}`.trim(),
      deprecated: true
    }));
    return [...STANDARD_ROLE_OPTIONS, ...legacyDecorated];
  }, [legacyLabelSuffix]);

  const targetRoleValues = useMemo(
    () => parseTargetRolesCsv(wellness.wellnessTargetRoles),
    [wellness.wellnessTargetRoles]
  );

  const handleTargetRolesChange = useCallback((next) => {
    setWellness((prev) => ({ ...prev, wellnessTargetRoles: stringifyTargetRoles(next) }));
  }, []);

  const formatRemoveLabel = useCallback(
    (label) => t('systemConfig.wellness.targetRoles.remove', '{{role}} 제거', { role: label }),
    [t]
  );

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
  }, [isLoggedIn, user, loadConfigs]);

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

  if (loading) {
    return (
      <AdminCommonLayout title="시스템 설정 관리">
        <div className="mg-v2-ad-b0kla mg-v2-system-config-management">
          <div className="mg-v2-ad-b0kla__container" aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="설정을 불러오는 중..." variant="pulse" />
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
                    placeholder={t('systemConfig.wellness.targetRoles.placeholder', '역할 선택')}
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
    </AdminCommonLayout>
  );
};

export default SystemConfigManagement;
