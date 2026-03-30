# 통합 스케줄 사이드바 카드 UI 개선 기획

**목표**: integrated-schedule__card(통합 스케줄 사이드바 카드)의 상담사→내담자 행·회기 배지 텍스트를 개선하여 가독성과 호칭 명확성을 높인다.

---

## 1. 요구사항 요약

| # | 영역 | 현재 | 변경 요청 |
|---|------|------|-----------|
| 1 | card-parties (상담사→내담자) | "김선희→이재학" | "김선희 선생님→이재학 내담자" (호칭을 작은 글씨로 추가) |
| 2 | RemainingSessionsBadge | "0회 남음" | "0 회기 남음" 또는 가독성 개선 |
| 3 | StatusBadge | — | 필요 시 일관성 검토 |

---

## 2. 범위

### 포함
- **MappingPartiesRow** (`.integrated-schedule__card-parties`): 상담사·내담자 이름 뒤 호칭 추가
- **RemainingSessionsBadge** (common): 텍스트 포맷 변경
- **StatusBadge** (common): 일관성 검토(필요 시)

### 제외
- 통합 스케줄 외 다른 화면의 MappingPartiesRow·RemainingSessionsBadge 사용처는 이번 범위 아님. (현재 CardMeta→RemainingSessionsBadge 사용처는 integrated-schedule 1곳뿐)

### 영향 파일
- `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MappingPartiesRow.js`
- `frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MappingPartiesRow.css`
- `frontend/src/components/common/RemainingSessionsBadge.js`
- (필요 시) `frontend/src/components/common/StatusBadge.js`, `StatusBadge.css`

---

## 3. 렌더링 구조 파악 결과

| 컴포넌트 | 파일 | 역할 |
|----------|------|------|
| **MappingScheduleCard** | `integrated-schedule/organisms/MappingScheduleCard.js` | 카드 전체 래퍼, MappingPartiesRow + CardMeta + CardActionGroup 포함 |
| **MappingPartiesRow** | `integrated-schedule/molecules/MappingPartiesRow.js` | 상담사 이름 + 화살표 + 내담자 이름 (`.integrated-schedule__card-parties`) |
| **CardMeta** | `integrated-schedule/molecules/CardMeta.js` | StatusBadge + RemainingSessionsBadge |
| **RemainingSessionsBadge** | `common/RemainingSessionsBadge.js` | `{remainingSessions}회 남음` 텍스트, `mg-v2-count-badge` 클래스 |

---

## 4. 의존성·순서

- **Phase 1 (core-designer)**: 호칭 스타일·배지 포맷·일관성 스펙 작성
- **Phase 2 (core-coder)**: Phase 1 스펙 반영 구현 (Phase 1 완료 후 실행)

---

## 5. Phase 목록 및 분배실행

### Phase 1: 설계 (core-designer)

**목표**: 호칭(선생님·내담자) 스타일, RemainingSessionsBadge 텍스트 포맷, StatusBadge 일관성 검토 스펙 작성

**전달할 태스크 설명(프롬프트) 초안**:
```
통합 스케줄 사이드바 카드(MappingScheduleCard) UI 개선 스펙을 작성해 주세요.

1. **MappingPartiesRow (integrated-schedule__card-parties)**
   - 상담사 이름 뒤에 "선생님" 호칭 추가 (작은 글씨)
   - 내담자 이름 뒤에 "내담자" 호칭 추가 (작은 글씨)
   - 예: "김선희→이재학" → "김선희 선생님→이재학 내담자"
   - 요구: 호칭("선생님", "내담자")의 font-size, color, BEM 클래스명 스펙 작성. unified-design-tokens.css, B0KlA 기준. 기존 .integrated-schedule__card-consultant, .integrated-schedule__card-client 스타일과 조화되도록.

2. **RemainingSessionsBadge (mg-v2-count-badge)**
   - 현재: "{remainingSessions}회 남음"
   - 변경: "회기"를 띄워 가독성 개선. 예: "0 회기 남음" 또는 적절한 포맷 제안
   - 요구: 최종 텍스트 포맷 확정 (예: "N 회기 남음")

3. **StatusBadge**
   - 필요 시 회기 소진 등 라벨과 RemainingSessionsBadge와의 일관성만 간단 검토. 변경 없으면 "검토 완료·변경 불필요"로 명시.

참조: docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md, docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md, unified-design-tokens.css
산출물: docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_UI_REFINEMENT_SPEC.md 에 저장. 코드 작성 없음.
```

