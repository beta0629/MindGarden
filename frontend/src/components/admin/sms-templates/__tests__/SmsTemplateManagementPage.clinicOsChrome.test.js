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

  test('공통 SettingsPageShell·SettingsSectionPanel·SettingsButton·UnifiedModal 사용', () => {
    expect(pageJs).toMatch(/<SettingsPageShell/);
    expect(pageJs).toMatch(/<SettingsSectionPanel body="plain" className="mg-admin-sms-template__card"/);
    expect(pageJs).toMatch(/<SettingsSectionPanel body="form" className="mg-admin-sms-template__card"/);
    expect(pageJs).toMatch(/<SettingsButton/);
    expect(pageJs).toMatch(/<UnifiedModal/);
    expect(pageJs).not.toMatch(/\bContentHeader\b/);
    expect(pageJs).not.toMatch(/\bContentCard\b/);
  });

  test('레이아웃 메인 안에 중첩 <main> 없음 (편집 영역은 section)', () => {
    expect(pageJs).not.toMatch(/<main\b/);
    expect(pageJs).toMatch(/<section className="mg-admin-sms-template__editor">/);
  });

  test('패널 크롬은 settings-shell 이 소유 — 페이지 CSS 에 스테이지·카드 지오메트리 없음', () => {
    expect(pageJs).not.toMatch(/mg-admin-sms-template__stage/);
    expect(pageCss).not.toMatch(/mg-admin-sms-template__stage/);
    expect(pageCss).not.toMatch(/\.mg-admin-sms-template__card\b/);
    expect(pageCss).not.toMatch(/box-shadow/);
    expect(pageCss).not.toMatch(/dashed/);
    expect(pageCss).not.toMatch(/!important/);
  });

  test('CSS 는 v2 토큰만 — hex·legacy 토큰·px 없음', () => {
    expect(pageCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(pageCss).not.toMatch(/var\(--(color|spacing|radius|font-size|font-weight)-/);
    expect(pageCss).not.toMatch(/var\(--mg-color-/);
    expect(pageCss).not.toMatch(/--ad-b0kla/);
    expect(pageCss).not.toMatch(/\b\d+px\b/);
  });

  test('입력은 mg-v2 입력 계약 클래스 사용', () => {
    expect(pageJs).toMatch(/className="mg-v2-form-input mg-admin-sms-template__search"/);
    expect(pageJs).toMatch(/className="mg-v2-select mg-admin-sms-template__filter"/);
    expect(pageJs).toMatch(/className="mg-v2-form-textarea"/);
  });

  test('수신 대상 배지 변형 셀렉터 유지', () => {
    ['client', 'consultant', 'both', 'admin', 'system'].forEach((variant) => {
      expect(pageCss).toMatch(new RegExp(`\\.mg-admin-sms-template__audience-badge--${variant}\\b`));
    });
  });
});
