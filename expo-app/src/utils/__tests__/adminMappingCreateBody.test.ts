import {
  buildAdminMappingCreateRequestBody,
  generateMappingPaymentReference,
} from '../adminMappingCreateBody';
import { ADMIN_MAPPING_DEFAULTS } from '@/constants/adminMappingCopy';

describe('adminMappingCreateBody', () => {
  it('generates payment reference prefixes by method', () => {
    expect(generateMappingPaymentReference('CASH')).toMatch(/^CASH_\d{8}_\d{6}$/);
    expect(generateMappingPaymentReference('CARD')).toMatch(/^CARD_\d{8}_\d{6}$/);
    expect(generateMappingPaymentReference('BANK_TRANSFER')).toMatch(/^BANK_\d{8}_\d{6}$/);
    expect(generateMappingPaymentReference('OTHER')).toMatch(/^OTHER_\d{8}_\d{6}$/);
  });

  it('builds POST body aligned with web MappingCreationModal', () => {
    const body = buildAdminMappingCreateRequestBody({
      consultantId: 10,
      clientId: 20,
      payment: {
        totalSessions: 10,
        packageName: '기본 10회기 패키지',
        packagePrice: 500_000,
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: 'BANK_20260518_120000',
        responsibility: ADMIN_MAPPING_DEFAULTS.RESPONSIBILITY,
        specialConsiderations: '특이',
        notes: '메모',
      },
    });
    expect(body).toMatchObject({
      consultantId: 10,
      clientId: 20,
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      totalSessions: 10,
      remainingSessions: 10,
      packageName: '기본 10회기 패키지',
      packagePrice: 500_000,
      paymentAmount: 500_000,
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: 'BANK_20260518_120000',
      responsibility: ADMIN_MAPPING_DEFAULTS.RESPONSIBILITY,
      specialConsiderations: '특이',
      notes: '메모',
      mappingType: 'NEW',
    });
    expect(body.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('floors sessions and price to non-negative integers', () => {
    const body = buildAdminMappingCreateRequestBody({
      consultantId: 1,
      clientId: 2,
      payment: {
        totalSessions: 0.9,
        packageName: '단회',
        packagePrice: 99.7,
        paymentMethod: 'CASH',
        paymentReference: 'x',
        responsibility: 'r',
      },
    });
    expect(body.totalSessions).toBe(1);
    expect(body.remainingSessions).toBe(1);
    expect(body.packagePrice).toBe(99);
    expect(body.paymentAmount).toBe(99);
  });
});
