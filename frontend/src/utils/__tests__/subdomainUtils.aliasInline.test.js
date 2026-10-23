/**
 * REACT_APP_TENANT_HOST_ALIASES 빌드 인라인 회귀 방지.
 * Jest 에는 process 가 있어 런타임 테스트만으로는 브라우저 동작을 보장할 수 없으므로
 * 소스에서 직접 참조(가드 없음)를 정적으로 검증한다.
 */
const fs = require('fs');
const path = require('path');
const { parseTenantHostAliases, getTenantHostAliasMap } = require('../subdomainUtils');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'subdomainUtils.js'), 'utf8');

describe('getTenantHostAliasMap build inlining', () => {
  const fnBody = (() => {
    const start = SOURCE.indexOf('export function getTenantHostAliasMap');
    const end = SOURCE.indexOf('\n}\n', start);
    return SOURCE.slice(start, end);
  })();

  it('references process.env.REACT_APP_TENANT_HOST_ALIASES directly', () => {
    expect(fnBody).toMatch(/process\.env\.REACT_APP_TENANT_HOST_ALIASES/);
  });

  it('has no typeof process guard (would evaluate to empty in browser)', () => {
    expect(fnBody).not.toMatch(/typeof\s+process/);
    expect(SOURCE).not.toMatch(/typeof\s+process[^\n]*\n?[^\n]*REACT_APP_TENANT_HOST_ALIASES/);
  });
});

describe('empty alias value (prod)', () => {
  const original = process.env.REACT_APP_TENANT_HOST_ALIASES;
  afterEach(() => {
    if (original === undefined) delete process.env.REACT_APP_TENANT_HOST_ALIASES;
    else process.env.REACT_APP_TENANT_HOST_ALIASES = original;
  });

  it.each([undefined, null, ''])('parse(%p) → empty map', (raw) => {
    expect(parseTenantHostAliases(raw)).toEqual({});
  });

  it('unset env → empty map', () => {
    delete process.env.REACT_APP_TENANT_HOST_ALIASES;
    expect(getTenantHostAliasMap()).toEqual({});
  });

  it('empty env → empty map', () => {
    process.env.REACT_APP_TENANT_HOST_ALIASES = '';
    expect(getTenantHostAliasMap()).toEqual({});
  });

  it('set env → parsed map', () => {
    process.env.REACT_APP_TENANT_HOST_ALIASES = 'mindgarden-dev.example.com:mindgarden';
    expect(getTenantHostAliasMap()).toEqual({ 'mindgarden-dev.example.com': 'mindgarden' });
  });
});
