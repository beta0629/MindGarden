/**
 * 어드민 SMS·카카오 알림톡 테스트 발송 폼 (Organism).
 *
 * - 수신자: SELF / DB 사용자 (임의 번호 입력 모드 미구현, C3 컨펌)
 * - 채널: SMS / 알림톡 탭 (C4: 코드 enum + 솔라피 전체 보기 토글)
 * - rate-limit 잔여 카운터: 분당 N/10 · 일당 M/100 (C5)
 * - prod 한정 2-step UnifiedModal (C7) — process.env.REACT_APP_ENV === 'production'
 *
 * 참조: docs/project-management/2026-05-22/ADMIN_TEST_NOTIFICATION_DESIGN_HANDOFF.md
 *
 * @author MindGarden
 * @since 2026-05-22
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import MGButton from '../../common/MGButton';
import BadgeSelect from '../../common/BadgeSelect';
import UnifiedModal from '../../common/modals/UnifiedModal';
import { toDisplayString } from '../../../utils/safeDisplay';
import {
  getRecipients,
  getAlimtalkTemplates,
  getAlimtalkTemplatesLive,
  sendTestSms,
  sendTestAlimtalk
} from '../../../api/admin/testNotificationApi';
import { normalizeApiListPayload } from '../../../constants/adminWebScaffold';
import './TestNotificationForm.css';

const RECIPIENT_MODE = Object.freeze({ SELF: 'SELF', USER: 'USER' });
const CHANNEL = Object.freeze({ SMS: 'SMS', ALIMTALK: 'ALIMTALK' });
const TEMPLATE_SOURCE = Object.freeze({ COMMON_CODE: 'COMMON_CODE', SOLAPI: 'SOLAPI' });
const MODAL_STEP = Object.freeze({
  IDLE: 'idle',
  CONFIRM: 'confirm',
  FINAL_CONFIRM: 'final-confirm',
  RESULT_SUCCESS: 'result-success',
  RESULT_FAIL: 'result-fail'
});

const SMS_LIMIT_KO = 70;
const SMS_LIMIT_EN = 160;
const REASON_MAX_LENGTH = 500;
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_PER_DAY = 100;
const MINUTE_REPLENISH_MS = 60 * 1000;
const RECIPIENT_DEBOUNCE_MS = 300;

const SOLAPI_CONSOLE_URL_BASE = 'https://console.solapi.com/message-log';

const IS_PRODUCTION = process.env.REACT_APP_ENV === 'production';

/**
 * 한글 문자가 포함되어 있는지 판별.
 * @param {string} text
 * @returns {boolean}
 */
const containsKorean = (text) => /[\u3131-\uD79D]/.test(String(text || ''));

