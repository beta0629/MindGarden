# 공통 배지 모듈 기획·제안서

**버전**: 1.0.0  
**작성일**: 2025-03-17  
**목표**: 앱 전역에서 배지를 일관되게 적용하고, 리스트/탭 이동 시에도 동일한 배지가 노출되도록 공통 배지 모듈을 도입·적용한다.  
**참조**: `docs/project-management/BADGE_COMPONENT_ANALYSIS_AND_PROPOSAL.md`, `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` §1.5, `core-solution-common-modules`, `core-solution-atomic-design`

---

## 1. 목표·배경

- **목표**: 공통 배지 모듈을 만들어 어드민 대시보드(B0KlA)·리스트·탭 등 전역에서 일관된 배지 UI를 사용하고, 리스트/탭 이동 시에도 동일한 배지가 노출되도록 공통화한다.
- **배경**: 현재 KPI 카드 배지, pill 탭, 상태 배지 등이 여러 곳에 흩어져 있고, 리스트/탭별로 배지 스타일·클래스가 상이하여 통일이 필요하다.

---

## 2. 현재 배지 사용처·중복 분석 요약

(상세 인벤토리는 `docs/project-management/BADGE_COMPONENT_ANALYSIS_AND_PROPOSAL.md` 참조.)

### 2.1 사용처 요약

- **공통(이미 등록)**: `StatusBadge`, `RemainingSessionsBadge`, `NotificationBadge`(common·dashboard-v2), `BadgeSelect`(선택 UI).
- **도메인/로컬**: Admin `PipelineStepBadge`, ERP `RefundHistoryTableBlock` 내부 상태 배지, billing `SubscriptionStatusBadge`, consultant `FilterBadge`, 기타 **인라인** `getStatusBadge`/`renderStatusBadge` 다수.
- **CSS·인라인**: CommonCodeList, SimpleLayout/SimpleHeader, ConsultantClientSection, AdminMessages, B0KlA KPI, ERP 재무/환불, 웰니스·시스템 알림 위젯 등 **40곳 이상**에서 배지 관련 클래스 사용.

### 2.2 중복·일관성 이슈

| 유형 | 내용 |
|------|------|
| **상태 배지** | common `StatusBadge` 외 RefundHistoryTableBlock·SubscriptionStatusBadge·각종 인라인 구현 → **공통 StatusBadge로 통합 가능**. |
| **알림/메시지 개수** | dashboard-v2 `NotificationBadge` 단일 소스 권장. SimpleLayout은 `notification-badge` 클래스만 직접 사용 → **NotificationBadge 컴포넌트로 통일**. |
| **중요/긴급/NEW** | AdminMessageListBlock(`mg-v2-badge-*`), WellnessNotificationList(`badge-important/urgent/new`), ClientMessageWidget, SystemNotificationWidget 등 **의미 동일·클래스·스타일 제각각**. |
| **KPI·pill** | B0KlA `mg-v2-ad-b0kla__kpi-badge`, PipelineStepBadge, 등급·필터 배지 등 **역할 유사·구현 분산**. |

---

## 3. 공통 배지 모듈 스펙

### 3.1 컴포넌트명·위치

| 항목 | 내용 |
|------|------|
| **컴포넌트명** | **Badge** (공통 Atom) |
| **위치** | `frontend/src/components/common/Badge.js` (또는 `components/common/atoms/Badge.js` 로 구조 정리 시) |
| **스타일** | `Badge.css` — `unified-design-tokens.css`의 `.mg-badge`, `.mg-v2-badge`, `.mg-v2-status-badge` 및 B0KlA 관련 토큰(`--ad-b0kla-green` 등)과 연동. |

### 3.2 variant 구분

| variant | 용도 | 주요 props | 스타일 토큰 연동 |
|---------|------|------------|------------------|
| **status** | 상태 표시 (승인/대기/반려/활성 등) | `variant`: success \| warning \| neutral \| danger \| info, `label` 또는 children | `--mg-badge-status-*`, `.mg-v2-status-badge` |
| **count** | 숫자 강조 (알림 개수, 남은 회기 등) | `count` 또는 `value`, `maxDisplay`(예: 99+) | `mg-v2-count-badge`, `mg-v2-notification-badge` |
| **tab** / **pill** | 탭·필터 pill (표시용; 선택 상태는 상위에서 제어) | `label`, `selected`(boolean, 선택 시 스타일) | `mg-v2-filter-badge`, pill 형태 |
| **kpi** | KPI·숫자 강조 (B0KlA KPI, 파이프라인 단계 등) | `value`, `label`(선택), `variant`: green \| orange \| blue 또는 success \| warning \| info | `mg-v2-ad-b0kla__kpi-badge`, PipelineStepBadge 시각 정렬 |

