import {
  buildDepositPendingQueue,
  DEPOSIT_SOURCE_TYPES,
  shouldIncludeInDepositPendingQueue
} from '../depositPendingQueue';

describe('depositPendingQueue', () => {
  test('최초 결제와 회기 추가를 출처 식별 가능한 공통 행으로 정규화한다', () => {
    const queue = buildDepositPendingQueue(
      [{
        id: 10,
        clientName: '최초 내담자',
        consultantName: '최초 상담사',
        packagePrice: 100000,
        createdAt: '2026-07-17T09:00:00'
      }],
      [{
        id: 20,
        mappingId: 10,
        mapping: {
          id: 10,
          clientName: '추가 내담자',
          consultantName: '추가 상담사'
        },
        packagePrice: 200000,
        additionalSessions: 4,
        status: 'PENDING',
        createdAt: '2026-07-17T10:00:00'
      }]
    );

    expect(queue).toEqual([
      expect.objectContaining({
        id: 'MAPPING_DEPOSIT-10',
        sourceType: DEPOSIT_SOURCE_TYPES.MAPPING_DEPOSIT,
        sourceId: 10,
        mappingId: 10,
        amount: 100000
      }),
      expect.objectContaining({
        id: 'SESSION_EXTENSION-20',
        sourceType: DEPOSIT_SOURCE_TYPES.SESSION_EXTENSION,
        sourceId: 20,
        mappingId: 10,
        clientName: '추가 내담자',
        consultantName: '추가 상담사',
        amount: 200000,
        additionalSessions: 4
      })
    ]);
  });

  test('amount: pgAmount(PortOne) 우선 — packagePrice 스냅샷보다 SSOT', () => {
    const queue = buildDepositPendingQueue(
      [{
        id: 272,
        packagePrice: 10000,
        paymentAmount: 10000,
        pgAmount: 100000,
        createdAt: '2026-09-17T09:00:00'
      }],
      []
    );
    expect(queue).toHaveLength(1);
    expect(queue[0].amount).toBe(100000);
  });

  test('환불·취소 행은 대기 큐에서 제외', () => {
    expect(shouldIncludeInDepositPendingQueue({
      id: 1,
      effectivePaymentStatus: 'REFUNDED',
      pgAmount: 100000,
      packagePrice: 10000
    })).toBe(false);

    const queue = buildDepositPendingQueue(
      [
        {
          id: 1,
          effectivePaymentStatus: 'REFUNDED',
          orderStatus: 'REFUNDED',
          pgAmount: 100000,
          packagePrice: 10000,
          createdAt: '2026-09-17T09:00:00'
        },
        {
          id: 2,
          paymentStatus: 'PENDING',
          pgAmount: 100000,
          packagePrice: 10000,
          createdAt: '2026-09-17T10:00:00'
        }
      ],
      []
    );
    expect(queue).toHaveLength(1);
    expect(queue[0].sourceId).toBe(2);
    expect(queue[0].amount).toBe(100000);
  });

  test('title: productTitle 우선', () => {
    const queue = buildDepositPendingQueue(
      [{
        id: 3,
        packageName: '무료1회',
        productTitle: 'Welcome 패키지',
        pgAmount: 100000,
        createdAt: '2026-09-17T11:00:00'
      }],
      []
    );
    expect(queue[0].productTitle).toBe('Welcome 패키지');
    expect(queue[0].packageName).toBe('Welcome 패키지');
  });
});
