/**
 * 관리자 일정 상세 — 배정 변경(회기 정정) 3단계 패널.
 *
 * GET candidates / GET|POST preview / POST reassign-mapping.
 * cancelRecommended=true 시 배정 관리 링크만 (자동취소 API 금지).
 *
 * @author MindGarden
 * @since 2026-11-26
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import UnifiedModal from '../common/modals/UnifiedModal';
import BadgeSelect from '../common/BadgeSelect';
import ActionBar from '../common/ActionBar';
import ActionBarButton from '../common/ActionBarButton';
import SafeText from '../common/SafeText';
import useCoverDrawerFocus from '../common/coverChapter/useCoverDrawerFocus';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { ADMIN_ROUTES } from '../../constants/adminRoutes';
import {
  REASSIGN_REASON_CHIP_CUSTOM,
  REASSIGN_REASON_CHIPS,
  REASSIGN_REASON_MAX_LENGTH,
  REASSIGN_STEPS,
  REASSIGN_UI,
  SESSION_CELL_STATE
} from '../../constants/scheduleReassignMapping';
import {
  SCHEDULE_REMAINING_SESSIONS_FIELD,
  SCHEDULE_TOTAL_SESSIONS_FIELD,
  SCHEDULE_USED_SESSIONS_FIELD
} from '../../constants/schedule';
import { resolveMappingPackageDisplayName } from '../../utils/packagePricing';
import { toDisplayString, toErrorMessage, toSafeNumber } from '../../utils/safeDisplay';
import notificationManager from '../../utils/notification';
import StandardizedApi from '../../utils/standardizedApi';
import { buildSessionCellLayout } from './utils/scheduleReassignSessionCells';
import './ScheduleReassignMapping.css';

const STEP_LABELS = [
  { step: REASSIGN_STEPS.SELECT, label: REASSIGN_UI.STEP_SELECT },
  { step: REASSIGN_STEPS.PREVIEW, label: REASSIGN_UI.STEP_PREVIEW },
  { step: REASSIGN_STEPS.REASON, label: REASSIGN_UI.STEP_REASON }
];

const chipOptions = REASSIGN_REASON_CHIPS.map((chip) => ({
  value: chip.value,
  label: chip.label
}));

/**
 * @param {object|null|undefined} schedule
 * @returns {{ mappingId: number|null, packageName: string, totalSessions: number, usedSessions: number, remainingSessions: number, status: string }}
 */
export function buildOriginMappingFromSchedule(schedule) {
  if (!schedule) {
    return {
      mappingId: null,
      packageName: '',
      totalSessions: 0,
      usedSessions: 0,
      remainingSessions: 0,
      status: '',
      current: true,
      selectable: false
    };
  }
  const mappingIdRaw = schedule.mappingId ?? schedule.consultationMappingId ?? null;
  const mappingId = mappingIdRaw != null ? Number(mappingIdRaw) : null;
  const totalSessions = toSafeNumber(
    schedule[SCHEDULE_TOTAL_SESSIONS_FIELD] ?? schedule.totalSessions,
    0
  );
  const remainingSessions = toSafeNumber(
    schedule[SCHEDULE_REMAINING_SESSIONS_FIELD] ?? schedule.remainingSessions,
    0
  );
  let usedSessions = toSafeNumber(
    schedule[SCHEDULE_USED_SESSIONS_FIELD] ?? schedule.usedSessions,
    NaN
  );
  if (!Number.isFinite(usedSessions) && totalSessions > 0) {
    usedSessions = Math.max(0, totalSessions - remainingSessions);
  }
  if (!Number.isFinite(usedSessions)) {
    usedSessions = 0;
  }
  return {
    mappingId: Number.isFinite(mappingId) ? mappingId : null,
    packageName: resolveMappingPackageDisplayName(schedule) || toDisplayString(schedule.packageName, ''),
    totalSessions,
    usedSessions,
    remainingSessions,
    status: toDisplayString(schedule.mappingStatus ?? schedule.status, ''),
    current: true,
    selectable: false
  };
}

/**
 * @param {unknown} payload
 * @returns {Array<object>}
 */
export function normalizeCandidateList(payload) {
  const raw = payload?.data ?? payload;
  if (Array.isArray(raw)) {
    return raw;
  }
  if (Array.isArray(raw?.content)) {
    return raw.content;
  }
  if (Array.isArray(raw?.candidates)) {
    return raw.candidates;
  }
  return [];
}

