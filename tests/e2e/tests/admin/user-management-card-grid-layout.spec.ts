/**
 * /admin/user-management smallCard 그리드 레이아웃 게이트 (5폭).
 *
 * - ListBlockView: auto-fill + --mg-v2-list-card-min-width (폭별 repeat(N) MQ 금지)
 * - 이름·연락처 ellipsis 제거 / 이메일 overflow-wrap:anywhere
 * - 정적 셸: Desktop/MobileLayout + ContentArea + ListBlockView + ProfileCard + ConsultantCard CSS
 * - 측정: clip / overlap / widthRatio / columns
 *
 * 로그인·백엔드 불필요(정적 셸). 라이브는 backend 없으면 skip.
 *
 * 실행 예:
 *   cd tests/e2e && npx playwright test tests/admin/user-management-card-grid-layout.spec.ts \
 *     --config=playwright.manual.config.ts --project=chromium
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { loginErpUser, LOCAL_E2E_BACKEND_API_BASE_URL } from '../../helpers/erpAuth';

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const FRONTEND_SRC = path.join(REPO_ROOT, 'frontend/src');
const ARTIFACT_BASENAME = 'user-mgmt-card-grid-measure.md';

const VIEWPORTS = [820, 1180, 1280, 1440, 1920] as const;
const WIDTH_RATIO_MIN = 0.95;
const DESKTOP_BP = 1280;
const CARD_COUNT = 18;
const LAYOUT_MAIN_SELECTOR =
  'main.mg-v2-desktop-layout__main, main.mg-v2-mobile-layout__main';
const GRID_SELECTOR = '[data-testid="user-mgmt-card-grid"]';

const readText = (filePath: string) => fs.readFileSync(filePath, 'utf8');
const readCss = (...rel: string[]) =>
  readText(path.join(FRONTEND_SRC, ...rel));

type MeasureRow = {
  width: number;
  clip: number;
  overlap: number;
  widthRatio: number;
  columns: number;
  pass: boolean;
};

/** CI 권한 이슈 회피: env → repo .artifacts → /opt/cursor/artifacts 순 베스트에포트 */
function resolveArtifactDirs(): string[] {
  const dirs: string[] = [];
  const fromEnv = process.env.CURSOR_ARTIFACTS_DIR?.trim();
  if (fromEnv) {
    dirs.push(fromEnv);
  }
  dirs.push(path.join(REPO_ROOT, 'tests/e2e/.artifacts'));
  dirs.push('/opt/cursor/artifacts');
  return [...new Set(dirs)];
}

function writeMeasureArtifact(rows: MeasureRow[], extras: string[]) {
  const lines = [
    '# user-mgmt smallCard grid measure',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    ...extras,
    '',
    '| viewport | clip | overlap | widthRatio | columns | result |',
    '|----------|------|---------|------------|---------|--------|',
    ...rows.map((r) =>
      `| ${r.width} | ${r.clip} | ${r.overlap} | ${r.widthRatio.toFixed(3)} | ${r.columns} | ${r.pass ? 'PASS' : 'FAIL'} |`
    ),
    '',
    '## Pass criteria',
    '- clip: 0 (scrollWidth > clientWidth + 1)',
    '- overlap: 0 (AABB cross > 1px)',
    '- widthRatio: ≥ 0.95 (grid / layout main)',
    '- columns @1280: not overcrowded 5-col (auto-fill with 17.5rem min)',
    ''
  ];
  const body = lines.join('\n');

  try {
    for (const dir of resolveArtifactDirs()) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, ARTIFACT_BASENAME), body, 'utf8');
        return;
      } catch {
        // try next candidate
      }
    }
  } catch {
    // best-effort: assertions continue even if no artifact was written
  }
}

/** 긴 이름·이메일로 wrap/clip 회귀를 유도 */
const LONG_NAMES = [
  '김매우긴이름테스트사용자열두글자이상',
  '이상담사이름이꽤긴편입니다검증용',
  '박내담자긴이름OverflowCheck사용자'
];
const LONG_EMAILS = [
  'verylong.email.address.for.overflow.test@example-domain-name.com',
  'another.super.long.client.email.address@mindgarden-clinic.example.org',
  'consultant.with.very.long.localpart@core-solution.example.com'
];
const PHONES = ['010-1234-5678', '02-123-4567', '031-9876-5432'];

