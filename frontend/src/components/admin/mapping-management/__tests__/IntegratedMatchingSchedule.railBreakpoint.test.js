/**
 * 배정 레일 접힘 기준 — <1110 접힘 / ≥1110 in-flow
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('IntegratedMatchingSchedule rail breakpoint r3', () => {
  const scheduleJs = read('src/components/admin/mapping-management/IntegratedMatchingSchedule.js');
  const scheduleCss = read('src/components/admin/mapping-management/IntegratedMatchingSchedule.css');

  test('auto-collapse breakpoint is 1109 (viewport <1110)', () => {
    expect(scheduleJs).toMatch(/SIDEBAR_AUTO_COLLAPSE_BREAKPOINT_PX\s*=\s*1109/);
    expect(scheduleJs).toMatch(/max-width: \$\{SIDEBAR_AUTO_COLLAPSE_BREAKPOINT_PX\}px/);
    expect(scheduleJs).not.toMatch(/SIDEBAR_AUTO_COLLAPSE_BREAKPOINT_PX\s*=\s*1408/);
  });

  test('in-flow min width is 1110', () => {
    expect(scheduleJs).toMatch(/SIDEBAR_IN_FLOW_MIN_WIDTH_PX\s*=\s*1110/);
    expect(scheduleJs).toMatch(/min-width: \$\{SIDEBAR_IN_FLOW_MIN_WIDTH_PX\}px/);
    expect(scheduleJs).toMatch(/integrated-schedule--rail-in-flow/);
    expect(scheduleJs).toMatch(/integrated-schedule--rail-overlay/);
  });

  test('overlay open uses dialog a11y · toolbar 배정 button · no push padding', () => {
    expect(scheduleJs).toMatch(/overlayMode/);
    expect(scheduleJs).toMatch(/aria-haspopup="dialog"/);
    expect(scheduleJs).toMatch(/integrated-schedule__rail-open-btn/);
    expect(scheduleJs).toMatch(/integrated-schedule__rail-scrim/);
    expect(scheduleCss).toMatch(
      /\.integrated-schedule--rail-overlay[\s\S]*padding-inline-start:\s*0/
    );
    expect(scheduleCss).not.toMatch(
      /padding-inline-start:\s*calc\(var\(--integrated-schedule-sidebar-width\)\s*\+\s*var\(--mg-v2-space-4\)\)/
    );
  });

  test('rail width is clamp only (no fixed 380/320)', () => {
    expect(scheduleCss).toMatch(
      /--integrated-schedule-sidebar-width:\s*clamp\(16\.25rem,\s*18\.75vw,\s*17\.5rem\)/
    );
  });
});
