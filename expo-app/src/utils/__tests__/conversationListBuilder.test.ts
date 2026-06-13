/**
 * conversationListBuilder.buildConversationsFromRows — 단위 테스트
 *
 * 2026-06-13 UX 정정 — 자동 알림(senderType=SYSTEM) 발신자 라벨 정정.
 * 내담자(role=client) 메시지 목록의 마지막 메시지가 SYSTEM 발신이면 partnerName='마인드가든 알림'.
 * 일반 상담사(CONSULTANT) 발신은 기존 '상담사' 라벨 유지.
 *
 * @author MindGarden
 * @since 2026-06-13
 */
import {
  buildConversationsFromRows,
  CLIENT_PARTNER_LABEL,
  SYSTEM_PARTNER_LABEL,
  type ConsultationMessageRow,
} from '../conversationListBuilder';

const CONSULTANT_ID = 101;
const CLIENT_SELF_ID = 5;
const OTHER_CLIENT_ID = 7;

function row(overrides: Partial<ConsultationMessageRow>): ConsultationMessageRow {
  return {
    id: 1,
    consultantId: CONSULTANT_ID,
    clientId: CLIENT_SELF_ID,
    senderType: 'CONSULTANT',
    senderId: CONSULTANT_ID,
    receiverId: CLIENT_SELF_ID,
    content: '메시지 본문',
    title: '제목',
    sentAt: '2026-06-13T01:00:00Z',
    createdAt: '2026-06-13T01:00:00Z',
    isRead: false,
    status: 'SENT',
    ...overrides,
  };
}

