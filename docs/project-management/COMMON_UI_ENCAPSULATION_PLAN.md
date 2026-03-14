# 공통 UI 캡슐화·모듈화 계획서

**작성일**: 2025-03-14  
**목표**: 통합 스케줄 카드뿐 아니라 앱 전반에서 공통으로 쓰이는 버튼·배지·카드 스타일을 캡슐화·모듈화하여 재사용 가능하게 만들기  
**참조**: `ATOMIC_DESIGN_SYSTEM.md`, `unified-design-tokens.css`, `CARD_VISUAL_UNIFIED_SPEC.md`, `INTEGRATED_SCHEDULE_CARD_DESIGN_PLAN.md`

---

## 1. 현황 조사 요약

### 1.1 버튼 (Button)

| 구분 | 현재 상태 | 파일 |
|------|----------|------|
| **이원화** | `MGButton` vs `Button`(ui) 병존 | `common/MGButton.js`, `ui/Button/Button.js` |
| **클래스 불일치** | `MGButton` → `mg-button`, `Button.css` → `mg-v2-button` | 스타일 미적용·예측 어려움 |
| **variant 분산** | primary, secondary, outline, danger 등 다수 | MGButton 8종, Button(ui) 8종, 일부 중복 |
| **하드코딩** | 컴포넌트별 직접 정의 | `integrated-schedule__btn-new-mapping`, `btn-success`, Bootstrap `Button` 등 |
| **오버라이드** | 여러 CSS에서 개별 수정 | `AdminDashboard.css`, `MappingManagement.css`, `ScheduleB0KlA.css` 등 |

### 1.2 배지 (Badge)

| 구분 | 현재 상태 | 파일 |
|------|----------|------|
| **클래스 분산** | `status-badge`, `mg-v2-status-badge`, `integrated-schedule__card-status`, `mg-consultant-card__status-badge` 등 | 각 컴포넌트·페이지별 정의 |
| **컴포넌트** | StatusBadge, RemainingSessionsBadge (atoms) | `integrated-schedule/atoms/` |
| **색상/variant** | ClientMappingTab `MAPPING_STATUS_COLOR_MAP`, StatusBadge STATUS_KO, PgConfigurationList 등 별도 정의 | 중복·불일치 |
| **전역 토큰** | `unified-design-tokens.css`에 `mg-v2-status-badge--*` 다수 | 개별 컴포넌트가 참조 안 하는 경우 있음 |

### 1.3 카드 (Card)

| 구분 | 현재 상태 | 파일 |
|------|----------|------|
| **스타일 반복** | border, border-radius, ::before 4px 악센트, min-height 140px, box-shadow 등 동일 패턴 | `ClientMappingTab.css`, `MappingListSection.css`, `MappingListBlock.css` |
| **컴포넌트** | MappingScheduleCard, MappingCard, MGCard | 각각 별도 스타일 |
| **공통 클래스** | `mg-v2-card`, `mg-v2-mapping-card`, `content-card` | 정의 위치 분산 |
| **공통 스타일** | `card-common`, `_cards.css`, `glassmorphism.css` | 일부만 활용 |

---

## 2. 공통 컴포넌트 후보

| 후보 | 설명 | 통합 대상 | 계층 |
|------|------|----------|------|
| **ActionButton** | primary/secondary/outline/danger 등 variant 통합 버튼 | MGButton + Button(ui) 통합, `integrated-schedule__btn-*`, 네이티브 button | Atom |
| **StatusBadge** | 상태 표시 배지 (success/warning/neutral/danger/info 등) | StatusBadge(integrated-schedule), ClientMappingTab, MappingCard, PgConfigurationList 등 | Atom |
| **RemainingSessionsBadge** | 회기·세션 수 표시 배지 | RemainingSessionsBadge(integrated-schedule), 필터 pill 카운트 등 | Atom |
| **CardContainer** | 테두리·그림자·패딩·좌측 악센트 공통 카드 래퍼 | MGCard, MappingScheduleCard, MappingCard, ClientMappingTab 카드 | Molecule |
| **CardActionGroup** | 카드 내 액션 버튼 그룹 | CardActionGroup(integrated-schedule), 기타 카드 하단 버튼 영역 | Molecule |

---

## 3. 디렉터리 구조 제안

### 3.1 방안 A: common 확장 (권장)

기존 `common/`을 아토믹 계층에 맞게 정리.

