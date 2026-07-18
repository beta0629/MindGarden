# 통합 스케줄 매칭 카드 — 스케줄 등록 상태 시각 스펙

**작성일**: 2026-07-18  
**목적**: 통합 스케줄 사이드바 매칭 카드에 스케줄(캘린더) 등록 여부를 시각적으로 표시하여, 관리자가 "일정이 잡힌 매칭인지" 한눈에 파악할 수 있도록 함.  
**참조**: `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md`, `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`

---

## 1. 개요 및 원칙

- **대상 영역**: Comfortable 카드의 `CardMeta` 영역 및 Compact 행의 `secondary` 정보 줄.
- **정보 노출**: 관리자에게만 노출. 점유 상태의 상담 일정 유무 및 가장 가까운 미래 상담일(M/D)만 표시 (시간 제외).
- **표시 경계 (SafeText)**: 데이터 부재 시 UI 깨짐을 방지하기 위해 `toDisplayString` 등 SafeText 처리를 필수로 적용한다.
- **공통 모듈 우선**: 기존 `Badge` 패턴을 재사용하여 시각적 일관성을 유지한다.

---

## 2. 상태별 표시 문구 및 시각 위계 (토큰)

| 상태 | 조건 | 표시 문구 | 시각 위계 (Badge 토큰) |
|---|---|---|---|
| **등록됨 (미래)** | 미래 점유 일정이 1건 이상 | `일정 등록 · M/D` (예: `일정 등록 · 7/20`) | **배경**: `var(--mg-primary-100)`<br>**텍스트**: `var(--mg-primary-700)` |
| **이력 있음 (과거)** | 과거 일정만 있고 미래 일정 없음 | `일정 이력 있음` | **배경**: `var(--mg-gray-100)`<br>**텍스트**: `var(--mg-gray-700)` |
| **미등록** | 점유 일정이 전혀 없음 | `일정 미등록` (muted) | **배경**: `transparent`<br>**텍스트**: `var(--mg-gray-500)`<br>**테두리**: `1px solid var(--mg-gray-300)` |

*(※ 하드코딩 색상 금지, 반드시 위 명시된 `var(--mg-*)` 토큰을 사용한다.)*

---

## 3. 레이아웃 및 배치

### 3.1 Comfortable 카드 (CardMeta 영역)
- **위치**: `.integrated-schedule__card-meta` 컨테이너 내부, 기존 `StatusBadge` 및 `RemainingSessionsBadge`와 나란히 배치.
- **정렬**: `display: flex`, `align-items: center`, `gap: var(--mg-spacing-8)`, `flex-wrap: wrap`.
- **시각적 조화**: 기존 배지들과 높이(`min-height: 24px`), 패딩(`var(--mg-spacing-2) var(--mg-spacing-6)`), 폰트 크기(`11px` 또는 `12px`)를 동일하게 맞춰 시각적 일관성을 유지한다.
- **BEM 클래스 제안**: `.integrated-schedule__card-schedule-status`

### 3.2 Compact 행 (MatchingScheduleCompactRow)
- **위치**: Compact 카드의 `secondary` 정보 줄 (상태, 회기 정보 등이 표시되는 두 번째 줄).
- **표시 방식**: 공간 제약을 고려하여 배지 형태가 아닌 **텍스트(메타 라벨)** 형태로 축약 표시.
- **구분자**: 기존 정보와 가독성을 위해 가운뎃점(`·`) 또는 수직선(`|`)으로 구분. (예: `활성 | 1회 남음 | 일정 등록 · 7/20`)
- **텍스트 토큰**: 
  - 등록됨: `color: var(--mg-primary-700)`
  - 이력/미등록: `color: var(--mg-gray-500)`
- **BEM 클래스 제안**: `.integrated-schedule__compact-schedule-status`

---

## 4. 기존 스펙과의 정합 노트

- **CardMeta 레이아웃 상속**: `INTEGRATED_SCHEDULE_CARD_UNIFIED_SPEC.md`의 `card-meta` 영역 규칙(`min-height: 32px`, `flex-wrap: wrap`)을 그대로 상속받는다. 배지가 추가되어 줄바꿈이 발생하더라도 카드 레이아웃이 깨지지 않도록 `flex-wrap`이 정상 동작해야 한다.
- **액션 버튼 독립성**: `canScheduleForMapping` 등 기존 액션 버튼(스케줄 등록 버튼)의 레이아웃이나 로직에는 영향을 주지 않는 순수 정보 표시용 메타 데이터이다.
