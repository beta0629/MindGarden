# 매칭관리 배지·환불 가시화 — 기획 재위임

**작성일**: 2026-02-12  
**목적**: 사용자 보고("적용이 안되어 있어")를 반영하여, 매칭관리 배지·환불 버튼 가시성 적용을 **기획에 다시 위임**하고, 요구사항·검증 기준을 명확히 한 뒤 코더 실행으로 이어지도록 한다.

---

## 1. 현재 상황 요약

### 1.1 기존 계획

- **계획서**: `docs/planning/MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_PLAN.md`
- **분석서**: `docs/debug/MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_ANALYSIS.md`
- **태스크**: T1 토큰 수정, T2 테이블 뷰 StatusBadge 적용, T3 환불 버튼 B0KlA 가시성 선택자 보강, (선택) T4 KPI·필터 점검

### 1.2 사용자 보고 (2026-02-12)

- **증상**: "적용이 안되어 있어" — 매칭관리 화면에서 **배지** 및 **환불 버튼**에 대한 가시성 개선이 화면에 반영되지 않은 것으로 보임.
- **요청**: "환불 버튼도 마찬가지 **다시 기획에 위임해**"

### 1.3 사용자가 제공한 DOM 정보 (참고)

| 위치 | 요소 | 클래스/내용 |
|------|------|-------------|
| 리스트 행 메인 | `div.mg-v2-mapping-list-row__main` | 예: "결제 확인 김선희 → 이재학 단회기 80,000원 …", "종료 이가든 → 김아름 …" |
| 상태 배지 (리스트) | `span.mg-v2-status-badge.mg-v2-badge--success.mg-v2-mapping-list-row__status` | "활성 매핑" |
| 상태 배지 (리스트) | `span.mg-v2-status-badge.mg-v2-badge--warning.mg-v2-mapping-list-row__status` | "결제 대기" |
| 환불 버튼 | `button.mg-v2-button.mg-v2-button--danger.mg-v2-button--small` | "환불" |

- **페이지 경로**: `div#root > … > div.mg-v2-ad-b0kla.mg-v2-ad-dashboard-v2 > … > div.mg-v2-ad-b0kla.mg-v2-mapping-management > … > section.mg-v2-content-section.mg-v2-mapping-list-block > … > div.mg-v2-mapping-list-row`

즉, **배지와 환불 버튼은 DOM에 존재**하나, 사용자 체감상 **가시성 개선(색상·대비·시인성)이 “적용되지 않은” 상태**로 보인다.

---

## 2. 기획 재위임 사유

1. **구현 적용 여부 불명**: T1~T3가 코드에 반영되었는지, 배포/캐시로 인해 화면에 안 보이는지 사용자·기획 관점에서 구분 필요.
2. **요구 범위 재정의**: "가시화"가 **(A) 스타일만(색상·대비 강화)** 인지, **(B) 노출 조건(어떤 상태에서만 환불 버튼/배지 표시)** 까지 포함하는지 기획에서 명확히 할 필요.
3. **검증 기준 정리**: "적용됐다"를 어떻게 확인할지(화면 캡처, 특정 토큰 값, 노출 조건) 기획이 정한 뒤 코더·QA에 전달할 필요.

---

## 3. 기획에게 요청할 내용

### 3.1 범위 확정

- [ ] **배지 가시성**: (1) **스타일만** — B0KlA/공통 토큰으로 색·대비 개선. (2) **노출 조건** — 특정 상태에서만 배지 표시 등 추가 규칙이 있는지.
- [ ] **환불 버튼 가시성**: (1) **스타일만** — B0KlA 가시성 강화(진한 빨강·테두리·그림자) 적용. (2) **노출 조건** — 예: "ACTIVE만 환불 버튼 표시", "종료/결제대기에는 비표시" 등 규칙 정리.

### 3.2 실행·검증 재정리

- [ ] **T1~T3**가 이미 코드에 반영된 상태인지, **미반영**이면 Phase 1~3를 **core-coder**에 다시 할당할지 결정.
- [ ] **검증 방법** 명시:  
  - 매칭관리 페이지 접속 → 카드/테이블 뷰 전환 → 배지 색상·라벨 가독성, 환불 버튼 색·대비 확인.  
  - 필요 시 배포/빌드·캐시 무효화 후 재확인 절차 포함 여부.
- [ ] **완료 기준 문구**: 예) "테이블 뷰에서도 리스트 뷰와 동일한 배지 색상·대비가 적용되어 보인다", "환불 버튼에 B0KlA 가시성 강화 스타일이 적용되어 눈에 띄게 보인다".

### 3.3 문서·분배 업데이트

- [ ] `MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_PLAN.md`에 **재위임 사유·현재 DOM 요약·검증 기준**을 반영하거나, 본 문서(`MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_HANDOFF.md`)를 계획서의 "기획 재검토" 절로 참조.
- [ ] 범위·검증 확정 후 **분배실행 표** 갱신 및 **core-coder** 호출 시 §5 체크리스트와 함께 전달.

---

## 4. 참조 문서

| 문서 | 용도 |
|------|------|
| [MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_PLAN.md](./MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_PLAN.md) | 기존 태스크(T1~T4), 분배실행 표, 코더 체크리스트 |
| [MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_ANALYSIS.md](../debug/MAPPING_MANAGEMENT_BADGE_REFUND_VISIBILITY_ANALYSIS.md) | 배지/환불 가시성 원인 분석, 수정 제안 |

---

## 5. 다음 단계 (기획 실행)

1. **기획(core-planner)** 이 본 문서와 기존 계획서·분석서를 검토.
2. §3 항목(범위 확정, 실행·검증 재정리, 문서·분배 업데이트)을 정리한 뒤, 필요 시 **core-coder**에 Phase 1~3 재호출 또는 수정안 전달.
3. 완료 시 "매칭관리 배지·환불 가시화 적용 완료" 및 검증 결과를 사용자·관계자에게 공유.
