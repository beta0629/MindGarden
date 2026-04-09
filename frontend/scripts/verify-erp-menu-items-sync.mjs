#!/usr/bin/env node
/**
 * menuItems.js 텍스트만 파싱하여 ERP_MENU_ITEMS 의 `to` 순서·개수가
 * DEFAULT_MENU_ITEMS 내 운영·재무(/erp/dashboard) 그룹의 children 과
 * 동일한지 검사한다. `to` 불일치 시 exit 1, 라벨 불일치 시 경고만(write stderr).
 *
 * 사용: node scripts/verify-erp-menu-items-sync.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const menuPath = path.join(root, 'src/components/dashboard-v2/constants/menuItems.js');

const ERP_PARENT_LABEL = '운영·재무';
const ERP_PARENT_TO = '/erp/dashboard';

/**
 * @param {string} source
 * @param {number} i
 * @returns {number} index after comment
 */
function skipLineComment(source, i) {
  let j = i + 2;
  while (j < source.length && source[j] !== '\n') {
    j += 1;
  }
  return j;
}

/**
 * @param {string} source
 * @param {number} i
 * @returns {number} index after block comment
 */
function skipBlockComment(source, i) {
  let j = i + 2;
  while (j < source.length - 1 && !(source[j] === '*' && source[j + 1] === '/')) {
    j += 1;
  }
  if (j >= source.length - 1) {
    throw new Error('verify-erp-menu-items-sync: 블록 주석이 닫히지 않았습니다.');
  }
  return j + 2;
}

/**
 * @param {string} source
 * @param {number} i
 * @param {string} quote
 * @returns {number} index after closing quote
 */
function skipString(source, i, quote) {
  let j = i + 1;
  while (j < source.length) {
    const ch = source[j];
    if (ch === '\\' && quote !== '`') {
      j += 2;
      continue;
    }
    if (ch === quote) {
      return j + 1;
    }
    j += 1;
  }
  throw new Error('verify-erp-menu-items-sync: 문자열이 닫히지 않았습니다.');
}

/**
 * @param {string} source
 * @param {number} start index of '['
 * @returns {{ inner: string, end: number }} inner without brackets, index after ']'
 */
function extractBracketArray(source, start) {
  if (source[start] !== '[') {
    throw new Error('verify-erp-menu-items-sync: 내부 오류 — [ 가 아닙니다.');
  }
  let depth = 1;
  let j = start + 1;
  const innerStart = j;
  while (j < source.length && depth > 0) {
    const c = source[j];
    if (c === '/' && source[j + 1] === '/') {
      j = skipLineComment(source, j);
      continue;
    }
    if (c === '/' && source[j + 1] === '*') {
      j = skipBlockComment(source, j);
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      j = skipString(source, j, c);
      continue;
    }
    if (c === '[') {
      depth += 1;
    } else if (c === ']') {
      depth -= 1;
    }
    j += 1;
  }
  if (depth !== 0) {
    throw new Error('verify-erp-menu-items-sync: 배열 대괄호가 짝이 맞지 않습니다.');
  }
  return { inner: source.slice(innerStart, j - 1), end: j };
}

/**
 * @param {string} source
 * @param {string} constName
 * @returns {string} array inner (between [ and ])
 */
function extractConstArrayInner(source, constName) {
  const marker = `const ${constName} = [`;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(
      `verify-erp-menu-items-sync: ${constName} 선언을 찾을 수 없습니다. (${menuPath})`
    );
  }
  const bracketStart = start + marker.length - 1;
  const { inner } = extractBracketArray(source, bracketStart);
  return inner;
}

/**
 * @param {string} source
 * @param {number} from
 * @returns {{ slice: string, next: number } | null}
 */
function nextTopLevelObjectSlice(source, from) {
  let i = from;
  while (i < source.length && /[\s,]/.test(source[i])) {
    i += 1;
  }
  if (i >= source.length || source[i] !== '{') {
    return null;
  }
  let depth = 0;
  const sliceStart = i;
  while (i < source.length) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') {
      i = skipLineComment(source, i);
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      i = skipBlockComment(source, i);
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      i = skipString(source, i, c);
      continue;
    }
    if (c === '{') {
      depth += 1;
    } else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        return { slice: source.slice(sliceStart, i + 1), next: i + 1 };
      }
    }
    i += 1;
  }
  throw new Error('verify-erp-menu-items-sync: 객체 중괄호가 짝이 맞지 않습니다.');
}

/**
 * @param {string} arrayInner
 * @returns {string[]}
 */
function splitTopLevelObjects(arrayInner) {
  const objects = [];
  let pos = 0;
  while (pos < arrayInner.length) {
    const next = nextTopLevelObjectSlice(arrayInner, pos);
    if (!next) {
      const tail = arrayInner.slice(pos).trim();
      if (tail.length > 0) {
        throw new Error(
          `verify-erp-menu-items-sync: 배열 요소 파싱 실패 — 객체가 아닌 잔여: ${tail.slice(0, 80)}…`
        );
      }
      break;
    }
    objects.push(next.slice);
    pos = next.next;
  }
  return objects;
}

/**
 * @param {string} objText
 * @returns {boolean}
 */
