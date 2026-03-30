# 배지 스타일 통일 — Phase별 실행 분배

**상위 문서**: `BADGE_STYLE_UNIFICATION_PLAN.md`  
**목적**: Phase 순서·담당·전달 프롬프트 요약을 담은 실행용 분배표. 코어 플래너 기획 완료 후, 이 표대로 서브에이전트를 호출하여 실행합니다.

**배지 스타일 통일 Phase 1~5 완료** — 결과 요약은 `BADGE_STYLE_UNIFICATION_PLAN.md` §7 참조.

---

## 실행 순서

1. **Phase 1** → **Phase 2** → **Phase 3** (순차. Phase 3는 1·2 완료 후)
2. **Phase 4**는 Phase 3와 **병렬 가능** (등급/레벨 영역 독립)
3. **Phase 5**는 Phase 1~4 코드 변경이 반영된 **이후** 실행

---

## 분배실행 표

| Phase | 담당 (subagent_type) | 전달할 태스크 설명(프롬프트) 요약 | 적용 스킬/참조 |
|-------|----------------------|----------------------------------|----------------|
| **1** | **core-coder** | `BADGE_STYLE_UNIFICATION_PLAN.md` §2.4·§3.1·§4를 참조하여, **스타일 정의 정리**를 수행해 주세요. unified-design-tokens.css·ConsultantClientList.css·StatusBadge.css 내 `.mg-v2-status-badge` 중복 정의를 제거하고, **variant 기반(success/warning/neutral/danger/info)** 단일 소스로 통합해 주세요. BEM 더블 대시(`--active`)와 단일 하이픈(`-active`) 혼용을 정리하고, ConsultantClientList.css의 배지 색은 공통 스펙에 맞추거나 해당 영역에서 StatusBadge 사용으로 대체 가능하도록 해 주세요. | /core-solution-frontend, /core-solution-design-system-css, BADGE_STYLE_UNIFICATION_PLAN.md §2.4·§3.1 |
| **2** | **core-coder** | `BADGE_STYLE_UNIFICATION_PLAN.md` §3.1 공통 컴포넌트 확대를 참조하여, **StatusBadge 컴포넌트 및 status→variant 매핑**을 정비해 주세요. ACTIVE/INACTIVE 등 사용자 상태가 올 때 올바른 variant(success/neutral 등)로 표시되도록 매핑을 추가하고, 인라인 `getStatusColorSync` 의존을 제거할 수 있게 해 주세요. 필요 시 `utils/codeHelper.js`의 getStatusColorSync에 사용자 상태 지원을 추가하거나, 배지용 색상은 StatusBadge 내부 매핑만 사용하도록 정리해 주세요. | /core-solution-frontend, BADGE_STYLE_UNIFICATION_PLAN.md §3.1·§4.2 |
| **3** | **core-coder** | `BADGE_STYLE_UNIFICATION_PLAN.md` §4.1·§4.2를 참조하여, **화면·컴포넌트에 배지 통일 적용**을 해 주세요. ClientOverviewTab, ClientConsultationTab에서 인라인 `style={{ '--status-bg-color': ... }}` 제거 후 StatusBadge 또는 통일된 모디파이어 클래스 사용. ConsultantComprehensiveManagement, ClientCard는 이미 모디파이어 사용 중이므로 최종 단일 체계와 일치하는지 확인 후 필요 시 StatusBadge로 교체. MappingCard·StaffManagement에는 매핑 상태/역할에 맞는 모디파이어 또는 StatusBadge 적용. AdminDashboardB0KlA.css 내 배지 클래스가 통일안과 충돌하지 않는지 점검해 주세요. | /core-solution-frontend, BADGE_STYLE_UNIFICATION_PLAN.md §4 |
| **4** | **core-component-manager** | `BADGE_STYLE_UNIFICATION_PLAN.md` §2.2·§2.3·§3.1 4·5항을 참조하여, **등급(mg-v2-grade-badge)·레벨(mg-v2-consultant-level-badge) 배지** 용도 분리 및 토큰 정리 **제안서**를 작성해 주세요. grade-badge가 "등급(브론즈/실버)" vs "활성/비활성" 표시로 혼용되는 부분을 정리하고, consultant-level-badge 토큰명이 프로젝트 표준과 맞는지 확인한 뒤 제안에 반영해 주세요. 코드 수정은 하지 않고, core-coder가 구현할 수 있는 제안·목록만 산출해 주세요. | /core-solution-encapsulation-modularization |
| **4** | **core-coder** | Phase 4에서 **core-component-manager**가 작성한 등급·레벨 배지 제안서를 받아, 제안된 정리(용도 분리·토큰 통일)를 **구현**해 주세요. | /core-solution-frontend, component-manager 제안서 |
| **5** | **core-component-manager** 또는 **generalPurpose** | `BADGE_STYLE_UNIFICATION_PLAN.md` §5를 참조하여, 배지 스타일 통일 작업 **결과 요약**을 BADGE_STYLE_UNIFICATION_PLAN.md에 섹션으로 추가해 주세요. 필요 시 COMPONENT_INVENTORY.md·COMPONENT_PLACEMENT_PROPOSAL.md를 갱신해 주세요. `/core-solution-documentation` 스킬을 적용합니다. | /core-solution-documentation |

---

## 호출 시 참고

- **Phase 1·2·3**: 순차 호출. 각 Phase 완료 후 결과를 기획(core-planner)에게 보고하고, 다음 Phase로 진행.
- **Phase 4**: core-component-manager 먼저 호출 → 제안서 수령 후 core-coder 호출. Phase 3와는 병렬 가능.
- **Phase 5**: Phase 1~4 반영 후 호출. 담당은 core-component-manager(문서·인벤토리 담당) 또는 generalPurpose(문서 정리). **완료됨** — 결과 요약은 BADGE_STYLE_UNIFICATION_PLAN.md §7.
- 실행 결과는 기획에게 보고하여, 기획이 사용자에게 최종 요약을 전달합니다.

---

*코어 플래너 기획 완료. 배지 스타일 통일 Phase 1~5 완료. 실행 시 위 분배실행 표를 따라 서브에이전트를 호출하세요.*
