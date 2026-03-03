# Planning — 기획·설계 문서

기능·역할·메뉴·권한·ERP 섹션 점검·테스트 시나리오 등 **기획·설계 문서**가 모여 있는 폴더입니다.

---

## ERP 관련 (최근 추가)

| 문서 | 설명 |
|------|------|
| [ERP_SECTION_AUDIT_AND_PLANNING.md](./ERP_SECTION_AUDIT_AND_PLANNING.md) | **ERP 섹션 전방위 점검 및 기획 종합** — 프론트 라우트·LNB·백엔드 API 목록, 테넌트 적용/미적용 지점, 오류 가능 지점·수정 제안, 메뉴·레이아웃 회의, Phase 1~4 우선순위 및 서브에이전트 위임 요약 |
| [ERP_LAYOUT_DESIGN_REVIEW.md](./ERP_LAYOUT_DESIGN_REVIEW.md) | **ERP 레이아웃·UI 검토** — 페이지별 AdminCommonLayout 사용 여부, 어드민 샘플과 비교, 본문 구조(ContentArea/ContentHeader vs erp-container·mg-dashboard-layout), 개선점·주의점 |
| [ERP_TENANT_ISOLATION_SCENARIOS.md](./ERP_TENANT_ISOLATION_SCENARIOS.md) | **ERP 테넌트 격리 시나리오** — Phase 4 검증용. 테넌트 A/B 데이터 격리(Items, Purchase Requests, Finance, Budgets), tenantId 없이 호출 시 400/403 반환 시나리오, 검증 시 주의사항 |
| [ERP_TEST_SCENARIOS.md](./ERP_TEST_SCENARIOS.md) | **ERP E2E·통합 테스트 시나리오** — 기존 테스트 현황(백엔드·Playwright), API 통합 테스트 시나리오(제안), E2E 시나리오(제안), 구현 제안 요약. TESTING_STANDARD·ERP_TENANT_ISOLATION_SCENARIOS 참조 |

---

## 메뉴·권한·역할

| 문서 | 설명 |
|------|------|
| [MENU_PERMISSION_SYSTEM_OVERVIEW.md](./MENU_PERMISSION_SYSTEM_OVERVIEW.md) | 현재 시스템 메뉴·권한 구조 요약 — 역할 정의, 메뉴 노출 경로(/admin 라우트·LNB), 권한 코드·편의 함수, 역할별 메뉴 그룹, 백엔드 메뉴 API, 재조정 시 체크 포인트 |
| [ROLE_SIMPLIFICATION_AND_TENANT_DEFAULT_ROLES.md](./ROLE_SIMPLIFICATION_AND_TENANT_DEFAULT_ROLES.md) | 역할 단순화(ADMIN, STAFF, CONSULTANT, CLIENT) 및 테넌트 기본 역할 — 정의 위치, tenant_roles·공통코드 ROLE, 단순화 제안(CLIENT/CONSULTANT/ADMIN/SUBADMIN), ERP 구분 규칙 |

---

## 상담·관리 통합

| 문서 | 설명 |
|------|------|
| [CONSULTANT_CLIENT_UNIFIED_MANAGEMENT_REVIEW.md](./CONSULTANT_CLIENT_UNIFIED_MANAGEMENT_REVIEW.md) | 상담사·내담자 관리 통합 검토 — 라우트·메뉴·컴포넌트·API·UI 차이, 통합 vs 분리 검토, 통합 시 Phase 1~4 실행 계획 |

---

## 상위 인덱스

- **문서 진입점**: [docs/README.md](../README.md)
