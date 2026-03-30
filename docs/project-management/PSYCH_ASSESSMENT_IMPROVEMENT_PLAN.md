# 심리검사 리포트 도메인 개선안

**작성일**: 2026-02-27  
**참조**: `docs/project-management/PSYCH_ASSESSMENT_ANALYSIS_REPORT.md`, `docs/project-management/PSYCH_ASSESSMENT_REVIEW_PLAN.md`

---

## 1. Phase 1 문제점별 개선안

### 1.1 우선순위 요약

| 우선순위 | 문제 번호 | 영역 | 작업 항목 | 예상 영향 |
|----------|-----------|------|-----------|-----------|
| **P0** | 1, 2, 3 | DB | extractions, metrics, reports에 `version`, `deleted_at` 추가 | BaseEntity 스키마 일치, 500 오류 방지 |
| **P0** | 4 | API/테넌트 | StatsService `count()` → 테넌트 스코프 `countByTenantId()` | 멀티테넌트 데이터 격리, 운영 데이터 정확성 |
| **P1** | 5, 6, 7 | 프론트/API | 업로드·리포트·useWidget → StandardizedApi 전환 | core-solution-api 준수, 일관된 에러·tenantId 처리 |
| **P2** | 8 | 권한 | Controller `@PreAuthorize` 역할 제한 (선택) | ADMIN/HQ_MASTER만 접근 제한 |
| **P2** | 9, 10 | 예외·UI | 예외 처리·401 리다이렉트 검토 (선택) | 사용성·안정성 개선 |

---

### 1.2 문제별 상세 개선안

#### 문제 1~3: DB BaseEntity 컬럼 누락 (P0)

| 항목 | 내용 |
|------|------|
| **원인** | `psych_assessment_extractions`, `psych_assessment_metrics`, `psych_assessment_reports` 테이블에 `version`, `deleted_at` 없음. 엔티티는 BaseEntity 상속. |
| **개선안** | 마이그레이션으로 3개 테이블에 `version`, `deleted_at` 추가. (2절 참조) |
| **작업 담당** | core-coder |
| **검증** | JPA 엔티티 로드 시 Unknown column 500 미발생, Soft delete 정상 동작 |

#### 문제 4: StatsService 전역 count (P0)

| 항목 | 내용 |
|------|------|
| **원인** | `PsychAssessmentStatsServiceImpl`이 `documentRepository.count()`, `extractionRepository.count()`, `reportRepository.count()`로 전역 집계. tenantId 조건 없음. |
| **개선안** | Repository에 `countByTenantId(String tenantId)` 추가 후 StatsServiceImpl에서 호출. (3절 참조) |
| **작업 담당** | core-coder |
| **검증** | 테넌트 A/B 별로 stats 호출 시 각 테넌트 데이터만 집계되는지 확인 |

#### 문제 5: 업로드 raw fetch 사용 (P1)

| 항목 | 내용 |
|------|------|
| **원인** | `PsychAssessmentAdminWidget.handleUpload()`에서 raw `fetch()` 사용. StandardizedApi 미사용. |
| **개선안** | StandardizedApi에 FormData 업로드 메서드 추가(또는 기존 apiPostFormData 활용 표준 래퍼 도입) 후 위젯에서 사용. |
| **작업 담당** | core-coder |
| **검증** | tenantId 헤더 자동 포함, 세션 갱신·에러 처리 일관성 |

#### 문제 6: 리포트 생성 apiPost 사용 (P1)

| 항목 | 내용 |
|------|------|
| **원인** | `handleGenerateReport()`에서 `apiPost` 직접 호출. |
| **개선안** | `StandardizedApi.post('/api/v1/assessments/psych/documents/${documentId}/report', {})` 로 교체. |
| **작업 담당** | core-coder |
| **검증** | 기존과 동일 동작, StandardizedApi 규칙 준수 |

#### 문제 7: useWidget multi-api apiGet 사용 (P1)

