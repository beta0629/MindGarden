/**
 * 어드민 SMS·카카오 알림톡 수동 일괄 발송 폼 (Organism).
 *
 * - 채널: SMS / 알림톡 (`TabChipRow`)
 * - 수신 대상: 직접 선택 / 전체 내담자(제외할 사람만 선택). 최종 대상은 서버가 확정한다.
 * - 수신자 상한: 서버 설정(GET config)값, 못 받으면 폴백.
 * - 알림톡: 템플릿 선택(공통코드/라이브 토글) + 변수 입력 + 본문 미리보기
 *   (회귀 방지를 위해 `TestNotificationForm` 의 알림톡 섹션 UX 를 동일 구조로 차용)
 * - 발송 사유: 필수, 30자 미만 권장 warning (hard limit X)
 * - 발송 흐름: 서버 미리보기(최종 인원·제외·마스킹 미리보기·snapshotToken) → 확인 모달 「○명에게 발송」
 *   → 발송 작업 생성(즉시 작업 id) → 진행 모달(폴링) → 종료 시 `BatchResultModal` 로 수신자별 결과.
 *   확인 이후 대상이 바뀌면 서버가 409 로 막고 다시 확인하게 한다.
 *
 * 디자인 토큰: `unified-design-tokens.css` 만 사용. 인라인 스타일 0건.
 * React #130 방어: `toDisplayString` 적용.
 *
 * 참조:
 *  - docs/project-management/2026-05-23/MANUAL_NOTIFICATION_DESIGN_HANDOFF.md
 *  - frontend/src/components/admin/system/TestNotificationForm.js (UX 차용)
 *
 * @author MindGarden
 * @since 2026-05-23
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsButton, SettingsNotice, SettingsSectionPanel } from '../settings-shell';
import TabChipRow from '../../common/TabChipRow';
import StatusBadge from '../../common/StatusBadge';
import SettingSwitchRow from '../../common/molecules/SettingSwitchRow';
import { toDisplayString } from '../../../utils/safeDisplay';
import { normalizeApiListPayload } from '../../../constants/adminWebScaffold';
import { USER_ROLES } from '../../../constants/roles';
import useManualNotificationLimit from '../../../hooks/useManualNotificationLimit';
import useManualNotificationJobPolling from '../../../hooks/useManualNotificationJobPolling';
import {
  MANUAL_NOTIFICATION_CHANNEL,
  MANUAL_NOTIFICATION_TEMPLATE_SOURCE,
  MANUAL_NOTIFICATION_ERROR_CODES,
  MANUAL_NOTIFICATION_RECIPIENT_MODE,
  MANUAL_NOTIFICATION_DELIVERY_STATUS,
  MANUAL_NOTIFICATION_REASON_MAX_LENGTH,
  MANUAL_NOTIFICATION_REASON_RECOMMENDED_MIN_LENGTH,
  MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH,
  MANUAL_NOTIFICATION_PUSH_TITLE_MAX_LENGTH,
  MANUAL_NOTIFICATION_PUSH_BODY_MAX_LENGTH,
  KOREAN_MOBILE_PATTERN,
  normalizeManualNotificationPhone,
  maskManualNotificationPhoneForDisplay,
  searchRecipients,
  fetchCommonCodeTemplates,
  fetchLiveTemplates,
  previewManualNotificationJob,
  createManualNotificationJob,
  extractManualNotificationJobError,
  createManualNotificationIdempotencyKey
} from '../../../api/admin/manualNotificationApi';
import RecipientPicker from './RecipientPicker';
import BatchResultModal from './BatchResultModal';
import ManualNotificationJobConfirmModal from './ManualNotificationJobConfirmModal';
import ManualNotificationJobProgressModal from './ManualNotificationJobProgressModal';
import './ManualNotificationForm.css';

const FORM_CLASS = 'mg-manual-notif-form';
const RECIPIENT_DEBOUNCE_MS = 300;
const ADMIN_ROUTES_TEST_NOTIFICATION = '/admin/test-notification';

/**
 * 발송 작업 응답(includeRecords) → BatchResultModal 입력 형태.
 * @param {object} job ManualNotificationJobResponse
 * @returns {object}
 */