### 3.3 공통 props 제안

- **variant**: `status` | `count` | `tab` | `pill` | `kpi`
- **size**: `sm` | `default` | `lg` (기존 `mg-badge--sm` 등과 매핑)
- **className**: 추가 클래스 (BEM·페이지별 보조용)
- **children** / **label** / **count** / **value**: variant별 표시 내용
- (선택) **maxCount**: count variant에서 99+ 등 캡

### 3.4 기존 공통 모듈과의 관계

- **StatusBadge**, **RemainingSessionsBadge**, **NotificationBadge**(dashboard-v2)는 **COMMON_MODULES_USAGE_GUIDE §1.5** 기준 **유지**.  
- 공통 **Badge**는 “일반 표시용 배지”의 단일 Atom으로 추가하고, 도메인별 래퍼(StatusBadge 등)는 **필요 시 내부에서 Badge 참조**하도록 점진적으로 통합·확장 가능.
- **BadgeSelect**는 선택 UI이므로 **별도 유지**. 필요 시 내부에서만 공통 Badge 참조 검토(옵션).

---

## 4. 적용 대상 리스트/탭·화면 목록

| 대상 | 배지가 나오는 위치 | 적용 방향 |
|------|--------------------|-----------|
| **어드민 대시보드 B0KlA** | KPI 카드, 매칭 리스트 상태, 파이프라인 단계 | KPI·단계 → Badge variant=kpi; 상태 → StatusBadge 유지, 토큰 정렬 |
| **어드민 알림/메시지** | LNB 메뉴 알림 개수, 메시지 리스트 탭, 상세 모달 | 알림 개수 → NotificationBadge; 메시지 타입·중요/긴급 → Badge variant=status 또는 동일 토큰 |
| **SimpleLayout GNB** | 알림 아이콘 옆 개수 | `notification-badge` 스팬 → **NotificationBadge**(dashboard-v2) 컴포넌트 사용 |
| **시스템 알림 위젯/관리** | 미읽음 개수, 리스트 항목 중요/긴급 | Badge(count/status) 또는 NotificationBadge·StatusBadge로 통일 |
| **웰니스 알림 리스트** | 카드별 중요/긴급/NEW | Badge variant=status 또는 동일 시맨틱 variant |
| **클라이언트 메시지 위젯** | 미읽음 개수, 타입·중요/긴급 | count 배지 + Badge(status) |
| **ERP 재무/환불** | 필터 pill, 거래 타입, 환불 상태 | 필터 pill 유지 또는 Badge variant=tab; 환불 상태 → common StatusBadge; 거래 타입 → Badge variant=status |
| **매칭/매핑** | 카드·리스트 상태, 남은 회기 | StatusBadge·RemainingSessionsBadge 유지 (필요 시 내부 Badge 기반 리팩터) |
| **구독 관리(빌링)** | SubscriptionStatusBadge | StatusBadge 또는 Badge variant=status로 점진 교체 |
| **기타 인라인 상태** | PgConfigurationDetail, TenantProfile, ConsultationHistory, PaymentManagement 등 | 해당 위치에서 **common StatusBadge** 사용으로 통일 |

---

## 5. 적용 순서 (단계별)

- **Phase 1 (공통 Atom 추가)**  
  - 공통 **Badge** 컴포넌트 추가 (`components/common/Badge.js` + `Badge.css`).  
  - variant: status, count, tab, kpi 및 size, 디자인 토큰 연동.  
  - COMMON_MODULES_USAGE_GUIDE §1.5에 “일반 표시용 배지는 common/Badge(variant) 사용” 문구 보강.

- **Phase 2 (우선 적용 — 어드민·리스트/탭)**  
  - 어드민 대시보드 B0KlA: KPI·파이프라인 단계에 Badge variant=kpi 적용.  
  - 어드민 알림/메시지: 메시지 리스트·탭의 중요/긴급 등 Badge(또는 동일 토큰) 적용.  
  - SimpleLayout GNB: 알림 개수에 NotificationBadge(dashboard-v2) 적용.

- **Phase 3 (확대 적용)**  
  - 시스템 알림 위젯/관리, 웰니스 알림 리스트, 클라이언트 메시지 위젯에서 로컬 배지 → Badge/StatusBadge/NotificationBadge 적용.  
  - ERP 재무/환불: 환불 상태 → StatusBadge, 거래 타입 등 → Badge variant=status.

