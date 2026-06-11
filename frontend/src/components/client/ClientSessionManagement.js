import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/ajax';
import { redirectToDynamicDashboard } from '../../utils/dashboardUtils';
import { sessionManager } from '../../utils/sessionManager';
import { useSession } from '../../contexts/SessionContext';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import UnifiedLoading from '../common/UnifiedLoading';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ClientSessionManagement.css';
import notificationManager from '../../utils/notification';
import {
  isApiGetNullFailure,
  normalizeMappingsListPayload,
  normalizeScheduleListPayload
} from '../../utils/apiResponseNormalize';
import { calculateClientSessionTotalsFromMappings } from '../../utils/clientSessionTotals';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

// T5 표준화 2026-05-21: API 경로 리터럴 → 로컬 상수 (운영 게이트 P0)
// B6 묶음 B 2026-06-12: API_AUTH_CURRENT_USER 제거 — useSession().user 직접 사용으로 dedup
const MAPPINGS_FETCH_ERROR_TEXT = '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';

const CLIENT_SESSION_MGMT_TITLE_ID = 'client-session-management-title';

const ClientSessionManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // B6 묶음 B 2026-06-12: useSession().user 직접 사용 — current-user 별도 fetch 제거.
  // hasCheckedSession 가드를 통해 세션 확인 완료 전 호출을 막아 빈 데이터 표시를 방지한다.
  const { user, hasCheckedSession } = useSession();
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryLoading, setRetryLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!hasCheckedSession) {
      return;
    }
    loadSessionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCheckedSession, user?.id]);

  const loadSessionData = async(opts = {}) => {
    const fromErrorRetry = opts.fromErrorRetry === true;
    try {
      if (fromErrorRetry) {
        setRetryLoading(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Context user 사용 — 별도 /api/v1/auth/current-user 호출 없음.
      if (!user || !user.id) {
        throw new Error(i18n.t('error:client.ClientSessionManagement.t_5271ee34'));
      }

      const userId = user.id;
      // 표준화 2025-12-08: /api/v1/admin 경로로 통일
      const mappingsResponse = await apiGet(`/api/v1/admin/mappings/client?clientId=${userId}`);
      if (isApiGetNullFailure(mappingsResponse)) {
        throw new Error(MAPPINGS_FETCH_ERROR_TEXT);
      }
      const mappings = normalizeMappingsListPayload(mappingsResponse);

      const schedulesResponse = await apiGet(`/api/v1/schedules?userId=${userId}&userRole=CLIENT`);
      const schedules = normalizeScheduleListPayload(schedulesResponse);

      // SSOT 핫픽스 2026-05-26 (P1-C): 회기 카운트는 mapping SSOT (totalSessions/usedSessions/
      // remainingSessions) 직접 합산. 이전 구현은 schedules.filter(s => s.status === '완료').length
      // 였으나 백엔드 Schedule.status enum (COMPLETED) 과 한글 '완료' 가 항상 불일치하여 0 반환,
      // 또한 mapping SSOT 를 우회하므로 BOOKED → CANCELLED → 복원 시나리오에서 화면 카운트가 깨졌다.
      const sessionTotals = calculateClientSessionTotalsFromMappings(mappings);

      setSessionData({
        totalSessions: sessionTotals.totalSessions,
        usedSessions: sessionTotals.usedSessions,
        remainingSessions: sessionTotals.remainingSessions,
        mappings: mappings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        schedules: schedules.sort((a, b) => new Date(b.date) - new Date(a.date))
      });

    } catch (err) {
      console.error('회기 데이터 로드 실패:', err);
      setError(err.message || '회기 데이터를 불러오는데 실패했습니다.');
    } finally {
      if (fromErrorRetry) {
        setRetryLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleMenuAction = async(action) => {
    setIsMenuOpen(false);
    switch (action) {
      case 'dashboard':
        const authResponse = {
          user: user,
          currentTenantRole: sessionManager.getCurrentTenantRole()
        };
        await redirectToDynamicDashboard(authResponse, navigate);
        break;
      case 'session-management':
        navigate('/client/session-management');
        break;
      case 'payment-history':
        navigate('/client/payment-history');
        break;
      case 'consultation-guide':
        notificationManager.show('상담 가이드 페이지는 준비 중입니다.', 'info');
        break;
      default:
        break;
    }
  };

  const handleHamburgerClick = (isOpen) => {
    setIsMenuOpen(isOpen);
  };

  const getStatusText = (isCompleted) => {
    return isCompleted ? '완료' : '예정';
  };

  const getStatusColor = (isCompleted) => {
    return isCompleted ? 'var(--mg-success-500)' : 'var(--mg-warning-500)';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '알 수 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla" data-testid="client-session-management-page">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="회기 관리">
          <ContentHeader
            title={t('common:client.ClientSessionManagement.t_be89c264')}
            subtitle="상담 회기 현황과 사용 내역을 확인하세요"
            titleId={CLIENT_SESSION_MGMT_TITLE_ID}
          />
          <main aria-labelledby={CLIENT_SESSION_MGMT_TITLE_ID}>
            {body}
          </main>
        </ContentArea>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <AdminCommonLayout title={t('common:client.ClientSessionManagement.t_be89c264')} className="mg-v2-dashboard-layout">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text={t('common:client.ClientSessionManagement.t_0810a0e8')} />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (error) {
    return (
      <AdminCommonLayout title={t('common:client.ClientSessionManagement.t_be89c264')} className="mg-v2-dashboard-layout">
        {pageShell(
          <div className="client-session-management">
            <div className="error-container">
              <div className="error-icon">
                <i className="bi bi-exclamation-triangle" />
              </div>
              <h3>{t('common:client.ClientSessionManagement.t_11d2f578')}</h3>
              <p>{error}</p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', loading: retryLoading })}
                onClick={() => loadSessionData({ fromErrorRetry: true })}
                loading={retryLoading}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
              >
                {t('common.labels.retry')}
              </MGButton>
            </div>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  if (!sessionData || sessionData.mappings.length === 0) {
    return (
      <AdminCommonLayout title={t('common:client.ClientSessionManagement.t_be89c264')} className="mg-v2-dashboard-layout">
        {pageShell(
          <div className="client-session-management">
            <div className="no-data-container">
              <div className="no-data-icon">
                <i className="bi bi-calendar-check" />
              </div>
              <h3>{t('common:client.ClientSessionManagement.t_b7ad4ec9')}</h3>
              <p>{t('common:client.ClientSessionManagement.t_39d9cc39')}</p>
              <MGButton
                variant="primary"
                className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                onClick={() => navigate('/client/wellness')}
                preventDoubleClick={false}
              >
                {t('common:client.ClientSessionManagement.t_9bc94122')}
              </MGButton>
            </div>
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title={t('common:client.ClientSessionManagement.t_be89c264')} className="mg-v2-dashboard-layout">
      {pageShell(
        <div className="client-session-management">
        {/* 햄버거 메뉴 드롭다운 */}
        {isMenuOpen && (
          <div className="client-session-menu-dropdown">
            <div className="client-session-menu-content">
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-session-menu-item`}
                onClick={() => handleMenuAction('dashboard')}
                preventDoubleClick={false}
              >
                <i className="bi bi-house client-session-menu-icon" />
                {t('admin.labels.dashboard')}
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-session-menu-item`}
                onClick={() => handleMenuAction('session-management')}
                preventDoubleClick={false}
              >
                <i className="bi bi-clock-history client-session-menu-icon" />
                {t('common:client.ClientSessionManagement.t_be89c264')}
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-session-menu-item`}
                onClick={() => handleMenuAction('payment-history')}
                preventDoubleClick={false}
              >
                <i className="bi bi-credit-card client-session-menu-icon" />
                {t('common:client.ClientSessionManagement.t_42e677b1')}
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-session-menu-item`}
                onClick={() => handleMenuAction('consultation-guide')}
                preventDoubleClick={false}
              >
                <i className="bi bi-book client-session-menu-icon" />
                {t('common:client.ClientSessionManagement.t_52ae8856')}
              </MGButton>
            </div>
          </div>
        )}

        {/* 요약 카드 */}
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="card-icon">
              <i className="bi bi-calendar-check" />
            </div>
            <div className="card-content">
              <h3>{t('common:client.ClientSessionManagement.t_7a0890a2')}</h3>
              <p className="number">{sessionData.totalSessions}</p>
              <span className="unit">{t('common:client.ClientSessionManagement.t_2fc05c02')}</span>
            </div>
          </div>

          <div className="summary-card used">
            <div className="card-icon">
              <i className="bi bi-check-circle" />
            </div>
            <div className="card-content">
              <h3>{t('common:client.ClientSessionManagement.t_5ed8ec73')}</h3>
              <p className="number">{sessionData.usedSessions}</p>
              <span className="unit">{t('common:client.ClientSessionManagement.t_2fc05c02')}</span>
            </div>
          </div>

          <div className="summary-card remaining">
            <div className="card-icon">
              <i className="bi bi-clock" />
            </div>
            <div className="card-content">
              <h3>{t('common:client.ClientSessionManagement.t_e9792c10')}</h3>
              <p className="number">{sessionData.remainingSessions}</p>
              <span className="unit">{t('common:client.ClientSessionManagement.t_2fc05c02')}</span>
            </div>
          </div>
        </div>

        {/* 진행률 표시 */}
        <div className="progress-section">
          <div className="progress-header">
            <span>{t('common:client.ClientSessionManagement.t_621164fa')}</span>
            <span className="progress-percentage">
              {sessionData.totalSessions > 0 
                ? Math.round((sessionData.usedSessions / sessionData.totalSessions) * 100)
                : 0}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{
                '--progress-width': sessionData.totalSessions > 0 
                  ? `${(sessionData.usedSessions / sessionData.totalSessions) * 100}%`
                  : '0%'
              }}
             />
          </div>
        </div>

        {/* 패키지 정보 */}
        <div className="package-info">
          <div className="package-info-content">
            {sessionData.mappings.map((mapping, index) => (
              <div key={mapping.id || index} className="package-card">
                <div className="package-card-header">
                  <div className="package-card-header-left">
                    <i className="bi bi-person package-card-icon" />
                    <span className="package-card-title">상담사: {mapping.consultant?.consultantName || '미지정'}</span>
                  </div>
                  <span className={`package-card-status ${mapping.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
                    {mapping.status === 'ACTIVE' ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="package-card-content">
                  <div className="detail-item">
                    <span className="label">{t('common:client.ClientSessionManagement.t_7a0890a2')}</span>
                    <span className="value">{mapping.totalSessions}회</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">{t('common:client.ClientSessionManagement.t_7f3ba385')}</span>
                    <span className="value">{mapping.usedSessions || 0}회</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">{t('common:client.ClientSessionManagement.t_e9792c10')}</span>
                    <span className="value">{mapping.remainingSessions || 0}회</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">{t('common.labels.consultant')}</span>
                    <span className="value">{mapping.consultant?.consultantName || '미지정'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">{t('common:client.ClientSessionManagement.t_851081d2')}</span>
                    <span className="value">
                      {mapping.createdAt ? formatDate(mapping.createdAt) : '알 수 없음'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 상담 일정 */}
        <div className="consultation-history">
          <h3>
            <i className="bi bi-calendar3 mg-color-primary" />
            {t('common:client.ClientSessionManagement.t_47ff87a2')}
          </h3>
          {sessionData.schedules && sessionData.schedules.length > 0 ? (
            <div className="consultation-list">
              {sessionData.schedules.slice(0, 5).map((schedule, index) => (
                <div key={schedule.id || index} className="consultation-item">
                  <div className="consultation-header">
                    <div className="consultation-date">
                      <i className="bi bi-calendar3" />
                      {formatDate(schedule.date)}
                    </div>
                    <div className="consultation-status">
                      {getStatusText(schedule.status === '완료')}
                    </div>
                  </div>
                  <div className="consultation-content">
                    <div className="consultation-title">
                      <i className="bi bi-chat-dots" />
                      {schedule.title || '상담'}
                    </div>
                    <div className="consultation-details">
                      <div className="consultation-duration">
                        <i className="bi bi-clock" />
                        {schedule.startTime} - {schedule.endTime}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-consultations">
              <i className="bi bi-calendar-x" />
              <p>{t('common:client.ClientSessionManagement.t_f4226e93')}</p>
            </div>
          )}
        </div>
        </div>
      )}
    </AdminCommonLayout>
  );
};

export default ClientSessionManagement;
