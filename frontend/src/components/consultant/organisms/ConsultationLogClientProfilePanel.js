import React from 'react';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import { toDisplayString } from '../../../utils/safeDisplay';
import { getUserStatusKoreanNameSync } from '../../../utils/codeHelper';
import {
  isRestrictedClientProfileTier,
  isMemoEditableInContextProfileTier
} from '../../../constants/clientProfileContext';
import ClientSummaryField from '../molecules/ClientSummaryField';
import ConsultationLogPsychSummaryPanel from './ConsultationLogPsychSummaryPanel';

const TRIGGER_ID = 'consultation-log-accordion-profile-trigger';
const PANEL_ID = 'consultation-log-accordion-profile-panel';

const MEMO_TEXTAREA_ID = 'consultation-log-client-memo-draft';

/**
 * 내담자 프로필 + 메모(P1) + (선택) 심리검사 요약 아코디언 패널
 */
const ConsultationLogClientProfilePanel = ({
  expanded,
  onExpandedChange,
  client,
  clientWithStats,
  visibilityTier,
  loading,
  hasValidScheduleClientId,
  psychDocuments,
  loadingPsych,
  memoDraft,
  onMemoChange,
  memoDirty
}) => {
  const renderBody = () => {
    if (client) {
      const hideContactDetail = isRestrictedClientProfileTier(visibilityTier);
      const showMemoSection = isMemoEditableInContextProfileTier(visibilityTier);
      const gradeLabel = client.grade === 'BRONZE'
        ? '브론즈'
        : client.grade === 'SILVER'
          ? '실버'
          : client.grade === 'GOLD'
            ? '골드'
            : client.grade === 'PLATINUM'
              ? '플래티넘'
              : client.grade || '';
      const statusLabel = client.status ? getUserStatusKoreanNameSync(client.status) : '';
      let gradeStatus = '—';
      if (gradeLabel && statusLabel) gradeStatus = `${gradeLabel} / ${statusLabel}`;
      else if (gradeLabel) gradeStatus = gradeLabel;
      else if (statusLabel) gradeStatus = statusLabel;

      const displayPhone = hideContactDetail ? '—' : toDisplayString(client.phone ?? client.phoneNumber ?? client.mobile, '—');
      const displayGender = hideContactDetail ? '—' : (client.gender === 'MALE' ? '남성' : client.gender === 'FEMALE' ? '여성' : client.gender || '—');
      const displayAddress = hideContactDetail
        ? '—'
        : ([client.postalCode, client.address, client.addressDetail].filter(Boolean).join(' ') || '—');

      return (
        <>
          <dl className="mg-v2-detail-grid">
            {hideContactDetail && (
              <ClientSummaryField label="표시 안내" className="mg-v2-consultation-log-modal__detail-span">
                <span className="mg-v2-text-secondary mg-v2-text-sm">
                  {showMemoSection
                    ? '정책에 따라 연락처·이메일·주소는 제한 표시됩니다. 메모 요약은 상담 기록 작성에 맞게 편집할 수 있습니다.'
                    : '정책에 따라 연락처·이메일·주소·메모는 표시되지 않습니다.'}
                </span>
              </ClientSummaryField>
            )}
            <ClientSummaryField label="이름">
              <SafeText fallback="—">{client.name}</SafeText>
            </ClientSummaryField>
            <ClientSummaryField label="연락처(전화)">
              {displayPhone}
            </ClientSummaryField>
            <ClientSummaryField label="이메일">
              {hideContactDetail ? '—' : <SafeText fallback="—">{client.email}</SafeText>}
            </ClientSummaryField>
            <ClientSummaryField label="성별">
              {displayGender}
            </ClientSummaryField>
            <ClientSummaryField label="등급/상태">{gradeStatus}</ClientSummaryField>
            <ClientSummaryField label="주소 요약" className="mg-v2-consultation-log-modal__detail-span">
              {displayAddress}
            </ClientSummaryField>
            {clientWithStats && (
              <ClientSummaryField
                label="매칭·패키지 요약"
                className="mg-v2-consultation-log-modal__detail-span"
              >
                <span title="활성 매칭 또는 일정에 등록된 상담사 수(중복 제거)">
                  연결 상담사 {clientWithStats.currentConsultants ?? 0}명
                  {clientWithStats.statistics?.totalSessions != null
                    && ` / 총 세션 ${clientWithStats.statistics.totalSessions}회`}
                </span>
              </ClientSummaryField>
            )}
          </dl>
          {showMemoSection && (
            <section
              className="mg-v2-consultation-log__memo-p1"
              aria-labelledby="consultation-log-memo-heading"
            >
              <div className="mg-v2-consultation-log__memo-p1-head">
                <span className="mg-v2-consultation-log__memo-accent" aria-hidden="true" />
                <h4 id="consultation-log-memo-heading" className="mg-v2-consultation-log__memo-p1-title">
                  메모 요약
                </h4>
              </div>
              <label className="mg-v2-consultation-log__memo-p1-label" htmlFor={MEMO_TEXTAREA_ID}>
                내담자 메모
              </label>
              <textarea
                id={MEMO_TEXTAREA_ID}
                name="clientMemoDraft"
                value={memoDraft != null ? memoDraft : ''}
                onChange={onMemoChange}
                rows={5}
                className="mg-v2-input mg-v2-w-full mg-v2-consultation-log-modal__textarea mg-v2-consultation-log__memo-textarea"
                aria-labelledby="consultation-log-memo-heading"
              />
              {memoDirty && (
                <p className="mg-v2-text-sm mg-v2-text-secondary mg-v2-consultation-log__memo-dirty-hint">
                  저장 시 내담자 메모가 함께 반영됩니다.
                </p>
              )}
            </section>
          )}
          {(psychDocuments.length > 0 || loadingPsych) && (
            <div className="mg-v2-consultation-log-modal__psych-summary">
              <h3 className="mg-v2-message-title mg-v2-consultation-log-modal__psych-title">심리검사 요약</h3>
              <ConsultationLogPsychSummaryPanel
                psychDocuments={psychDocuments}
                loadingPsych={loadingPsych}
              />
            </div>
          )}
        </>
      );
    }
    if (loading && !client) {
      return (
        <p className="mg-v2-text-sm mg-v2-text-secondary mg-v2-m-0">내담자 정보 로딩 중...</p>
      );
    }
    if (!hasValidScheduleClientId) {
      return (
        <p className="mg-v2-text-sm mg-v2-text-secondary mg-v2-m-0">
          내담자 정보를 불러올 수 없습니다 (일정에 내담자가 연결되지 않았습니다).
        </p>
      );
    }
    if (hasValidScheduleClientId && !client) {
      return (
        <p className="mg-v2-text-sm mg-v2-text-secondary mg-v2-m-0">
          내담자 정보를 불러올 수 없습니다.
        </p>
      );
    }
    return null;
  };

  return (
    <div className="mg-accordion-item mg-v2-consultation-log-modal__client-profile-panel">
      <MGButton
        type="button"
        variant="outline"
        className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false, className: 'mg-accordion-header' })}
        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
        id={TRIGGER_ID}
        aria-expanded={expanded}
        aria-controls={PANEL_ID}
        onClick={() => onExpandedChange(!expanded)}
        preventDoubleClick={false}
      >
        <span className="mg-accordion-title">내담자 프로필</span>
        <span className={`mg-accordion-icon${expanded ? ' open' : ''}`} aria-hidden="true">
          ▼
        </span>
      </MGButton>
      <section
        id={PANEL_ID}
        className={`mg-accordion-content${expanded ? ' open' : ''}`}
        aria-labelledby={TRIGGER_ID}
      >
        <div className="mg-accordion-body">{renderBody()}</div>
      </section>
    </div>
  );
};

export default ConsultationLogClientProfilePanel;
