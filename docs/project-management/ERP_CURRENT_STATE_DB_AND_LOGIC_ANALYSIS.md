# ERP 현황 분석 — DB·로직·리뉴얼/고도화 연계

**문서 버전**: 1.1  
**작성일**: 2026-04-09  
**최종 갱신**: 2026-04-09 (국세청·외부 기관 연동 현황)  
**상태**: 기준 분석(스키마·코드 기준); 운영 DB와의 완전 동기는 Flyway 이력·실제 `SHOW CREATE TABLE`로 주기적 검증 권장.  
**상위 문서**: [ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md](./ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md) (제품 원칙·페이즈·체크리스트 SSOT)

---

## 목차

1. [문서 목적](#1-문서-목적)  
2. [분석 범위·방법](#2-분석-범위방법)  
3. [DB 테이블 맵 (ERP 핵심)](#3-db-테이블-맵-erp-핵심)  
4. [엔티티·로직 레이어](#4-엔티티로직-레이어)  
5. [데이터·업무 흐름 (요약)](#5-데이터업무-흐름-요약)  
6. [현재 상태 진단](#6-현재-상태-진단)  
7. [리뉴얼·고도화 범위와 개선사항](#7-리뉴얼고도화-범위와-개선사항)  
8. [국세청·외부 기관 연동](#8-국세청외부-기관-연동--현황-및-검토-필요-사항)  
9. [다음 액션](#9-다음-액션)  
10. [참조 파일·마이그레이션](#10-참조-파일마이그레이션)

---

## 1. 문서 목적

- **현재 상황**을 DB 스키마·백엔드 로직 관점에서 한 장으로 요약한다.  
- [마스터 플랜](./ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md)의 **리뉴얼·고도화**와 연결해, **무엇을 손대면 UI/자동화/비전문가 친화(§1.3)에 도움이 되는지** 구분한다.  
- 이후 **explore** 배치 시 본 문서를 갱신·부록으로 두고, **스토어드 프로시저·배치·외부 연동**은 별도 인벤토리로 확장한다.

---

## 2. 분석 범위·방법

| 항목 | 범위 |
|------|------|
| DB | `src/main/resources/db/migration/*.sql` 중 ERP·재무·정산·분개 관련, 엔티티 `@Table` |
| Java | `com.coresolution.consultation.entity`(ERP·Budget), `entity/erp/**`, `service/**` 중 재무·ERP, `ErpController` 등 |
| 프론트 | 마스터 플랜 §4와 동일; 본 문서에서는 **백엔드 계약과의 정합** 위주 |

**한계**: 테이블 **최초 생성 DDL**이 초기 마이그레이션 외에 분산되어 있을 수 있음 → 필요 시 `information_schema` 기준 전수 조사를 **다음 액션**에 둔다.

---

## 3. DB 테이블 맵 (ERP 핵심)

### 3.1 수입·지출·일상 거래 축

| 테이블 | 역할 | 비고 |
|--------|------|------|
| **financial_transactions** | 수입/지출 등 **운영 거래**의 단일 레코드(테넌트 격리, 소프트 삭제) | 인덱스: `V60__add_composite_indexes_for_performance.sql` 등 |
| **common_codes** (+ 코드 그룹) | 카테고리·세부 분류·ERP 메뉴와 연동되는 **공통 코드** | `FinancialTransaction`은 `category_code_id` / `subcategory_code_id` 및 **문자열 category/subcategory 병행**(호환) |

### 3.2 회계·분개·원장 축 (전문가·감사 층)

| 테이블 | 역할 | 비고 |
|--------|------|------|
| **accounting_entries** | 분개 헤더(일지); `financial_transaction_id`로 **운영 거래와 연결** 가능 | `V20250314_001`, `V20251218_001`, `V20260228_003` 등 |
| **erp_journal_entry_lines** | 분개 **라인**(차변/대변) | `accounting_entries` FK, `V20260321_001` 등 |
| **erp_ledgers** | 기간·계정별 **원장** 집계 | `V20251218_002__create_erp_ledgers_table.sql` |

### 3.3 예산·정산

| 테이블 | 역할 | 비고 |
|--------|------|------|
| **erp_budgets** | 예산 엔티티(`Budget.java`) | API: `/api/v1/erp/budgets` 등 |
| **erp_settlement_rules** | 정산 규칙 | `V20251218_003__create_settlement_tables.sql` |
| **erp_settlements** | 정산 결과 | 동상 |

### 3.4 기타 연관

- **tenant_id** 전 테이블 공통 전제(멀티테넌트).  
- 아카데미·청구 등 **타 도메인** 테이블에 환불·결제 필드가 있을 수 있음 — ERP 화면과의 연동은 **별도 매핑 조사** 대상.

---

## 4. 엔티티·로직 레이어

### 4.1 주요 엔티티 (패키지)

| 경로 | 엔티티 | 테이블 |
|------|--------|--------|
| `entity/erp/financial/` | `FinancialTransaction` | `financial_transactions` |
| `entity/erp/accounting/` | `AccountingEntry`, `JournalEntryLine`, `Ledger` | `accounting_entries`, `erp_journal_entry_lines`, `erp_ledgers` |
| `entity/erp/settlement/` | `SettlementRule`, `Settlement` | `erp_settlement_rules`, `erp_settlements` |
| `entity/` | `Budget` | `erp_budgets` |

### 4.2 서비스·컨트롤러 (대표)

| 구분 | 역할 |
|------|------|
| `FinancialTransactionService` / `FinancialTransactionServiceImpl` | 거래 CRUD, 승인 상태, **운영 거래**의 비즈니스 규칙 |
| `ErpController` (`/api/v1/erp/...`) | 재무 거래·빠른 지출·대시보드·예산 등 **HTTP 경계** |
| `AccountingServiceImpl` 등 | **분개·원장·세금** — `financial_transaction`과의 연결은 회계 쪽 주석·로직 참조 |

### 4.3 API·프론트 정합 포인트

- 관리자 목록: `GET /api/v1/admin/financial-transactions` vs ERP: `GET /api/v1/erp/finance/transactions` — **경로·권한**이 다를 수 있음(정리 대상).  
- 거래 수정·삭제·단건 조회는 **컨트롤러·권한 코드**와 함께 진화 중 — 마스터 플랜 구현 배치와 동기화.

---

## 5. 데이터·업무 흐름 (요약)

```text
[사용자 입력: 수입/지출·빠른 지출]
        ↓
financial_transactions (운영 단일 레코드, 카테고리·금액·일자)
        ↓ (연동 시)
accounting_entries (+ erp_journal_entry_lines) ← 회계·분개·감사 층
        ↓
erp_ledgers / 리포트·대시보드
```

- **비전문가 친화(마스터 플랜 §1.3)**: 일상 업무는 **상단 흐름의 단순 모델**만 노출하고, 분개·원장은 **자동 반영·요약·필요 시에만** 드러나도록 UI·카피를 설계하는 것이 방향과 일치한다.

---

## 6. 현재 상태 진단

| 영역 | 관찰 | 리스크·기술부채 |
|------|------|-----------------|
| **스키마** | 거래·분개·원장·예산·정산이 **별 테이블**로 존재 | 도메인 경계는 명확하나, **프론트가 어느 층까지 노출할지** 미정리 시 화면이 복잡해짐 |
| **FinancialTransaction** | CommonCode FK + **문자열 category/subcategory 병행** | 이중 표현 동기화·쿼리 일관성 관리 필요 |
| **권한** | 거래 삭제 등 `FINANCIAL_TRANSACTION_DELETE` 등 **세분 권한** | UI와 DB 연산이 불일치하면 403/빈 화면 혼선 |
| **회계 깊이** | 분개 UI(예: IntegratedFinanceDashboard 일부)는 **전문 사용자** 성격 | §1.3과 충돌 시 “고급” 영역으로 격리 필요 |
| **Flyway** | 마이그레이션 다건·정리 스크립트(`V20260320_001` 등) 존재 | 운영 적용 순서·롤백은 배포 표준 문서 준수 |

---

## 7. 리뉴얼·고도화 범위와 개선사항

상위 [마스터 플랜](./ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md)의 **P0~P3**와 아래를 **함께** 본다.

### 7.1 DB·백엔드에서의 “고도화” 후보

| 우선순위 | 개선 | 기대 효과 |
|----------|------|-----------|
| P | `financial_transactions` ↔ `accounting_entries` 연결 규칙 문서화(언제 분개가 생기는지) | 비전문가 UX와 회계 정합 설명 가능 |
| P | 카테고리 **단일 소스**(코드 FK 우선, 문자열 점진 폐기 계획) | 데이터 품질·리포트 신뢰도 |
| P | 감사용: 수정·삭제 **이력**(누가·언제) 요구 시 스키마/로그 설계 | 운영·컴플라이언스 |
| S | 원장·정산 **배치**와 API 응답 캐시 전략 | 대시보드 성능 |

(P=필수 검토 권장, S=여력 시)

### 7.2 UI·제품(§1.3)과의 연결

| 마스터 플랜 항목 | DB·로직 측 지원 |
|------------------|-----------------|
| 자동화 | 빠른 지출·세금 계산·분개 연동을 **백엔드에서 일관**되게; 프론트는 결과·요약만 표시 |
| 비전문가 언어 | API 응답에 **내부 계정코드**만 노출하지 않도록 DTO·라벨 매핑 |
| 실수 방지 | 금액·일자·승인 상태에 대한 **서버 검증**과 트랜잭션 경계 명확화 |

### 7.3 리뉴얼 범위에서 “당장 하지 않을 것” (합의용)

- 회계 도메인 **대개편**(표준 계정과목 전면 도입 등)은 별 문서·페이즈.  
- 본 문서는 **현재 구조를 전제로 한 개선·UI 정합**을 우선한다.

---

## 8. 국세청·외부 기관 연동 — 현황 및 검토 필요 사항

### 8.1 저장소 기준 결론 (코드·문서 조사)

| 구분 | MindGarden / Core Solution 현황 |
|------|----------------------------------|
| **국세청·홈택스 직접 API** | **구현 없음.** 세금 신고·연말정산·국세청 연동용 클라이언트·인증·전송 로직은 코드베이스에 없다. (`docs/debug/SALARY_TAX_LOGIC_ANALYSIS.md`, `docs/project-management/SALARY_TAX_INTEGRATION_MEETING_RESULT.md` 등에서 동일 확인) |
| **전자세금계산서(국세청 전자세금계산서)** | **미구현.** 아카이브 로드맵에 API·테이블 설계 아이디어만 존재 (`docs/project-management/archive/ERP_ADVANCEMENT_PLAN.md` 등). |
| **세무 중개(바로빌·팝빌 등)** | **연동 코드 없음** (해당 키워드 검색 시 ERP 구현 부재). |
| **급여·원천징수** | 급여·세금은 **내부 DB·프로시저·TaxCalculationUtil(부가세 등)** 중심이며, **신고 파일 생성·국세청 제출** 자동화는 없음. |

즉, **“국세청과 연동 가능한가?”**에 대해 **현재 제품은 연동되지 않았고**, 연동을 하려면 **별도 설계·인증·계약**이 필요하다.

### 8.2 연동을 검토할 때의 일반 전제 (제품·보안·법무와 합의)

아래는 구현 지시가 아니라 **검토 체크리스트**이다. 실제 가능 여부·의무는 **국세청·관련 법령·사업자 유형**에 따르므로 **전문가(세무·법무) 검토**가 선행되어야 한다.

| 영역 | 검토 포인트 |
|------|-------------|
| **전자세금계산서·전자신고** | 국세청은 일반적으로 **공인된 전자세금계산서 발행/수집 체계**(또는 **공인 중개 매체**)를 통한 연동이 관례이다. 앱이 직접 “홈택스 로그인”을 대신하는 형태는 보안·책임 범위 측면에서 **별도 설계**가 필요하다. |
| **인증·키·테넌트** | 사업자 단위 인증서·API 키·테넌트별 과금/격리 — MindGarden **멀티테넌트** 모델과 정합 필요 (`tenantId`·비밀 저장소). |
| **데이터 최소화** | 신고에 필요한 필드만 수집·전송; PII·급여·거래 원장의 **보관 기간·암호화** 정책. |
| **기타 외부 기관** | **4대보험 EDI**, **은행·오픈뱅킹**, **카드·PG(토스 등)** 는 각각 **별도 API·계약**이며, 본 저장소에는 PG 등 일부만 존재할 수 있음 — ERP **세무 신고**와는 별 트랙으로 관리하는 것이 안전하다. |

### 8.3 권장 다음 단계 (기획·아키텍처)

1. **요구 범위 확정**: “전자세금계산서 발행만”, “부가세 신고 자료 Export”, “원천징수 이행상황신고 파일” 등 **납품 범위**를 문서화.  
2. **대안 비교**: 국세청 연동 **공식 경로** vs **공인 업체(SaaS)** 중개 연동 — 개발·운영·감사 비용 비교.  
3. **PoC**: 인증·샌드박스 가능한 경로 하나만 선정해 **연결성·오류 처리** 검증.  
4. 본 문서·[마스터 플랜](./ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md)에 **“외부 세무 연동” 페이즈**를 두고, 구현은 **core-coder** 위임 + 보안·운영 게이트.

---

## 9. 다음 액션

1. **explore**: `frontend/src/components/erp/**`와 본 문서 §3~4를 대조해 **화면 단위로 “어떤 테이블/API를 쓰는지”** 표 작성.  
2. **DB**: 운영/개발에서 `financial_transactions`, `accounting_entries` **행 수·샘플**은 민감정보 주의 하에 스테이징만 검토.  
3. **프로시저**: ERP·정산 관련 **stored procedure** 목록은 `db/migration`·`scripts` 검색 후 부록 추가.  
4. 마스터 플랜 **§8.1** 체크리스트 완료 시 본 문서 **§6**을 업데이트한다.  
5. **국세청·외부 세무 연동**이 제품 로드맵에 들어가면 **§8.2~8.3**을 기준으로 별도 **기획서·보안 검토서**를 작성하고, 본 절에 **결정 요약(한 페이지)** 을 링크한다.

---

## 10. 참조 파일·마이그레이션

| 유형 | 예시 경로 |
|------|-----------|
| 마이그레이션 | `V20251218_001__extend_accounting_entries_for_journal_system.sql`, `V20251218_002__create_erp_ledgers_table.sql`, `V20251218_003__create_settlement_tables.sql`, `V60__add_composite_indexes_for_performance.sql`, `V20260408_001__tenant_metadata_finance_expense_code_groups.sql` |
| 엔티티 | `entity/erp/financial/FinancialTransaction.java`, `entity/erp/accounting/*.java`, `entity/Budget.java` |
| 서비스 | `service/impl/FinancialTransactionServiceImpl.java`, `service/erp/financial/FinancialTransactionService.java` |
| API | `controller/erp/ErpController.java` |
| 세무·급여(외부 연동 없음 근거) | `docs/debug/SALARY_TAX_LOGIC_ANALYSIS.md`, `docs/project-management/SALARY_TAX_INTEGRATION_MEETING_RESULT.md` |

---

## 문서 변경 이력

| 버전 | 일자 | 요약 |
|------|------|------|
| 1.0 | 2026-04-09 | 최초 작성 — DB 맵·로직 레이어·진단·개선 후보·마스터 플랜 연계 |
| 1.1 | 2026-04-09 | §8 국세청·외부 기관 연동 현황·검토 체크리스트·다음 액션(기획·보안) |
