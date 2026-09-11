/**
 * filterMappingsByClientSearch 단위 테스트
 */

import {
  buildClientDirectoryIndex,
  filterMappingsByClientSearch,
  normalizeClientSearchToken
} from '../filterMappingsByClientSearch';

describe('normalizeClientSearchToken', () => {
  it('trims and lowercases', () => {
    expect(normalizeClientSearchToken('  김예린  ')).toBe('김예린');
    expect(normalizeClientSearchToken('ABC')).toBe('abc');
  });

  it('handles nullish', () => {
    expect(normalizeClientSearchToken(null)).toBe('');
    expect(normalizeClientSearchToken(undefined)).toBe('');
  });
});

describe('filterMappingsByClientSearch', () => {
  const mappings = [
    {
      id: 1,
      clientId: 10,
      clientName: '김예린',
      consultantName: '박상담',
      remainingSessions: 3
    },
    {
      id: 2,
      clientId: 20,
      clientName: '이재학',
      consultantName: '최상담',
      remainingSessions: 1
    },
    {
      id: 3,
      clientId: 30,
      clientName: '홍길동',
      consultantName: '박상담',
      remainingSessions: 0
    }
  ];

  const directory = [
    { id: 10, name: '김예린', phone: '010-1111-2222', email: 'yerin@example.com' },
    { id: 20, name: '이재학', phone: '010-3333-4444', email: 'jaehak@example.com' }
  ];

  it('returns original list when query empty', () => {
    expect(filterMappingsByClientSearch(mappings, '  ')).toBe(mappings);
  });

  it('filters by client name', () => {
    const result = filterMappingsByClientSearch(mappings, '예린');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('filters by phone via client directory', () => {
    const result = filterMappingsByClientSearch(mappings, '3333', directory);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });

  it('filters by email via client directory', () => {
    const result = filterMappingsByClientSearch(mappings, 'yerin@', directory);
    expect(result).toHaveLength(1);
    expect(result[0].clientName).toBe('김예린');
  });

  it('filters by consultant name', () => {
    const result = filterMappingsByClientSearch(mappings, '박상담');
    expect(result.map((m) => m.id)).toEqual([1, 3]);
  });

  it('returns empty array for non-array mappings', () => {
    expect(filterMappingsByClientSearch(null, '김')).toEqual([]);
  });
});

describe('buildClientDirectoryIndex', () => {
  it('indexes by string id', () => {
    const index = buildClientDirectoryIndex([{ id: 7, name: 'A', phone: '1', email: 'a@b.c' }]);
    expect(index.get('7')).toEqual({ name: 'A', phone: '1', email: 'a@b.c' });
  });
});