| 항목 | 내용 |
|------|------|
| **원인** | `useWidget` 내부에서 `apiGet` 호출. core-solution-api 규칙상 StandardizedApi 사용 필수. |
| **개선안** | useWidget이 `StandardizedApi.get()` 사용하도록 수정. 또는 dataSource에서 `fetcher` 옵션으로 StandardizedApi 주입. (4절 참조) |
| **작업 담당** | core-coder |
| **검증** | stats, recent API 호출 시 tenantId·세션 처리 일관 |

#### 문제 8~10: 권한·예외·UI (P2)

| 항목 | 내용 |
|------|------|
| **원인** | Controller `@PreAuthorize("isAuthenticated()")`만, generateReport 예외 처리 미확인, 401 시 리다이렉트 중복 가능. |
| **개선안** | P0/P1 완료 후 검토. 필요 시 ADMIN/HQ_MASTER로 제한, GlobalExceptionHandler 확인. |
| **작업 담당** | core-coder, core-debugger |

---

## 2. DB 마이그레이션 계획

### 2.1 대상 테이블

| 테이블 | 추가할 컬럼 | 참조 |
|--------|-------------|------|
| `psych_assessment_extractions` | `version`, `deleted_at` | V20260227_003 documents 형식 |
| `psych_assessment_metrics` | `version`, `deleted_at` | 동일 |
| `psych_assessment_reports` | `version`, `deleted_at` | 동일 |

### 2.2 마이그레이션 파일

**파일명**: `V20260227_004__add_psych_assessment_extractions_metrics_reports_base_entity_columns.sql`

```sql
-- psych_assessment_extractions, psych_assessment_metrics, psych_assessment_reports
-- BaseEntity 필수 컬럼 추가 (version, deleted_at)

ALTER TABLE psych_assessment_extractions
  ADD COLUMN deleted_at DATETIME(6) NULL,
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE psych_assessment_metrics
  ADD COLUMN deleted_at DATETIME(6) NULL,
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE psych_assessment_reports
  ADD COLUMN deleted_at DATETIME(6) NULL,
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
```

### 2.3 순서 및 제약

- `documents` 컬럼 추가(V20260227_003) 이후 적용.
- 기존 데이터 있는 환경: `deleted_at NULL`, `version 0`으로 기존 행 보존.
- 엔티티 클래스는 이미 BaseEntity 상속 중이므로 코드 변경 불필요(스키마 일치만 필요).

---

## 3. StatsService 테넌트 스코프 수정 방안

### 3.1 Repository 메서드 추가

| Repository | 추가 메서드 | 용도 |
|------------|-------------|------|
| PsychAssessmentDocumentRepository | `long countByTenantId(String tenantId)` | 문서 수 (삭제 제외: `countByTenantIdAndIsDeletedFalse` 등 정책에 따라) |
| PsychAssessmentExtractionRepository | `long countByTenantId(String tenantId)` | 추출 수 |
| PsychAssessmentReportRepository | `long countByTenantId(String tenantId)` | 리포트 수 |

- Soft delete 적용 시: `countByTenantIdAndIsDeletedFalse` 또는 `countByTenantId` + `@Query`로 `is_deleted = 0` 조건.
- JPA 메서드명 규칙: Spring Data JPA가 자동 구현.

### 3.2 StatsServiceImpl 수정

**현재**:
```java
long docs = documentRepository.count();
long extractions = extractionRepository.count();
long reports = reportRepository.count();
```

**변경 후**:
```java
long docs = documentRepository.countByTenantId(tenantId);
long extractions = extractionRepository.countByTenantId(tenantId);
long reports = reportRepository.countByTenantId(tenantId);
```

- `tenantId`는 이미 `TenantContextHolder.getRequiredTenantId()`로 조회 중.

### 3.3 참조

- `/core-solution-multi-tenant`: tenantId 필수
- `docs/standards/` DB·멀티테넌트 관련 표준

---

## 4. 프론트 StandardizedApi 전환 방안

### 4.1 업로드 (handleUpload)

