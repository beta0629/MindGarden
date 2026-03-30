# 통합 스케줄 드래그 즉시 활성화 — core-coder 실행 태스크

> **목표**: 승인·입금·결제 완료 후 새로고침 없이 매칭 카드가 즉시 드래그 가능하도록 수정  
> **대상**: `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`

---

## 1. 배경·원인

- `useEffect`의 의존성 `[viewFilter, filteredMappings.length, scheduleableCount]`가 `DEPOSIT_PENDING → ACTIVE` 시 변하지 않음
- `length`, `scheduleableCount` 동일 → useEffect 미실행 → Draggable 미재생성
- React는 새 DOM 노드를 만들지만, 기존 Draggable은 사라진 DOM에 바인딩된 상태라 새 노드에 드래그가 연결되지 않음

---

## 2. 수정 요구사항

### 2.1 필수

1. **Draggable useEffect 의존성 수정**
   - `mappings` 또는 `mappings` 갱신을 반영하는 값이 변경될 때마다 Draggable을 재생성
   - `handleApprove`, `handleDepositConfirmed`, `handlePaymentConfirmed` → `loadMappings()` → `setMappings` 호출 시 이 값이 바뀌어야 함

2. **권장 구현 방식**
   - `mappings`를 의존성에 추가: `[viewFilter, filteredMappings.length, scheduleableCount, mappings]`
   - 또는 `mappings.map(m => `${m.id}:${m.status}`).join(',')` 같은 해시를 추가하여 `mappings` 내용 변경 시 effect 재실행되도록 함

### 2.2 완료 기준

- [ ] 승인(approve) 완료 직후 해당 카드 드래그 가능
- [ ] 입금 확인(confirm-deposit) 완료 직후 해당 카드 드래그 가능
- [ ] 결제 확인(payment confirmed) 완료 직후 해당 카드 드래그 가능
- [ ] 페이지 새로고침 없이 위 동작이 수행됨

---

## 3. 참조 파일·위치

| 파일 | 내용 |
|------|------|
| `IntegratedMatchingSchedule.js` L144-151 | Draggable useEffect |
| `IntegratedMatchingSchedule.js` L83-101 | loadMappings |
| `IntegratedMatchingSchedule.js` L182-200 | handleApprove, handleDepositConfirmed |

---

## 4. 적용 스킬

- `/core-solution-frontend`
- `/core-solution-atomic-design`

---

## 5. 체크리스트

- [ ] useEffect 의존성에 `mappings` 또는 동등한 갱신 감지 값 추가
- [ ] 승인 후 드래그 가능 여부 수동 확인
- [ ] 입금 확인 후 드래그 가능 여부 수동 확인
- [ ] 기존 필터·보기 전환 동작에 영향 없음 확인
