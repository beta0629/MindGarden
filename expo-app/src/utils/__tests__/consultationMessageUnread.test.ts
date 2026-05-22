import {
  isUnreadMessageForReceiver,
  parseMessageIsRead,
  parseUnreadMessageCountPayload,
} from '../consultationMessageUnread';

describe('parseUnreadMessageCountPayload', () => {
  it('reads unreadCount from ApiResponse wrapper', () => {
    expect(parseUnreadMessageCountPayload({ success: true, data: { unreadCount: 3 } })).toBe(3);
  });

  it('returns 0 for missing or invalid payload', () => {
    expect(parseUnreadMessageCountPayload(null)).toBe(0);
    expect(parseUnreadMessageCountPayload({ success: true, data: {} })).toBe(0);
  });
});

describe('parseMessageIsRead', () => {
  it('treats boolean and numeric forms as read/unread', () => {
    expect(parseMessageIsRead(true)).toBe(true);
    expect(parseMessageIsRead(false)).toBe(false);
    expect(parseMessageIsRead(1)).toBe(true);
    expect(parseMessageIsRead(0)).toBe(false);
  });

  it('normalizes string false/true from JSON', () => {
    expect(parseMessageIsRead('false')).toBe(false);
    expect(parseMessageIsRead('FALSE')).toBe(false);
    expect(parseMessageIsRead('true')).toBe(true);
    expect(parseMessageIsRead('0')).toBe(false);
    expect(parseMessageIsRead('1')).toBe(true);
  });
});

describe('isUnreadMessageForReceiver', () => {
  it('counts only when receiver is self and not read', () => {
    expect(isUnreadMessageForReceiver(false, 10, 10)).toBe(true);
    expect(isUnreadMessageForReceiver('false', 10, 10)).toBe(true);
    expect(isUnreadMessageForReceiver('true', 10, 10)).toBe(false);
    expect(isUnreadMessageForReceiver(true, 10, 10)).toBe(false);
    expect(isUnreadMessageForReceiver(false, 10, 99)).toBe(false);
  });
});
