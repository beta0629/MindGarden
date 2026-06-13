/**
 * 메시지 목록(대화 스레드) 집계기.
 * `consultation_messages` 행 배열을 상대방 단위로 집계해 대화 목록을 만든다.
 * useMessages 훅에서 추출 — 순수 함수이므로 hook·의존성 없이 단위 테스트 가능.
 *
 * @author MindGarden
 * @since 2026-06-13
 */
import { isUnreadMessageForReceiver } from '@/utils/consultationMessageUnread';
import { toDisplayString, toSafeNumber } from './safeDisplay';

/** 백엔드 ConsultationMessage 목록 행(부분 필드) */
export interface ConsultationMessageRow {
  id?: unknown;
  title?: unknown;
  content?: unknown;
  senderType?: unknown;
  senderId?: unknown;
  receiverId?: unknown;
  clientId?: unknown;
  consultantId?: unknown;
  clientName?: unknown;
  messageType?: unknown;
  status?: unknown;
  isRead?: unknown;
  readAt?: unknown;
  repliedAt?: unknown;
  sentAt?: unknown;
  createdAt?: unknown;
}

export interface Conversation {
  /** 스레드 식별자 = 상대방 사용자 ID(내담자: 상담사 ID / 상담사: 내담자 ID) */
  id: number;
  partnerId: number;
  partnerName: string;
  partnerProfileImageUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  /** 수신·미읽음 메시지 id — 미리보기 시 일괄 읽음 처리용 */
  unreadMessageIds: number[];
  /**
   * 마지막 메시지의 senderType (CONSULTANT / CLIENT / SYSTEM 등).
   * UI에서 시스템 자동 알림 발신자명을 별도 라벨로 표시할 때 활용.
   */
  lastMessageSenderType?: string;
}

export const CLIENT_PARTNER_LABEL = '상담사';
export const DEFAULT_PARTNER_NAME = '내담자';

/**
 * 시스템 자동 알림(senderType=SYSTEM) 발신자 표시 라벨.
 * BE 측 자동 알림(입금 확인, 결제 완료, 매칭 승인 등)은 senderType='SYSTEM'으로 저장되며,
 * 메시지 목록에서 '상담사'가 아닌 '마인드가든 알림'으로 표시해야 한다.
 * 2026-06-13 UX 정정 — 내담자 메시지 목록의 자동 알림 발신자명을 명확히 한다.
 */
export const SYSTEM_PARTNER_LABEL = '마인드가든 알림';
export const SYSTEM_SENDER_TYPE = 'SYSTEM';

/** 내담자 목록에서 스레드 키 = 상담사 사용자 ID */
export function consultantPartnerId(row: ConsultationMessageRow): number {
  const cid = toSafeNumber(row.consultantId, 0);
  if (cid > 0) {
    return cid;
  }
  const st = String(row.senderType ?? '').toUpperCase();
  if (st === 'CONSULTANT') {
    return toSafeNumber(row.senderId, 0);
  }
  return toSafeNumber(row.receiverId, 0);
}

/**
 * 목록 API에서 받은 메시지 행을 상대방 단위 대화 목록으로 집계한다.
 *
 * 2026-06-13 UX 정정 — 마지막 메시지의 senderType이 'SYSTEM' 인 경우,
 * 내담자(role=client) 측 partnerName 을 '마인드가든 알림' 으로 정정 표시한다.
 *
 * @param rows 메시지 행(시간 내림차순 권장)
 * @param role 현재 사용자 역할
 * @param selfId 현재 사용자 ID
 * @param searchQuery 이름·미리보기 필터(소문자 비교)
 */
export function buildConversationsFromRows(
  rows: ConsultationMessageRow[],
  role: 'client' | 'consultant',
  selfId: number,
  searchQuery: string,
): Conversation[] {
  const q = searchQuery.trim().toLowerCase();
  const byPartner = new Map<
    number,
    {
      partnerName: string;
      lastMessage: string;
      lastMessageAt: string;
      unread: number;
      unreadMessageIds: number[];
      lastMessageSenderType: string;
    }
  >();

  for (const row of rows) {
    const partnerId =
      role === 'consultant' ? toSafeNumber(row.clientId, 0) : consultantPartnerId(row);
    if (partnerId <= 0) {
      continue;
    }

    let partnerName =
      role === 'consultant'
        ? toDisplayString(row.clientName, DEFAULT_PARTNER_NAME)
        : CLIENT_PARTNER_LABEL;

    if (role === 'consultant' && partnerName === DEFAULT_PARTNER_NAME) {
      partnerName = toDisplayString(row.clientName, DEFAULT_PARTNER_NAME);
    }

    const sentRaw = row.sentAt ?? row.createdAt;
    const lastAt = typeof sentRaw === 'string' ? sentRaw : toDisplayString(sentRaw, '');
    const preview = toDisplayString(row.content, toDisplayString(row.title, ''));
    const senderType = String(row.senderType ?? '').toUpperCase();

    const receiverId = toSafeNumber(row.receiverId, 0);
    const unreadInc = isUnreadMessageForReceiver(row.isRead, receiverId, selfId) ? 1 : 0;
    const messageId = toSafeNumber(row.id, 0);

    const existing = byPartner.get(partnerId);
    if (!existing) {
      byPartner.set(partnerId, {
        partnerName,
        lastMessage: preview,
        lastMessageAt: lastAt,
        unread: unreadInc,
        unreadMessageIds: unreadInc > 0 && messageId > 0 ? [messageId] : [],
        lastMessageSenderType: senderType,
      });
    } else {
      existing.unread += unreadInc;
      if (unreadInc > 0 && messageId > 0 && !existing.unreadMessageIds.includes(messageId)) {
        existing.unreadMessageIds.push(messageId);
      }
      const prevTime = new Date(existing.lastMessageAt).getTime();
      const curTime = new Date(lastAt).getTime();
      if (!Number.isNaN(curTime) && (Number.isNaN(prevTime) || curTime >= prevTime)) {
        existing.lastMessageAt = lastAt;
        existing.lastMessage = preview;
        existing.lastMessageSenderType = senderType;
        if (role === 'consultant' && partnerName !== DEFAULT_PARTNER_NAME) {
          existing.partnerName = partnerName;
        }
      }
    }
  }

  const list: Conversation[] = [];
  byPartner.forEach((v, partnerId) => {
    /**
     * 자동 알림(senderType=SYSTEM) 발신자 라벨 정정.
     * 내담자(role=client) 메시지 목록에서 최신 메시지가 SYSTEM 발신이면
     * '상담사' 가 아닌 '마인드가든 알림' 으로 표시해 사용자에게 자동 알림임을 명확히 한다.
     * 상담사(role=consultant) 측은 실제 내담자 이름이 표시되므로 영향 없음.
     */
    const displayPartnerName =
      role === 'client' && v.lastMessageSenderType === SYSTEM_SENDER_TYPE
        ? SYSTEM_PARTNER_LABEL
        : v.partnerName;
    if (q !== '') {
      const hay = `${displayPartnerName} ${v.lastMessage}`.toLowerCase();
      if (!hay.includes(q)) {
        return;
      }
    }
    list.push({
      id: partnerId,
      partnerId,
      partnerName: displayPartnerName,
      lastMessage: v.lastMessage,
      lastMessageAt: v.lastMessageAt,
      unreadCount: v.unread,
      unreadMessageIds: v.unreadMessageIds,
      lastMessageSenderType: v.lastMessageSenderType,
    });
  });

  list.sort((a, b) => {
    const ta = new Date(a.lastMessageAt).getTime();
    const tb = new Date(b.lastMessageAt).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });

  return list;
}
