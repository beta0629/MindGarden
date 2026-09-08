jest.mock('@/theme/admin-theme', () => ({
  adminTheme: { role: 'admin-theme' },
}));
jest.mock('@/theme/consultant-theme', () => ({
  consultantTheme: { role: 'consultant-theme' },
}));
jest.mock('@/theme/client-theme', () => ({
  clientTheme: { role: 'client-theme' },
}));

import { adminTheme } from '@/theme/admin-theme';
import { clientTheme } from '@/theme/client-theme';
import { consultantTheme } from '@/theme/consultant-theme';
import { colors } from '@/theme/tokens';
import { resolveThemeForRole } from '@/theme/resolveThemeForRole';

describe('resolveThemeForRole', () => {
  it('returns adminTheme for admin and staff roles', () => {
    expect(resolveThemeForRole('admin')).toBe(adminTheme);
    expect(resolveThemeForRole('staff')).toBe(adminTheme);
  });

  it('returns consultantTheme for consultant and clientTheme for client', () => {
    expect(resolveThemeForRole('consultant')).toBe(consultantTheme);
    expect(resolveThemeForRole('client')).toBe(clientTheme);
  });
});

describe('admin theme tokens (Clinic-OS cs.* / Layout phase2)', () => {
  it('defines admin/ops palette aligned to Clinic-OS primary companions', () => {
    expect(colors.admin.primary).toBe('#0E5F5A');
    expect(colors.admin.primaryLight).toBe('#145A55');
    expect(colors.admin.primaryDark).toBe('#0A4F4B');
    expect(colors.admin.primaryHover).toBe('#0F766E');
    expect(colors.admin.primaryPress).toBe('#0A4F4B');
    expect(colors.admin.bgMain).toBe('#FAF9F7');
    expect(colors.admin.bgSub).toBe('#F0EDE8');
    expect(colors.admin.surface).toBe('#F5F3EF');
    expect(colors.admin.surfaceAlt).toBe('#EDE9E1');
  });
});

describe('consultant theme tokens (Clinic-OS dusty teal / cs.*)', () => {
  it('defines counselor palette aligned to cs.primary companions', () => {
    expect(colors.consultant.primary).toBe('#0E5F5A');
    expect(colors.consultant.primaryLight).toBe('#145A55');
    expect(colors.consultant.primaryDark).toBe('#0A4F4B');
    expect(colors.consultant.primaryHover).toBe('#0F766E');
    expect(colors.consultant.primaryPress).toBe('#0A4F4B');
    expect(colors.consultant.accentSoft).toBe('#F0EDE8');
    expect(colors.consultant.bgSub).toBe('#F0EDE8');
  });
});

describe('client theme tokens (coral unchanged)', () => {
  it('keeps client coral primary palette', () => {
    expect(colors.client.primary).toBe('#E07A5F');
    expect(colors.client.primaryLight).toBe('#F2CC8F');
    expect(colors.client.primaryDark).toBe('#C06A50');
    expect(colors.client).not.toHaveProperty('primaryHover');
    expect(colors.client).not.toHaveProperty('primaryPress');
  });
});

describe('common colors (cs.ink / onTeal / line)', () => {
  it('aligns ink, onTeal, and line to Clinic-OS cs.*', () => {
    expect(colors.common.textMain).toBe('#0F172A');
    expect(colors.common.textOnPrimary).toBe('#FAF9F7');
    expect(colors.common.border).toBe('#E2E8F0');
  });
});
