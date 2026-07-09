/**
 * Consultant Dashboard · 웹 전용 라우트 SSOT
 * `menuItems.js` CONSULTANT_MENU_ITEMS(LNB) 및 App.js `/consultant/*` 와 정합.
 * Expo AppShell 경로와 cross-link 금지.
 *
 * @author CoreSolution
 * @since 2026-07-09
 */

/** 웹 LNB · App.js consultant 라우트 — 변경 시 menuItems.js 와 동시 갱신 */
export const CONSULTANT_DASHBOARD_ROUTES = {
  DASHBOARD: '/consultant/dashboard',
  SCHEDULE: '/consultant/schedule',
  NOTIFICATIONS: '/notifications',
  CONSULTATION_RECORDS: '/consultant/consultation-records',
  /** App.js canonical: `/consultant/client/:id` (+ alias `/consultant/clients/:id`) */
  CLIENTS: '/consultant/clients',
  MESSAGES: '/consultant/messages',
  SALARY_SETTLEMENT: '/consultant/salary-settlement'
};

/** KPI 카드 → 웹-native deep link (ClientDashboardKpiSection 패턴) */
export const CONSULTANT_DASHBOARD_KPI_ROUTES = {
  WEEKLY_CONSULTATIONS: CONSULTANT_DASHBOARD_ROUTES.SCHEDULE,
  NEW_CLIENTS: CONSULTANT_DASHBOARD_ROUTES.CLIENTS,
  UNREAD_MESSAGES: CONSULTANT_DASHBOARD_ROUTES.MESSAGES,
  INCOMPLETE_RECORDS: `${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?filter=incomplete`
};

/**
 * @param {number|string} clientId
 * @returns {string}
 */
export const buildConsultantClientDetailRoute = (clientId) => {
  if (clientId == null || clientId === '') {
    return CONSULTANT_DASHBOARD_ROUTES.CLIENTS;
  }
  return `/consultant/client/${encodeURIComponent(String(clientId))}`;
};

/**
 * @param {number|string} scheduleId
 * @returns {string}
 */
export const buildConsultantConsultationRecordRoute = (scheduleId) => {
  if (scheduleId == null || scheduleId === '') {
    return CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS;
  }
  return `/consultant/consultation-record/${encodeURIComponent(String(scheduleId))}`;
};

/**
 * @param {Readonly<Record<string, string|number|undefined|null>>} params
 * @returns {string}
 */
export const buildConsultantConsultationRecordsRoute = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query
    ? `${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?${query}`
    : CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS;
};

/**
 * @param {Readonly<Record<string, string|number|undefined|null>>} [params]
 * @returns {string}
 */
export const buildConsultantClientsRoute = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query
    ? `${CONSULTANT_DASHBOARD_ROUTES.CLIENTS}?${query}`
    : CONSULTANT_DASHBOARD_ROUTES.CLIENTS;
};

/** v2.1 QuickAction 5 — 단일 진실 (Web ConsultantDashboardV2) */
export const CONSULTANT_DASHBOARD_QUICK_ACTIONS = [
  {
    id: 'create-schedule',
    label: '일정 등록',
    path: CONSULTANT_DASHBOARD_ROUTES.SCHEDULE,
    variant: 'outline'
  },
  {
    id: 'view-schedule',
    label: '일정 확인',
    path: CONSULTANT_DASHBOARD_ROUTES.SCHEDULE,
    variant: 'outline'
  },
  {
    id: 'check-messages',
    label: '내담자 메시지',
    path: CONSULTANT_DASHBOARD_ROUTES.MESSAGES,
    variant: 'outline'
  },
  {
    id: 'create-record',
    label: '일지 작성',
    path: buildConsultantConsultationRecordsRoute({ filter: 'incomplete' }),
    variant: 'primary'
  },
  {
    id: 'salary-settlement',
    label: '정산 확인',
    path: CONSULTANT_DASHBOARD_ROUTES.SALARY_SETTLEMENT,
    variant: 'outline'
  }
];