```
frontend/src/components/
├── common/                      # Atoms (공통 재사용)
│   ├── ActionButton.js
│   ├── ActionButton.css
│   ├── StatusBadge.js
│   ├── StatusBadge.css
│   ├── RemainingSessionsBadge.js
│   ├── RemainingSessionsBadge.css
│   ├── CardContainer.js
│   ├── CardContainer.css
│   └── ... (MGModal, FormInput 등 기존 유지)
├── ui/                          # Molecules·조합 (필요 시)
│   └── Button/                  # → common/ActionButton으로 마이그레이션
├── admin/
│   └── mapping-management/
│       └── integrated-schedule/
│           └── atoms/           # → common에서 import
│               ├── StatusBadge.js      # common.StatusBadge 래퍼 또는 재export
│               └── RemainingSessionsBadge.js
└── styles/
    └── unified-design-tokens.css   # 토큰·기본 클래스 (변경 최소화)
```

### 3.2 방안 B: design-system 폴더 신설

```
frontend/src/components/
├── design-system/
│   ├── atoms/
│   │   ├── ActionButton/
│   │   ├── StatusBadge/
│   │   └── RemainingSessionsBadge/
│   ├── molecules/
│   │   ├── CardContainer/
│   │   └── CardActionGroup/
│   └── tokens/
│       └── (unified-design-tokens.css 링크)
├── common/                      # 기존 유지, design-system import
└── ...
```

- **권장**: 방안 A. `common`이 이미 널리 사용 중이고, 아토믹 스킬의 `atoms/ 또는 common/` 계층과 부합. `design-system` 폴더는 스타일 토큰(`styles/`)과 역할이 겹칠 수 있음.

---

## 4. 마이그레이션 우선순위·단계별 계획

| Phase | 목표 | 담당 | 의존성 |
|-------|------|------|--------|
| **Phase 0** | ActionButton 클래스 통일 (mg-button vs mg-v2-button) | core-coder | 없음 |
| **Phase 1** | ActionButton 통합 컴포넌트 확정 및 MGButton/Button(ui) 통합 | core-designer → core-coder | Phase 0 |
| **Phase 2** | 매칭 카드 스타일 통합 (CardContainer 또는 공통 클래스) | core-designer → core-coder | CARD_VISUAL_UNIFIED_SPEC |
| **Phase 3** | StatusBadge 통합 컴포넌트 및 variant 체계 정리 | core-designer → core-coder | Phase 1 |
| **Phase 4** | integrated-schedule, ClientMappingTab 등 하드코딩 버튼·배지 교체 | core-coder | Phase 1, 3 |
| **Phase 5** | Bootstrap Button, 인라인 스타일 등 잔여 교체 | core-coder | Phase 4 |
| **Phase 6** | 문서·인덱스 갱신, docs/README.md 반영 | generalPurpose | Phase 5 |

**병렬 가능**: Phase 2(카드)와 Phase 3(배지)은 Phase 1 완료 후 동시 진행 가능.

---

## 5. 기존 컴포넌트 통합 방안

### 5.1 IntegratedMatchingSchedule

| 영역 | 현재 | 통합 방안 |
|------|------|----------|
| **버튼** | `integrated-schedule__btn-new-mapping` | ActionButton variant="primary" |
| **카드** | MappingScheduleCard + `integrated-schedule__card-body` | CardContainer + 내부 구조 유지 |
| **배지** | StatusBadge, RemainingSessionsBadge (atoms) | common에서 import, 스타일만 `integrated-schedule__*` modifier로 확장 |
| **액션** | CardActionGroup | common/CardActionGroup 또는 CardActionGroup이 ActionButton 사용 |

### 5.2 MappingListSection

| 영역 | 현재 | 통합 방안 |
|------|------|----------|
| **버튼** | 네이티브 `<button className="mg-v2-button ...">` | ActionButton |
| **카드** | `mg-v2-content-card.mg-v2-mapping-card` | CardContainer + `mg-v2-mapping-card` modifier |

### 5.3 ClientMappingTab

| 영역 | 현재 | 통합 방안 |
|------|------|----------|
| **배지** | `mg-v2-status-badge`, `MAPPING_STATUS_COLOR_MAP` | StatusBadge variant 체계로 통합 |
| **카드** | `mg-v2-mapping-card`, `mg-v2-mapping-card__compact` | CardContainer + `--compact` modifier |

### 5.4 MappingCard, MappingListBlock

- `mg-v2-mapping-list-block__card`, MappingCard의 카드 스타일을 CardContainer 기반으로 통일.
- 배지·버튼은 StatusBadge, ActionButton으로 교체.

