import {
  formatDualRoleLabel,
  getAvailableRoles,
  getNormalizedRole,
  hasAnyRole,
  hasCounselorCapability,
  hasOperatorCapability,
  mapLegacyRole,
  resolvePushShellRole,
  ROLE_ADMIN,
  ROLE_CONSULTANT,
  ROLE_STAFF,
} from '../roleCapability';

describe('roleCapability', () => {
  describe('mapLegacyRole', () => {
    it('maps store roles to SSOT', () => {
      expect(mapLegacyRole('admin')).toBe(ROLE_ADMIN);
      expect(mapLegacyRole('staff')).toBe(ROLE_STAFF);
      expect(mapLegacyRole('consultant')).toBe(ROLE_CONSULTANT);
    });

    it('maps legacy API roles', () => {
      expect(mapLegacyRole('TENANT_ADMIN')).toBe(ROLE_ADMIN);
      expect(mapLegacyRole('PLAY_THERAPIST')).toBe(ROLE_CONSULTANT);
    });
  });

  describe('hasOperatorCapability', () => {
    it('returns true for admin/staff store roles', () => {
      expect(hasOperatorCapability({ role: 'admin' })).toBe(true);
      expect(hasOperatorCapability({ role: 'staff' })).toBe(true);
    });

    it('respects hasOperatorRole BE field', () => {
      expect(hasOperatorCapability({ role: 'client', hasOperatorRole: true })).toBe(true);
      expect(hasOperatorCapability({ role: 'admin', hasOperatorRole: false })).toBe(false);
    });

    it('returns false for consultant-only', () => {
      expect(hasOperatorCapability({ role: 'consultant' })).toBe(false);
    });
  });

  describe('hasCounselorCapability', () => {
    it('returns true for consultant role', () => {
      expect(hasCounselorCapability({ role: 'consultant' })).toBe(true);
    });

    it('returns true for admin with counselingEnabled', () => {
      expect(
        hasCounselorCapability({ role: 'admin', counselingEnabled: true }),
      ).toBe(true);
    });

    it('returns true for admin with hasCounselorRole', () => {
      expect(
        hasCounselorCapability({ role: 'admin', hasCounselorRole: true }),
      ).toBe(true);
    });

    it('returns false for admin without counseling', () => {
      expect(hasCounselorCapability({ role: 'admin' })).toBe(false);
    });
  });

  describe('dual admin', () => {
    const dualAdmin = {
      role: 'admin' as const,
      counselingEnabled: true,
      hasOperatorRole: true,
      hasCounselorRole: true,
    };

    it('has both capabilities', () => {
      expect(hasOperatorCapability(dualAdmin)).toBe(true);
      expect(hasCounselorCapability(dualAdmin)).toBe(true);
    });

    it('formatDualRoleLabel returns Korean label', () => {
      expect(formatDualRoleLabel(dualAdmin)).toBe('운영 · 상담');
    });

    it('resolvePushShellRole treats dual admin as consultant for push', () => {
      expect(resolvePushShellRole(dualAdmin)).toBe('consultant');
    });

    it('getAvailableRoles includes admin and consultant', () => {
      const roles = getAvailableRoles(dualAdmin);
      expect(roles).toContain(ROLE_ADMIN);
      expect(roles).toContain(ROLE_CONSULTANT);
    });
  });

  describe('getAvailableRoles from BE availableRoles', () => {
    it('uses availableRoles when provided', () => {
      expect(
        getAvailableRoles({ role: 'admin', availableRoles: ['ADMIN', 'CONSULTANT'] }),
      ).toEqual([ROLE_ADMIN, ROLE_CONSULTANT]);
    });
  });

  describe('getNormalizedRole', () => {
    it('normalizes store role', () => {
      expect(getNormalizedRole({ role: 'admin' })).toBe(ROLE_ADMIN);
    });
  });

  describe('hasAnyRole', () => {
    it('checks against available roles for dual admin', () => {
      const dual = { role: 'admin' as const, counselingEnabled: true };
      expect(hasAnyRole(dual, [ROLE_CONSULTANT])).toBe(true);
      expect(hasAnyRole(dual, [ROLE_STAFF])).toBe(false);
    });
  });

  describe('formatDualRoleLabel', () => {
    it('returns null for single-role users', () => {
      expect(formatDualRoleLabel({ role: 'admin' })).toBeNull();
      expect(formatDualRoleLabel({ role: 'consultant' })).toBeNull();
    });
  });
});
