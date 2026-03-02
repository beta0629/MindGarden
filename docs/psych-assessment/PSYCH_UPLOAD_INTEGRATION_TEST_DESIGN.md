# 심리검사 PDF + 이미지 업로드 — 통합 테스트 설계

**작성일**: 2026-03-02  
**목적**: PDF 업로드·이미지 업로드(1장/N장) 플로우의 통합 테스트 케이스 설계 및 리소스·core-coder 전달 사항 정리.  
**참조**: `docs/psych-assessment/PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN.md`, `docs/standards/TESTING_STANDARD.md`

---

## 1. 기존 심리검사 관련 통합 테스트 현황

| 경로 | 테스트 내용 |
|------|-------------|
| `src/test/java/com/coresolution/consultation/assessment/integration/PsychAssessmentMmpiExtractionIntegrationTest.java` | **MMPI 추출·리포트 생성**: `document_id` 29 또는 `original_filename` LIKE '%mmpi_이혁진%' 문서로 `PsychAssessmentReportService.generateLatestReport(documentId)` 호출 → 추출(ensureExtractionSync)·리포트 생성 성공·`PsychAssessmentExtraction` 존재·`extractedJson` 검증. 로컬 PDF 파일(`/Users/mind/Downloads/mmpi_이혁진.pdf`)로 `Mmpi2ExtractionParser.parse(text)` 직접 테스트(파일 없으면 스킵). `@ActiveProfiles("local")`, `@Transactional`, TenantContextHolder 사용. |
| `src/test/java/com/coresolution/consultation/assessment/integration/PsychAssessmentStatsIntegrationTest.java` | **통계·테넌트 격리**: Repository `countByTenantId`, `PsychAssessmentStatsService.getTenantStats` 테넌트별 격리 검증. 문서 2개(tenant1)·1개(tenant2) 저장 후 count·stats 비교. `@ActiveProfiles("test")`, `@Transactional`, UUID 테넌트 생성. |
| `src/test/java/com/coresolution/consultation/assessment/integration/PsychAssessmentMigrationV20260227_004Test.java` | **DB 마이그레이션 검증**: V20260227_004 마이그레이션 파일 존재·`psych_assessment_extractions`/`metrics`/`reports`에 `deleted_at`, `version` 컬럼 추가 여부 확인. API/업로드 플로우 미포함. |

**정리**: 업로드 API(`POST /api/v1/assessments/psych/documents`)를 호출해 **PDF 1건 업로드 → 문서 생성 → 추출 → (선택) 리포트 생성**까지 한 번에 검증하는 통합 테스트는 **없음**. 이미지 업로드·OCR 경로 통합 테스트도 **없음**.

---

## 2. 추가할 통합 테스트 요구사항

### 2.1 PDF 업로드 플로우 (기존 회귀 방지)

- **목표**: PDF 1개 업로드 → 문서 생성 → 추출(PDFBox) → (선택) 리포트 생성까지 기존 플로우가 깨지지 않았는지 확인.
- **계층**: 서비스/Ingest·Extraction 연동 통합 테스트. API(Controller) 경로는 선택( MockMvc + 인증·테넌트 헤더 필요 시 별도 클래스로 분리 가능).
- **권장 위치**: `src/test/java/com/coresolution/consultation/assessment/integration/PsychAssessmentPdfUploadIntegrationTest.java` (신규).

### 2.2 이미지 업로드 플로우 (1장 또는 N장)

- **목표**: 이미지 1장 또는 N장 업로드 → 문서 생성(SCANNED_IMAGE, storagePath JSON 배열) → OCR(Tesseract) 추출 → `Mmpi2ExtractionParser` 호출까지.
- **Tesseract 미설치 시**: 해당 테스트는 `@Disabled("Tesseract 필요")` 또는 `Assume.assumeTrue(Tesseract 사용 가능)` 등으로 건너뛰기. CI/로컬에서 Tesseract 없이도 빌드·나머지 테스트는 통과하도록.
- **권장 위치**: `src/test/java/com/coresolution/consultation/assessment/integration/PsychAssessmentImageUploadIntegrationTest.java` (신규).

---

## 3. 테스트 케이스 목록

### 3.1 PDF 업로드 통합 테스트 (`PsychAssessmentPdfUploadIntegrationTest`)

| ID | @DisplayName | 시나리오 | Given | When | Then |
|----|----------------|----------|--------|------|------|
| P1 | PDF 1개 업로드 시 문서 생성 및 저장 경로 반환 | 정상 | 테넌트 설정, 소형 PDF 리소스 | `ingestService.uploadScannedPdf(MMPI, pdfFile, clientId, null)` | `PsychAssessmentUploadResponse.documentId` notNull, `documentRepository`에 해당 document 존재, `sourceType=SCANNED_PDF`, `storagePath` 단일 문자열 |
| P2 | PDF 업로드 후 동기 추출 호출 시 Extraction 레코드 생성 | 추출 | P1로 문서 생성 직후 | `extractionService` 동기 추출(또는 ensureExtractionSync 유도) | `PsychAssessmentExtraction` 1건 존재, `documentId` 일치, `ocrEngine=PDFBOX_MMPI2` (또는 추출 성공 시 동일 의미) |
| P3 | PDF 업로드·추출 후 리포트 생성 시 reportId 반환 | 리포트(선택) | P2까지 완료된 documentId | `reportService.generateLatestReport(documentId)` | `reportId` notNull·양수, `reportRepository`에 해당 report 존재 |
| P4 | PDF 업로드 시 tenantId 격리 | 테넌트 | tenantA, tenantB | 각 테넌트로 PDF 업로드 | document 각각 해당 tenantId만 가짐, countByTenantId 격리 |

