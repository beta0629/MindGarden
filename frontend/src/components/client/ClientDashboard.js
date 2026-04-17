import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import { WIDGET_CONSTANTS } from '../../constants/widgetConstants';
import { sessionManager } from '../../utils/sessionManager';
import { apiGet } from '../../utils/ajax';
import { DASHBOARD_API } from '../../constants/api';
import {
  isApiGetNullFailure,
  normalizeMappingsListPayload,
  normalizeScheduleListPayload
} from '../../utils/apiResponseNormalize';
import notificationManager from '../../utils/notification';
import {
  Calendar,
  CalendarDays,
  MessageCircle,
  User,
  Heart,
  Bell,
  Headphones,
  BookOpen
} from 'lucide-react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader, ContentKpiRow } from '../dashboard-v2/content';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import ClientPersonalizedMessages from '../dashboard/ClientPersonalizedMessages';
import ClientPaymentSessionsSection from '../dashboard/ClientPaymentSessionsSection';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/dashboard-tokens-extension.css';
import '../../styles/themes/client-theme.css';
import SafeText from '../common/SafeText';
import { toDisplayString, toSafeNumber } from '../../utils/safeDisplay';
import './ClientDashboard.css';

const CLIENT_DASHBOARD_TITLE_ID = 'client-dashboard-page-title';

const CLIENT_DASHBOARD_QUICK_MENU_SECTION_TEST_ID = 'client-dashboard-quick-menu-section';
const CLIENT_DASHBOARD_UPCOMING_SCHEDULE_TEST_ID = 'client-dashboard-upcoming-schedule';
const CLIENT_DASHBOARD_KPI_SECTION_TEST_ID = 'client-dashboard-kpi-section';

const CLIENT_EYEBROW_TEXT = '내담자 홈';
const CLIENT_WELCOME_LEDE =
  '오늘의 상담과 일정을 한눈에 확인하고, 다음 할 일로 바로 이동하세요.';

const CLIENT_NEXT_SECTION_TITLE = '다음 액션 · 일정';
const CLIENT_NEXT_SECTION_DESC = '우선 처리할 일과 가까운 일정만 요약합니다.';
const CLIENT_SCHEDULE_EMPTY_BODY =
  '예정된 상담·일정이 없을 때는 여기에 표시됩니다. 일정을 확인하려면 아래 버튼을 눌러 주세요.';
const CLIENT_SCHEDULE_VIEW_LABEL = '일정 보기';

const CLIENT_KPI_SECTION_TITLE = '핵심 지표';
const CLIENT_KPI_SECTION_DESC = '회기·이번 달 일정·새 메시지를 요약합니다.';

const CLIENT_CORE_SECTION_TITLE = '핵심 블록';
const CLIENT_CORE_SECTION_DESC = '상담 진행·기록·메시지 등 주요 영역 요약';

const CLIENT_PAYMENT_SECTION_TITLE = '결제 요약';
const CLIENT_PAYMENT_SECTION_DESC = '최근 청구·납부 상태를 한눈에';

const CLIENT_QUICK_SECTION_TITLE = '빠른 메뉴';
const CLIENT_QUICK_SECTION_DESC = '자주 찾는 기능으로 이동';

const CUSTOMER_SUPPORT_TOAST =
  '고객센터 문의는 앱 내 메시지 또는 설정의 안내를 이용해 주세요.';

/** ISO 날짜·시간 문자열 기준 정렬용 */
function scheduleSortKey(s) {
  const d = s?.date || '';
  const t = s?.startTime || '00:00';
  return `${d}T${t}`;
}

function formatScheduleCardDateTime(schedule) {
  if (!schedule?.date) return '—';
  const d = new Date(schedule.date);
  if (Number.isNaN(d.getTime())) return '—';
  const w = d.toLocaleDateString('ko-KR', { weekday: 'short' });
  const md = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  const time = schedule.startTime ? String(schedule.startTime) : '';
  return time ? `${md} (${w}) ${time}` : `${md} (${w})`;
}

function parseUnreadCountPayload(raw) {
  if (raw == null) return 0;
  if (typeof raw === 'object' && typeof raw.unreadCount === 'number') {
    return raw.unreadCount;
  }
  return 0;
}