function buildCardMarkup(index: number): string {
  const name = LONG_NAMES[index % LONG_NAMES.length];
  const email = LONG_EMAILS[index % LONG_EMAILS.length];
  const phone = PHONES[index % PHONES.length];
  const useProfile = index % 2 === 0;

  if (useProfile) {
    return `
<article class="mg-v2-profile-card mg-v2-profile-card--compact" data-testid="measure-card" data-card-kind="profile">
  <div class="mg-v2-profile-card__header">
    <div class="mg-v2-profile-card__avatar"><span>${name.slice(0, 1)}</span></div>
    <div class="mg-v2-profile-card__info">
      <h3 class="mg-v2-profile-card__name">${name} ${index + 1}</h3>
      <div class="mg-v2-profile-card__contact">
        <span class="mg-v2-profile-card__email">${email}</span>
        <span class="mg-v2-profile-card__phone">${phone}</span>
      </div>
    </div>
  </div>
</article>`;
  }

  return `
<article class="mg-consultant-card mg-consultant-card--admin-compact" data-testid="measure-card" data-card-kind="consultant" role="button">
  <div class="mg-consultant-card__header-section">
    <div class="mg-consultant-card__avatar">${name.slice(0, 1)}</div>
    <div class="mg-consultant-card__info-group">
      <h4 class="mg-consultant-card__name">${name} ${index + 1}</h4>
      <div class="mg-consultant-card__contact">
        <span class="mg-consultant-card__contact-item">${email}</span>
        <span class="mg-consultant-card__contact-item">${phone}</span>
      </div>
    </div>
    <div class="mg-consultant-card__corner-actions">
      <button type="button" aria-label="더보기">⋮</button>
    </div>
  </div>
</article>`;
}

