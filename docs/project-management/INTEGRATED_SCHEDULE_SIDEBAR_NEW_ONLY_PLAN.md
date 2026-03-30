# 통합 스케줄 사이드바 — 신규 매칭중만 표시 기획서

## 1. 제목·목표

**제목**: 통합 스케줄 사이드바 매칭 목록 — 신규 매칭중만 표시, 기본 필터=신규  
**목표**: `.integrated-schedule__sidebar` 매칭 목록에서 **회기 소진·종료됨** 매칭을 기본 숨기고, **신규 매칭중** 건만 기본 표시되도록 변경한다.

---

## 2. 탐색 결과 요약

### 2.1 컴포넌트·DOM 구조

| 항목 | 내용 |
|------|------|
| **컴포넌트** | `IntegratedMatchingSchedule` |
| **파일** | `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js` |
| **DOM 경로** | `integrated-schedule` > `integrated-schedule__content` > `integrated-schedule__sidebar` > `integrated-schedule__list` |
| **목록 렌더** | L283~336: `ul.integrated-schedule__list` 내부 `filteredMappings.map()` → `MappingScheduleCard` |

### 2.2 데이터 흐름

```
loadMappings() → mappings
    ↓
viewFilter 적용 → byView (new | remaining | all)
    ↓
정렬 → sortedByView
    ↓
statusFilter 적용 → filteredMappings
    ↓
integrated-schedule__list에 렌더
```

- **viewFilter** (L72, 기본 `VIEW_FILTER_NEW`): 신규 매칭 | 회기 남은 매칭 | 전체  
  - 신규: createdAt 7일 이내 **또는** PENDING_PAYMENT/DEPOSIT_PENDING
- **statusFilter** (L73, 기본 `''`): 전체 | 결제 대기 | 결제 확인 | ... | 종료됨 | 회기 소진

### 2.3 상태 필터 로직 위치

| 위치 | 내용 |
|------|------|
| **L50~60** | `STATUS_FILTER_OPTIONS` 정의 — `value: ''`(전체)가 첫 번째 |
| **L73** | `statusFilter` 초기값 `''` → 기본 "전체" |
| **L121~123** | `filteredMappings = statusFilter ? sortedByView.filter(m => m.status === statusFilter) : sortedByView` |
| **L126** | `getStatusCount(value)` — 상태별 건수 |

**제외 대상 상태**: `SESSIONS_EXHAUSTED`, `TERMINATED`  
**포함 대상(신규 매칭중)**: `PENDING_PAYMENT`, `PAYMENT_CONFIRMED`, `DEPOSIT_PENDING`, `ACTIVE`, `INACTIVE`, `SUSPENDED`

---

## 3. 범위

| 포함 | 제외 |
|------|------|
| IntegratedMatchingSchedule.js 내 status 필터 로직·기본값 | 다른 페이지·다른 컴포넌트 |
| 상태 옵션 정의·순서·라벨 | API·백엔드 |
| 필터 UI(버튼 라벨·접근성) — 변경 시만 | INTEGRATED_SCHEDULE_FILTER_UI_SPEC 전체 재작성 |

---

## 4. 의존성·순서

- 선행 작업: 없음
- 참조 문서: `docs/design-system/v2/INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md`
- Phase 순서: Phase 1(필요 시) → Phase 2

---

## 5. 구현 방향 (요구 반영)

1. **상태 기본 필터 = 신규 매칭중**  
   - statusFilter 기본값을 "신규 매칭중"에 해당하는 논리적 값으로 설정  
   - 해당 옵션 선택 시 `SESSIONS_EXHAUSTED`, `TERMINATED` 제외

2. **STATUS_FILTER_OPTIONS 구성**  
   - "신규 매칭중" 옵션 추가 (예: value `'ongoing'` 또는 `'NEW_ACTIVE'`)  
   - "전체"는 유지하되, 기본 선택이 "신규 매칭중"이 되도록

3. **필터 로직**  
   - `statusFilter === 'ongoing'`(등)일 때: `m.status !== 'SESSIONS_EXHAUSTED' && m.status !== 'TERMINATED'`  
   - `getStatusCount`도 동일 기준 적용

---

## 6. Phase 및 분배실행

### Phase 1: UI 스펙 검토 (선택)

**담당**: core-designer  
**목적**: 상태 필터에 "신규 매칭중" 옵션 추가 시, 버튼 순서·레이아웃·접근성 확인  
**조건**: 기존 `STATUS_FILTER_OPTIONS`에 새 옵션이 들어가므로, 첫 옵션(기본)이 "신규 매칭중"이 될 때 스펙 정합성 검토 필요  
**호출 시 전달 프롬프트**:

> `docs/project-management/INTEGRATED_SCHEDULE_SIDEBAR_NEW_ONLY_PLAN.md`를 참고하여, 통합 스케줄 사이드바 상태 필터에 **"신규 매칭중"** 옵션을 기본값으로 추가하는 변경에 대해 검토해 주세요.  
> - 현재: 첫 옵션 "전체", 기본 선택 = 전체  
> - 변경 후: 첫 옵션 "신규 매칭중"(회기 소진·종료됨 제외), 기본 선택 = 신규 매칭중  
> `docs/design-system/v2/INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md` §4.3, §5와의 정합성, 버튼 순서·라벨·접근성(aria-label) 변경이 필요한지 스펙 형태로 정리해 주세요. 코드 작성 없음.

**적용 스킬**: /core-solution-design-handoff

---

### Phase 2: 구현

**담당**: core-coder  
**목적**: statusFilter 로직·기본값·옵션 적용  
**호출 시 전달 프롬프트**:

> `docs/project-management/INTEGRATED_SCHEDULE_SIDEBAR_NEW_ONLY_PLAN.md`를 참고하여, `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`의 매칭 목록 필터를 다음과 같이 수정해 주세요.  
> 1. **STATUS_FILTER_OPTIONS**: "신규 매칭중" 옵션 추가 (value 예: `'ongoing'`), 첫 번째에 배치. "전체"는 두 번째로 이동.  
> 2. **statusFilter 기본값**: `''` → `'ongoing'`으로 변경 (기본 표시 = 신규 매칭중).  
> 3. **filteredMappings 로직**: `statusFilter === 'ongoing'`일 때 `SESSIONS_EXHAUSTED`, `TERMINATED` 제외.  
> 4. **getStatusCount**: `value === 'ongoing'`일 때 동일 기준으로 건수 계산.  
> `/core-solution-frontend`, `docs/design-system/v2/INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md` 참조. Phase 1(core-designer) 산출물이 있으면 반영.

**적용 스킬**: /core-solution-frontend, /core-solution-atomic-design

---

## 7. 리스크·제약

- `INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md`의 "상태" 버튼 라벨이 기존과 달라질 수 있음 — 스펙 업데이트 필요 시 generalPurpose로 문서 수정 의뢰
- 다른 화면에서 동일 매칭 상태 용어를 사용 중이면 용어 일관성 유지

---

## 8. 완료 기준·체크리스트

- [ ] 최초 로드 시 매칭 목록에 **신규 매칭중**만 표시됨 (회기 소진·종료됨 제외)
- [ ] "전체" 선택 시 기존과 동일하게 모든 상태 표시
- [ ] 상태 버튼 건수(getStatusCount)가 올바르게 표시됨
- [ ] aria-label 등 접근성 유지

---

**문서 버전**: 1.0  
**작성일**: 2025-03-14  
**참조**: `IntegratedMatchingSchedule.js`, `INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md`
