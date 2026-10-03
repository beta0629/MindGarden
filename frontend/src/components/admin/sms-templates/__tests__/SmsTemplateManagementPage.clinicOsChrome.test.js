/**
 * SmsTemplateManagementPage Clinic-OS chrome — 구조·토큰 잠금
 * Twin: AdminPushMonitoringPage.clinicOsChrome.test.js
 *
 * Hardcode gates cited:
 * - docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17
 * - docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('SmsTemplateManagementPage Clinic-OS chrome', () => {
  const pageJs = read('src/components/admin/sms-templates/SmsTemplateManagementPage.js');
  const pageCss = read('src/components/admin/sms-templates/SmsTemplateManagementPage.css');

  test('Clinic-OS 페이지 스코프, B0KlA 셸 미사용', () => {
    expect(pageJs).toMatch(/sms-template--clinic-os/);
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(pageJs).toMatch(/data-testid="admin-sms-template-page"/);
  });

  test('공통 ContentHeader·ContentCard·MGButton·UnifiedModal 사용', () => {
    expect(pageJs).toMatch(/<ContentHeader/);
    expect(pageJs).toMatch(/<ContentCard className="mg-admin-sms-template__card"/);
    expect(pageJs).toMatch(/<MGButton/);
    expect(pageJs).toMatch(/<UnifiedModal/);
  });

  test('레이아웃 메인 안에 중첩 <main> 없음 (편집 영역은 section)', () => {
    expect(pageJs).not.toMatch(/<main\b/);
    expect(pageJs).toMatch(/<section className="mg-admin-sms-template__editor">/);
  });

  test('스테이지 단일 카드 지오메트리', () => {
    expect(pageJs).toMatch(/mg-admin-sms-template__stage/);
    expect(pageCss).toMatch(/min-height:\s*36rem/);
    expect(pageCss).toMatch(/border:\s*1px solid var\(--mg-v2-color-neutral-300\)/);
    expect(pageCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
    expect(pageCss).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(pageCss).toMatch(/border-left:\s*none\s*!important/);
  });

  test('CSS 는 v2 토큰만 — hex·legacy 토큰·1px 외 px 없음', () => {
    expect(pageCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(pageCss).not.toMatch(/var\(--(color|spacing|radius|font-size|font-weight)-/);
    expect(pageCss).not.toMatch(/var\(--mg-color-/);
    expect(pageCss).not.toMatch(/--ad-b0kla/);
    const pxValues = pageCss.match(/\b\d+px\b/g) || [];
    expect(pxValues.every((v) => v === '1px')).toBe(true);
  });

  test('수신 대상 배지 변형 셀렉터 유지', () => {
    ['client', 'consultant', 'both', 'admin', 'system'].forEach((variant) => {
      expect(pageCss).toMatch(new RegExp(`\\.mg-admin-sms-template__audience-badge--${variant}\\b`));
    });
  });
});
