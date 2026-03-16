# 환불 관리 시스템 — 새 레이아웃·아토믹 디자인 스펙

**작성일**: 2025-03-16  
**담당**: core-planner (오케스트레이션)  
**목적**: 환불 관리 시스템 페이지를 기획부터 완전히 새로운 레이아웃으로 재구성하고, 아토믹 디자인을 적용한다. 예약금은 수기 처리만 하며, 환불은 회의 권장 방법(REFUND_SYSTEM_MEETING_RESULT.md)대로 반영한다.

---

## 1. 목표·범위

### 1.1 목표

- **환불 관리 시스템** 화면에 **아토믹 디자인**(Atoms → Molecules → Organisms → Templates → Pages) 적용.
- **완전히 새로운 레이아웃**: 마인드가든 어드민 대시보드 스타일(B0KlA) 기준으로 상단 KPI/카드, 필터, 테이블/리스트, 버튼 배치·반응형 재설계.
- **예약금**: 사용하지 않음 → **수기 처리만** 명시. 화면/로직에 예약금 자동화 반영하지 않음.
- **환불 처리**: `docs/project-management/REFUND_SYSTEM_MEETING_RESULT.md` 권장 방법(ERP 수동 반영 또는 ERP 콜백, 결제 단계별 환불 UI)을 스펙에 반영하고, 구현은 서브에이전트(core-coder)로 진행.

### 1.2 범위

| 포함 | 제외 |
|------|------|
| 환불 관리 페이지(경로: `/erp/refund-management`) 전면 재구성 | 다른 ERP 페이지 레이아웃 변경 |
| 환불 건수·금액·회기·연동 상태·필터·환불 이력 테이블·사유별 통계·회계 현황 | 환불 실행 버튼은 매칭 관리 페이지에만 유지(회의 결과대로) |
| AdminCommonLayout + ContentHeader + ContentArea 사용 | 예약금 자동화·예약금 전용 UI |
| B0KlA·unified-design-tokens·반응형 | — |

### 1.3 예약금 수기 처리 명시

- **예약금**: 초기 상담용 예약금은 **사용하지 않기로 결정** → **수기 처리**.
- 환불 관리 화면에는 **예약금 노출/입력 필드 없음**. 환불 현황·이력·연동 상태 중심.
- 결제 단계별 환불 가능 구간은 회의 결과(§3)대로만 반영(예: PAYMENT_CONFIRMED 시 예약금 환불/전액 취소는 매칭 관리 쪽에서 처리).

---

## 2. 환불 권장 방법 반영 (회의 결과 요약)

`REFUND_SYSTEM_MEETING_RESULT.md` 기준으로 다음을 스펙·구현에 반영한다.

### 2.1 ERP 환불 반영

- **권장 1 — 수동 반영**: "ERP 환불 반영" 버튼/API로 관리자가 우리 쪽만 갱신. (예: `POST …/mappings/{id}/reflect-erp-refund`)
- **권장 2(선택)**: ERP 콜백 연동 시 우리 수신 API 설계·인증·멱등.
- 환불 관리 페이지에서 **조회·통계·연동 상태** 표시; **환불 실행 버튼은 매칭 관리 페이지**에서만 노출하는 구조 유지.

### 2.2 환불 관리 페이지에 둘 기능 스펙

- **상단**: KPI 카드(환불 건수, 환불 금액, 환불 회기, 연동 상태).
- **필터**: 기간·상태 선택, 새로고침, 엑셀 내보내기(추후 구현 가능).
- **테이블**: 환불 이력(환불일시, 내담자, 상담사, 패키지, 환불 회기, 환불 금액, 환불 사유, ERP 상태).
- **ERP 환불 반영**: 이력 행 또는 상단 액션에 **"ERP 환불 반영" 수동 트리거** 버튼/연동 여부를 디자이너 산출에 반영. (수동 반영 API 연동 포인트 명시)

### 2.3 결제 단계별 환불 UI (참고)

- 결제 단계별 환불 버튼 노출은 **매칭 관리 페이지**에서 처리. (PENDING_PAYMENT 전액 취소, PAYMENT_CONFIRMED 예약금/전액, DEPOSIT_PENDING~ACTIVE 전액+부분, TERMINATED/SESSIONS_EXHAUSTED 비노출)
- 본 문서는 **환불 관리 페이지** 레이아웃·아토믹 구조만 정의.

---

## 3. 아토믹 디자인 목표 구조

아토믹 계층은 **core-publisher** 산출에서 구체화된다. 아래는 목표 구조 요약.

