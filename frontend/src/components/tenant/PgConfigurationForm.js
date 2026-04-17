import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ICONS } from '../../constants/icons';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import SafeText from '../common/SafeText';
import { showNotification } from '../../utils/notification';
import { testPgConnection } from '../../utils/pgApi';
import { toDisplayString } from '../../utils/safeDisplay';
import {
  PG_PROVIDER_IAMPORT,
  PG_PROVIDER_IAMPORT_DISPLAY_LABEL,
  PORTONE_SETTINGS_KEY_WEBHOOK_SECRET,
  PORTONE_V2_NOTICE_LINE,
  PORTONE_V2_WEBHOOK_CONTENT_TYPE,
  PORTONE_V2_WEBHOOK_VERSION,
  getPortOneV2WebhookDisplayUrl
} from '../../constants/portonePgConfiguration';
import {
  KICC_DOCS_AI_GUIDE_URL,
  KICC_DOCS_LLM_INDEX_URL,
  KICC_DOCS_ONLINE_PAYMENT_BASE,
  KICC_SETTINGS_KEY_EASYPAY_HOST_PROD,
  KICC_SETTINGS_KEY_EASYPAY_HOST_TEST,
  PG_PROVIDER_KICC
} from '../../constants/kiccPgConfiguration';
import './PgConfigurationForm.css';

const CreditCardIcon = ICONS.CREDIT_CARD;
const AlertCircleIcon = ICONS.ALERT_CIRCLE;
const InfoIcon = ICONS.INFO;

/**
 * settings_json 에서 portoneWebhookSecret 분리
 *
 * @param {string|null|undefined} settingsJson
 * @returns {{ webhookSecret: string, rest: Object }}
 */
const parsePortoneSettingsJson = (settingsJson) => {
  if (!settingsJson || !String(settingsJson).trim()) {
    return { webhookSecret: '', rest: {} };
  }
  try {
    const obj = JSON.parse(String(settingsJson));
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return { webhookSecret: '', rest: {} };
    }
    const webhookSecret = Object.prototype.hasOwnProperty.call(obj, PORTONE_SETTINGS_KEY_WEBHOOK_SECRET)
      ? String(obj[PORTONE_SETTINGS_KEY_WEBHOOK_SECRET] ?? '')
      : '';
    const rest = { ...obj };
    delete rest[PORTONE_SETTINGS_KEY_WEBHOOK_SECRET];
    return { webhookSecret, rest };
  } catch {
    return { webhookSecret: '', rest: {} };
  }
};

/**
 * portoneWebhookSecret + 나머지 키 병합 후 JSON 문자열
 *
 * @param {string} webhookSecretInput
 * @param {Object} rest
 * @returns {string|null}
 */
const buildSettingsJsonFromPortoneFields = (webhookSecretInput, rest) => {
  const trimmed = webhookSecretInput != null ? String(webhookSecretInput).trim() : '';
  const obj = { ...rest };
  if (trimmed !== '') {
    obj[PORTONE_SETTINGS_KEY_WEBHOOK_SECRET] = trimmed;
  }
  if (Object.keys(obj).length === 0) {
    return null;
  }
  return JSON.stringify(obj);
};

/**
 * settings_json 에서 KICC 이지페이 호스트 오버라이드 분리
 *
 * @param {string|null|undefined} settingsJson
 * @returns {{ hostTest: string, hostProd: string, rest: Object }}
 */
const parseKiccSettingsJson = (settingsJson) => {
  if (!settingsJson || !String(settingsJson).trim()) {
    return { hostTest: '', hostProd: '', rest: {} };
  }
  try {
    const obj = JSON.parse(String(settingsJson));
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return { hostTest: '', hostProd: '', rest: {} };
    }
    const hostTest = Object.prototype.hasOwnProperty.call(obj, KICC_SETTINGS_KEY_EASYPAY_HOST_TEST)
      ? String(obj[KICC_SETTINGS_KEY_EASYPAY_HOST_TEST] ?? '')
      : '';
    const hostProd = Object.prototype.hasOwnProperty.call(obj, KICC_SETTINGS_KEY_EASYPAY_HOST_PROD)
      ? String(obj[KICC_SETTINGS_KEY_EASYPAY_HOST_PROD] ?? '')
      : '';
    const rest = { ...obj };
    delete rest[KICC_SETTINGS_KEY_EASYPAY_HOST_TEST];
    delete rest[KICC_SETTINGS_KEY_EASYPAY_HOST_PROD];
    return { hostTest, hostProd, rest };
  } catch {
    return { hostTest: '', hostProd: '', rest: {} };
  }
};

/**
 * KICC 호스트 필드 + 나머지 키 병합 후 JSON 문자열
 *
 * @param {string} hostTestInput
 * @param {string} hostProdInput
 * @param {Object} rest
 * @returns {string|null}
 */
const buildSettingsJsonFromKiccFields = (hostTestInput, hostProdInput, rest) => {
  const ht = hostTestInput != null ? String(hostTestInput).trim() : '';
  const hp = hostProdInput != null ? String(hostProdInput).trim() : '';
  const obj = { ...rest };
  if (ht !== '') {
    obj[KICC_SETTINGS_KEY_EASYPAY_HOST_TEST] = ht;
  }
  if (hp !== '') {
    obj[KICC_SETTINGS_KEY_EASYPAY_HOST_PROD] = hp;
  }
  if (Object.keys(obj).length === 0) {
    return null;
  }
  return JSON.stringify(obj);
};

