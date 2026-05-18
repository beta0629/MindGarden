jest.mock('@/config/webBaseUrl', () => ({
  buildAdminWebUrl: (relativePath: string) => `https://example.test${relativePath}`,
}));

import { ADMIN_MOBILE_MESSAGES_COPY } from '@/constants/adminMobileScreensCopy';
import {
  normalizeAdminMessageSenderFields,
  resolveAdminMessageSenderLabel,
} from '../adminMessageDisplay';

describe('adminMessageDisplay', () => {
  it('maps SYSTEM senderType to 시스템 regardless of API senderName', () => {
    expect(
      resolveAdminMessageSenderLabel({
        senderType: 'SYSTEM',
        senderName: '알 수 없음',
      }),
    ).toBe(ADMIN_MOBILE_MESSAGES_COPY.SYSTEM_SENDER);
    expect(
      resolveAdminMessageSenderLabel({
        senderType: ' system ',
        senderName: '',
      }),
    ).toBe('시스템');
  });

  it('keeps CONSULTANT senderName from API', () => {
    expect(
      resolveAdminMessageSenderLabel({
        senderType: 'CONSULTANT',
        senderName: '김상담',
      }),
    ).toBe('김상담');
  });

  it('preserves 알 수 없음 for non-SYSTEM when API returns it', () => {
    expect(
      resolveAdminMessageSenderLabel({
        senderType: 'CONSULTANT',
        senderName: '알 수 없음',
      }),
    ).toBe('알 수 없음');
  });

  it('normalizeAdminMessageSenderFields applies SYSTEM label from raw row', () => {
    expect(
      normalizeAdminMessageSenderFields({
        senderType: 'SYSTEM',
        senderName: '알 수 없음',
      }),
    ).toEqual({
      senderType: 'SYSTEM',
      senderName: '시스템',
    });
  });

  it('normalizeAdminMessageSenderFields falls back empty senderName to 발신자', () => {
    expect(
      normalizeAdminMessageSenderFields({
        senderType: 'CLIENT',
        senderName: '',
      }),
    ).toEqual({
      senderType: 'CLIENT',
      senderName: '발신자',
    });
  });
});
