/**
 * 시각 하네스 캡처 — 번들을 로컬 HTTP 로 띄우고 Playwright(시스템 Chrome)로 화면별 뷰포트 스크린샷 +
 * DOM 판정을 수행해 `cover-v4-screen-matrix.{json,md}` 를 쓴다.
 *
 * 상태 = 스크린샷 파일 존재 AND 해당 화면 DOM 판정 전부 통과 AND 페이지 오류 없음.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { ARTIFACTS_DIR, CHROME_PATH, OUT_DIR, TOOLS_DIR, requireTool } = require('./tools');

const MATRIX_BASENAME = 'cover-v4-screen-matrix';
const DOCK_SELECTOR = '[data-testid="harness-role-dock"]';
const RENDER_TIMEOUT_MS = 15000;
const SETTLE_MS = 250;
const DEVICE_SCALE_FACTOR = 2;
const FONT_FAMILIES = ['Pretendard-Regular', 'Pretendard-Medium', 'Pretendard-SemiBold'];

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.otf': 'font/otf',
  '.ttf': 'font/ttf',
  '.png': 'image/png',
};

function serveStatic(rootDir) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filePath = path.join(rootDir, urlPath === '/' ? 'index.html' : urlPath);
    if (
      !filePath.startsWith(rootDir) ||
      !fs.existsSync(filePath) ||
      fs.statSync(filePath).isDirectory()
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() });
    });
  });
}

function fileOk(p) {
  return fs.existsSync(p) && fs.statSync(p).size > 0;
}

async function captureSpec(browser, base, spec) {
  const context = await browser.newContext({
    viewport: spec.viewport,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err && err.message ? err.message : err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const file = path.join(ARTIFACTS_DIR, spec.file);
  const scrolledFile = spec.scrolledCapture ? file.replace(/\.png$/, '-scrolled.png') : null;
  fs.rmSync(file, { force: true });
  if (scrolledFile) {
    fs.rmSync(scrolledFile, { force: true });
  }

  let run = null;
  let fontsLoaded = {};
  let scrollers = 0;
  try {
    await page.goto(`${base}/index.html?key=${encodeURIComponent(spec.key)}`, {
      waitUntil: 'load',
    });
    await page.waitForSelector(DOCK_SELECTOR, { timeout: RENDER_TIMEOUT_MS });
    fontsLoaded = await page.evaluate(async (families) => {
      await Promise.all(families.map((f) => document.fonts.load(`16px '${f}'`)));
      await document.fonts.ready;
      return Object.fromEntries(families.map((f) => [f, document.fonts.check(`16px '${f}'`)]));
    }, FONT_FAMILIES);
    await page.waitForTimeout(SETTLE_MS);
    await page.screenshot({ path: file });
    run = await page.evaluate(() => window.__COVER_HARNESS__.run());
    if (scrolledFile) {
      scrollers = await page.evaluate(() => window.__COVER_HARNESS__.scrollAllToEnd());
      await page.waitForTimeout(SETTLE_MS);
      await page.screenshot({ path: scrolledFile });
    }
  } catch (err) {
    pageErrors.push(`capture: ${err.message}`);
  } finally {
    await context.close();
  }

  const assertions = run ? run.assertions : [];
  const screenshotExists = fileOk(file);
  const assertionsPass = assertions.length > 0 && assertions.every((a) => a.pass);
  const status = screenshotExists && assertionsPass && pageErrors.length === 0 ? 'PASS' : 'FAIL';
  const snap = run ? run.snapshot : null;
  return {
    key: spec.key,
    kind: spec.kind,
    title: spec.title,
    role: spec.role,
    screen: spec.screen,
    fixture: spec.fixture,
    file: spec.file,
    path: file,
    scrolledPath: scrolledFile && fileOk(scrolledFile) ? scrolledFile : null,
    viewport: spec.viewport,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    expectedMode: spec.expectedMode,
    measuredMode: snap ? snap.layoutMode : null,
    screenshotExists,
    assertionsPass,
    status,
    assertions,
    fontsLoaded,
    scrollContainers: scrollers,
    safeArea: {
      mockInsets: spec.insets,
      measured: snap ? snap.safeArea : null,
      physicalDevice: 'UNVERIFIED',
    },
    dockLabels: snap ? snap.dockLabels : [],
    activeDockLabels: snap ? snap.activeDockLabels : [],
    institutionBadgeCount: snap ? snap.institutionBadgeCount : null,
    unpaidNodes: snap ? snap.unpaidNodes : [],
    pageErrors,
    consoleErrors,
  };
}

function buildEdgeCaseRows(groups, byKey) {
  return groups.map((group) => {
    const evidence = group.keys.map((key) => {
      const r = byKey.get(key);
      const picked = r ? r.assertions.filter((a) => group.assertionIds.includes(a.id)) : [];
      return {
        key,
        file: r ? r.file : null,
        screenshotExists: Boolean(r && r.screenshotExists),
        pass: Boolean(r) && r.screenshotExists && picked.length > 0 && picked.every((a) => a.pass),
        assertions: picked,
        ...(group.physicalDevice ? { safeArea: r ? r.safeArea : null } : {}),
      };
    });
    const pass = evidence.length > 0 && evidence.every((e) => e.pass);
    return {
      id: group.id,
      title: group.title,
      status: pass ? 'PASS' : 'FAIL',
      ...(group.physicalDevice ? { physicalDevice: group.physicalDevice } : {}),
      evidence,
    };
  });
}

function mdEscape(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function renderMarkdown(matrix) {
  const lines = [];
  lines.push('# Cover/Chapter v4 — implementation runtime screen matrix');
  lines.push('');
  lines.push(
    `Generated ${matrix.generatedAt} · ${matrix.harness.fixtureTag} · react-native-web ${matrix.harness.reactNativeWebVersion} · ${matrix.harness.browser}`,
  );
  lines.push('');
  lines.push(
    `Summary: **${matrix.summary.screensPass}/${matrix.summary.screensTotal} screens PASS**, ${matrix.summary.edgeCasesPass}/${matrix.summary.edgeCasesTotal} edge-case rows PASS. Safe area on physical devices: **UNVERIFIED**.`,
  );
  lines.push('');
  lines.push('## Screens (7)');
  lines.push('');
  lines.push(
    '| # | Screen | File | Viewport | Mode expected → measured | Screenshot | DOM assertions | Status |',
  );
  lines.push('|---|---|---|---|---|---|---|---|');
  matrix.screens.forEach((s, i) => {
    const passed = s.assertions.filter((a) => a.pass).length;
    lines.push(
      `| ${i + 1} | ${mdEscape(s.title)} | \`${s.file}\` | ${s.viewport.width}×${s.viewport.height} | ${s.expectedMode} → ${s.measuredMode ?? '—'} | ${s.screenshotExists ? 'yes' : 'NO'} | ${passed}/${s.assertions.length} | **${s.status}** |`,
    );
  });
  lines.push('');
  lines.push('### Safe area (mock insets → measured, harness only)');
  lines.push('');
  lines.push(
    '| Screen | Mock top / bottom | SafeAreaView padding-top | Dock padding-bottom | Dock height | Physical device |',
  );
  lines.push('|---|---|---|---|---|---|');
  for (const s of matrix.screens) {
    const m = s.safeArea.measured;
    lines.push(
      `| ${s.key} | ${s.safeArea.mockInsets.top} / ${s.safeArea.mockInsets.bottom} | ${m ? m.paddingTop : '—'} | ${m ? m.dockPaddingBottom : '—'} | ${m ? Math.round(m.dockHeight) : '—'} | UNVERIFIED |`,
    );
  }
  lines.push('');
  lines.push('## Edge cases');
  lines.push('');
  lines.push('| Edge case | Status | Evidence (screen → pass) |');
  lines.push('|---|---|---|');
  for (const e of matrix.edgeCases) {
    const ev = e.evidence.map((x) => `${x.key}: ${x.pass ? 'PASS' : 'FAIL'}`).join('<br>');
    const status = e.physicalDevice
      ? `**${e.status}** (harness) · physical device ${e.physicalDevice}`
      : `**${e.status}**`;
    lines.push(`| ${mdEscape(e.title)} | ${status} | ${ev} |`);
  }
  lines.push('');
  lines.push('### Edge-case screenshots');
  lines.push('');
  for (const s of matrix.edgeScreens) {
    lines.push(`- \`${s.file}\` — ${s.title}: **${s.status}**`);
  }
  const failing = [...matrix.screens, ...matrix.edgeScreens].filter((s) => s.status !== 'PASS');
  lines.push('');
  lines.push('## Assertion details');
  lines.push('');
  for (const s of [...matrix.screens, ...matrix.edgeScreens]) {
    lines.push(`<details><summary>${s.key} — ${s.status}</summary>`);
    lines.push('');
    for (const a of s.assertions) {
      lines.push(`- ${a.pass ? 'PASS' : 'FAIL'} \`${a.id}\` — ${mdEscape(a.detail)}`);
    }
    if (s.pageErrors.length > 0) {
      lines.push(`- page errors: ${mdEscape(s.pageErrors.join(' / '))}`);
    }
    lines.push('');
    lines.push('</details>');
  }
  lines.push('');
  lines.push('## Harness notes');
  lines.push('');
  lines.push(
    `- Real component modules bundled: ${matrix.harness.coverChapterModules.length} (${matrix.harness.coverChapterModulesMissing.length} missing).`,
  );
  lines.push(`- Stubbed native-only modules: ${matrix.harness.stubbedModules.join(', ')}.`);
  lines.push(
    '- Screens are harness assemblies mirroring the route files block-for-block; route files themselves are not mounted (no router / query / auth stores).',
  );
  lines.push(
    '- Safe-area insets are mocked through `SafeAreaInsetsContext`; real-device notch / home-indicator behaviour is UNVERIFIED.',
  );
  if (failing.length > 0) {
    lines.push(`- FAILING: ${failing.map((s) => s.key).join(', ')}`);
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const { chromium } = requireTool('playwright-core');
  const meta = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'bundle-meta.json'), 'utf8'));
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const server = await serveStatic(OUT_DIR);
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  try {
    const indexPage = await browser.newPage();
    await indexPage.goto(`${server.base}/index.html`, { waitUntil: 'load' });
    const registry = await indexPage.evaluate(() => {
      const h = window.__COVER_HARNESS__;
      return { fixtureTag: h.fixtureTag, specs: h.specs, edgeCaseGroups: h.edgeCaseGroups };
    });
    await indexPage.close();

    const results = [];
    for (const spec of registry.specs) {
      const r = await captureSpec(browser, server.base, spec);
      results.push(r);
      const failed = r.assertions.filter((a) => !a.pass).map((a) => a.id);
      console.log(
        `[cover-harness] ${r.status} ${spec.key} (${spec.viewport.width}x${spec.viewport.height}, mode ${r.measuredMode})` +
          (failed.length ? ` failed=[${failed.join(', ')}]` : '') +
          (r.pageErrors.length ? ` errors=${r.pageErrors.length}` : ''),
      );
    }

    const byKey = new Map(results.map((r) => [r.key, r]));
    const screens = results.filter((r) => r.kind === 'screen');
    const edgeScreens = results.filter((r) => r.kind === 'edge');
    const edgeCases = buildEdgeCaseRows(registry.edgeCaseGroups, byKey);
    const matrix = {
      generatedAt: new Date().toISOString(),
      harness: {
        fixtureTag: registry.fixtureTag,
        browser: `Chrome ${browser.version()} (${CHROME_PATH}) via playwright-core ${requireTool('playwright-core/package.json').version}`,
        toolsDir: TOOLS_DIR,
        bundleDir: OUT_DIR,
        ...meta,
      },
      summary: {
        screensTotal: screens.length,
        screensPass: screens.filter((s) => s.status === 'PASS').length,
        edgeScreensTotal: edgeScreens.length,
        edgeScreensPass: edgeScreens.filter((s) => s.status === 'PASS').length,
        edgeCasesTotal: edgeCases.length,
        edgeCasesPass: edgeCases.filter((e) => e.status === 'PASS').length,
        safeAreaPhysicalDevice: 'UNVERIFIED',
      },
      screens,
      edgeScreens,
      edgeCases,
    };
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, `${MATRIX_BASENAME}.json`),
      JSON.stringify(matrix, null, 2),
    );
    fs.writeFileSync(path.join(ARTIFACTS_DIR, `${MATRIX_BASENAME}.md`), renderMarkdown(matrix));
    console.log(
      `[cover-harness] screens ${matrix.summary.screensPass}/${matrix.summary.screensTotal} PASS · edge rows ${matrix.summary.edgeCasesPass}/${matrix.summary.edgeCasesTotal} PASS → ${ARTIFACTS_DIR}/${MATRIX_BASENAME}.{json,md}`,
    );
    const allPass =
      matrix.summary.screensPass === matrix.summary.screensTotal &&
      matrix.summary.edgeScreensPass === matrix.summary.edgeScreensTotal &&
      matrix.summary.edgeCasesPass === matrix.summary.edgeCasesTotal;
    process.exitCode = allPass ? 0 : 1;
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