| 현재 | 개선 |
|------|------|
| raw `fetch('/api/v1/assessments/psych/documents', { method: 'POST', body: form })` | StandardizedApi 기반 FormData 업로드 |

**방안 A**: StandardizedApi에 `postFormData(endpoint, formData)` 추가
- `getDefaultApiHeadersAsync`로 tenantId·세션 헤더 적용
- `apiPostFormData` 또는 내부 fetch 래핑

**방안 B**: 기존 `apiPostFormData`를 StandardizedApi 스타일로 래핑한 `StandardizedApi.postFormData` 도입

```javascript
// 개선 후 예시
const form = new FormData();
form.append('type', uploadType);
form.append('file', uploadFile);
await StandardizedApi.postFormData('/api/v1/assessments/psych/documents', form);
```

### 4.2 리포트 생성 (handleGenerateReport)

| 현재 | 개선 |
|------|------|
| `apiPost(\`/api/v1/assessments/psych/documents/${documentId}/report\`, {})` | `StandardizedApi.post(\`/api/v1/assessments/psych/documents/${documentId}/report\`, {})` |

- `StandardizedApi.post`는 이미 존재. import 교체 및 호출부만 수정.

### 4.3 useWidget multi-api

| 현재 | 개선 |
|------|------|
| `useWidget` 내부 `apiGet(url, params)` | StandardizedApi.get 사용 |

**방안 A**: useWidget에 `apiFetcher` 옵션 추가
- `apiFetcher: StandardizedApi.get` 전달 시 해당 fetcher 사용
- 기본값: 기존 `apiGet` (호환성)

**방안 B**: useWidget 기본 fetcher를 `StandardizedApi.get`으로 변경
- 모든 위젯 영향 → 기존 위젯 검증 필요
- PsychAssessmentAdminWidget만 우선 수정할 경우, useWidget은 그대로 두고 dataSource `fetcher` 오버라이드가 가능하면 해당 방식

**권장**: useWidget에 `fetcher`(또는 `apiFetcher`) 옵션을 추가하고, PsychAssessmentAdminWidget의 dataSource에서 `fetcher: StandardizedApi.get` 지정. 기존 위젯은 영향 없음.

### 4.4 참조

- `/core-solution-api`: StandardizedApi 사용 필수
- `frontend/src/utils/standardizedApi.js`
- `docs/standards/API_CALL_STANDARD.md`

---

## 5. Phase 3 / Phase 4 실행 순서 및 산출물

### 5.1 Phase 3: 개발 및 수정

#### 실행 순서

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|-----------|
| 1 | DB 마이그레이션 작성 및 적용 (extractions, metrics, reports) | core-coder | — |
| 2 | Repository `countByTenantId` 추가, StatsServiceImpl 수정 | core-coder | 1 |
| 3 | StandardizedApi 업로드 지원 (postFormData 등) 추가 | core-coder | — |
| 4 | PsychAssessmentAdminWidget 업로드·리포트 StandardizedApi 전환 | core-coder | 3 |
| 5 | useWidget StandardizedApi 연동 (fetcher 옵션) 및 PsychAssessmentAdminWidget 적용 | core-coder | — |

- 1, 2, 3은 병렬 불가(DB·백엔드 의존). 4, 5는 3 완료 후 가능.
- 1→2→(3→4, 5) 순서 권장.

#### 산출물

| 산출물 | 형태 |
|--------|------|
| DB 마이그레이션 | `V20260227_004__add_psych_assessment_extractions_metrics_reports_base_entity_columns.sql` |
| Repository | countByTenantId 메서드 (Document, Extraction, Report) |
| StatsServiceImpl | count() → countByTenantId(tenantId) |
| StandardizedApi | postFormData (또는 동등 메서드) |
| PsychAssessmentAdminWidget | StandardizedApi 사용 (업로드, 리포트) |
| useWidget | fetcher 옵션 및 PsychAssessmentAdminWidget 연동 |

#### core-coder 호출용 태스크 설명 초안