/**
 * 내담자 대시보드 — 와이어프레임 단일 컬럼 구조
 */
const ClientDashboard = ({ user: userFromRoute }) => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading: sessionLoading, checkSession } = useSession();

  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();

  useEffect(() => {
    let isMounted = true;

    const checkAndRestoreSession = async() => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauth = urlParams.get('oauth');

      if (oauth === 'success') {
        const userInfo = {
          id: parseInt(urlParams.get('userId')) || 0,
          email: urlParams.get('email') || '',
          name: decodeURIComponent(urlParams.get('name') || ''),
          nickname: decodeURIComponent(urlParams.get('nickname') || ''),
          role: urlParams.get('role') || 'CLIENT',
          profileImageUrl: decodeURIComponent(urlParams.get('profileImage') || ''),
          provider: urlParams.get('provider') || 'UNKNOWN'
        };

        sessionManager.setUser(userInfo, {
          accessToken: 'oauth2_token',
          refreshToken: 'oauth2_refresh_token'
        });

        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        if (isMounted) {
          await checkSession(true);
        }
        return;
      }

      const storedUser = localStorage.getItem('userInfo');

      if (storedUser) {
        try {
          const userInfo = JSON.parse(storedUser);

          sessionManager.setUser(userInfo, {
            accessToken: userInfo.accessToken || 'local_token',
            refreshToken: userInfo.refreshToken || 'local_refresh_token'
          });

          if (isMounted) {
            await checkSession(true);
          }
          return;
        } catch (error) {
          console.error('❌ localStorage 사용자 정보 파싱 실패:', error);
        }
      }
    };

    if (!sessionIsLoggedIn && !sessionUser) {
      const timer = setTimeout(() => {
        checkAndRestoreSession();
      }, 500);

      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [sessionIsLoggedIn, sessionUser, checkSession]);

  const [consultationData, setConsultationData] = useState({
    todaySchedules: [],
    weeklySchedules: [],
    upcomingSchedules: [],
    upcomingConsultations: [],
    completedConsultations: [],
    completedCount: 0,
    totalSessions: 0,
    usedSessions: 0,
    remainingSessions: 0,
    thisMonthScheduleCount: 0
  });
  const [clientStatus, setClientStatus] = useState(null);
  const [sharedClientMappings, setSharedClientMappings] = useState(null);
  const [mappingsLoadFailed, setMappingsLoadFailed] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadClientData = useCallback(async() => {
    const currentUser = sessionUser || user || userFromRoute;
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setMappingsLoadFailed(false);

      const scheduleRaw = await apiGet(DASHBOARD_API.CLIENT_SCHEDULES, {
        userId: currentUser.id,
        userRole: 'CLIENT'
      });
      const schedules = normalizeScheduleListPayload(scheduleRaw);

      const mappingRaw = await apiGet(`/api/v1/admin/mappings/client?clientId=${currentUser.id}`);
      let mappings;
      if (isApiGetNullFailure(mappingRaw)) {
        setMappingsLoadFailed(true);
        mappings = [];
        setSharedClientMappings([]);
      } else {
        mappings = normalizeMappingsListPayload(mappingRaw);
        setSharedClientMappings(mappings);
      }

      let totalSessions = 0;
      let usedSessions = 0;
      let remainingSessions = 0;

      const activeMappings = mappings.filter(mapping => mapping.status === 'ACTIVE');
      totalSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.totalSessions || 0), 0);
      usedSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.usedSessions || 0), 0);
      remainingSessions = activeMappings.reduce((sum, mapping) => sum + (mapping.remainingSessions || 0), 0);

      const hasActive = mappings.some(m => m.status === 'ACTIVE');
      const hasPending = mappings.some(m => m.status === 'PENDING');
      const mappingStatus = mappings.length === 0
        ? 'NONE'
        : (hasActive ? 'ACTIVE' : (hasPending ? 'PENDING' : (mappings[0].status || 'NONE')));
      setClientStatus({
        mappingStatus,
        paymentStatus: mappings.some(m => m.paymentStatus === 'PENDING') ? 'PENDING' : null
      });

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const todaySchedules = schedules.filter(s => s.date === todayStr);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));

      const weeklySchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
      });

      const y = today.getFullYear();
      const m = today.getMonth();
      const thisMonthScheduleCount = schedules.filter((s) => {
        const scheduleDate = new Date(s.date);
        return !Number.isNaN(scheduleDate.getTime())
          && scheduleDate.getFullYear() === y
          && scheduleDate.getMonth() === m;
      }).length;

      const upcomingSchedules = schedules
        .filter((schedule) => {
          const scheduleDate = new Date(schedule.date);
          const dayStart = new Date(todayStr);
          dayStart.setHours(0, 0, 0, 0);
          return scheduleDate >= dayStart && schedule.status === 'CONFIRMED';
        })
        .sort((a, b) => (scheduleSortKey(a) < scheduleSortKey(b) ? -1 : 1))
        .slice(0, WIDGET_CONSTANTS.DASHBOARD_LIMITS.DEFAULT_ITEMS);

      const completedList = schedules.filter(s => s.status === 'COMPLETED');
      const completedCount = completedList.length;

      let unreadMsg = 0;
      try {
        const unreadRes = await apiGet(
          `/api/v1/consultation-messages/unread-count?userId=${currentUser.id}&userType=CLIENT&_t=${Date.now()}`
        );
        unreadMsg = parseUnreadCountPayload(unreadRes);
      } catch {
        unreadMsg = 0;
      }
      setUnreadMessageCount(unreadMsg);

      setConsultationData({
        todaySchedules,
        weeklySchedules,
        upcomingSchedules,
        upcomingConsultations: upcomingSchedules,
        completedConsultations: completedList,
        completedCount,
        totalSessions,
        usedSessions,
        remainingSessions,
        thisMonthScheduleCount
      });
    } catch (error) {
      console.error('❌ 내담자 데이터 로드 실패:', error);
      setMappingsLoadFailed(true);
      setSharedClientMappings([]);
      setClientStatus({ mappingStatus: 'NONE', paymentStatus: null });
      setUnreadMessageCount(0);
      setConsultationData({
        todaySchedules: [],
        weeklySchedules: [],
        upcomingSchedules: [],
        upcomingConsultations: [],
        completedConsultations: [],
        completedCount: 0,
        totalSessions: 0,
        usedSessions: 0,
        remainingSessions: 0,
        thisMonthScheduleCount: 0
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, sessionUser?.id, userFromRoute?.id]);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }

    const currentUser = sessionUser || user || userFromRoute;
    const currentIsLoggedIn = sessionIsLoggedIn || isLoggedIn;

    if (currentIsLoggedIn && currentUser?.id) {
      loadClientData();
    }
  }, [sessionLoading, sessionIsLoggedIn, sessionUser?.id, user?.id, userFromRoute?.id, loadClientData]);

  const currentUser = sessionUser || user || userFromRoute;
  const currentIsLoggedIn = sessionIsLoggedIn || isLoggedIn;

  const nextScheduleCards = useMemo(() => {
    const list = consultationData.upcomingSchedules || [];
    return [list[0], list[1]].filter(Boolean);
  }, [consultationData.upcomingSchedules]);

  const welcomeMetaBadges = useMemo(() => {
    const ms = clientStatus?.mappingStatus;
    const badges = [];
    if (ms === 'PENDING') {
      badges.push({ key: 'match', className: 'mg-v2-status-badge mg-v2-badge--info', label: '진행 중인 매칭' });
    } else if (ms === 'ACTIVE') {
      badges.push({ key: 'active', className: 'mg-v2-status-badge mg-v2-badge--success', label: '상담 진행 중' });
    }
    if (clientStatus?.paymentStatus === 'PENDING') {
      badges.push({ key: 'pay', className: 'mg-v2-status-badge mg-v2-badge--warning', label: '결제 확인 필요' });
    }
    return badges;
  }, [clientStatus]);

  const primaryActiveMapping = useMemo(() => {
    if (!Array.isArray(sharedClientMappings)) return null;
    return sharedClientMappings.find((x) => x.status === 'ACTIVE') || null;
  }, [sharedClientMappings]);

  const coreConsultationSummary = useMemo(() => {
    const ms = clientStatus?.mappingStatus;
    if (ms === 'PENDING') {
      return '상담사 배정·매칭을 준비 중입니다. 안내가 오면 일정을 확인해 주세요.';
    }
    if (primaryActiveMapping) {
      const namePart = primaryActiveMapping.consultantName
        ? `${toDisplayString(primaryActiveMapping.consultantName, '')} 상담사 · `
        : '';
      const pkg = toDisplayString(primaryActiveMapping.packageName, '상담 패키지');
      const rem = primaryActiveMapping.remainingSessions ?? 0;
      return `${namePart}${pkg} · 남은 회기 ${rem}회`;
    }
    return '진행 중인 상담 매칭이 없습니다. 일정·문의는 메시지로 연결할 수 있어요.';
  }, [clientStatus, primaryActiveMapping]);

  const pageShell = (body) => (
    <div className="mg-v2-ad-b0kla">
      <div className="mg-v2-ad-b0kla__container">
        <ContentArea ariaLabel="내담자 대시보드">
          <ContentHeader
            title="내 대시보드"
            subtitle={null}
            titleId={CLIENT_DASHBOARD_TITLE_ID}
          />
          <main aria-labelledby={CLIENT_DASHBOARD_TITLE_ID}>{body}</main>
        </ContentArea>
      </div>
    </div>
  );

  if (isLoading || sessionLoading || !currentIsLoggedIn || !currentUser?.id) {
    return (
      <AdminCommonLayout title="대시보드">
        {pageShell(
          <div aria-busy="true" aria-live="polite">
            <UnifiedLoading type="inline" text="대시보드를 불러오는 중..." />
          </div>
        )}
      </AdminCommonLayout>
    );
  }

  const getGreetingPrefix = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후에요';
    return '좋은 저녁이에요';
  };

  const handleCustomerSupportClick = () => {
    notificationManager.show(CUSTOMER_SUPPORT_TOAST, 'info');
  };

  return (
    <AdminCommonLayout title="대시보드" className="mg-v2-dashboard-layout">
      <ContentArea ariaLabel="내담자 대시보드">
        <ContentHeader
          title="내 대시보드"
          subtitle={null}
          titleId={CLIENT_DASHBOARD_TITLE_ID}
        />

        <main className="client-dash__main" id="client-dash-main" aria-labelledby={CLIENT_DASHBOARD_TITLE_ID}>
          <section className="client-dash__section client-dash__welcome" aria-labelledby="client-dash-welcome-heading">
              <div className="mg-v2-card-container client-dash__welcome-card">
                <div className="client-dash__welcome-inner">
                  <p className="client-dash__eyebrow">{CLIENT_EYEBROW_TEXT}</p>
                  <h2 id="client-dash-welcome-heading" className="client-dash__title">
                    {getGreetingPrefix()},{' '}
                    <SafeText>{currentUser?.name}</SafeText>
                    {' '}님
                  </h2>
                  <p className="client-dash__lede">{CLIENT_WELCOME_LEDE}</p>
                  <div className="client-dash__welcome-meta" role="status" aria-live="polite">
                    {welcomeMetaBadges.map((b) => (
                      <span key={b.key} className={b.className}>{b.label}</span>
                    ))}
                    <span className="client-dash__meta-text">
                      {primaryActiveMapping?.consultantName ? (
                        <>
                          담당 상담사 · <SafeText>{primaryActiveMapping.consultantName}</SafeText>
                        </>
                      ) : (
                        '담당 상담사 · 배정 전'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>

          <section
            className="client-dash__section client-dash__next"
            aria-labelledby="client-dash-next-heading"
            data-testid={CLIENT_DASHBOARD_UPCOMING_SCHEDULE_TEST_ID}
          >
            <div className="client-dash__section-head">
              <h2 id="client-dash-next-heading" className="client-dash__section-title">
                {CLIENT_NEXT_SECTION_TITLE}
              </h2>
              <p className="client-dash__section-desc">{CLIENT_NEXT_SECTION_DESC}</p>
            </div>

            {nextScheduleCards.length > 0 ? (
              <ul className="client-dash__stack">
                {nextScheduleCards.map((schedule, idx) => (
                  <li key={`${schedule.date}-${schedule.startTime}-${idx}`}>
                    <article
                      className="mg-v2-card-container client-dash__action-card"
                      aria-labelledby={`client-dash-action-${idx}`}
                    >
                      <div className="client-dash__action-body">
                        <div className="client-dash__action-top">
                          <span
                            className={
                              idx === 0
                                ? 'mg-v2-status-badge mg-v2-badge--warning'
                                : 'mg-v2-status-badge mg-v2-badge--neutral'
                            }
                          >
                            {idx === 0 ? '다음 일정' : '예정'}
                          </span>
                          <time className="client-dash__time" dateTime={schedule.date}>
                            {formatScheduleCardDateTime(schedule)}
                          </time>
                        </div>
                        <h3 id={`client-dash-action-${idx}`} className="client-dash__card-title">
                          <SafeText>{schedule.title || '상담 일정'}</SafeText>
                        </h3>
                        <p className="client-dash__card-text">
                          장소·링크 정보는 일정 화면에서 확인할 수 있어요.
                        </p>
                      </div>
                      <div className="mg-v2-card-actions client-dash__card-actions">
                        <MGButton
                          variant="primary"
                          className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                          onClick={() => navigate('/client/schedule')}
                          preventDoubleClick={false}
                        >
                          일정 보기
                        </MGButton>
                        {idx === 0 && (
                          <MGButton
                            variant="outline"
                            className={buildErpMgButtonClassName({ variant: 'outline', loading: false })}
                            onClick={() => navigate('/client/schedule')}
                            preventDoubleClick={false}
                          >
                            자세히
                          </MGButton>
                        )}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="client-dash__schedule-empty client-dashboard__schedule-empty">
                <p>{CLIENT_SCHEDULE_EMPTY_BODY}</p>
                <MGButton
                  variant="primary"
                  className={`${buildErpMgButtonClassName({ variant: 'primary', loading: false })} client-dashboard__schedule-empty-cta`}
                  onClick={() => navigate('/client/schedule')}
                  preventDoubleClick={false}
                >
                  {CLIENT_SCHEDULE_VIEW_LABEL}
                </MGButton>
              </div>
            )}
          </section>

          <section
            className="client-dash__section client-dash__kpi"
            aria-labelledby="client-dash-kpi-heading"
            data-testid={CLIENT_DASHBOARD_KPI_SECTION_TEST_ID}
          >
            <div className="client-dash__section-head">
              <h2 id="client-dash-kpi-heading" className="client-dash__section-title">
                {CLIENT_KPI_SECTION_TITLE}
              </h2>
              <p className="client-dash__section-desc">{CLIENT_KPI_SECTION_DESC}</p>
            </div>
            <div className="client-dash__kpi-row-wrap">
              <ContentKpiRow
                items={[
                  {
                    id: 'remainingSessions',
                    icon: <Heart size={28} aria-hidden />,
                    label: '남은 회기',
                    value: toSafeNumber(consultationData.remainingSessions),
                    iconVariant: 'gray',
                    onClick: () => navigate('/client/session-management')
                  },
                  {
                    id: 'thisMonthConsultations',
                    icon: <Calendar size={28} aria-hidden />,
                    label: '이번 달 상담',
                    value: toSafeNumber(consultationData.thisMonthScheduleCount),
                    iconVariant: 'blue',
                    onClick: () => navigate('/client/schedule')
                  },
                  {
                    id: 'unreadMessages',
                    icon: <Bell size={28} aria-hidden />,
                    label: '읽지 않은 메시지',
                    value: toSafeNumber(unreadMessageCount),
                    iconVariant: 'orange',
                    subtitleBadge: toSafeNumber(unreadMessageCount) > 0 ? '새 소식' : null,
                    badgeVariant: 'green',
                    onClick: () => navigate('/client/messages')
                  }
                ]}
              />
            </div>
          </section>

          <section className="client-dash__section client-dash__core" aria-labelledby="client-dash-core-heading">
            <div className="client-dash__section-head">
              <h2 id="client-dash-core-heading" className="client-dash__section-title">
                {CLIENT_CORE_SECTION_TITLE}
              </h2>
              <p className="client-dash__section-desc">{CLIENT_CORE_SECTION_DESC}</p>
            </div>
            <ul className="client-dash__core-cards">
              <li>
                <article className="mg-v2-card-container client-dash__core-card" aria-labelledby="client-dash-core-1">
                  <header className="client-dash__core-card-head">
                    <h3 id="client-dash-core-1" className="client-dash__card-title">진행 중인 상담</h3>
                    {clientStatus?.mappingStatus === 'ACTIVE' ? (
                      <span className="mg-v2-status-badge mg-v2-badge--success">활성</span>
                    ) : (
                      <span className="mg-v2-status-badge mg-v2-badge--neutral">대기</span>
                    )}
                  </header>
                  <p className="client-dash__card-text">{coreConsultationSummary}</p>
                  <div className="mg-v2-card-actions client-dash__card-actions">
                    <MGButton
                      variant="outline"
                      className={buildErpMgButtonClassName({ variant: 'outline', loading: false })}
                      onClick={() => navigate('/client/session-management')}
                      preventDoubleClick={false}
                    >
                      상세
                    </MGButton>
                  </div>
                </article>
              </li>
              <li>
                <article className="mg-v2-card-container client-dash__core-card" aria-labelledby="client-dash-core-2">
                  <header className="client-dash__core-card-head">
                    <h3 id="client-dash-core-2" className="client-dash__card-title">최근 기록 · 과제</h3>
                  </header>
                  <p className="client-dash__card-text">
                    상담 후 안내와 메시지는 메시지함에서 한번에 볼 수 있어요.
                  </p>
                  <div className="mg-v2-card-actions client-dash__card-actions">
                    <MGButton
                      variant="outline"
                      className={buildErpMgButtonClassName({ variant: 'outline', loading: false })}
                      onClick={() => navigate('/client/messages')}
                      preventDoubleClick={false}
                    >
                      목록
                    </MGButton>
                  </div>
                </article>
              </li>
            </ul>

            <div className="client-dash__personalized">
              <ClientPersonalizedMessages
                user={currentUser}
                consultationData={consultationData}
                clientStatus={clientStatus}
              />
            </div>
          </section>

          <section className="client-dash__section client-dash__payment" aria-labelledby="client-dash-payment-heading">
            <div className="client-dash__section-head">
              <h2 id="client-dash-payment-heading" className="client-dash__section-title">
                {CLIENT_PAYMENT_SECTION_TITLE}
              </h2>
              <p className="client-dash__section-desc">{CLIENT_PAYMENT_SECTION_DESC}</p>
            </div>
            <div className="client-dash__payment-wrap">
              <ClientPaymentSessionsSection
                userId={currentUser?.id}
                supplyMappingsFromParent
                parentMappings={sharedClientMappings}
                parentMappingsFetchFailed={mappingsLoadFailed}
              />
            </div>
          </section>

          <div data-testid="client-dashboard-quick-menu">
            <section
              className="client-dash__section client-dash__quick"
              aria-labelledby="client-dash-quick-heading"
              data-testid={CLIENT_DASHBOARD_QUICK_MENU_SECTION_TEST_ID}
            >
              <div className="client-dash__section-head">
                <h2 id="client-dash-quick-heading" className="client-dash__section-title">
                  {CLIENT_QUICK_SECTION_TITLE}
                </h2>
                <p className="client-dash__section-desc">{CLIENT_QUICK_SECTION_DESC}</p>
              </div>
              <div className="client-dash__quick-grid">
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-dash__quick-btn`}
                onClick={() => navigate('/client/schedule')}
                preventDoubleClick={false}
              >
                <CalendarDays size={22} aria-hidden />
                <span>일정</span>
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-dash__quick-btn`}
                onClick={() => navigate('/client/messages')}
                preventDoubleClick={false}
              >
                <MessageCircle size={22} aria-hidden />
                <span>메시지</span>
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-dash__quick-btn`}
                onClick={() => navigate('/client/settings')}
                preventDoubleClick={false}
              >
                <User size={22} aria-hidden />
                <span>설정</span>
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-dash__quick-btn`}
                onClick={handleCustomerSupportClick}
                preventDoubleClick={false}
              >
                <Headphones size={22} aria-hidden />
                <span>고객센터</span>
              </MGButton>
              <MGButton
                variant="outline"
                className={`${buildErpMgButtonClassName({ variant: 'outline', loading: false })} client-dash__quick-btn`}
                onClick={() => navigate('/client/wellness')}
                preventDoubleClick={false}
              >
                <BookOpen size={22} aria-hidden />
                <span>자료실</span>
              </MGButton>
              </div>
            </section>
          </div>
        </main>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default ClientDashboard;
