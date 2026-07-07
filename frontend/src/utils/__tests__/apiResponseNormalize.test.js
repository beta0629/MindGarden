import { asArray, normalizeApiListPayload, normalizeMappingsListPayload } from '../apiResponseNormalize';

describe('asArray — AdminDashboard 배열 정규화 패턴', () => {
  it('null·undefined·비객체는 빈 배열을 반환한다', () => {
    expect(asArray(null, 'mappings')).toEqual([]);
    expect(asArray(undefined, 'clients')).toEqual([]);
    expect(asArray('invalid', 'mappings')).toEqual([]);
  });

  it('이미 배열이면 그대로 반환한다', () => {
    const rows = [{ id: 1 }];
    expect(asArray(rows, 'mappings')).toBe(rows);
  });

  it('mappings 래핑 객체에서 mappings 배열을 추출한다', () => {
    const mappings = [{ id: 10, status: 'ACTIVE' }];
    expect(asArray({ mappings, count: 1 }, 'mappings')).toEqual(mappings);
    expect(asArray({ data: { mappings } }, 'mappings')).toEqual(mappings);
  });

  it('clients·consultants·requests 목록 키를 각각 추출한다', () => {
    const clients = [{ id: 1 }];
    const consultants = [{ id: 2 }];
    const requests = [{ id: 3 }];
    expect(asArray({ clients }, 'clients')).toEqual(clients);
    expect(asArray({ consultants }, 'consultants')).toEqual(consultants);
    expect(asArray({ requests, count: 1 }, 'requests')).toEqual(requests);
  });

  it('data 필드가 배열이면 listKey 없이도 배열을 반환한다', () => {
    const rows = [{ id: 99 }];
    expect(asArray({ data: rows }, 'mappings')).toEqual(rows);
  });

  it('목록 키가 없으면 빈 배열 — mappings.filter TypeError 방지', () => {
    expect(asArray({ count: 0 }, 'mappings')).toEqual([]);
    expect(asArray({ success: true, data: { count: 0 } }, 'mappings')).toEqual([]);
  });
});

describe('normalizeApiListPayload / normalizeMappingsListPayload', () => {
  it('mappings 중첩 페이로드를 배열로 정규화한다', () => {
    const mappings = [{ id: 1 }];
    expect(normalizeMappingsListPayload({ mappings })).toEqual(mappings);
    expect(normalizeApiListPayload({ data: { mappings } })).toEqual(mappings);
  });
});
