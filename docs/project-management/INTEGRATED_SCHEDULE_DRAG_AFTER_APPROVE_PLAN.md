# 통합 스케줄 사이드바 드래그 동작 개선 기획

> **목표**: 승인 대기(DEPOSIT_PENDING) 매칭이 결제·승인 완료 후 새로고침 없이 즉시 드래그 가능하도록 수정  
> **날짜**: 2025-03-14

---

## 1. 요구·배경

- **현상**: DEPOSIT_PENDING 매칭이 승인·입금 확인 완료 후에도 **페이지 새로고침 전까지 드래그 불가**
- **요구**: 승인·결제·입금 확인 완료 시 해당 카드가 **즉시 드래그 가능**해져야 함

---

## 2. 범위

| 포함 | 제외 |
|------|------|
| IntegratedMatchingSchedule 사이드바 매칭 카드 드래그 | 다른 화면의 드래그·캘린더 |
| approve, deposit confirm, payment confirm 콜백 후 Draggable 재바인딩 | API·백엔드 변경 |
| SCHEDULABLE_STATUSES, loadMappings, filteredMappings, Draggable useEffect 의존성 | |

---

## 3. 파악 결과 요약

### 3.1 스케줄 등록 가능 상태 (SCHEDULABLE_STATUSES)

```29:31:frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js
const SCHEDULABLE_STATUSES = new Set(['PAYMENT_CONFIRMED', 'DEPOSIT_PENDING', 'ACTIVE']);
const canScheduleForMapping = (mapping) =>
  mapping?.status && SCHEDULABLE_STATUSES.has(mapping.status);
```

- `PAYMENT_CONFIRMED`, `DEPOSIT_PENDING`, `ACTIVE` 세 상태일 때 드래그 가능
- `canScheduleForMapping(mapping)`가 true면 `<li>`에 `fc-event` 클래스 + `data-event` 부여

### 3.2 승인·입금·결제 완료 API 호출 위치

| 처리 | 핸들러 | API | 콜백 |
|------|--------|-----|------|
| 승인 | `handleApprove` | POST `/api/v1/admin/mappings/{id}/approve` | `loadMappings()` |
| 입금 확인 | `handleDepositConfirmed` | (MappingDepositModal) confirm-deposit | `loadMappings()` |
| 결제 확인 | `handlePaymentConfirmed` | (MappingPaymentModal) | `loadMappings()` |

모두 `loadMappings()`를 호출해 `mappings` 상태를 갱신한다.

### 3.3 Draggable 바인딩 및 의존성

```144:151:frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js
  useEffect(() => {
    if (!sidebarListRef.current || filteredMappings.length === 0) return;
    const draggable = new Draggable(sidebarListRef.current, {
      itemSelector: '.integrated-schedule__card.fc-event'
    });
    return () => draggable.destroy();
  }, [viewFilter, filteredMappings.length, scheduleableCount]);
```

**원인**: useEffect 의존성이 `[viewFilter, filteredMappings.length, scheduleableCount]`이다.

- DEPOSIT_PENDING → ACTIVE로 바뀌어도:
  - `filteredMappings.length` 변화 없음
  - `scheduleableCount` 변화 없음 (둘 다 SCHEDULABLE에 포함)
- 따라서 useEffect가 **재실행되지 않음**
- React는 `mappings` 갱신으로 리렌더링하며 **새 DOM 노드**를 만듦
- 기존 Draggable은 **이미 unmount된 DOM**에 바인딩된 상태
- 새로 생긴 `<li.fc-event>`에는 Draggable이 연결되지 않아 **드래그 불가**

### 3.4 수정 방향

- Draggable useEffect가 **mappings 데이터 갱신 시에도** 실행되도록 의존성 보강
- 예: `mappings` 또는 `mappings` 변화를 반영하는 값(예: 스케줄 가능 매칭 ID+상태 해시)을 의존성에 추가

---

## 4. 의존성·순서

- 선행: 없음 (프론트엔드만 수정)
- 영향: IntegratedMatchingSchedule.js

---

## 5. 리스크·제약

- `mappings`를 의존성에 넣을 경우, 대량 매칭에서 불필요한 Draggable 재생성 가능성은 있으나, loadMappings 완료 시점에 한 번만 실행되므로 실사용상 문제는 적을 것으로 예상

---

## 6. 분배실행

| Phase | 담당 | 전달할 태스크 | 병렬 |
|-------|------|---------------|------|
| **Phase 1** | **core-coder** | 아래 [core-coder 실행 태스크](#7-core-coder-실행-태스크) 참조 | — |

---

## 7. core-coder 실행 태스크

`docs/project-management/INTEGRATED_SCHEDULE_DRAG_AFTER_APPROVE_TASK.md` 참조.
