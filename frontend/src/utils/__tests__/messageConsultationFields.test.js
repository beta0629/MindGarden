/**
 * 메시지 metadata → 관련 상담·남은 회기 필드
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

import { parseMessageConsultationFields } from '../messageConsultationFields';

describe('parseMessageConsultationFields', () => {
  test('완성된 relatedConsultation·remainingSessionsText 를 그대로 쓴다', () => {
    expect(parseMessageConsultationFields({
      metadata: {
        relatedConsultation: '10월 23일 (금) 오후 3:00 · 대면',
        remainingSessionsText: '10회기 패키지 중 3회 남음'
      }
    })).toEqual({
      relatedConsultation: '10월 23일 (금) 오후 3:00 · 대면',
      remainingSessions: '10회기 패키지 중 3회 남음'
    });
  });

  test('date/time/type · remaining/total 로 조합한다', () => {
    expect(parseMessageConsultationFields({
      metadata: JSON.stringify({
        scheduleDate: '10월 23일 (금)',
        scheduleTime: '오후 3:00',
        consultationType: '대면',
        totalSessions: 10,
        remainingSessions: 3
      })
    })).toEqual({
      relatedConsultation: '10월 23일 (금) 오후 3:00 · 대면',
      remainingSessions: '10회기 패키지 중 3회 남음'
    });
  });

  test('metadata 없으면 빈 값', () => {
    expect(parseMessageConsultationFields({ senderName: '김' })).toEqual({
      relatedConsultation: '',
      remainingSessions: ''
    });
  });
});