describe('buildConversationsFromRows — 자동 알림 발신자 라벨', () => {
  describe('내담자(role=client) 시점', () => {
    it('마지막 메시지가 SYSTEM 발신이면 partnerName 을 "마인드가든 알림" 으로 표시한다', () => {
      const rows: ConsultationMessageRow[] = [
        row({
          id: 11,
          senderType: 'SYSTEM',
          senderId: 0,
          receiverId: CLIENT_SELF_ID,
          content: '입금이 확인되었습니다.\n패키지: 10회\n금액: 500000원',
          sentAt: '2026-06-13T10:00:00Z',
        }),
      ];

      const result = buildConversationsFromRows(rows, 'client', CLIENT_SELF_ID, '');

      expect(result).toHaveLength(1);
      expect(result[0]!.partnerId).toBe(CONSULTANT_ID);
      expect(result[0]!.partnerName).toBe(SYSTEM_PARTNER_LABEL);
      expect(result[0]!.lastMessageSenderType).toBe('SYSTEM');
      expect(result[0]!.lastMessage).toContain('입금이 확인되었습니다');
    });

    it('마지막 메시지가 CONSULTANT 발신이면 partnerName 을 "상담사" 로 유지한다', () => {
      const rows: ConsultationMessageRow[] = [
        row({
          id: 12,
          senderType: 'CONSULTANT',
          senderId: CONSULTANT_ID,
          receiverId: CLIENT_SELF_ID,
          content: '안녕하세요. 다음 상담은 화요일입니다.',
          sentAt: '2026-06-13T11:00:00Z',
        }),
      ];

      const result = buildConversationsFromRows(rows, 'client', CLIENT_SELF_ID, '');

      expect(result).toHaveLength(1);
      expect(result[0]!.partnerName).toBe(CLIENT_PARTNER_LABEL);
      expect(result[0]!.lastMessageSenderType).toBe('CONSULTANT');
    });

    it('같은 상담사 스레드에서 CONSULTANT 메시지 뒤 SYSTEM 메시지가 더 최신이면 "마인드가든 알림" 으로 표시', () => {
      const rows: ConsultationMessageRow[] = [
        row({
          id: 21,
          senderType: 'CONSULTANT',
          senderId: CONSULTANT_ID,
          receiverId: CLIENT_SELF_ID,
          content: '안녕하세요',
          sentAt: '2026-06-12T10:00:00Z',
        }),
        row({
          id: 22,
          senderType: 'SYSTEM',
          senderId: 0,
          receiverId: CLIENT_SELF_ID,
          content: '입금이 확인되었습니다.',
          sentAt: '2026-06-13T10:00:00Z',
        }),
      ];

      const result = buildConversationsFromRows(rows, 'client', CLIENT_SELF_ID, '');

      expect(result).toHaveLength(1);
      expect(result[0]!.partnerName).toBe(SYSTEM_PARTNER_LABEL);
      expect(result[0]!.lastMessageSenderType).toBe('SYSTEM');
      expect(result[0]!.lastMessage).toContain('입금이 확인되었습니다');
    });

    it('과거 SYSTEM 메시지 + 더 최신 CONSULTANT 메시지면 "상담사" 라벨 유지', () => {
      const rows: ConsultationMessageRow[] = [
        row({
          id: 31,
          senderType: 'SYSTEM',
          senderId: 0,
          receiverId: CLIENT_SELF_ID,
          content: '예전 자동 알림',
          sentAt: '2026-06-10T10:00:00Z',
        }),
        row({
          id: 32,
          senderType: 'CONSULTANT',
          senderId: CONSULTANT_ID,
          receiverId: CLIENT_SELF_ID,
          content: '최신 상담사 메시지',
          sentAt: '2026-06-13T10:00:00Z',
        }),
      ];

      const result = buildConversationsFromRows(rows, 'client', CLIENT_SELF_ID, '');

      expect(result).toHaveLength(1);
      expect(result[0]!.partnerName).toBe(CLIENT_PARTNER_LABEL);
      expect(result[0]!.lastMessageSenderType).toBe('CONSULTANT');
    });

    it('SYSTEM 메시지 미읽음이 unreadCount 에 합산된다 (수신자=본인)', () => {
      const rows: ConsultationMessageRow[] = [
        row({
          id: 41,
          senderType: 'SYSTEM',
          senderId: 0,
          receiverId: CLIENT_SELF_ID,
          isRead: false,
          content: '입금이 확인되었습니다.',
          sentAt: '2026-06-13T09:00:00Z',
        }),
      ];

      const result = buildConversationsFromRows(rows, 'client', CLIENT_SELF_ID, '');

      expect(result[0]!.unreadCount).toBe(1);
      expect(result[0]!.unreadMessageIds).toEqual([41]);
    });

    it('"마인드가든" 검색어로 SYSTEM 스레드를 찾을 수 있다', () => {
      const rows: ConsultationMessageRow[] = [
        row({
          id: 51,
          senderType: 'SYSTEM',
          senderId: 0,
          receiverId: CLIENT_SELF_ID,
          content: '입금이 확인되었습니다.',
          sentAt: '2026-06-13T09:00:00Z',
        }),
      ];

      const result = buildConversationsFromRows(rows, 'client', CLIENT_SELF_ID, '마인드가든');

      expect(result).toHaveLength(1);
      expect(result[0]!.partnerName).toBe(SYSTEM_PARTNER_LABEL);
    });

    it('"상담사" 검색어로 일반 상담사 스레드만 매칭되고 SYSTEM 스레드는 제외된다', () => {
      const rows: ConsultationMessageRow[] = [
        row({
          id: 61,
          consultantId: CONSULTANT_ID,
          senderType: 'SYSTEM',
          senderId: 0,
          receiverId: CLIENT_SELF_ID,
          content: '입금이 확인되었습니다.',
          sentAt: '2026-06-13T10:00:00Z',
        }),
        row({
          id: 62,
          consultantId: 202,
          senderType: 'CONSULTANT',
          senderId: 202,
          receiverId: CLIENT_SELF_ID,
          content: '안녕하세요',
          sentAt: '2026-06-13T08:00:00Z',
        }),
      ];

      const result = buildConversationsFromRows(rows, 'client', CLIENT_SELF_ID, '상담사');

      expect(result).toHaveLength(1);
      expect(result[0]!.partnerId).toBe(202);
      expect(result[0]!.partnerName).toBe(CLIENT_PARTNER_LABEL);
    });
  });

  describe('상담사(role=consultant) 시점', () => {
    it('마지막 메시지가 SYSTEM 이어도 partnerName(=내담자 이름)은 변경되지 않는다', () => {
      const rows: ConsultationMessageRow[] = [
        row({
          id: 71,
          consultantId: CONSULTANT_ID,
          clientId: OTHER_CLIENT_ID,
          clientName: '홍길동',
          senderType: 'SYSTEM',
          senderId: 0,
          receiverId: OTHER_CLIENT_ID,
          content: '입금이 확인되었습니다.',
          sentAt: '2026-06-13T10:00:00Z',
        }),
      ];

      const result = buildConversationsFromRows(rows, 'consultant', CONSULTANT_ID, '');

      expect(result).toHaveLength(1);
      expect(result[0]!.partnerId).toBe(OTHER_CLIENT_ID);
      expect(result[0]!.partnerName).toBe('홍길동');
      expect(result[0]!.lastMessageSenderType).toBe('SYSTEM');
    });
  });
});
