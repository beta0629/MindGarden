#!/usr/bin/env node
/**
 * design-tokens/tokens.json → 웹 CSS 변수와 Expo TS 상수.
 * 화면 import 는 하지 않는다. 생성 파일이 원본과 다르면 --check 가 실패한다.
 *
 * @author MindGarden
 * @since 2026-11-10
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const PATHS = {
  tokens: path.join(ROOT, 'design-tokens/tokens.json'),
  css: path.join(ROOT, 'frontend/src/styles/tokens/mg-a-tokens.generated.css'),
  ts: path.join(ROOT, 'expo-app/src/theme/tokens.generated.ts'),
};

const MODE_GROUPS = ['color', 'brand'];
const SCALAR_GROUPS = ['size', 'space', 'radius', 'font', 'shadow', 'layout'];
const TOP_LEVEL = new Set(['$meta', ...MODE_GROUPS, ...SCALAR_GROUPS]);
const MODES = ['light', 'dark', 'hc'];

/**
 * forced-colors 는 OS 시스템 색만 쓴다. hex 를 남기면 고대비 모드가 작성자 색을 강제한다.
 * 역할 매핑은 design-v2-tokens.css 의 forced-colors 블록과 같은 계열이다.
 * brand.logo 는 색이 아니라 자산 키라 이 블록에서 덮지 않는다.
 */
const FORCED_COLORS = {
  'surface.page': 'Canvas',
  'surface.card': 'Canvas',
  'surface.sunken': 'Canvas',
  'surface.overlay': 'Canvas',
  'text.primary': 'CanvasText',
  'text.secondary': 'CanvasText',
  'text.tertiary': 'GrayText',
  'text.disabled': 'GrayText',
  'text.inverse': 'Canvas',
  'border.subtle': 'GrayText',
  'border.default': 'CanvasText',
  'border.strong': 'CanvasText',
  'state.hover': 'transparent',
  'state.selected.bg': 'Highlight',
  'state.selected.border': 'Highlight',
  'state.disabled.bg': 'Canvas',
  'focus.ring': 'Highlight',
  'danger.text': 'CanvasText',
  'danger.solid': 'CanvasText',
  'danger.subtle': 'Canvas',
  'warning.text': 'CanvasText',
  'warning.icon': 'CanvasText',
  'warning.subtle': 'Canvas',
  'success.text': 'CanvasText',
  'success.subtle': 'Canvas',
  'info.text': 'CanvasText',
  'info.subtle': 'Canvas',
  'brand.primary': 'Highlight',
  'brand.primary.hover': 'Highlight',
  'brand.on-primary': 'HighlightText',
};

function tokenEntries(bag) {
  return Object.entries(bag).filter(([key]) => !key.startsWith('$'));
}

export function cssVarName(group, key) {
  const full = group === 'color' || group === 'brand' ? key : `${group}.${key}`;
  if (!/^[a-z0-9.-]+$/i.test(full)) {
    throw new Error(`unsafe token path ${full}`);
  }
  return `--mg-${full.replace(/\./g, '-')}`;
}

export function toCamelIdent(group, key) {
  const parts = String(key).split(/[.\-]+/).filter(Boolean);
  if (parts.length === 0) {
    throw new Error(`empty token key in ${group}`);
  }
  let ident = parts[0] + parts.slice(1).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  if (/^[0-9]/.test(ident)) {
    ident = group + ident.charAt(0).toUpperCase() + ident.slice(1);
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ident)) {
    throw new Error(`camelCase ident is not a safe identifier: ${group}.${key} -> ${ident}`);
  }
  return ident;
}

function cssValue(value) {
  const text = typeof value === 'number' ? String(value) : value;
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('token value must be a non-empty string or number');
  }
  if (/[;\n\r]/.test(text) || text.includes('*/')) {
    throw new Error(`unsafe CSS value: ${text}`);
  }
  return text;
}

