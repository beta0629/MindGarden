import { create } from 'zustand';

// Mock data
const MOCK_WAITING_LIST = [
  { id: 'w1', name: '김내담', type: '개인상담', preferredTime: '평일 오후', status: 'WAITING' },
  { id: 'w2', name: '이부부', type: '부부상담', preferredTime: '주말 오전', status: 'WAITING' },
  { id: 'w3', name: '박가족', type: '가족상담', preferredTime: '평일 저녁', status: 'WAITING' },
  { id: 'w4', name: '최학생', type: '개인상담', preferredTime: '주말 오후', status: 'WAITING' }
];

const MOCK_EVENTS = [
  { id: 'e1', title: '개인상담 - 정기', start: `${new Date().toISOString().split('T')[0]}T10:00:00`, end: `${new Date().toISOString().split('T')[0]}T11:00:00`, resourceId: 'c1' }
];

export const useMatchingScheduleStore = create((set) => ({
  waitingList: [],
  calendarEvents: [],
  
  // 초기화 (API Mocking)
  fetchInitialData: () => {
    set({
      waitingList: MOCK_WAITING_LIST,
      calendarEvents: MOCK_EVENTS
    });
  },

  // 대기자 리스트에서 캘린더로 이동 (낙관적 업데이트)
  moveToCalendar: (waitingId, temporaryEvent) => {
    set((state) => {
      const targetWaiting = state.waitingList.find(w => w.id === waitingId);
      if (!targetWaiting) return state;

      return {
        // 대기자 목록에서 제거
        waitingList: state.waitingList.filter(w => w.id !== waitingId),
        // 캘린더 이벤트로 추가 (임시)
        calendarEvents: [...state.calendarEvents, temporaryEvent]
      };
    });
  },

  // 저장 성공 시 확정
  confirmEvent: (tempEventId, confirmedEvent) => {
    set((state) => ({
      calendarEvents: state.calendarEvents.map(e => 
        e.id === tempEventId ? { ...confirmedEvent, id: confirmedEvent.id } : e
      )
    }));
  },

  // 저장 실패 또는 취소 시 롤백
  rollbackEvent: (tempEventId, originalWaitingItem) => {
    set((state) => ({
      // 캘린더에서 임시 이벤트 제거
      calendarEvents: state.calendarEvents.filter(e => e.id !== tempEventId),
      // 다시 대기자 목록에 추가 (원래 위치는 아니지만 맨 뒤로 복구)
      waitingList: [...state.waitingList, originalWaitingItem]
    }));
  }
}));
