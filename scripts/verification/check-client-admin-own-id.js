#!/usr/bin/env node
'use strict';

/**
 * 내담자 화면의 /api/v1/admin/** 호출이 서버에서 본인 id만 강제하는지 검사한다.
 * 핸들러를 찾지 못하거나 비교·거부가 없으면 exit 1. 추정으로 통과시키지 않는다.
 *
 * 사용:
 *   node scripts/verification/check-client-admin-own-id.js --changed /tmp/sv-changed.txt
 *   node scripts/verification/check-client-admin-own-id.js --path /api/v1/admin/mappings/client
 *
 * @author CoreSolution
 * @since 2026-10-01
 */

const fs = require('fs');
const path = require('path');
const scan = require('./java-scan');

const ADMIN_PREFIX = '/api/v1/admin';

function parseArgs(argv) {
  const out = { root: process.cwd(), changed: null, paths: [] };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--root') {
      out.root = path.resolve(argv[i + 1] || '');
      i += 1;
    } else if (a === '--changed') {
      out.changed = argv[i + 1];
      i += 1;
    } else if (a === '--path') {
      out.paths.push(argv[i + 1]);
      i += 1;
    } else if (a === '-h' || a === '--help') {
      out.help = true;
    } else {
      console.error('Unknown arg: ' + a);
      process.exit(2);
    }
  }
  return out;
}

function usage() {
  console.error('usage: check-client-admin-own-id.js [--root DIR] [--changed FILE] [--path /api/v1/admin/...]');
  process.exit(2);
}

function norm(p) {
  return String(p || '')
    .split('?')[0]
    .replace(/\$\{[^}]+\}/g, '{}')
    .replace(/\{[^}]+\}/g, '{}')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function pathsMatch(a, b) {
  const as = norm(a).split('/');
  const bs = norm(b).split('/');
  if (as.length !== bs.length) {
    return false;
  }
  for (let i = 0; i < as.length; i += 1) {
    if (as[i] === bs[i]) {
      continue;
    }
    return false;
  }
  return true;
}

function joinUrl(base, sub) {
  if (!sub) {
    return norm(base);
  }
  if (sub.startsWith('/api/')) {
    return norm(sub);
  }
  const left = String(base || '').replace(/\/$/, '');
  const right = String(sub).replace(/^\//, '');
  return norm(left + '/' + right);
}

function walk(dir, acc, pred) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '__tests__' || ent.name === 'target') {
      continue;
    }
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(p, acc, pred);
    } else if (pred(p)) {
      acc.push(p);
    }
  }
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function isClientSurface(rel) {
  const normRel = toPosix(rel);
  if (normRel.includes('/__tests__/')) {
    return false;
  }
  if (normRel.includes('frontend/src/components/client/')) {
    return true;
  }
  if (normRel.includes('frontend/src/components/dashboard/')
      && /\/Client[^/]*\.(js|jsx|ts|tsx)$/.test(normRel)) {
    return true;
  }
  if (normRel.includes('expo-app/src/')
      && normRel.toLowerCase().includes('client')
      && !normRel.includes('/admin/')) {
    return true;
  }
  return false;
}

