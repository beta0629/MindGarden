/**
 * NotificationBadge — NavIcon 인접 배치 계약 (tablet GNB)
 */
import fs from 'fs';
import path from 'path';

const cssPath = path.resolve(__dirname, '..', 'NotificationBadge.css');
const css = fs.readFileSync(cssPath, 'utf8');

describe('NotificationBadge atom CSS', () => {
  it('sits on icon corner (top/right 0 + translate), not inset 8px', () => {
    expect(css).toMatch(/\.mg-v2-notification-badge\s*\{[^}]*top:\s*0/s);
    expect(css).toMatch(/\.mg-v2-notification-badge\s*\{[^}]*right:\s*0/s);
    expect(css).toMatch(/transform:\s*translate\(35%,\s*-35%\)/);
    expect(css).not.toMatch(/top:\s*8px/);
    expect(css).not.toMatch(/right:\s*8px/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