---

## 6. 리스크·제약

| 항목 | 내용 |
|------|------|
| **기존 동작** | 마이그레이션 시 시각·동작 회귀 없도록 스토리북·수동 검증 필요 |
| **Bootstrap 의존** | ConsultantManagement 등 Bootstrap Button 사용처는 점진적 교체 |
| **FullCalendar fc-event** | `INTEGRATED_SCHEDULE_CARD_DESIGN_PLAN`의 fc-event 분리와 병행 시 충돌 없이 진행 |
| **멀티테넌트** | tenantId·권한 관련 로직은 유지, UI 컴포넌트만 교체 |
| **토큰 일관성** | `unified-design-tokens.css`의 `--mg-*` 변수만 사용, 하드코딩 색상 금지 |

---

## 7. 완료 기준·체크리스트

- [ ] ActionButton 단일 소스, variant별 스타일 적용 확인
- [ ] StatusBadge·RemainingSessionsBadge 통합 후 IntegratedMatchingSchedule, ClientMappingTab에서 import 사용
- [ ] 카드 스타일(CardContainer 또는 공통 클래스) 적용 후 시각 일관성 검증
- [ ] `integrated-schedule__btn-new-mapping` 등 하드코딩 버튼 제거
- [ ] MGButton vs Button(ui) 사용처 1곳으로 수렴
- [ ] docs/README.md, design-system 관련 문서 갱신

---

## 8. 분배실행 (역할별 실행 분배)

| Phase | subagent_type | 전달할 태스크 설명 요약 |
|-------|---------------|-------------------------|
| **0** | **core-coder** | Button.js의 출력 클래스(`mg-button`)와 Button.css 셀렉터(`mg-v2-button`)를 일치시키거나, MGButton과 Button(ui) 중 하나를 표준으로 정해 클래스·스타일 통일. `/core-solution-frontend`, `unified-design-tokens.css` 참조. |
| **1** | **core-designer** | ActionButton variant 체계(primary, secondary, outline, danger 등)와 디자인 토큰·클래스명 스펙 작성. MGButton·Button(ui) 통합 시 시각 일관성 유지. `/core-solution-atomic-design`, B0KlA 참조. |
| **1** | **core-coder** | core-designer 스펙에 따라 ActionButton 통합 컴포넌트 구현. MGButton·Button(ui) 사용처를 ActionButton으로 점진적 교체. |
| **2** | **core-designer** | CardContainer(또는 공통 카드 클래스) 스펙: border, border-radius, ::before 악센트, min-height, box-shadow. CARD_VISUAL_UNIFIED_SPEC, MappingScheduleCard·ClientMappingTab·MappingListSection 참조. |
| **2** | **core-coder** | CardContainer 구현 후 MappingScheduleCard, ClientMappingTab, MappingListSection 등에 적용. |
| **3** | **core-designer** | StatusBadge variant(success/warning/neutral/danger/info) 및 RemainingSessionsBadge 스펙. ClientMappingTab MAPPING_STATUS_COLOR_MAP, PgConfigurationList status-badge 통합 방안. |
| **3** | **core-coder** | StatusBadge·RemainingSessionsBadge 통합 컴포넌트 구현, 기존 사용처 마이그레이션. |
| **4** | **core-coder** | integrated-schedule, ClientMappingTab, MappingListSection 등에서 하드코딩 버튼·배지를 ActionButton·StatusBadge로 교체. |
| **5** | **core-coder** | Bootstrap Button, 인라인 styles.primaryButton 등 잔여 사용처 교체. |
| **6** | **generalPurpose** | `/core-solution-documentation` 적용. docs/project-management/COMMON_UI_ENCAPSULATION_PLAN.md 갱신, docs/README.md 인덱스 반영. |

**실행 순서**: Phase 0 → Phase 1(designer → coder) → Phase 2, 3(병렬 가능) → Phase 4 → Phase 5 → Phase 6.

---

## 9. 참조 문서

- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`
- `docs/design-system/v2/CARD_VISUAL_UNIFIED_SPEC.md`
- `docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md`
- `docs/project-management/INTEGRATED_SCHEDULE_CARD_DESIGN_PLAN.md`
- `frontend/src/styles/unified-design-tokens.css`
- `.cursor/skills/core-solution-atomic-design/SKILL.md`
- `.cursor/skills/core-solution-frontend/SKILL.md`
