# 매칭-스케줄 통합 화면 테스트 계획 (MATCHING_SCHEDULE_INTEGRATION_TEST_PLAN)

## 📋 1. 개요
- **목적**: 새롭게 구현된 '매칭-스케줄 통합 원스톱 화면'의 핵심 기능 점검 및 품질 보증
- **테스트 대상**:
  - UI 컴포넌트: `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`
  - 상태 관리: `frontend/src/store/useMatchingScheduleStore.js`
- **주요 검증 항목**:
  1. 드래그 앤 드롭(Drag & Drop)을 통한 이벤트 생성
  2. 상태 스토어(Zustand)의 낙관적 업데이트 성공 및 롤백 로직
  3. 예약 모달의 정상 노출 및 선택된 이벤트 데이터 바인딩

## 🧪 2. 테스트 전략 (테스트 피라미드 기반)

| 테스트 유형 | 검증 대상 | 도구 | 비중 |
|------------|----------|------|------|
| **단위 (Unit)** | `useMatchingScheduleStore`의 상태 변경 로직, UI 컴포넌트의 렌더링 | Jest | 70% |
| **통합 (Integration)** | Store 상태와 UI 컴포넌트(`IntegratedMatchingSchedule`, `UnifiedModal`)의 상호작용 | RTL (React Testing Library) | 20% |
| **E2E** | 사용자의 실제 드래그 앤 드롭 동작 및 전체 스케줄링 시나리오 | Playwright | 10% |

## 📝 3. 주요 테스트 시나리오 및 체크리스트

### 📍 시나리오 1: 드래그 앤 드롭을 통한 이벤트 생성
**목표**: 대기자 목록의 항목을 캘린더 영역으로 드래그 앤 드롭했을 때, 이벤트가 정상적으로 생성 및 수신되는지 검증

- [ ] **[UI]** 대기자 목록(`waitingList`)이 렌더링되며, 데이터(`data-id`, `data-name`, `data-type`)가 HTML 속성에 올바르게 바인딩되는가?
- [ ] **[UI]** 대기자가 없을 때 "대기자가 없습니다." 문구가 노출되는가?
- [ ] **[Interaction]** `FullCalendar`에 대기자 요소를 드롭했을 때 `handleEventReceive` 핸들러가 정상적으로 트리거되는가?
- [ ] **[Interaction]** 드롭 시, 생성된 임시 이벤트 객체에 `waitingId`, `name`, `type` 등의 `extendedProps`가 포함되어 전달되는가?

### 📍 시나리오 2: 낙관적 업데이트의 성공과 롤백 (Zustand Store)
**목표**: 이벤트 드롭 시 대기열에서 즉시 사라지고 캘린더에 임시로 노출(낙관적 업데이트)되며, 취소/실패 시 원상 복구(롤백)되는지 검증

- [ ] **[Store]** `moveToCalendar` 호출 시, `waitingList`에서 해당 항목이 즉시 제거되는가?
- [ ] **[Store]** `moveToCalendar` 호출 시, `calendarEvents`에 임시 이벤트가 추가되는가?
- [ ] **[Store]** 저장 완료 시 `confirmEvent`가 호출되어 임시 이벤트의 ID가 실제 확정 ID로 업데이트되는가?
- [ ] **[Store]** 저장 취소(또는 실패) 시 `rollbackEvent`가 호출되어 `calendarEvents`에서 제거되고, `waitingList`에 원래 항목이 다시 추가(복구)되는가?
- [ ] **[Integration]** 롤백 시, UI의 대기자 목록 영역에 롤백된 내담자가 다시 렌더링되는가?

### 📍 시나리오 3: 예약 모달 노출 및 데이터 바인딩
**목표**: 이벤트 드롭 직후 확인 모달이 노출되며, 드롭한 내담자 정보가 모달 내 입력 폼에 정확히 바인딩되는지 검증

- [ ] **[UI]** 이벤트 드롭(`handleEventReceive`) 완료 시, `UnifiedModal` 컴포넌트의 `isOpen` 상태가 `true`로 변경되는가?
- [ ] **[Data]** 모달 내부의 폼에 선택된 내담자 이름(`selectedEvent.extendedProps.name`), 상담 종류(`type`), 시작 시간(`start`)이 올바르게 출력되는가?
- [ ] **[Interaction]** 모달에서 '취소' 버튼 클릭 시 `handleModalCancel`이 호출되어 롤백 로직이 실행되고 모달이 닫히는가?
- [ ] **[Interaction]** 모달에서 '배정 저장' 버튼 클릭 시 `handleModalSave`가 호출되어 확정 로직이 실행되고 모달이 닫히는가?

