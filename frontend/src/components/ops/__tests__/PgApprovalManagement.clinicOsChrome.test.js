/**
 * PgApprovalManagement Clinic-OS chrome — quiet header / stage / no B0KlA
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const js = fs.readFileSync(path.join(root, 'PgApprovalManagement.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'PgApprovalManagement.css'), 'utf8');

describe('PgApprovalManagement Clinic-OS chrome', () => {
  test('does not use mg-v2-ad-b0kla', () => {
    expect(js).not.toMatch(/mg-v2-ad-b0kla/);
  });

  test('uses quiet header + paper stage', () => {
    expect(js).toMatch(/pg-approval-quiet-header/);
    expect(js).toMatch(/pg-approval__stage/);
    expect(css).toMatch(/\.pg-approval__stage\s*\{[^}]*min-height:\s*36rem/s);
    expect(css).toMatch(/var\(--mg-v2-color-neutral-50\)/);
  });

  test('승인 검토 is primary; 거부 검토 is outline brick class', () => {
    expect(js).toMatch(/variant=["']primary["']/);
    expect(js).toMatch(/pg-approval-cta--reject-review/);
    expect(js).toMatch(/variant=["']outline["']/);
  });
});
