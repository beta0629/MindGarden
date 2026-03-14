# 통합 스케줄 사이드바 카드(MappingScheduleCard) 아토믹 디자인·common 검증

**작성일**: 2025-03-14  
**목적**: MappingScheduleCard가 아토믹 디자인 및 common 모듈 규격을 준수하는지 검증  
**참조**: `core-solution-atomic-design`, `COMMON_UI_IMPLEMENTATION_SPEC`, `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC`

---

## 1. 검증 요약

| 항목 | 결과 | 비고 |
|------|------|------|
| 아토믹 디자인·common 모듈 사용 | ✅ 준수 | CardContainer, CardActionGroup, StatusBadge, RemainingSessionsBadge, ActionButton 모두 common 사용 |
| COMMON_UI_IMPLEMENTATION_SPEC 부합 | ✅ 부합 | 클래스·토큰·구조 스펙 일치 |
| INTEGRATED_SCHEDULE_CARD_FINAL_SPEC 매핑 | ⚠️ 일부 이탈 | 2건: aria-hidden, 스케줄 등록 버튼 |

---

## 2. 아토믹 디자인·common 준수 검증

### 2.1 스킬 규칙

> **버튼·배지·카드 등은 반드시 `common/` 모듈 사용** — StatusBadge, RemainingSessionsBadge, ActionButton, CardContainer, CardActionGroup. 새로 만들지 않음.

### 2.2 현재 구현 매핑

| 컴포넌트 | 출처 | import 경로 | 준수 |
|----------|------|-------------|------|
| CardContainer | common | `../../../../common/CardContainer` | ✅ |
| CardActionGroup | common | `../../../../common` (CommonCardActionGroup) | ✅ |
| ActionButton | common | `../../../../common/ActionButton` | ✅ |
| StatusBadge | common | `../../../../common/StatusBadge` | ✅ |
| RemainingSessionsBadge | common | `../../../../common/RemainingSessionsBadge` | ✅ |
| MappingPartiesRow | molecules (integrated-schedule) | `../molecules/MappingPartiesRow` | ✅ (특화) |
| CardMeta | molecules (integrated-schedule) | `../molecules/CardMeta` | ✅ (특화, 내부에 common 배지 사용) |

- **결론**: 버튼·배지·카드 관련 UI는 전부 common 모듈 사용. organisms 특화 molecules(MappingPartiesRow, CardMeta)만 integrated-schedule 내부에 존재. 하향 조합 준수.

---

## 3. COMMON_UI_IMPLEMENTATION_SPEC 부합 검증

| 컴포넌트 | 스펙 클래스 | 실제 클래스 | 토큰 사용 | 부합 |
|----------|-------------|-------------|-----------|------|
| CardContainer | `mg-v2-card-container` | `mg-v2-card-container` | `var(--mg-spacing-16)`, `var(--mg-color-border-main)` 등 | ✅ |
| CardActionGroup | `mg-v2-card-actions` | `mg-v2-card-actions` | `var(--mg-spacing-8)`, `var(--mg-spacing-4)`, `var(--touch-target-min)` | ✅ |
| StatusBadge | `mg-v2-status-badge`, `mg-v2-badge--{variant}` | 동일 | 스펙 variant 매핑 적용 | ✅ |
| RemainingSessionsBadge | `mg-v2-count-badge` | `mg-v2-count-badge` | null/음수 시 미렌더링 | ✅ |
| ActionButton | `mg-v2-button`, `mg-v2-button--{variant}` | common ActionButton 사용 | variant/size 적용 | ✅ |

- **결론**: common 모듈 사용 시 COMMON_UI_IMPLEMENTATION_SPEC과 일치.

---

## 4. INTEGRATED_SCHEDULE_CARD_FINAL_SPEC 매핑

### 4.1 마크업 구조 비교

**FINAL_SPEC 3.1 기대 구조**
```
li.integrated-schedule__card
  ├ .integrated-schedule__card-body
  │   ├ .integrated-schedule__card-parties
  │   └ .integrated-schedule__card-meta
  └ .integrated-schedule__card-actions
```

**현재 실제 구조**
```
li.integrated-schedule__card
  └ div.mg-v2-card-container (CardContainer)
      ├ div.integrated-schedule__card-body
      │   ├ div.integrated-schedule__card-parties (MappingPartiesRow)
      │   └ div.integrated-schedule__card-meta (CardMeta → StatusBadge, RemainingSessionsBadge)
      └ div.mg-v2-card-actions (CardActionGroup)
```

| 구분 | 스펙 | 구현 | 비고 |
|------|------|------|------|
| 루트 | li | li (부모 IntegratedMatchingSchedule) | ✅ |
| 카드 래퍼 | (없음) | div.mg-v2-card-container | CardContainer 래퍼 추가. 시각 스펙(border, accent, hover)은 CardContainer에서 적용. 허용 가능. |
| card-body | .integrated-schedule__card-body | 동일 | ✅ |
| card-parties | .integrated-schedule__card-parties | 동일 | ✅ |
| card-meta | .integrated-schedule__card-meta | 동일 | ✅ |
| card-actions | .integrated-schedule__card-actions | .mg-v2-card-actions | common 스펙 우선. 역할 동일. |

### 4.2 이탈 항목

| 항목 | 스펙 | 구현 | 수정 제안 |
|------|------|------|-----------|
| **화살표 접근성** | `aria-hidden="true"` (card-arrow) | 미적용 | `MappingPartiesRow`의 `<span className="integrated-schedule__card-arrow">`에 `aria-hidden="true"` 추가 |
| **스케줄 등록 버튼** | 3.5: PENDING_PAYMENT/PAYMENT_CONFIRMED/DEPOSIT_PENDING/ACTIVE 모두 "스케줄 등록" 버튼 포함 | CardActionGroup에 스케줄 등록 버튼 없음 | 현재 드래그(fc-event)로 스케줄 등록. 명시적 버튼 추가 여부는 비즈니스·UX 결정 후 반영 |

---

## 5. 결론 및 권장사항

### 5.1 준수 현황

- **아토믹 디자인**: 준수. common 모듈만 사용, organisms 특화 molecules 적절히 배치.
- **COMMON_UI_IMPLEMENTATION_SPEC**: 준수.
- **INTEGRATED_SCHEDULE_CARD_FINAL_SPEC**: 대부분 부합. 경미한 이탈 2건.

### 5.2 수정 제안 (우선순위)

1. **권장**: `MappingPartiesRow` 화살표에 `aria-hidden="true"` 추가.
2. **선택**: 스케줄 등록 버튼 추가 여부를 기획/디자인 확인 후, 필요 시 `CardActionGroup`에 버튼 노출.

---

**문서 버전**: 1.0
