/**
 * AI 프로바이더 관리 페이지 — `/admin/system/ai-providers`.
 *
 * 디자이너 핸드오프: docs/project-management/2026-05-24/AI_PROVIDER_MGMT_DESIGN_HANDOFF.md.
 * 트랙 B PR-4 (2026-05-24).
 *
 * 구성 (디자이너 §3 와이어):
 *   - §1 ActiveProviderCard          (좌측 상단)
 *   - §2 ProviderSelector            (좌측 하단)
 *   - §3 ApiKeyManager               (우측 컬럼)
 *   - §4 UsageStatsDashboard         (하단 전체)
 *   - §5 UsageLogsTable              (하단 전체)
 *
 * 멀티테넌트: 모든 API 호출은 StandardizedApi 경유 (X-Tenant-Id 자동 부착).
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../../../utils/ajax';
import { getAiProviderHealth } from '../../../api/admin/aiHealthApi';
import { getAiUsageLogs, getAiUsageStats } from '../../../api/admin/aiUsageApi';
import { useSession } from '../../../contexts/SessionContext';
import { USER_ROLES } from '../../../constants/roles';
import notificationManager from '../../../utils/notification';
import AdminCommonLayout from '../../layout/AdminCommonLayout';
import ContentArea from '../../dashboard-v2/content/ContentArea';
import ContentHeader from '../../dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../../common/UnifiedLoading';
import useMediaQuery from '../../../hooks/useMediaQuery';
import ActiveProviderCard from './sections/ActiveProviderCard';
import ProviderSelector from './sections/ProviderSelector';
import ApiKeyManager from './sections/ApiKeyManager';
import UsageStatsDashboard from './sections/UsageStatsDashboard';
import UsageLogsTable from './sections/UsageLogsTable';
import { AI_PROVIDER_OPTIONS } from './constants';
import '../../../styles/unified-design-tokens.css';
import './AiProviderManagementPage.css';

const API_AI_DEFAULT_PROVIDER = '/api/v1/admin/system-config/ai-default-provider';
const API_SYSTEM_CONFIG_PREFIX = '/api/v1/admin/system-config';
const DEFAULT_LOG_PAGE_SIZE = UsageLogsTable.DEFAULT_PAGE_SIZE;
const DESKTOP_MIN_WIDTH = '(min-width: 1024px)';

const initialProviderForm = (provider) => ({
  apiKey: '',
  apiUrl: '',
  model: provider.defaultModel || ''
});

const getConfigValue = (response) =>
  response && response.success ? (response.configValue || '') : '';

const AiProviderManagementPage = () => {
  const { user, isLoggedIn } = useSession();
  const isDesktop = useMediaQuery(DESKTOP_MIN_WIDTH);

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [savingActiveProvider, setSavingActiveProvider] = useState(false);

  const [providers, setProviders] = useState(() =>
    AI_PROVIDER_OPTIONS.reduce((acc, p) => {
      acc[p.id] = initialProviderForm(p);
      return acc;
    }, {})
  );
  const [activeProvider, setActiveProvider] = useState('openai');

  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(null);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  const [logsPage, setLogsPage] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [logFilters, setLogFilters] = useState({
    provider: '',
    caller: '',
    status: '',
    page: 0,
    size: DEFAULT_LOG_PAGE_SIZE
  });

  // ---- 데이터 로드 ----

  const loadProviderConfigs = useCallback(async() => {
    const requests = [];
    AI_PROVIDER_OPTIONS.forEach((p) => {
      requests.push(
        apiGet(`${API_SYSTEM_CONFIG_PREFIX}/${p.keyPrefix}_API_KEY`).catch(() => null),
        apiGet(`${API_SYSTEM_CONFIG_PREFIX}/${p.keyPrefix}_API_URL`).catch(() => null),
        apiGet(`${API_SYSTEM_CONFIG_PREFIX}/${p.keyPrefix}_MODEL`).catch(() => null)
      );
    });
    const responses = await Promise.all(requests);
    const next = {};
    AI_PROVIDER_OPTIONS.forEach((p, idx) => {
      const offset = idx * 3;
      next[p.id] = {
        apiKey: getConfigValue(responses[offset]),
        apiUrl: getConfigValue(responses[offset + 1]),
        model: getConfigValue(responses[offset + 2]) || p.defaultModel || ''
      };
    });
    setProviders(next);

    try {
      const defaultProviderRes = await apiGet(API_AI_DEFAULT_PROVIDER);
      if (defaultProviderRes?.success && defaultProviderRes.providerId) {
        setActiveProvider(defaultProviderRes.providerId);
      }
    } catch (e) {
      console.warn('기본 AI provider 조회 실패:', e?.message);
    }
  }, []);

  const refreshHealth = useCallback(async() => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const result = await getAiProviderHealth();
      setHealth(result);
    } catch (e) {
      console.error('AI 헬스체크 실패:', e);
      setHealth(null);
      setHealthError(e?.message || 'AI 헬스체크에 실패했습니다.');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async() => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const result = await getAiUsageStats('month');
      setStats(result);
    } catch (e) {
      console.error('AI 사용 통계 조회 실패:', e);
      setStats(null);
      setStatsError(e?.message || 'AI 사용 통계를 불러오지 못했습니다.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const refreshLogs = useCallback(async(nextFilters) => {
    const params = nextFilters || logFilters;
    setLogsLoading(true);
    setLogsError(null);
    try {
      const result = await getAiUsageLogs(params);
      setLogsPage(result);
    } catch (e) {
      console.error('AI 호출 로그 조회 실패:', e);
      setLogsPage(null);
      setLogsError(e?.message || 'AI 호출 로그를 불러오지 못했습니다.');
    } finally {
      setLogsLoading(false);
    }
  }, [logFilters]);

  const initialize = useCallback(async() => {
    setLoading(true);
    try {
      await Promise.all([
        loadProviderConfigs(),
        refreshHealth(),
        refreshStats(),
        refreshLogs(logFilters)
      ]);
    } finally {
      setLoading(false);
    }
    // logFilters 는 초기값만 사용 — 이후 필터 변경 시 별도 effect 가 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProviderConfigs, refreshHealth, refreshStats, refreshLogs]);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      notificationManager.show('로그인이 필요합니다.', 'error');
      setLoading(false);
      return;
    }
    const allowedRoles = [USER_ROLES.ADMIN, USER_ROLES.STAFF];
    if (!allowedRoles.includes(user.role)) {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      setLoading(false);
      return;
    }
    initialize();
    // initialize 는 useCallback 으로 안정화 — 의존성에 user 추가 시 무한 루프 위험
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

  // ---- 인터랙션 ----

  const handleSelectProvider = useCallback(async(providerId) => {
    if (savingActiveProvider || providerId === activeProvider) {
      return;
    }
    setSavingActiveProvider(true);
    try {
      const response = await apiPost(API_AI_DEFAULT_PROVIDER, { providerId });
      if (response?.success === false) {
        throw new Error(response.message || '기본 프로바이더 변경 실패');
      }
      setActiveProvider(providerId);
      notificationManager.show('활성 AI 프로바이더가 변경되었습니다.', 'success');
      refreshHealth();
    } catch (e) {
      console.error('활성 provider 변경 실패:', e);
      const backendMsg = e?.response?.data?.message || e?.data?.message;
      notificationManager.show(backendMsg || e?.message || '활성 프로바이더 변경에 실패했습니다.', 'error');
    } finally {
      setSavingActiveProvider(false);
    }
  }, [activeProvider, refreshHealth, savingActiveProvider]);

  const handleSaveProviderKey = useCallback(async(providerId, form) => {
    const opt = AI_PROVIDER_OPTIONS.find((p) => p.id === providerId);
    if (!opt) {
      return;
    }
    setSavingKey(true);
    try {
      await Promise.all([
        apiPost(`${API_SYSTEM_CONFIG_PREFIX}/${opt.keyPrefix}_API_KEY`, {
          configValue: (form.apiKey || '').trim(),
          description: `${opt.keyPrefix} API 키`,
          category: 'AI'
        }),
        apiPost(`${API_SYSTEM_CONFIG_PREFIX}/${opt.keyPrefix}_API_URL`, {
          configValue: (form.apiUrl || '').trim(),
          description: `${opt.keyPrefix} API URL`,
          category: 'AI'
        }),
        apiPost(`${API_SYSTEM_CONFIG_PREFIX}/${opt.keyPrefix}_MODEL`, {
          configValue: (form.model || '').trim(),
          description: `${opt.keyPrefix} 모델`,
          category: 'AI'
        })
      ]);
      setProviders((prev) => ({
        ...prev,
        [providerId]: {
          apiKey: (form.apiKey || '').trim(),
          apiUrl: (form.apiUrl || '').trim(),
          model: (form.model || '').trim() || opt.defaultModel || ''
        }
      }));
      notificationManager.show(`${opt.label} API 키가 저장되었습니다.`, 'success');
      refreshHealth();
    } catch (e) {
      console.error('API 키 저장 실패:', e);
      const backendMsg = e?.response?.data?.message || e?.data?.message;
      notificationManager.show(backendMsg || e?.message || 'API 키 저장에 실패했습니다.', 'error');
      throw e;
    } finally {
      setSavingKey(false);
    }
  }, [refreshHealth]);

  const handleDeleteProviderKey = useCallback(async(providerId) => {
    await handleSaveProviderKey(providerId, { apiKey: '', apiUrl: '', model: '' });
  }, [handleSaveProviderKey]);

  const handleFiltersChange = useCallback((nextFilters) => {
    setLogFilters(nextFilters);
    refreshLogs(nextFilters);
  }, [refreshLogs]);

  const handleLogPageChange = useCallback((nextPage) => {
    const updated = { ...logFilters, page: nextPage };
    setLogFilters(updated);
    refreshLogs(updated);
  }, [logFilters, refreshLogs]);

  const callerOptions = useMemo(() => {
    const set = new Set();
    Object.keys(stats?.callsByCaller || {}).forEach((c) => set.add(c));
    (logsPage?.content || []).forEach((row) => {
      if (row.requestType) {
        set.add(row.requestType);
      }
    });
    return Array.from(set).sort();
  }, [stats, logsPage]);

  // ---- 렌더 ----

  if (loading) {
    return (
      <AdminCommonLayout title="AI 프로바이더 관리">
        <div className="mg-v2-ad-b0kla mg-ai-provider-page">
          <div className="mg-v2-ad-b0kla__container" aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="AI 프로바이더 정보를 불러오는 중..." variant="pulse" />
          </div>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="AI 프로바이더 관리">
      <div className="mg-v2-ad-b0kla mg-ai-provider-page">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="AI 프로바이더 관리">
            <ContentHeader
              title="AI 프로바이더 관리"
              subtitle="시스템의 AI 제공자 및 API 키를 관리합니다."
            />

            <div
              className={[
                'mg-ai-provider-page__grid',
                isDesktop ? 'mg-ai-provider-page__grid--desktop' : 'mg-ai-provider-page__grid--mobile'
              ].join(' ')}
            >
              <div className="mg-ai-provider-page__column">
                <ActiveProviderCard
                  health={health}
                  loading={healthLoading}
                  error={healthError}
                  onRefresh={refreshHealth}
                />
                <ProviderSelector
                  activeProvider={activeProvider}
                  health={health}
                  healthLoading={healthLoading}
                  providers={providers}
                  saving={savingActiveProvider}
                  onSelect={handleSelectProvider}
                />
              </div>
              <div className="mg-ai-provider-page__column">
                <ApiKeyManager
                  providers={providers}
                  saving={savingKey}
                  onSaveProviderKey={handleSaveProviderKey}
                  onDeleteProviderKey={handleDeleteProviderKey}
                />
              </div>
            </div>

            <UsageStatsDashboard
              stats={stats}
              loading={statsLoading}
              error={statsError}
              onRefresh={refreshStats}
            />

            <UsageLogsTable
              logsPage={logsPage}
              loading={logsLoading}
              error={logsError}
              filters={logFilters}
              callerOptions={callerOptions}
              onFiltersChange={handleFiltersChange}
              onPageChange={handleLogPageChange}
              onRefresh={() => refreshLogs(logFilters)}
            />
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default AiProviderManagementPage;
