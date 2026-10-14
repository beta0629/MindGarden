/**
 * 칩·필터가 getTeacherColor SSOT 를 쓰는지 / #1611·기관연계 파일 회귀 없음
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const FE_SRC = path.resolve(__dirname, '..', '..', '..', '..');
const REPO_ROOT = path.resolve(FE_SRC, '..', '..');

const read = (...parts) => fs.readFileSync(path.resolve(...parts), 'utf8');

describe('선생님 색 점 SSOT·회귀 가드', () => {
  test('WeekDayScheduleEventChip·ScheduleCalendarView·ConsultantFilterSelect 가 getTeacherColor 사용', () => {
    const weekChip = read(ROOT, 'WeekDayScheduleEventChip.js');
    const calendar = read(ROOT, 'ScheduleCalendarView.js');
    const filter = read(
      FE_SRC,
      'components',
      'admin',
      'mapping-management',
      'integrated-schedule',
      'molecules',
      'ConsultantFilterSelect.jsx'
    );
    expect(weekChip).toMatch(/getTeacherColor/);
    expect(weekChip).toMatch(/TeacherColorDot/);
    expect(calendar).toMatch(/getTeacherColor/);
    expect(calendar).toMatch(/TeacherColorDot/);
    expect(filter).toMatch(/getTeacherColor/);
    expect(filter).toMatch(/TeacherColorDot/);
    expect(weekChip).not.toMatch(/getConsultantColor/);
    expect(calendar).not.toMatch(/getConsultantColor/);
    expect(filter).not.toMatch(/getConsultantColor/);
  });

  test('선생님 점은 mg-v2-teacher-dot — 상태 __dot 와 혼동 금지', () => {
    const calendar = read(ROOT, 'ScheduleCalendarView.js');
    const dotCss = read(ROOT, 'TeacherColorDot.css');
    expect(dotCss).toContain('mg-v2-teacher-dot');
    expect(dotCss).toContain('var(--mg-v2-teacher-dot-size)');
    expect(dotCss).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(calendar).toMatch(/mg-v2-ad-calendar-event__dot--/);
    expect(calendar).toMatch(/TeacherColorDot/);
  });

  test('기관연계 배지 레이아웃 파일·검사 스크립트 미변경', () => {
    const marksCss = read(
      FE_SRC,
      'components',
      'admin',
      'mapping-management',
      'integrated-schedule',
      'molecules',
      'ScheduleEventMarks.css'
    );
    expect(marksCss).toContain('@container mg-month-event (width >= 109px)');
    const checkScript = path.resolve(
      REPO_ROOT,
      'scripts',
      'verification',
      'check-engagement-badge-chip-layout.mjs'
    );
    expect(fs.existsSync(checkScript)).toBe(true);
  });

  test('CurrentTimeChip·nowIndicator 계약 파일 회귀 없음(토큰 §11b 유지)', () => {
    const tokens = read(FE_SRC, 'styles', 'tokens', 'design-v2-tokens.css');
    expect(tokens).toContain('11b. COMPONENT — CurrentTimeChip');
    expect(tokens).toContain('--mg-v2-now-chip-bg');
    expect(tokens).toContain('--mg-v2-now-line-color');
    expect(tokens).toContain('11c. COMPONENT — teacher color dots');
    expect(tokens).toContain('--mg-v2-teacher-1');
    const nowCssTest = read(ROOT, '__tests__', 'ScheduleCalendarView.nowIndicator.test.js');
    expect(nowCssTest).toMatch(/nowIndicator/);
  });

  test('with-vacation BE는 비활성 포함(findByTenantIdAndIsDeletedFalse) — 활성만 조회 금지', () => {
    const impl = read(
      REPO_ROOT,
      'src',
      'main',
      'java',
      'com',
      'coresolution',
      'consultation',
      'service',
      'impl',
      'AdminServiceImpl.java'
    );
    const methodMatch = impl.match(
      /getAllConsultantsWithVacationInfo\([\s\S]*?return rows;\s*\}/
    );
    expect(methodMatch).toBeTruthy();
    const methodBody = methodMatch[0];
    expect(methodBody).toContain('findByTenantIdAndIsDeletedFalse');
    expect(methodBody).not.toContain('findActiveConsultantsByTenantId');
    expect(methodBody).toContain('isActive');
  });
});