| 계층 | 내용 (목표) |
|------|-------------|
| **Atoms** | 버튼, 라벨, 아이콘, 배지, 입력(select 등). 디자인 토큰·BEM 적용. |
| **Molecules** | 카드 한 장, 필터 그룹(기간+상태), 테이블 행 한 줄, KPI 셀. |
| **Organisms** | 환불 KPI 블록(카드 4열), 필터+테이블 상단 제어 블록, 환불 이력 테이블, 환불 사유별 통계 블록, ERP 연동 상태 블록, 회계 처리 현황 블록. |
| **Template** | AdminCommonLayout + ContentHeader + 본문(Organisms 배치 순서 고정). |
| **Page** | RefundManagement 페이지: 데이터 로드·필터 상태·API 연동·이벤트. |

---

## 4. 섹션별 구성 (레이아웃 요구사항)

- **상단**: ContentHeader — 제목 "환불 관리 시스템", 부제 "상담 환불 현황 및 환불·결제 연동", 액션 "운영 현황으로 돌아가기".
- **본문 순서**:  
  1) 환불 KPI 블록(환불 건수, 환불 금액, 환불 회기, 연동 상태)  
  2) 필터 및 제어(기간, 상태, 새로고침, 엑셀 내보내기)  
  3) 환불 이력 테이블(페이지네이션)  
  4) 환불 사유별 통계  
  5) ERP 동기화 상태  
  6) 회계 처리 현황  

- **반응형**: 데스크톱에서 카드 그리드·테이블 가로 스크롤; 태블릿/모바일에서 카드 세로 쌓기·테이블 카드형 또는 스크롤. (디자이너 산출에서 구체화)

---

## 5. 컴포넌트 매니저 조사 결과 (반영 위치)

**Phase 1** **core-component-manager** 산출 반영됨.

- **산출 문서**: `docs/project-management/REFUND_MANAGEMENT_COMPONENT_SURVEY.md`
- **요약**: 라우트 `/erp/refund-management`, 페이지 `RefundManagement.js`, 6개 섹션(RefundStatsCards, RefundFilters, RefundHistoryTable, RefundReasonStats, ErpSyncStatus, RefundAccountingStatus). Organism 수준은 분리되어 있으나 Atoms/Molecules는 refund 전용 없이 ErpCard·ErpButton만 사용. 제안: StatValue·StatusBadge(Atom), StatCard·FilterGroup·DataTableRow(Molecule) 추출, BEM·디자인 토큰 통일, StatCard로 통계 카드 공통화.

---

## 6. 디자이너·퍼블리셔 산출 참조

- **core-designer**: 마인드가든 어드민 대시보드(B0KlA) 기준 새 레이아웃 제안 — 상단 KPI/카드, 필터, 테이블, 버튼 배치, 반응형. 예약금 노출 없음, 환불 현황·이력·연동 상태 중심. "ERP 환불 반영" 수동 트리거 위치 제안.
- **core-publisher**: 위 레이아웃을 아토믹 디자인으로 마크업 구조 제안 — Atoms/Molecules/Organisms/Template/Page, BEM·시맨틱·접근성.

→ **산출물 경로**: 설계·마크업 문서 저장 위치를 여기 명시. (예: `docs/design-system/REFUND_MANAGEMENT_LAYOUT_SPEC.md`, `docs/design-system/REFUND_MANAGEMENT_ATOMIC_MARKUP.md`)

---

## 7. 구현 체크리스트

### 7.1 아토믹 컴포넌트 생성·교체 순서

- [ ] **Atoms**: 버튼·라벨·배지·아이콘 등 — 기존 `ErpButton`·공통 컴포넌트와 통합 또는 `refund/atoms/` 등으로 정리.
- [ ] **Molecules**: KPI 카드 1개, 필터 그룹 1줄, 테이블 행 1줄 — `refund/molecules/` 생성.
- [ ] **Organisms**: 환불 KPI 블록, 필터+제어 블록, 환불 이력 테이블, 사유별 통계, ERP 연동 상태, 회계 현황 — `refund/organisms/` 생성.
- [ ] **Template/Page**: 기존 `RefundManagement.js`를 새 Organisms 조합으로 교체, AdminCommonLayout 유지.
- [ ] 스타일: `unified-design-tokens.css`, B0KlA·mg-v2-ad-b0kla__* 클래스 적용. 기존 RefundStatsCards.css 등 점진적 정리.

### 7.2 환불 관련 API·이벤트 연동 포인트

- [ ] `/api/admin/refund-statistics?period=`, `/api/admin/refund-history?page=&size=&period=&status=`, `/api/v1/admin/erp-sync-status` — 기존 유지 또는 `/api/v1/admin/...` 통일.
- [ ] "ERP 환불 반영" 수동 트리거: `POST /api/v1/admin/mappings/{id}/reflect-erp-refund` (또는 동등) API 연동 및 버튼 배치(이력 행 또는 상단).
- [ ] 예약금 자동화 미반영(수기 처리만).

### 7.3 검증

- [ ] 새 페이지에서 KPI·필터·테이블·버튼이 스펙대로 동작하는지 확인.
- [ ] 아토믹 계층(Atoms/Molecules/Organisms)이 코드 구조와 일치하는지 확인.
- [ ] 반응형(데스크톱·태블릿·모바일) 확인.