function extractAdminPaths(text) {
  const re = /\/api\/v1\/admin\/[A-Za-z0-9_${}\/.-]*/g;
  const found = [];
  let m;
  while ((m = re.exec(text))) {
    const raw = m[0];
    if (norm(raw) === ADMIN_PREFIX) {
      found.push({ raw, path: raw, vague: true, index: m.index });
    } else {
      found.push({ raw, path: norm(raw), vague: false, index: m.index });
    }
  }
  return found;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function listClientFiles(root) {
  const acc = [];
  walk(root, acc, (p) => {
    const rel = toPosix(path.relative(root, p));
    return isClientSurface(rel) && /\.(js|jsx|ts|tsx)$/.test(p);
  });
  return acc;
}

function oneHopImports(root, file, text) {
  const out = [];
  const re = /from\s+['"](\.[^'"]+)['"]/g;
  let m;
  while ((m = re.exec(text))) {
    const base = path.resolve(path.dirname(file), m[1]);
    const candidates = ['', '.js', '.jsx', '.ts', '.tsx'].map((ext) => base + ext);
    for (const c of candidates) {
      if (!fs.existsSync(c) || !fs.statSync(c).isFile()) {
        continue;
      }
      const rel = toPosix(path.relative(root, c));
      if (rel.includes('/components/admin/') || rel.includes('node_modules')) {
        break;
      }
      out.push(c);
      break;
    }
  }
  return out;
}

function classBasePath(text) {
  const classAt = text.search(/\bclass\s+/);
  if (classAt < 0) {
    return '';
  }
  const head = text.slice(0, classAt);
  const matches = [...head.matchAll(
    /@RequestMapping\s*\(\s*(?:value\s*=\s*|path\s*=\s*)?["']([^"']+)["']/g
  )];
  if (matches.length === 0) {
    return '';
  }
  return matches[matches.length - 1][1];
}

function className(text) {
  const m = text.match(/\bclass\s+(\w+)/);
  return m ? m[1] : '?';
}

function requestIdNames(signature) {
  const names = [];
  const re = /@(?:RequestParam|PathVariable)\s*(?:\((?:[^)(]|\([^)]*\))*\))?\s+(?:final\s+)?(?:Long|long|String|UUID)\s+(\w+)/g;
  let m;
  while ((m = re.exec(signature))) {
    if (/(?:^id|Id|ID)$/.test(m[1])) {
      names.push(m[1]);
    }
  }
  return names;
}

function mappedMethods(text) {
  const classAt = text.search(/\bclass\s+/);
  if (classAt < 0) {
    return [];
  }
  const base = classBasePath(text);
  const methods = [];
  const re = /@(?:Get|Post|Put|Delete|Patch|Request)Mapping\b/g;
  let m;
  while ((m = re.exec(text))) {
    if (m.index < classAt) {
      continue;
    }
    const ann = scan.readAnnotationPath(text, m.index);
    const braceAt = scan.findMethodOpenBrace(text, ann.end);
    if (braceAt < 0) {
      continue;
    }
    const parsed = scan.methodBodyFromBrace(text, braceAt);
    if (!parsed) {
      continue;
    }
    const signature = text.slice(ann.end, braceAt);
    const nameMatch = signature.slice(0, signature.lastIndexOf('(')).match(/(\w+)\s*$/);
    methods.push({
      httpPath: joinUrl(base, ann.path),
      name: nameMatch ? nameMatch[1] : '?',
      signature,
      body: parsed.body
    });
    re.lastIndex = parsed.end;
  }
  return methods;
}

function listJava(root, pred) {
  const acc = [];
  walk(path.join(root, 'src/main/java'), acc, (p) => pred(p));
  return acc;
}

function provesOwnId(handlerBody, signature, assertBodies) {
  const combined = [handlerBody, ...assertBodies].join('\n');
  const readsCaller = /SessionUtils\.getCurrentUser\s*\(/.test(combined)
    || /\bgetCurrentUserId\s*\(/.test(combined)
    || /SecurityContextHolder\.getContext\s*\(/.test(combined);
  if (!readsCaller) {
    return { ok: false, reason: '호출자 id를 읽지 않음' };
  }
  const ids = requestIdNames(signature);
  const denies = /AccessDeniedException/.test(combined) || /HttpStatus\.FORBIDDEN/.test(combined);
  const compares = /getId\s*\(\s*\)/.test(combined) && /\.equals\s*\(/.test(combined);
  if (ids.length === 0) {
    const usesCaller = /(?:currentUser|caller)\.getId\s*\(\)/.test(combined) || /\bcurrentUserId\b/.test(combined);
    const unscoped = /\b(?:getAll|findAll)[A-Za-z0-9_]*\s*\(/.test(handlerBody);
    if (usesCaller && !unscoped) {
      return { ok: true, reason: '호출자 id로만 조회' };
    }
    return { ok: false, reason: '조회가 호출자 id로 제한되지 않음' };
  }
  if (!denies || !compares) {
    return { ok: false, reason: '요청 id를 호출자 id와 비교해 거부하지 않음' };
  }
  const assertAt = handlerBody.search(/\bassert[A-Z]\w*\s*\(/);
  const throwAt = handlerBody.search(/throw\s+new\s+[\w.]*AccessDeniedException/);
  const gates = [assertAt, throwAt].filter((n) => n >= 0).sort((a, b) => a - b);
  const gateAt = gates.length ? gates[0] : -1;
  const returnAt = handlerBody.search(/\breturn\b/);
  if (gateAt < 0) {
    return { ok: false, reason: '핸들러에서 거부 지점을 찾지 못함' };
  }
  if (returnAt !== -1 && returnAt < gateAt) {
    return { ok: false, reason: '본인 확인보다 먼저 응답을 반환함' };
  }
  return { ok: true, reason: '요청 id ≠ 호출자 id 이면 거부' };
}

function assertBodies(handlerBody, fileText, javaFiles) {
  const names = new Set();
  const re = /\b(assert[A-Z]\w*)\s*\(/g;
  let m;
  while ((m = re.exec(handlerBody))) {
    names.add(m[1]);
  }
  const bodies = [];
  for (const name of names) {
    const local = scan.findDeclaredMethod(fileText, name);
    if (local) {
      bodies.push(local.body);
      continue;
    }
    const found = [];
    for (const f of javaFiles) {
      const declared = scan.findDeclaredMethod(fs.readFileSync(f, 'utf8'), name);
      if (declared) {
        found.push(declared.body);
      }
    }
    if (found.length === 1) {
      bodies.push(found[0]);
    }
  }
  return bodies;
}

function indexControllers(root) {
  const files = listJava(root, (p) => p.endsWith('Controller.java'));
  const allJava = listJava(root, (p) => p.endsWith('.java'));
  const handlers = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const cls = className(text);
    for (const method of mappedMethods(text)) {
      if (!method.httpPath.startsWith(ADMIN_PREFIX)) {
        continue;
      }
      handlers.push({ file, cls, text, method });
    }
  }
  return { handlers, allJava };
}

function collectTargets(root, args) {
  const targets = [];
  const seen = new Set();
  function add(entry) {
    const key = entry.path + '|' + entry.where;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    targets.push(entry);
  }
  if (args.paths.length) {
    for (const p of args.paths) {
      add({ path: norm(p), where: '--path', line: 0, vague: false });
    }
  }
  let changed = null;
  if (args.changed) {
    if (!fs.existsSync(args.changed)) {
      console.error('changed file missing: ' + args.changed);
      process.exit(2);
    }
    changed = fs.readFileSync(args.changed, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  }
  if (!args.changed && args.paths.length === 0) {
    console.error('PASS로 두지 않음: --changed 또는 --path 가 없다');
    process.exit(2);
  }
  if (changed) {
    const clientFiles = listClientFiles(root);
    for (const rel of changed) {
      const abs = path.join(root, rel);
      if (isClientSurface(rel) && fs.existsSync(abs)) {
        const text = fs.readFileSync(abs, 'utf8');
        const files = [abs, ...oneHopImports(root, abs, text)];
        for (const f of files) {
          const body = fs.readFileSync(f, 'utf8');
          for (const hit of extractAdminPaths(body)) {
            add({
              path: hit.path,
              where: toPosix(path.relative(root, f)),
              line: lineOf(body, hit.index),
              vague: hit.vague
            });
          }
        }
      }
      if (rel.endsWith('Controller.java') && fs.existsSync(abs)) {
        const text = fs.readFileSync(abs, 'utf8');
        for (const method of mappedMethods(text)) {
          if (!method.httpPath.startsWith(ADMIN_PREFIX)) {
            continue;
          }
          for (const client of clientFiles) {
            const clientText = fs.readFileSync(client, 'utf8');
            const hit = extractAdminPaths(clientText).find((item) => pathsMatch(method.httpPath, item.path));
            if (hit) {
              add({
                path: method.httpPath,
                where: toPosix(path.relative(root, client)),
                line: lineOf(clientText, hit.index),
                vague: hit.vague
              });
              break;
            }
          }
        }
      }
    }
  }
  return targets;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    usage();
  }
  const targets = collectTargets(args.root, args);
  if (targets.length === 0) {
    console.log('PASS own-id 검사 대상 없음');
    process.exit(0);
  }
  const { handlers, allJava } = indexControllers(args.root);
  let failed = false;
  for (const target of targets) {
    if (target.vague) {
      failed = true;
      console.log('FAIL own-id ' + target.where + ':' + target.line
        + ' ' + target.path + ' 경로가 구체적이지 않음 — 추정 금지');
      continue;
    }
    const matches = handlers.filter((h) => pathsMatch(h.method.httpPath, target.path));
    if (matches.length === 0) {
      failed = true;
      console.log('FAIL own-id ' + target.where + ':' + target.line
        + ' ' + target.path + ' 핸들러 없음 — 추정으로 PASS 금지');
      continue;
    }
    for (const h of matches) {
      const extras = assertBodies(h.method.body, h.text, allJava);
      const verdict = provesOwnId(h.method.body, h.method.signature, extras);
      const loc = h.cls + '.' + h.method.name;
      if (!verdict.ok) {
        failed = true;
        console.log('FAIL own-id ' + target.where + ':' + target.line
          + ' ' + target.path + ' → ' + loc + ' ' + verdict.reason);
      } else {
        console.log('PASS own-id ' + target.path + ' → ' + loc + ' ' + verdict.reason);
      }
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
