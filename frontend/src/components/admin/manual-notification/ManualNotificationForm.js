/**
 * 어드민 SMS·카카오 알림톡 수동 일괄 발송 폼 (Organism).
 *
 * - 채널: SMS / 알림톡 (`BadgeSelect`)
 * - 수신자: `RecipientPicker` 분자 (50명 상한)
 * - 알림톡: 템플릿 선택(공통코드/라이브 토글) + 변수 입력 + 본문 미리보기
 *   (회귀 방지를 위해 `TestNotificationForm` 의 알림톡 섹션 UX 를 동일 구조로 차용)
 * - 발송 사유: 필수, 30자 미만 권장 warning (hard limit X)
 * - 발송 흐름:
 *    ≤ 5명 → 즉시 API 호출
 *    ≥ 6명 → `UnifiedModal` 2-step (STEP_1 미리보기 → STEP_2 최종 확인 체크박스)
 * - 응답 결과 → `BatchResultModal` 노출, 성공 시 부모 `onBatchSent` 호출하여
 *   `ManualNotificationBatchHistory` 자동 새로고침.
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import BadgeSelect from '../../common/BadgeSelect';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { toDisplayString } from '../../../utils/safeDisplay';
import { normalizeApiListPayload } from '../../../constants/adminWebScaffold';
import {
  MANUAL_NOTIFICATION_CHANNEL,
  MANUAL_NOTIFICATION_TEMPLATE_SOURCE,
  MANUAL_NOTIFICATION_ERROR_CODES,
  MANUAL_NOTIFICATION_MAX_RECIPIENTS,
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
  sendSmsBatch,
  sendAlimtalkBatch,
  sendPushBatch,
  normalizeBulkResponse
} from '../../../api/admin/manualNotificationApi';
import RecipientPicker from './RecipientPicker';
import BatchResultModal from './BatchResultModal';
import './ManualNotificationForm.css';

const FORM_CLASS = 'mg-manual-notif-form';
const RECIPIENT_DEBOUNCE_MS = 300;
const IMMEDIATE_SEND_THRESHOLD = 5;
const ADMIN_ROUTES_TEST_NOTIFICATION = '/admin/test-notification';

/** UnifiedModal 단계 식별자. */
const CONFIRM_STEP = Object.freeze({
  CLOSED: 'closed',
  STEP_1: 'step1',
  STEP_2: 'step2'
});

