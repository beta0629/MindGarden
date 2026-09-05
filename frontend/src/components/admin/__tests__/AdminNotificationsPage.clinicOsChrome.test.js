/**
 * AdminNotificationsPage Clinic-OS chrome alignment — cascade / structure locks
 * Twin: ConsultationLogView.clinicOsChrome.test.js
 *
 * Hardcode gates cited:
 * - docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md §17
 * - docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md §1.3
 *
 * @author CoreSolution
 * @since 2026-09-05
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('AdminNotificationsPage Clinic-OS chrome', () => {
  const pageJs = read('src/components/admin/AdminNotificationsPage.js');
  const pageCss = read('src/components/admin/AdminNotificationsPage.css');
  const systemJs = read('src/components/admin/organisms/SystemNotificationListBlock.js');
  const messageJs = read('src/components/admin/organisms/AdminMessageListBlock.js');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(pageJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(pageJs).toMatch(/admin-notifications--clinic-os/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(pageJs).toMatch(/mg-v2-admin-notifications-page/);
  });

  test('quiet header with primary MGButton create CTA', () => {
    expect(pageJs).toMatch(/ContentHeader/);
    expect(pageJs).toMatch(/알림·메시지 관리/);
    expect(pageJs).toMatch(/공지 작성/);
    expect(pageJs).toMatch(/variant="primary"/);
  });

  test('tabs use page-local Clinic-OS class with primary-solid active', () => {
    expect(pageJs).toMatch(/admin-notifications-tabs/);
    expect(pageJs).not.toMatch(/mg-v2-ad-b0kla__tabs/);
    expect(pageCss).toMatch(/--mg-v2-color-primary-solid/);
    expect(pageCss).toMatch(/admin-notifications-tabs[\s\S]*mg-segmented-tabs__tab--active/);
  });

  test('main stage geometry; section-title has no 4px left accent', () => {
    expect(pageJs).toMatch(/admin-notifications-stage/);
    expect(pageCss).toMatch(/min-height:\s*36rem/);
    expect(pageCss).toMatch(/border:\s*1px solid var\(--mg-v2-color-neutral-300\)/);
    expect(pageCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
    expect(pageCss).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(pageCss).not.toMatch(/border-left:\s*4px/);
    expect(pageCss).toMatch(/admin-notifications-section-title[\s\S]*border-left:\s*none/);
  });

  test('organisms drop mg-v2-ad-b0kla__* for page-local classes', () => {
    expect(systemJs).not.toMatch(/mg-v2-ad-b0kla__/);
    expect(messageJs).not.toMatch(/mg-v2-ad-b0kla__/);
    expect(systemJs).toMatch(/admin-notifications-section/);
    expect(messageJs).toMatch(/admin-notifications-section/);
    expect(systemJs).toMatch(/admin-notifications-section-title/);
    expect(messageJs).toMatch(/admin-notifications-section-title/);
  });

  test('page chrome CSS has no leftover --ad-b0kla or hex', () => {
    expect(pageCss).not.toMatch(/--ad-b0kla/);
    expect(pageCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
