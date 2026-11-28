/**
 * 관리자 스케줄 통계 — 기간 없는 userRole-only 호출이 없도록 호출부 계약
 *
 * @author MindGarden
 * @since 2026-11-28
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');

const CALLERS = [
  'components/dashboard/CommonDashboard.js',
  'components/dashboard/widgets/SummaryPanelsWidget.js',
  'components/dashboard/widgets/RecentActivitiesWidget.js',
  'components/consultation/ConsultationReport.js',
  'components/consultation/ConsultationHistory.js'
];

describe('admin schedule statistics callers', () => {
  it('frontend 5곳 모두 buildAdminScheduleStatisticsQuery 로 기간을 넣는다', () => {
    CALLERS.forEach((rel) => {
      const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      expect(src).toContain('buildAdminScheduleStatisticsQuery');
      // 기간 없이 userRole 만 넘기는 이전 호출 형태가 남아 있으면 안 된다
      expect(src).not.toMatch(
        /(?:apiGet|StandardizedApi\.get)\(\s*DASHBOARD_API\.ADMIN_STATS,\s*\{\s*userRole:\s*USER_ROLES\.ADMIN\s*\}\s*\)/
      );
      expect(src).not.toMatch(
        /params:\s*\{\s*\.\.\.baseConfig\.params,\s*userRole:\s*USER_ROLES\.ADMIN\s*\}/
      );
    });
  });
});
