# 통합일정 사이드바 매칭 카드 Compact Row 디자인 스펙

**작성일**: 2026-06-30  
**담당**: core-designer  
**관련 기획**: `docs/project-management/2026-06-30/INTEGRATED_SCHEDULE_SIDEBAR_CARD_STYLE_PLAN.md` (안 1 Compact List Row)

---

## 1. 디자인 컨셉 및 레이아웃

기존의 세로형 카드(수직 스택) 구조를 탈피하고, B2B SaaS(Stripe, HubSpot) 스타일의 **1줄 Compact List Row** 형태로 재설계합니다. 사이드바 폭(380px) 내에서 정보 스캔의 효율성을 극대화합니다.

### 1.1 구조 (Wireframe)

```text
┌──────────────────────────────────────────────────────────┐
│ ⋮⋮   김선희 → 이재학      [활성][3회기]       [일정등록] ⋯ │
└──────────────────────────────────────────────────────────┘
  ↑    ↑                    ↑                   ↑          ↑
 Grip  Parties (1줄)        Meta Chips          Primary    Overflow
```

### 1.2 시각 계층 및 스펙

- **전체 높이 (Row Height)**: `72px` ~ `88px` (내부 콘텐츠에 따라 유동적이나 1줄 유지)
- **사이드바 폭**: `380px` 고정
- **배경 및 테두리 (No Stripe)**:
  - 좌측 악센트 바(Stripe) **제거** (1줄 Row의 심플함 유지)
  - 배경: `var(--mg-color-surface-main)`
  - 테두리: `1px solid var(--mg-color-border-main)`
  - Corner Radius: `var(--mg-radius-md)`
- **여백 (Padding)**: `12px 16px` (상하 12px, 좌우 16px)
- **Grip (DnD)**: 폭 `24px`, 색상 `var(--mg-color-text-tertiary)`
- **Parties (매칭 주체)**:
  - 폰트: Noto Sans KR, `14px`, `font-weight: 600` (Semibold), `var(--mg-color-text-main)`
  - 긴 이름 처리: `text-overflow: ellipsis`, `white-space: nowrap`
- **Meta (배지)**:
  - `StatusBadge`, `RemainingSessionsBadge` 등 기존 컴포넌트 재사용 (크기 `xs` 또는 `sm`)
- **Primary CTA**:
  - 우측 정렬 (Trailing)
  - 버튼 크기: `size="sm"`, 높이 `32px` ~ `36px`
- **Overflow (⋯)**:
  - Primary CTA 우측에 위치, 아이콘 버튼 형태 (크기 `32px x 32px`)

---

## 2. 상태별 UI 매트릭스 (State Matrix)

상태에 따라 노출되는 Primary CTA와 Overflow 항목을 정의합니다.

| 상태 (Status) | 조건 | Primary CTA (버튼) | Overflow (⋯) 메뉴 항목 |
|--------------|------|--------------------|------------------------|
| **ACTIVE** | 일정 등록 가능 | `[일정 등록]` (Primary) | `회기 추가` |
| **PAYMENT_CONFIRMED** | 결제 완료 | `[일정 등록]` (Primary) | - |
| **DEPOSIT_PENDING** | 입금 대기 | `[일정 등록]` (Primary) | `승인` (또는 비즈니스 로직에 따라 승인이 Primary) |
| **PENDING_PAYMENT** | 사전 결제 대기 | `[결제 확인]` (Secondary) | `매칭 취소` (Danger) |
| **PENDING_PAYMENT** | **당일 결제** | `[당일결제]` (Primary) | `매칭 취소` (Danger) |

---

## 3. DnD Affordance (드래그 앤 드롭)

- **Grip 아이콘 (`⋮⋮`)**:
  - 카드의 가장 좌측(Leading)에 배치.
  - 마우스 호버 시 `cursor: grab`, 드래그 중 `cursor: grabbing`.
  - 클릭 영역을 명확히 분리하여 버튼 클릭(일정 등록 등)과 드래그 제스처가 충돌하지 않도록 함.
- **Draggable 영역**:
  - 전체 카드가 아닌 Grip 영역 또는 카드 본문 영역을 드래그 핸들로 사용 (FullCalendar 연동 시 `integrated-schedule__card--draggable` 클래스 활용).

---

## 4. core-coder 핸드오프 (Handoff)

프론트엔드 개발자(`core-coder`)는 본 스펙을 바탕으로 아래 파일 및 클래스를 수정/구현합니다.

### 4.1 대상 파일 및 컴포넌트

1. **`MappingScheduleCard.js` / `.css`**
   - 수직 스택(Column) 레이아웃을 **가로 1줄(Row) Flex/Grid 레이아웃**으로 변경.
2. **`CardContainer.js` / `.css`**
   - 전역 `min-height: 140px`의 영향을 받지 않도록 `variant="sidebar-row"` (또는 `modifier`) 추가.
3. **`MappingPartiesRow.js`**
   - 1줄 처리를 위한 `layout="compact"` prop 추가 및 `text-overflow` 처리.
4. **`CardActionGroup.js` / `MappingMatchActions.js`**
   - 기존의 Full-width 버튼들을 **Inline Primary + Overflow(Dropdown/Popover)** 형태로 분리.

### 4.2 CSS 클래스 및 토큰 (B0KlA)

```css
/* Card Container (Sidebar Row Variant) */
.mg-v2-card-container--sidebar-row {
  display: flex;
  align-items: center;
  gap: var(--mg-spacing-sm);
  padding: 12px 16px;
  min-height: 72px; /* 최대 88px 내외 */
  background-color: var(--mg-color-surface-main);
  border: 1px solid var(--mg-color-border-main);
  border-radius: var(--mg-radius-md);
}

/* DnD Grip */
.integrated-schedule__card--draggable .drag-grip {
  width: 24px;
  cursor: grab;
  color: var(--mg-color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Parties & Meta (Flex 1 to push actions to right) */
.mapping-schedule-card__body {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--mg-spacing-sm);
  min-width: 0; /* for text-overflow */
}

.mapping-schedule-card__parties {
  font-size: 14px;
  font-weight: 600;
  color: var(--mg-color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Actions */
.mapping-schedule-card__actions {
  display: flex;
  align-items: center;
  gap: var(--mg-spacing-xs);
  flex-shrink: 0;
}
```

### 4.3 구현 시 주의사항 (하드코딩 금지)
- 모든 색상, 간격, 폰트 사이즈는 `unified-design-tokens.css`에 정의된 `var(--mg-*)` 토큰을 사용해야 합니다.
- 임의의 HEX 색상 코드(`#FAF9F7` 등)나 하드코딩된 픽셀 값(토큰에 없는 값) 사용을 엄격히 금지합니다.
- 기존 사이드바 외의 화면에서 사용되는 `mg-v2-card-container`에 시각적 회귀(Regression)가 발생하지 않도록 주의합니다.
