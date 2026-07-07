/**
 * G1-02 — AdminDashboard widgets density guard
 */
import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../../../..');
const DASHBOARD_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/dashboard-v2/AdminDashboardV2.js'
);
const DEPOSIT_LIST_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/admin/AdminDashboard/organisms/DepositPendingList.js'
);
const SCHEDULE_LIST_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/admin/AdminDashboard/organisms/SchedulePendingList.js'
);
const KPI_CSS_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/admin/AdminDashboard/molecules/KpiFlipCard.css'
);
const WIDGET_CONSTANTS_PATH = path.join(
  REPO_ROOT,
  'frontend/src/constants/adminDashboardWidgetConstants.js'
);
const ADMIN_DASHBOARD_PATH = path.join(
  REPO_ROOT,
  'frontend/src/components/admin/AdminDashboard.js'
);

describe('AdminDashboard G1-02 widgets guard', () => {
  it('AdminDashboardV2가 AdminCommonLayout·KpiFlipCard 4블록·DASHBOARD_KPI_IDS를 사용한다', () => {
    const source = fs.readFileSync(DASHBOARD_PATH, 'utf8');

    expect(source).toContain('AdminCommonLayout');
    expect(source).toContain('KpiFlipCard');
    expect(source).toContain('DASHBOARD_KPI_IDS');
    expect(source).toContain('DASHBOARD_KPI_IDS.TODAY_BOOKINGS');
    expect(source).toContain('DASHBOARD_KPI_IDS.PENDING_PAYMENT');
    expect(source).toContain('DASHBOARD_KPI_IDS.NO_SHOW');
    expect(source).toContain('DASHBOARD_KPI_IDS.ACTIVE_SESSIONS');
    expect(source).toContain('mg-v2-dashboard-kpi-zone--compact');
  });

  it('AdminDashboardV2 헤더가 Primary 1 + EntityRowActions overflow를 사용한다 (PR-DASH-04)', () => {
    const source = fs.readFileSync(DASHBOARD_PATH, 'utf8');

    expect(source).toContain('EntityRowActions');
    expect(source).toContain('ENTITY_ROW_ACTIONS_LAYOUT.CORNER');
    expect(source).toContain('mg-v2-ad-b0kla__header-primary-btn');
    expect(source).not.toContain('mg-v2-ad-b0kla__icon-group');
  });

  it('AdminDashboardV2 환불 StatCard가 toSafeNumber로 null 방어한다 (PR-DASH-04)', () => {
    const source = fs.readFileSync(DASHBOARD_PATH, 'utf8');

    expect(source).toContain('toSafeNumber(refundStats.totalRefundCount');
    expect(source).toContain('toSafeNumber(refundStats.totalRefundedSessions');
    expect(source).toContain('toSafeNumber(refundStats.totalRefundAmount');
    expect(source).toContain('toSafeNumber(refundStats.averageRefundPerCase');
  });

  it('KPI CSS가 1280px compact·414px 회귀 방어를 정의한다 (PR-DASH-04)', () => {
    const css = fs.readFileSync(KPI_CSS_PATH, 'utf8');

    expect(css).toContain('max-height: 120px');
    expect(css).toMatch(/@media \(max-width: 414px\)/);
  });

  it('Pipeline·위젯 CSS에 dark cascade [data-theme="dark"] 규칙이 있다 (PR-DASH-03)', () => {
    const pipelineCss = fs.readFileSync(
      path.join(REPO_ROOT, 'frontend/src/components/admin/AdminDashboard/AdminDashboardPipeline.css'),
      'utf8'
    );
    const queueCss = fs.readFileSync(
      path.join(REPO_ROOT, 'frontend/src/components/admin/AdminDashboard/organisms/ManualMatchingQueue.css'),
      'utf8'
    );

    expect(pipelineCss).toContain('[data-theme="dark"]');
    expect(queueCss).toContain('[data-theme="dark"]');
    expect(pipelineCss).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it('Pending List 위젯이 ListTableView·단일 viewAllHref CTA를 사용한다', () => {
    const deposit = fs.readFileSync(DEPOSIT_LIST_PATH, 'utf8');
    const schedule = fs.readFileSync(SCHEDULE_LIST_PATH, 'utf8');

    expect(deposit).toContain('ListTableView');
    expect(deposit).toContain('viewAllHref');
    expect(deposit).not.toContain('onDepositConfirm');
    expect(deposit).not.toContain('MGButton');

    expect(schedule).toContain('ListTableView');
    expect(schedule).toContain('viewAllHref');
    expect(schedule).not.toContain('onScheduleRegister');
    expect(schedule).not.toContain('MGButton');
  });

  it('KPI 그리드가 1280px에서 4열 repeat(4)을 사용한다', () => {
    const css = fs.readFileSync(KPI_CSS_PATH, 'utf8');
    expect(css).toContain('repeat(4, minmax(0, 1fr))');
  });

  it('위젯 상수가 Pending List 행 제한·CTA 라벨을 정의한다', () => {
    const source = fs.readFileSync(WIDGET_CONSTANTS_PATH, 'utf8');
    expect(source).toContain('DASHBOARD_PENDING_LIST_MAX_ROWS');
    expect(source).toContain('DASHBOARD_PENDING_LIST_VIEW_ALL_LABEL');
    expect(source).toContain('DASHBOARD_KPI_IDS');
  });

  it('AdminDashboard가 SchedulePendingList를 별도 schedulePendingList로 와이어링한다 (PR-DASH-02)', () => {
    const source = fs.readFileSync(ADMIN_DASHBOARD_PATH, 'utf8');

    expect(source).toContain('const [schedulePendingList, setSchedulePendingList]');
    expect(source).toContain('loadSchedulePendingList');
    expect(source).toContain("StandardizedApi.get(API_ADMIN_SCHEDULES, { status: 'BOOKED' })");
    expect(source).toMatch(/schedulePendingCount:\s*schedulePendingList\.length/);
    expect(source).toMatch(/<SchedulePendingList[\s\S]*?items=\{schedulePendingList\.map/);
    expect(source).toContain('viewAllHref={ADMIN_ROUTES.INTEGRATED_SCHEDULE}');

    expect(source).not.toContain('onScheduleRegister');
    expect(source).not.toMatch(/<SchedulePendingList[^>]*\sitems=\{\[\]\}/);

    const scheduleBlock = source.match(/<SchedulePendingList[\s\S]*?\/>/)?.[0] || '';
    expect(scheduleBlock).not.toContain('pendingDepositList');

    const loadStatsBlock = source.match(/const loadStats[\s\S]*?},\s*\[showToast, t\]\);/)?.[0] || '';
    expect(loadStatsBlock).not.toContain('API_ADMIN_VACATION_STATISTICS');
    expect(loadStatsBlock).not.toContain('vacationRes');

    expect(source).toMatch(/if\s*\(isVacationExpanded\)\s*\{[\s\S]*loadVacationStats\(\)/);
  });

  it('AdminDashboardV2가 SchedulePendingList를 schedulePendingList·BOOKED API로 와이어링한다 (PR-DASH-02)', () => {
    const source = fs.readFileSync(DASHBOARD_PATH, 'utf8');

    expect(source).toContain('const [schedulePendingList, setSchedulePendingList]');
    expect(source).toContain('loadSchedulePendingList');
    expect(source).toContain("StandardizedApi.get(API_ADMIN_SCHEDULES, { status: 'BOOKED' })");
    expect(source).toMatch(/schedulePendingCount:\s*schedulePendingList\.length/);
    expect(source).toMatch(/<SchedulePendingList[\s\S]*?items=\{schedulePendingList\.map/);

    const scheduleBlock = source.match(/<SchedulePendingList[\s\S]*?\/>/)?.[0] || '';
    expect(scheduleBlock).not.toContain('pendingDepositList');

    expect(source).not.toContain('API_ADMIN_CONSULTANTS_WITH_VACATION');
    expect(source).not.toContain('SCHEDULE_API.STATISTICS');
    expect(source).not.toContain('schedulePendingCount: null');
  });
});
