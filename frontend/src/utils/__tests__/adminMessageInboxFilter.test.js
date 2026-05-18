import {
  filterAdminMessagesForOpsInbox,
  isVisibleInAdminOpsInbox
} from '../adminMessageInboxFilter';

describe('adminMessageInboxFilter', () => {
  it('REMINDER + SYSTEM → 숨김', () => {
    expect(isVisibleInAdminOpsInbox('REMINDER', 'SYSTEM', '상담 30분 전', '곧 상담')).toBe(false);
  });

  it('PAYMENT_COMPLETION + SYSTEM → 노출', () => {
    expect(isVisibleInAdminOpsInbox('PAYMENT_COMPLETION', 'SYSTEM', '결제 완료', '')).toBe(true);
  });

  it('GENERAL + 결제 키워드 → 노출', () => {
    expect(isVisibleInAdminOpsInbox('GENERAL', 'SYSTEM', '입금 확인', '매칭 결제')).toBe(true);
  });

  it('COMPLETION + 상담일지 누락 → 숨김', () => {
    expect(isVisibleInAdminOpsInbox('COMPLETION', 'SYSTEM', '상담일지 누락', '')).toBe(false);
  });

  it('filterAdminMessagesForOpsInbox: 배열 필터', () => {
    const rows = [
      { messageType: 'REMINDER', senderType: 'SYSTEM', title: 'a', content: 'b' },
      { messageType: 'PAYMENT_COMPLETION', senderType: 'SYSTEM', title: 'c', content: 'd' }
    ];
    expect(filterAdminMessagesForOpsInbox(rows)).toHaveLength(1);
  });
});
