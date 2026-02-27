# 심리검사 리포트(psych assessment) 도메인 현황 분석 리포트

**작성일**: 2026-02-27  
**참조**: `docs/project-management/PSYCH_ASSESSMENT_REVIEW_PLAN.md`, `docs/debug/DEBUG_PSYCHOLOGY_TEST_AI_INFINITE_LOOP_20260227.md`

---

## 1. 현황 요약

### 1.1 파일 경로 및 구성

| 구분 | 경로 | 파일 수 |
|------|------|---------|
| **백엔드** | `src/main/java/com/coresolution/consultation/assessment/` | 28개 |
| **프론트엔드** | `frontend/src/components/admin/`, `.../dashboard/widgets/admin/` | 2개 |
| **DB 마이그레이션** | `src/main/resources/db/migration/` | 2개 |

### 1.2 엔티티·테이블 스키마

| 엔티티 | BaseEntity 상속 | 테이블 | version | deleted_at | 비고 |
|--------|----------------|--------|---------|------------|------|
| PsychAssessmentDocument | ✓ | psych_assessment_documents | ✓ (V20260227_003) | ✓ (V20260227_003) | is_deleted는 원래 존재 |
| PsychAssessmentExtraction | ✓ | psych_assessment_extractions | ✗ | ✗ | **누락** |
| PsychAssessmentMetric | ✓ | psych_assessment_metrics | ✗ | ✗ | **누락** |
| PsychAssessmentReport | ✓ | psych_assessment_reports | ✗ | ✗ | **누락** |

- `BaseEntity` 필수 컬럼: `id`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`, `version`, `tenant_id`
- `psych_assessment_extractions`, `psych_assessment_metrics`, `psych_assessment_reports`는 `version`, `deleted_at` 컬럼 없음
- 위 3개 테이블은 `is_deleted`만 있고 `deleted_at` 없음

### 1.3 API·서비스·리포지토리 테넌트 격리

| 구성요소 | 테넌트 격리 | 세부 |
|----------|-------------|------|
| **PsychAssessmentController** | ✓ | `TenantContextHolder.getRequiredTenantId()` 사용 (upload, recentDocuments) |
| **PsychAssessmentIngestServiceImpl** | ✓ | `TenantContextHolder.getRequiredTenantId()` 사용 |
| **PsychAssessmentReportServiceImpl** | ✓ | `tenantId`로 repository 조회 |
| **PsychAssessmentStatsServiceImpl** | ✗ | `count()` 전역 사용, 테넌트 조건 없음 |
| **Repositories** | ✓ | findByTenantId*, findTopByTenantIdAnd* 등 tenant 조건 포함 |

### 1.4 프론트엔드 useWidget·multi-api·에러 처리

| 항목 | 현황 |
|------|------|
| **useWidget** | multi-api(stats, recent), `immediate: true`, `cache: false`, `retryCount: 2` 사용 |
| **데이터 소스** | useWidget 내부에서 `apiGet`(ajax.js) 사용 |
| **업로드** | raw `fetch()` 사용, StandardizedApi 미사용 |
| **리포트 생성** | `apiPost`(ajax.js) 사용, StandardizedApi 미사용 |
| **에러 처리** | BaseWidget에 `error` 전달, notificationManager로 성공/실패 안내 |
| **401/403** | useWidget에서 클라이언트 오류로 간주 후 재시도 중단 (2.5절) |

---

## 2. 문제점 목록

| # | 심각도 | 영역 | 문제 |
|---|--------|------|------|
| 1 | 높음 | DB | psych_assessment_extractions 테이블에 `version`, `deleted_at` 없음. BaseEntity 상속 엔티티와 스키마 불일치로 500 오류 가능 |
| 2 | 높음 | DB | psych_assessment_metrics 테이블에 `version`, `deleted_at` 없음. 위와 동일한 위험 |
| 3 | 높음 | DB | psych_assessment_reports 테이블에 `version`, `deleted_at` 없음. 위와 동일한 위험 |
| 4 | 높음 | API/테넌트 | PsychAssessmentStatsServiceImpl이 `count()`로 전역 집계. 테넌트별 통계가 아님, 운영 데이터 혼선 가능 |
| 5 | 중간 | 프론트/API | PsychAssessmentAdminWidget 업로드에 raw `fetch()` 사용. core-solution-api 규칙상 StandardizedApi 사용 필수 |
| 6 | 중간 | 프론트/API | PsychAssessmentAdminWidget 리포트 생성에 apiPost 사용. core-solution-api 규칙상 StandardizedApi 사용 필수 |
| 7 | 중간 | 프론트/API | useWidget multi-api가 내부적으로 ajax.js `apiGet` 사용. core-solution-api 규칙상 StandardizedApi 사용 필수 |
| 8 | 낮음 | 권한 | Controller는 `@PreAuthorize("isAuthenticated()")`만 사용. ADMIN/HQ_MASTER 등 역할 제한 없음 |
| 9 | 낮음 | 예외 | generateReport의 `IllegalArgumentException`이 GlobalExceptionHandler에서 어떻게 처리되는지 확인 필요 |
| 10 | 낮음 | UI | 401 시 checkSessionAndRedirect와 세션 재검증으로 리다이렉트가 여러 번 시도될 수 있음 (DEBUG 문서 참조) |

---

## 3. 참조 정보

### 3.1 API 목록

| 메서드 | 경로 | 용도 |
|--------|------|------|
| POST | `/api/v1/assessments/psych/documents` | PDF 업로드 |
| POST | `/api/v1/assessments/psych/documents/{documentId}/report` | 리포트 생성 |
| GET | `/api/v1/assessments/psych/stats` | 테넌트 통계 |
| GET | `/api/v1/assessments/psych/documents/recent` | 최근 문서 목록 (최대 20) |

### 3.2 마이그레이션 파일

- `V20251217_001__create_psych_assessment_tables.sql`: documents, extractions, metrics, reports 테이블 생성
- `V20260227_003__add_psych_assessment_documents_base_entity_columns.sql`: documents에 version, deleted_at 추가

### 3.3 관련 스킬/문서

- `core-solution-api`: StandardizedApi 사용, `/api/v1/` 엔드포인트
- `core-solution-multi-tenant`: tenantId 필수
- `core-solution-database-first`: DB 우선 개발 순서

---

**문서 끝**
