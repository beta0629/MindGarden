# MindGarden 문서 인덱스 (진입점)

**문서 찾기는 여기서 시작하세요.**  
**문서 추가·이동·삭제·구조 변경은 문서관리 서브에이전트 전담입니다.** (규칙: `.cursor/skills/core-solution-documentation/SKILL.md`)

---

## 문서 전담 안내

- **문서 작업 전담**: 새 문서 작성, 기존 문서 이동/이름 변경/삭제, docs 폴더 구조 정리, 이 인덱스(README) 갱신은 **문서관리 서브에이전트**에게 요청하세요.
- **이유**: 문서가 분산되거나 예전 문서를 읽고 개발하면 혼선이 커지므로, 한 곳에서만 관리합니다.
- **적용 스킬**: `core-solution-documentation` → 서브에이전트: **generalPurpose** (또는 먼저 **explore**로 조사 후 generalPurpose).

---

## 문서 위치 체계 (docs/ 직하위)

| 경로 | 용도 | 대표·요약 |
|------|------|-----------|
| **[standards/](./standards/)** | **표준·가이드** (API, 코드스타일, 테넌트, 테스트, 배포 등) | 최신 표준만 참조. 목차: [standards/README.md](./standards/README.md), 요약: [STANDARDS_SUMMARY.md](./standards/STANDARDS_SUMMARY.md) |
| **[planning/](./planning/)** | **기획·설계** (기능, 역할, 메뉴, ERP 섹션 점검·테스트 시나리오 등) | ERP 전방위 점검·레이아웃·테넌트 격리·테스트 시나리오 등. 목차: [planning/README.md](./planning/README.md) |
| **[troubleshooting/](./troubleshooting/)** | **장애 대응·원인 분석** (개발 서버, OAuth, 심리검사 AI, 스케줄 등) | [DEV_SERVER_STARTUP_FAILURE_ANALYSIS.md](./troubleshooting/DEV_SERVER_STARTUP_FAILURE_ANALYSIS.md), [PSYCH_AI_*](./troubleshooting/) 시리즈, [QUICK_WILDCARD_TEST](./troubleshooting/QUICK_WILDCARD_TEST.md) |
| **[design-system/](./design-system/)** | 디자인 시스템·토큰·컴포넌트 스펙 | v2, B0KlA 등. [design-system/README.md](./design-system/README.md) |
| **[project-management/](./project-management/)** | 프로젝트 관리·리포트·결정 사항·일별 체크리스트 | 연도·월별 또는 archive 하위 |
| **[운영반영/](./운영반영/)** | **운영 반영(배포 준비)** | 회의 산출물·의견서. 목차: [운영반영/README.md](./운영반영/README.md) |
| **[archive/](./archive/)** | 과거 버전·폐기 표준·레거시 백업 | **현재 설계 참조 시 사용 금지** |
| **[guides/](./guides/)** | 환경 설정·개발·빠른 시작·배포·트러블슈팅 가이드 | quick-start, development, deployment 등 |
| **[architecture/](./architecture/)** | 시스템 아키텍처·설계 문서 | [PROJECT_STRUCTURE](./architecture/PROJECT_STRUCTURE.md), design 등 하위 |
| **[layout/](./layout/)** | 레이아웃·메뉴 구조 관련 | [ADMIN_COMMON_LAYOUT](./layout/ADMIN_COMMON_LAYOUT.md) |
| **[debug/](./debug/)** | **디버깅·원인 분석 문서** (core-debugger 산출물 등) | 목차: [debug/README.md](./debug/README.md) |
| **[database/](./database/)** | DB 관련 가이드 | |
| **[testing/](./testing/)** | 테스트 계획·가이드 | [MATCHING_SCHEDULE_INTEGRATION_REQUIREMENTS](./testing/MATCHING_SCHEDULE_INTEGRATION_REQUIREMENTS.md) 등 |
| **[api/](./api/)** | API 레퍼런스·설계 문서 | guides·architecture에서 참조 |
| **[issues/](./issues/)** | 이슈·결정 사항·트러블슈팅 기록 | |
| **[consultation/](./consultation/)** | 상담·UI 스펙 | CONSULTATION_LOG_VIEW, CONSULTANT_CLIENT_REGISTRATION 등 |
| **[psych-assessment/](./psych-assessment/)** | 심리검사 관련 기획·플랜 | [PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN](./psych-assessment/PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN.md) 등 |
| **[temp/](./temp/)** | 임시·작업용 문서 (정리 후 이동·삭제 대상) | |
| **[analysis/](./analysis/)** | 분석·조사 산출물 | 대시보드·기능 개선 분석 등 |
| **[changes/](./changes/)** | 변경 이력·변경 제안 | 권한·정책 변경 등 |
| **[design/](./design/)** | 설계 가이드(보조) | 컴포넌트 스펙·레이아웃 가이드 (design-system과 구분) |
| **2026-prestartup/, 2026-startup-plan/, plans/** | 기획·사업 계획 등 | 필요 시 project-management로 통합 가능 |

---

## 빠른 링크 (최근 정리 위주)

### Planning (ERP·기획)
- [ERP 섹션 전방위 점검 및 기획](./planning/ERP_SECTION_AUDIT_AND_PLANNING.md) — tenant 점검, 메뉴·라우트, 수정 우선순위
- [ERP 레이아웃·UI 검토](./planning/ERP_LAYOUT_DESIGN_REVIEW.md) — AdminCommonLayout·본문 구조
- [ERP 테넌트 격리 시나리오](./planning/ERP_TENANT_ISOLATION_SCENARIOS.md) — Phase 4 검증용 A/B 격리·400/403 시나리오
- [ERP E2E·통합 테스트 시나리오](./planning/ERP_TEST_SCENARIOS.md) — API 통합·E2E 제안
- **전체 목차**: [planning/README.md](./planning/README.md)
- 리디자인·기획 문서는 [planning/README.md](./planning/README.md) 리디자인·기획 섹션 참조.

### Standards (표준)
- **표준 문서 전체 목록**: [docs/standards/README.md](./standards/README.md)
- **간단 표준 요약**: [STANDARDS_SUMMARY.md](./standards/STANDARDS_SUMMARY.md) (핵심 4개 등)
- **서브에이전트 활용**: [SUBAGENT_USAGE.md](./standards/SUBAGENT_USAGE.md)

### Troubleshooting (장애·분석)
- [개발 서버 기동 실패 분석](./troubleshooting/DEV_SERVER_STARTUP_FAILURE_ANALYSIS.md)
- [심리검사 tenantId 이슈](./troubleshooting/PSYCH_PAGE_TENANT_ID_ISSUE.md)
- [심리검사 AI 필수 섹션 누락·파싱 분석](./troubleshooting/PSYCH_AI_MISSING_REQUIRED_SECTIONS_PRECISE_ANALYSIS.md), [서버 로그 분석](./troubleshooting/PSYCH_AI_MISSING_REQUIRED_SECTIONS_SERVER_LOG_ANALYSIS.md)
- [QUICK_WILDCARD_TEST](./troubleshooting/QUICK_WILDCARD_TEST.md)

### Project Management (프로젝트 관리)
- **[진행 중 작업 — 마스터 진행도 체크리스트 (SSOT)](./project-management/ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md)** — 멀티 트랙 전체 진행도·상태 한곳 관리. **ERP 완료 후 전역 확대 검토 절차는 동일 문서 섹션 6.**
- **[ERP 도메인 리뉴얼·고도화 마스터 플랜](./project-management/ERP_DOMAIN_RENEWAL_AND_ENHANCEMENT_PLAN.md)** — 전체 흐름·범위·필요 항목·페이즈(SSOT)
- [ERP 현황 분석 — DB·로직](./project-management/ERP_CURRENT_STATE_DB_AND_LOGIC_ANALYSIS.md) — 테이블 맵·흐름·진단·개선 후보(마스터 플랜 연계)
- [공통 UI 캡슐화·모듈화 계획](./project-management/COMMON_UI_ENCAPSULATION_PLAN.md) — 버튼·배지·카드 공통 컴포넌트 통합
- [통합 스케줄 카드 디자인 개선](./project-management/INTEGRATED_SCHEDULE_CARD_DESIGN_PLAN.md)
- [카드 시각 통합 스펙](./design-system/v2/CARD_VISUAL_UNIFIED_SPEC.md)

### 기타
- **Trinity CI·E2E·배포 구분**: [TRINITY_CI_AND_E2E](./guides/development/TRINITY_CI_AND_E2E.md) — ERP 스모크(`frontend/`) vs Trinity 빌드 스모크(`frontend-trinity/`) vs Trinity 배포 워크플로
- **루트에서 이동한 문서**: [QUICK_START](./guides/quick-start/QUICK_START.md), [DEPLOYMENT_CHECKLIST](./guides/deployment/DEPLOYMENT_CHECKLIST.md), [PROJECT_STRUCTURE](./architecture/PROJECT_STRUCTURE.md), [KOREAN_ENCODING_SETUP](./guides/development/KOREAN_ENCODING_SETUP.md)
- **문서 작성·정리 규칙**: [.cursor/skills/core-solution-documentation/SKILL.md](../.cursor/skills/core-solution-documentation/SKILL.md)
- **디버깅·원인 분석 문서 목록**: [docs/debug/README.md](./debug/README.md)

---

## 인덱스 유지

- 이 README에 새 상위 폴더를 추가하거나 위치 체계를 바꿀 때는 **문서관리 서브에이전트**로 요청해 반영하세요.
- 표준 문서가 추가되면 [standards/README.md](./standards/README.md)에 항목을 추가하는 것도 문서관리 전담 범위입니다.
- **운영반영**은 배포 준비 회의·의견서 전용이며, **planning**은 기획·설계 문서와 구분됩니다. 관련 계획서는 [planning/운영반영_문서정리_계획.md](./planning/운영반영_문서정리_계획.md) 참조.

---

*최종 업데이트: docs 직하위 구조 점검·누락 폴더(analysis, changes, design) 반영·planning 인덱스에 운영반영_문서정리_계획 추가*
