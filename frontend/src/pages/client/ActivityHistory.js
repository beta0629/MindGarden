import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import StandardizedApi from '../../utils/standardizedApi';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import AdminCommonLayout from '../../components/layout/AdminCommonLayout';
import ContentArea from '../../components/dashboard-v2/content/ContentArea';
import ContentHeader from '../../components/dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import MGButton from '../../components/common/MGButton';
import SafeText from '../../components/common/SafeText';
import { buildErpMgButtonClassName } from '../../components/erp/common/erpMgButtonProps';
import '../../styles/unified-design-tokens.css';
import '../../components/admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/themes/client-theme.css';
import './ActivityHistory.css';

const ACTIVITY_HISTORY_TITLE_ID = 'client-activity-history-title';

const FILTER_TYPES = ['all', 'consultation', 'payment', 'system'];

/**
 * activityType / type 값을 필터 키(소문자 도메인 키)로 정규화
 * @param {*} raw
 * @returns {string}
 */
function normalizeActivityTypeKey(raw) {
  if (raw == null || raw === '') {
    return '';
  }
  return String(raw).trim().toLowerCase();
}

/**
 * @param {object} activity
 * @returns {string}
 */
function resolveActivityIconClass(activity) {
  const raw = toDisplayString(activity?.icon, '');
  if (!raw || raw === '—') {
    return 'bi-inbox';
  }
  const token = raw.replace(/\s+/g, ' ').trim();
  if (token.startsWith('bi ')) {
    return token.replace(/^bi\s+/i, '');
  }
  if (token.startsWith('bi-')) {
    return token;
  }
  return `bi-${token}`;
}