const ManualNotificationForm = ({ onBatchSent }) => {
  const { t } = useTranslation('admin');

  const [channel, setChannel] = useState(MANUAL_NOTIFICATION_CHANNEL.SMS);

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

  const [confirmStep, setConfirmStep] = useState(CONFIRM_STEP.CLOSED);
  const [confirmChecked, setConfirmChecked] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(async() => {
      setRecipientLoading(true);
      try {
        const raw = await searchRecipients({ query: recipientQuery.trim() });
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
  }, [recipientQuery]);

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
  const totalRecipients = selectedUsers.length
    + (isPhoneModeChannel ? phoneList.length : 0);

  const isAllRequiredFilled = useMemo(() => {
    if (totalRecipients === 0 || totalRecipients > MANUAL_NOTIFICATION_MAX_RECIPIENTS) {
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
  }, [totalRecipients, reasonTrimmedLength, reason, channel, smsContent, pushTitle, pushBody,
    templateCode, templateVariableDefs, templateParams]);

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
    if (selectedUsers.length + phoneList.length >= MANUAL_NOTIFICATION_MAX_RECIPIENTS) {
      setPhoneError(t('manualNotification.phone.limitReached'));
      return;
    }
    setPhoneList((prev) => [...prev, normalized]);
    setPhoneDraft('');
    setPhoneError('');
  }, [phoneDraft, phoneList, selectedUsers.length, t]);

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

  const buildPayload = useCallback(() => {
    const userIds = selectedUsers
      .map((u) => Number(u.userId))
      .filter((n) => Number.isFinite(n) && n > 0);
    // PUSH 채널은 PHONE 모드 미지원 — 백엔드 가드와 일관되도록 payload 에 phoneNumbers 포함 X.
    const includePhones = channel !== MANUAL_NOTIFICATION_CHANNEL.PUSH && phoneList.length > 0;
    const base = {
      userIds,
      reason: reason.trim(),
      ...(includePhones ? { phoneNumbers: phoneList } : {})
    };
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
  }, [selectedUsers, phoneList, reason, channel, smsContent, pushTitle, pushBody, templateCode,
    templatesLive, templateParams]);

  const closeConfirm = useCallback(() => {
    setConfirmStep(CONFIRM_STEP.CLOSED);
    setConfirmChecked(false);
  }, []);

  const doSend = useCallback(async() => {
    if (!isAllRequiredFilled || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      let response;
      if (channel === MANUAL_NOTIFICATION_CHANNEL.SMS) {
        response = await sendSmsBatch(payload);
      } else if (channel === MANUAL_NOTIFICATION_CHANNEL.PUSH) {
        response = await sendPushBatch(payload);
      } else {
        response = await sendAlimtalkBatch(payload);
      }

      const normalized = normalizeBulkResponse(response);
      const success = response?.success !== false;
      setLastResult({
        ...normalized,
        success,
        message: response?.message ?? null
      });
      closeConfirm();
      setResultModalOpen(true);

      const batchBlocked = !success
        || (normalized.batchErrorCode != null && normalized.successCount === 0);
      if (!batchBlocked && typeof onBatchSent === 'function') {
        onBatchSent(normalized);
      }
    } catch (err) {
      console.error('수동 발송 실패:', err);
      const code = err?.code
        ?? err?.response?.data?.errorCode
        ?? MANUAL_NOTIFICATION_ERROR_CODES.SEND_FAILED;
      const message = err?.response?.data?.message
        || err?.message
        || t(`manualNotification.errors.${code}`, t('manualNotification.errors.sendFailed'));
      setLastResult({
        batchId: '',
        channel,
        startedAt: '',
        totalCount: totalRecipients,
        successCount: 0,
        failureCount: totalRecipients,
        batchErrorCode: code,
        batchErrorMessage: message,
        results: [],
        success: false,
        message
      });
      closeConfirm();
      setResultModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  }, [isAllRequiredFilled, submitting, buildPayload, channel, totalRecipients, closeConfirm,
    onBatchSent, t]);

  const handleSendClick = () => {
    if (!isAllRequiredFilled || submitting) {
      return;
    }
    if (totalRecipients <= IMMEDIATE_SEND_THRESHOLD) {
      doSend();
      return;
    }
    setConfirmStep(CONFIRM_STEP.STEP_1);
    setConfirmChecked(false);
  };

  const channelOptions = useMemo(() => [
    { value: MANUAL_NOTIFICATION_CHANNEL.SMS, label: t('manualNotification.channel.sms', 'SMS') },
    { value: MANUAL_NOTIFICATION_CHANNEL.ALIMTALK, label: t('manualNotification.channel.alimtalk') },
    { value: MANUAL_NOTIFICATION_CHANNEL.PUSH, label: t('manualNotification.channel.push') }
  ], [t]);

  const channelLabel = useMemo(() => {
    if (channel === MANUAL_NOTIFICATION_CHANNEL.SMS) {
      return t('manualNotification.channel.sms', 'SMS');
    }
    if (channel === MANUAL_NOTIFICATION_CHANNEL.PUSH) {
      return t('manualNotification.channel.push');
    }
    return t('manualNotification.channel.alimtalk');
  }, [channel, t]);

  const handleLimitExceeded = useCallback(() => {
    setMaxExceededWarning(true);
    window.setTimeout(() => setMaxExceededWarning(false), 4000);
  }, []);

  const handleResultClose = useCallback(() => {
    setResultModalOpen(false);
  }, []);

  const renderConfirmSummary = () => (
    <ul className={`${FORM_CLASS}__summary`}>
      <li>
        <strong>{t('manualNotification.summary.channel')}:</strong>{' '}
        {channelLabel}
      </li>
      <li>
        <strong>{t('manualNotification.summary.recipientCount')}:</strong>{' '}
        {t('manualNotification.summary.recipientCountValue', {
          count: totalRecipients,
          defaultValue: '{{count}}명'
        })}
        {phoneList.length > 0 && (
          <span className={`${FORM_CLASS}__hint`}>
            {' '}
            ({t('manualNotification.summary.recipientCountValue', {
              count: selectedUsers.length,
              defaultValue: '{{count}}명'
            })}
            {' + '}
            {t('manualNotification.phone.summaryRow', {
              count: phoneList.length,
              defaultValue: '전화번호 직접 입력 {{count}}건'
            })})
          </span>
        )}
      </li>
      {phoneList.length > 0 && (
        <li>
          <strong>{t('manualNotification.phone.title')}:</strong>{' '}
          {phoneList.map((p) => maskManualNotificationPhoneForDisplay(p)).join(', ')}
        </li>
      )}
      {channel === MANUAL_NOTIFICATION_CHANNEL.ALIMTALK && templateCode && (
        <>
          <li>
            <strong>{t('manualNotification.summary.templateCode')}:</strong>{' '}
            {toDisplayString(templateCode, '-')}
          </li>
          <li>
            <strong>{t('manualNotification.summary.templateSource')}:</strong>{' '}
            {templatesLive
              ? MANUAL_NOTIFICATION_TEMPLATE_SOURCE.SOLAPI
              : MANUAL_NOTIFICATION_TEMPLATE_SOURCE.COMMON_CODE}
          </li>
        </>
      )}
      <li>
        <strong>{t('manualNotification.summary.reason')}:</strong>{' '}
        {toDisplayString(reason, '-')}
      </li>
    </ul>
  );

  return (
    <article className={FORM_CLASS} aria-label={t('manualNotification.page.title')}>
      <section className={`${FORM_CLASS}__warning`} role="note">
        <p className={`${FORM_CLASS}__warning-text`}>
          {t('manualNotification.page.warningActualSend')}
        </p>
        <p className={`${FORM_CLASS}__warning-link-text`}>
          <a
            className={`${FORM_CLASS}__warning-link`}
            href={ADMIN_ROUTES_TEST_NOTIFICATION}
          >
            {t('manualNotification.page.testLinkText')}
          </a>
        </p>
      </section>

      <section
        className={`${FORM_CLASS}__section`}
        aria-labelledby="mg-manual-notif-channel-title"
      >
        <h3
          id="mg-manual-notif-channel-title"
          className={`${FORM_CLASS}__section-title`}
        >
          {t('manualNotification.channel.label')}
        </h3>
        <BadgeSelect
          options={channelOptions}
          value={channel}
          onChange={(val) => setChannel(val)}
          aria-label={t('manualNotification.channel.label')}
        />
      </section>

      <section
        className={`${FORM_CLASS}__section`}
        aria-labelledby="mg-manual-notif-recipient-title"
      >
        <h3
          id="mg-manual-notif-recipient-title"
          className={`${FORM_CLASS}__section-title`}
        >
          {t('manualNotification.recipient.title')}
        </h3>
        <RecipientPicker
          value={selectedUsers}
          onChange={setSelectedUsers}
          query={recipientQuery}
          onQueryChange={setRecipientQuery}
          options={recipientOptions}
          loading={recipientLoading}
          maxCount={MANUAL_NOTIFICATION_MAX_RECIPIENTS - (isPhoneModeChannel ? phoneList.length : 0)}
          onLimitExceeded={handleLimitExceeded}
        />
        {maxExceededWarning && (
          <p className={`${FORM_CLASS}__inline-error`} role="alert">
            {t('manualNotification.recipient.maxError', {
              max: MANUAL_NOTIFICATION_MAX_RECIPIENTS,
              defaultValue: '최대 {{max}}명까지 선택할 수 있습니다.'
            })}
          </p>
        )}
        {isPhoneModeChannel && (selectedUsers.length > 0 || phoneList.length > 0) && (
          <p className={`${FORM_CLASS}__hint`}>
            {t('manualNotification.recipient.totalCounter', {
              total: totalRecipients,
              max: MANUAL_NOTIFICATION_MAX_RECIPIENTS,
              users: selectedUsers.length,
              phones: phoneList.length,
              defaultValue:
                '총 수신자 {{total}} / {{max}} (등록 {{users}}명 + 전화번호 {{phones}}건)'
            })}
          </p>
        )}
      </section>

      {isPhoneModeChannel && (
        <section
          className={`${FORM_CLASS}__section`}
          aria-labelledby="mg-manual-notif-phone-title"
        >
          <h3
            id="mg-manual-notif-phone-title"
            className={`${FORM_CLASS}__section-title`}
          >
            {t('manualNotification.phone.title')}
          </h3>
          <p className={`${FORM_CLASS}__hint`}>
            {t('manualNotification.phone.hint')}
          </p>
          <div className={`${FORM_CLASS}__phone-input-row`}>
            <input
              id="mg-manual-notif-phone-input"
              type="tel"
              className={`${FORM_CLASS}__input`}
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
            <MGButton
              type="button"
              variant="outline"
              size="small"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'sm',
                loading: false,
                className: `${FORM_CLASS}__phone-add-btn`
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              disabled={
                !phoneDraft.trim()
                  || Boolean(phoneError)
                  || selectedUsers.length + phoneList.length >= MANUAL_NOTIFICATION_MAX_RECIPIENTS
              }
              onClick={addPhone}
            >
              {t('manualNotification.phone.addButton')}
            </MGButton>
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
              <p className={`${FORM_CLASS}__hint`}>
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
        </section>
      )}

      {channel === MANUAL_NOTIFICATION_CHANNEL.PUSH && (
        <p className={`${FORM_CLASS}__hint ${FORM_CLASS}__hint--warn`} role="note">
          {t('manualNotification.phone.pushNotSupported')}
        </p>
      )}

      {channel === MANUAL_NOTIFICATION_CHANNEL.SMS && (
        <section
          className={`${FORM_CLASS}__section`}
          aria-labelledby="mg-manual-notif-sms-title"
        >
          <label
            id="mg-manual-notif-sms-title"
            className={`${FORM_CLASS}__section-title`}
            htmlFor="mg-manual-notif-sms-content"
          >
            {t('manualNotification.sms.contentLabel')}
          </label>
          <textarea
            id="mg-manual-notif-sms-content"
            className={`${FORM_CLASS}__textarea`}
            rows={4}
            maxLength={MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH}
            value={smsContent}
            onChange={(e) => setSmsContent(e.target.value)}
            placeholder={t('manualNotification.sms.contentPlaceholder')}
          />
          <p className={`${FORM_CLASS}__hint`}>
            {t('manualNotification.sms.contentCounter', {
              count: smsContent.length,
              max: MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH,
              defaultValue: '{{count}} / {{max}}'
            })}
          </p>
        </section>
      )}

      {channel === MANUAL_NOTIFICATION_CHANNEL.PUSH && (
        <section
          className={`${FORM_CLASS}__section`}
          aria-labelledby="mg-manual-notif-push-title-label"
        >
          <p className={`${FORM_CLASS}__hint`} role="note">
            {t('manualNotification.push.warning')}
          </p>
          <label
            id="mg-manual-notif-push-title-label"
            className={`${FORM_CLASS}__section-title`}
            htmlFor="mg-manual-notif-push-title"
          >
            {t('manualNotification.push.titleLabel')}
          </label>
          <input
            id="mg-manual-notif-push-title"
            type="text"
            className={`${FORM_CLASS}__input`}
            maxLength={MANUAL_NOTIFICATION_PUSH_TITLE_MAX_LENGTH}
            value={pushTitle}
            onChange={(e) => setPushTitle(e.target.value)}
            placeholder={t('manualNotification.push.titlePlaceholder')}
          />
          <p className={`${FORM_CLASS}__hint`}>
            {t('manualNotification.push.titleCounter', {
              count: pushTitle.length,
              max: MANUAL_NOTIFICATION_PUSH_TITLE_MAX_LENGTH,
              defaultValue: '{{count}} / {{max}}'
            })}
          </p>
          <label
            id="mg-manual-notif-push-body-label"
            className={`${FORM_CLASS}__section-title`}
            htmlFor="mg-manual-notif-push-body"
          >
            {t('manualNotification.push.bodyLabel')}
          </label>
          <textarea
            id="mg-manual-notif-push-body"
            className={`${FORM_CLASS}__textarea`}
            rows={5}
            maxLength={MANUAL_NOTIFICATION_PUSH_BODY_MAX_LENGTH}
            value={pushBody}
            onChange={(e) => setPushBody(e.target.value)}
            placeholder={t('manualNotification.push.bodyPlaceholder')}
          />
          <p className={`${FORM_CLASS}__hint`}>
            {t('manualNotification.push.bodyCounter', {
              count: pushBody.length,
              max: MANUAL_NOTIFICATION_PUSH_BODY_MAX_LENGTH,
              defaultValue: '{{count}} / {{max}}'
            })}
          </p>
        </section>
      )}

      {channel === MANUAL_NOTIFICATION_CHANNEL.ALIMTALK && (
        <section
          className={`${FORM_CLASS}__section`}
          aria-labelledby="mg-manual-notif-alimtalk-title"
        >
          <label
            id="mg-manual-notif-alimtalk-title"
            className={`${FORM_CLASS}__section-title`}
            htmlFor="mg-manual-notif-template"
          >
            {t('manualNotification.alimtalk.templateLabel')}
          </label>
          <select
            id="mg-manual-notif-template"
            className={`${FORM_CLASS}__select`}
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
          <label className={`${FORM_CLASS}__toggle`}>
            <input
              type="checkbox"
              checked={templatesLive}
              onChange={(e) => {
                setTemplatesLive(e.target.checked);
                setTemplateCode('');
                setTemplateParams({});
              }}
            />
            <span>{t('manualNotification.alimtalk.liveToggle')}</span>
          </label>
          {selectedTemplate && selectedTemplate.solapiTemplateIdPresent === false && (
            <p className={`${FORM_CLASS}__hint ${FORM_CLASS}__hint--warn`} role="note">
              {t('manualNotification.alimtalk.missingMappingHint')}
            </p>
          )}
          {selectedTemplate && selectedTemplate.content && (
            <div className={`${FORM_CLASS}__template-preview`} aria-live="polite">
              <span className={`${FORM_CLASS}__preview-label`}>
                {t('manualNotification.alimtalk.bodyPreview')}
              </span>
              <pre className={`${FORM_CLASS}__preview-text`}>{selectedTemplate.content}</pre>
            </div>
          )}
          {templateVariableDefs.length > 0 && (
            <div className={`${FORM_CLASS}__variables`}>
              <h4 className={`${FORM_CLASS}__variables-title`}>
                {t('manualNotification.alimtalk.variablesTitle')}
              </h4>
              {templateVariableDefs.map((v) => (
                <div key={v.name} className={`${FORM_CLASS}__variable-row`}>
                  <label
                    className={`${FORM_CLASS}__variable-label`}
                    htmlFor={`mg-manual-notif-var-${v.name}`}
                  >
                    {toDisplayString(v.name, '변수')}
                    {v.required && (
                      <span className={`${FORM_CLASS}__badge ${FORM_CLASS}__badge--required`}>
                        {t('manualNotification.alimtalk.variableRequired')}
                      </span>
                    )}
                  </label>
                  <input
                    id={`mg-manual-notif-var-${v.name}`}
                    type="text"
                    className={`${FORM_CLASS}__input`}
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
          )}
        </section>
      )}

      <section
        className={`${FORM_CLASS}__section`}
        aria-labelledby="mg-manual-notif-reason-title"
      >
        <label
          id="mg-manual-notif-reason-title"
          className={`${FORM_CLASS}__section-title`}
          htmlFor="mg-manual-notif-reason"
        >
          {t('manualNotification.reason.label')}
        </label>
        <textarea
          id="mg-manual-notif-reason"
          className={`${FORM_CLASS}__textarea`}
          rows={3}
          maxLength={MANUAL_NOTIFICATION_REASON_MAX_LENGTH}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('manualNotification.reason.placeholder')}
        />
        <p className={`${FORM_CLASS}__hint`}>
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
      </section>

      <div className={`${FORM_CLASS}__submit`}>
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'md',
            loading: submitting,
            className: `${FORM_CLASS}__submit-btn`
          })}
          loading={submitting}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          disabled={!isAllRequiredFilled || submitting}
          onClick={handleSendClick}
        >
          {submitting
            ? t('manualNotification.submit.sending')
            : t('manualNotification.submit.send')}
        </MGButton>
      </div>

      <UnifiedModal
        isOpen={confirmStep === CONFIRM_STEP.STEP_1}
        onClose={closeConfirm}
        title={t('manualNotification.submit.confirmStep1Title')}
        subtitle={t('manualNotification.submit.confirmStep1Subtitle')}
        size="medium"
        actions={(
          <>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={closeConfirm}
            >
              {t('manualNotification.submit.cancel')}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => {
                setConfirmStep(CONFIRM_STEP.STEP_2);
                setConfirmChecked(false);
              }}
            >
              {t('manualNotification.submit.confirmStep1Next')}
            </MGButton>
          </>
        )}
      >
        {renderConfirmSummary()}
      </UnifiedModal>

      <UnifiedModal
        isOpen={confirmStep === CONFIRM_STEP.STEP_2}
        onClose={closeConfirm}
        title={t('manualNotification.submit.confirmStep2Title')}
        subtitle={t('manualNotification.submit.confirmStep2Subtitle')}
        size="small"
        variant="confirm"
        loading={submitting}
        actions={(
          <>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({
                variant: 'outline',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={closeConfirm}
              disabled={submitting}
            >
              {t('manualNotification.submit.cancel')}
            </MGButton>
            <MGButton
              type="button"
              variant="danger"
              className={buildErpMgButtonClassName({
                variant: 'danger',
                size: 'md',
                loading: submitting
              })}
              loading={submitting}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              disabled={!confirmChecked || submitting}
              onClick={doSend}
            >
              {t('manualNotification.submit.confirmStep2Send')}
            </MGButton>
          </>
        )}
      >
        {renderConfirmSummary()}
        <label className={`${FORM_CLASS}__confirm-checkbox`}>
          <input
            type="checkbox"
            checked={confirmChecked}
            onChange={(e) => setConfirmChecked(e.target.checked)}
            disabled={submitting}
          />
          <span>
            {t('manualNotification.submit.confirmCheckbox')}
          </span>
        </label>
      </UnifiedModal>

      <BatchResultModal
        isOpen={resultModalOpen}
        onClose={handleResultClose}
        result={lastResult}
      />
    </article>
  );
};

export default ManualNotificationForm;