- **Phase 4 (정리·통합)**  
  - 구독 관리 SubscriptionStatusBadge → StatusBadge 또는 Badge 교체.  
  - 인라인 getStatusBadge/renderStatusBadge 사용처 → common StatusBadge 사용으로 치환.  
  - 필요 시 StatusBadge/RemainingSessionsBadge/NotificationBadge 내부를 공통 Badge 참조하도록 리팩터.

---

## 6. core-coder 전달용 체크리스트

구현 위임 시 아래를 core-coder 태스크에 포함한다.

- [ ] **공통 Badge 추가**: `components/common/Badge.js`(또는 `common/atoms/Badge.js`) 생성, variant(status/count/tab/pill/kpi), size(sm/default/lg), props(label, count, value, selected 등) 반영.
- [ ] **스타일**: `Badge.css`에서 `unified-design-tokens.css`의 `.mg-badge`, `.mg-v2-badge`, `.mg-v2-status-badge`, B0KlA KPI 배지 토큰과 연동.
- [ ] **Phase 2 적용**: B0KlA KPI·파이프라인 → Badge(kpi); 어드민 메시지 리스트/탭 → Badge(status) 또는 동일 토큰; SimpleLayout GNB 알림 → NotificationBadge(dashboard-v2) 사용.
- [ ] **Phase 3·4**: 위 §4·§5 대상 화면별로 로컬 배지 제거 후 Badge/StatusBadge/NotificationBadge 사용으로 교체.
- [ ] **문서 갱신**: `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` §1.5에 Badge 경로·variant·용도 보강; `docs/project-management/COMPONENT_COMMONIZATION_CANDIDATES.md` 또는 BADGE_COMPONENT_ANALYSIS_AND_PROPOSAL.md 갱신 여부 반영.

---

## 7. 디자인 확인 (선택)

- B0KlA·어드민 대시보드 스타일 가이드 반영 여부를 확인하려면 **core-designer**에게 아래와 같이 의뢰할 수 있다.  
- **의뢰 요약**: “공통 Badge 모듈 스펙(본 문서 §3)을 기준으로, B0KlA KPI 배지·상태 배지·pill 탭 배지가 unified-design-tokens 및 어드민 대시보드 샘플과 시각적으로 일치하는지 검토해 주세요. 필요 시 variant별 색·크기·둥글기 등 토큰 연동 제안.”

---

## 8. 분배실행 (실행 분배표)

| Phase | 담당 | 전달할 태스크 설명 요약 |
|-------|------|-------------------------|
| **Phase 1** | **core-coder** | `docs/planning/COMMON_BADGE_MODULE_PROPOSAL.md` §3·§6 체크리스트 1~2번에 따라 공통 Badge 컴포넌트 추가 및 디자인 토큰 연동. COMMON_MODULES_USAGE_GUIDE §1.5 보강. |
| **Phase 2** | **core-coder** | §4·§5 Phase 2 대상(어드민 B0KlA, 알림/메시지 리스트·탭, SimpleLayout GNB)에 Badge·NotificationBadge 적용. §6 체크리스트 3번. |
| **Phase 3~4** | **core-coder** | §4·§5 Phase 3·4 대상(시스템 알림, 웰니스, 클라이언트 메시지, ERP, 구독, 인라인 상태)에 Badge/StatusBadge/NotificationBadge 적용. §6 체크리스트 4~5번. |
| **(선택) 디자인 검토** | **core-designer** | §7 의뢰 요약대로 B0KlA·토큰과의 시각 일치 검토 및 variant별 토큰 제안. |

- **실행 순서**: Phase 1 → Phase 2 → Phase 3 → Phase 4. 디자인 검토는 Phase 1 전 또는 직후에 병렬로 요청 가능.
- **참조 스킬**: core-coder — `/core-solution-frontend`, `/core-solution-atomic-design`, `/core-solution-common-modules`; core-designer — B0KlA·`unified-design-tokens.css`.

---

## 9. 요약

- **현재**: 배지가 common(StatusBadge 등)·도메인·인라인·CSS 등 40곳 이상에 분산되어 있고, 리스트/탭별로 클래스·스타일이 상이함.
- **제안**: 공통 **Badge** Atom을 두고 variant(status/count/tab/pill/kpi)·size로 구분하며, 기존 StatusBadge·RemainingSessionsBadge·NotificationBadge는 유지·점진 통합.
- **적용**: 어드민 B0KlA, 알림/메시지 리스트·탭, SimpleLayout GNB → 시스템 알림·웰니스·ERP·구독·인라인 상태 순으로 단계 적용.
- **다음 단계**: 사용자 확인 후 **core-coder**를 §8 분배실행 표대로 호출하고, §6 체크리스트로 완료 여부를 검증한다.
