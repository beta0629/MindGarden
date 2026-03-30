# 통합 스케줄 매칭 카드 아토믹 디자인 기획서

**대상**: 통합 스케줄링 센터 좌측 매칭 카드 (`integrated-schedule__card`)  
**목표**: 카드 시각적·레이아웃 통일 + 아토믹 디자인 전환  
**문서**: 1페이지 기획 요약 (코드 수정 없음)

---

## 1. 카드 높이 통일 방안

| 규칙 | 값 | 설명 |
|------|-----|------|
| `.integrated-schedule__card` | `min-height: 140px` (권장) | 카드 전체 최소 높이 고정. body+actions 합산 기준 |
| `.integrated-schedule__card-actions` | `min-height: 44px` | 액션 영역 고정 최소 높이 (버튼 0~2개와 무관) |
| 액션 영역 | `display: flex; align-items: center; gap: var(--mg-spacing-8)` | 버튼 1개/2개 시 동일 정렬·간격 |
| body ↔ actions | `gap: var(--mg-spacing-12)` | 기존 유지 |

**권장**: 액션 영역을 `min-height: 44px`로 고정하고, 카드 전체 `min-height`를 `140px` 정도로 두면 PENDING_PAYMENT(버튼 2개)·ACTIVE(버튼 1개)·종료(버튼 1개, disabled) 모두 시각적 일관성 유지. `INTEGRATED_SCHEDULE_CARD_BUTTON_SPEC.md` §5와 동일 규칙 적용.

---

## 2. 아토믹 디자인 분해

| 계층 | 컴포넌트 | 역할 |
|------|----------|------|
| **Atoms** | StatusBadge | 상태 배지 (결제 대기/활성/종료 등 색상·텍스트) |
| | RemainingSessionsBadge | "N회 남음" 칩 |
| | ArrowText | `→` 화살표 (상담사→내담자 사이) |
| | MGButton | 기존 공통 컴포넌트 재사용 |
| **Molecules** | MappingPartiesRow | 상담사 이름 + ArrowText + 내담자 이름 |
| | CardMeta | StatusBadge + RemainingSessionsBadge |
| | CardActionGroup | 결제 확인/입금 확인/승인/스케줄 등록 버튼 묶음 |
| **Organism** | MappingScheduleCard | parties + meta + actions 전체 카드 |

---

## 3. 파일 구조 제안

```
frontend/src/components/admin/mapping-management/
├── IntegratedMatchingSchedule.js    (페이지, 기존 유지)
├── IntegratedMatchingSchedule.css   (페이지/레이아웃 스타일)
└── integrated-schedule/
    ├── atoms/
    │   ├── StatusBadge.js
    │   ├── StatusBadge.css
    │   ├── RemainingSessionsBadge.js
    │   ├── RemainingSessionsBadge.css
    │   └── ArrowText.js              (텍스트만, CSS는 parents 공유)
    ├── molecules/
    │   ├── MappingPartiesRow.js
    │   ├── MappingPartiesRow.css
    │   ├── CardMeta.js
    │   ├── CardMeta.css
    │   ├── CardActionGroup.js
    │   └── CardActionGroup.css
    ├── organisms/
    │   ├── MappingScheduleCard.js
    │   └── MappingScheduleCard.css
    └── index.js                      (필요 시 barrel export)
```

**선택지**:
- **옵션 A (권장)**: `integrated-schedule/` 서브폴더 — 이 기능 전용 atoms/molecules/organisms 묶음.
- **옵션 B**: `mapping-management/atoms/`, `molecules/`, `organisms/` — 매칭 관련 다른 카드·폼과 공유 시.

현재는 매칭 카드만 대상이므로 **옵션 A** 권장.

---

## 4. 의존성·순서

1. `INTEGRATED_SCHEDULE_CARD_BUTTON_SPEC.md` 버튼 스펙 적용 완료 후(또는 동시에) 아토믹 분해 진행.
2. Atoms → Molecules → Organism 순 구현.
3. `IntegratedMatchingSchedule.js`에서 기존 인라인 카드 마크업을 `<MappingScheduleCard />` 한 줄로 교체.

---

## 5. 참조 문서

- `docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_BUTTON_SPEC.md`
- `unified-design-tokens.css`, B0KlA
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`, `/core-solution-atomic-design`

---

**버전**: 1.0 | **작성일**: 2025-03-14