```
Phase 2 개선안(PSYCH_ASSESSMENT_IMPROVEMENT_PLAN.md)에 따라 다음을 구현하세요.

1. DB 마이그레이션
   - psych_assessment_extractions, psych_assessment_metrics, psych_assessment_reports
   - version, deleted_at 컬럼 추가 (V20260227_004)
   - 참조: V20260227_003 (documents 마이그레이션)

2. StatsService 테넌트 스코프
   - PsychAssessmentDocumentRepository, ExtractionRepository, ReportRepository에
     countByTenantId(String tenantId) 추가
   - PsychAssessmentStatsServiceImpl에서 count() → countByTenantId(tenantId)로 변경
   - 참조: /core-solution-multi-tenant

3. 프론트 StandardizedApi 전환
   - StandardizedApi.postFormData(endpoint, formData) 추가 (또는 동등 방식)
   - PsychAssessmentAdminWidget: 업로드 raw fetch → StandardizedApi, 리포트 apiPost → StandardizedApi.post
   - useWidget: fetcher 옵션으로 StandardizedApi.get 사용 가능하도록 하고
     PsychAssessmentAdminWidget dataSource에 적용
   - 참조: /core-solution-api, standardizedApi.js
```

---

### 5.2 Phase 4: 테스트 및 검증

#### 실행 순서

| 순서 | 작업 | 담당 |
|------|------|------|
| 1 | PsychAssessmentStatsService 테넌트 스코프 단위/통합 테스트 | core-tester |
| 2 | PsychAssessmentController API 테스트 (stats, recent, upload, report) | core-tester |
| 3 | DB 마이그레이션 검증 (스키마·데이터 무결성) | core-tester |
| 4 | 위젯 E2E 또는 수동 시나리오 (업로드, 리포트 생성, 통계 표시) | core-tester |

#### 산출물

| 산출물 | 형태 |
|--------|------|
| 단위 테스트 | PsychAssessmentStatsServiceImplTest (tenantId별 count) |
| 통합 테스트 | PsychAssessmentControllerTest (stats API 테넌트 격리) |
| 검증 체크리스트 | PSYCH_ASSESSMENT_REVIEW_PLAN §2 점검 항목별 통과 여부 |

#### core-tester 호출용 태스크 설명 초안

```
심리검사 리포트 도메인 테스트를 작성·실행하세요.

- 대상: PsychAssessmentStatsService (테넌트 스코프 count),
  PsychAssessmentController (stats, recent, upload, report)
- 시나리오: tenantId별 stats 격리, 문서 없을 때 예외, 업로드/리포트 API
- 참조: docs/project-management/PSYCH_ASSESSMENT_REVIEW_PLAN.md §2,
  docs/project-management/PSYCH_ASSESSMENT_IMPROVEMENT_PLAN.md,
  /core-solution-testing
```

---

## 6. 리스크·제약

| 구분 | 내용 |
|------|------|
| DB ALTER | 기존 데이터 환경에서 잠금·다운타임 검토. version/deleted_at DEFAULT 지정으로 무중단 적용 가능 |
| useWidget 공용 훅 | fetcher 옵션 추가 시 기존 위젯 regression 방지. 기본 동작은 유지 |
| StandardizedApi.postFormData | 신규 메서드 도입 시 ajax.js apiPostFormData·getDefaultApiHeadersAsync 활용 |

---

## 7. 요약

1. **P0**: DB 마이그레이션(extractions, metrics, reports) + StatsService 테넌트 스코프 → 500 오류 방지 및 데이터 격리.
2. **P1**: 업로드·리포트·useWidget StandardizedApi 전환 → core-solution-api 준수.
3. **P2**: 권한·예외·UI 개선은 P0/P1 완료 후 선택 적용.
4. **Phase 3**: DB → StatsService → StandardizedApi·위젯 순으로 core-coder 실행.
5. **Phase 4**: core-tester가 단위·통합·E2E로 검증.

---

**문서 끝.**
