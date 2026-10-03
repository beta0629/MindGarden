/**
 * Tenant PG Configuration Clinic-OS chrome alignment — cascade / copy / structure locks
 *
 * @author CoreSolution
 * @since 2026-09-05
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(FRONTEND_ROOT, rel), 'utf8');

describe('PgConfiguration Clinic-OS chrome', () => {
  const listJs = read('src/components/tenant/PgConfigurationList.js');
  const listCss = read('src/components/tenant/PgConfigurationList.css');
  const createJs = read('src/components/tenant/PgConfigurationCreate.js');
  const editJs = read('src/components/tenant/PgConfigurationEdit.js');
  const detailJs = read('src/components/tenant/PgConfigurationDetail.js');
  const detailCss = read('src/components/tenant/PgConfigurationDetail.css');
  const formJs = read('src/components/tenant/PgConfigurationForm.js');
  const formCss = read('src/components/tenant/PgConfigurationForm.css');

  test('uses Clinic-OS page scope not B0KlA shell import', () => {
    expect(listJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(createJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(editJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(detailJs).not.toMatch(/AdminDashboardB0KlA\.css/);
    expect(listJs).toMatch(/pg-config-list--clinic-os/);
    expect(createJs).toMatch(/pg-config-create--clinic-os/);
    expect(editJs).toMatch(/pg-config-edit--clinic-os/);
    expect(detailJs).toMatch(/pg-config-detail--clinic-os/);
    expect(listJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(createJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(editJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(detailJs).not.toMatch(/mg-v2-ad-b0kla/);
    expect(formJs).not.toMatch(/mg-v2-ad-b0kla/);
  });

  test('header CTA uses SettingsPageShell quiet header + SettingsButton primary not ActionBarButton', () => {
    expect(listJs).toMatch(/<SettingsPageShell[\s\S]*actions=\{\(\s*<SettingsButton[\s\S]*variant="primary"/);
    expect(listJs).not.toMatch(/ContentHeader/);
    expect(listJs).not.toMatch(/ActionBarButton/);
    expect(listCss).not.toMatch(/pg-config-list__header-actions/);
    expect(listCss).not.toMatch(/--ad-b0kla/);
  });

  test('summary strip: 공통 SettingsSummaryStrip(3칸) + 빠른 필터는 TabChipRow', () => {
    expect(listJs).toMatch(/<SettingsSummaryStrip[\s\S]*testId="pg-config-list-summary"/);
    expect(listJs).toMatch(/<TabChipRow[\s\S]*onChange=\{handleSummaryFilter\}/);
    expect(listJs).not.toMatch(/mapping-management-summary/);
    expect(listJs).not.toMatch(/KpiNumeral/);
    expect(listCss).not.toMatch(/mapping-management-summary/);
  });

  test('main stage lives in a single SettingsSectionPanel — 내부 카드 없이 ListTableView 1개', () => {
    expect(listJs).toMatch(/<SettingsSectionPanel body="plain"[\s\S]*pg-config-list__stage/);
    expect(listJs).toMatch(/<ListTableView[\s\S]*rowKeyField="configId"/);
    expect(listJs).toMatch(/<EmptyState/);
    expect(listJs).toMatch(/mg-v2-settings-toolbar/);
    expect(listJs).not.toMatch(/pg-config-card|className="empty-state"|pending-notice|rejected-notice/);
    expect(listJs).not.toMatch(/<MGButton/);
    const stageRule = listCss.match(/\.pg-config-list__stage\s*\{[^}]*\}/s);
    expect(stageRule).not.toBeNull();
    expect(stageRule[0]).not.toMatch(/border|box-shadow|background/);
    expect(listCss).not.toMatch(/\b1px\b/);
    expect(listCss).not.toMatch(/border(-[a-z-]+)?:|border-radius|box-shadow/);
    expect(formCss).toMatch(/\.pg-config-form-stage\s*\{[^}]*min-height:\s*36rem/s);
  });

  test('목록 상점 ID는 상세와 같이 마스킹', () => {
    expect(listJs).toMatch(/maskPortoneChannelKey\(config\.storeId\)/);
  });

  test('route param uses :id (Edit/Detail)', () => {
    expect(editJs).toMatch(/const\s*\{\s*id:\s*configId\s*\}\s*=\s*useParams\(\)/);
    expect(detailJs).toMatch(/const\s*\{\s*id:\s*configId\s*\}\s*=\s*useParams\(\)/);
    expect(editJs).not.toMatch(/const\s*\{\s*configId\s*\}\s*=\s*useParams\(\)/);
    expect(detailJs).not.toMatch(/const\s*\{\s*configId\s*\}\s*=\s*useParams\(\)/);
  });

  test('Korean operator titles (no raw English code keys as UI titles)', () => {
    expect(formJs).toMatch(/<dt>콘텐츠 유형<\/dt>/);
    expect(formJs).toMatch(/<dt>버전<\/dt>/);
    expect(formJs).toMatch(/웹훅 시크릿 \(선택\)/);
    expect(formJs).not.toMatch(/<dt>Content-Type<\/dt>/);
    expect(formJs).not.toMatch(/<dt>Version<\/dt>/);
    // prod-port 브랜치 Form은 destin과 채널키 카피/레이아웃이 다름 — 키 상수·기본 라벨만 잠금
    expect(formJs).toMatch(/채널 키/);
    expect(formJs).toMatch(/PORTONE_SETTINGS_KEY_CHANNEL_KEY_TEST/);
    expect(formJs).not.toMatch(/htmlFor="portoneWebhookSecret">\{PORTONE_SETTINGS_KEY_WEBHOOK_SECRET\}/);
  });

  test('Detail webhook section: 설정 여부 배지 + 운영자 전용 안내만 (입력·저장은 테넌트 화면에서 숨김)', () => {
    expect(detailJs).toMatch(/ADMIN_SHOP_PG_COPY\.WEBHOOK_TITLE/);
    expect(detailJs).toMatch(/isPortoneWebhookSecretConfigured/);
    expect(detailJs).toMatch(/ADMIN_SHOP_PG_COPY\.WEBHOOK_SET/);
    expect(detailJs).toMatch(/ADMIN_SHOP_PG_COPY\.WEBHOOK_UNSET/);
    expect(detailJs).toMatch(/<SettingsNotice tone="info">[\s\S]{0,120}WEBHOOK_OPS_ONLY_NOTICE/);
    expect(detailJs).not.toMatch(/patchPgConfigurationWebhookSecret/);
    expect(detailJs).not.toMatch(/type="password"/);
  });

  test('Detail (결제 연결): 배지 1개 · 헤더 primary는 수정 하나 · 공통 요약/표/버튼 · IAMPORT 문구 없음', () => {
    const primaryCount = (detailJs.match(/variant="primary"/g) || []).length;
    expect(primaryCount).toBe(1);
    expect(detailJs).toMatch(/ADMIN_SHOP_SUITE_TEST_IDS\.PG_EDIT/);
    expect(detailJs).toMatch(/resolvePgBadge/);
    expect(detailJs).toMatch(/<SettingsSummaryStrip[\s\S]{0,200}ADMIN_SHOP_SUITE_TEST_IDS\.PG_KEYSTRIP/);
    expect(detailJs).toMatch(/pg-config-detail__layout/);
    expect(detailJs).toMatch(/<ListTableView[\s\S]{0,200}HISTORY_COLUMNS/);
    expect(detailJs).not.toMatch(/admin-shop-suite__|<table|<MGButton|AdminShopSuite\.css/);
    expect(detailJs).toMatch(/ADMIN_SHOP_PG_HISTORY_PREVIEW/);
    expect(detailJs).not.toMatch(/['"]IAMPORT['"]/);
    expect(detailJs).not.toMatch(/className="pg-config-detail pg-config-detail__body"/);
  });

  test('List (결제 연결): 1건이어도 자동 상세 이동 없음 · 행 클릭 시에만 상세', () => {
    expect(listJs).toMatch(/ADMIN_SHOP_PG_COPY\.TITLE/);
    expect(listJs).not.toMatch(/configurations\.length !== 1/);
    expect(listJs).not.toMatch(/replace:\s*true/);
    expect(listJs).toMatch(/onClick=\{\(\) => navigate\(`\/tenant\/pg-configurations\/\$\{config\.configId\}`\)\}/);
    expect(detailJs).not.toMatch(/stayOnList/);
  });

  test('Form mobile: 보기 버튼 인라인 · 도움말 block · 스위치 행 빈 공간 없음', () => {
    const switchRowCss = read('src/components/common/molecules/SettingSwitchRow.css');
    const mobileBlock = formCss.slice(formCss.indexOf('@media (max-width: 768px)'));
    expect(mobileBlock).toMatch(/\.pg-config-form \.input-with-icon \.icon-button\s*\{[^}]*position:\s*static/);
    expect(mobileBlock).toMatch(/\.pg-config-form \.help-text\s*\{[^}]*display:\s*block/);
    expect(formCss).not.toMatch(/max-width:\s*390px/);
    expect(switchRowCss).toMatch(/@media \(max-width: 640px\)[\s\S]*\.mg-v2-setting-switch-row__main\s*\{[^}]*flex:\s*0 0 auto/);
  });

  test('page CSS has no leftover --ad-b0kla or page hex accents', () => {
    expect(listCss).not.toMatch(/--ad-b0kla/);
    expect(detailCss).not.toMatch(/--ad-b0kla/);
    expect(formCss).not.toMatch(/--ad-b0kla/);
    const hexColor = /#[0-9a-fA-F]{3,8}\b/;
    expect(listCss).not.toMatch(hexColor);
    expect(detailCss).not.toMatch(hexColor);
    expect(detailCss).not.toMatch(/primary-solid|cs-teal-700|box-shadow:\s*0|\b1px\b/);
    expect(detailJs).toMatch(/<SettingsSectionPanel/);
    expect(detailJs).not.toMatch(/admin-shop-suite__card"/);
  });
});
