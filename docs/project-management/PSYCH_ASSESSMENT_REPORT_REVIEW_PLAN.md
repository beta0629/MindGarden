# 심리검사 리포트 도메인 점검·재검토 계획

**작성일**: 2026-02-27  
**담당**: core-planner (기획 전담)  
**배경**: `GET /api/v1/assessments/psych/documents/recent` 500 에러 발생 이후, DB 스키마 누락(version, deleted_at)·테넌트 컨텍스트·위젯 무한 재요청 등 수정 완료. 심리검사 리포트 관련 로직 전반 점검·검증 필요.

---

## 1. 현재 심리검사 리포트 도메인 구조·흐름

### 1.1 엔티티 관계도

```
PsychAssessmentDocument (문서)
    │
    ├── PsychAssessmentExtraction (추출 결과, 1:N - 최신 사용)
    │       └── extracted_json, validation_json, status
    │
    ├── PsychAssessmentMetric (표준 지표, N개 - 척도별 점수)
    │       └── scale_code, raw_score, t_score, percentile, cutoff_tag
    │
    └── PsychAssessmentReport (리포트, 1:N - 최신 사용)
            └── report_markdown, evidence_json, status
```

### 1.2 도메인 흐름 (document → extraction → metrics → report)

| 단계 | 설명 | 서비스 | 상태 전이 |
|------|------|--------|-----------|
| **1. 업로드** | PDF 업로드 → 저장 | PsychAssessmentIngestService | UPLOADED → OCR_PENDING |
| **2. 추출** | 비동기 OCR/추출 | PsychAssessmentExtractionService | extraction 생성 → doc OCR_DONE |
| **3. 지표** | extraction 결과 → metrics 생성 (MVP: 빈 metrics 허용) | (validation 내부) | — |
| **4. 리포트** | metrics 기반 AI 리포트 생성 | PsychAssessmentReportService | report 생성 (GENERATED) |

- MVP 현재: 추출은 **템플릿/OCR 미구성** 상태에서 `NEEDS_REVIEW` 고정. 실제 척도 추출 및 metrics 저장은 아직 연결되지 않음.
- 리포트 생성 시 metrics가 없으면 빈 목록으로 rule-based markdown + AI 보강.

### 1.3 관련 파일 목록

| 구분 | 파일 | 용도 |
|------|------|------|
| **Controller** | `PsychAssessmentController.java` | `/api/v1/assessments/psych/*` |
| **Services** | PsychAssessmentIngestService/Impl | 업로드·추출 트리거 |
| | PsychAssessmentExtractionService/Impl | 추출 파이프라인 |
| | PsychAssessmentReportService/Impl | 리포트 생성 |
| | PsychAssessmentStatsService/Impl | 통계 |
| | PsychAssessmentValidationService/Impl | 검증 |
| **Repositories** | PsychAssessmentDocumentRepository | findTop20ByTenantId* |
| | PsychAssessmentExtractionRepository | findTopByTenantIdAndDocumentId* |
| | PsychAssessmentMetricRepository | findByTenantIdAndDocumentId |
| | PsychAssessmentReportRepository | findTopByTenantIdAndDocumentId* |
| **Entities** | PsychAssessmentDocument, Extraction, Metric, Report | BaseEntity 상속 |
| **프론트** | `PsychAssessmentAdminWidget.js` | 위젯 (stats + recent + 업로드 + 리포트 생성) |
| | `PsychAssessmentManagement.js` | 페이지 (`/admin/psych-assessments`) |

### 1.4 API 목록

| 메서드 | 경로 | 용도 |
|--------|------|------|
| POST | `/api/v1/assessments/psych/documents` | PDF 업로드 |
| POST | `/api/v1/assessments/psych/documents/{documentId}/report` | 리포트 생성 |
| GET | `/api/v1/assessments/psych/stats` | 테넌트 통계 |
| GET | `/api/v1/assessments/psych/documents/recent` | 최근 문서 목록 (최대 20) |

### 1.5 프론트 위젯/페이지