const ActivityHistory = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: sessionLoading } = useSession();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [statistics, setStatistics] = useState({});

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, sessionLoading, navigate]);

  const loadActivities = useCallback(async() => {
    try {
      setLoading(true);

      const params = {};
      if (filter !== 'all') {
        params.type = filter.toUpperCase();
      }

      const result = await StandardizedApi.get('/api/v1/activities/history', params);

      if (result && result.success) {
        setActivities(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('활동 내역 로드 실패:', result?.message);
        setActivities([]);
      }
    } catch (error) {
      console.error('활동 내역 로드 실패:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadStatistics = useCallback(async() => {
    try {
      const result = await StandardizedApi.get('/api/v1/activities/statistics', {});

      if (result && result.success && result.data && typeof result.data === 'object') {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading || !isLoggedIn) {
      return;
    }
    loadActivities();
    loadStatistics();
  }, [sessionLoading, isLoggedIn, loadActivities, loadStatistics]);

  const getActivityTypeLabel = (type) => {
    const key = String(type || '').toLowerCase();
    const labels = {
      consultation: '상담',
      payment: '결제',
      system: '시스템',
      all: '전체'
    };
    return labels[key] || '기타';
  };

  const getStatusLabel = (status) => {
    const key = String(status || '').toLowerCase();
    const labels = {
      completed: '완료',
      pending: '진행중',
      info: '알림',
      error: '오류',
      failed: '실패'
    };
    return labels[key] || '알 수 없음';
  };

  const getStatusBadgeVariant = (status) => {
    const key = String(status || '').toLowerCase();
    const map = {
      completed: 'success',
      pending: 'warning',
      info: 'info',
      error: 'error',
      failed: 'error'
    };
    return map[key] || 'secondary';
  };

  const filteredActivities = useMemo(() => activities.filter((activity) => {
    if (filter === 'all') {
      return true;
    }
    return normalizeActivityTypeKey(activity.activityType ?? activity.type) === filter;
  }), [activities, filter]);

  const getTimeAgoDisplay = (activity) => {
    const fromApi = activity?.timeAgo;
    if (fromApi != null && String(fromApi).trim() !== '') {
      return toDisplayString(fromApi, '—');
    }
    const created = activity?.createdAt;
    if (created) {
      const activityDate = new Date(created);
      if (!Number.isNaN(activityDate.getTime())) {
        return formatRelativeTime(activityDate);
      }
    }
    const legacy = `${toDisplayString(activity?.date, '')} ${toDisplayString(activity?.time, '')}`.trim();
    if (legacy) {
      const activityDate = new Date(legacy);
      if (!Number.isNaN(activityDate.getTime())) {
        return formatRelativeTime(activityDate);
      }
    }
    return '—';
  };

  const formatActivityDateParts = (activity) => {
    const created = activity?.createdAt;
    if (created) {
      const d = new Date(created);
      if (!Number.isNaN(d.getTime())) {
        return {
          dateLine: d.toLocaleDateString('ko-KR'),
          timeLine: d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        };
      }
    }
    return {
      dateLine: toDisplayString(activity?.date, '—'),
      timeLine: toDisplayString(activity?.time, '—')
    };
  };

  const consultationStat = toSafeNumber(
    statistics.consultation,
    activities.filter((a) => normalizeActivityTypeKey(a.activityType ?? a.type) === 'consultation').length
  );
  const paymentStat = toSafeNumber(
    statistics.payment,
    activities.filter((a) => normalizeActivityTypeKey(a.activityType ?? a.type) === 'payment').length
  );
  const completedStat = toSafeNumber(
    statistics.completed,
    activities.filter((a) => String(a.status || '').toLowerCase() === 'completed').length
  );

  const headerActions = (
    <MGButton
      variant="outline"
      type="button"
      className={buildErpMgButtonClassName({ variant: 'outline', loading: false })}
      onClick={() => navigate('/client/dashboard')}
      preventDoubleClick={false}
    >
      <i className="bi bi-arrow-left" aria-hidden="true" />
      대시보드로
    </MGButton>
  );

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla" data-testid="client-activity-history-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="활동 내역">
          <ContentHeader
            title="활동 내역"
            subtitle="최근 활동과 시스템 알림을 확인하세요."
            titleId={ACTIVITY_HISTORY_TITLE_ID}
            actions={headerActions}
          />
          <main aria-labelledby={ACTIVITY_HISTORY_TITLE_ID} className="activity-history-main">
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  if (sessionLoading) {
    return (
      <AdminCommonLayout title="활동 내역" className="mg-v2-dashboard-layout">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="준비 중..." />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <AdminCommonLayout title="활동 내역" className="mg-v2-dashboard-layout">
      {pageShell(
        <div className="activity-history-inner">
          {loading ? (
            <div
              className="activity-history-loading"
              aria-busy="true"
              aria-live="polite"
            >
              <UnifiedLoading type="inline" text="활동 내역을 불러오는 중..." />
            </div>
          ) : (
            <>
              <div className="activity-history-filters" role="toolbar" aria-label="활동 유형 필터">
                <div className="activity-history-filter-group" role="group">
                  {FILTER_TYPES.map((type) => (
                    <MGButton
                      key={type}
                      variant={filter === type ? 'primary' : 'outline'}
                      type="button"
                      className={buildErpMgButtonClassName({
                        variant: filter === type ? 'primary' : 'outline',
                        loading: false,
                        className: 'activity-history-filter-btn'
                      })}
                      onClick={() => setFilter(type)}
                      preventDoubleClick={false}
                    >
                      {getActivityTypeLabel(type)}
                    </MGButton>
                  ))}
                </div>
              </div>

              <div className="activity-history-list">
                {filteredActivities.length > 0 ? (
                  <div className="activity-history-list-inner">
                    {filteredActivities.map((activity, index) => {
                      const iconSuffix = resolveActivityIconClass(activity);
                      const { dateLine, timeLine } = formatActivityDateParts(activity);
                      const rowKey = activity.id != null ? `activity-${activity.id}` : `activity-idx-${index}`;
                      return (
                        <div
                          key={rowKey}
                          className={`activity-history-item ${index < filteredActivities.length - 1 ? '' : 'last'}`}
                        >
                          <div className="activity-history-icon" aria-hidden="true">
                            <i className={`bi ${iconSuffix}`} />
                          </div>

                          <div className="activity-history-content">
                            <div className="activity-history-row-head">
                              <div className="activity-history-title">
                                <SafeText>{activity.title}</SafeText>
                              </div>
                              <span
                                className={`activity-history-badge mg-v2-badge ${getStatusBadgeVariant(activity.status)}`}
                              >
                                {getStatusLabel(activity.status)}
                              </span>
                            </div>

                            <p className="activity-history-description">
                              <SafeText>{activity.description}</SafeText>
                            </p>

                            <div className="activity-history-footer">
                              <span>
                                <i className="bi bi-calendar3" aria-hidden="true" />
                                <SafeText>{dateLine}</SafeText>
                              </span>
                              <span>
                                <i className="bi bi-clock" aria-hidden="true" />
                                <SafeText>{timeLine}</SafeText>
                              </span>
                              <span>
                                <i className="bi bi-hourglass-split" aria-hidden="true" />
                                <SafeText>{getTimeAgoDisplay(activity)}</SafeText>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="activity-history-empty">
                    <i className="bi bi-inbox activity-history-empty-icon" aria-hidden="true" />
                    <h3 className="activity-history-empty-title">활동 내역이 없습니다</h3>
                    <p className="activity-history-empty-description">
                      선택한 조건에 해당하는 활동이 없습니다.
                    </p>
                  </div>
                )}
              </div>

              <div className="activity-history-stats">
                <div className="activity-history-stat activity-history-stat--accent">
                  <div className="activity-history-stat-title activity-history-stat-title--primary">
                    {consultationStat}
                  </div>
                  <p className="activity-history-stat-description">상담 관련</p>
                </div>
                <div className="activity-history-stat activity-history-stat--muted">
                  <div className="activity-history-stat-title activity-history-stat-title--secondary">
                    {paymentStat}
                  </div>
                  <p className="activity-history-stat-description">결제 관련</p>
                </div>
                <div className="activity-history-stat activity-history-stat--success">
                  <div className="activity-history-stat-title activity-history-stat-title--success">
                    {completedStat}
                  </div>
                  <p className="activity-history-stat-description">완료된 활동</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AdminCommonLayout>
  );
};

/**
 * @param {Date} activityDate
 * @returns {string}
 */
function formatRelativeTime(activityDate) {
  const now = new Date();
  const diffMs = now - activityDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '오늘';
  }
  if (diffDays === 1) {
    return '1일 전';
  }
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }
  if (diffDays < 30) {
    return `${Math.floor(diffDays / 7)}주 전`;
  }
  return `${Math.floor(diffDays / 30)}개월 전`;
}

export default ActivityHistory;