function isErpFallbackParentGroup(objText) {
  if (objText.includes(`label: '${ERP_PARENT_LABEL}'`)) {
    return true;
  }
  const trimmed = objText.trim();
  const re = /^\{\s*\n?\s*to:\s*['"]\/erp\/dashboard['"]/;
  return re.test(trimmed);
}

/**
 * @param {string} parentObjText
 * @returns {string} children array inner
 */
function extractChildrenArrayInner(parentObjText) {
  const key = 'children:';
  const idx = parentObjText.indexOf(key);
  if (idx === -1) {
    throw new Error(
      'verify-erp-menu-items-sync: 운영·재무 그룹 객체에 children: 가 없습니다.'
    );
  }
  let i = idx + key.length;
  while (i < parentObjText.length && /\s/.test(parentObjText[i])) {
    i += 1;
  }
  if (parentObjText[i] !== '[') {
    throw new Error(
      'verify-erp-menu-items-sync: children: 뒤에 배열 [ 이 와야 합니다. 애매한 소스입니다.'
    );
  }
  const { inner } = extractBracketArray(parentObjText, i);
  return inner;
}

/**
 * @param {string} objChunk
 * @returns {{ to: string, label: string | null }}
 */
function parseToAndLabel(objChunk) {
  const toM = /\bto:\s*['"]([^'"]+)['"]/.exec(objChunk);
  if (!toM) {
    throw new Error(
      `verify-erp-menu-items-sync: 메뉴 객체에서 to: '…' 를 찾을 수 없습니다. 애매한 소스입니다.\n${objChunk.slice(0, 200)}`
    );
  }
  const labM = /\blabel:\s*['"]([^'"]*)['"]/.exec(objChunk);
  return { to: toM[1], label: labM ? labM[1] : null };
}

/**
 * @param {string} arrayInner
 * @returns {{ to: string, label: string | null }[]}
 */
function parseMenuObjectList(arrayInner) {
  const chunks = splitTopLevelObjects(arrayInner);
  return chunks.map((ch) => parseToAndLabel(ch));
}

function main() {
  const source = fs.readFileSync(menuPath, 'utf8');

  let erpItems;
  let defaultInner;
  try {
    const erpInner = extractConstArrayInner(source, 'ERP_MENU_ITEMS');
    erpItems = parseMenuObjectList(erpInner);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
    return;
  }

  try {
    defaultInner = extractConstArrayInner(source, 'DEFAULT_MENU_ITEMS');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
    return;
  }

  const topObjects = splitTopLevelObjects(defaultInner);
  const erpParents = topObjects.filter(isErpFallbackParentGroup);
  if (erpParents.length === 0) {
    console.error(
      `verify-erp-menu-items-sync: DEFAULT_MENU_ITEMS 안에서 label: '${ERP_PARENT_LABEL}' 또는 to: '${ERP_PARENT_TO}' 그룹을 찾지 못했습니다.`
    );
    process.exit(1);
    return;
  }
  if (erpParents.length > 1) {
    console.error(
      'verify-erp-menu-items-sync: 운영·재무(/erp/dashboard) 그룹이 DEFAULT_MENU_ITEMS 에 2건 이상 있습니다. 수동으로 정리해야 합니다.'
    );
    process.exit(1);
    return;
  }

  let childItems;
  try {
    const childrenInner = extractChildrenArrayInner(erpParents[0]);
    childItems = parseMenuObjectList(childrenInner);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
    return;
  }

  const erpTos = erpItems.map((x) => x.to);
  const childTos = childItems.map((x) => x.to);

  if (erpTos.length !== childTos.length) {
    console.error(
      `verify-erp-menu-items-sync: 개수 불일치 — ERP_MENU_ITEMS ${erpTos.length}건, DEFAULT children ${childTos.length}건`
    );
    console.error('   ERP_MENU_ITEMS to:', erpTos.join(', '));
    console.error('   DEFAULT children to:', childTos.join(', '));
    process.exit(1);
    return;
  }

  const mismatchedTo = [];
  for (let i = 0; i < erpTos.length; i += 1) {
    if (erpTos[i] !== childTos[i]) {
      mismatchedTo.push({ index: i, erp: erpTos[i], child: childTos[i] });
    }
  }
  if (mismatchedTo.length > 0) {
    console.error('verify-erp-menu-items-sync: `to` 경로 순서 또는 값이 children 과 일치하지 않습니다.');
    for (const m of mismatchedTo) {
      console.error(`   [${m.index}] ERP_MENU_ITEMS: ${m.erp} ≠ DEFAULT children: ${m.child}`);
    }
    process.exit(1);
    return;
  }

  const labelWarnings = [];
  for (let i = 0; i < erpItems.length; i += 1) {
    const a = erpItems[i].label;
    const b = childItems[i].label;
    if (a != null && b != null && a !== b) {
      labelWarnings.push({ index: i, erp: a, child: b, to: erpTos[i] });
    }
  }
  for (const w of labelWarnings) {
    console.warn(
      `⚠️  라벨 불일치(경로는 일치): [${w.index}] to=${w.to} — ERP_MENU_ITEMS "${w.erp}" ≠ children "${w.child}"`
    );
  }

  console.log(
    `✅ ERP_MENU_ITEMS 와 DEFAULT_MENU_ITEMS(운영·재무) children 의 to 순서·개수 ${erpTos.length}건 일치.`
  );
  process.exit(0);
}

main();