| 구분 | 컴포넌트 | 경로 | 역할 |
|------|----------|------|------|
| **페이지** | PsychAssessmentManagement | `/admin/psych-assessments` | AdminCommonLayout + 위젯 |
| **위젯** | PsychAssessmentAdminWidget | (대시보드·페이지 공용) | multi-api (stats, recent), 업로드, 리포트 생성 버튼 |

- **useWidget**: `multi-api`로 stats·recent 동시 호출. `immediate: true`, `cache: false`, `retryCount: 2`.
- **권한**: 관리자(HQ_MASTER 포함)만 위젯 표시.

---

## 2. 점검·검증 항목

### 2.1 로직 정합성

| 항목 | 세부 | 확인 내용 |
|------|------|-----------|
| 리포트 생성 조건 | extraction 존재 | extraction 없을 때 예외 메시지·상태 명확화 |
| 리포트 생성 조건 | metrics 빈 목록 | metrics 0개여도 생성 가능 여부·AI 입력 검증 |
| 추출 → 문서 상태 | OCR_DONE | 추출 완료 시 doc.status 업데이트 일관성 |
| 통계 | tenantId 스코프 | stats API의 count가 **테넌트 스코프**로 동작하는지 (현재 미적용) |

### 2.2 권한·테넌트 처리

| 항목 | 세부 | 확인 내용 |
|------|------|-----------|
| 테넌트 격리 | 모든 API | `TenantContextHolder.getRequiredTenantId()` 사용 |
| 테넌트 격리 | StatsService | `count()` → `countByTenantId()` 등 테넌트 조건 필요 |
| 권한 | 페이지/위젯 | ADMIN, HQ_MASTER만 접근 |
| 권한 | API | `@PreAuthorize("isAuthenticated()")` (역할별 상세 검토 가능) |

### 2.3 예외 처리

| 항목 | 세부 | 확인 내용 |
|------|------|-----------|
| 404/400 | 문서 미존재 | IllegalArgumentException → 적절한 HTTP 상태·메시지 |
| 401/403 | 인증·권한 | GlobalExceptionHandler·프론트 ajax 연동 |
| tenantId 미설정 | 500 | 현재 500 반환 → 401/400 전환 검토 |

### 2.4 DB 스키마 일치

| 항목 | 세부 | 확인 내용 |
|------|------|-----------|
| BaseEntity 필수 컬럼 | psych_assessment_documents | version, deleted_at 추가 완료 (V20260227_003) |
| BaseEntity 필수 컬럼 | psych_assessment_extractions | version, deleted_at 존재 여부 |
| BaseEntity 필수 컬럼 | psych_assessment_metrics | version, deleted_at 존재 여부 |
| BaseEntity 필수 컬럼 | psych_assessment_reports | version, deleted_at 존재 여부 |

### 2.5 API 계약

| 항목 | 세부 | 확인 내용 |
|------|------|-----------|
| 응답 형식 | ApiResponse<T> | 일관된 success/error 구조 |
| 문서 목록 필드 | PsychAssessmentDocumentListItem | documentId, assessmentType, status, originalFilename, sha256, createdAt |
| 통계 필드 | stats | documentsTotal, extractionsTotal, reportsTotal, tenantId |

### 2.6 UI/UX

| 항목 | 세부 | 확인 내용 |
|------|------|-----------|
| 위젯 로딩 | useWidget | 401 시 재시도·리다이렉트 중복 방지 |
| 에러 노출 | BaseWidget | error 상태 표시 |
| 업로드 피드백 | 알림 | 성공/실패 메시지 |

---

## 3. 범위·단계별 계획

### Phase 1: 현황 분석 및 문제점 도출

| 구분 | 내용 | 담당 서브에이전트 |
|------|------|-------------------|
| 목표 | 코드베이스·DB·API 현황 상세 파악, 잠재 문제 목록 도출 | **explore** |
| 산출물 | 현황 분석 리포트, 문제점·리스크 목록 | — |
| 완료 기준 | psych 관련 모든 코드·마이그레이션·API·위젯 조사 완료, 문제 항목 번호 부여 | — |

### Phase 2: 기획/설계 개선안