const TestNotificationForm = ({ onSentSuccess }) => {
  const { t } = useTranslation('admin');

  const [recipientMode, setRecipientMode] = useState(RECIPIENT_MODE.SELF);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [channel, setChannel] = useState(CHANNEL.SMS);
  const [smsMessage, setSmsMessage] = useState('');

  const [templatesLive, setTemplatesLive] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateCode, setTemplateCode] = useState('');
  const [templateParams, setTemplateParams] = useState({});

  const [reason, setReason] = useState('');

  const [counters, setCounters] = useState({
    minuteRemaining: RATE_LIMIT_PER_MINUTE,
    dayRemaining: RATE_LIMIT_PER_DAY
  });

  const [modalStep, setModalStep] = useState(MODAL_STEP.IDLE);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(async() => {
      if (recipientMode !== RECIPIENT_MODE.USER) {
        return;
      }
      setRecipientLoading(true);
      try {
        const raw = await getRecipients({
          search: recipientSearch,
          hasPhone: true
        });
        if (cancelled) {
          return;
        }
        setRecipients(normalizeApiListPayload(raw));
      } catch (err) {
        if (!cancelled) {
          console.error('수신자 검색 실패:', err);
          setRecipients([]);
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
  }, [recipientMode, recipientSearch]);

  useEffect(() => {
    let cancelled = false;
    const loadTemplates = async() => {
      if (channel !== CHANNEL.ALIMTALK) {
        return;
      }
      setTemplatesLoading(true);
      try {
        const raw = templatesLive
          ? await getAlimtalkTemplatesLive()
          : await getAlimtalkTemplates();
        if (cancelled) {
          return;
        }
        setTemplates(normalizeApiListPayload(raw));
      } catch (err) {
        if (!cancelled) {
          console.error('알림톡 템플릿 로드 실패:', err);
          setTemplates([]);
        }
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false);
        }
      }
    };
    loadTemplates();
    return () => { cancelled = true; };
  }, [channel, templatesLive]);

  const recipientOptions = useMemo(() => recipients.map((u) => ({
    value: String(u.userId ?? u.id ?? ''),
    label: `${toDisplayString(u.name, '이름 없음')} · ${toDisplayString(u.role, '역할 미지정')} · ${toDisplayString(u.phoneMasked, '번호 없음')}`
  })), [recipients]);

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

  const smsCounter = useMemo(() => {
    const isKo = containsKorean(smsMessage);
    const limit = isKo ? SMS_LIMIT_KO : SMS_LIMIT_EN;
    return {
      count: smsMessage.length,
      limit,
      label: isKo ? '한글' : '영문',
      warning: smsMessage.length > limit
    };
  }, [smsMessage]);

  const isAllRequiredFilled = useMemo(() => {
    if (!reason.trim() || reason.length > REASON_MAX_LENGTH) {
      return false;
    }
    if (recipientMode === RECIPIENT_MODE.USER && !selectedUserId) {
      return false;
    }
    if (counters.minuteRemaining <= 0 || counters.dayRemaining <= 0) {
      return false;
    }
    if (channel === CHANNEL.SMS) {
      return smsMessage.trim().length > 0;
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
  }, [reason, recipientMode, selectedUserId, counters, channel, smsMessage, templateCode, templateVariableDefs, templateParams]);

  const buildPayload = useCallback(() => {
    const base = {
      recipientMode,
      userId: recipientMode === RECIPIENT_MODE.USER && selectedUserId
        ? Number(selectedUserId)
        : null,
      reason: reason.trim()
    };
    if (channel === CHANNEL.SMS) {
      return { ...base, message: smsMessage.trim() };
    }
    return {
      ...base,
      templateCode,
      templateParams,
      fallbackToSms: false,
      templateSource: templatesLive ? TEMPLATE_SOURCE.SOLAPI : TEMPLATE_SOURCE.COMMON_CODE
    };
  }, [recipientMode, selectedUserId, reason, channel, smsMessage, templateCode, templateParams, templatesLive]);

  const doSend = useCallback(async() => {
    setSubmitting(true);
    setErrorMessage('');
    try {
      const payload = buildPayload();
      const response = channel === CHANNEL.SMS
        ? await sendTestSms(payload)
        : await sendTestAlimtalk(payload);
      const wrapped = response?.data ?? response ?? {};
      const success = wrapped.success !== false && response?.success !== false;
      setLastResult({
        success,
        groupId: wrapped.groupId ?? '',
        messageId: wrapped.messageId ?? '',
        errorCode: wrapped.errorCode ?? '',
        errorMessage: wrapped.errorMessage ?? wrapped.error ?? '',
        sentAt: wrapped.sentAt ?? new Date().toISOString()
      });
      if (typeof wrapped.minuteRemaining === 'number' || typeof wrapped.dayRemaining === 'number') {
        setCounters((prev) => ({
          minuteRemaining: typeof wrapped.minuteRemaining === 'number'
            ? wrapped.minuteRemaining
            : Math.max(0, prev.minuteRemaining - 1),
          dayRemaining: typeof wrapped.dayRemaining === 'number'
            ? wrapped.dayRemaining
            : Math.max(0, prev.dayRemaining - 1)
        }));
      } else {
        setCounters((prev) => ({
          minuteRemaining: Math.max(0, prev.minuteRemaining - 1),
          dayRemaining: Math.max(0, prev.dayRemaining - 1)
        }));
      }
      setModalStep(success ? MODAL_STEP.RESULT_SUCCESS : MODAL_STEP.RESULT_FAIL);
      if (success && typeof onSentSuccess === 'function') {
        onSentSuccess();
      }
    } catch (err) {
      console.error('테스트 발송 실패:', err);
      const message = err?.response?.data?.message || err?.message || t('testNotification.errors.sendFailed', '발송에 실패했습니다.');
      setErrorMessage(message);
      setLastResult({
        success: false,
        errorCode: err?.response?.status ? String(err.response.status) : 'NETWORK',
        errorMessage: message
      });
      setModalStep(MODAL_STEP.RESULT_FAIL);
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload, channel, onSentSuccess, t]);

  useEffect(() => {
    if (counters.minuteRemaining >= RATE_LIMIT_PER_MINUTE) {
      return undefined;
    }
    const handle = window.setTimeout(() => {
      setCounters((prev) => ({
        ...prev,
        minuteRemaining: Math.min(RATE_LIMIT_PER_MINUTE, prev.minuteRemaining + 1)
      }));
    }, MINUTE_REPLENISH_MS);
    return () => window.clearTimeout(handle);
  }, [counters.minuteRemaining]);

  const handleSendClick = () => {
    if (!isAllRequiredFilled || submitting) {
      return;
    }
    if (IS_PRODUCTION) {
      setModalStep(MODAL_STEP.CONFIRM);
      return;
    }
    doSend();
  };

  const closeModals = () => {
    setModalStep(MODAL_STEP.IDLE);
    setErrorMessage('');
  };

  const renderRecipientSection = () => (
    <section className="mg-test-notif-form__section" aria-labelledby="mg-test-notif-recipient-title">
      <h3 id="mg-test-notif-recipient-title" className="mg-test-notif-form__section-title">
        {t('testNotification.recipient.title', '수신자')}
      </h3>
      <BadgeSelect
        options={[
          { value: RECIPIENT_MODE.SELF, label: t('testNotification.recipient.self', '본인(SELF)') },
          { value: RECIPIENT_MODE.USER, label: t('testNotification.recipient.user', 'DB 사용자') }
        ]}
        value={recipientMode}
        onChange={(val) => {
          setRecipientMode(val);
          if (val === RECIPIENT_MODE.SELF) {
            setSelectedUserId('');
          }
        }}
        aria-label={t('testNotification.recipient.title', '수신자')}
      />
      {recipientMode === RECIPIENT_MODE.USER && (
        <div className="mg-test-notif-form__user-picker">
          <input
            type="text"
            className="mg-test-notif-form__input"
            value={recipientSearch}
            onChange={(e) => setRecipientSearch(e.target.value)}
            placeholder={t('testNotification.recipient.searchPlaceholder', '이름·이메일·역할 검색')}
            aria-label={t('testNotification.recipient.searchPlaceholder', '이름·이메일·역할 검색')}
          />
          <BadgeSelect
            options={recipientOptions}
            value={selectedUserId}
            onChange={(val) => setSelectedUserId(val)}
            loading={recipientLoading}
            placeholder={recipientOptions.length === 0
              ? t('testNotification.recipient.empty', '검색 결과가 없습니다.')
              : t('testNotification.recipient.searchPlaceholder', '이름·이메일·역할 검색')}
            aria-label={t('testNotification.recipient.user', 'DB 사용자')}
          />
        </div>
      )}
    </section>
  );

  const renderChannelSection = () => (
    <section className="mg-test-notif-form__section" aria-labelledby="mg-test-notif-channel-title">
      <h3 id="mg-test-notif-channel-title" className="mg-test-notif-form__section-title">
        {t('testNotification.channel.title', '채널')}
      </h3>
      <BadgeSelect
        options={[
          { value: CHANNEL.SMS, label: t('testNotification.channel.sms', 'SMS') },
          { value: CHANNEL.ALIMTALK, label: t('testNotification.channel.alimtalk', '카카오 알림톡') }
        ]}
        value={channel}
        onChange={(val) => setChannel(val)}
        aria-label={t('testNotification.channel.title', '채널')}
      />
      {channel === CHANNEL.SMS ? renderSmsBody() : renderAlimtalkBody()}
    </section>
  );

  const renderSmsBody = () => (
    <div className="mg-test-notif-form__sms-body">
      <label className="mg-test-notif-form__label" htmlFor="mg-test-notif-sms">
        {t('testNotification.sms.messageLabel', '메시지 본문')}
      </label>
      <textarea
        id="mg-test-notif-sms"
        className="mg-test-notif-form__textarea"
        rows={4}
        value={smsMessage}
        onChange={(e) => setSmsMessage(e.target.value)}
        placeholder={t('testNotification.sms.messagePlaceholder', '전송할 SMS 본문을 입력하세요 (한글 70자 / 영문 160자 권장)')}
      />
      <p className={`mg-test-notif-form__counter${smsCounter.warning ? ' mg-test-notif-form__counter--warn' : ''}`}>
        {t('testNotification.sms.counter', {
          count: smsCounter.count,
          limit: smsCounter.limit,
          label: smsCounter.label,
          defaultValue: '글자수: {{count}} / {{limit}} ({{label}})'
        })}
      </p>
    </div>
  );

  const renderAlimtalkBody = () => (
    <div className="mg-test-notif-form__alimtalk-body">
      <label className="mg-test-notif-form__label" htmlFor="mg-test-notif-template">
        {t('testNotification.alimtalk.templateLabel', '알림톡 템플릿')}
      </label>
      <select
        id="mg-test-notif-template"
        className="mg-test-notif-form__select"
        value={templateCode}
        onChange={(e) => {
          setTemplateCode(e.target.value);
          setTemplateParams({});
        }}
      >
        <option value="">
          {templatesLoading
            ? t('testNotification.alimtalk.templatesLoading', '템플릿 로드 중...')
            : t('testNotification.alimtalk.templatePlaceholder', '템플릿을 선택하세요')}
        </option>
        {templates.map((tpl) => {
          const code = String(tpl.templateCode ?? tpl.code ?? '');
          const label = toDisplayString(tpl.title ?? tpl.name ?? code, code);
          // 공통코드 출처에서 ALIMTALK_BIZ_TEMPLATE_CODE 매핑이 없으면 [매핑없음] 뱃지로 안내.
          // 라이브 출처(SOLAPI) 옵션은 항상 매핑 있음. 백엔드가 차단하므로 UI는 안내만.
          const missingMapping = tpl.solapiTemplateIdPresent === false;
          const prefix = missingMapping
            ? t('testNotification.alimtalk.missingMappingBadge', '[매핑없음] ')
            : '';
          return (
            <option key={code} value={code}>
              {prefix}{label} ({code})
            </option>
          );
        })}
      </select>
      <label className="mg-test-notif-form__toggle">
        <input
          type="checkbox"
          checked={templatesLive}
          onChange={(e) => {
            setTemplatesLive(e.target.checked);
            setTemplateCode('');
            setTemplateParams({});
          }}
        />
        <span>{t('testNotification.alimtalk.liveToggle', '솔라피 전체 보기 (실시간 조회)')}</span>
      </label>
      {selectedTemplate && selectedTemplate.solapiTemplateIdPresent === false && (
        <p className="mg-test-notif-form__hint mg-test-notif-form__hint--warn">
          {t(
            'testNotification.alimtalk.missingMappingHint',
            '선택한 템플릿은 Solapi 실 templateId 매핑이 없어 발송이 차단됩니다. 공통코드 ALIMTALK_BIZ_TEMPLATE_CODE 에 매핑을 추가하거나, 위 "솔라피 전체 보기" 토글로 실제 등록된 templateId 를 선택해 주세요.'
          )}
        </p>
      )}
      {templateVariableDefs.length > 0 && (
        <div className="mg-test-notif-form__variables">
          <h4 className="mg-test-notif-form__variables-title">
            {t('testNotification.alimtalk.variablesTitle', '변수 입력')}
          </h4>
          {templateVariableDefs.map((v) => (
            <div key={v.name} className="mg-test-notif-form__variable-row">
              <label className="mg-test-notif-form__variable-label" htmlFor={`mg-test-notif-var-${v.name}`}>
                {toDisplayString(v.name, '변수')}
                {v.required && (
                  <span className="mg-test-notif-form__badge mg-test-notif-form__badge--required">
                    {t('testNotification.alimtalk.variableRequired', '필수')}
                  </span>
                )}
              </label>
              <input
                id={`mg-test-notif-var-${v.name}`}
                type="text"
                className="mg-test-notif-form__input"
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
    </div>
  );

  const renderReasonSection = () => (
    <section className="mg-test-notif-form__section" aria-labelledby="mg-test-notif-reason-title">
      <label
        id="mg-test-notif-reason-title"
        className="mg-test-notif-form__section-title"
        htmlFor="mg-test-notif-reason"
      >
        {t('testNotification.reason.label', '발송 사유 (감사로그 기록, 필수)')}
      </label>
      <textarea
        id="mg-test-notif-reason"
        className="mg-test-notif-form__textarea"
        rows={3}
        maxLength={REASON_MAX_LENGTH}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={t('testNotification.reason.placeholder', '예: 사용자 #123 매핑 확정 알림 변수 매칭 검증')}
      />
      <p className="mg-test-notif-form__hint">
        {reason.length} / {REASON_MAX_LENGTH}
      </p>
    </section>
  );

  const renderRateLimit = () => (
    <p className={`mg-test-notif-form__rate${counters.minuteRemaining <= 0 || counters.dayRemaining <= 0 ? ' mg-test-notif-form__rate--exhausted' : ''}`}>
      <span className="mg-test-notif-form__rate-label">{t('testNotification.rateLimit.title', '잔여 한도')}</span>
      <span className="mg-test-notif-form__rate-value">
        {t('testNotification.rateLimit.perMinute', {
          remaining: counters.minuteRemaining,
          limit: RATE_LIMIT_PER_MINUTE,
          defaultValue: '분당 {{remaining}} / {{limit}}'
        })}
        {' | '}
        {t('testNotification.rateLimit.perDay', {
          remaining: counters.dayRemaining,
          limit: RATE_LIMIT_PER_DAY,
          defaultValue: '일당 {{remaining}} / {{limit}}'
        })}
      </span>
    </p>
  );

  const renderConfirmSummary = () => (
    <ul className="mg-test-notif-form__summary">
      <li>
        <strong>{t('testNotification.recipient.title', '수신자')}: </strong>
        {recipientMode === RECIPIENT_MODE.SELF
          ? t('testNotification.recipient.self', '본인(SELF)')
          : `${t('testNotification.recipient.user', 'DB 사용자')} (#${selectedUserId})`}
      </li>
      <li>
        <strong>{t('testNotification.channel.title', '채널')}: </strong>
        {channel === CHANNEL.SMS
          ? t('testNotification.channel.sms', 'SMS')
          : `${t('testNotification.channel.alimtalk', '카카오 알림톡')} (${templateCode})`}
      </li>
      <li>
        <strong>{t('testNotification.reason.label', '발송 사유 (감사로그 기록, 필수)')}: </strong>
        {reason}
      </li>
    </ul>
  );

  const renderResultBody = (success) => {
    if (!lastResult) {
      return null;
    }
    if (success) {
      const consoleUrl = lastResult.groupId
        ? `${SOLAPI_CONSOLE_URL_BASE}/group/${encodeURIComponent(lastResult.groupId)}`
        : SOLAPI_CONSOLE_URL_BASE;
      return (
        <div className="mg-test-notif-form__result mg-test-notif-form__result--success">
          <p><strong>{t('testNotification.result.groupId', 'groupId')}: </strong>{toDisplayString(lastResult.groupId, '-')}</p>
          <p><strong>{t('testNotification.result.messageId', 'messageId')}: </strong>{toDisplayString(lastResult.messageId, '-')}</p>
          <a
            className="mg-test-notif-form__console-link"
            href={consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('testNotification.result.openConsole', '솔라피 콘솔에서 보기')}
          </a>
        </div>
      );
    }
    return (
      <div className="mg-test-notif-form__result mg-test-notif-form__result--fail">
        <p><strong>{t('testNotification.result.errorCode', '에러코드')}: </strong>{toDisplayString(lastResult.errorCode, '-')}</p>
        <p><strong>{t('testNotification.result.errorMessage', '메시지')}: </strong>{toDisplayString(lastResult.errorMessage || errorMessage, '-')}</p>
      </div>
    );
  };

  return (
    <article className="mg-test-notif-form" aria-label={t('testNotification.panel.title', '알림 테스트 발송')}>
      {renderRecipientSection()}
      {renderChannelSection()}
      {renderReasonSection()}
      {renderRateLimit()}
      <div className="mg-test-notif-form__submit">
        <MGButton
          type="button"
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({
            variant: 'primary',
            size: 'md',
            loading: submitting,
            className: 'mg-test-notif-form__submit-btn'
          })}
          loading={submitting}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          disabled={!isAllRequiredFilled || submitting}
          onClick={handleSendClick}
        >
          {submitting
            ? t('testNotification.submit.sending', '발송 중...')
            : t('testNotification.submit.send', '발송하기')}
        </MGButton>
      </div>

      {/* prod 2-step: 1단계 정보 확인 */}
      <UnifiedModal
        isOpen={modalStep === MODAL_STEP.CONFIRM}
        onClose={closeModals}
        title={t('testNotification.submit.confirmTitle', '발송 정보 확인')}
        subtitle={t('testNotification.submit.confirmSubtitle', '다음 정보로 실제 사용자에게 발송됩니다.')}
        size="medium"
        actions={(
          <>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={closeModals}
            >
              {t('testNotification.result.close', '닫기')}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => setModalStep(MODAL_STEP.FINAL_CONFIRM)}
            >
              {t('testNotification.submit.confirmNext', '다음')}
            </MGButton>
          </>
        )}
      >
        {renderConfirmSummary()}
      </UnifiedModal>

      {/* prod 2-step: 2단계 정말 발송 */}
      <UnifiedModal
        isOpen={modalStep === MODAL_STEP.FINAL_CONFIRM}
        onClose={closeModals}
        title={t('testNotification.submit.finalConfirmTitle', '정말 발송하시겠습니까?')}
        subtitle={t('testNotification.submit.finalConfirmSubtitle', '실제 단말로 SMS·알림톡이 전송됩니다. 이 작업은 되돌릴 수 없습니다.')}
        size="small"
        variant="confirm"
        loading={submitting}
        actions={(
          <>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={closeModals}
            >
              {t('testNotification.result.close', '닫기')}
            </MGButton>
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: submitting })}
              loading={submitting}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={doSend}
            >
              {t('testNotification.submit.finalConfirmSend', '최종 발송')}
            </MGButton>
          </>
        )}
      >
        {renderConfirmSummary()}
      </UnifiedModal>

      {/* 결과 모달 — 성공 */}
      <UnifiedModal
        isOpen={modalStep === MODAL_STEP.RESULT_SUCCESS}
        onClose={closeModals}
        title={t('testNotification.result.successTitle', '발송 성공')}
        subtitle={t('testNotification.result.successSubtitle', '솔라피 응답을 확인하세요.')}
        size="small"
        variant="alert"
        actions={(
          <MGButton
            type="button"
            variant="primary"
            className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={closeModals}
          >
            {t('testNotification.result.close', '닫기')}
          </MGButton>
        )}
      >
        {renderResultBody(true)}
      </UnifiedModal>

      {/* 결과 모달 — 실패 */}
      <UnifiedModal
        isOpen={modalStep === MODAL_STEP.RESULT_FAIL}
        onClose={closeModals}
        title={t('testNotification.result.failTitle', '발송 실패')}
        subtitle={t('testNotification.result.failSubtitle', '에러를 확인하고 재시도하세요.')}
        size="small"
        variant="alert"
        actions={(
          <>
            <MGButton
              type="button"
              variant="outline"
              className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={closeModals}
            >
              {t('testNotification.result.close', '닫기')}
            </MGButton>
            <MGButton
              type="button"
              variant="danger"
              className={buildErpMgButtonClassName({ variant: 'danger', size: 'md', loading: submitting })}
              loading={submitting}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => {
                setModalStep(MODAL_STEP.IDLE);
                doSend();
              }}
            >
              {t('testNotification.result.retry', '재시도')}
            </MGButton>
          </>
        )}
      >
        {renderResultBody(false)}
      </UnifiedModal>
    </article>
  );
};

export default TestNotificationForm;