**비고**: P2에서 추출이 비동기(enqueueExtraction)이면, 테스트에서 동기적으로 “추출 완료”를 기다리거나, `PsychAssessmentExtractionServiceImpl`의 동기 추출 메서드가 있다면 해당 호출로 검증. 없다면 “문서 생성 + enqueue 호출까지” 검증 후, 별도로 “동기 추출 실행 → Extraction 존재” 테스트를 추가할 수 있음.

### 3.2 이미지 업로드 통합 테스트 (`PsychAssessmentImageUploadIntegrationTest`)

| ID | @DisplayName | 시나리오 | Given | When | Then |
|----|----------------|----------|--------|------|------|
| I1 | 이미지 1장 업로드 시 문서 생성 및 storagePath JSON 배열 | 정상 | 테넌트, 소형 JPEG/PNG 1개 | `ingestService.uploadScannedImages(MMPI, List.of(imageFile), clientId, null)` | `documentId` notNull, document `sourceType=SCANNED_IMAGE`, `storagePath`가 JSON 배열 문자열 `["path"]` 형태 |
| I2 | 이미지 N장 업로드 시 문서 1건·경로 순서 유지 | 다중 | 테넌트, JPEG/PNG 2~3장 (순서 고정) | `uploadScannedImages(MMPI, filesOrdered, ...)` | document 1건, `storagePath` JSON 배열 길이 = N, 순서 동일 |
| I3 | 이미지 업로드 후 동기 추출 시 OCR → Mmpi2ExtractionParser 호출 (Tesseract 있을 때) | OCR·파싱 | I1 또는 I2로 생성된 document, **Tesseract 사용 가능** | 동기 추출 실행 | `PsychAssessmentExtraction` 1건, `ocrEngine=TESS4J_MMPI2`. extractedJson null이어도 “파서까지 호출됐는지”는 로그/상태로 판단 가능. (실제 MMPI 텍스트가 없으면 parsed null 가능) |
| I4 | Tesseract 없을 때 이미지 추출 테스트 스킵 | 조건부 | Tesseract 미설치 또는 tessdata kor 없음 | Assume.assumeTrue(tesseractAvailable) 또는 @Disabled | 테스트 스킵, 나머지 테스트는 실행 |

**Tesseract 사용 가능 여부**: `TesseractOcrService`를 주입해 “더미 이미지”로 `extractText` 한 번 호출해 예외 없으면 true, 또는 환경 변수/시스템 프로퍼티 `psych.assessment.tesseract.skipTests=true` 시 스킵.

### 3.3 (선택) API 레벨 통합 테스트

| ID | @DisplayName | 시나리오 | 비고 |
|----|----------------|----------|------|
| A1 | POST /api/v1/assessments/psych/documents (file=PDF) → 200, documentId 반환 | MockMvc, multipart, Authorization·X-Tenant-ID | 인증 방식은 프로젝트 통합 테스트 패턴 따름(addFilters = false 또는 테스트 토큰) |
| A2 | POST /api/v1/assessments/psych/documents (files=이미지들) → 200, documentId 반환 | multipart, files[] | Tesseract 스킵 조건 동일 적용 가능 |

---

## 4. 테스트 리소스 요구사항

### 4.1 PDF

- **필요**: 소형 PDF 1개 (매직 바이트 `%PDF-` 만족, 텍스트 1페이지 이상). 기존 `PsychAssessmentMmpiExtractionIntegrationTest`는 로컬 절대 경로(`/Users/mind/Downloads/mmpi_이혁진.pdf`) 사용.
- **권장**: `src/test/resources/psych-assessment/sample-mmpi.pdf` (또는 `sample.pdf`)에 **테스트 전용 소형 PDF** 배치. 바이너리 커밋 시 용량 최소화(예: 1페이지, 수십 KB). 없으면 테스트에서 `Assume.assumeTrue(Files.isRegularFile(samplePdf))`로 리소스 없을 때 스킵.

### 4.2 이미지 (JPEG/PNG)

- **필요**: 테스트용 소형 이미지 1~3장.  
  - **옵션 A**: 실제 MMPI 결과지와 무관한 “텍스트 일부 포함” 이미지(예: 흰 배경 + “원점수” 등 한글 라인) → OCR·파서까지 검증 시 유리.  
  - **옵션 B**: 최소한의 유효 JPEG/PNG(매직 바이트만 만족, 내용 무관) → “문서 생성 + 저장 + 추출 호출”까지만 검증.
