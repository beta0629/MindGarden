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
  const listUtilsJs = read('src/components/tenant/pgConfigurationListUtils.js');
  const createJs = read('src/components/tenant/PgConfigurationCreate.js');
  const editJs = read('src/components/tenant/PgConfigurationEdit.js');
  const detailJs = read('src/components/tenant/PgConfigurationDetail.js');
  const detailCss = read('src/components/tenant/PgConfigurationDetail.css');
  const formJs = read('src/components/tenant/PgConfigurationForm.js');
  const formCss = read('src/components/tenant/PgConfigurationForm.css');
  const keyStripJs = read('src/components/tenant/molecules/PgConfigKeyStrip.js');
  const keyStripCss = read('src/components/tenant/molecules/PgConfigKeyStrip.css');
  const testModePairJs = read('src/components/tenant/molecules/PgConfigTestModePair.js');
  const testModePairCss = read('src/components/tenant/molecules/PgConfigTestModePair.css');

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

  test('header CTA uses MGButton solid primary not ActionBarButton', () => {
    expect(listJs).toMatch(/import MGButton from/);
    expect(listJs).toMatch(/pg-config-list__header-actions/);
    expect(listJs).toMatch(/<MGButton[\s\S]*variant="primary"/);
    expect(listJs).not.toMatch(/ActionBarButton/);
    expect(listCss).toMatch(/pg-config-list__header-actions[\s\S]*height:\s*var\(--button-height-sm\)/);
    expect(listCss).not.toMatch(/--ad-b0kla/);
  });

  test('summary strip present (3-cell Clinic-OS, no icon tiles)', () => {
    expect(listJs).toMatch(/pg-config-list-summary/);
    expect(listJs).toMatch(/mapping-management-summary/);
    expect(listJs).toMatch(/KpiNumeral/);
    expect(listCss).toMatch(/\.pg-config-list-summary\.mapping-management-summary\s*\{[^}]*grid-template-columns:\s*repeat\(3/s);
    expect(listCss).toMatch(/border-left:\s*none\s*!important/);
  });

  test('main stage single card geometry', () => {
    expect(listCss).toMatch(/\.pg-config-list__stage\s*\{[^}]*min-height:\s*36rem/s);
    expect(listCss).toMatch(/border:\s*1px solid var\(--mg-v2-color-neutral-300\)/);
    expect(listCss).toMatch(/background:\s*var\(--mg-v2-color-neutral-50\)/);
    expect(listCss).toMatch(/border-radius:\s*var\(--mg-v2-radius-lg\)/);
    expect(formCss).toMatch(/\.pg-config-form-stage\s*\{[^}]*min-height:\s*36rem/s);
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
    expect(formJs).not.toMatch(/htmlFor="portoneWebhookSecret">\{PORTONE_SETTINGS_KEY_WEBHOOK_SECRET\}/);
  });

  test('page CSS has no leftover --ad-b0kla or page hex accents', () => {
    expect(listCss).not.toMatch(/--ad-b0kla/);
    expect(detailCss).not.toMatch(/--ad-b0kla/);
    expect(formCss).not.toMatch(/--ad-b0kla/);
    expect(listCss).not.toMatch(/#155724|#357abd|#e2e3e5|#d1ecf1/);
    expect(detailCss).not.toMatch(/#155724|#357abd|#e2e3e5|#d1ecf1/);
    // Detail cards keep all four edges; SSOT slate-200 border (no left-edge strip)
    expect(detailCss).not.toMatch(/border-left:\s*none\s*!important/);
    expect(detailCss).toMatch(
      /\.pg-config-detail--clinic-os\s+\.detail-section\s*\{[^}]*border:\s*1px\s+solid\s+var\(--cs-slate-200,\s*#E2E8F0\)/s
    );
    expect(formCss).toMatch(
      /\.pg-config-form__panel\s*\{[^}]*border:\s*1px\s+solid\s+var\(--cs-slate-200,\s*#E2E8F0\)/s
    );
    expect(formCss).not.toMatch(
      /\.pg-config-form__panel\s*\{[^}]*border-left:\s*none\s*!important/s
    );
    expect(keyStripCss).toMatch(
      /\.pg-config-key-strip\s*\{[^}]*border:\s*1px\s+solid\s+var\(--cs-slate-200,\s*#E2E8F0\)/s
    );
    // History timeline removed — last-connection meta lives in connection panel
    expect(detailJs).not.toMatch(/history-item/);
    expect(detailJs).not.toMatch(/resolvePgHistoryDisplay/);
  });

  test('Delete is non-ACTIVE gated; Edit remains PENDING-only', () => {
    expect(listUtilsJs).toMatch(/export function isPgConfigDeletable/);
    expect(listUtilsJs).toMatch(/config\.status !== ['"]ACTIVE['"]/);
    expect(listJs).toMatch(/isPgConfigDeletable/);
    expect(listJs).toMatch(/export \{ isPgConfigDeletable \}/);
    expect(listJs).toMatch(/isPgConfigDeletable\(config\)/);
    expect(listJs).toMatch(
      /\{config\.approvalStatus === ['"]PENDING['"] && \([\s\S]*?common\.actions\.edit[\s\S]*?\)\}/
    );
    const pendingEditBlock = listJs.match(
      /\{config\.approvalStatus === ['"]PENDING['"] && \([\s\S]*?common\.actions\.edit[\s\S]*?\)\}/
    );
    expect(pendingEditBlock).not.toBeNull();
    expect(pendingEditBlock[0]).not.toMatch(/admin\.actions\.delete/);
    expect(listJs).toMatch(
      /\{isPgConfigDeletable\(config\) && \([\s\S]*?admin\.actions\.delete[\s\S]*?\)\}/
    );
    expect(listJs).toMatch(
      /err\?\.response\?\.data\?\.message[\s\S]*?err\?\.message/
    );
  });

  test('page stage is full-width (no centered container cap)', () => {
    expect(detailCss).toMatch(
      /\.pg-config-detail\s*\{[^}]*max-width:\s*none/s
    );
    expect(detailCss).not.toMatch(
      /\.pg-config-detail\s*\{[^}]*max-width:\s*1200px/s
    );
    expect(detailCss).not.toMatch(
      /\.pg-config-detail\s*\{[^}]*margin:\s*0\s+auto/s
    );
    expect(detailCss).toMatch(/\.mg-modal__content\s*\{[^}]*max-width:\s*500px/s);

    expect(formCss).toMatch(
      /\.pg-config-form\s*\{[^}]*max-width:\s*none/s
    );
    expect(formCss).not.toMatch(
      /\.pg-config-form\s*\{[^}]*max-width:\s*min\(100%,\s*var\(--container-lg/s
    );
    expect(formCss).not.toMatch(
      /\.pg-config-form\s*\{[^}]*margin:\s*0\s+auto/s
    );
    expect(formCss).toMatch(
      /\.pg-config-form--kicc-wide\s*\{[^}]*max-width:\s*none/s
    );
    expect(formCss).not.toMatch(
      /\.pg-config-form--kicc-wide\s*\{[^}]*max-width:\s*min\(100%,\s*var\(--container-lg\)/s
    );
  });

  test('clinic-os ContentArea keeps gutters (no padding: 0 override)', () => {
    const detailClinicOsBlock = detailCss.match(
      /\.mg-v2-pg-config-detail\.pg-config-detail--clinic-os\s*\{[^}]*\}/s
    );
    expect(detailClinicOsBlock).not.toBeNull();
    expect(detailClinicOsBlock[0]).toMatch(/max-width:\s*none/);
    expect(detailClinicOsBlock[0]).toMatch(/width:\s*100%/);
    expect(detailClinicOsBlock[0]).toMatch(/background:\s*transparent/);
    expect(detailClinicOsBlock[0]).not.toMatch(/padding\s*:/);

    const listClinicOsBlock = listCss.match(
      /\.mg-v2-pg-config-list\.pg-config-list--clinic-os\s*\{[^}]*\}/s
    );
    expect(listClinicOsBlock).not.toBeNull();
    expect(listClinicOsBlock[0]).toMatch(/max-width:\s*none/);
    expect(listClinicOsBlock[0]).toMatch(/width:\s*100%/);
    expect(listClinicOsBlock[0]).not.toMatch(/padding\s*:/);

    const formClinicOsBlock = formCss.match(
      /\.mg-v2-pg-config-create\.pg-config-create--clinic-os,\s*\n?\s*\.mg-v2-pg-config-edit\.pg-config-edit--clinic-os\s*\{[^}]*\}/s
    );
    expect(formClinicOsBlock).not.toBeNull();
    expect(formClinicOsBlock[0]).toMatch(/max-width:\s*none/);
    expect(formClinicOsBlock[0]).toMatch(/width:\s*100%/);
    expect(formClinicOsBlock[0]).not.toMatch(/padding\s*:/);

    // Legacy inner .pg-config-detail padding neutralized under clinic-os
    expect(detailCss).toMatch(
      /\.pg-config-detail--clinic-os\s+\.pg-config-detail\s*\{[^}]*padding:\s*0/s
    );
  });

  test('Detail soft refresh: no full-page blank on connection test / session churn', () => {
    expect(detailJs).toMatch(
      /\(\s*sessionLoading\s*&&\s*!config\s*\)\s*\|\|\s*\(\s*loading\s*&&\s*!config\s*\)/
    );
    expect(detailJs).not.toMatch(/if\s*\(\s*sessionLoading\s*\|\|\s*loading\s*\)/);
    expect(detailJs).toMatch(/const\s+softRefresh\s*=\s*hasConfigRef\.current/);
    expect(detailJs).toMatch(/if\s*\(\s*!softRefresh\s*\)\s*\{\s*setLoading\(true\)/);
    expect(detailJs).toMatch(/userId/);
    expect(detailJs).toMatch(
      /\[\s*tenantId\s*,\s*configId\s*,\s*sessionLoading\s*,\s*isLoggedIn\s*,\s*userId\s*\]/
    );
    expect(detailJs).not.toMatch(
      /\[\s*tenantId\s*,\s*configId\s*,\s*sessionLoading\s*,\s*isLoggedIn\s*,\s*user\s*\]/
    );
    expect(detailJs).not.toMatch(/location\.reload/);
    expect(detailJs).not.toMatch(/navigate\s*\(\s*0\s*\)/);

    // Connection test stays card-level (testingConnection only; no page setLoading)
    const testConnBlock = detailJs.match(
      /const\s+handleTestConnection\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/
    );
    expect(testConnBlock).not.toBeNull();
    expect(testConnBlock[0]).toMatch(/setTestingConnection\(true\)/);
    expect(testConnBlock[0]).not.toMatch(/setLoading\(true\)/);
    expect(testConnBlock[0]).toMatch(/setConfig\(detail\)/);

    // Form test connection uses local flag only
    expect(formJs).toMatch(/setTestConnectionLoading\(true\)/);
    const formTestBlock = formJs.match(
      /const\s+handleTestConnection\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/
    );
    expect(formTestBlock).not.toBeNull();
    expect(formTestBlock[0]).not.toMatch(/setLoading\(true\)/);
  });

  test('Ship: key strip read-only summary (pgd2) + 2-col connection panel', () => {
    expect(formJs).toMatch(/PgConfigKeyStrip/);
    expect(formJs).toMatch(/PgConfigTestModePair/);
    expect(detailJs).toMatch(/PgConfigurationForm/);
    expect(detailJs).toMatch(/PgConfigKeyStrip|showConnectionMeta/);
    expect(keyStripJs).toMatch(/pg-config-key-strip/);
    expect(keyStripJs).toMatch(/채널 키/);
    expect(keyStripJs).toMatch(/스토어 ID/);
    expect(keyStripJs).toMatch(/테스트 모드/);
    expect(keyStripJs).toMatch(/운영/);
    expect(keyStripJs).toMatch(/실결제 · 운영 키/);
    expect(keyStripJs).not.toMatch(/className=\{?['"`][^'"`]*\bsel\b/);
    expect(keyStripCss).not.toMatch(/\.sel\b/);
    expect(keyStripJs).toMatch(/인라인 편집/);
    expect(formJs).toMatch(/pg-config-form__panel/);
    expect(formJs).toMatch(/pg-config-form__grid2/);
    expect(formJs).toMatch(/연결 정보/);
    expect(formJs).toMatch(/API 시크릿/);
    expect(formCss).toMatch(/\.pg-config-form__grid2\s*\{[^}]*grid-template-columns:\s*1fr 1fr/s);
  });

  test('P0: Test ON / Real OFF educational pair above live keystrip (IAMPORT)', () => {
    expect(testModePairJs).toMatch(/pg-config-test-mode-pair/);
    expect(testModePairJs).toMatch(/테스트 ON/);
    expect(testModePairJs).toMatch(/리얼 OFF/);
    expect(testModePairJs).toMatch(/리얼 전환 시 추가 필수/);
    expect(testModePairJs).toMatch(/테스트 모드 ON OFF 차이/);
    expect(testModePairJs).toMatch(/키스트립 · 필수/);
    expect(testModePairJs).toMatch(/channel-test-••••/);
    expect(testModePairJs).toMatch(/channel-live-••••/);
    expect(testModePairCss).toMatch(
      /\.pg-config-test-mode-pair\s*\{[^}]*grid-template-columns:\s*1fr 1fr/s
    );
    expect(testModePairCss).toMatch(/border:\s*1px solid var\(--cs-slate-200/);
    expect(testModePairCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(testModePairCss).not.toMatch(/rgb\(/);
    const iamportBlock = formJs.slice(
      formJs.indexOf('{isIamportPortoneV2 && ('),
      formJs.indexOf('{!isIamportPortoneV2 && !isKicc && (')
    );
    expect(iamportBlock).toMatch(/PgConfigTestModePair/);
    expect(iamportBlock).toMatch(/PgConfigKeyStrip/);
    expect(iamportBlock.indexOf('PgConfigTestModePair')).toBeLessThan(
      iamportBlock.indexOf('PgConfigKeyStrip')
    );
  });

  test('P0: Detail kebab always visible; delete disabled when not deletable', () => {
    expect(detailJs).toMatch(/EntityRowActions/);
    expect(detailJs).not.toMatch(
      /\{isPgConfigDeletable\(config\) && \([\s\S]*?EntityRowActions/
    );
    expect(detailJs).toMatch(/ariaLabel=["']추가 작업["']/);
    expect(detailJs).toMatch(/disabled:\s*!isPgConfigDeletable\(config\)/);
    expect(detailJs).toMatch(/활성 설정은 비활성화 후 삭제/);
    expect(detailJs).toMatch(/variant:\s*['"]destructive['"]/);
    expect(detailJs).toMatch(/isPgConfigDeletable\(config\)/);
    expect(detailCss).toMatch(
      /\.pg-config-detail--clinic-os\s+\.mg-v2-entity-row-actions__trigger/
    );
  });

  test('Ship: slate focus not green/teal ring; Save dusty teal only', () => {
    expect(formCss).toMatch(/--pg-ship-focus-fill:\s*var\(--cs-slate-200\)/);
    expect(formCss).toMatch(/--pg-ship-focus-border:\s*var\(--mg-v2-color-border-dark\)/);
    expect(formCss).toMatch(/--pg-ship-save:\s*var\(--mg-v2-color-primary-solid\)/);
    expect(formCss).toMatch(/pg-config-form--ship[\s\S]*box-shadow:\s*none/);
    expect(detailCss).toMatch(/--pg-ship-focus-fill:\s*var\(--cs-slate-200\)/);
    expect(detailCss).toMatch(/--pg-ship-brick:\s*var\(--mg-v2-color-semantic-error\)/);
  });

  test('Ship: Detail editable form + action bar + crumb + amber rail', () => {
    expect(detailJs).toMatch(/pg-config-detail__crumb/);
    expect(detailJs).toMatch(/결제 연결 \/ <b>상세<\/b>/);
    expect(detailJs).toMatch(/pg-config-detail__rail/);
    expect(detailJs).toMatch(/승인 대기 — 저장 후 운영 승인되면/);
    expect(detailJs).toMatch(/form=\{PG_DETAIL_FORM_ID\}/);
    expect(detailJs).toMatch(/>\s*저장\s*</);
    expect(detailJs).toMatch(/>\s*목록\s*</);
    expect(detailJs).toMatch(/연결 시험/);
    // 연결 시험 is always in the action bar (not gated by APPROVED/ACTIVE)
    expect(detailJs).not.toMatch(
      /\(config\.status === ['"]APPROVED['"] \|\| config\.status === ['"]ACTIVE['"]\) && \(/
    );
    expect(detailJs).toMatch(/EntityRowActions/);
    expect(detailJs).not.toMatch(/채널 키 수정/);
    expect(detailJs).not.toMatch(/showPortoneSettingsModal/);
    expect(detailJs).not.toMatch(/포트원 테스트 결제/);
    expect(detailJs).not.toMatch(/handlePortOneSmokePayment/);
    expect(detailJs).not.toMatch(/smokeResultOpen/);
    expect(detailJs).not.toMatch(/detail-section/);
    expect(detailJs).toMatch(/hideFooter/);
    expect(detailJs).toMatch(/showConnectionMeta/);
    expect(detailJs).toMatch(/updatePortonePgSettings/);
    expect(detailJs).toMatch(/updatePgConfiguration/);
    expect(formJs).toMatch(/showConnectionMeta/);
    expect(formJs).toMatch(/마지막 연결 시험/);
    expect(formJs).toMatch(/hideFooter/);
    // testMode fail-closed: live secret required unless ACTIVE blank→PATCH
    expect(formJs).toMatch(/allowBlankSecret/);
    expect(formJs).toMatch(/테스트에선 사용 안 함/);
  });

  test('Ship worth: pgd1 no default URL field; pgd3 켜짐; pgd4 delete in EntityRowActions', () => {
    const iamportBlock = formJs.slice(
      formJs.indexOf('{isIamportPortoneV2 && ('),
      formJs.indexOf('{!isIamportPortoneV2 && !isKicc && (')
    );
    expect(iamportBlock).toMatch(/portone-webhook-url-readonly/);
    expect(iamportBlock).not.toMatch(/htmlFor="returnUrl"/);
    expect(iamportBlock).not.toMatch(/htmlFor="webhookUrl"/);
    expect(iamportBlock).not.toMatch(/id="returnUrl"/);
    expect(formJs).toMatch(/statusLabel=\{formData\.testMode \? '켜짐' : undefined\}/);
    expect(detailJs).toMatch(/EntityRowActions/);
    expect(detailJs).toMatch(/variant:\s*['"]destructive['"]/);
    expect(detailJs).toMatch(/isPgConfigDeletable\(config\)/);
    expect(detailJs).toMatch(/renderConnectionBadge/);
    expect(detailJs).toMatch(/사용중/);
    expect(detailJs).toMatch(/승인 대기/);
    expect(detailJs).toMatch(/status-badge--ship-rejected[\s\S]*거부/);
  });
});
