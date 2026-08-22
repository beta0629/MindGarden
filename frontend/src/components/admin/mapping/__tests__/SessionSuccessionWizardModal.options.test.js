/**
 * 회기 승계 — 내담자/상담사 옵션 파싱 (with-mapping-info / with-stats 응답 형태).
 */

import {
  mapSessionSuccessionClientOptions,
  mapSessionSuccessionConsultantOptions
} from '../SessionSuccessionWizardModal';

describe('mapSessionSuccessionClientOptions', () => {
  it('clients 키 래핑에서 옵션을 만들고 소스 CLIENT를 제외한다', () => {
    const payload = {
      clients: [
        { id: 10, name: '소스당사자' },
        { id: 20, name: '수혜자A' },
        { id: 30, clientName: '수혜자B' }
      ],
      count: 3
    };
    expect(mapSessionSuccessionClientOptions(payload, 10)).toEqual([
      { value: '20', label: '수혜자A' },
      { value: '30', label: '수혜자B' }
    ]);
  });

  it('빈 clients·미배열 payload는 빈 옵션이다', () => {
    expect(mapSessionSuccessionClientOptions({ clients: [], count: 0 }, 1)).toEqual([]);
    expect(mapSessionSuccessionClientOptions({ count: 0 }, 1)).toEqual([]);
  });
});

describe('mapSessionSuccessionConsultantOptions', () => {
  it('consultants 키 + nested consultant 객체를 옵션으로 만든다', () => {
    const payload = {
      consultants: [
        { consultant: { id: 7, name: '김상담' }, currentClients: 2 },
        { id: 8, name: '이상담' }
      ],
      count: 2
    };
    expect(mapSessionSuccessionConsultantOptions(payload)).toEqual([
      { value: '7', label: '김상담' },
      { value: '8', label: '이상담' }
    ]);
  });
});
