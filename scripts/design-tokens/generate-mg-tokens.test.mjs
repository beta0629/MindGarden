/**
 * A단계 토큰 생성기 단위 테스트.
 * 스냅샷(커밋된 생성 파일) · 글자 대비 · 테넌트 brand.* 제한.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  applyTenantBrandOverride,
  contrastRatio,
  driftAgainst,
  generateCss,
  generateTs,
  loadTokens,
  PATHS,
} from './generate-mg-tokens.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = path.join(ROOT, 'scripts/design-tokens/generate-mg-tokens.mjs');

function round2(value) {
  return Math.round(value * 100) / 100;
}

function tokenColor(tokens, key) {
  if (Object.prototype.hasOwnProperty.call(tokens.color, key)) {
    return tokens.color[key];
  }
  if (Object.prototype.hasOwnProperty.call(tokens.brand, key)) {
    return tokens.brand[key];
  }
  throw new Error(`missing color token ${key}`);
}

/** SPEC §2 글자×배경. text:false 는 비글자(border.strong, warning.icon). */
const PAIRS = [
  ['text.primary', 'surface.page', { light: 15.41, dark: 15.58, hc: 21 }, true],
  ['text.secondary', 'surface.page', { light: 7.23, dark: 9.56, hc: 16.48 }, true],
  ['text.secondary', 'surface.card', { light: 7.61, dark: 8.71, hc: 16.48 }, true],
  ['text.tertiary', 'surface.page', { light: 5.33, dark: 7.1, hc: 12.63 }, true],
  ['text.tertiary', 'surface.card', { light: 5.61, dark: 6.47, hc: 12.63 }, true],
  ['text.secondary', 'state.selected.bg', { light: 6.4, dark: 7.49, hc: 12.49 }, true],
  ['text.primary', 'state.selected.bg', { light: 13.64, dark: 12.2, hc: 15.91 }, true],
  ['danger.text', 'surface.card', { light: 6.37, dark: 7.65, hc: 10.01 }, true],
  ['danger.text', 'danger.subtle', { light: 5.57, dark: 6.73, hc: 10.01 }, true],
  ['warning.text', 'surface.card', { light: 6.86, dark: 9.17, hc: 10.99 }, true],
  ['warning.text', 'warning.subtle', { light: 6.21, dark: 7.98, hc: 10.99 }, true],
  ['success.text', 'success.subtle', { light: 5.66, dark: 8.06, hc: 9.98 }, true],
  ['info.text', 'info.subtle', { light: 6.23, dark: 8.05, hc: 11.28 }, true],
  ['text.inverse', 'danger.solid', { light: 6.37, dark: 5.07, hc: 10.01 }, true],
  ['brand.on-primary', 'brand.primary', { light: 7.49, dark: 6.08, hc: 9.4 }, true],
  ['focus.ring', 'surface.page', { light: 15.41, dark: 15.58, hc: 21 }, true],
  ['text.secondary', 'surface.sunken', { light: 6.75, dark: 9.18, hc: 14.72 }, true],
  ['border.strong', 'surface.card', { light: 3.9, dark: 4.25, hc: 21 }, false],
  ['warning.icon', 'surface.card', { light: 2.2, dark: 7.11, hc: 6.86 }, false],
];

test('생성 결과가 커밋된 스냅샷과 같다', () => {
  const tokens = loadTokens();
  const css = fs.readFileSync(PATHS.css, 'utf8');
  const ts = fs.readFileSync(PATHS.ts, 'utf8');
  assert.equal(css, generateCss(tokens));
  assert.equal(ts, generateTs(tokens));
  assert.deepEqual(driftAgainst(css, ts, tokens), []);
});

test('tokens:check 는 최신이면 통과하고, 한 글자만 달라도 실패한다', () => {
  const tokens = loadTokens();
  const css = fs.readFileSync(PATHS.css, 'utf8');
  const ts = fs.readFileSync(PATHS.ts, 'utf8');
  const drifted = driftAgainst(`${css}\n`, ts, tokens);
  assert.deepEqual(drifted, [PATHS.css]);

  const res = spawnSync(process.execPath, [SCRIPT, '--check'], { encoding: 'utf8' });
  assert.equal(res.status, 0, `${res.stdout}\n${res.stderr}`);
});

