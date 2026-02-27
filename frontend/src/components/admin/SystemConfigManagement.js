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
import Button from '../ui/Button';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './SystemConfigManagement.css';

const AI_PROVIDERS = [
  { id: 'openai', label: 'OpenAI', keyPrefix: 'OPENAI', defaultUrl: 'https://api.openai.com/v1/chat/completions', defaultModel: 'gpt-3.5-turbo' },
  { id: 'gemini', label: 'Gemini', keyPrefix: 'GEMINI', defaultUrl: '', defaultModel: '' },
  { id: 'claude', label: 'Claude', keyPrefix: 'CLAUDE', defaultUrl: '', defaultModel: 'claude-3-5-sonnet-20241022' },
  { id: 'replicate', label: 'Replicate', keyPrefix: 'REPLICATE', defaultUrl: '', defaultModel: '' }
];

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

  const loadConfigs = useCallback(async () => {
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
    } catch (error) {
      console.error('설정 로드 실패:', error);
      notificationManager.show('설정을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSave = async () => {
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

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const response = await apiPost('/api/v1/admin/wellness/test', {
        dayOfWeek: 1,
        season: 'SPRING',
        category: 'MENTAL'
      });
      if (response.success) {
        setTestResult({ success: true, message: 'API 테스트 성공!', content: response.data });
      } else {
        setTestResult({ success: false, message: response.message || 'API 테스트 실패' });
      }
    } catch (error) {
      console.error('API 테스트 실패:', error);
      setTestResult({ success: false, message: 'API 테스트 중 오류가 발생했습니다.' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AdminCommonLayout title="시스템 설정 관리">
        <div className="mg-v2-ad-b0kla mg-v2-system-config-management">
          <div className="mg-v2-ad-b0kla__container">
            <UnifiedLoading type="page" text="설정을 불러오는 중..." variant="pulse" />
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
                <button
                  type="button"
                  className="mg-v2-mapping-header-btn mg-v2-mapping-header-btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                  title="설정 저장"
                >
                  {saving ? <RefreshCw size={20} className="mg-spinning" /> : <Save size={20} />}
                  {saving ? '저장 중...' : '설정 저장'}
                </button>
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
                      <span>{p.label}</span>
                    </label>
                  ))}
                  {AI_PROVIDERS.every((p) => !(providers[p.id]?.apiKey || '').trim()) && (
                    <p className="mg-v2-system-config__radio-empty">API 키가 등록된 프로바이더가 없습니다. 아래에서 한 개 이상 등록 후 선택할 수 있습니다.</p>
                  )}
                </div>
              </div>

              {AI_PROVIDERS.map(({ id, label, keyPrefix, defaultUrl }) => (
                <div key={id} className="mg-v2-ad-b0kla__card mg-v2-system-config__provider-card">
                  <h3 className="mg-v2-system-config__provider-title">{label}</h3>
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
                        <Button type="button" variant="secondary" size="medium" onClick={() => toggleShowApiKey(id)} preventDoubleClick={false}>
                          {showApiKey[id] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                      <small className="help-text"><Shield size={14} /> API 키는 암호화되어 저장됩니다.</small>
                    </div>
                    <div className="config-item">
                      <label htmlFor={`apiUrl-${id}`}>API URL</label>
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
                        <option value="gpt-3.5-turbo" />
                        <option value="gpt-4" />
                        <option value="gpt-4o" />
                        <option value="claude-3-5-sonnet-20241022" />
                        <option value="gemini-1.5-pro" />
                      </datalist>
                    </div>
                  </div>
                  {id === 'openai' && (
                    <>
                      <div className="section-actions">
                        <Button
                          variant="secondary"
                          size="medium"
                          onClick={handleTest}
                          disabled={testing || !(providers.openai?.apiKey)}
                          loading={testing}
                          loadingText="테스트 중..."
                          preventDoubleClick={false}
                        >
                          {testing ? <RefreshCw size={16} className="mg-spinning" /> : <CheckCircle size={16} />}
                          API 테스트
                        </Button>
                      </div>
                      {testResult && (
                        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                          <div className="result-icon">
                            {testResult.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                          </div>
                          <div className="result-content">
                            <strong>{testResult.message}</strong>
                            {testResult.content?.content && (
                              <div className="result-preview">
                                <strong>생성된 컨텐츠:</strong>
                                <div dangerouslySetInnerHTML={{ __html: testResult.content.content }} />
                              </div>
                            )}
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