| 구분 | 내용 | 담당 서브에이전트 |
|------|------|-------------------|
| 목표 | 문제점별 수정 방향·우선순위 정리, 필요 시 화면/API 설계 보완 | **core-planner** (또는 generalPurpose) |
| 산출물 | 개선안 문서, 수정 태스크 목록, 우선순위 | — |
| 완료 기준 | 각 문제에 대한 해결 방안·태스크 설명이 코더/디버거에 전달 가능한 수준 | — |

### Phase 3: 개발 및 수정

| 구분 | 내용 | 담당 서브에이전트 |
|------|------|-------------------|
| 목표 | Phase 2 태스크에 따른 실제 코드·DB·API 수정 | **core-coder**, 필요 시 **core-debugger** |
| 산출물 | 수정된 코드, 마이그레이션, API | — |
| 완료 기준 | 체크리스트 항목 수정 완료, 빌드·기본 동작 확인 | — |

### Phase 4: 테스트 및 검증

| 구분 | 내용 | 담당 서브에이전트 |
|------|------|-------------------|
| 목표 | 단위·통합·E2E 테스트 작성·실행, 최종 검증 | **core-tester** |
| 산출물 | 테스트 코드, 테스트 결과, 검증 체크리스트 | — |
| 완료 기준 | 2절 점검 항목에 대한 테스트 통과, 수동 시나리오 검증 완료 | — |

---

## 4. 단계별 산출물 및 담당 서브에이전트

### Phase 1: 현황 분석 (explore)

| 산출물 | 형태 | 설명 |
|--------|------|------|
| 현황 분석 리포트 | `docs/project-management/PSYCH_ASSESSMENT_ANALYSIS_REPORT.md` | 엔티티·테이블·API·위젯·흐름 상세, 기존 문서(DEBUG_PSYCHOLOGY_TEST_AI_INFINITE_LOOP 등) 반영 |
| 문제점 목록 | 동일 문서 또는 별도 섹션 | 번호·심각도·영역(DB/API/프론트/권한 등) |

**호출 시 전달할 태스크 설명 초안**:

```
심리검사 리포트(psych assessment) 도메인 전반을 조사하세요.
- 경로: src/.../assessment/*, frontend/.../PsychAssessment*, db/migration/*psych*
- 확인: 엔티티(BaseEntity 상속), 테이블 스키마(version, deleted_at 포함 여부), 
  API·서비스·리포지토리의 테넌트 격리, 프론트 useWidget·multi-api·에러 처리
- 산출: docs/project-management/PSYCH_ASSESSMENT_ANALYSIS_REPORT.md 에 
  현황 요약 + 문제점 목록(번호·심각도·영역) 작성
- 참조: docs/debug/DEBUG_PSYCHOLOGY_TEST_AI_INFINITE_LOOP_20260227.md, 
  docs/project-management/PSYCH_ASSESSMENT_REPORT_REVIEW_PLAN.md (본 문서)
```

### Phase 2: 기획/설계 개선안 (core-planner 또는 generalPurpose)

| 산출물 | 형태 | 설명 |
|--------|------|------|
| 개선안 문서 | `docs/project-management/PSYCH_ASSESSMENT_IMPROVEMENT_PLAN.md` | 문제별 해결 방향, 우선순위, 코더/디버거 전달용 태스크 설명 |

**호출 시 전달할 태스크 설명 초안**:

```
Phase 1 산출물(PSYCH_ASSESSMENT_ANALYSIS_REPORT.md)의 문제점 목록을 바탕으로
개선안을 작성하세요.
- 각 문제에 대해: 해결 방향, 담당 서브에이전트(core-coder/core-debugger 등), 
  전달할 태스크 설명 초안
- 우선순위(긴급/높음/중간/낮음) 부여
- 산출: docs/project-management/PSYCH_ASSESSMENT_IMPROVEMENT_PLAN.md
```

### Phase 3: 개발 및 수정 (core-coder, 필요 시 core-debugger)

| 산출물 | 형태 | 설명 |
|--------|------|------|
| DB 마이그레이션 | `V*__add_psych_*_base_entity_columns.sql` | extractions, metrics, reports 테이블에 version, deleted_at 추가 (필요 시) |
| 백엔드 수정 | Service, Repository, Controller | 테넌트 스코프 count, 예외 처리, API 계약 |
| 프론트 수정 | useWidget, ajax, 위젯 | 401 중복 리다이렉트 방지, 에러 표시 |