/**
 * @param {object} candidate
 * @returns {boolean}
 */
export function isCandidateSelectable(candidate) {
  if (!candidate) {
    return false;
  }
  if (candidate.current === true) {
    return false;
  }
  if (candidate.selectable === false) {
    return false;
  }
  if (candidate.blockReason) {
    return false;
  }
  return candidate.mappingId != null;
}

/**
 * @param {string} chipValue
 * @param {string} customText
 * @returns {string}
 */
export function resolveReassignReason(chipValue, customText) {
  if (!chipValue || chipValue === REASSIGN_REASON_CHIP_CUSTOM) {
    return String(customText || '').trim();
  }
  const chip = REASSIGN_REASON_CHIPS.find((item) => item.value === chipValue);
  return chip ? chip.label : String(customText || '').trim();
}

/**
 * @param {string} reason
 * @returns {boolean}
 */
export function isReassignReasonValid(reason) {
  const trimmed = String(reason || '').trim();
  return trimmed.length > 0 && trimmed.length <= REASSIGN_REASON_MAX_LENGTH;
}

/**
 * @param {object} layout
 * @returns {JSX.Element|null}
 */
function SessionCellsView({ layout, label }) {
  if (!layout || layout.layout === 'empty') {
    return null;
  }
  const cellsClass =
    layout.layout === 'row'
      ? 'schedule-reassign-mapping__cells schedule-reassign-mapping__cells--row'
      : 'schedule-reassign-mapping__cells';
  return (
    <div className="schedule-reassign-mapping__cells-wrap" data-testid="reassign-session-cells" data-total={layout.total}>
      {label ? <p className="schedule-reassign-mapping__cells-summary"><SafeText>{label}</SafeText></p> : null}
      {layout.prefixCount > 0 ? (
        <p className="schedule-reassign-mapping__cells-summary" data-testid="reassign-cells-prefix">
          <SafeText>
            {REASSIGN_UI.PREFIX_SUMMARY.replace('{{count}}', String(layout.prefixCount))}
          </SafeText>
        </p>
      ) : null}
      <div className={cellsClass} role="list" aria-label="회기 칸">
        {layout.cells.map((cell) => (
          <span
            key={cell.index}
            role="listitem"
            className={`schedule-reassign-mapping__cell schedule-reassign-mapping__cell--${cell.state}`}
            data-index={cell.index}
            data-state={cell.state}
          >
            {cell.index}
          </span>
        ))}
      </div>
      {layout.suffixCount > 0 ? (
        <p className="schedule-reassign-mapping__cells-summary" data-testid="reassign-cells-suffix">
          <SafeText>
            {REASSIGN_UI.SUFFIX_SUMMARY.replace('{{count}}', String(layout.suffixCount))}
          </SafeText>
        </p>
      ) : null}
    </div>
  );
}

SessionCellsView.propTypes = {
  layout: PropTypes.object,
  label: PropTypes.string
};

/**
 * @param {object} props
 */
