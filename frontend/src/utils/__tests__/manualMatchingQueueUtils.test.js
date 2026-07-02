import {
  filterManualMatchingQueueClients,
  isEligibleForManualMatching
} from '../manualMatchingQueueUtils';

describe('manualMatchingQueueUtils', () => {
  const activeUnassigned = {
    id: 1,
    name: '활성',
    mappingCount: 0,
    isActive: true,
    lifecycleState: 'ACTIVE'
  };

  const deletedUnassigned = {
    id: 2,
    name: '삭제됨',
    mappingCount: 0,
    isActive: true,
    lifecycleState: 'DELETED_BY_ADMIN'
  };

  const assignedActive = {
    id: 3,
    name: '매칭있음',
    mappingCount: 1,
    isActive: true,
    lifecycleState: 'ACTIVE'
  };

  describe('isEligibleForManualMatching', () => {
    it('returns true for active unassigned clients', () => {
      expect(isEligibleForManualMatching(activeUnassigned)).toBe(true);
    });

    it('excludes DELETED_BY_ADMIN clients even when isActive is true', () => {
      expect(isEligibleForManualMatching(deletedUnassigned)).toBe(false);
    });

    it('excludes clients with mappings', () => {
      expect(isEligibleForManualMatching(assignedActive)).toBe(false);
    });

    it('excludes inactive clients', () => {
      expect(isEligibleForManualMatching({ ...activeUnassigned, isActive: false })).toBe(false);
    });

    it('excludes isDeleted clients', () => {
      expect(isEligibleForManualMatching({ ...activeUnassigned, isDeleted: true })).toBe(false);
    });
  });

  describe('filterManualMatchingQueueClients', () => {
    it('filters deleted and assigned clients defensively', () => {
      const result = filterManualMatchingQueueClients([
        activeUnassigned,
        deletedUnassigned,
        assignedActive
      ]);
      expect(result).toEqual([activeUnassigned]);
    });

    it('returns empty array for non-array input', () => {
      expect(filterManualMatchingQueueClients(null)).toEqual([]);
    });
  });
});