**호출 시 전달할 태스크 설명 초안** (Phase 2 산출물 기반으로 구체화):

```
Phase 2 개선안 문서의 태스크를 구현하세요.
- DB: psych_assessment_extractions, psych_assessment_metrics, psych_assessment_reports 
  테이블에 BaseEntity 필수 컬럼(version, deleted_at) 추가 마이그레이션 작성
- StatsService: count() → tenantId 조건 count 메서드로 변경
- 참조: /core-solution-backend, /core-solution-multi-tenant, /core-solution-database-first
```

### Phase 4: 테스트 및 검증 (core-tester)

| 산출물 | 형태 | 설명 |
|--------|------|------|
| 테스트 코드 | PsychAssessment*Test | Controller·Service 단위·통합 테스트 |
| 검증 체크리스트 | 마크다운 또는 이슈 | 2절 점검 항목별 통과 여부 |

**호출 시 전달할 태스크 설명 초안**:

```
심리검사 리포트 도메인에 대한 테스트를 작성·실행하세요.
- 대상: PsychAssessmentController, PsychAssessmentStatsService, 
  PsychAssessmentReportService, document/recent API
- 시나리오: tenantId 격리, 문서 없을 때 예외, stats count 테넌트 스코프
- 참조: docs/project-management/PSYCH_ASSESSMENT_REPORT_REVIEW_PLAN.md §2 점검 항목,
  /core-solution-testing
```

---

## 5. 실행 가이드

### 5.1 시작 순서

1. **Phase 1 (explore)** 부터 시작.
2. Phase 1 산출물 확인 후 **Phase 2 (core-planner 또는 generalPurpose)** 실행.
3. Phase 2 개선안 확정 후 **Phase 3 (core-coder)** 실행. 필요 시 특정 이슈만 **core-debugger**에 원인 분석·수정 제안 요청.
4. Phase 3 수정 완료 후 **Phase 4 (core-tester)** 실행.

### 5.2 서브에이전트 호출 순서

| 순서 | Phase | 서브에이전트 | mcp_task 호출 예시 |
|------|-------|--------------|---------------------|
| 1 | Phase 1 | **explore** | `subagent_type: "explore"`, 프롬프트: §4 Phase 1 태스크 설명 |
| 2 | Phase 2 | **core-planner** 또는 **generalPurpose** | §4 Phase 2 태스크 설명 |
| 3 | Phase 3 | **core-coder** | §4 Phase 3 태스크 설명 (개선안 기반으로 세부화) |
| 3' | (선택) | **core-debugger** | 특정 500/예외 원인 분석 필요 시 |
| 4 | Phase 4 | **core-tester** | §4 Phase 4 태스크 설명 |

### 5.3 병렬 가능 여부

- Phase 1 완료 전에는 Phase 2·3·4를 시작하지 않음.
- Phase 2 개선안이 나온 뒤, DB 마이그레이션(core-coder)과 테스트 시나리오 설계(core-tester)는 병렬 가능하나, **실제 수정(Phase 3) 완료 후** Phase 4 테스트 실행이 올바른 순서.

### 5.4 참조 문서

- `docs/debug/DEBUG_PSYCHOLOGY_TEST_AI_INFINITE_LOOP_20260227.md` — 무한 루프·로그인 리다이렉트 분석
- `docs/2026-prestartup/SYSTEM_OVERVIEW.md` — 심리검사 AI 개요
- `docs/standards/SUBAGENT_USAGE.md` — 서브에이전트 활용 규칙

---

## 6. 리스크·제약

| 구분 | 내용 |
|------|------|
| DB 마이그레이션 | 기존 데이터 있는 환경에서 ALTER 시 잠금·다운타임 검토 필요 |
| 테넌트 통계 | StatsService count가 현재 테넌트 무관 → 운영 데이터 혼선 가능 |
| MVP 범위 | OCR/템플릿 추출 미구성 상태. metrics 0개 시 리포트 생성 로직 검증 필요 |

---

**문서 끝.**
