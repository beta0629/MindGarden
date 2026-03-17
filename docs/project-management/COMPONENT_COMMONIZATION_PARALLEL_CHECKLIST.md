# 공통화 병렬 실행 체크리스트 (Phase 1·2·5)

**상위 문서**: `COMPONENT_COMMONIZATION_CANDIDATES.md` §11  
**목적**: Phase 1·2·5를 병렬로 처리할 수 있도록 체크리스트로 정리. 코어 코더가 실행 가능한 항목을 처리.

---

## 트랙 A: Phase 1 — 모달 통일

| # | 항목 | 처리 가능 | 담당 | 완료 |
|---|------|-----------|------|------|
| A1 | ConfirmModal 이중 구현 정리: `common/ConfirmModal.js` vs `common/modals/ConfirmModal.js` — 단일 소스 결정 후 나머지 re-export 또는 제거 | ✅ | core-coder | ☑ |
| A2 | `ui/Modal/Modal.js` → UnifiedModal re-export 또는 deprecated 주석 + 단일 진입점 안내 | ✅ | core-coder | ☑ |
| A3 | CompactConfirmModal 사용처 확인 후 ConfirmModal과 props 통일(또는 size="compact") 검토 | ✅ | core-coder | ☑ |
| A4 | MGModal/MGConfirmModal 사용처 목록화 → UnifiedModal 마이그레이션(또는 1차로 deprecated 표시) | ✅ | core-coder | ☑ |
| A5 | Bootstrap Modal 사용 모달(ConsultantApplicationModal 등) → UnifiedModal 마이그레이션 | 제안 후 | component-manager → coder | ☑ |

---

## 트랙 B: Phase 2 — 카드·통계

| # | 항목 | 처리 가능 | 담당 | 완료 |
|---|------|-----------|------|------|
| B1 | StatCard / StatsCard / StatisticsCard 사용처 목록화 및 단일 진입점(common/StatCard 또는 DataCard) 제안 | ✅ | core-coder | ☑ |
| B2 | 통일 후보 컴포넌트 하나로 re-export 정리(예: StatCard.js에서 StatsCard·StatisticsCard re-export) | ✅ | core-coder | ☑ |
| B3 | GlassStatCard, DetailedStatsCard → StatCard variant 또는 layout prop으로 흡수(API 설계 후 구현) | 제안 후 | component-manager → coder | ☑ |
| B4 | StatisticsGrid, StatsCardGrid, DetailedStatsGrid → StatsGrid 단일 컴포넌트 또는 re-export | ✅ | core-coder | ☑ |

---

## 트랙 C: Phase 5 — 배지·re-export 정리

| # | 항목 | 처리 가능 | 담당 | 완료 |
|---|------|-----------|------|------|
| C1 | `admin/mapping-management/integrated-schedule/atoms/StatusBadge.js` re-export 제거 — 사용처를 `common/StatusBadge` 직접 import로 변경 | ✅ | core-coder | ☑ |
| C2 | RemainingSessionsBadge re-export 제거 — integrated-schedule/atoms 사용처를 common 직접 import로 변경 | ✅ | core-coder | ☑ |
| C3 | NotificationBadge 이중 구현(common vs dashboard-v2/atoms) → 하나로 통일, 다른 쪽 re-export | ✅ | core-coder | ☑ |
| C4 | FilterBadge·PipelineStepBadge 등 도메인 배지 스타일을 StatusBadge variant/토큰에 맞춤 | 제안 후 | component-manager → coder | ☑ |

---

## 실행 순서 (병렬)

- **동시 실행**: 트랙 A, B, C의 ✅ 항목(A1~A4, B1~B2·B4, C1~C3)을 **core-coder**가 한 번에 처리 가능.
- **제안 후 실행**: A5, B3, C4는 core-component-manager 제안서 수령 후 core-coder가 진행.

---

## 코어 코더 위임 시 전달 프롬프트 요약

- **문서**: `COMPONENT_COMMONIZATION_CANDIDATES.md`, `COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md`
- **범위**: 트랙 A(A1~A4), 트랙 B(B1, B2, B4), 트랙 C(C1~C3) — "처리 가능" 체크된 항목.
- **완료 기준**: re-export 정리·단일 진입점 확보·import 경로 변경·deprecated 주석 추가. 기존 동작 유지.
- **산출**: 수정한 파일 목록 + 체크리스트 완료 표시(문서 내 ☐ → ☑).
