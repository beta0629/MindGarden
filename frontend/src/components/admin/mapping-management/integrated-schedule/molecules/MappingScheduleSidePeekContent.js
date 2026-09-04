/**
 * MappingScheduleSidePeekContent — 통합일정 Side Peek 본문
 *
 * 상담사 in-place 수정: PUT /api/v1/admin/mappings/{id} body `{ consultantId }`
 * (스케줄 일괄 이전·/mappings/transfer 아님). CONSULTANT 역할은 fail-closed(disabled).
 *
 * 가계약 패키지 변경: POST pending-package SSOT. Side Peek는 CTA만 노출하고
 * PendingPackageEditModal은 부모가 소유. ACTIVE PUT 경로로 열지 않음.
 *
 * @author CoreSolution
 * @since 2026-07-01
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { toDisplayString, toErrorMessage } from '../../../../../utils/safeDisplay';
import { getMappingStatusKoreanNameSync } from '../../../../../utils/codeHelper';
import { parseCombinedPackageName } from '../../../../../utils/packagePricing';
import ActionButton from '../../../../common/ActionButton';
import CustomSelect from '../../../../common/CustomSelect';
import SafeText from '../../../../common/SafeText';
import StatusBadge from '../../../../common/StatusBadge';
import MGButton from '../../../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../../../erp/common/erpMgButtonProps';
import StandardizedApi from '../../../../../utils/standardizedApi';
import { API_ENDPOINTS } from '../../../../../constants/apiEndpoints';
import { USER_ROLES } from '../../../../../constants/roles';
import { MAPPING_STATUS, PAYMENT_STATUS } from '../../../../../constants/mapping';
import notificationManager from '../../../../../utils/notification';
import { mapSessionSuccessionConsultantOptions } from '../../../../../utils/sessionSuccessionOptions';
import VehiclePlateQuickRegisterModal from './VehiclePlateQuickRegisterModal';
import './MappingScheduleSidePeekContent.css';

// Side Peek 열 때마다 재호출되는 상담사 통계 API 결과를 세션 캐시로 재사용
const SIDE_PEEK_CONSULTANTS_WITH_STATS_CACHE_KEY = 'mg_side_peek_consultants_with_stats_v1';

const hasVehiclePlate = (value) => {
  if (value == null) {
    return false;
  }
  return String(value).trim() !== '';
};

const canEditMappingConsultant = (userRole) => {
  const role = userRole != null ? String(userRole) : '';
  return role === USER_ROLES.ADMIN || role === USER_ROLES.STAFF;
};

/**
 * 가계약(PENDING_PAYMENT + payment PENDING)만 패키지 변경 CTA 허용.
 * 지급·종료·취소·ACTIVE 등은 fail-closed. ADMIN/STAFF만.
 */
const canChangePendingPackage = (mapping, userRole) => {
  if (!canEditMappingConsultant(userRole) || !mapping) {
    return false;
  }
  if (mapping.status !== MAPPING_STATUS.PENDING_PAYMENT) {
    return false;
  }
  if (
    mapping.paymentStatus != null
    && String(mapping.paymentStatus).trim() !== ''
    && String(mapping.paymentStatus) !== PAYMENT_STATUS.PENDING
  ) {
    return false;
  }
  return true;
};