const ScheduleReassignMappingPanel = ({
  isOpen = false,
  onClose,
  schedule,
  zIndex = 1300,
  onReassigned = null
}) => {
  const panelRef = useRef(null);
  const [step, setStep] = useState(REASSIGN_STEPS.SELECT);
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState('');
  const [selectedMappingId, setSelectedMappingId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [chipValue, setChipValue] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [cancelRecommended, setCancelRecommended] = useState(false);
  const [historyLog, setHistoryLog] = useState([]);
  const submittingRef = useRef(false);

  const origin = useMemo(() => buildOriginMappingFromSchedule(schedule), [schedule]);
  const scheduleId = schedule?.id ?? null;

  const resolvedReason = useMemo(
    () => resolveReassignReason(chipValue, customReason),
    [chipValue, customReason]
  );
  const reasonValid = isReassignReasonValid(resolvedReason);

  const resetWizard = useCallback(() => {
    setStep(REASSIGN_STEPS.SELECT);
    setCandidates([]);
    setCandidatesLoading(false);
    setCandidatesError('');
    setSelectedMappingId(null);
    setPreview(null);
    setPreviewLoading(false);
    setPreviewError('');
    setChipValue('');
    setCustomReason('');
    setSubmitting(false);
    setSubmitError('');
    setCancelRecommended(false);
    submittingRef.current = false;
  }, []);

  useCoverDrawerFocus({
    isOpen,
    panelRef,
    onClose: () => {
      resetWizard();
      onClose?.();
    },
    stopPropagationOnEscape: true
  });

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const node = document.querySelector('[data-testid="schedule-reassign-mapping-panel"]');
    panelRef.current = node;
    return undefined;
  }, [isOpen, step, candidatesLoading, previewLoading]);

  const loadCandidates = useCallback(async () => {
    if (!scheduleId) {
      return;
    }
    setCandidatesLoading(true);
    setCandidatesError('');
    try {
      const data = await StandardizedApi.get(
        API_ENDPOINTS.ADMIN.SCHEDULES.REASSIGN_MAPPING_CANDIDATES(scheduleId)
      );
      setCandidates(normalizeCandidateList(data));
    } catch (error) {
      setCandidates([]);
      setCandidatesError(toErrorMessage(error, REASSIGN_UI.LOAD_CANDIDATES_FAILED));
    } finally {
      setCandidatesLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    if (!isOpen) {
      resetWizard();
      return;
    }
    loadCandidates();
  }, [isOpen, loadCandidates, resetWizard]);

  const eligibleCandidates = useMemo(
    () => candidates.filter((item) => isCandidateSelectable(item) && item.mappingId !== origin.mappingId),
    [candidates, origin.mappingId]
  );

  const blockedCandidates = useMemo(
    () => candidates.filter((item) => !isCandidateSelectable(item) || item.mappingId === origin.mappingId),
    [candidates, origin.mappingId]
  );

  const selectedCandidate = useMemo(
    () => eligibleCandidates.find((item) => Number(item.mappingId) === Number(selectedMappingId)) || null,
    [eligibleCandidates, selectedMappingId]
  );

  const loadPreview = useCallback(async (targetMappingId) => {
    if (!scheduleId || targetMappingId == null) {
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const data = await StandardizedApi.get(
        API_ENDPOINTS.ADMIN.SCHEDULES.REASSIGN_MAPPING_PREVIEW(scheduleId),
        { targetMappingId }
      );
      const body = data?.data ?? data;
      setPreview(body);
    } catch (error) {
      setPreview(null);
      setPreviewError(toErrorMessage(error, REASSIGN_UI.LOAD_PREVIEW_FAILED));
    } finally {
      setPreviewLoading(false);
    }
  }, [scheduleId]);

  const handleSelectCandidate = (mappingId) => {
    setSelectedMappingId(Number(mappingId));
    setSubmitError('');
  };

  const handleNext = async () => {
    if (step === REASSIGN_STEPS.SELECT) {
      if (selectedMappingId == null) {
        setSubmitError(REASSIGN_UI.SELECT_REQUIRED);
        return;
      }
      setSubmitError('');
      await loadPreview(selectedMappingId);
      setStep(REASSIGN_STEPS.PREVIEW);
      return;
    }
    if (step === REASSIGN_STEPS.PREVIEW) {
      setStep(REASSIGN_STEPS.REASON);
    }
  };

  const handlePrev = () => {
    setSubmitError('');
    if (step === REASSIGN_STEPS.REASON) {
      setStep(REASSIGN_STEPS.PREVIEW);
      return;
    }
    if (step === REASSIGN_STEPS.PREVIEW) {
      setStep(REASSIGN_STEPS.SELECT);
    }
  };

  const handleClose = () => {
    resetWizard();
    onClose?.();
  };

  const handleConfirm = async () => {
    if (!reasonValid || submittingRef.current || !scheduleId || selectedMappingId == null) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    try {
      const data = await StandardizedApi.post(
        API_ENDPOINTS.ADMIN.SCHEDULES.REASSIGN_MAPPING(scheduleId),
        {
          targetMappingId: Number(selectedMappingId),
          reason: resolvedReason
        }
      );
      const body = data?.data ?? data;
      const recommended = Boolean(body?.cancelRecommended);
      setCancelRecommended(recommended);
      setHistoryLog((prev) => [
        {
          at: new Date().toISOString(),
          scheduleId: body?.scheduleId ?? scheduleId,
          originMappingId: body?.originMappingId ?? origin.mappingId,
          targetMappingId: body?.targetMappingId ?? selectedMappingId,
          sessionSequence: body?.sessionSequence,
          reason: resolvedReason
        },
        ...prev
      ]);
      notificationManager.success(REASSIGN_UI.SUCCESS_TOAST);
      if (typeof onReassigned === 'function') {
        onReassigned(body);
      }
      if (!recommended) {
        handleClose();
      } else {
        setStep(REASSIGN_STEPS.REASON);
      }
    } catch (error) {
      setSubmitError(toErrorMessage(error, REASSIGN_UI.EXECUTE_FAILED));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const originAfterUsed = preview
    ? toSafeNumber(preview.originUsedAfter, origin.usedSessions)
    : origin.usedSessions;
  const originAfterTotal = preview
    ? toSafeNumber(preview.originTotalSessions, origin.totalSessions)
    : origin.totalSessions;
  const targetAfterUsed = preview
    ? toSafeNumber(preview.targetUsedAfter, selectedCandidate?.usedSessions)
    : toSafeNumber(selectedCandidate?.usedSessions, 0);
  const targetAfterTotal = preview
    ? toSafeNumber(preview.targetTotalSessions, selectedCandidate?.totalSessions)
    : toSafeNumber(selectedCandidate?.totalSessions, 0);
  const plannedSequence = preview
    ? toSafeNumber(preview.plannedSessionSequence, null)
    : null;

  const originLayout = buildSessionCellLayout(originAfterTotal, {
    usedCount: originAfterUsed,
    highlightIndex: preview?.sessionWouldRestoreOnOrigin
      ? toSafeNumber(schedule?.sessionSequence, null)
      : null,
    highlightState: SESSION_CELL_STATE.RESTORED
  });

  const targetLayout = buildSessionCellLayout(targetAfterTotal, {
    usedCount: Math.max(0, targetAfterUsed - (plannedSequence ? 1 : 0)),
    highlightIndex: plannedSequence,
    highlightState: SESSION_CELL_STATE.PLANNED
  });

  const formatSessions = (used, total, remaining) =>
    REASSIGN_UI.SESSIONS_SUMMARY
      .replace('{{used}}', String(toSafeNumber(used, 0)))
      .replace('{{total}}', String(toSafeNumber(total, 0)))
      .replace('{{remaining}}', String(toSafeNumber(remaining, 0)));

  const renderMappingButton = (item, { current = false, disabled = false } = {}) => {
    const id = Number(item.mappingId);
    const selected = !current && Number(selectedMappingId) === id;
    const blocked = disabled || current || !isCandidateSelectable(item);
    return (
      <li key={`${current ? 'current' : 'cand'}-${id}`}>
        <button
          type="button"
          className={`schedule-reassign-mapping__item${selected ? ' is-selected' : ''}${current ? ' is-current' : ''}`}
          disabled={blocked}
          aria-pressed={selected}
          data-testid={current ? 'reassign-mapping-current' : `reassign-mapping-candidate-${id}`}
          onClick={() => {
            if (!blocked) {
              handleSelectCandidate(id);
            }
          }}
        >
          <span className="schedule-reassign-mapping__item-title">
            <SafeText>{toDisplayString(item.packageName, `배정 #${id}`)}</SafeText>
            {current ? (
              <span className="schedule-reassign-mapping__badge">{REASSIGN_UI.CURRENT_BADGE}</span>
            ) : null}
          </span>
          <span className="schedule-reassign-mapping__item-meta">
            <SafeText>
              {formatSessions(item.usedSessions, item.totalSessions, item.remainingSessions)}
            </SafeText>
          </span>
          {item.blockReason ? (
            <span className="schedule-reassign-mapping__block-reason">
              <SafeText>{item.blockReason}</SafeText>
            </span>
          ) : null}
        </button>
      </li>
    );
  };

  const confirmDisabled = !reasonValid || submitting || selectedMappingId == null;

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={REASSIGN_UI.TITLE}
      subtitle={REASSIGN_UI.SUBTITLE}
      size="large"
      backdropClick={!submitting}
      showCloseButton
      zIndex={zIndex}
      closeOnEscape={false}
      className="schedule-reassign-mapping-panel"
      data-testid="schedule-reassign-mapping-panel"
      loading={candidatesLoading || previewLoading || submitting}
    >
      <div className="schedule-reassign-mapping__body">
        <p className="schedule-reassign-mapping__disclaimer">{REASSIGN_UI.DISCLAIMER}</p>

        <nav className="schedule-reassign-mapping__steps" aria-label="배정 변경 단계">
          {STEP_LABELS.map((item) => (
            <span
              key={item.step}
              className={`schedule-reassign-mapping__step${step === item.step ? ' is-active' : ''}`}
            >
              {item.step}. {item.label}
            </span>
          ))}
        </nav>

        {step === REASSIGN_STEPS.SELECT ? (
          <section className="schedule-reassign-mapping__section" aria-label={REASSIGN_UI.STEP_SELECT}>
            <h3 className="schedule-reassign-mapping__section-title">{REASSIGN_UI.ELIGIBLE_SECTION}</h3>
            {candidatesError ? (
              <p className="schedule-reassign-mapping__error" role="alert">{candidatesError}</p>
            ) : null}
            {eligibleCandidates.length === 0 && !candidatesLoading ? (
              <p className="schedule-reassign-mapping__empty">{REASSIGN_UI.EMPTY_CANDIDATES}</p>
            ) : (
              <ul className="schedule-reassign-mapping__list">
                {eligibleCandidates.map((item) => renderMappingButton(item))}
              </ul>
            )}

            <h3 className="schedule-reassign-mapping__section-title">{REASSIGN_UI.BLOCKED_SECTION}</h3>
            <ul className="schedule-reassign-mapping__list">
              {origin.mappingId != null ? renderMappingButton(origin, { current: true, disabled: true }) : null}
              {blockedCandidates
                .filter((item) => Number(item.mappingId) !== Number(origin.mappingId))
                .map((item) => renderMappingButton(item, { disabled: true }))}
            </ul>
          </section>
        ) : null}

        {step === REASSIGN_STEPS.PREVIEW ? (
          <section className="schedule-reassign-mapping__section" aria-label={REASSIGN_UI.STEP_PREVIEW}>
            {previewError ? (
              <p className="schedule-reassign-mapping__error" role="alert">{previewError}</p>
            ) : null}
            <div className="schedule-reassign-mapping__preview-grid">
              <article className="schedule-reassign-mapping__preview-card">
                <h4>{REASSIGN_UI.ORIGIN_LABEL}</h4>
                <p className="schedule-reassign-mapping__item-meta">
                  <SafeText>{toDisplayString(origin.packageName, '')}</SafeText>
                </p>
                <p className="schedule-reassign-mapping__item-meta">
                  <SafeText>
                    {formatSessions(
                      originAfterUsed,
                      originAfterTotal,
                      toSafeNumber(preview?.originRemainingAfter, origin.remainingSessions)
                    )}
                  </SafeText>
                </p>
                <SessionCellsView layout={originLayout} />
              </article>
              <article className="schedule-reassign-mapping__preview-card">
                <h4>{REASSIGN_UI.TARGET_LABEL}</h4>
                <p className="schedule-reassign-mapping__item-meta">
                  <SafeText>
                    {toDisplayString(selectedCandidate?.packageName, '')}
                  </SafeText>
                </p>
                <p className="schedule-reassign-mapping__item-meta">
                  <SafeText>
                    {formatSessions(
                      targetAfterUsed,
                      targetAfterTotal,
                      toSafeNumber(preview?.targetRemainingAfter, selectedCandidate?.remainingSessions)
                    )}
                  </SafeText>
                </p>
                {plannedSequence ? (
                  <p className="schedule-reassign-mapping__item-meta">
                    <SafeText>
                      {REASSIGN_UI.PLANNED_SEQUENCE.replace('{{sequence}}', String(plannedSequence))}
                    </SafeText>
                  </p>
                ) : null}
                <SessionCellsView layout={targetLayout} />
              </article>
            </div>
          </section>
        ) : null}

        {step === REASSIGN_STEPS.REASON ? (
          <section className="schedule-reassign-mapping__section" aria-label={REASSIGN_UI.STEP_REASON}>
            <div data-testid="reassign-reason-chips">
              <BadgeSelect
                options={chipOptions}
                value={chipValue}
                onChange={(next) => {
                  setChipValue(next);
                  if (next !== REASSIGN_REASON_CHIP_CUSTOM) {
                    setCustomReason('');
                  }
                }}
                aria-label="배정 변경 사유"
              />
            </div>
            {chipValue === REASSIGN_REASON_CHIP_CUSTOM || !chipValue ? (
              <div className="schedule-reassign-mapping__reason-field">
                <label htmlFor="schedule-reassign-reason-input">{REASSIGN_UI.REASON_PLACEHOLDER}</label>
                <textarea
                  id="schedule-reassign-reason-input"
                  data-testid="reassign-reason-input"
                  value={customReason}
                  maxLength={REASSIGN_REASON_MAX_LENGTH}
                  onChange={(event) => {
                    if (chipValue !== REASSIGN_REASON_CHIP_CUSTOM) {
                      setChipValue(REASSIGN_REASON_CHIP_CUSTOM);
                    }
                    setCustomReason(event.target.value.slice(0, REASSIGN_REASON_MAX_LENGTH));
                  }}
                />
                <span className="schedule-reassign-mapping__char-count" data-testid="reassign-reason-count">
                  {customReason.length}/{REASSIGN_REASON_MAX_LENGTH}
                </span>
              </div>
            ) : (
              <div className="schedule-reassign-mapping__reason-field">
                <p className="schedule-reassign-mapping__item-meta" data-testid="reassign-reason-selected">
                  <SafeText>{resolvedReason}</SafeText>
                </p>
                <span className="schedule-reassign-mapping__char-count" data-testid="reassign-reason-count">
                  {resolvedReason.length}/{REASSIGN_REASON_MAX_LENGTH}
                </span>
              </div>
            )}

            {cancelRecommended ? (
              <div className="schedule-reassign-mapping__cancel-hint" data-testid="reassign-cancel-recommended">
                <p>{REASSIGN_UI.CANCEL_RECOMMENDED_LEAD}</p>
                <Link
                  to={ADMIN_ROUTES.MAPPING_MANAGEMENT}
                  data-testid="reassign-cancel-recommended-link"
                >
                  {REASSIGN_UI.CANCEL_RECOMMENDED_LINK}
                </Link>
              </div>
            ) : null}
          </section>
        ) : null}

        {submitError ? (
          <p className="schedule-reassign-mapping__error" role="alert">{submitError}</p>
        ) : null}

        <section className="schedule-reassign-mapping__history" aria-label={REASSIGN_UI.HISTORY_TITLE}>
          <h4>{REASSIGN_UI.HISTORY_TITLE}</h4>
          {historyLog.length === 0 ? (
            <p className="schedule-reassign-mapping__history-hint">{REASSIGN_UI.HISTORY_EMPTY}</p>
          ) : (
            <ul className="schedule-reassign-mapping__history-list" data-testid="reassign-history-list">
              {historyLog.map((entry) => (
                <li key={`${entry.at}-${entry.targetMappingId}`}>
                  <SafeText>
                    {`${entry.originMappingId} → ${entry.targetMappingId}`}
                    {entry.sessionSequence != null ? ` · ${entry.sessionSequence}회기` : ''}
                    {entry.reason ? ` · ${entry.reason}` : ''}
                  </SafeText>
                </li>
              ))}
            </ul>
          )}
          <p className="schedule-reassign-mapping__history-hint">{REASSIGN_UI.HISTORY_HINT}</p>
        </section>

        <div className="schedule-reassign-mapping__footer">
          <ActionBar align="end" gap="md">
            <ActionBarButton
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
              data-testid="reassign-close"
            >
              {REASSIGN_UI.CLOSE}
            </ActionBarButton>
            {step > REASSIGN_STEPS.SELECT && !cancelRecommended ? (
              <ActionBarButton
                variant="outline"
                onClick={handlePrev}
                disabled={submitting}
                data-testid="reassign-prev"
              >
                {REASSIGN_UI.PREV}
              </ActionBarButton>
            ) : null}
            {step < REASSIGN_STEPS.REASON ? (
              <ActionBarButton
                variant="primary"
                onClick={handleNext}
                disabled={
                  submitting
                  || candidatesLoading
                  || previewLoading
                  || (step === REASSIGN_STEPS.SELECT && selectedMappingId == null)
                }
                data-testid="reassign-next"
              >
                {REASSIGN_UI.NEXT}
              </ActionBarButton>
            ) : (
              <ActionBarButton
                variant="primary"
                onClick={handleConfirm}
                disabled={confirmDisabled}
                data-testid="reassign-confirm"
              >
                {REASSIGN_UI.CONFIRM}
              </ActionBarButton>
            )}
          </ActionBar>
        </div>
      </div>
    </UnifiedModal>
  );
};

ScheduleReassignMappingPanel.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  schedule: PropTypes.object,
  zIndex: PropTypes.number,
  onReassigned: PropTypes.func
};

export default ScheduleReassignMappingPanel;
