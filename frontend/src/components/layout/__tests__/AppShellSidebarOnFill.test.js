/**
 * AppShell LNB on-fill — CSS 셀렉터/토큰 스냅 (JSDOM hover 한계 보완)
 * Consultant: sidebar on-fill tokens. Client: no desktop sidebar (SSOT).
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

const fs = require('fs');
const path = require('path');

describe('AppShell sidebar on-fill CSS', () => {
  const consultantCss = fs.readFileSync(
    path.join(__dirname, '../ConsultantAppShell.css'),
    'utf8'
  );
  const clientCss = fs.readFileSync(
    path.join(__dirname, '../ClientAppShell.css'),
    'utf8'
  );
  const clientJs = fs.readFileSync(
    path.join(__dirname, '../ClientAppShell.js'),
    'utf8'
  );

  it('Consultant shell 사이드바는 다크 surface + sidebar-active on-fill 토큰을 쓴다', () => {
    expect(consultantCss).toContain('--mg-v2-color-surface-sidebar');
    expect(consultantCss).toContain('--mg-v2-color-text-on-sidebar-active');
    expect(consultantCss).toContain('--mg-v2-lnb-on-fill');
    expect(consultantCss).toContain('a.mg-app-shell__sidebar-item:hover');
    expect(consultantCss).toContain('sidebar-item--active');
    expect(consultantCss).toMatch(/color:\s*var\(--mg-v2-lnb-on-fill\)/);
    // hover/active 에 shell-primary(어두운 브랜드색) 강제 금지
    expect(consultantCss).not.toMatch(
      /sidebar-item:hover\s*\{[^}]*var\(--shell-primary\)/
    );
    expect(consultantCss).not.toMatch(
      /sidebar-item--active\s*\{[^}]*var\(--shell-primary\)/
    );
  });

  it('Client shell 은 데스크톱 사이드바를 마운트하지 않는다 (header SSOT)', () => {
    expect(clientJs).not.toContain('mg-app-shell__sidebar');
    expect(clientJs).not.toContain('sidebar-logo-text');
    expect(clientCss).toContain('margin-left: 0');
    expect(clientCss).not.toMatch(
      /sidebar-item:hover\s*\{[^}]*var\(--shell-primary\)/
    );
  });
});