const MappingScheduleSidePeekContent = ({
  mapping,
  mappingStatusInfo,
  onVehiclePlateRegistered,
  onConsultantUpdated,
  onChangePendingPackage,
  userRole
}) => {
  const { t } = useTranslation(['admin']);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [consultantOptions, setConsultantOptions] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [selectedConsultantId, setSelectedConsultantId] = useState('');
  const [savingConsultant, setSavingConsultant] = useState(false);
  const [consultantsReloadSeq, setConsultantsReloadSeq] = useState(0);

  const editable = canEditMappingConsultant(userRole);
  const showPendingPackageChange = canChangePendingPackage(mapping, userRole);

  const handleChangePendingPackage = useCallback(() => {
    if (!showPendingPackageChange || typeof onChangePendingPackage !== 'function') {
      return;
    }
    onChangePendingPackage(mapping);
  }, [showPendingPackageChange, onChangePendingPackage, mapping]);

  useEffect(() => {
    if (!mapping) {
      return;
    }
    const currentId = mapping.consultantId ?? mapping.consultant?.id;
    setSelectedConsultantId(currentId != null ? String(currentId) : '');
  }, [mapping]);

  useEffect(() => {
    if (!mapping || !editable) {
      return undefined;
    }
    let cancelled = false;
    const loadConsultants = async() => {
      try {
        // 세션 캐시 우선 (Side Peek 재오픈 시 불필요한 재호출 방지)
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const rawCache = window.sessionStorage.getItem(
            SIDE_PEEK_CONSULTANTS_WITH_STATS_CACHE_KEY
          );
          if (rawCache) {
            const cachedOptions = JSON.parse(rawCache);
            if (!cancelled && Array.isArray(cachedOptions)) {
              setConsultantOptions(cachedOptions);
              return;
            }
          }
        }
      } catch (error) {
        // ignore cache read/parse errors
      }

      setListsLoading(true);
      try {
        const raw = await StandardizedApi.get(API_ENDPOINTS.ADMIN.CONSULTANTS.WITH_STATS);
        const options = mapSessionSuccessionConsultantOptions(raw);
        if (!cancelled) {
          setConsultantOptions(options);
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.setItem(
                SIDE_PEEK_CONSULTANTS_WITH_STATS_CACHE_KEY,
                JSON.stringify(options)
              );
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (error) {
        console.error('Side Peek 상담사 목록 로드 실패:', error);
        if (!cancelled) {
          setConsultantOptions([]);
        }
      } finally {
        if (!cancelled) {
          setListsLoading(false);
        }
      }
    };
    loadConsultants();
    return () => {
      cancelled = true;
    };
  }, [mapping?.id, editable, consultantsReloadSeq]);

  const handleRegistered = useCallback((payload) => {
    if (typeof onVehiclePlateRegistered === 'function') {
      onVehiclePlateRegistered(payload);
    }
  }, [onVehiclePlateRegistered]);

  const currentConsultantId = mapping?.consultantId ?? mapping?.consultant?.id;
  const consultantDirty = selectedConsultantId
    && String(selectedConsultantId) !== String(currentConsultantId ?? '');

  const handleSaveConsultant = useCallback(async() => {
    if (!editable || !mapping?.id || !selectedConsultantId || !consultantDirty) {
      return;
    }
    setSavingConsultant(true);
    try {
      const response = await StandardizedApi.put(
        `/api/v1/admin/mappings/${mapping.id}`,
        { consultantId: Number(selectedConsultantId) }
      );
      if (response?.success === false) {
        throw new Error(response.message || t('admin:integratedSchedule.sidePeek.consultantSaveFailed'));
      }
      const payload = response?.data ?? response;
      const nextId = payload?.consultantId
        ?? payload?.consultant?.id
        ?? Number(selectedConsultantId);
      const nextName = payload?.consultantName
        ?? payload?.consultant?.name
        ?? consultantOptions.find((o) => o.value === String(selectedConsultantId))?.label
        ?? mapping.consultantName;
      notificationManager.success(t('admin:integratedSchedule.sidePeek.consultantSaveSuccess'));
      if (typeof onConsultantUpdated === 'function') {
        onConsultantUpdated({
          mappingId: mapping.id,
          consultantId: nextId,
          consultantName: nextName
        });
      }

      // 저장 후 즉시 반영: cache 무효화 + with-stats 재로딩 유도
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.removeItem(SIDE_PEEK_CONSULTANTS_WITH_STATS_CACHE_KEY);
        }
      } catch (e) {
        // ignore
      }
      setConsultantsReloadSeq((prev) => prev + 1);
    } catch (error) {
      console.error('Side Peek 상담사 저장 실패:', error);
      notificationManager.error(
        toErrorMessage(error, t('admin:integratedSchedule.sidePeek.consultantSaveFailed'))
      );
    } finally {
      setSavingConsultant(false);
    }
  }, [
    editable,
    mapping,
    selectedConsultantId,
    consultantDirty,
    consultantOptions,
    onConsultantUpdated,
    t
  ]);

  const consultantSelectOptions = useMemo(() => {
    if (consultantOptions.length > 0) {
      return consultantOptions;
    }
    if (currentConsultantId != null) {
      return [{
        value: String(currentConsultantId),
        label: toDisplayString(mapping?.consultantName, `상담사 #${currentConsultantId}`)
      }];
    }
    return [];
  }, [consultantOptions, currentConsultantId, mapping?.consultantName]);

  if (!mapping) {
    return null;
  }

  const clientName = toDisplayString(mapping.clientName, '—');
  const consultantName = toDisplayString(mapping.consultantName, '—');
  const statusCode = mapping.status || '';
  const statusLabel = mappingStatusInfo?.[statusCode]?.label
    ?? getMappingStatusKoreanNameSync(statusCode)
    ?? '—';
  const remainingSessions = mapping.remainingSessions ?? '—';
  const packageParts = parseCombinedPackageName(mapping.packageName);
  const platePresent = hasVehiclePlate(mapping.vehiclePlate);
  const canRegister = Boolean(mapping.clientId);

  return (
    <div className="integrated-schedule-side-peek-stub">
      <dl className="integrated-schedule-side-peek-stub__facts">
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.clientLabel')}</dt>
          <dd><SafeText>{clientName}</SafeText></dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt id="side-peek-consultant-label">
            {t('admin:integratedSchedule.sidePeek.consultantLabel')}
          </dt>
          <dd>
            {editable ? (
              <div className="integrated-schedule-side-peek-stub__consultant-edit">
                <CustomSelect
                  options={consultantSelectOptions}
                  value={selectedConsultantId}
                  onChange={setSelectedConsultantId}
                  placeholder={t('admin:integratedSchedule.sidePeek.consultantPlaceholder')}
                  loading={listsLoading}
                  disabled={listsLoading || savingConsultant}
                  aria-labelledby="side-peek-consultant-label"
                />
                <p className="integrated-schedule-side-peek-stub__helper" role="note">
                  {t('admin:integratedSchedule.sidePeek.consultantHelper')}
                </p>
                <MGButton
                  type="button"
                  variant="primary"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'primary',
                    size: 'sm',
                    loading: savingConsultant
                  })}
                  loading={savingConsultant}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  disabled={!consultantDirty || listsLoading || savingConsultant}
                  onClick={handleSaveConsultant}
                  preventDoubleClick
                  data-testid="side-peek-consultant-save"
                >
                  {t('admin:integratedSchedule.sidePeek.consultantSave')}
                </MGButton>
              </div>
            ) : (
              <SafeText>{consultantName}</SafeText>
            )}
          </dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.packageLabel')}</dt>
          <dd>
            <div className="integrated-schedule-side-peek-stub__package-row">
              {packageParts.length > 0 ? (
                <div className="integrated-schedule-side-peek-stub__package-chips">
                  {packageParts.map((pkg, idx) => (
                    <span key={idx} className="mg-v2-chip mg-v2-chip--neutral integrated-schedule-side-peek-stub__chip">
                      <SafeText>{pkg}</SafeText>
                    </span>
                  ))}
                </div>
              ) : (
                <SafeText>—</SafeText>
              )}
              {showPendingPackageChange && typeof onChangePendingPackage === 'function' ? (
                <MGButton
                  type="button"
                  variant="outline"
                  size="small"
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false
                  })}
                  onClick={handleChangePendingPackage}
                  preventDoubleClick
                  data-testid="side-peek-change-pending-package"
                >
                  {t('admin:integratedSchedule.sidePeek.changePackage')}
                </MGButton>
              ) : null}
            </div>
          </dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.statusLabel')}</dt>
          <dd>
            {statusCode ? (
              <StatusBadge status={statusCode}>{statusLabel}</StatusBadge>
            ) : (
              <SafeText>—</SafeText>
            )}
          </dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.remainingSessionsLabel')}</dt>
          <dd><SafeText>{remainingSessions}</SafeText></dd>
        </div>
        <div className="integrated-schedule-side-peek-stub__fact">
          <dt>{t('admin:integratedSchedule.sidePeek.vehiclePlateLabel')}</dt>
          <dd>
            {platePresent ? (
              <SafeText>{toDisplayString(mapping.vehiclePlate)}</SafeText>
            ) : canRegister ? (
              <ActionButton
                variant="outline"
                size="small"
                onClick={() => setRegisterOpen(true)}
              >
                {t('admin:integratedSchedule.vehiclePlate.registerCta')}
              </ActionButton>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>
      <p className="integrated-schedule-side-peek-stub__placeholder" role="note">
        {t('admin:integratedSchedule.sidePeek.placeholderNote')}
      </p>
      <VehiclePlateQuickRegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        clientId={mapping.clientId}
        clientName={mapping.clientName}
        onRegistered={handleRegistered}
      />
    </div>
  );
};

MappingScheduleSidePeekContent.propTypes = {
  mappingStatusInfo: PropTypes.object,
  mapping: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clientName: PropTypes.string,
    consultantId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    consultantName: PropTypes.string,
    consultant: PropTypes.object,
    packageName: PropTypes.string,
    packagePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalSessions: PropTypes.number,
    status: PropTypes.string,
    paymentStatus: PropTypes.string,
    remainingSessions: PropTypes.number,
    vehiclePlate: PropTypes.string
  }),
  onVehiclePlateRegistered: PropTypes.func,
  onConsultantUpdated: PropTypes.func,
  onChangePendingPackage: PropTypes.func,
  userRole: PropTypes.string
};

MappingScheduleSidePeekContent.defaultProps = {
  mapping: null,
  mappingStatusInfo: {},
  onVehiclePlateRegistered: undefined,
  onConsultantUpdated: undefined,
  onChangePendingPackage: undefined,
  userRole: USER_ROLES.ADMIN
};

export default MappingScheduleSidePeekContent;
export { canEditMappingConsultant, canChangePendingPackage };
