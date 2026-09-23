/**
 * IAMPORT/PortOne create UX — testMode default ON + switch above channel keys
 *
 * Source-text locks (same style as PgConfiguration.clinicOsChrome.test.js).
 * Never embed real channel-key strings — placeholders only.
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const formJs = fs.readFileSync(
  path.join(FRONTEND_ROOT, 'src/components/tenant/PgConfigurationForm.js'),
  'utf8'
);

describe('PgConfigurationForm IAMPORT testMode create defaults', () => {
  test('create path defaults testMode true (initial state + fresh IAMPORT effect)', () => {
    expect(formJs).toMatch(/testMode:\s*mode\s*===\s*['"]create['"]/);
    expect(formJs).toMatch(
      /prevPgProviderRef\.current\s*!==\s*PG_PROVIDER_IAMPORT[\s\S]*?setFormData\(\(prev\)\s*=>\s*\(\{\s*\.\.\.prev,\s*testMode:\s*true\s*\}\)/
    );
    // edit load must still use initialData (not forced true)
    expect(formJs).toMatch(/testMode:\s*initialData\.testMode\s*\|\|\s*false/);
  });

  test('with testMode true, live channel key is not required (aria/class gated)', () => {
    // live key: required only when NOT testMode
    expect(formJs).toMatch(
      /htmlFor="portoneChannelKey"\s+className=\{formData\.testMode\s*\?\s*undefined\s*:\s*['"]required['"]\}/
    );
    expect(formJs).toMatch(
      /id="portoneChannelKey"[\s\S]*?aria-required=\{!formData\.testMode\s*\?\s*['"]true['"]\s*:\s*['"]false['"]\}/
    );
    // validation branch: testMode → test key error; else → live key error
    expect(formJs).toMatch(
      /if\s*\(formData\.testMode\)\s*\{\s*newErrors\.portoneChannelKeyTest\s*=/
    );
    expect(formJs).toMatch(
      /newErrors\.portoneChannelKey\s*=\s*['"]운영\(라이브\) 채널 키를 입력하세요\./
    );
    // test key becomes required when testMode
    expect(formJs).toMatch(
      /htmlFor="portoneChannelKeyTest"\s+className=\{formData\.testMode\s*\?\s*['"]required['"]\s*:\s*undefined\}/
    );
  });

  test('testModeIamport switch appears BEFORE channel key fields in source', () => {
    const switchIdx = formJs.indexOf('id="testModeIamport"');
    const liveKeyIdx = formJs.indexOf('id="portoneChannelKey"');
    const testKeyIdx = formJs.indexOf('id="portoneChannelKeyTest"');

    expect(switchIdx).toBeGreaterThan(-1);
    expect(liveKeyIdx).toBeGreaterThan(-1);
    expect(testKeyIdx).toBeGreaterThan(-1);
    expect(switchIdx).toBeLessThan(liveKeyIdx);
    expect(switchIdx).toBeLessThan(testKeyIdx);
  });
});