function jsString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function assertModeValue(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a light/dark/hc object`);
  }
  for (const mode of MODES) {
    if (typeof value[mode] !== 'string' || value[mode].length === 0) {
      throw new Error(`${label}.${mode} must be a non-empty string`);
    }
    cssValue(value[mode]);
  }
}

function validateTokens(tokens) {
  if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens)) {
    throw new Error('tokens.json must be an object');
  }
  for (const key of Object.keys(tokens)) {
    if (!TOP_LEVEL.has(key)) {
      throw new Error(`unexpected tokens.json key ${key}`);
    }
  }
  if (!tokens.$meta || JSON.stringify(tokens.$meta.modes) !== JSON.stringify(MODES)) {
    throw new Error('modes must be light, dark, hc');
  }
  for (const group of MODE_GROUPS) {
    if (!tokens[group] || typeof tokens[group] !== 'object') {
      throw new Error(`missing group ${group}`);
    }
    for (const [key, value] of tokenEntries(tokens[group])) {
      assertModeValue(value, `${group}.${key}`);
    }
  }
  for (const group of SCALAR_GROUPS) {
    if (!tokens[group] || typeof tokens[group] !== 'object') {
      throw new Error(`missing group ${group}`);
    }
    for (const [key, value] of tokenEntries(tokens[group])) {
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error(`${group}.${key} must be a string or number`);
      }
      cssValue(value);
    }
  }
  for (const [key] of tokenEntries(tokens.color)) {
    if (!FORCED_COLORS[key]) {
      throw new Error(`forced-colors mapping missing for ${key}`);
    }
  }
  for (const [key] of tokenEntries(tokens.brand)) {
    if (key === 'brand.logo') {
      continue;
    }
    if (!FORCED_COLORS[key]) {
      throw new Error(`forced-colors mapping missing for ${key}`);
    }
  }
}

export function loadTokens(file = PATHS.tokens) {
  const tokens = JSON.parse(fs.readFileSync(file, 'utf8'));
  validateTokens(tokens);
  return tokens;
}

function isBrandColor(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && typeof value.light === 'string'
    && value.light.length > 0
    && typeof value.dark === 'string'
    && value.dark.length > 0
    && typeof value.hc === 'string'
    && value.hc.length > 0,
  );
}

/**
 * 테넌트는 brand.* 만 덮어쓴다. 선택·위험·경고·포커스·성공·정보와 그 외 키는 거부한다.
 * 하나라도 거부되면 원본을 바꾸지 않고 예외를 던진다.
 */
export function applyTenantBrandOverride(tokens, override) {
  if (!tokens || typeof tokens !== 'object' || !tokens.brand) {
    throw new Error('tokens.brand is required');
  }
  if (override == null) {
    return structuredClone(tokens);
  }
  if (typeof override !== 'object' || Array.isArray(override)) {
    throw Object.assign(new Error('Tenant override must be an object of brand.* keys'), {
      code: 'TENANT_OVERRIDE_FORBIDDEN',
      keys: [],
    });
  }
  const next = structuredClone(tokens);
  const rejected = [];
  for (const [key, value] of Object.entries(override)) {
    const known = Object.prototype.hasOwnProperty.call(next.brand, key);
    if (!known || !key.startsWith('brand.') || !isBrandColor(value)) {
      rejected.push(key);
      continue;
    }
    next.brand[key] = { light: value.light, dark: value.dark, hc: value.hc };
  }
  if (rejected.length > 0) {
    throw Object.assign(
      new Error(`Tenant override may only change brand.* (rejected: ${rejected.join(', ')})`),
      { code: 'TENANT_OVERRIDE_FORBIDDEN', keys: rejected },
    );
  }
  return next;
}

function parseHex(hex) {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) {
    throw new Error(`expected 6-digit hex, got ${hex}`);
  }
  const value = match[1];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex) {
  const channels = parseHex(hex).map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

/** WCAG 2.x contrast ratio. Both arguments are #RRGGBB. */
export function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function decl(group, key, value) {
  return `  ${cssVarName(group, key)}: ${cssValue(value)};`;
}

function rootBlock(tokens) {
  const lines = [':root {'];
  for (const group of MODE_GROUPS) {
    lines.push(`  /* ${group} · light */`);
    for (const [key, value] of tokenEntries(tokens[group])) {
      lines.push(decl(group, key, value.light));
    }
  }
  for (const group of SCALAR_GROUPS) {
    lines.push(`  /* ${group} */`);
    for (const [key, value] of tokenEntries(tokens[group])) {
      lines.push(decl(group, key, value));
    }
  }
  lines.push('}');
  return lines.join('\n');
}

function modeBlock(selector, tokens, mode) {
  const lines = [`${selector} {`];
  for (const group of MODE_GROUPS) {
    lines.push(`  /* ${group} · ${mode} */`);
    for (const [key, value] of tokenEntries(tokens[group])) {
      lines.push(decl(group, key, value[mode]));
    }
  }
  lines.push('}');
  return lines.join('\n');
}

function forcedBlock(tokens) {
  const lines = ['@media (forced-colors: active) {', '  :root {'];
  for (const [key] of tokenEntries(tokens.color)) {
    lines.push(`    ${cssVarName('color', key)}: ${FORCED_COLORS[key]};`);
  }
  for (const [key] of tokenEntries(tokens.brand)) {
    if (key === 'brand.logo') {
      continue;
    }
    lines.push(`    ${cssVarName('brand', key)}: ${FORCED_COLORS[key]};`);
  }
  for (const [key] of tokenEntries(tokens.shadow)) {
    lines.push(`    ${cssVarName('shadow', key)}: none;`);
  }
  lines.push('  }', '}');
  return lines.join('\n');
}

export function generateCss(tokens) {
  validateTokens(tokens);
  const header = `/**
 * 생성 파일. 직접 수정하지 않는다.
 * 원본: design-tokens/tokens.json
 * 재생성: npm run tokens:generate
 *
 * light: :root
 * dark: [data-theme="dark"]
 * high-contrast: [data-theme="hc"]
 * forced-colors: @media (forced-colors: active)
 *
 * 화면에서는 import 하지 않는다. 화면 적용은 다음 PR.
 */`;
  return [
    header,
    rootBlock(tokens),
    modeBlock('[data-theme="dark"]', tokens, 'dark'),
    modeBlock('[data-theme="hc"]', tokens, 'hc'),
    forcedBlock(tokens),
    '',
  ].join('\n\n');
}

function emitGroup(group, bag, color) {
  const lines = [];
  const seen = new Set();
  for (const [key, value] of tokenEntries(bag)) {
    if (seen.has(key)) {
      throw new Error(`duplicate ${group}.${key}`);
    }
    seen.add(key);
    const rendered = color
      ? `{ light: ${jsString(value.light)}, dark: ${jsString(value.dark)}, hc: ${jsString(value.hc)} }`
      : (typeof value === 'number' ? String(value) : jsString(value));
    lines.push(`    ${/^[$A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : jsString(key)}: ${rendered},`);
    const camel = toCamelIdent(group, key);
    if (camel === key) {
      continue;
    }
    if (seen.has(camel)) {
      throw new Error(`camelCase collision ${group}.${key} -> ${camel}`);
    }
    seen.add(camel);
    lines.push(`    ${camel}: ${rendered},`);
  }
  return lines;
}

export function generateTs(tokens) {
  validateTokens(tokens);
  const groups = [];
  for (const group of [...MODE_GROUPS, ...SCALAR_GROUPS]) {
    const body = emitGroup(group, tokens[group], MODE_GROUPS.includes(group));
    groups.push(`  ${group}: {\n${body.join('\n')}\n  },`);
  }
  return `/**
 * 생성 파일. 직접 수정하지 않는다.
 * 원본: design-tokens/tokens.json
 * 재생성: npm run tokens:generate
 *
 * 이름: tokens.json 키 a.b.c → mg.<group>['a.b.c'] 와 camelCase aBC.
 * 테넌트 덮어쓰기: applyTenantBrandOverride — brand.* 만.
 * 화면에서는 import 하지 않는다. 화면 적용은 다음 PR.
 *
 * shadow.* 는 웹 box-shadow 문자열이다.
 * 앱 elevation(card 2 / modal 12 / toast 6)은 화면 적용 PR에서 이 키에 맞춘다.
 */

export type MgColor = {
  readonly light: string;
  readonly dark: string;
  readonly hc: string;
};

export const mgModes = ['light', 'dark', 'hc'] as const;

export const mg = {
${groups.join('\n')}
} as const;

export type MgTokens = typeof mg;

export function applyTenantBrandOverride<
  T extends { readonly brand: Readonly<Record<string, MgColor>> },
>(
  tokens: T,
  brandOverride?: Readonly<Record<string, MgColor>> | null,
): T {
  if (brandOverride == null) {
    return tokens;
  }
  const rejected: string[] = [];
  const brand: { [key: string]: MgColor } = { ...tokens.brand };
  for (const key of Object.keys(brandOverride)) {
    const next = brandOverride[key];
    const allowed = key.startsWith('brand.')
      && Object.prototype.hasOwnProperty.call(tokens.brand, key)
      && next != null
      && typeof next.light === 'string'
      && next.light.length > 0
      && typeof next.dark === 'string'
      && next.dark.length > 0
      && typeof next.hc === 'string'
      && next.hc.length > 0;
    if (!allowed || next == null) {
      rejected.push(key);
      continue;
    }
    brand[key] = { light: next.light, dark: next.dark, hc: next.hc };
  }
  if (rejected.length > 0) {
    throw new Error(
      \`Tenant override may only change brand.* (rejected: \${rejected.join(', ')})\`,
    );
  }
  return { ...tokens, brand } as T;
}
`;
}

export function driftAgainst(diskCss, diskTs, tokens) {
  const freshCss = generateCss(tokens);
  const freshTs = generateTs(tokens);
  const drift = [];
  if (diskCss !== freshCss) {
    drift.push(PATHS.css);
  }
  if (diskTs !== freshTs) {
    drift.push(PATHS.ts);
  }
  return drift;
}

function readOrNull(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function check() {
  const tokens = loadTokens();
  const diskCss = readOrNull(PATHS.css);
  const diskTs = readOrNull(PATHS.ts);
  const drift = driftAgainst(diskCss ?? '', diskTs ?? '', tokens);
  if (drift.length > 0) {
    console.error('Generated token files are out of date with design-tokens/tokens.json:');
    for (const file of drift) {
      console.error(`  ${path.relative(ROOT, file)}`);
    }
    console.error('Run: npm run tokens:generate');
    process.exitCode = 1;
    return;
  }
  console.log('token outputs match design-tokens/tokens.json');
}

function writeOutputs() {
  const tokens = loadTokens();
  const css = generateCss(tokens);
  const ts = generateTs(tokens);
  fs.mkdirSync(path.dirname(PATHS.css), { recursive: true });
  fs.mkdirSync(path.dirname(PATHS.ts), { recursive: true });
  fs.writeFileSync(PATHS.css, css);
  fs.writeFileSync(PATHS.ts, ts);
  console.log(`wrote ${path.relative(ROOT, PATHS.css)}`);
  console.log(`wrote ${path.relative(ROOT, PATHS.ts)}`);
}

function invokedDirectly() {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }
  return path.resolve(entry) === fileURLToPath(import.meta.url);
}

if (invokedDirectly()) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    writeOutputs();
  } else if (args.length === 1 && args[0] === '--check') {
    check();
  } else {
    console.error('usage: node scripts/design-tokens/generate-mg-tokens.mjs [--check]');
    process.exitCode = 2;
  }
}