**적용 스킬**: `/core-solution-atomic-design`, `/core-solution-design-handoff`, B0KlA·unified-design-tokens 참조

---

### Phase 2: 구현 (core-coder)

**목표**: Phase 1 스펙 반영 코드 수정

**전달할 태스크 설명(프롬프트) 초안**:
```
통합 스케줄 카드 UI 개선을 구현해 주세요. Phase 1 스펙 문서를 반드시 참조하세요.

1. **MappingPartiesRow**
   - 상담사 이름 뒤 "선생님", 내담자 이름 뒤 "내담자" 추가
   - 호칭 스타일: docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_UI_REFINEMENT_SPEC.md 의 BEM 클래스·font-size·color 적용
   - 수정 파일: frontend/src/components/admin/mapping-management/integrated-schedule/molecules/MappingPartiesRow.js, MappingPartiesRow.css

2. **RemainingSessionsBadge**
   - 텍스트 포맷을 스펙에 확정된 형식으로 변경 (예: "N 회기 남음")
   - 수정 파일: frontend/src/components/common/RemainingSessionsBadge.js

3. **StatusBadge** (스펙에서 변경 지시 시에만)
   - 스펙에 변경 사항이 있으면 반영

참조: /core-solution-frontend, /core-solution-atomic-design, docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_UI_REFINEMENT_SPEC.md
```

**적용 스킬**: `/core-solution-frontend`, `/core-solution-atomic-design`

---

## 6. 리스크·제약

- RemainingSessionsBadge는 common 모듈이며 현재 CardMeta(integrated-schedule) 1곳에서만 사용. 포맷 변경 시 다른 사용처 추가 시 일관 유지 필요.
- 호칭 스타일은 기존 14px·font-weight 600과 시각적 위계가 맞도록 작은 글씨로 구분.

---

## 7. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| **Phase 1 (designer)** | 코더가 구현 가능한 스펙 문서 확정 | [ ] 호칭 BEM 클래스·font-size·color 명시 [ ] RemainingSessionsBadge 최종 포맷 확정 [ ] StatusBadge 검토 결과 명시 [ ] 스펙 문서 docs/design-system/v2/INTEGRATED_SCHEDULE_CARD_UI_REFINEMENT_SPEC.md 저장 |
| **Phase 2 (coder)** | UI 변경 적용 완료 | [ ] MappingPartiesRow 호칭·스타일 반영 [ ] RemainingSessionsBadge 텍스트 포맷 반영 [ ] StatusBadge 변경 사항 반영(필요 시) [ ] 통합 스케줄 사이드바에서 시각적 확인 |

---

## 8. 실행 요청문

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1**: **core-designer** — 위 "Phase 1 전달할 태스크 설명(프롬프트) 초안"을 프롬프트로 전달. 호칭·배지 포맷·StatusBadge 스펙 문서 작성.
2. **Phase 2**: **core-coder** — Phase 1 산출물(INTEGRATED_SCHEDULE_CARD_UI_REFINEMENT_SPEC.md)을 첨부한 뒤, 위 "Phase 2 전달할 태스크 설명(프롬프트) 초안"을 프롬프트로 전달. MappingPartiesRow, RemainingSessionsBadge, (필요 시) StatusBadge 수정.

Phase 1 완료 후 Phase 2를 실행합니다. (순차 실행)