test('CSS 는 light/dark/high-contrast/forced-colors 를 모두 낸다', () => {
  const css = generateCss(loadTokens());
  const rootAt = css.indexOf('\n:root {');
  const darkAt = css.indexOf('\n[data-theme="dark"] {');
  const hcAt = css.indexOf('\n[data-theme="hc"] {');
  const forcedAt = css.indexOf('\n@media (forced-colors: active)');
  assert.ok(rootAt > 0 && darkAt > rootAt && hcAt > darkAt && forcedAt > hcAt);
  assert.equal(css.includes('prefers-color-scheme'), false);
  assert.equal(css.includes('data-theme="high-contrast"'), false);

  const root = css.slice(rootAt, darkAt);
  const dark = css.slice(darkAt, hcAt);
  const hc = css.slice(hcAt, forcedAt);
  const forced = css.slice(forcedAt);

  assert.ok(root.includes('--mg-surface-page: #FAF9F7;'));
  assert.ok(root.includes('--mg-text-primary: #1B2128;'));
  assert.ok(root.includes('--mg-brand-primary: #0E5F5A;'));
  assert.ok(root.includes('--mg-size-touch-min: 44px;'));
  assert.ok(root.includes('--mg-space-4: 16px;'));
  assert.ok(root.includes('--mg-font-size-body: 15px/22px;'));
  assert.ok(root.includes('--mg-font-weight-medium: 500;'));
  assert.ok(root.includes('--mg-radius-pill: 9999px;'));
  assert.ok(root.includes('--mg-layout-table-collapse-breakpoint: 768px;'));
  assert.ok(root.includes("--mg-brand-logo: tenant-asset;"));

  assert.ok(dark.includes('--mg-surface-page: #14171A;'));
  assert.ok(dark.includes('--mg-brand-primary: #4AA99E;'));
  assert.equal(dark.includes('--mg-size-touch-min'), false);

  assert.ok(hc.includes('--mg-text-primary: #000000;'));
  assert.ok(hc.includes('--mg-state-selected-bg: #E0E0E0;'));
  assert.ok(hc.includes('--mg-brand-on-primary: #FFFFFF;'));

  assert.equal(forced.includes('#'), false);
  assert.match(forced, /--mg-text-primary:\s*CanvasText;/);
  assert.match(forced, /--mg-focus-ring:\s*Highlight;/);
  assert.match(forced, /--mg-state-selected-bg:\s*Highlight;/);
  assert.match(forced, /--mg-brand-primary:\s*Highlight;/);
  assert.match(forced, /--mg-brand-on-primary:\s*HighlightText;/);
  assert.match(forced, /--mg-shadow-card:\s*none;/);
  assert.match(forced, /--mg-shadow-modal:\s*none;/);
  assert.match(forced, /--mg-shadow-toast:\s*none;/);
  assert.equal(forced.includes('--mg-brand-logo'), false);
});

test('Expo 상수는 dotted key 와 camelCase 를 같이 가진다', () => {
  const ts = generateTs(loadTokens());
  assert.ok(ts.includes("'surface.page': { light: '#FAF9F7', dark: '#14171A', hc: '#FFFFFF' }"));
  assert.ok(ts.includes("surfacePage: { light: '#FAF9F7', dark: '#14171A', hc: '#FFFFFF' }"));
  assert.ok(ts.includes("brandPrimary: { light: '#0E5F5A', dark: '#4AA99E', hc: '#0A4F4B' }"));
  assert.ok(ts.includes("touchMin: '44px'"));
  assert.ok(ts.includes("'1': '4px'"));
  assert.ok(ts.includes("space1: '4px'"));
  assert.ok(ts.includes('weightMedium: 500'));
  assert.ok(ts.includes('export function applyTenantBrandOverride'));
});

test('글자 토큰 대비는 SPEC 값이고 4.5 이상이다', () => {
  const tokens = loadTokens();
  for (const [fgKey, bgKey, expected, isText] of PAIRS) {
    for (const mode of ['light', 'dark', 'hc']) {
      const ratio = contrastRatio(tokenColor(tokens, fgKey)[mode], tokenColor(tokens, bgKey)[mode]);
      const rounded = round2(ratio);
      assert.equal(
        rounded,
        expected[mode],
        `${fgKey} on ${bgKey} ${mode}: got ${rounded}, spec ${expected[mode]}`,
      );
      if (isText) {
        assert.ok(ratio >= 4.5, `${fgKey} on ${bgKey} ${mode} is ${ratio}`);
      }
    }
  }
  const iconLight = contrastRatio(tokens.color['warning.icon'].light, tokens.color['surface.card'].light);
  assert.ok(iconLight < 4.5, 'warning.icon light is not a text color');
});