export const mapJobToBatchResult = (job) => {
  const records = Array.isArray(job?.records) ? job.records : [];
  return {
    batchId: job?.jobId ?? '',
    channel: job?.channel ?? '',
    startedAt: job?.startedAt ?? job?.createdAt ?? '',
    totalCount: Number(job?.totalCount ?? records.length),
    successCount: Number(job?.sentCount ?? 0),
    failureCount: Number(job?.failedCount ?? 0),
    batchErrorCode: job?.errorCode ?? null,
    batchErrorMessage: null,
    success: job?.status !== 'FAILED',
    results: records.map((r) => ({
      userId: r?.userId ?? null,
      name: r?.nameMasked ?? '',
      phoneMasked: r?.phoneMasked ?? '',
      status: r?.status ?? null,
      success: r?.status === MANUAL_NOTIFICATION_DELIVERY_STATUS.SENT,
      errorCode: r?.errorCode ?? (r?.status === MANUAL_NOTIFICATION_DELIVERY_STATUS.SENT ? null : r?.providerResultCode ?? null),
      errorMessage: r?.errorMessage ?? null
    }))
  };
};

const ManualNotificationForm = ({ onBatchSent }) => {
  const { t } = useTranslation('admin');
  const { maxRecipients, maxExclusions } = useManualNotificationLimit();

  const [channel, setChannel] = useState(MANUAL_NOTIFICATION_CHANNEL.SMS);
  const [recipientMode, setRecipientMode] = useState(MANUAL_NOTIFICATION_RECIPIENT_MODE.SELECTED);
  const isAllMode = recipientMode === MANUAL_NOTIFICATION_RECIPIENT_MODE.ALL_CLIENTS;
  const [excludedUsers, setExcludedUsers] = useState([]);
  const [marketing, setMarketing] = useState(false);

  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientOptions, setRecipientOptions] = useState([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [maxExceededWarning, setMaxExceededWarning] = useState(false);

  // 2026-05-27 — PHONE 모드: 등록되지 않은 임의 휴대전화 직접 입력. SMS/알림톡 채널만 지원.
  const [phoneDraft, setPhoneDraft] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneList, setPhoneList] = useState([]);

  const [smsContent, setSmsContent] = useState('');

  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');

  const [templatesLive, setTemplatesLive] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateCode, setTemplateCode] = useState('');
  const [templateParams, setTemplateParams] = useState({});

  const [reason, setReason] = useState('');

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [recipientSetChanged, setRecipientSetChanged] = useState(false);
  const [formError, setFormError] = useState(null);
  const idempotencyKeyRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [createdJob, setCreatedJob] = useState(null);
  const { job, done: jobDone, error: jobPollError } = useManualNotificationJobPolling(jobId);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(async() => {
      setRecipientLoading(true);
      try {
        const raw = await searchRecipients(isAllMode
          ? { search: recipientQuery.trim(), role: USER_ROLES.CLIENT }
          : { search: recipientQuery.trim() });
        if (cancelled) {
          return;
        }
        setRecipientOptions(normalizeApiListPayload(raw));
      } catch (err) {
        if (!cancelled) {
          console.error('수동 발송 수신자 검색 실패:', err);
          setRecipientOptions([]);
        }
      } finally {
        if (!cancelled) {
          setRecipientLoading(false);
        }
      }
    }, RECIPIENT_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [recipientQuery, isAllMode]);

  useEffect(() => {
    let cancelled = false;
    const load = async() => {
      if (channel !== MANUAL_NOTIFICATION_CHANNEL.ALIMTALK) {
        return;
      }
      setTemplatesLoading(true);
      try {
        const raw = templatesLive
          ? await fetchLiveTemplates()
          : await fetchCommonCodeTemplates();
        if (cancelled) {
          return;
        }
        setTemplates(normalizeApiListPayload(raw));
      } catch (err) {
        if (!cancelled) {
          console.error('수동 발송 알림톡 템플릿 로드 실패:', err);
          setTemplates([]);
        }
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [channel, templatesLive]);

  const selectedTemplate = useMemo(() => {
    if (!templateCode) {
      return null;
    }
    return templates.find((tpl) => String(tpl.templateCode ?? tpl.code) === templateCode) || null;
  }, [templates, templateCode]);

  const templateVariableDefs = useMemo(() => {
    if (!selectedTemplate || !Array.isArray(selectedTemplate.variables)) {
      return [];
    }
    return selectedTemplate.variables;
  }, [selectedTemplate]);

  const reasonTrimmedLength = reason.trim().length;
  const reasonShortWarning = reasonTrimmedLength > 0
    && reasonTrimmedLength < MANUAL_NOTIFICATION_REASON_RECOMMENDED_MIN_LENGTH;

  // 2026-05-27 — PHONE 모드 지원 채널(SMS·알림톡). PUSH 는 토큰 매핑 필수라서 PHONE 미지원.
  const isPhoneModeChannel = channel === MANUAL_NOTIFICATION_CHANNEL.SMS
    || channel === MANUAL_NOTIFICATION_CHANNEL.ALIMTALK;
  const showPhoneInput = isPhoneModeChannel && !isAllMode;
  const totalRecipients = selectedUsers.length
    + (showPhoneInput ? phoneList.length : 0);
  const exclusionsOverLimit = isAllMode && maxExclusions != null && excludedUsers.length > maxExclusions;

  const isAllRequiredFilled = useMemo(() => {
    if (!isAllMode && (totalRecipients === 0 || totalRecipients > maxRecipients)) {
      return false;
    }
    if (exclusionsOverLimit) {
      return false;
    }
    if (reasonTrimmedLength === 0 || reason.length > MANUAL_NOTIFICATION_REASON_MAX_LENGTH) {
      return false;
    }
    if (channel === MANUAL_NOTIFICATION_CHANNEL.SMS) {
      const c = smsContent.trim();
      return c.length > 0 && c.length <= MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH;
    }
    if (channel === MANUAL_NOTIFICATION_CHANNEL.PUSH) {
      const tt = pushTitle.trim();
      const bb = pushBody.trim();
      return tt.length > 0
        && tt.length <= MANUAL_NOTIFICATION_PUSH_TITLE_MAX_LENGTH
        && bb.length > 0
        && bb.length <= MANUAL_NOTIFICATION_PUSH_BODY_MAX_LENGTH;
    }
    if (!templateCode) {
      return false;
    }
    const missingRequired = templateVariableDefs.some((v) => {
      if (!v?.required) {
        return false;
      }
      const value = templateParams[v.name];
      return !value || !String(value).trim();
    });
    return !missingRequired;
  }, [isAllMode, totalRecipients, maxRecipients, exclusionsOverLimit, reasonTrimmedLength, reason, channel,
    smsContent, pushTitle, pushBody, templateCode, templateVariableDefs, templateParams]);

  /**
   * 사용자 입력 휴대전화를 검증한다 — 단계: trim → 정규화(하이픈·공백 제거) → 정규식 → 중복.
   * 빈 값은 "추가" 버튼 비활성용 안내, 형식·중복은 인라인 에러.
   */
  const validatePhone = useCallback((value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return '';
    }
    const normalized = normalizeManualNotificationPhone(trimmed);
    if (!KOREAN_MOBILE_PATTERN.test(normalized)) {
      return t('manualNotification.phone.invalid');
    }
    if (phoneList.includes(normalized)) {
      return t('manualNotification.phone.duplicate');
    }
    return '';
  }, [phoneList, t]);

  const handlePhoneDraftChange = useCallback((e) => {
    const next = e.target.value;
    setPhoneDraft(next);
    setPhoneError(validatePhone(next));
  }, [validatePhone]);

  const addPhone = useCallback(() => {
    const trimmed = phoneDraft.trim();
    if (!trimmed) {
      setPhoneError(t('manualNotification.phone.required'));
      return;
    }
    const normalized = normalizeManualNotificationPhone(trimmed);
    if (!KOREAN_MOBILE_PATTERN.test(normalized)) {
      setPhoneError(t('manualNotification.phone.invalid'));
      return;
    }
    if (phoneList.includes(normalized)) {
      setPhoneError(t('manualNotification.phone.duplicate'));
      return;
    }
    if (selectedUsers.length + phoneList.length >= maxRecipients) {
      setPhoneError(t('manualNotification.phone.limitReached', { max: maxRecipients }));
      return;
    }
    setPhoneList((prev) => [...prev, normalized]);
    setPhoneDraft('');
    setPhoneError('');
  }, [phoneDraft, phoneList, selectedUsers.length, maxRecipients, t]);

  const removePhone = useCallback((index) => {
    setPhoneList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // PUSH 채널로 전환 시 phoneList 가 남아있으면 자동 비우는 가드 — 백엔드와 이중 가드.
  useEffect(() => {
    if (channel === MANUAL_NOTIFICATION_CHANNEL.PUSH) {
      if (phoneList.length > 0) {
        setPhoneList([]);
      }
      if (phoneDraft) {
        setPhoneDraft('');
      }
      if (phoneError) {
        setPhoneError('');
      }
    }
  }, [channel, phoneList.length, phoneDraft, phoneError]);

  const buildJobPayload = useCallback(() => {
    const toIds = (list) => list
      .map((u) => Number(u.userId))
      .filter((n) => Number.isFinite(n) && n > 0);
    const base = {
      channel,
      recipientMode,
      reason: reason.trim(),
      marketing
    };
    if (isAllMode) {
      base.excludeIds = toIds(excludedUsers);
    } else {
      base.userIds = toIds(selectedUsers);
      // PUSH 채널은 PHONE 모드 미지원 — 백엔드 가드와 일관되도록 payload 에 phoneNumbers 포함 X.
      if (channel !== MANUAL_NOTIFICATION_CHANNEL.PUSH && phoneList.length > 0) {
        base.phoneNumbers = phoneList;
      }
    }
    if (channel === MANUAL_NOTIFICATION_CHANNEL.SMS) {
      return { ...base, content: smsContent.trim() };
    }
    if (channel === MANUAL_NOTIFICATION_CHANNEL.PUSH) {
      return { ...base, title: pushTitle.trim(), body: pushBody.trim() };
    }
    return {
      ...base,
      templateCode,
      templateSource: templatesLive
        ? MANUAL_NOTIFICATION_TEMPLATE_SOURCE.SOLAPI
        : MANUAL_NOTIFICATION_TEMPLATE_SOURCE.COMMON_CODE,
      templateParams: templateParams || {}
    };
  }, [channel, recipientMode, reason, marketing, isAllMode, excludedUsers, selectedUsers, phoneList,
    smsContent, pushTitle, pushBody, templateCode, templatesLive, templateParams]);

  const describeJobError = useCallback((err) => {
    const { code, message } = extractManualNotificationJobError(err);
    if (message) {
      return message;
    }
    const resolvedCode = code || MANUAL_NOTIFICATION_ERROR_CODES.SEND_FAILED;
    return t(`manualNotification.errors.${resolvedCode}`, {
      max: maxRecipients,
      defaultValue: t('manualNotification.errors.sendFailed')
    });
  }, [maxRecipients, t]);

  const runPreview = useCallback(async() => {
    if (!isAllRequiredFilled || previewLoading || submitting) {
      return;
    }
    setFormError(null);
    setPreviewLoading(true);
    try {
      const res = await previewManualNotificationJob(buildJobPayload());
      if (!res) {
        return;
      }
      setPreview(res);
      idempotencyKeyRef.current = createManualNotificationIdempotencyKey();
      setRecipientSetChanged(false);
      setConfirmError(null);
      setConfirmOpen(true);
    } catch (err) {
      console.error('수동 발송 대상 확인 실패:', err);
      setFormError(describeJobError(err));
    } finally {
      setPreviewLoading(false);
    }
  }, [isAllRequiredFilled, previewLoading, submitting, buildJobPayload, describeJobError]);

  const closeConfirm = useCallback(() => {
    if (submitting) {
      return;
    }
    setConfirmOpen(false);
    setConfirmError(null);
    setRecipientSetChanged(false);
  }, [submitting]);

  const handleConfirmSend = useCallback(async() => {
    if (!preview || submitting) {
      return;
    }
    setSubmitting(true);
    setConfirmError(null);
    try {
      const res = await createManualNotificationJob({
        ...buildJobPayload(),
        idempotencyKey: idempotencyKeyRef.current,
        snapshotToken: preview.snapshotToken
      });
      if (!res) {
        return;
      }
      setConfirmOpen(false);
      setCreatedJob(res);
      setJobId(res.jobId || null);
    } catch (err) {
      console.error('수동 발송 작업 시작 실패:', err);
      const { code } = extractManualNotificationJobError(err);
      if (code === MANUAL_NOTIFICATION_ERROR_CODES.RECIPIENT_SET_CHANGED) {
        setRecipientSetChanged(true);
      }
      setConfirmError(describeJobError(err));
    } finally {
      setSubmitting(false);
    }
  }, [preview, submitting, buildJobPayload, describeJobError]);

  const handleRecheck = useCallback(() => {
    setConfirmOpen(false);
    runPreview();
  }, [runPreview]);

  useEffect(() => {
    if (!jobDone || !job) {
      return;
    }
    setLastResult(mapJobToBatchResult(job));
    setJobId(null);
    setResultModalOpen(true);
    if (typeof onBatchSent === 'function') {
      onBatchSent(job);
    }
  }, [jobDone, job, onBatchSent]);

  const handleProgressClose = useCallback(() => {
    setJobId(null);
    if (typeof onBatchSent === 'function') {
      onBatchSent(job);
    }
  }, [job, onBatchSent]);

  const handleSendClick = () => {
    runPreview();
  };

  const recipientModeOptions = useMemo(() => [
    { key: MANUAL_NOTIFICATION_RECIPIENT_MODE.SELECTED, label: t('manualNotification.job.modeSelected') },
    { key: MANUAL_NOTIFICATION_RECIPIENT_MODE.ALL_CLIENTS, label: t('manualNotification.job.modeAll') }
  ], [t]);

  const handleRecipientModeChange = useCallback((next) => {
    setRecipientMode(next);
    setRecipientQuery('');
    setMaxExceededWarning(false);
  }, []);

  const channelOptions = useMemo(() => [
    { key: MANUAL_NOTIFICATION_CHANNEL.SMS, label: t('manualNotification.channel.sms', 'SMS') },
    { key: MANUAL_NOTIFICATION_CHANNEL.ALIMTALK, label: t('manualNotification.channel.alimtalk') },
    { key: MANUAL_NOTIFICATION_CHANNEL.PUSH, label: t('manualNotification.channel.push') }
  ], [t]);

  const handleLimitExceeded = useCallback(() => {
    setMaxExceededWarning(true);
    window.setTimeout(() => setMaxExceededWarning(false), 4000);
  }, []);

  const handleResultClose = useCallback(() => {
    setResultModalOpen(false);
  }, []);

  return (
    <article className={FORM_CLASS} aria-label={t('manualNotification.page.title')}>
      <SettingsNotice tone="danger" role="note" testId="manual-notif-actual-send-warning">
        <p><strong>{t('manualNotification.page.warningActualSend')}</strong></p>
        <p>
          <a href={ADMIN_ROUTES_TEST_NOTIFICATION}>
            {t('manualNotification.page.testLinkText')}
          </a>
        </p>
      </SettingsNotice>

      <SettingsSectionPanel
        headingLevel={3}
        title={t('manualNotification.channel.label')}
      >
        <TabChipRow
          items={channelOptions}
          activeKey={channel}
          onChange={(val) => setChannel(val)}
          ariaLabel={t('manualNotification.channel.label')}
        />
      </SettingsSectionPanel>

      <SettingsSectionPanel
        headingLevel={3}
        title={t('manualNotification.job.modeLabel')}
      >
        <TabChipRow
          items={recipientModeOptions}
          activeKey={recipientMode}
          onChange={handleRecipientModeChange}
          ariaLabel={t('manualNotification.job.modeLabel')}
        />
        {isAllMode && (
          <p className="mg-v2-settings-field__hint" data-testid="manual-notif-all-mode-hint">
            {t('manualNotification.job.allModeHint')}
          </p>
        )}
        <SettingSwitchRow
          id="manual-notif-marketing"
          label={t('manualNotification.job.marketingLabel')}
          checked={marketing}
          onCheckedChange={(next) => setMarketing(Boolean(next))}
          ariaLabel={t('manualNotification.job.marketingLabel')}
        />
      </SettingsSectionPanel>

      {isAllMode ? (
        <SettingsSectionPanel
          headingLevel={3}
          title={t('manualNotification.job.excludeTitle')}
          description={t('manualNotification.job.excludeHint')}
        >
          <RecipientPicker
            value={excludedUsers}
            onChange={setExcludedUsers}
            query={recipientQuery}
            onQueryChange={setRecipientQuery}
            options={recipientOptions}
            loading={recipientLoading}
            maxCount={maxExclusions ?? Number.MAX_SAFE_INTEGER}
            onLimitExceeded={handleLimitExceeded}
            requirePhone={false}
          />
          {(maxExceededWarning || exclusionsOverLimit) && (
            <p className={`${FORM_CLASS}__inline-error`} role="alert">
              {t('manualNotification.job.excludeMaxError', { max: maxExclusions })}
            </p>
          )}
        </SettingsSectionPanel>
      ) : (
        <SettingsSectionPanel
          headingLevel={3}
          title={t('manualNotification.recipient.title', { max: maxRecipients })}
        >
          <RecipientPicker
            value={selectedUsers}
            onChange={setSelectedUsers}
            query={recipientQuery}
            onQueryChange={setRecipientQuery}
            options={recipientOptions}
            loading={recipientLoading}
            maxCount={maxRecipients - (showPhoneInput ? phoneList.length : 0)}
            onLimitExceeded={handleLimitExceeded}
          />
          {maxExceededWarning && (
            <p className={`${FORM_CLASS}__inline-error`} role="alert">
              {t('manualNotification.recipient.maxError', {
                max: maxRecipients,
                defaultValue: '최대 {{max}}명까지 선택할 수 있습니다.'
              })}
            </p>
          )}
          {showPhoneInput && (selectedUsers.length > 0 || phoneList.length > 0) && (
            <p className="mg-v2-settings-field__hint">
              {t('manualNotification.recipient.totalCounter', {
                total: totalRecipients,
                max: maxRecipients,
                users: selectedUsers.length,
                phones: phoneList.length,
                defaultValue:
                  '총 수신자 {{total}} / {{max}} (등록 {{users}}명 + 전화번호 {{phones}}건)'
              })}
            </p>
          )}
        </SettingsSectionPanel>
      )}

      {showPhoneInput && (
        <SettingsSectionPanel
          headingLevel={3}
          title={t('manualNotification.phone.title')}
          description={t('manualNotification.phone.hint')}
        >
          <div className={`${FORM_CLASS}__phone-input-row`}>
            <input
              id="mg-manual-notif-phone-input"
              type="tel"
              className="mg-v2-form-input"
              value={phoneDraft}
              onChange={handlePhoneDraftChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addPhone();
                }
              }}
              placeholder={t('manualNotification.phone.placeholder')}
              aria-invalid={Boolean(phoneError)}
              aria-describedby={phoneError ? 'mg-manual-notif-phone-error' : undefined}
              autoComplete="off"
            />
            <SettingsButton
              type="button"
              variant="outline"
              preventDoubleClick
              disabled={
                !phoneDraft.trim()
                  || Boolean(phoneError)
                  || selectedUsers.length + phoneList.length >= maxRecipients
              }
              onClick={addPhone}
            >
              {t('manualNotification.phone.addButton')}
            </SettingsButton>
          </div>
          {phoneError && (
            <p
              id="mg-manual-notif-phone-error"
              className={`${FORM_CLASS}__inline-error`}
              role="alert"
            >
              {phoneError}
            </p>
          )}
          {phoneList.length > 0 && (
            <div className={`${FORM_CLASS}__phone-list-wrapper`}>
              <p className="mg-v2-settings-field__hint">
                {t('manualNotification.phone.listTitle', {
                  count: phoneList.length,
                  defaultValue: '추가된 전화번호 ({{count}}건)'
                })}
              </p>
              <ul className={`${FORM_CLASS}__phone-list`}>
                {phoneList.map((p, i) => (
                  <li key={p} className={`${FORM_CLASS}__phone-chip`}>
                    <span className={`${FORM_CLASS}__phone-chip-label`}>
                      {maskManualNotificationPhoneForDisplay(p)}
                    </span>
                    <button
                      type="button"
                      className={`${FORM_CLASS}__phone-chip-remove`}
                      onClick={() => removePhone(i)}
                      aria-label={t('manualNotification.phone.removeAria')}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SettingsSectionPanel>
      )}

      {channel === MANUAL_NOTIFICATION_CHANNEL.PUSH && (
        <SettingsNotice tone="warning">
          {t('manualNotification.phone.pushNotSupported')}
        </SettingsNotice>
      )}

      {channel === MANUAL_NOTIFICATION_CHANNEL.SMS && (
        <SettingsSectionPanel
          ariaLabel={t('manualNotification.sms.contentLabel')}
        >
          <div className="mg-v2-settings-field">
            <label
              id="mg-manual-notif-sms-title"
              className="mg-v2-form-label"
              htmlFor="mg-manual-notif-sms-content"
            >
              {t('manualNotification.sms.contentLabel')}
            </label>
            <textarea
              id="mg-manual-notif-sms-content"
              className="mg-v2-form-textarea"
              rows={4}
              maxLength={MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH}
              value={smsContent}
              onChange={(e) => setSmsContent(e.target.value)}
              placeholder={t('manualNotification.sms.contentPlaceholder')}
            />
            <p className="mg-v2-settings-field__hint">
              {t('manualNotification.sms.contentCounter', {
                count: smsContent.length,
                max: MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH,
                defaultValue: '{{count}} / {{max}}'
              })}
            </p>
          </div>
        </SettingsSectionPanel>
      )}

      {channel === MANUAL_NOTIFICATION_CHANNEL.PUSH && (
        <SettingsSectionPanel
          ariaLabel={t('manualNotification.push.titleLabel')}
        >
          <p className={`${FORM_CLASS}__hint`} role="note">
            {t('manualNotification.push.warning')}
          </p>
          <div className="mg-v2-settings-field">
            <label
              id="mg-manual-notif-push-title-label"
              className="mg-v2-form-label"
              htmlFor="mg-manual-notif-push-title"
            >
              {t('manualNotification.push.titleLabel')}
            </label>
            <input
              id="mg-manual-notif-push-title"
              type="text"
              className="mg-v2-form-input"
              maxLength={MANUAL_NOTIFICATION_PUSH_TITLE_MAX_LENGTH}
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              placeholder={t('manualNotification.push.titlePlaceholder')}
            />
            <p className="mg-v2-settings-field__hint">
              {t('manualNotification.push.titleCounter', {
                count: pushTitle.length,
                max: MANUAL_NOTIFICATION_PUSH_TITLE_MAX_LENGTH,
                defaultValue: '{{count}} / {{max}}'
              })}
            </p>
          </div>
          <div className="mg-v2-settings-field">
            <label
              id="mg-manual-notif-push-body-label"
              className="mg-v2-form-label"
              htmlFor="mg-manual-notif-push-body"
            >
              {t('manualNotification.push.bodyLabel')}
            </label>
            <textarea
              id="mg-manual-notif-push-body"
              className="mg-v2-form-textarea"
              rows={5}
              maxLength={MANUAL_NOTIFICATION_PUSH_BODY_MAX_LENGTH}
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              placeholder={t('manualNotification.push.bodyPlaceholder')}
            />
            <p className="mg-v2-settings-field__hint">
              {t('manualNotification.push.bodyCounter', {
                count: pushBody.length,
                max: MANUAL_NOTIFICATION_PUSH_BODY_MAX_LENGTH,
                defaultValue: '{{count}} / {{max}}'
              })}
            </p>
          </div>
        </SettingsSectionPanel>
      )}

      {channel === MANUAL_NOTIFICATION_CHANNEL.ALIMTALK && (
        <SettingsSectionPanel
          ariaLabel={t('manualNotification.alimtalk.templateLabel')}
        >
          <div className="mg-v2-settings-field">
            <label
              id="mg-manual-notif-alimtalk-title"
              className="mg-v2-form-label"
              htmlFor="mg-manual-notif-template"
            >
              {t('manualNotification.alimtalk.templateLabel')}
            </label>
            <select
              id="mg-manual-notif-template"
              className="mg-v2-select"
              value={templateCode}
              onChange={(e) => {
                setTemplateCode(e.target.value);
                setTemplateParams({});
              }}
            >
              <option value="">
                {templatesLoading
                  ? t('manualNotification.alimtalk.templatesLoading')
                  : t('manualNotification.alimtalk.templatePlaceholder')}
              </option>
              {templates.map((tpl) => {
                const code = String(tpl.templateCode ?? tpl.code ?? '');
                const label = toDisplayString(tpl.title ?? tpl.name ?? code, code);
                const missingMapping = tpl.solapiTemplateIdPresent === false;
                const prefix = missingMapping
                  ? t('manualNotification.alimtalk.missingMappingBadge')
                  : '';
                return (
                  <option key={code} value={code}>
                    {prefix}{label} ({code})
                  </option>
                );
              })}
            </select>
          </div>
          <SettingSwitchRow
            id="manual-notif-templates-live"
            label={t('manualNotification.alimtalk.liveToggle')}
            checked={templatesLive}
            onCheckedChange={(next) => {
              setTemplatesLive(next);
              setTemplateCode('');
              setTemplateParams({});
            }}
            ariaLabel={t('manualNotification.alimtalk.liveToggle')}
          />
          {selectedTemplate && selectedTemplate.solapiTemplateIdPresent === false && (
            <SettingsNotice tone="warning">
              {t('manualNotification.alimtalk.missingMappingHint')}
            </SettingsNotice>
          )}
          {selectedTemplate && selectedTemplate.content && (
            <div className={`${FORM_CLASS}__template-preview`} aria-live="polite">
              <span className="mg-v2-form-label">
                {t('manualNotification.alimtalk.bodyPreview')}
              </span>
              <pre className={`${FORM_CLASS}__preview-text`}>{selectedTemplate.content}</pre>
            </div>
          )}
          {templateVariableDefs.length > 0 && (
            <div className={`${FORM_CLASS}__variables`}>
              <h4 className="mg-v2-settings-subheading">
                {t('manualNotification.alimtalk.variablesTitle')}
              </h4>
              <div className="mg-v2-settings-form-grid">
                {templateVariableDefs.map((v) => (
                  <div key={v.name} className="mg-v2-settings-field">
                    <label
                      className={`mg-v2-form-label ${FORM_CLASS}__variable-label`}
                      htmlFor={`mg-manual-notif-var-${v.name}`}
                    >
                      {toDisplayString(v.name, '변수')}
                      {v.required && (
                        <StatusBadge variant="danger">
                          {t('manualNotification.alimtalk.variableRequired')}
                        </StatusBadge>
                      )}
                    </label>
                    <input
                      id={`mg-manual-notif-var-${v.name}`}
                      type="text"
                      className="mg-v2-form-input"
                      value={templateParams[v.name] || ''}
                      placeholder={toDisplayString(v.sampleValue, '')}
                      onChange={(e) => setTemplateParams((prev) => ({
                        ...prev,
                        [v.name]: e.target.value
                      }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </SettingsSectionPanel>
      )}

      <SettingsSectionPanel
        ariaLabel={t('manualNotification.reason.label')}
      >
        <div className="mg-v2-settings-field">
          <label
            id="mg-manual-notif-reason-title"
            className="mg-v2-form-label"
            htmlFor="mg-manual-notif-reason"
          >
            {t('manualNotification.reason.label')}
          </label>
          <textarea
            id="mg-manual-notif-reason"
            className="mg-v2-form-textarea"
            rows={3}
            maxLength={MANUAL_NOTIFICATION_REASON_MAX_LENGTH}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('manualNotification.reason.placeholder')}
          />
          <p className="mg-v2-settings-field__hint">
            {t('manualNotification.reason.counter', {
              count: reason.length,
              max: MANUAL_NOTIFICATION_REASON_MAX_LENGTH,
              defaultValue: '{{count}} / {{max}}'
            })}
          </p>
          {reasonShortWarning && (
            <p className={`${FORM_CLASS}__hint ${FORM_CLASS}__hint--warn`} role="note">
              {t('manualNotification.reason.lengthWarning', {
                min: MANUAL_NOTIFICATION_REASON_RECOMMENDED_MIN_LENGTH,
                defaultValue: '사유를 {{min}}자 이상 상세하게 적는 것을 권장합니다.'
              })}
            </p>
          )}
        </div>
      </SettingsSectionPanel>

      {formError && (
        <SettingsNotice tone="danger" role="alert" testId="manual-notif-form-error">
          {toDisplayString(formError, '')}
        </SettingsNotice>
      )}

      <div className="mg-v2-settings-actions">
        <SettingsButton
          type="button"
          variant="primary"
          preventDoubleClick
          loading={previewLoading}
          disabled={!isAllRequiredFilled || previewLoading || submitting || Boolean(jobId)}
          onClick={handleSendClick}
        >
          {previewLoading
            ? t('manualNotification.job.previewing')
            : t('manualNotification.job.preview')}
        </SettingsButton>
      </div>

      <ManualNotificationJobConfirmModal
        isOpen={confirmOpen}
        preview={preview}
        submitting={submitting}
        errorMessage={confirmError}
        setChanged={recipientSetChanged}
        onClose={closeConfirm}
        onConfirm={handleConfirmSend}
        onRecheck={handleRecheck}
      />

      <ManualNotificationJobProgressModal
        isOpen={Boolean(jobId)}
        job={job || createdJob}
        pollError={jobPollError}
        onClose={handleProgressClose}
      />

      <BatchResultModal
        isOpen={resultModalOpen}
        onClose={handleResultClose}
        result={lastResult}
      />
    </article>
  );
};

export default ManualNotificationForm;
