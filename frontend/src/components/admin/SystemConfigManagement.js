/**
 * 시스템 설정 관리 페이지
 * ContentArea + ContentHeader 레이아웃(심리검사 관리 페이지와 동일 패턴)
 * AI API(OpenAI·Gemini·Claude·Replicate)·웰니스 설정
 *
 * @author Core Solution
 * @since 2025-01-21
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Save,
  Eye,
  EyeOff,
  Shield,
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { apiGet, apiPost } from '../../utils/ajax';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import MGButton from '../common/MGButton';
import { getModelPricingLabel, getModelOptionSuffix, PRICING_URLS } from './modelPricing';
import { toDisplayString } from '../../utils/safeDisplay';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './SystemConfigManagement.css';

const AI_PROVIDERS = [
  { id: 'openai', label: 'OpenAI', keyPrefix: 'OPENAI', defaultUrl: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-3.5-turbo' },
  { id: 'gemini', label: 'Gemini', keyPrefix: 'GEMINI', defaultUrl: '', defaultModel: 'gemini-3.1-pro' },
  { id: 'claude', label: 'Claude', keyPrefix: 'CLAUDE', defaultUrl: '', defaultModel: 'claude-3-5-sonnet-20241022' },
  { id: 'replicate', label: 'Replicate', keyPrefix: 'REPLICATE', defaultUrl: '', defaultModel: '' }
];

/** OpenAI 목록 미불러온 경우 입력란 datalist용 최소 프리셋 (사용 가능한 모델만 보려면 '목록 불러오기' 권장) */
const OPENAI_MODEL_PRESETS_FALLBACK = ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'];

/** Gemini 목록 미불러온 경우 입력란 datalist용 최소 프리셋 (사용 가능한 모델만 보려면 '목록 불러오기' 권장) */
const GEMINI_MODEL_PRESETS_FALLBACK = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

const initialProviderState = (defaultUrl, defaultModel) => ({
  apiKey: '',
  apiUrl: defaultUrl || '',
  model: defaultModel || ''
});