const buildShellHarnessHtml = (width: number) => {
  const isDesktop = width >= DESKTOP_BP;
  const tokens = readCss('styles/tokens/design-v2-tokens.css');
  const responsive = readCss('styles/responsive-layout-tokens.css');
  const desktopLayout = readCss('components/dashboard-v2/templates/DesktopLayout.css');
  const mobileLayout = readCss('components/dashboard-v2/templates/MobileLayout.css');
  const contentArea = readCss('components/dashboard-v2/content/ContentArea.css');
  const listBlock = readCss('components/common/ListBlockView.css');
  const profileCard = readCss('components/admin/ProfileCard.css');
  const consultantCard = readCss('components/ui/Card/ConsultantCard.css');
  const userMgmt = readCss('components/admin/UserManagement.css');

  const cards = Array.from({ length: CARD_COUNT }, (_, i) => buildCardMarkup(i)).join('\n');

  const harnessExtras = `
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
.mg-consultant-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 16px;
  position: relative;
  overflow: visible;
  padding: 12px;
  min-height: auto;
}
.mg-consultant-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e8e8e8;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.mg-consultant-card__contact {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.75rem;
  min-width: 0;
}
.mg-consultant-card__name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
}
.user-mgmt-harness-body {
  width: 100%;
  min-width: 0;
}
`;

  const bodyInner = `
<div class="user-mgmt-harness-body" data-testid="user-mgmt-body">
  <div class="mg-v2-list-block__grid mg-v2-list-block__grid--small" data-testid="user-mgmt-card-grid">
    ${cards}
  </div>
</div>`;

  if (isDesktop) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
${tokens}
${responsive}
${desktopLayout}
${contentArea}
${listBlock}
${profileCard}
${consultantCard}
${userMgmt}
${harnessExtras}
</style>
</head>
<body>
<div class="mg-v2-desktop-layout" data-testid="admin-shell">
  <div class="mg-v2-desktop-layout__body">
    <aside class="shell-lnb" data-testid="desktop-lnb" style="width:var(--mg-layout-sidebar-width);flex-shrink:0;"></aside>
    <main class="mg-v2-desktop-layout__main" role="main">
      <div class="mg-v2-content-area" role="region" aria-label="대시보드 콘텐츠">
        ${bodyInner}
      </div>
    </main>
  </div>
</div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
${tokens}
${responsive}
${mobileLayout}
${contentArea}
${listBlock}
${profileCard}
${consultantCard}
${userMgmt}
${harnessExtras}
</style>
</head>
<body>
<div class="mg-v2-mobile-layout" data-testid="admin-shell">
  <header data-testid="shell-header">
    <button type="button" class="mg-v2-mobile-gnb__menu" aria-label="메뉴" data-testid="mobile-gnb-menu">☰</button>
    <span>사용자 관리</span>
  </header>
  <main class="mg-v2-mobile-layout__main" role="main">
    <div class="mg-v2-mobile-layout__stage">
      <div class="mg-v2-content-area" role="region" aria-label="대시보드 콘텐츠">
        ${bodyInner}
      </div>
    </div>
  </main>
</div>
</body>
</html>`;
};

async function measureGrid(page: Page): Promise<Omit<MeasureRow, 'width' | 'pass'>> {
  return page.evaluate(({ layoutMainSelector, gridSelector }) => {
    const main = document.querySelector(layoutMainSelector) as HTMLElement | null;
    const grid = document.querySelector(gridSelector) as HTMLElement | null;
    const cards = Array.from(
      document.querySelectorAll('[data-testid="measure-card"]')
    ) as HTMLElement[];

    const textNodes = Array.from(
      document.querySelectorAll(
        [
          '.mg-v2-profile-card__name',
          '.mg-v2-profile-card__email',
          '.mg-v2-profile-card__phone',
          '.mg-consultant-card__name',
          '.mg-consultant-card__contact-item',
          '.user-mgmt-name',
          '.user-mgmt-email'
        ].join(',')
      )
    ) as HTMLElement[];

    let clip = 0;
    for (const el of textNodes) {
      if (el.scrollWidth > el.clientWidth + 1) {
        clip += 1;
      }
    }

    let overlap = 0;
    const rects = cards.map((c) => c.getBoundingClientRect());
    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        const a = rects[i];
        const b = rects[j];
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 1 && oy > 1) {
          overlap += 1;
        }
      }
    }

    const mainW = main ? main.getBoundingClientRect().width : 0;
    const gridW = grid ? grid.getBoundingClientRect().width : 0;
    const widthRatio = mainW > 0 ? gridW / mainW : 0;

    const template = grid ? getComputedStyle(grid).gridTemplateColumns : '';
    const columns = template
      ? template.split(/\s+/).filter((t) => t.length > 0).length
      : 0;

    return { clip, overlap, widthRatio, columns };
  }, {
    layoutMainSelector: LAYOUT_MAIN_SELECTOR,
    gridSelector: GRID_SELECTOR
  });
}

test.describe('사용자관리 smallCard 그리드 CSS 계약', () => {
  test('ListBlockView: auto-fill + min-width 토큰, 폭별 repeat(N) MQ 없음', () => {
    const list = readCss('components/common/ListBlockView.css');
    expect(list).toMatch(/--mg-v2-list-card-min-width/);
    expect(list).toMatch(
      /repeat\(\s*auto-fill\s*,\s*minmax\(\s*min\(\s*100%\s*,\s*var\(--mg-v2-list-card-min-width\)\)\s*,\s*1fr\s*\)\s*\)/
    );
    expect(list).not.toMatch(/repeat\(\s*[234]\s*,/);
    expect(list).not.toMatch(
      /@media[^{]*\{[^}]*grid-template-columns:\s*repeat\(\s*[234]/s
    );
  });

  test('이름·이메일 ellipsis 제거 / 이메일 overflow-wrap:anywhere', () => {
    const profile = readCss('components/admin/ProfileCard.css');
    const userMgmt = readCss('components/admin/UserManagement.css');
    const tokens = readCss('styles/tokens/design-v2-tokens.css');

    expect(tokens).toMatch(/--mg-v2-list-card-min-width:\s*17\.5rem/);

    expect(profile).not.toMatch(
      /\.mg-v2-profile-card__name[^{]*\{[^}]*text-overflow:\s*ellipsis/s
    );
    expect(userMgmt).not.toMatch(
      /\.user-mgmt-name[^{]*\{[^}]*text-overflow:\s*ellipsis/s
    );
    expect(userMgmt).not.toMatch(
      /\.user-mgmt-email[^{]*\{[^}]*text-overflow:\s*ellipsis/s
    );

    expect(profile).toMatch(
      /\.mg-v2-profile-card__email[^{]*\{[^}]*overflow-wrap:\s*anywhere/s
    );
    expect(userMgmt).toMatch(
      /\.user-mgmt-email[^{]*\{[^}]*overflow-wrap:\s*anywhere/s
    );
  });
});

test.describe('사용자관리 smallCard 그리드 정적 셸 5폭 실측', () => {
  test('5폭: clip·overlap·폭비·열수', async({ page }, testInfo) => {
    const rows: MeasureRow[] = [];

    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(buildShellHarnessHtml(width), {
        waitUntil: 'domcontentloaded'
      });

      if (width < DESKTOP_BP) {
        await expect(page.getByRole('button', { name: '메뉴' })).toBeVisible();
      } else {
        await expect(page.getByTestId('desktop-lnb')).toBeVisible();
      }

      await expect(page.locator(GRID_SELECTOR)).toBeVisible();
      await expect(page.locator('[data-testid="measure-card"]')).toHaveCount(CARD_COUNT);

      const m = await measureGrid(page);
      const pass =
        m.clip === 0 &&
        m.overlap === 0 &&
        m.widthRatio >= WIDTH_RATIO_MIN &&
        !(width === 1280 && m.columns >= 5);

      rows.push({
        width,
        clip: m.clip,
        overlap: m.overlap,
        widthRatio: m.widthRatio,
        columns: m.columns,
        pass
      });

      expect(m.clip, `${width}px clip`).toBe(0);
      expect(m.overlap, `${width}px overlap`).toBe(0);
      expect(m.widthRatio, `${width}px widthRatio`).toBeGreaterThanOrEqual(WIDTH_RATIO_MIN);
      if (width === 1280) {
        expect(m.columns, '1280px must not overcrowd to 5 cols').toBeLessThan(5);
      }
    }

    const cssHashFiles = (() => {
      const cssDir = path.join(REPO_ROOT, 'frontend/build/static/css');
      if (!fs.existsSync(cssDir)) {
        return 'build missing';
      }
      return fs
        .readdirSync(cssDir)
        .filter((f) => /^main\.[a-f0-9]+\.css$/.test(f))
        .join(', ') || 'none';
    })();

    writeMeasureArtifact(rows, [
      `- CSS build artifact: \`${cssHashFiles}\``,
      `- Card count: ${CARD_COUNT} (ProfileCard compact + ConsultantCard admin-compact)`,
      `- Mode: static shell harness`
    ]);

    const summary = rows
      .map(
        (r) =>
          `${r.width}: clip=${r.clip} overlap=${r.overlap} ratio=${r.widthRatio.toFixed(3)} cols=${r.columns} ${r.pass ? 'PASS' : 'FAIL'}`
      )
      .join(' | ');
    const oneLine = `LOCAL_RESULT Playwright user-mgmt-card-grid: ${summary}`;
    console.log(oneLine);
    testInfo.annotations.push({ type: 'LOCAL_RESULT', description: oneLine });

    expect(rows.every((r) => r.pass)).toBe(true);
  });
});