---

## 8. 분배실행 (서브에이전트 호출 순서)

아래 순서로 서브에이전트를 호출하고, 결과를 기획(core-planner)에게 보고한 뒤 취합해 사용자에게 최종 보고한다.

| Phase | 서브에이전트 | 목표 | 호출 시 전달할 태스크 설명 |
|-------|--------------|------|---------------------------|
| **1** | **core-component-manager** | 현재 환불 관리 페이지 구조 조사·아토믹 적용 여부·개선 포인트 정리 | "환불 관리 시스템 페이지를 조사해 주세요. 경로·라우트, 사용 컴포넌트 목록(RefundManagement, RefundStatsCards, RefundFilters, RefundHistoryTable, RefundReasonStats, ErpSyncStatus, RefundAccountingStatus 등), 섹션별 구성(환불 건수, 환불 금액, 환불 회기, 연동 상태, 필터, 환불 이력 테이블). 아토믹 계층(Atoms/Molecules/Organisms) 적용 여부와 개선 포인트를 정리한 제안서를 작성해 docs/project-management/ 또는 지정 위치에 저장하고, 해당 경로를 기획에게 보고해 주세요." |
| **2a** | **core-designer** | 새 레이아웃·비주얼 설계 | "docs/project-management/REFUND_MANAGEMENT_NEW_LAYOUT_SPEC.md를 참조해 환불 관리 시스템의 완전히 새로운 레이아웃을 설계해 주세요. 마인드가든 어드민 대시보드 스타일(B0KlA, admin-dashboard-sample) 기준. 사용성: 관리자가 환불 현황·이력·연동 상태를 한눈에 보고 필터로 기간/상태를 바꾸며, 필요 시 ERP 환불 반영 수동 트리거를 사용. 정보 노출: 예약금 노출/입력 없음, 환불 건수·금액·회기·연동 상태·이력 테이블·사유별 통계·회계 현황. 레이아웃: 상단 KPI 카드 4열, 필터+제어, 환불 이력 테이블, 사유별 통계, ERP 동기화, 회계 현황 순서. 반응형 전제. ERP 환불 반영 버튼/액션 배치 제안. 산출: 화면별 레이아웃·블록 구성·디자인 토큰·클래스명 제안을 docs/design-system/ 등에 저장하고 경로를 기획에게 보고." |
| **2b** | **core-publisher** | 아토믹 마크업 구조 제안 | "docs/project-management/REFUND_MANAGEMENT_NEW_LAYOUT_SPEC.md와 core-designer 산출(가능하면 참조)을 바탕으로 환불 관리 페이지를 아토믹 디자인으로 마크업 구조를 제안해 주세요. Atoms(버튼, 라벨, 아이콘, 배지), Molecules(카드 1개, 필터 그룹, 테이블 행), Organisms(KPI 블록, 필터+테이블 블록, 환불 이력 테이블, 사유별 통계, ERP 연동, 회계 현황), Template/Page. BEM·시맨틱 HTML·접근성(aria, role, label) 반영. 코드 작성 없이 HTML 조각·클래스·구조 문서로 docs/design-system/ 등에 저장하고 경로를 기획에게 보고." |
| **3** | **core-coder** | 새 레이아웃+아토믹 구현 | "docs/project-management/REFUND_MANAGEMENT_NEW_LAYOUT_SPEC.md와 디자이너·퍼블리셔·컴포넌트 매니저 산출을 기준으로 환불 관리 시스템 페이지를 새 레이아웃과 아토믹 디자인으로 구현해 주세요. 기존 RefundManagement 페이지를 새 컴포넌트 구조(Atoms/Molecules/Organisms)로 교체하고, AdminCommonLayout 유지. 환불 관련 동작은 REFUND_SYSTEM_MEETING_RESULT.md 권장 방법대로: 수동 반영 버튼/API 연동, 결제 단계별 환불 가능 구간은 회의 문서 참고(환불 실행은 매칭 관리 쪽). 예약금 자동화는 넣지 않고 수기 처리만 명시. 적용 스킬: core-solution-frontend, core-solution-atomic-design, core-solution-api." |
| **4** | **core-planner 또는 검증** | 검증 | 새 페이지에서 KPI·필터·테이블·버튼 동작, 아토믹 계층 일치 여부 확인. (필요 시 core-tester 호출) |

- **Phase 2a·2b**는 **병렬 호출 가능** (디자이너와 퍼블리셔 동시 진행).
- **Phase 3**은 Phase 1·2 완료 후 진행 (스펙·산출물 확정 후 코더 호출).

---

**문서 끝.**  
컴포넌트 매니저·디자이너·퍼블리셔 산출 경로가 확정되면 §5·§6에 경로를 보완한다.