const SystemConfigManagement = () => {
  const { user, isLoggedIn } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [providers, setProviders] = useState(() =>
    AI_PROVIDERS.reduce((acc, p) => {
      acc[p.id] = initialProviderState(p.defaultUrl, p.defaultModel);
      return acc;
    }, {})
  );
  const [showApiKey, setShowApiKey] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testResultGemini, setTestResultGemini] = useState(null);
  const [geminiModels, setGeminiModels] = useState([]);
  const [loadingGeminiModels, setLoadingGeminiModels] = useState(false);
  const [openaiModels, setOpenaiModels] = useState([]);
  const [loadingOpenaiModels, setLoadingOpenaiModels] = useState(false);

  const [aiDefaultProvider, setAiDefaultProvider] = useState('openai');

  const [wellness, setWellness] = useState({
    wellnessAutoSendEnabled: true,
    wellnessSendTime: '09:00',
    wellnessTargetRoles: 'CLIENT,ROLE_CLIENT'
  });

  const toggleShowApiKey = (providerId) => {
    setShowApiKey((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const setProvider = useCallback((providerId, field, value) => {
    setProviders((prev) => ({
      ...prev,
      [providerId]: { ...prev[providerId], [field]: value }
    }));
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      notificationManager.show('로그인이 필요합니다.', 'error');
      return;
    }
    const allowedRoles = ['ADMIN', 'STAFF'];
    if (!allowedRoles.includes(user.role)) {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      return;
    }
    loadConfigs();
  }, [isLoggedIn, user]);

  // 저장된 기본 프로바이더에 API 키가 없으면, 키가 있는 첫 프로바이더로 보정
  useEffect(() => {
    if (!loading) {
      const hasKey = (id) => (providers[id]?.apiKey || '').trim() !== '';
      if (!hasKey(aiDefaultProvider)) {
        const firstWithKey = AI_PROVIDERS.find((p) => hasKey(p.id));
        if (firstWithKey) {
          setAiDefaultProvider(firstWithKey.id);
        }
      }
    }
  }, [loading, providers]);

  const loadConfigs = useCallback(async() => {
    try {
      setLoading(true);
      const openaiRes = await apiGet('/api/v1/admin/system-config/openai');
      if (openaiRes.success) {
        setProviders((prev) => ({
          ...prev,
          openai: {
            apiKey: openaiRes.apiKey || '',
            apiUrl: openaiRes.apiUrl || 'https://api.openai.com/v1/chat/completions',
            model: openaiRes.model || 'gpt-3.5-turbo'
          }
        }));
      }

      const [geminiKey, geminiUrl, geminiModel, claudeKey, claudeUrl, claudeModel, repKey, repUrl, repModel] = await Promise.all([
        apiGet('/api/v1/admin/system-config/GEMINI_API_KEY'),
        apiGet('/api/v1/admin/system-config/GEMINI_API_URL'),
        apiGet('/api/v1/admin/system-config/GEMINI_MODEL'),
        apiGet('/api/v1/admin/system-config/CLAUDE_API_KEY'),
        apiGet('/api/v1/admin/system-config/CLAUDE_API_URL'),
        apiGet('/api/v1/admin/system-config/CLAUDE_MODEL'),
        apiGet('/api/v1/admin/system-config/REPLICATE_API_KEY'),
        apiGet('/api/v1/admin/system-config/REPLICATE_API_URL'),
        apiGet('/api/v1/admin/system-config/REPLICATE_MODEL')
      ]);

      const getVal = (r) => (r && r.success ? r.configValue || '' : '');

      setProviders((prev) => ({
        ...prev,
        gemini: {
          apiKey: getVal(geminiKey),
          apiUrl: getVal(geminiUrl),
          model: getVal(geminiModel)
        },
        claude: {
          apiKey: getVal(claudeKey),
          apiUrl: getVal(claudeUrl),
          model: getVal(claudeModel)
        },
        replicate: {
          apiKey: getVal(repKey),
          apiUrl: getVal(repUrl),
          model: getVal(repModel)
        }
      }));

      const defaultProviderRes = await apiGet('/api/v1/admin/system-config/ai-default-provider');
      if (defaultProviderRes?.success && defaultProviderRes.providerId) {
        setAiDefaultProvider(defaultProviderRes.providerId);
      }

      const [wEnabled, wTime, wRoles] = await Promise.all([
        apiGet('/api/v1/admin/system-config/WELLNESS_AUTO_SEND_ENABLED'),
        apiGet('/api/v1/admin/system-config/WELLNESS_SEND_TIME'),
        apiGet('/api/v1/admin/system-config/WELLNESS_TARGET_ROLES')
      ]);
      setWellness({
        wellnessAutoSendEnabled: wEnabled?.success ? wEnabled.configValue === 'true' : true,
        wellnessSendTime: wTime?.success ? wTime.configValue : '09:00',
        wellnessTargetRoles: wRoles?.success ? wRoles.configValue : 'CLIENT,ROLE_CLIENT'
      });

      // API 키가 있으면 사용 가능한 모델만 조회해 드롭다운에 표시
      if (openaiRes?.success && (openaiRes.apiKey || '').trim()) {
        try {
          const res = await apiPost('/api/v1/admin/system-config/openai-models', { apiKey: (openaiRes.apiKey || '').trim() });
          if (res.success && Array.isArray(res.models)) setOpenaiModels(res.models);
        } catch (_) { /* 무시 */ }
      }
      if ((getVal(geminiKey) || '').trim()) {
        try {
          const res = await apiPost('/api/v1/admin/system-config/gemini-models', { apiKey: getVal(geminiKey).trim() });
          if (res.success && Array.isArray(res.models)) setGeminiModels(res.models);
        } catch (_) { /* 무시 */ }
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
      notificationManager.show('설정을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async() => {
    try {
      setSaving(true);
      const posts = [];

      AI_PROVIDERS.forEach(({ id, keyPrefix }) => {
        const p = providers[id] || {};
        posts.push(
          apiPost(`/api/v1/admin/system-config/${keyPrefix}_API_KEY`, { configValue: p.apiKey || '', description: `${keyPrefix} API 키`, category: 'AI' }),
          apiPost(`/api/v1/admin/system-config/${keyPrefix}_API_URL`, { configValue: p.apiUrl || '', description: `${keyPrefix} API URL`, category: 'AI' }),
          apiPost(`/api/v1/admin/system-config/${keyPrefix}_MODEL`, { configValue: p.model || '', description: `${keyPrefix} 모델`, category: 'AI' })
        );
      });

      posts.push(
        apiPost('/api/v1/admin/system-config/AI_DEFAULT_PROVIDER', { configValue: aiDefaultProvider, description: '기본 AI 프로바이더 (openai|gemini|claude|replicate)', category: 'AI' }),
        apiPost('/api/v1/admin/system-config/WELLNESS_AUTO_SEND_ENABLED', { configValue: String(wellness.wellnessAutoSendEnabled), description: '웰니스 자동 발송', category: 'WELLNESS' }),
        apiPost('/api/v1/admin/system-config/WELLNESS_SEND_TIME', { configValue: wellness.wellnessSendTime, description: '웰니스 발송 시간', category: 'WELLNESS' }),
        apiPost('/api/v1/admin/system-config/WELLNESS_TARGET_ROLES', { configValue: wellness.wellnessTargetRoles, description: '웰니스 대상 역할', category: 'WELLNESS' })
      );

      await Promise.all(posts);
      notificationManager.show('설정이 저장되었습니다.', 'success');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      notificationManager.show('설정 저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestOpenAI = async() => {
    const key = (providers.openai?.apiKey || '').trim();
    if (!key) {
      notificationManager.show('OpenAI API 키를 입력한 뒤 테스트해 주세요.', 'warning');
      return;
    }
    try {
      setTesting(true);
      setTestResult(null);
      const response = await apiPost('/api/v1/admin/system-config/test-openai', {
        apiKey: key,
        apiUrl: providers.openai?.apiUrl || '',
        model: providers.openai?.model || ''
      });
      if (response.success) {
        setTestResult({ success: true, message: response.message || 'OpenAI API 키가 정상 동작합니다.' });
      } else {
        setTestResult({ success: false, message: response.message || 'API 테스트 실패' });
      }
    } catch (error) {
      console.error('OpenAI API 테스트 실패:', error);
      const errMsg = error?.response?.data?.message || error?.message || 'API 테스트 중 오류가 발생했습니다.';
      setTestResult({ success: false, message: errMsg });
    } finally {
      setTesting(false);
    }
  };

  const handleTestGemini = async() => {
    const key = (providers.gemini?.apiKey || '').trim();
    if (!key) {
      notificationManager.show('Gemini API 키를 입력한 뒤 테스트해 주세요.', 'warning');
      return;
    }
    try {
      setTestingGemini(true);
      setTestResultGemini(null);
      const response = await apiPost('/api/v1/admin/system-config/test-gemini', { apiKey: key });
      if (response.success) {
        setTestResultGemini({ success: true, message: response.message || 'Gemini API 키가 정상 동작합니다.' });
      } else {
        setTestResultGemini({ success: false, message: response.message || '연결 실패' });
      }
    } catch (error) {
      console.error('Gemini 키 테스트 실패:', error);
      setTestResultGemini({ success: false, message: error?.message || '테스트 중 오류가 발생했습니다.' });
    } finally {
      setTestingGemini(false);
    }
  };

  const loadGeminiModels = async() => {
    const key = (providers.gemini?.apiKey || '').trim();
    if (!key) {
      notificationManager.show('Gemini API 키를 입력한 뒤 목록을 불러오세요.', 'warning');
      return;
    }
    try {
      setLoadingGeminiModels(true);
      const response = await apiPost('/api/v1/admin/system-config/gemini-models', { apiKey: key });
      if (response.success && Array.isArray(response.models)) {
        setGeminiModels(response.models);
        notificationManager.show(`모델 ${response.models.length}개를 불러왔습니다.`, 'success');
      } else {
        notificationManager.show(response.message || '모델 목록을 불러오지 못했습니다.', 'error');
      }
    } catch (error) {
      console.error('Gemini 모델 목록 로드 실패:', error);
      notificationManager.show(error?.message || '모델 목록 조회 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoadingGeminiModels(false);
    }
  };

  const handleLoadOpenAIModels = async() => {
    const key = (providers.openai?.apiKey || '').trim();
    if (!key) {
      notificationManager.show('OpenAI API 키를 입력한 뒤 목록을 불러오세요.', 'warning');
      return;
    }
    try {
      setLoadingOpenaiModels(true);
      const response = await apiPost('/api/v1/admin/system-config/openai-models', { apiKey: key });
      if (response.success && Array.isArray(response.models)) {
        setOpenaiModels(response.models);
        notificationManager.show(`모델 ${response.models.length}개를 불러왔습니다.`, 'success');
      } else {
        notificationManager.show(response.message || '모델 목록을 불러오지 못했습니다.', 'error');
      }
    } catch (error) {
      console.error('OpenAI 모델 목록 로드 실패:', error);
      notificationManager.show(error?.message || '모델 목록 조회 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoadingOpenaiModels(false);
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
              subtitle="AI API 키(OpenAI·Gemini·Claude·Replicate)·웰니스 자동 발송 등 시스템 설정을 관리합니다."
              actions={
                <MGButton
                  type="button"
                  variant="primary"
                  className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                  title="설정 저장"
                  loading={saving}
                  loadingText="저장 중..."
                >
                  <Save size={20} />
                  설정 저장
                </MGButton>
              }
            />

            {/* AI API 설정 섹션 */}
            <div className="mg-v2-ad-b0kla__card mg-v2-system-config__section">
              <h2 className="mg-v2-ad-b0kla__section-title">
                <Key size={20} />
                AI API 설정 (다중 프로바이더)
              </h2>
              <p className="mg-v2-system-config__section-desc">
                심리검사 AI 리포트·웰니스 등에 사용됩니다. 프로바이더별 API 키·URL·모델을 입력하고 테스트할 수 있습니다.
                고급 모델일수록 비용이 높을 수 있으므로, 아래 요금 참고를 보고 부담 없이 선택하세요.
              </p>

              <div className="mg-v2-ad-b0kla__card mg-v2-system-config__provider-card">
                <h3 className="mg-v2-system-config__provider-title">사용할 AI 프로바이더</h3>
                <p className="mg-v2-system-config__section-desc">
                  API 키가 등록된 프로바이더만 선택할 수 있습니다. 심리검사 AI 리포트 등에 선택한 프로바이더가 사용됩니다.
                </p>
                <div className="mg-v2-system-config__radio-group">
                  {AI_PROVIDERS.filter((p) => (providers[p.id]?.apiKey || '').trim() !== '').map((p) => (
                    <label key={p.id} className="mg-v2-system-config__radio-label">
                      <input
                        type="radio"
                        name="aiDefaultProvider"
                        value={p.id}
                        checked={aiDefaultProvider === p.id}
                        onChange={() => setAiDefaultProvider(p.id)}
                        className="mg-v2-radio"
                      />
                      <span>{toDisplayString(p.label)}</span>
                    </label>
                  ))}
                  {AI_PROVIDERS.every((p) => !(providers[p.id]?.apiKey || '').trim()) && (
                    <p className="mg-v2-system-config__radio-empty">API 키가 등록된 프로바이더가 없습니다. 아래에서 한 개 이상 등록 후 선택할 수 있습니다.</p>
                  )}
                </div>
              </div>

              {AI_PROVIDERS.map(({ id, label, keyPrefix, defaultUrl }) => (
                <div key={id} className="mg-v2-ad-b0kla__card mg-v2-system-config__provider-card">
                  <h3 className="mg-v2-system-config__provider-title">{toDisplayString(label)}</h3>
                  <div className="config-grid">
                    <div className="config-item">
                      <label htmlFor={`apiKey-${id}`}>API 키</label>
                      <div className="input-group">
                        <input
                          id={`apiKey-${id}`}
                          type={showApiKey[id] ? 'text' : 'password'}
                          value={providers[id]?.apiKey || ''}
                          onChange={(e) => setProvider(id, 'apiKey', e.target.value)}
                          placeholder={id === 'openai' ? 'sk-...' : 'API 키 입력'}
                          className="mg-v2-input"
                        />
                        <MGButton type="button" variant="secondary" size="medium" onClick={() => toggleShowApiKey(id)} preventDoubleClick={false}>
                          {showApiKey[id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </MGButton>
                      </div>
                      <small className="help-text"><Shield size={14} /> API 키는 암호화되어 저장됩니다.</small>
                    </div>
                    <div className="config-item">
                      <label htmlFor={`apiUrl-${id}`}>API 주소</label>
                      <input
                        id={`apiUrl-${id}`}
                        type="text"
                        value={providers[id]?.apiUrl || ''}
                        onChange={(e) => setProvider(id, 'apiUrl', e.target.value)}
                        placeholder={defaultUrl || 'https://...'}
                        className="mg-v2-input"
                      />
                    </div>
                    <div className="config-item">
                      <label htmlFor={`model-${id}`}>모델</label>
                      {id === 'gemini' ? (
                        <>
                          <div className="section-actions" style={{ marginBottom: 8 }}>
                            <MGButton
                              type="button"
                              variant="secondary"
                              size="medium"
                              onClick={loadGeminiModels}
                              disabled={loadingGeminiModels || !(providers.gemini?.apiKey || '').trim()}
                              loading={loadingGeminiModels}
                              loadingText="불러오는 중..."
                              preventDoubleClick={false}
                            >
                              {loadingGeminiModels ? <RefreshCw size={16} className="mg-spinning" /> : <RefreshCw size={16} />}
                              {geminiModels.length > 0 ? '모델 목록 다시 불러오기' : '사용 가능한 모델만 불러오기'}
                            </MGButton>
                          </div>
                          {geminiModels.length > 0 ? (
                            <select
                              id={`model-select-${id}`}
                              value={geminiModels.some((m) => m.id === (providers.gemini?.model || '')) ? (providers.gemini?.model || '') : '__custom__'}
                              onChange={(e) => setProvider('gemini', 'model', e.target.value === '__custom__' ? (providers.gemini?.model || '') : e.target.value)}
                              className="mg-v2-input"
                              style={{ marginBottom: 8, width: '100%', maxWidth: 360 }}
                            >
                              <option value="__custom__">직접 입력 (아래 입력란)</option>
                              {geminiModels.map((m) => (
                                <option key={m.id} value={m.id}>{m.id}{getModelOptionSuffix('gemini', m.id)}</option>
                              ))}
                            </select>
                          ) : (
                            <p className="mg-v2-system-config__pricing-notice" style={{ marginBottom: 8 }}>
                              위 버튼을 누르면 이 계정에서 사용 가능한 모델만 목록에 표시됩니다.
                            </p>
                          )}
                          <input
                            id={`model-${id}`}
                            type="text"
                            value={providers[id]?.model || ''}
                            onChange={(e) => setProvider(id, 'model', e.target.value)}
                            placeholder={geminiModels.length > 0 ? '모델 ID (예: gemini-3.1-pro)' : '모델 ID (사용 가능한 모델만 보려면 위 버튼 클릭)'}
                            className="mg-v2-input"
                            list={geminiModels.length === 0 ? `model-presets-${id}` : undefined}
                          />
                          {geminiModels.length === 0 && (
                            <datalist id={`model-presets-${id}`}>
                              {GEMINI_MODEL_PRESETS_FALLBACK.map((mid) => (
                                <option key={mid} value={mid} />
                              ))}
                            </datalist>
                          )}
                          <div className="mg-v2-system-config__pricing-notice" style={{ marginTop: 8 }}>
                            <>
                              {getModelPricingLabel('gemini', providers.gemini?.model || '') ? (
                                <span><strong>요금 참고:</strong> {getModelPricingLabel('gemini', providers.gemini?.model || '')} (1M tokens 기준, USD). </span>
                              ) : (
                                <span><strong>요금 참고:</strong> 선택한 모델의 요금은 공식 문서를 참고하세요. </span>
                              )}
                              {' '}
                              <a href={PRICING_URLS.gemini} target="_blank" rel="noopener noreferrer">Gemini 공식 요금</a>
                            </>
                          </div>
                        </>
                      ) : id === 'openai' ? (
                        <>
                          <div className="section-actions" style={{ marginBottom: 8 }}>
                            <MGButton
                              variant="secondary"
                              size="medium"
                              onClick={handleLoadOpenAIModels}
                              disabled={loadingOpenaiModels || !(providers.openai?.apiKey || '').trim()}
                              loading={loadingOpenaiModels}
                              loadingText="불러오는 중..."
                              preventDoubleClick={false}
                            >
                              {loadingOpenaiModels ? <RefreshCw size={16} className="mg-spinning" /> : <RefreshCw size={16} />}
                              {openaiModels.length > 0 ? '모델 목록 다시 불러오기' : '사용 가능한 모델만 불러오기'}
                            </MGButton>
                          </div>
                          {openaiModels.length > 0 ? (
                            <select
                              id={`model-select-${id}`}
                              value={
                                openaiModels.some((m) => m.id === (providers.openai?.model || ''))
                                  ? (providers.openai?.model || '')
                                  : '__custom__'
                              }
                              onChange={(e) => setProvider('openai', 'model', e.target.value === '__custom__' ? (providers.openai?.model || '') : e.target.value)}
                              className="mg-v2-input"
                              style={{ marginBottom: 8, width: '100%', maxWidth: 360 }}
                            >
                              <option value="__custom__">직접 입력 (아래 입력란)</option>
                              {openaiModels.map((m) => (
                                <option key={m.id} value={m.id}>{m.id}{getModelOptionSuffix('openai', m.id)}</option>
                              ))}
                            </select>
                          ) : (
                            <p className="mg-v2-system-config__pricing-notice" style={{ marginBottom: 8 }}>
                              위 버튼을 누르면 이 계정에서 사용 가능한 모델만 목록에 표시됩니다.
                            </p>
                          )}
                          <input
                            id={`model-${id}`}
                            type="text"
                            value={providers[id]?.model || ''}
                            onChange={(e) => setProvider(id, 'model', e.target.value)}
                            placeholder={openaiModels.length > 0 ? '모델 ID (또는 위에서 선택)' : '모델 ID (사용 가능한 모델만 보려면 위 버튼 클릭)'}
                            className="mg-v2-input"
                            list={openaiModels.length === 0 ? 'openai-model-presets-fallback' : undefined}
                          />
                          {openaiModels.length === 0 && (
                            <datalist id="openai-model-presets-fallback">
                              {OPENAI_MODEL_PRESETS_FALLBACK.map((mid) => (
                                <option key={mid} value={mid} />
                              ))}
                            </datalist>
                          )}
                          <div className="mg-v2-system-config__pricing-notice" style={{ marginTop: 8 }}>
                            <>
                              {getModelPricingLabel('openai', providers.openai?.model || '') ? (
                                <span><strong>요금 참고:</strong> {getModelPricingLabel('openai', providers.openai?.model || '')} (1M tokens 기준, USD). </span>
                              ) : (
                                <span><strong>요금 참고:</strong> 선택한 모델의 요금은 공식 문서를 참고하세요. </span>
                              )}
                              {' '}
                              <a href={PRICING_URLS.openai} target="_blank" rel="noopener noreferrer">OpenAI 공식 요금</a>
                            </>
                          </div>
                        </>
                      ) : (
                        <>
                          <input
                            id={`model-${id}`}
                            type="text"
                            value={providers[id]?.model || ''}
                            onChange={(e) => setProvider(id, 'model', e.target.value)}
                            placeholder="모델 ID"
                            className="mg-v2-input"
                            list={`model-presets-${id}`}
                          />
                          <datalist id={`model-presets-${id}`}>
                            <option value="claude-3-5-sonnet-20241022" />
                            <option value="gemini-3.1-pro" />
                          </datalist>
                        </>
                      )}
                    </div>
                  </div>
                  {id === 'openai' && (
                    <>
                      <div className="section-actions">
                        <MGButton
                          variant="secondary"
                          size="medium"
                          onClick={handleTestOpenAI}
                          disabled={testing || !(providers.openai?.apiKey)}
                          loading={testing}
                          loadingText="테스트 중..."
                          preventDoubleClick={false}
                        >
                          {testing ? <RefreshCw size={16} className="mg-spinning" /> : <CheckCircle size={16} />}
                          API 테스트
                        </MGButton>
                      </div>
                      {testResult && (
                        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                          <div className="result-icon">
                            {testResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <div className="result-content">
                            <strong>{toDisplayString(testResult.message)}</strong>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {id === 'gemini' && (
                    <>
                      <div className="section-actions">
                        <MGButton
                          variant="secondary"
                          size="medium"
                          onClick={handleTestGemini}
                          disabled={testingGemini || !(providers.gemini?.apiKey || '').trim()}
                          loading={testingGemini}
                          loadingText="테스트 중..."
                          preventDoubleClick={false}
                        >
                          {testingGemini ? <RefreshCw size={16} className="mg-spinning" /> : <CheckCircle size={16} />}
                          키 테스트
                        </MGButton>
                      </div>
                      <p className="mg-v2-system-config__section-desc" style={{ marginTop: 8 }}>
                        Google AI Studio에서 발급한 API 키는 키만 입력하면 됩니다. 프로젝트 이름/번호는 입력할 필요 없습니다.
                      </p>
                      {testResultGemini && (
                        <div className={`test-result ${testResultGemini.success ? 'success' : 'error'}`} style={{ marginTop: 8 }}>
                          <div className="result-icon">
                            {testResultGemini.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <div className="result-content">
                            <strong>{toDisplayString(testResultGemini.message)}</strong>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* 웰니스 설정 섹션 */}
            <div className="mg-v2-ad-b0kla__card mg-v2-system-config__section">
              <h2 className="mg-v2-ad-b0kla__section-title">
                <Database size={20} />
                웰니스 시스템 설정
              </h2>
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
                  <label htmlFor="targetRoles">대상 역할</label>
                  <input
                    id="targetRoles"
                    type="text"
                    value={wellness.wellnessTargetRoles}
                    onChange={(e) => setWellness((prev) => ({ ...prev, wellnessTargetRoles: e.target.value }))}
                    placeholder="CLIENT,ROLE_CLIENT"
                    className="mg-v2-input"
                  />
                  <small className="help-text">콤마로 구분하여 입력하세요.</small>
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