- **권장 경로**: `src/test/resources/psych-assessment/sample-image.jpg`, `sample-image2.png` 등.  
- **용량**: 각 50KB 이하 권장(CI 부담·리포지터리 크기).

### 4.3 Mock OCR 여부

- **통합 테스트**: 실제 Tesseract 호출으로 “OCR → 파서” 경로를 검증하는 것을 권장. Tesseract 없을 때는 **스킵**.
- **Mock OCR**: 단위 테스트용. 예: `PsychAssessmentExtractionServiceImpl`에서 `TesseractOcrService`를 Mock하고 `when(ocr.extractText(any())).thenReturn("원점수\n...")`로 파서만 검증하는 테스트는 **단위 테스트**에서 수행. 통합 테스트 설계서에서는 “실제 OCR + Tesseract 없으면 스킵”만 명시.

---

## 5. core-coder 전달용 태스크 설명

아래 문단을 **그대로** core-coder에게 전달해 통합 테스트 **구현**을 요청할 수 있습니다.

---

**태스크 제목**: 심리검사 PDF·이미지 업로드 통합 테스트 구현

**참조 문서**  
- `docs/psych-assessment/PSYCH_UPLOAD_INTEGRATION_TEST_DESIGN.md` (본 설계서)  
- `docs/psych-assessment/PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN.md`  
- `docs/standards/TESTING_STANDARD.md`

**구현 요청 사항**

1. **PDF 업로드 통합 테스트 (신규 클래스)**  
   - 클래스명: `PsychAssessmentPdfUploadIntegrationTest`  
   - 위치: `src/test/java/com/coresolution/consultation/assessment/integration/`  
   - 테스트 케이스: 설계서 §3.1의 P1~P4 구현.  
   - Given-When-Then, `@DisplayName("한글")` 적용. 테스트 데이터는 UUID/동적 tenantId 사용, 프로덕션 데이터·하드코딩 ID 금지.  
   - PDF 리소스: `src/test/resources/psych-assessment/sample.pdf` (또는 `sample-mmpi.pdf`) 사용. 없으면 `Assume.assumeTrue(파일 존재)`로 스킵.  
   - 추출이 비동기(enqueue)이면, 동기 추출을 호출할 수 있는 메서드가 있다면 그걸로 검증하고, 없으면 “문서 생성 + enqueue 호출”까지 검증한 뒤, “동기 추출 실행”은 별도 메서드/테스트로 분리.

2. **이미지 업로드 통합 테스트 (신규 클래스)**  
   - 클래스명: `PsychAssessmentImageUploadIntegrationTest`  
   - 위치: 동일 `.../integration/`  
   - 테스트 케이스: 설계서 §3.2의 I1~I4 구현.  
   - Tesseract 미사용 환경: I3·I4에서 `Assume.assumeTrue(tesseractAvailable)` 또는 `@Disabled("Tesseract 및 tessdata 필요")` 적용. `tesseractAvailable`은 `TesseractOcrService.extractText(작은 이미지 InputStream)` 호출 시 예외 없으면 true로 판단하거나, 환경 변수 `TESSDATA_PREFIX`/설정 존재 여부로 판단.  
   - 이미지 리소스: `src/test/resources/psych-assessment/sample-image.jpg`( 및 필요 시 `sample-image2.png`). 없으면 해당 테스트 스킵.

3. **테스트 리소스**  
   - `src/test/resources/psych-assessment/` 디렉터리 생성.  
   - 소형 PDF 1개, 소형 JPEG 1~2개(또는 PNG 1개)를 배치. 리포지터리에 커밋 가능한 크기(각 수십 KB 이하 권장). 없으면 위와 같이 assume/스킵 처리.

4. **공통**  
   - `@SpringBootTest`, `@Transactional`, `@ActiveProfiles("test")`(또는 기존 통합 테스트와 동일한 profile).  
   - TenantContextHolder 설정/해제 (`@BeforeEach`/`@AfterEach`).  
   - 테넌트 격리 검증 시 기존 `PsychAssessmentStatsIntegrationTest` 패턴 참고(UUID 테넌트 생성 등).

**구현하지 말 것**  
- E2E(Playwright) 코드는 본 태스크 범위 외.  
- 단위 테스트(Mock OCR)는 별도 이슈로 진행 가능.

---

## 6. 체크리스트 (테스트 설계 검증)

- [x] `docs/standards/TESTING_STANDARD.md` 참조
- [x] PDF 플로우: 문서 생성 → 추출 → (선택) 리포트 생성 케이스 나열
- [x] 이미지 플로우: 1장/N장 업로드 → 문서 생성 → OCR → Mmpi2ExtractionParser, Tesseract 없을 때 스킵 명시
- [x] 테스트 리소스: 소형 PDF·JPEG/PNG 경로·Mock OCR 여부 정리
- [x] core-coder 전달용 태스크 문구 포함
