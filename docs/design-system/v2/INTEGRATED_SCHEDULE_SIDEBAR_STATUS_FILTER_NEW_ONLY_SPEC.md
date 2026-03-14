# 통합 스케줄 사이드바 — 상태 필터 "신규 매칭중" 옵션 추가 스펙

## 1. 개요

- **참조 기획**: `docs/project-management/INTEGRATED_SCHEDULE_SIDEBAR_NEW_ONLY_PLAN.md`
- **대상**: 통합 스케줄 좌측 사이드바 매칭 목록의 **상태 필터** 버튼 그룹
- **목적**: 상태 필터에 "신규 매칭중" 옵션을 **첫 번째·기본값**으로 추가하여, 회기 소진·종료됨을 제외한 매칭만 기본 표시되도록 한다.
- **코드 작성 없음** — UI 스펙 정리만. 구현은 core-coder가 수행.

---

## 2. 변경 요약

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 첫 번째 옵션 | 전체 | **신규 매칭중** |
| 기본 선택 | 전체 | **신규 매칭중** |
| "전체" 위치 | 1번 | 2번 |
| "신규 매칭중" | 없음 | 1번, value `ongoing` |

---

## 3. 버튼 순서

상태 필터 버튼의 **표시 순서**는 아래와 같다. 구현 시 `STATUS_FILTER_OPTIONS` 배열 순서와 일치해야 한다.

| 순서 | value | label | 비고 |
|------|-------|-------|------|
| 1 | `ongoing` | **신규 매칭중** | 기본 선택. SESSIONS_EXHAUSTED, TERMINATED 제외 |
| 2 | `''` | 전체 | 기존 동작 유지 |
| 3 | `PENDING_PAYMENT` | 결제 대기 | |
| 4 | `PAYMENT_CONFIRMED` | 결제 확인 | |
| 5 | `DEPOSIT_PENDING` | 승인 대기 | |
| 6 | `ACTIVE` | 활성 | |
| 7 | `INACTIVE` | 비활성 | |
| 8 | `TERMINATED` | 종료됨 | |
| 9 | `SESSIONS_EXHAUSTED` | 회기 소진 | |
| 10 | `SUSPENDED` | 일시정지 | |

---

## 4. 라벨

### 4.1 신규 옵션 라벨

- **표시 텍스트**: `신규 매칭중`
- **의미**: 회기 소진·종료됨을 제외한 매칭만 표시.  
  포함 상태: PENDING_PAYMENT, PAYMENT_CONFIRMED, DEPOSIT_PENDING, ACTIVE, INACTIVE, SUSPENDED

### 4.2 기존 라벨

- 전체, 결제 대기, 결제 확인, 승인 대기, 활성, 비활성, 종료됨, 회기 소진, 일시정지 — 변경 없음.

---

## 5. 접근성 (aria-label)

### 5.1 필드셋

- **fieldset(상태)**  
  - `aria-label="상태별 필터"` — 기존 유지.

### 5.2 각 상태 버튼

- **형식**: `aria-label="${라벨} (${count}건)"`
- **신규 매칭중**: `aria-label="신규 매칭중 (N건)"`  
  - N = `value === 'ongoing'`일 때 `byView` 중 SESSIONS_EXHAUSTED·TERMINATED 제외 건수.
- **전체**: `aria-label="전체 (N건)"`
- **나머지**: 기존과 동일 (`aria-label="결제 대기 (N건)"` 등).

### 5.3 aria-pressed

- 선택된 버튼: `aria-pressed="true"`
- 미선택 버튼: `aria-pressed="false"`
- 기존 동작 유지.

---

## 6. INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md 정합성

### 6.1 §4.3 업데이트 필요

- **현재**: "버튼 라벨: 전체, 결제 대기, 결제 확인, 승인 대기, 활성, 비활성, 종료됨, 회기 소진, 일시정지 — 기존 유지"
- **변경**:  
  - **버튼 라벨**: **신규 매칭중**(1번·기본), 전체(2번), 결제 대기, 결제 확인, 승인 대기, 활성, 비활성, 종료됨, 회기 소진, 일시정지  
  - **기본 선택**: 신규 매칭중 (`value: 'ongoing'`)

### 6.2 §5 정합성

- 클래스·토큰·레이아웃: **변경 없음**.  
  `integrated-schedule__status-btn`, `integrated-schedule__status-btn--selected` 등 기존 스펙 유지.

### 6.3 §6.1 정합성

- 상태 fieldset `aria-label="상태별 필터"`: 유지.
- 각 버튼 `aria-label="${라벨} (${count}건)"`: 유지하되, **"신규 매칭중"** 라벨 추가 반영.

---

## 7. 구현 시 체크리스트

- [ ] `STATUS_FILTER_OPTIONS` 첫 번째에 `{ value: 'ongoing', label: '신규 매칭중' }` 추가.
- [ ] "전체"를 두 번째 옵션으로 이동 (`value: ''`).
- [ ] `statusFilter` 기본값: `''` → `'ongoing'`.
- [ ] `value === 'ongoing'`일 때 SESSIONS_EXHAUSTED, TERMINATED 제외 필터 적용.
- [ ] `getStatusCount('ongoing')`: 제외 기준으로 건수 계산.
- [ ] 각 버튼 `aria-label`에 "신규 매칭중 (N건)" 포함.
- [ ] `INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md` §4.3 업데이트.

---

## 8. 용어·범위 요약

| 용어 | 의미 |
|------|------|
| 신규 매칭중 | 회기 소진·종료됨을 제외한 매칭 |
| value `ongoing` | 신규 매칭중 옵션의 구현용 value (예시, 기획 확정 시 변경 가능) |
| 기본 선택 | 최초 로드 시 `statusFilter`의 초기값 |

---

**문서 버전**: 1.0  
**작성일**: 2025-03-14  
**참조**: `INTEGRATED_SCHEDULE_SIDEBAR_NEW_ONLY_PLAN.md`, `INTEGRATED_SCHEDULE_FILTER_UI_SPEC.md`, `IntegratedMatchingSchedule.js`
