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
  searchRecipients,
  fetchCommonCodeTemplates,
  fetchLiveTemplates,
  sendSmsBatch,
  sendAlimtalkBatch,
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

  const [smsContent, setSmsContent] = useState('');

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

  const isAllRequiredFilled = useMemo(() => {
    if (selectedUsers.length === 0 || selectedUsers.length > MANUAL_NOTIFICATION_MAX_RECIPIENTS) {
      return false;
    }
    if (reasonTrimmedLength === 0 || reason.length > MANUAL_NOTIFICATION_REASON_MAX_LENGTH) {
      return false;
    }
    if (channel === MANUAL_NOTIFICATION_CHANNEL.SMS) {
      const c = smsContent.trim();
      return c.length > 0 && c.length <= MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH;
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
  }, [selectedUsers, reasonTrimmedLength, reason, channel, smsContent, templateCode, templateVariableDefs, templateParams]);

  const buildPayload = useCallback(() => {
    const userIds = selectedUsers
      .map((u) => Number(u.userId))
      .filter((n) => Number.isFinite(n) && n > 0);
    const base = {
      userIds,
      reason: reason.trim()
    };
    if (channel === MANUAL_NOTIFICATION_CHANNEL.SMS) {
      return { ...base, content: smsContent.trim() };
    }
    return {
      ...base,
      templateCode,
      templateSource: templatesLive
        ? MANUAL_NOTIFICATION_TEMPLATE_SOURCE.SOLAPI
        : MANUAL_NOTIFICATION_TEMPLATE_SOURCE.COMMON_CODE,
      templateParams: templateParams || {}
    };
  }, [selectedUsers, reason, channel, smsContent, templateCode, templatesLive, templateParams]);

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
      const response = channel === MANUAL_NOTIFICATION_CHANNEL.SMS
        ? await sendSmsBatch(payload)
        : await sendAlimtalkBatch(payload);

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
        || t(`manualNotification.errors.${code}`, t('manualNotification.errors.sendFailed', '발송에 실패했습니다.'));
      setLastResult({
        batchId: '',
        channel,
        startedAt: '',
        totalCount: selectedUsers.length,
        successCount: 0,
        failureCount: selectedUsers.length,
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
  }, [isAllRequiredFilled, submitting, buildPayload, channel, selectedUsers.length, closeConfirm, onBatchSent, t]);

  const handleSendClick = () => {
    if (!isAllRequiredFilled || submitting) {
      return;
    }
    if (selectedUsers.length <= IMMEDIATE_SEND_THRESHOLD) {
      doSend();
      return;
    }
    setConfirmStep(CONFIRM_STEP.STEP_1);
    setConfirmChecked(false);
  };

  const channelOptions = useMemo(() => [
    { value: MANUAL_NOTIFICATION_CHANNEL.SMS, label: t('manualNotification.channel.sms', 'SMS') },
    { value: MANUAL_NOTIFICATION_CHANNEL.ALIMTALK, label: t('manualNotification.channel.alimtalk', '카카오 알림톡') }
  ], [t]);

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
        <strong>{t('manualNotification.summary.channel', '채널')}:</strong>{' '}
        {channel === MANUAL_NOTIFICATION_CHANNEL.SMS
          ? t('manualNotification.channel.sms', 'SMS')
          : t('manualNotification.channel.alimtalk', '카카오 알림톡')}
      </li>
      <li>
        <strong>{t('manualNotification.summary.recipientCount', '수신자')}:</strong>{' '}
        {t('manualNotification.summary.recipientCountValue', {
          count: selectedUsers.length,
          defaultValue: '{{count}}명'
        })}
      </li>
      {channel === MANUAL_NOTIFICATION_CHANNEL.ALIMTALK && templateCode && (
        <>
          <li>
            <strong>{t('manualNotification.summary.templateCode', '템플릿 코드')}:</strong>{' '}
            {toDisplayString(templateCode, '-')}
          </li>
          <li>
            <strong>{t('manualNotification.summary.templateSource', '템플릿 출처')}:</strong>{' '}
            {templatesLive
              ? MANUAL_NOTIFICATION_TEMPLATE_SOURCE.SOLAPI
              : MANUAL_NOTIFICATION_TEMPLATE_SOURCE.COMMON_CODE}
          </li>
        </>
      )}
      <li>
        <strong>{t('manualNotification.summary.reason', '발송 사유')}:</strong>{' '}
        {toDisplayString(reason, '-')}
      </li>
    </ul>
  );

  return (
    <article className={FORM_CLASS} aria-label={t('manualNotification.page.title', '수동 알림 발송')}>
      <section className={`${FORM_CLASS}__warning`} role="note">
        <p className={`${FORM_CLASS}__warning-text`}>
          {t(
            'manualNotification.page.warningActualSend',
            '이 도구는 실제 사용자에게 발송됩니다. 발송 사유는 감사로그에 영구 기록됩니다.'
          )}
        </p>
        <p className={`${FORM_CLASS}__warning-link-text`}>
          <a
            className={`${FORM_CLASS}__warning-link`}
            href={ADMIN_ROUTES_TEST_NOTIFICATION}
          >
            {t(
              'manualNotification.page.testLinkText',
              '테스트 목적이라면 알림 테스트 발송을 사용하세요.'
            )}
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
          {t('manualNotification.channel.label', '발송 채널')}
        </h3>
        <BadgeSelect
          options={channelOptions}
          value={channel}
          onChange={(val) => setChannel(val)}
          aria-label={t('manualNotification.channel.label', '발송 채널')}
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
          {t('manualNotification.recipient.title', '수신자 선택 (최대 50명)')}
        </h3>
        <RecipientPicker
          value={selectedUsers}
          onChange={setSelectedUsers}
          query={recipientQuery}
          onQueryChange={setRecipientQuery}
          options={recipientOptions}
          loading={recipientLoading}
          maxCount={MANUAL_NOTIFICATION_MAX_RECIPIENTS}
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
      </section>

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
            {t('manualNotification.sms.contentLabel', 'SMS 본문')}
          </label>
          <textarea
            id="mg-manual-notif-sms-content"
            className={`${FORM_CLASS}__textarea`}
            rows={4}
            maxLength={MANUAL_NOTIFICATION_SMS_CONTENT_MAX_LENGTH}
            value={smsContent}
            onChange={(e) => setSmsContent(e.target.value)}
            placeholder={t(
              'manualNotification.sms.contentPlaceholder',
              '전송할 SMS 본문을 입력하세요 (한글 70자 / 영문 160자 권장)'
            )}
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
            {t('manualNotification.alimtalk.templateLabel', '알림톡 템플릿')}
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
                ? t('manualNotification.alimtalk.templatesLoading', '템플릿 로드 중...')
                : t('manualNotification.alimtalk.templatePlaceholder', '템플릿을 선택하세요')}
            </option>
            {templates.map((tpl) => {
              const code = String(tpl.templateCode ?? tpl.code ?? '');
              const label = toDisplayString(tpl.title ?? tpl.name ?? code, code);
              const missingMapping = tpl.solapiTemplateIdPresent === false;
              const prefix = missingMapping
                ? t('manualNotification.alimtalk.missingMappingBadge', '[매핑없음] ')
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
            <span>{t('manualNotification.alimtalk.liveToggle', '솔라피 전체 보기 (실시간 조회)')}</span>
          </label>
          {selectedTemplate && selectedTemplate.solapiTemplateIdPresent === false && (
            <p className={`${FORM_CLASS}__hint ${FORM_CLASS}__hint--warn`} role="note">
              {t(
                'manualNotification.alimtalk.missingMappingHint',
                "선택한 템플릿은 Solapi 실 templateId 매핑이 없어 발송이 차단됩니다. 공통코드 ALIMTALK_BIZ_TEMPLATE_CODE 에 매핑을 추가하거나, 위 '솔라피 전체 보기' 토글로 실제 등록된 templateId 를 선택해 주세요."
              )}
            </p>
          )}
          {selectedTemplate && selectedTemplate.content && (
            <div className={`${FORM_CLASS}__template-preview`} aria-live="polite">
              <span className={`${FORM_CLASS}__preview-label`}>
                {t('manualNotification.alimtalk.bodyPreview', '템플릿 본문')}
              </span>
              <pre className={`${FORM_CLASS}__preview-text`}>{selectedTemplate.content}</pre>
            </div>
          )}
          {templateVariableDefs.length > 0 && (
            <div className={`${FORM_CLASS}__variables`}>
              <h4 className={`${FORM_CLASS}__variables-title`}>
                {t(
                  'manualNotification.alimtalk.variablesTitle',
                  '변수 입력 (모든 수신자에게 동일하게 적용)'
                )}
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
                        {t('manualNotification.alimtalk.variableRequired', '필수')}
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
          {t('manualNotification.reason.label', '발송 사유 (필수)')}
        </label>
        <textarea
          id="mg-manual-notif-reason"
          className={`${FORM_CLASS}__textarea`}
          rows={3}
          maxLength={MANUAL_NOTIFICATION_REASON_MAX_LENGTH}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t(
            'manualNotification.reason.placeholder',
            '발송 사유를 명확히 기재해 주세요 (감사로그에 영구 기록)'
          )}
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
            ? t('manualNotification.submit.sending', '발송 중...')
            : t('manualNotification.submit.send', '발송하기')}
        </MGButton>
      </div>

      <UnifiedModal
        isOpen={confirmStep === CONFIRM_STEP.STEP_1}
        onClose={closeConfirm}
        title={t('manualNotification.submit.confirmStep1Title', '발송 미리보기')}
        subtitle={t(
          'manualNotification.submit.confirmStep1Subtitle',
          "아래 정보를 확인하고 '다음'을 누르면 최종 확인 단계로 이동합니다."
        )}
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
              {t('manualNotification.submit.cancel', '취소')}
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
              {t('manualNotification.submit.confirmStep1Next', '다음')}
            </MGButton>
          </>
        )}
      >
        {renderConfirmSummary()}
      </UnifiedModal>

      <UnifiedModal
        isOpen={confirmStep === CONFIRM_STEP.STEP_2}
        onClose={closeConfirm}
        title={t('manualNotification.submit.confirmStep2Title', '정말 발송하시겠습니까?')}
        subtitle={t(
          'manualNotification.submit.confirmStep2Subtitle',
          '실제 단말로 발송됩니다. 이 작업은 취소할 수 없습니다.'
        )}
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
              {t('manualNotification.submit.cancel', '취소')}
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
              {t('manualNotification.submit.confirmStep2Send', '최종 발송')}
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
            {t(
              'manualNotification.submit.confirmCheckbox',
              '내용을 확인했고, 취소할 수 없음을 이해했습니다.'
            )}
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
