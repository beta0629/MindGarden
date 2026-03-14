# 카드 시각 통일 스펙 (구현용 1페이지)

**작성일**: 2025-03-14  
**목적**: 기준 카드(`integrated-schedule__card`, fc-event 없음)와 동일한 시각을 모든 매칭 카드에 적용  
**참조**: `CARD_VISUAL_CONSISTENCY_PLAN.md`, `INTEGRATED_SCHEDULE_LAYOUT_AND_CARD_SPEC.md`, `PENCIL_DESIGN_GUIDE.md`

---

## 1. 통일 시각 수치 (기준 카드)

| 속성 | 값 | 토큰 |
|------|-----|------|
| **border** | 1px solid | `var(--mg-color-border-main)` |
| **border-radius** | 12px | `var(--mg-radius-lg)` |
| **padding** | 16px | `var(--mg-spacing-16)` |
| **min-height** | 140px | — |
| **box-shadow** | 기본 | `var(--mg-shadow-sm)` |
| **box-shadow (hover)** | — | `var(--mg-card-hover-shadow)` |
| **background** | — | `var(--mg-bg-card, var(--mg-color-surface-main))` |
| **transition** | 0.2s ease | — |
| **좌측 악센트 (::before)** | width 4px, `var(--mg-color-primary-main)`, border-radius `12px 0 0 12px` | — |

**hover 규칙**: `box-shadow`만 변경, `transform` 사용 금지.

---

## 2. fc-event 격리

### 옵션 A (유지 시)

```css
.integrated-schedule__sidebar .integrated-schedule__card,
.integrated-schedule__sidebar .integrated-schedule__card.fc-event { /* 1. 통일 수치 동일 적용 */ }
```

- CSS 로드 순서: `IntegratedMatchingSchedule.css`를 fc-event 관련 파일 **이후** 배치.

### 옵션 B (권장)

- `fc-event` 대신 `integrated-schedule__card--draggable` 사용.
- FullCalendar Draggable `itemSelector`를 `.integrated-schedule__card--draggable`로 변경.
- fc-event와 완전 분리.

---

## 3. 매칭 카드별 클래스·스타일 매핑

| 대상 | 현재 클래스 | 적용 방법 |
|------|-------------|-----------|
| **통합 스케줄 사이드바** | `.integrated-schedule__card` | 이미 기준 적용. fc-event 시 옵션 A/B 중 택1. |
| **MappingCard** (MappingListSection) | `.mg-v2-content-card.mg-v2-mapping-card` | 통일 수치 오버라이드. `unified-design-tokens.css` 또는 `MappingListSection.css`에서 `.mg-v2-mapping-list-section .mg-v2-content-card.mg-v2-mapping-card`에 1번 수치 적용. 좌측 `::before` 악센트 추가. |
| **MappingListRow** | `.mg-v2-mapping-list-row` | `MappingListRow.css`에서 border, border-radius, padding, min-height, box-shadow, hover를 1번 수치로 통일. `::before` 악센트 추가. |
| **MappingListBlock 카드** | `.mg-v2-mapping-list-block__card` | `MappingListBlock.css`에서 min-height 140px 등 1번 수치 적용. (카드 외곽 래퍼인 경우 부모에 악센트 적용) |
| **ClientMappingTab** | `.mg-v2-card.mg-v2-mapping-card.mg-v2-mapping-card__compact` | `ClientMappingTab.css`에서 `.mg-v2-mapping-client-block .mg-v2-card.mg-v2-mapping-card`에 1번 수치 오버라이드. `__compact`는 내부 padding/gap 축소 허용, 외곽 수치는 유지. 좌측 악센트 추가. |

---

## 4. 구현 체크리스트

- [ ] fc-event 격리: 옵션 A 또는 B 적용
- [ ] `.integrated-schedule__sidebar .integrated-schedule__card` 시각 확인 (기준)
- [ ] MappingCard: border, radius, padding, min-height, box-shadow, `::before`, hover 통일
- [ ] MappingListRow: 동일 수치 적용
- [ ] ClientMappingTab 카드: 동일 수치 적용 (compact는 내부만 축소)
- [ ] hover 시 `transform` 미적용

---

**문서 버전**: 1.0
