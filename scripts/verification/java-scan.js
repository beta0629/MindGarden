'use strict';

/**
 * 자체 검증 스크립트용 Java 스캐너.
 * 문자열·주석을 건너뛰고 괄호와 메서드 본문만 자른다.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */

function scanCode(text, from, onCode) {
  let i = from;
  let state = 'code';
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (state === 'code') {
      if (c === '/' && n === '/') {
        state = 'line';
        i += 2;
        continue;
      }
      if (c === '/' && n === '*') {
        state = 'block';
        i += 2;
        continue;
      }
      if (c === '"') {
        state = 'dstr';
        i += 1;
        continue;
      }
      if (c === "'") {
        state = 'sstr';
        i += 1;
        continue;
      }
      const stop = onCode(c, i);
      if (stop != null) {
        return i;
      }
      i += 1;
    } else if (state === 'line') {
      if (c === '\n') {
        state = 'code';
      }
      i += 1;
    } else if (state === 'block') {
      if (c === '*' && n === '/') {
        state = 'code';
        i += 2;
        continue;
      }
      i += 1;
    } else if (state === 'dstr') {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === '"') {
        state = 'code';
      }
      i += 1;
    } else if (state === 'sstr') {
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === "'") {
        state = 'code';
      }
      i += 1;
    }
  }
  return null;
}

function matchParen(text, openAt) {
  if (text[openAt] !== '(') {
    return -1;
  }
  let depth = 0;
  const close = scanCode(text, openAt, (c) => {
    if (c === '(') {
      depth += 1;
    } else if (c === ')') {
      depth -= 1;
      if (depth === 0) {
        return true;
      }
    }
    return null;
  });
  if (close == null) {
    return -1;
  }
  return close;
}

function matchBrace(text, openAt) {
  if (text[openAt] !== '{') {
    return -1;
  }
  let depth = 0;
  const close = scanCode(text, openAt, (c) => {
    if (c === '{') {
      depth += 1;
    } else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        return true;
      }
    }
    return null;
  });
  if (close == null) {
    return -1;
  }
  return close;
}

/**
 * 매핑 애너테이션 뒤에서, 파라미터 목록을 닫은 뒤의 메서드 `{` 위치.
 * 애너테이션 괄호 안의 `{` 는 건너뛴다.
 */
function findMethodOpenBrace(text, from) {
  let paren = 0;
  let closedParen = false;
  const at = scanCode(text, from, (c) => {
    if (c === '(') {
      paren += 1;
    } else if (c === ')') {
      if (paren > 0) {
        paren -= 1;
      }
      if (paren === 0) {
        closedParen = true;
      }
    } else if (c === '{' && paren === 0 && closedParen) {
      return true;
    }
    return null;
  });
  if (at == null) {
    return -1;
  }
  return at;
}

function methodBodyFromBrace(text, braceAt) {
  const close = matchBrace(text, braceAt);
  if (close < 0) {
    return null;
  }
  return { body: text.slice(braceAt + 1, close), end: close };
}

function findDeclaredMethod(text, name) {
  const re = new RegExp(
    '(?:public|protected|private)\\s+[\\w.<>,\\s\\[\\]]+?\\s+' + name + '\\s*\\('
  );
  const m = re.exec(text);
  if (!m) {
    return null;
  }
  const parenAt = m.index + m[0].length - 1;
  const braceAt = findMethodOpenBrace(text, parenAt);
  if (braceAt < 0) {
    return null;
  }
  const parsed = methodBodyFromBrace(text, braceAt);
  if (!parsed) {
    return null;
  }
  return { body: parsed.body, signature: text.slice(m.index, braceAt) };
}

function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function readAnnotationPath(text, at) {
  let i = at + 1;
  while (i < text.length && /[A-Za-z]/.test(text[i])) {
    i += 1;
  }
  while (i < text.length && /\s/.test(text[i])) {
    i += 1;
  }
  if (text[i] !== '(') {
    return { path: '', end: i };
  }
  const close = matchParen(text, i);
  if (close < 0) {
    return { path: '', end: i };
  }
  const inside = text.slice(i + 1, close);
  const sm = inside.match(/["']([^"']+)["']/);
  return { path: sm ? sm[1] : '', end: close + 1 };
}

module.exports = {
  scanCode,
  matchParen,
  matchBrace,
  findMethodOpenBrace,
  methodBodyFromBrace,
  findDeclaredMethod,
  stripComments,
  readAnnotationPath
};