---

## 💻 4. 테스트 코드 구조 제안 (초안)

### 4.1. React Testing Library (단위/통합 테스트 구조)
위치: `frontend/src/components/admin/mapping-management/__tests__/IntegratedMatchingSchedule.test.js`

```javascript
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import IntegratedMatchingSchedule from '../IntegratedMatchingSchedule';
import { useMatchingScheduleStore } from '../../../../store/useMatchingScheduleStore';

// Zustand Store Mocking
jest.mock('../../../../store/useMatchingScheduleStore', () => ({
  useMatchingScheduleStore: jest.fn(),
}));

describe('IntegratedMatchingSchedule 컴포넌트', () => {
  let mockStore;

  beforeEach(() => {
    mockStore = {
      waitingList: [
        { id: 'w1', name: '김내담', type: '개인상담', preferredTime: '평일 오후', status: 'WAITING' }
      ],
      calendarEvents: [],
      fetchInitialData: jest.fn(),
      moveToCalendar: jest.fn(),
      confirmEvent: jest.fn(),
      rollbackEvent: jest.fn()
    };
    useMatchingScheduleStore.mockReturnValue(mockStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('대기자 목록이 정상적으로 렌더링되어야 한다', () => {
    render(<IntegratedMatchingSchedule />);
    expect(screen.getByText('김내담')).toBeInTheDocument();
    expect(screen.getByText('개인상담')).toBeInTheDocument();
  });

  test('대기자가 없을 때 안내 문구가 노출되어야 한다', () => {
    useMatchingScheduleStore.mockReturnValue({ ...mockStore, waitingList: [] });
    render(<IntegratedMatchingSchedule />);
    expect(screen.getByText('대기자가 없습니다.')).toBeInTheDocument();
  });

  test('모달에서 취소 버튼 클릭 시 롤백 함수가 호출되어야 한다', async () => {
    // Note: 모달 노출 등 통합 시나리오는 E2E 또는 Store 직접 상태 주입을 통해 검증합니다.
    // 본 테스트는 단위 테스트의 구조를 보여줍니다.
  });
});
```

### 4.2. Playwright (E2E 테스트 구조)
위치: `tests/e2e/tests/admin/matching-schedule.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('매칭-스케줄 통합 화면 E2E 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    // 관리자 로그인 후 매칭-스케줄 페이지로 이동 (테스트 환경에 맞게 조정 필요)
    await page.goto('/admin/matching-schedule');
  });

  test('드래그 앤 드롭 배정 및 낙관적 업데이트 롤백 시나리오', async ({ page }) => {
    // 1. 대기자 목록 확인
    const waitingItem = page.locator('.integrated-schedule__item').first();
    await expect(waitingItem).toBeVisible();
    const clientName = await waitingItem.getAttribute('data-name');

    // 2. 캘린더 영역으로 드래그 앤 드롭
    // (FullCalendar의 특정 시간 슬롯 좌표로 드래그)
    const calendarSlot = page.locator('.fc-timegrid-slot[data-time="10:00:00"]');
    await waitingItem.dragTo(calendarSlot);

    // 3. 낙관적 업데이트 확인: 대기자 목록에서 사라짐
    await expect(page.locator(`.integrated-schedule__item[data-name="${clientName}"]`)).not.toBeVisible();

    // 4. 모달 노출 및 데이터 바인딩 확인
    const modal = page.locator('.unified-modal'); // UnifiedModal 선택자 (환경에 맞게 수정)
    await expect(modal).toBeVisible();
    await expect(page.locator('#schedule-client-name')).toHaveValue(clientName as string);

    // 5. 모달에서 취소 (롤백 로직 검증)
    await page.getByRole('button', { name: '취소' }).click();

    // 6. 모달 닫힘 및 롤백 확인: 대기자 목록에 다시 나타남
    await expect(modal).not.toBeVisible();
    await expect(page.locator(`.integrated-schedule__item[data-name="${clientName}"]`)).toBeVisible();
  });
});
```