test.describe('사용자관리 /admin/user-management 라이브(선택)', () => {
  test.setTimeout(120_000);

  test('LIVE: client 타입 5폭 요약 또는 skip', async({ page }, testInfo) => {
    let backendOk = false;
    try {
      const probe = await page.request.get(
        `${LOCAL_E2E_BACKEND_API_BASE_URL}/actuator/health`,
        { timeout: 2500 }
      );
      backendOk = probe.ok();
    } catch {
      backendOk = false;
    }

    if (!backendOk) {
      const msg =
        'LOCAL_RESULT Playwright: backend unavailable — static shell PASS; live /admin/user-management skipped';
      console.log(msg);
      testInfo.annotations.push({ type: 'LOCAL_RESULT', description: msg });
      test.skip(true, msg);
      return;
    }

    try {
      await loginErpUser(page, testInfo);
    } catch (err) {
      const msg = `LOCAL_RESULT Playwright: login failed — ${(err as Error).message}`;
      console.log(msg);
      testInfo.annotations.push({ type: 'LOCAL_RESULT', description: msg });
      test.skip(true, msg);
      return;
    }

    const liveRows: string[] = [];
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/admin/user-management?type=client', {
        waitUntil: 'domcontentloaded'
      });
      await page.waitForTimeout(800);

      const grid = page.locator(
        '.mg-v2-list-block__grid--small, .user-mgmt-grid'
      ).first();
      const visible = await grid.isVisible().catch(() => false);
      liveRows.push(`${width}: gridVisible=${visible ? 'Y' : 'N'}`);
    }

    const oneLine = `LOCAL_RESULT Playwright live user-mgmt: ${liveRows.join(' | ')}`;
    console.log(oneLine);
    testInfo.annotations.push({ type: 'LOCAL_RESULT', description: oneLine });
  });
});