/**
 * PG 설정 입력/수정 폼 컴포넌트
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
const PgConfigurationForm = ({
  initialData = null,
  onSave,
  onCancel,
  mode = 'create',
  hidePageTitle = false,
  tenantId = null,
  configId = null
}) => {
  const [formData, setFormData] = useState({
    pgProvider: '',
    pgName: '',
    apiKey: '',
    secretKey: '',
    merchantId: '',
    storeId: '',
    webhookUrl: '',
    returnUrl: '',
    cancelUrl: '',
    testMode: false,
    settingsJson: '',
    notes: ''
  });

  const [portoneWebhookSecret, setPortoneWebhookSecret] = useState('');
  const [settingsRest, setSettingsRest] = useState({});
  const [kiccEasypayHostTest, setKiccEasypayHostTest] = useState('');
  const [kiccEasypayHostProd, setKiccEasypayHostProd] = useState('');
  const [kiccSettingsRest, setKiccSettingsRest] = useState({});

  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPortoneWebhookSecret, setShowPortoneWebhookSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const prevPgProviderRef = useRef('');

  const pgProviders = [
    { value: 'TOSS', label: '토스페이먼츠' },
    { value: PG_PROVIDER_IAMPORT, label: PG_PROVIDER_IAMPORT_DISPLAY_LABEL },
    { value: 'KAKAO', label: '카카오페이' },
    { value: 'NAVER', label: '네이버페이' },
    { value: 'PAYPAL', label: '페이팔' },
    { value: 'STRIPE', label: '스트라이프' },
    { value: PG_PROVIDER_KICC, label: 'KICC 이지페이' }
  ];

  const isIamportPortoneV2 = formData.pgProvider === PG_PROVIDER_IAMPORT;
  const isKicc = formData.pgProvider === PG_PROVIDER_KICC;
  const canRunConnectionTest = Boolean(
    tenantId && configId && (isIamportPortoneV2 || isKicc)
  );

  useEffect(() => {
    if (initialData && mode === 'edit') {
      const parsedPortone = parsePortoneSettingsJson(initialData.settingsJson);
      const parsedKicc = parseKiccSettingsJson(initialData.settingsJson);
      if (initialData.pgProvider === PG_PROVIDER_IAMPORT) {
        setPortoneWebhookSecret(parsedPortone.webhookSecret);
        setSettingsRest(parsedPortone.rest);
        setKiccEasypayHostTest('');
        setKiccEasypayHostProd('');
        setKiccSettingsRest({});
      } else if (initialData.pgProvider === PG_PROVIDER_KICC) {
        setPortoneWebhookSecret('');
        setSettingsRest({});
        setKiccEasypayHostTest(parsedKicc.hostTest);
        setKiccEasypayHostProd(parsedKicc.hostProd);
        setKiccSettingsRest(parsedKicc.rest);
      } else {
        setPortoneWebhookSecret('');
        setSettingsRest({});
        setKiccEasypayHostTest('');
        setKiccEasypayHostProd('');
        setKiccSettingsRest({});
      }
      setFormData({
        pgProvider: initialData.pgProvider || '',
        pgName: initialData.pgName || '',
        apiKey: '',
        secretKey: '',
        merchantId: initialData.merchantId || '',
        storeId: initialData.storeId || '',
        webhookUrl: initialData.webhookUrl || '',
        returnUrl: initialData.returnUrl || '',
        cancelUrl: initialData.cancelUrl || '',
        testMode: initialData.testMode || false,
        settingsJson: initialData.settingsJson || '',
        notes: initialData.notes || ''
      });
    }
  }, [initialData, mode]);

  useEffect(() => {
    if (mode === 'create') {
      if (
        prevPgProviderRef.current !== PG_PROVIDER_IAMPORT &&
        formData.pgProvider === PG_PROVIDER_IAMPORT
      ) {
        setPortoneWebhookSecret('');
        setSettingsRest({});
      }
      if (
        prevPgProviderRef.current !== PG_PROVIDER_KICC &&
        formData.pgProvider === PG_PROVIDER_KICC
      ) {
        setKiccEasypayHostTest('');
        setKiccEasypayHostProd('');
        setKiccSettingsRest({});
      }
    }
    prevPgProviderRef.current = formData.pgProvider;
  }, [formData.pgProvider, mode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePortoneWebhookSecretChange = (value) => {
    setPortoneWebhookSecret(value);
    setTouched((prev) => ({ ...prev, portoneWebhookSecret: true }));
    if (errors.portoneWebhookSecret) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.portoneWebhookSecret;
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.pgProvider) {
      newErrors.pgProvider = 'PG사를 선택해주세요.';
    }

    if (isKicc) {
      if (!formData.merchantId || !String(formData.merchantId).trim()) {
        newErrors.merchantId = 'Mall ID(상점 ID)를 입력해주세요.';
      }
      if (!formData.apiKey || !String(formData.apiKey).trim()) {
        newErrors.apiKey = 'API 키를 입력해주세요.';
      }
      if (!formData.secretKey || !String(formData.secretKey).trim()) {
        newErrors.secretKey = '상점 검증키(Secret Key)를 입력해주세요.';
      }
    } else if (isIamportPortoneV2) {
      if (!formData.storeId || !String(formData.storeId).trim()) {
        newErrors.storeId = '스토어 ID를 입력해주세요.';
      }
      if (!formData.secretKey || !String(formData.secretKey).trim()) {
        newErrors.secretKey = 'API 시크릿을 입력해주세요.';
      }
    } else {
      if (!formData.apiKey) {
        newErrors.apiKey = 'API 키를 입력해주세요.';
      }
      if (!formData.secretKey) {
        newErrors.secretKey = '시크릿 키를 입력해주세요.';
      }
    }

    if (formData.pgName && formData.pgName.length > 255) {
      newErrors.pgName = 'PG사 명칭은 255자 이하여야 합니다.';
    }

    if (formData.webhookUrl && formData.webhookUrl.length > 500) {
      newErrors.webhookUrl = 'Webhook URL은 500자 이하여야 합니다.';
    }

    if (formData.returnUrl && formData.returnUrl.length > 500) {
      newErrors.returnUrl = '리턴 URL은 500자 이하여야 합니다.';
    }

    if (formData.cancelUrl && formData.cancelUrl.length > 500) {
      newErrors.cancelUrl = '취소 URL은 500자 이하여야 합니다.';
    }

    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = '비고는 1000자 이하여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildSavePayload = useCallback(() => {
    const rawSettings = formData.settingsJson;
    const trimmedSettings =
      typeof rawSettings === 'string' ? rawSettings.trim() : rawSettings;

    let settingsPayload = trimmedSettings === '' || trimmedSettings == null ? null : trimmedSettings;

    if (isIamportPortoneV2) {
      settingsPayload = buildSettingsJsonFromPortoneFields(portoneWebhookSecret, settingsRest);
    } else if (isKicc) {
      settingsPayload = buildSettingsJsonFromKiccFields(
        kiccEasypayHostTest,
        kiccEasypayHostProd,
        kiccSettingsRest
      );
    }

    const base = {
      ...formData,
      settingsJson: settingsPayload
    };

    if (isIamportPortoneV2) {
      const secret = String(formData.secretKey).trim();
      return {
        ...base,
        apiKey: secret,
        secretKey: secret,
        storeId: String(formData.storeId).trim()
      };
    }

    return base;
  }, [
    formData,
    isIamportPortoneV2,
    isKicc,
    portoneWebhookSecret,
    settingsRest,
    kiccEasypayHostTest,
    kiccEasypayHostProd,
    kiccSettingsRest
  ]);

  const handleSubmit = async(e) => {
    e.preventDefault();

    if (!validate()) {
      showNotification('입력한 정보를 확인해주세요.', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = buildSavePayload();
      await onSave(payload);
      if (mode === 'create') {
        showNotification('PG 설정이 등록되었습니다. 운영 포털에서 승인 절차를 진행합니다.', 'success');
      } else {
        showNotification('PG 설정이 수정되었습니다. 다시 승인 절차를 진행합니다.', 'success');
      }
    } catch (error) {
      console.error('PG 설정 저장 실패:', error);
      const errorMessage = error.response?.data?.message ||
        error.message ||
        'PG 설정 저장 중 오류가 발생했습니다.';
      showNotification(errorMessage, 'error');

      if (error.response?.data?.errors) {
        const fieldErrors = {};
        error.response.data.errors.forEach((err) => {
          if (err.field) {
            fieldErrors[err.field] = err.message;
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWebhookUrl = async() => {
    const url = getPortOneV2WebhookDisplayUrl();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showNotification('웹훅 URL을 클립보드에 복사했습니다.', 'success');
      } else {
        showNotification('이 환경에서는 자동 복사를 지원하지 않습니다. URL을 직접 선택해 복사해 주세요.', 'error');
      }
    } catch {
      showNotification('복사에 실패했습니다. URL을 직접 선택해 복사해 주세요.', 'error');
    }
  };

  const handleTestConnection = async() => {
    if (!tenantId || !configId) {
      return;
    }
    setTestConnectionLoading(true);
    try {
      const res = await testPgConnection(tenantId, configId);
      const ok = res?.success === true || res?.result === 'SUCCESS';
      const msg = toDisplayString(res?.message, ok ? '연결 테스트가 완료되었습니다.' : '연결 테스트에 실패했습니다.');
      showNotification(msg, ok ? 'success' : 'error');
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '연결 테스트 중 오류가 발생했습니다.';
      showNotification(msg, 'error');
    } finally {
      setTestConnectionLoading(false);
    }
  };

  const getFieldError = (field) => {
    if (errors[field] && touched[field]) {
      return errors[field];
    }
    return null;
  };

  const webhookDisplayUrl = getPortOneV2WebhookDisplayUrl();

  return (
    <form
      className={`pg-config-form${isKicc ? ' pg-config-form--kicc-wide' : ''}`}
      onSubmit={handleSubmit}
    >
      <div className="pg-config-form-header">
        {!hidePageTitle && (
          <>
            <h2>
              <CreditCardIcon size={24} />
              {mode === 'create' ? 'PG 설정 등록' : 'PG 설정 수정'}
            </h2>
            <p className="form-description">
              결제 게이트웨이 설정 정보를 입력해주세요. 입력한 정보는 암호화되어 저장되며, 승인 후 사용 가능합니다.
            </p>
          </>
        )}
        {mode === 'create' && (
          <div className="form-info-box">
            <InfoIcon size={18} />
            <div>
              <strong>안내사항</strong>
              <ul>
                <li>등록한 PG 설정은 운영 포털에서 승인 절차를 거칩니다.</li>
                <li>승인 대기 중에는 수정 및 삭제가 가능합니다.</li>
                <li>승인 완료 후에는 수정이 제한됩니다.</li>
              </ul>
            </div>
          </div>
        )}
        {mode === 'edit' && initialData?.approvalStatus === 'PENDING' && (
          <div className="form-warning-box">
            <AlertCircleIcon size={18} />
            <div>
              <strong>수정 안내</strong>
              <p>승인 대기 중인 설정만 수정할 수 있습니다. 수정 후 다시 승인 절차를 거칩니다.</p>
            </div>
          </div>
        )}
      </div>

      <div className="pg-config-form-body">
        {/* PG 제공자 */}
        <div className="form-group">
          <label htmlFor="pgProvider" className="required">
            PG사 <span className="required-mark">*</span>
          </label>
          <select
            id="pgProvider"
            value={formData.pgProvider}
            onChange={(e) => handleChange('pgProvider', e.target.value)}
            className={`form-select ${getFieldError('pgProvider') ? 'error' : ''}`}
            disabled={mode === 'edit'}
          >
            <option value="">PG사를 선택하세요</option>
            {pgProviders.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
          {getFieldError('pgProvider') && (
            <span id="pgProvider-error" className="error-message" role="alert">
              <AlertCircleIcon size={14} aria-hidden="true" />
              {getFieldError('pgProvider')}
            </span>
          )}
        </div>

        {isKicc && (
          <section
            className="pg-config-form__kicc"
            aria-labelledby="pg-config-kicc-section-title"
          >
            <h3 id="pg-config-kicc-section-title" className="pg-config-form__kicc-title">
              KICC 이지페이 연동
            </h3>
            <div className="mg-v2-ad-b0kla-info-box pg-config-portone-v2-banner" role="status">
              <p className="mg-v2-info-text pg-config-portone-v2-notice-line">
                KICC 이지페이 온라인 결제 API 연동입니다. Mall ID는 가맹점 ID 필드에 입력합니다. API 키·상점 검증키는 KICC에서 발급받은 값을 사용합니다.
              </p>
              <ul className="pg-config-kicc-doc-list">
                <li>
                  <a href={KICC_DOCS_LLM_INDEX_URL} target="_blank" rel="noopener noreferrer">
                    API 목록 (llms.txt)
                  </a>
                </li>
                <li>
                  <a href={KICC_DOCS_ONLINE_PAYMENT_BASE} target="_blank" rel="noopener noreferrer">
                    온라인 결제 개요·연동
                  </a>
                </li>
                <li>
                  <a href={KICC_DOCS_AI_GUIDE_URL} target="_blank" rel="noopener noreferrer">
                    AI 연동 주의(민감정보·타임아웃 등)
                  </a>
                </li>
              </ul>
            </div>

            <div className="form-group">
              <label htmlFor="merchantIdKicc" className="required">
                Mall ID (상점 ID) <span className="required-mark">*</span>
              </label>
              <input
                id="merchantIdKicc"
                type="text"
                value={formData.merchantId}
                onChange={(e) => handleChange('merchantId', e.target.value)}
                placeholder="KICC에서 부여한 Mall ID"
                className={`form-input ${getFieldError('merchantId') ? 'error' : ''}`}
                maxLength={255}
                autoComplete="off"
                aria-required="true"
                aria-invalid={getFieldError('merchantId') ? 'true' : 'false'}
                aria-describedby={getFieldError('merchantId') ? 'merchantIdKicc-error' : 'merchantIdKicc-help'}
              />
              {getFieldError('merchantId') && (
                <span id="merchantIdKicc-error" className="error-message" role="alert">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('merchantId')}
                </span>
              )}
              <small id="merchantIdKicc-help" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                문서상 8바이트 상점 ID입니다. 연동 세부 사항은{' '}
                <a href={KICC_DOCS_ONLINE_PAYMENT_BASE} target="_blank" rel="noopener noreferrer">
                  KICC 온라인 결제 문서
                </a>
                를 참고하세요.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="apiKeyKicc" className="required">
                API 키 <span className="required-mark">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="apiKeyKicc"
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder="KICC에서 안내한 상점 연동용 키"
                  className={`form-input ${getFieldError('apiKey') ? 'error' : ''}`}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={getFieldError('apiKey') ? 'true' : 'false'}
                  aria-describedby={getFieldError('apiKey') ? 'apiKeyKicc-error' : 'apiKeyKicc-help'}
                />
                <MGButton
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false,
                    className: 'icon-button'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  aria-label={showApiKey ? 'API 키 숨기기' : 'API 키 보기'}
                  variant="outline"
                  size="small"
                  preventDoubleClick={false}
                >
                  {showApiKey ? '숨기기' : '보기'}
                </MGButton>
              </div>
              {getFieldError('apiKey') && (
                <span id="apiKeyKicc-error" className="error-message" role="alert">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('apiKey')}
                </span>
              )}
              <small id="apiKeyKicc-help" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                저장 시 암호화됩니다. Phase 2에서 API 유형별로 사용합니다.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="secretKeyKicc" className="required">
                상점 검증키 (Secret Key) <span className="required-mark">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="secretKeyKicc"
                  type={showSecretKey ? 'text' : 'password'}
                  value={formData.secretKey}
                  onChange={(e) => handleChange('secretKey', e.target.value)}
                  placeholder={mode === 'edit' ? '변경 시에만 새 값 입력' : 'HMAC 메시지 인증용 상점 검증키'}
                  className={`form-input ${getFieldError('secretKey') ? 'error' : ''}`}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={getFieldError('secretKey') ? 'true' : 'false'}
                  aria-describedby={getFieldError('secretKey') ? 'secretKeyKicc-error' : 'secretKeyKicc-help'}
                />
                <MGButton
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false,
                    className: 'icon-button'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  aria-label={showSecretKey ? '상점 검증키 숨기기' : '상점 검증키 보기'}
                  variant="outline"
                  size="small"
                  preventDoubleClick={false}
                >
                  {showSecretKey ? '숨기기' : '보기'}
                </MGButton>
              </div>
              {getFieldError('secretKey') && (
                <span id="secretKeyKicc-error" className="error-message" role="alert">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('secretKey')}
                </span>
              )}
              <small id="secretKeyKicc-help" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                승인·취소 등 msgAuthValue(HMAC-SHA256)에 사용됩니다. 연결 테스트는 거래상태 조회 API로 도메인·Mall ID를 확인합니다.
              </small>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.testMode}
                  onChange={(e) => handleChange('testMode', e.target.checked)}
                  className="form-checkbox"
                />
                <span>테스트 모드</span>
              </label>
              <small className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                테스트·운영 API 엔드포인트는 KICC 문서를 따릅니다.{' '}
                <a href={KICC_DOCS_ONLINE_PAYMENT_BASE} target="_blank" rel="noopener noreferrer">
                  온라인 결제 개요·연동
                </a>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="kiccEasypayHostTest">이지페이 API 호스트 (테스트, 선택)</label>
              <input
                id="kiccEasypayHostTest"
                type="text"
                value={kiccEasypayHostTest}
                onChange={(e) => setKiccEasypayHostTest(e.target.value)}
                placeholder="비우면 서버 기본값·배포 설정 사용"
                className="form-input"
                maxLength={255}
                autoComplete="off"
                aria-describedby="kiccEasypayHostTest-help"
              />
              <small id="kiccEasypayHostTest-help" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                문서의 테스트 호스트와 배포 기본값이 다를 때만 입력합니다. 저장 키:{' '}
                <span className="pg-config-portone-v2-code">{KICC_SETTINGS_KEY_EASYPAY_HOST_TEST}</span>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="kiccEasypayHostProd">이지페이 API 호스트 (운영, 선택)</label>
              <input
                id="kiccEasypayHostProd"
                type="text"
                value={kiccEasypayHostProd}
                onChange={(e) => setKiccEasypayHostProd(e.target.value)}
                placeholder="비우면 서버 기본값·배포 설정 사용"
                className="form-input"
                maxLength={255}
                autoComplete="off"
                aria-describedby="kiccEasypayHostProd-help"
              />
              <small id="kiccEasypayHostProd-help" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                문서의 운영 호스트와 배포 기본값이 다를 때만 입력합니다. 저장 키:{' '}
                <span className="pg-config-portone-v2-code">{KICC_SETTINGS_KEY_EASYPAY_HOST_PROD}</span>
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="notesKicc">비고 (선택)</label>
              <textarea
                id="notesKicc"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="추가 정보나 메모를 입력하세요"
                className={`form-textarea ${getFieldError('notes') ? 'error' : ''}`}
                rows={4}
                maxLength={1000}
              />
              <small className="char-count">
                {formData.notes.length} / 1000
              </small>
              {getFieldError('notes') && (
                <span className="error-message">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('notes')}
                </span>
              )}
            </div>

            <div className="pg-config-portone-v2-test">
              <MGButton
                type="button"
                variant="secondary"
                className={buildErpMgButtonClassName({
                  variant: 'secondary',
                  size: 'md',
                  loading: testConnectionLoading
                })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={handleTestConnection}
                disabled={!canRunConnectionTest || testConnectionLoading}
                loading={testConnectionLoading}
                preventDoubleClick={false}
                aria-label="PG 연결 테스트"
              >
                연결 테스트
              </MGButton>
              {!canRunConnectionTest && (
                <p className="pg-config-portone-v2-test-hint">
                  <SafeText>
                    {mode === 'create'
                      ? '연결 테스트는 저장 후 상세 화면에서 진행할 수 있습니다.'
                      : '연결 테스트를 실행할 수 없습니다. 테넌트·설정 정보를 확인해 주세요.'}
                  </SafeText>
                </p>
              )}
            </div>
          </section>
        )}

        {isIamportPortoneV2 && (
          <>
            {/* A: V2 안내 */}
            <div className="mg-v2-ad-b0kla-info-box pg-config-portone-v2-banner" role="status">
              <p className="mg-v2-info-text pg-config-portone-v2-notice-line">
                <SafeText>{PORTONE_V2_NOTICE_LINE}</SafeText>
              </p>
            </div>

            {/* B: 스토어 ID */}
            <div className="form-group">
              <label htmlFor="storeId" className="required">
                스토어 ID <span className="required-mark">*</span>
              </label>
              <input
                id="storeId"
                type="text"
                value={formData.storeId}
                onChange={(e) => handleChange('storeId', e.target.value)}
                placeholder="포트원 콘솔의 스토어 ID"
                className={`form-input ${getFieldError('storeId') ? 'error' : ''}`}
                maxLength={255}
                autoComplete="off"
                aria-required="true"
                aria-invalid={getFieldError('storeId') ? 'true' : 'false'}
                aria-describedby={getFieldError('storeId') ? 'storeId-error' : 'storeId-help'}
              />
              {getFieldError('storeId') && (
                <span id="storeId-error" className="error-message" role="alert">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('storeId')}
                </span>
              )}
              <small id="storeId-help" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                포트원 결제모듈 V2 연동 시 콘솔에 표시되는 스토어 ID입니다. 입력 시 REST V2 API 시크릿 검증 경로가 사용됩니다.
              </small>
            </div>

            {/* C: API 시크릿 */}
            <div className="form-group">
              <label htmlFor="secretKey" className="required">
                API 시크릿 <span className="required-mark">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="secretKey"
                  type={showSecretKey ? 'text' : 'password'}
                  value={formData.secretKey}
                  onChange={(e) => handleChange('secretKey', e.target.value)}
                  placeholder={mode === 'edit' ? '변경 시에만 새 API 시크릿을 입력하세요' : 'API 시크릿을 입력하세요'}
                  className={`form-input ${getFieldError('secretKey') ? 'error' : ''}`}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={getFieldError('secretKey') ? 'true' : 'false'}
                  aria-describedby={getFieldError('secretKey') ? 'secretKey-error' : 'secretKey-help'}
                />
                <MGButton
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false,
                    className: 'icon-button'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  aria-label={showSecretKey ? 'API 시크릿 숨기기' : 'API 시크릿 보기'}
                  variant="outline"
                  size="small"
                  preventDoubleClick={false}
                >
                  {showSecretKey ? '숨기기' : '보기'}
                </MGButton>
              </div>
              {getFieldError('secretKey') && (
                <span id="secretKey-error" className="error-message" role="alert">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('secretKey')}
                </span>
              )}
              <small id="secretKey-help" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                포트원 REST V2 로그인(api-secret)에 사용됩니다. 저장 시 암호화되며, 수정 시에는 변경할 때만 새 값을 입력하면 됩니다.
              </small>
            </div>

            {/* D: 웹훅 안내 */}
            <section className="pg-config-portone-v2-section" aria-labelledby="portone-webhook-guide-title">
              <h3 id="portone-webhook-guide-title" className="pg-config-portone-v2-section-title">
                웹훅 URL 안내
              </h3>
              <p className="pg-config-portone-v2-readonly-hint">
                아래 값은 읽기 전용입니다. 포트원 콘솔 웹훅 설정에 동일하게 등록하세요.
              </p>
              <div className="pg-config-portone-v2-copy-row">
                <label className="sr-only" htmlFor="portone-webhook-url-readonly">
                  웹훅 URL
                </label>
                <input
                  id="portone-webhook-url-readonly"
                  type="text"
                  readOnly
                  className="form-input pg-config-portone-v2-readonly-input"
                  value={webhookDisplayUrl}
                />
                <MGButton
                  type="button"
                  variant="outline"
                  size="small"
                  className={buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  onClick={handleCopyWebhookUrl}
                  preventDoubleClick={false}
                  aria-label="웹훅 URL 복사"
                >
                  복사
                </MGButton>
              </div>
              <dl className="pg-config-portone-v2-meta">
                <div className="pg-config-portone-v2-meta-row">
                  <dt>Content-Type</dt>
                  <dd>
                    <SafeText>{PORTONE_V2_WEBHOOK_CONTENT_TYPE}</SafeText>
                  </dd>
                </div>
                <div className="pg-config-portone-v2-meta-row">
                  <dt>Version</dt>
                  <dd>
                    <SafeText>{PORTONE_V2_WEBHOOK_VERSION}</SafeText>
                  </dd>
                </div>
              </dl>
            </section>

            {/* E: 웹훅 시크릿 */}
            <div className="form-group">
              <label htmlFor="portoneWebhookSecret">{PORTONE_SETTINGS_KEY_WEBHOOK_SECRET} (선택)</label>
              <div className="input-with-icon">
                <input
                  id="portoneWebhookSecret"
                  type={showPortoneWebhookSecret ? 'text' : 'password'}
                  value={portoneWebhookSecret}
                  onChange={(e) => handlePortoneWebhookSecretChange(e.target.value)}
                  placeholder="포트원 콘솔에서 발급한 웹훅 시크릿"
                  className={`form-input ${getFieldError('portoneWebhookSecret') ? 'error' : ''}`}
                  autoComplete="new-password"
                  aria-describedby="portoneWebhookSecret-help"
                />
                <MGButton
                  type="button"
                  onClick={() => setShowPortoneWebhookSecret(!showPortoneWebhookSecret)}
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false,
                    className: 'icon-button'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  aria-label={showPortoneWebhookSecret ? '웹훅 시크릿 숨기기' : '웹훅 시크릿 보기'}
                  variant="outline"
                  size="small"
                  preventDoubleClick={false}
                >
                  {showPortoneWebhookSecret ? '숨기기' : '보기'}
                </MGButton>
              </div>
              <small id="portoneWebhookSecret-help" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                서명 검증에 사용합니다. JSON 추가 설정의
                {' '}
                <span className="pg-config-portone-v2-code">{PORTONE_SETTINGS_KEY_WEBHOOK_SECRET}</span>
                {' '}
                키로 저장됩니다.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="pgNameIamport">PG사 명칭 (선택)</label>
              <input
                id="pgNameIamport"
                type="text"
                value={formData.pgName}
                onChange={(e) => handleChange('pgName', e.target.value)}
                placeholder="예: 포트원 스토어 표시명"
                className={`form-input ${getFieldError('pgName') ? 'error' : ''}`}
                maxLength={255}
              />
              {getFieldError('pgName') && (
                <span className="error-message">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('pgName')}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.testMode}
                  onChange={(e) => handleChange('testMode', e.target.checked)}
                  className="form-checkbox"
                />
                <span>테스트 모드</span>
              </label>
              <small className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                테스트 모드에서는 실제 결제가 발생하지 않을 수 있습니다.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="notesIamport">비고 (선택)</label>
              <textarea
                id="notesIamport"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="추가 정보나 메모를 입력하세요"
                className={`form-textarea ${getFieldError('notes') ? 'error' : ''}`}
                rows={4}
                maxLength={1000}
              />
              <small className="char-count">
                {formData.notes.length} / 1000
              </small>
              {getFieldError('notes') && (
                <span className="error-message">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('notes')}
                </span>
              )}
            </div>
          </>
        )}

        {!isIamportPortoneV2 && !isKicc && (
          <>
            <div className="form-group">
              <label htmlFor="pgName">PG사 명칭 (선택)</label>
              <input
                id="pgName"
                type="text"
                value={formData.pgName}
                onChange={(e) => handleChange('pgName', e.target.value)}
                placeholder="예: 토스페이먼츠 테스트"
                className={`form-input ${getFieldError('pgName') ? 'error' : ''}`}
                maxLength={255}
              />
              {getFieldError('pgName') && (
                <span className="error-message">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('pgName')}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="apiKey" className="required">
                API 키 <span className="required-mark">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder="API 키를 입력하세요"
                  className={`form-input ${getFieldError('apiKey') ? 'error' : ''}`}
                  required
                  aria-required="true"
                  aria-invalid={getFieldError('apiKey') ? 'true' : 'false'}
                  aria-describedby={getFieldError('apiKey') ? 'apiKey-error' : 'apiKey-help'}
                />
                <MGButton
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false,
                    className: 'icon-button'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  aria-label={showApiKey ? 'API 키 숨기기' : 'API 키 보기'}
                  variant="outline"
                  size="small"
                  preventDoubleClick={false}
                >
                  {showApiKey ? '숨기기' : '보기'}
                </MGButton>
              </div>
              {getFieldError('apiKey') && (
                <span id="apiKey-error" className="error-message" role="alert">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('apiKey')}
                </span>
              )}
              <small id="apiKey-help" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                API 키는 암호화되어 저장됩니다.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="secretKeyGeneric" className="required">
                시크릿 키 <span className="required-mark">*</span>
              </label>
              <div className="input-with-icon">
                <input
                  id="secretKeyGeneric"
                  type={showSecretKey ? 'text' : 'password'}
                  value={formData.secretKey}
                  onChange={(e) => handleChange('secretKey', e.target.value)}
                  placeholder="시크릿 키를 입력하세요"
                  className={`form-input ${getFieldError('secretKey') ? 'error' : ''}`}
                  required
                  aria-required="true"
                  aria-invalid={getFieldError('secretKey') ? 'true' : 'false'}
                  aria-describedby={getFieldError('secretKey') ? 'secretKey-error-generic' : 'secretKey-help-generic'}
                />
                <MGButton
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className={buildErpMgButtonClassName({
                    variant: 'outline',
                    size: 'sm',
                    loading: false,
                    className: 'icon-button'
                  })}
                  loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                  aria-label={showSecretKey ? '시크릿 키 숨기기' : '시크릿 키 보기'}
                  variant="outline"
                  size="small"
                  preventDoubleClick={false}
                >
                  {showSecretKey ? '숨기기' : '보기'}
                </MGButton>
              </div>
              {getFieldError('secretKey') && (
                <span id="secretKey-error-generic" className="error-message" role="alert">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('secretKey')}
                </span>
              )}
              <small id="secretKey-help-generic" className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                시크릿 키는 암호화되어 저장됩니다.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="merchantId">가맹점 ID (선택)</label>
              <input
                id="merchantId"
                type="text"
                value={formData.merchantId}
                onChange={(e) => handleChange('merchantId', e.target.value)}
                placeholder="가맹점 ID를 입력하세요"
                className="form-input"
                maxLength={255}
              />
            </div>

            <div className="form-group">
              <label htmlFor="storeIdGeneric">스토어 ID (선택)</label>
              <input
                id="storeIdGeneric"
                type="text"
                value={formData.storeId}
                onChange={(e) => handleChange('storeId', e.target.value)}
                placeholder="스토어 ID를 입력하세요"
                className="form-input"
                maxLength={255}
              />
            </div>

            <div className="form-group">
              <label htmlFor="webhookUrl">웹훅 URL (선택)</label>
              <input
                id="webhookUrl"
                type="url"
                value={formData.webhookUrl}
                onChange={(e) => handleChange('webhookUrl', e.target.value)}
                placeholder="https://example.com/webhook"
                className={`form-input ${getFieldError('webhookUrl') ? 'error' : ''}`}
                maxLength={500}
              />
              {getFieldError('webhookUrl') && (
                <span className="error-message">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('webhookUrl')}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="settingsJson">추가 설정 (JSON, 선택)</label>
              <textarea
                id="settingsJson"
                value={formData.settingsJson}
                onChange={(e) => handleChange('settingsJson', e.target.value)}
                placeholder={'{"key":"value"}'}
                className="form-textarea"
                rows={4}
                spellCheck={false}
              />
              <small className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                PG별 추가 옵션을 JSON으로 전달합니다.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="returnUrl">리턴 URL (선택)</label>
              <input
                id="returnUrl"
                type="url"
                value={formData.returnUrl}
                onChange={(e) => handleChange('returnUrl', e.target.value)}
                placeholder="https://example.com/return"
                className={`form-input ${getFieldError('returnUrl') ? 'error' : ''}`}
                maxLength={500}
              />
              {getFieldError('returnUrl') && (
                <span className="error-message">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('returnUrl')}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="cancelUrl">취소 URL (선택)</label>
              <input
                id="cancelUrl"
                type="url"
                value={formData.cancelUrl}
                onChange={(e) => handleChange('cancelUrl', e.target.value)}
                placeholder="https://example.com/cancel"
                className={`form-input ${getFieldError('cancelUrl') ? 'error' : ''}`}
                maxLength={500}
              />
              {getFieldError('cancelUrl') && (
                <span className="error-message">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('cancelUrl')}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.testMode}
                  onChange={(e) => handleChange('testMode', e.target.checked)}
                  className="form-checkbox"
                />
                <span>테스트 모드</span>
              </label>
              <small className="help-text">
                <InfoIcon size={14} aria-hidden="true" />
                테스트 모드에서는 실제 결제가 발생하지 않습니다.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="notes">비고 (선택)</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="추가 정보나 메모를 입력하세요"
                className={`form-textarea ${getFieldError('notes') ? 'error' : ''}`}
                rows={4}
                maxLength={1000}
              />
              <small className="char-count">
                {formData.notes.length} / 1000
              </small>
              {getFieldError('notes') && (
                <span className="error-message">
                  <AlertCircleIcon size={14} aria-hidden="true" />
                  {getFieldError('notes')}
                </span>
              )}
            </div>
          </>
        )}

        {/* F: 연결 테스트 (포트원 V2 — KICC는 전용 섹션에서 처리) */}
        {isIamportPortoneV2 && (
          <div className="pg-config-portone-v2-test">
            <MGButton
              type="button"
              variant="secondary"
              className={buildErpMgButtonClassName({
                variant: 'secondary',
                size: 'md',
                loading: testConnectionLoading
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={handleTestConnection}
              disabled={!canRunConnectionTest || testConnectionLoading}
              loading={testConnectionLoading}
              preventDoubleClick={false}
              aria-label="PG 연결 테스트"
            >
              연결 테스트
            </MGButton>
            {!canRunConnectionTest && (
              <p className="pg-config-portone-v2-test-hint">
                <SafeText>
                  {mode === 'create'
                    ? '연결 테스트는 저장 후 상세 화면에서 진행할 수 있습니다.'
                    : '연결 테스트를 실행할 수 없습니다. 테넌트·설정 정보를 확인해 주세요.'}
                </SafeText>
              </p>
            )}
          </div>
        )}
      </div>

      {/* G: 저장 */}
      <div className="pg-config-form-footer">
        <MGButton
          type="button"
          variant="secondary"
          className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onCancel}
          disabled={loading}
          preventDoubleClick={false}
        >
          취소
        </MGButton>
        <MGButton
          type="submit"
          variant="primary"
          className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: loading })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          disabled={loading}
          loading={loading}
          preventDoubleClick={false}
          aria-label={mode === 'create' ? 'PG 설정 등록' : 'PG 설정 수정'}
        >
          {mode === 'create' ? '등록' : '수정'}
        </MGButton>
      </div>
    </form>
  );
};

export default PgConfigurationForm;