test('상태색은 brand 묶음에 없고 테넌트가 바꿀 수 없다', () => {
  const tokens = loadTokens();
  const brandKeys = Object.keys(tokens.brand).filter((key) => !key.startsWith('$'));
  assert.deepEqual(brandKeys, [
    'brand.primary',
    'brand.primary.hover',
    'brand.on-primary',
    'brand.logo',
  ]);
  const locked = [
    'state.selected.bg',
    'state.selected.border',
    'danger.text',
    'danger.solid',
    'warning.text',
    'warning.icon',
    'focus.ring',
    'success.text',
    'info.text',
  ];
  for (const key of locked) {
    assert.equal(Object.prototype.hasOwnProperty.call(tokens.brand, key), false);
    assert.equal(Object.prototype.hasOwnProperty.call(tokens.color, key), true);
  }
});

test('테넌트 덮어쓰기는 brand.* 만 바꾼다', () => {
  const tokens = loadTokens();
  const originalPrimary = tokens.brand['brand.primary'].light;
  const originalDanger = tokens.color['danger.text'].light;
  const next = applyTenantBrandOverride(tokens, {
    'brand.primary': { light: '#123456', dark: '#654321', hc: '#001122' },
  });
  assert.equal(next.brand['brand.primary'].light, '#123456');
  assert.equal(next.brand['brand.primary'].dark, '#654321');
  assert.equal(next.brand['brand.primary'].hc, '#001122');
  assert.equal(next.brand['brand.primary.hover'].light, tokens.brand['brand.primary.hover'].light);
  assert.equal(next.color['danger.text'].light, originalDanger);
  assert.equal(next.color['focus.ring'].light, tokens.color['focus.ring'].light);
  assert.equal(tokens.brand['brand.primary'].light, originalPrimary);

  const sneaky = {
    'brand.primary': { light: '#111111', dark: '#222222', hc: '#000000' },
  };
  const isolated = applyTenantBrandOverride(tokens, sneaky);
  sneaky['brand.primary'].light = '#ffffff';
  assert.equal(isolated.brand['brand.primary'].light, '#111111');

  const forbidden = [
    'state.selected.bg',
    'state.selected.border',
    'danger.text',
    'danger.solid',
    'warning.text',
    'warning.icon',
    'focus.ring',
    'success.text',
    'info.text',
    'text.primary',
    'surface.page',
    'touch.min',
    'brand.custom',
  ];
  for (const key of forbidden) {
    assert.throws(
      () => applyTenantBrandOverride(tokens, {
        [key]: { light: '#FF00AA', dark: '#FF00AA', hc: '#FF00AA' },
      }),
      (error) => error.code === 'TENANT_OVERRIDE_FORBIDDEN' && error.keys.includes(key),
      key,
    );
  }

  assert.throws(
    () => applyTenantBrandOverride(tokens, {
      'brand.primary': { light: '#123456', dark: '#654321', hc: '#001122' },
      'danger.text': { light: '#FF0000', dark: '#FF0000', hc: '#FF0000' },
      'focus.ring': { light: '#00FF00', dark: '#00FF00', hc: '#00FF00' },
    }),
    (error) => error.code === 'TENANT_OVERRIDE_FORBIDDEN'
      && error.keys.includes('danger.text')
      && error.keys.includes('focus.ring'),
  );
  assert.equal(tokens.brand['brand.primary'].light, originalPrimary);
  assert.equal(tokens.color['danger.text'].light, originalDanger);

  const noop = applyTenantBrandOverride(tokens, null);
  noop.brand['brand.primary'].light = '#abcdef';
  assert.equal(tokens.brand['brand.primary'].light, originalPrimary);
});

test('생성 파일을 화면이 import 하지 않는다', () => {
  const needles = ['mg-a-tokens.generated', 'tokens.generated', 'design-tokens/tokens.json'];
  const roots = [
    path.join(ROOT, 'frontend/src'),
    path.join(ROOT, 'expo-app/src'),
  ];
  const skip = new Set([path.resolve(PATHS.css), path.resolve(PATHS.ts)]);
  const hits = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(js|jsx|ts|tsx|css)$/.test(entry.name)) {
        continue;
      }
      if (skip.has(path.resolve(full))) {
        continue;
      }
      let text;
      try {
        text = fs.readFileSync(full, 'utf8');
      } catch (error) {
        if (error && (error.code === 'ENOENT' || error.code === 'ELOOP' || error.code === 'EISDIR')) {
          continue;
        }
        throw error;
      }
      if (needles.some((needle) => text.includes(needle))) {
        hits.push(path.relative(ROOT, full));
      }
    }
  }

  for (const root of roots) {
    walk(root);
  }
  assert.deepEqual(hits, []);
});
