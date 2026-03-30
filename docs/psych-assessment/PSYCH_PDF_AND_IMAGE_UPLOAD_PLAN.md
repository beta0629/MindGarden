# 심리검사 리포트(AI) — PDF + 이미지 업로드 지원 구현 기획

**작성일**: 2026-03-02  
**목적**: 심리검사 업로드를 **PDF 전용**에서 **PDF + 이미지(JPG/PNG)** 로 확장하고, 이미지는 **Tess4J(OCR)** 로 텍스트 추출 후 기존 Mmpi2ExtractionParser 파이프라인에 통합한다.  
**참조 문서**: `docs/psych-assessment/PSYCH_IMAGE_OCR_REVIEW.md`

---

## 1. 목표·배경 (1~2문장)

임상심리사가 결과지를 종이(하드카피)로 전달하는 경우, 담당자가 **휴대폰으로 촬영한 사진** 또는 **PDF**를 올려도 AI 리포트가 생성되도록 한다. 문서 1건은 **PDF 1개** 또는 **이미지 N장(다중 파일 업로드, 순서 유지)** 으로 정의하며, OCR은 **Tess4J(Tesseract)** 기준으로 단계를 수립한다.

---

## 2. 범위 (이번 개발에 포함할 기능)

| 구간 | 포함 기능 |
|------|-----------|
| **백엔드 — 검증** | `PsychAssessmentFileValidator`: PDF + 이미지(JPG/PNG) 허용, Content-Type/확장자/매직 바이트 검사, 크기 제한 유지 |
| **백엔드 — 저장** | `EncryptedFileStorageService`: PDF용 `storePdf` 유지 + 이미지/바이너리용 `storeFile`(또는 `storeImage`) 추가. 다중 이미지 시 파일별 저장 후 경로·순서 보관 |
| **백엔드 — 도메인** | 문서 1건 = PDF 1개 또는 이미지 N장. 이미지 N장일 때 페이지/경로 보관 방식 확장(기존 `storagePath` 단일 값 또는 별도 테이블/JSON) |
| **백엔드 — 추출** | `PsychAssessmentExtractionServiceImpl`: 문서 타입에 따라 분기 — PDF → PDFBox 텍스트 추출, 이미지 → Tess4J OCR. 다중 이미지는 순서대로 OCR 후 텍스트 이어붙여 `Mmpi2ExtractionParser.parse(text)` 호출 |
| **백엔드 — API** | 업로드 API: 단일 파일(PDF 1개) 또는 다중 파일(이미지 N장, 1건으로 묶음) 수용. `PsychAssessmentIngestService` 시그니처 확장 및 Controller 파라미터 조정 |
| **프론트** | 업로드 UI: `accept`에 PDF + 이미지 추가, 다중 파일 선택 가능, 선택 순서 유지하여 전송. 타입 검사(PDF 또는 허용 이미지), 에러 메시지 표시 |
| **서버 환경** | Tesseract 엔진 설치(macOS/Linux), tessdata 한글(kor) 설치, tessdata 경로 설정(환경 변수 등) |

---

## 3. 비범위 (이번에 하지 않을 것)

| 항목 | 설명 |
|------|------|
| **ZIP 업로드** | 이미지들을 ZIP으로 압축해 업로드하는 방식은 미지원. 다중 파일 업로드만 지원 |
| **Google Cloud Vision API** | 클라우드 OCR 옵션은 이번 단계 제외. Tess4J(온프레미스)만 구현 |
| **이미지 → PDF 변환 후 PDF 파이프라인** | 이미지 N장을 PDF로 합친 뒤 PDFBox만 쓰는 방식은 채택하지 않음. 이미지별 OCR 후 텍스트 결합 방식으로 통일 |
| **이미지 전처리(리사이즈·그레이스케일·노이즈 제거)** | 필요 시 추후 단계에서 검토. 본 기획에서는 Tess4J 기본 동작 전제 |

---

## 4. 의존성·순서

- **선행**: 기존 PDF 업로드·검증·저장·추출 파이프라인 동작 유지.
- **순서**: Phase 1(검증·저장·도메인) → Phase 2(추출 분기·Tess4J·다중 이미지 OCR) → Phase 3(프론트) → Phase 4(서버 환경).  
  Phase 4(Tesseract 설치)는 Phase 2 구현·테스트와 병렬 또는 선행 가능(개발/운영 서버에 미리 설치해 두는 것을 권장).

---

## 5. 단계(Phase)

### Phase 1: 백엔드 — 파일 검증 확장, 저장소 확장, 도메인 확장

| 항목 | 내용 |
|------|------|
| **목표** | PDF 외에 이미지(JPG/PNG) 업로드를 허용하고, 검증·저장·도메인 모델을 확장한다. |
| **검증** | `PsychAssessmentFileValidator`: 메서드명 `validatePdfUpload` → `validateUpload` 등으로 확장하거나, PDF/이미지 공통 검증 + 타입별 매직 바이트 검사. 허용: `application/pdf`(.pdf), `image/jpeg`(.jpg, .jpeg), `image/png`(.png). JPEG 매직 `FF D8 FF`, PNG 매직 `89 50 4E 47 0D 0A 1A 0A`. |
| **저장소** | `EncryptedFileStorageService`: `storeFile(String tenantId, MultipartFile file)` 추가(또는 `storePdf`와 동일한 암호화 로직을 공통화한 뒤 PDF/이미지 모두 호출). 반환은 기존 `StoredEncryptedFile` 호환. 읽기: `readDecryptedFileAsInputStream(String storagePath)` 등으로 PDF 전용 메서드와 통합 또는 오버로드. `AesGcmEncryptedFileStorageService`에 구현. |
| **도메인** | 문서 1건 = 이미지 N장인 경우, (A) `PsychAssessmentDocument.storagePath`에 JSON 배열(경로 목록·순서) 저장, 또는 (B) 별도 엔티티 `PsychAssessmentDocumentPage`(document_id, storage_path, page_order)로 보관. sourceType: `SCANNED_PDF` / `SCANNED_IMAGE`(또는 `IMAGE`) 구분. DB 마이그레이션 필요 시 Flyway 스크립트. |

**완료 기준**: PDF 1개·이미지 1개 업로드 시 검증 통과, 암호화 저장 성공, 문서 레코드 생성까지 동작.

---

### Phase 2: 백엔드 — 추출 파이프라인 분기, Tess4J 연동, 다중 이미지 OCR·텍스트 결합

| 항목 | 내용 |
|------|------|
| **목표** | 저장된 문서가 PDF면 PDFBox로, 이미지(단일/다중)면 Tess4J OCR로 텍스트 추출 후, 동일하게 `Mmpi2ExtractionParser.parse(text)`에 넘겨 기존 리포트 플로우 유지. |
| **분기** | `PsychAssessmentExtractionServiceImpl`(또는 내부 Runner): 문서의 sourceType/contentType 또는 storagePath 목록으로 PDF vs 이미지 판별. PDF → 기존 `tryExtractMmpi2FromPdf`. 이미지 → 새 메서드 `tryExtractMmpi2FromImages`(경로 목록, 순서 유지). |
| **Tess4J** | Maven 의존성 `net.sourceforge.tess4j:tess4j` 추가. 서비스/유틸 클래스에서 Tesseract 인스턴스 생성 시 `tessdata` 경로를 환경 변수(예: `TESSDATA_PREFIX`) 또는 `psych.assessment.tesseract.datapath` 등으로 지정. 한글 `kor.traineddata` 사용. |
| **다중 이미지** | 경로 목록을 순서대로 읽어 각 이미지에 대해 OCR 수행, 추출 텍스트를 줄 단위로 이어붙인 뒤 한 번에 `Mmpi2ExtractionParser.parse(combinedText)` 호출. |
| **읽기 API** | 저장소에 `readDecryptedFileAsInputStream(storagePath)` 형태로 단일 파일 읽기 제공(이미지용). PDF 전용 메서드와 통합 가능. |

**완료 기준**: PDF 업로드 → 기존대로 추출·파싱·리포트 생성. 이미지(1장 또는 N장) 업로드 → OCR → 파싱 → 리포트 생성 end-to-end 동작.

---

### Phase 3: 프론트 — 업로드 UI(accept PDF+이미지, 다중 파일), API 연동

| 항목 | 내용 |
|------|------|
| **목표** | 사용자가 PDF 1개 또는 이미지 여러 장을 선택해 업로드할 수 있게 하고, 백엔드 API(단일 PDF / 다중 이미지 1건)와 연동한다. |
| **UI** | `PsychUploadSection.js`: `accept`에 `application/pdf, image/jpeg, image/png` 및 `.pdf, .jpg, .jpeg, .png` 반영. 다중 파일 선택 허용(`multiple` 또는 드래그앤드롭으로 여러 파일 수집). 선택 순서 유지하여 전송. |
| **검증** | 클라이언트에서 파일 타입 검사: PDF 또는 허용 이미지만 허용. 혼합(PDF + 이미지 한꺼번에) 정책 결정: “1건 = PDF 1개 또는 이미지 N장만”이면 PDF 선택 시 1개만, 이미지 선택 시 N장만 허용하도록 안내. |
| **API 연동** | 단일 PDF: 기존 `POST /api/v1/...` + `file` 1개. 다중 이미지: `files`(또는 `file` 다중) + `type` 등으로 1건 등록. 응답은 동일하게 `PsychAssessmentUploadResponse`(documentId 등). |
| **표시** | 업로드 영역 안내 문구: “PDF 또는 이미지(JPG, PNG)를 올려주세요. 여러 장은 순서대로 선택하면 됩니다.” 등. 에러 메시지: “PDF 또는 이미지 파일만 업로드할 수 있습니다.”, “파일 크기가 제한을 초과합니다.” 등. |

**완료 기준**: PDF 1개 업로드 시 기존과 동일 동작. 이미지 여러 장 선택 후 업로드 시 1건으로 등록되고, 목록에 문서 1개 표시, AI 리포트 생성 가능.

---

### Phase 4: 서버 환경 — Tesseract 엔진·tessdata 한글 설치, 설정

| 항목 | 내용 |
|------|------|
| **목표** | Tess4J가 사용할 Tesseract 엔진과 한글 tessdata를 서버(및 개발 PC)에 설치하고, 프로젝트에서 경로를 지정할 수 있게 한다. |
| **Tesseract 설치** | 아래 §7 참조. macOS: Homebrew. Linux: apt/yum. |
| **tessdata 한글(kor)** | `tessdata` 디렉터리에 `kor.traineddata` 배치. [tesseract-ocr/tessdata](https://github.com/tesseract-ocr/tessdata) 또는 `tessdata_fast`/`tessdata_best` 중 선택. |
| **경로 지정** | 환경 변수 `TESSDATA_PREFIX`(Tesseract 기본)를 tessdata 상위 디렉터리로 설정. 또는 애플리케이션 설정 `psych.assessment.tesseract.datapath`로 Tess4J에 전달. |

**완료 기준**: 해당 서버에서 `tesseract --list-langs` 시 `kor` 표시, 애플리케이션 기동 후 이미지 OCR 호출 시 한글 인식 동작.

---

## 6. 디자이너 전달 사항 (업로드 영역)

UI/비주얼 변경 시 **core-designer** 호출 시 아래를 전달한다. (참조: `/core-solution-planning` §0.4, §0.5)

- **사용성**: 관리자/담당자가 심리검사 결과지를 PDF 1개 또는 사진(이미지) 여러 장으로 업로드. 자주 쓰는 동작은 “파일 선택” 후 즉시 업로드. “1건 = PDF 1개 또는 이미지 N장만” 허용이면, PDF와 이미지를 한 번에 섞지 않는다는 안내.
- **정보 노출**: 업로드 가능 형식(PDF, JPG, PNG), 최대 용량, “여러 장 선택 시 순서가 유지됨” 안내. 에러 시 메시지(형식 오류, 크기 초과 등) 명확히 표시.
- **레이아웃**: 기존 업로드 영역(드래그앤드롭 또는 파일 선택 버튼) 유지. 안내 문구·에러 메시지 위치(업로드 영역 내부 또는 바로 아래).
- **요소 목록**:
  - 업로드 영역 안내 문구: “PDF 1개 또는 이미지(JPG, PNG) 여러 장을 올려주세요. 여러 장은 순서대로 선택하면 됩니다.”
  - 파일 형식·용량 제한 문구: “지원 형식: PDF, JPG, PNG / 최대 50MB” 등.
  - 에러 메시지: “PDF 또는 이미지 파일만 업로드할 수 있습니다.”, “파일 크기가 제한을 초과합니다.”, “허용되지 않은 파일 이름입니다.” 등.
- **참조**: 어드민 B0KlA·`unified-design-tokens.css`, `PsychUploadSection.css` 기존 스타일. AdminCommonLayout 사용 페이지는 기존 구조 유지.

---

## 7. 코더 전달 사항 (클래스/메서드/API 변경 목록, 파일 수준)

구현 시 **core-coder** 호출 시 아래를 태스크에 포함한다. (참조: `/core-solution-backend`, `/core-solution-frontend`, `/core-solution-api`)

### 7.1 백엔드

| 파일(패키지) | 변경 요약 |
|--------------|-----------|
| `PsychAssessmentFileValidator.java` | 허용 Content-Type/확장자에 `image/jpeg`, `image/png` 추가. 매직 바이트 검사: PDF + JPEG + PNG. 메서드명/시그니처: `validateUpload(MultipartFile)` 또는 `validatePdfUpload`/`validateImageUpload` 분리. |
| `EncryptedFileStorageService.java` (interface) | `storeFile(String tenantId, MultipartFile file)` 추가. `InputStream readDecryptedFileAsInputStream(String storagePath)` 추가(또는 기존 `readDecryptedPdfAsInputStream`을 공통 읽기로 확장). |
| `AesGcmEncryptedFileStorageService.java` | `storeFile` 구현(PDF/이미지 동일 암호화). `readDecryptedFileAsInputStream` 구현. |
| `PsychAssessmentDocument.java` (entity) | 이미지 N장 시: `storagePath`에 JSON 배열 저장하거나, sourceType에 `SCANNED_IMAGE` 추가. 별도 테이블 채택 시 `PsychAssessmentDocumentPage` 엔티티 및 Repository 추가. |
| `PsychAssessmentIngestService.java` / `PsychAssessmentIngestServiceImpl.java` | 단일 파일: 기존 `uploadScannedPdf(type, file, ...)` 유지. 다중 파일: `uploadScannedImages(type, List<MultipartFile> files, ...)` 또는 `upload(type, MultipartFile[] files, ...)` 추가. 내부에서 검증·저장·문서 1건 생성(이미지 N장이면 경로 목록/페이지 엔티티 저장). |
| `PsychAssessmentController.java` | 업로드 엔드포인트: `@RequestParam("file") MultipartFile file` 또는 `@RequestParam("files") MultipartFile[] files` 수용. 단일 PDF vs 다중 이미지 분기 후 Ingest 서비스 호출. |
| `PsychAssessmentExtractionServiceImpl.java` (및 내부 Runner) | 문서 타입/저장 형태에 따라 PDF 추출 vs 이미지 OCR 분기. `tryExtractMmpi2FromPdf` 유지. `tryExtractMmpi2FromImages(storage, pathsInOrder)` 추가 → Tess4J로 순서대로 OCR, 텍스트 결합 후 `Mmpi2ExtractionParser.parse(combinedText)`. |
| 신규: Tess4J 연동 서비스/유틸 | 예: `TesseractOcrService.java` 또는 `PsychAssessmentOcrService.java`. `TessDataPath` 설정 주입, `String extractText(InputStream imageStream)` 또는 경로 기반 API. |

### 7.2 프론트엔드

| 파일 | 변경 요약 |
|------|-----------|
| `PsychUploadSection.js` | `accept`: `application/pdf, image/jpeg, image/png`. 다중 파일 선택 지원, 선택 순서 유지. 전송 시 단일 PDF면 file 1개, 이미지 N장이면 files 배열로 API 호출. |
| `PsychAssessmentAdminWidget.js` | 파일 타입 검사: `application/pdf` 또는 `image/jpeg`/`image/png` 허용. 에러 메시지 문구 통일. |
| `PsychAssessmentManagement.js` | 동일하게 파일 타입 검사 및 다중 파일 업로드 플로우 반영. |
| API 호출 | StandardizedApi 사용. 업로드 URL은 기존 심리검사 업로드 엔드포인트. FormData에 `file` 또는 `files` + `type`, `clientId` 등. |

### 7.3 설정·의존성

| 항목 | 내용 |
|------|------|
| Maven | `pom.xml`에 `net.sourceforge.tess4j:tess4j` (예: 5.13.0) 추가. |
| 설정 | `application.yml` 또는 환경 변수: `psych.assessment.tesseract.datapath` 또는 `TESSDATA_PREFIX`. |

---

## 8. 서버 라이브러리 설치 — Tesseract 및 tessdata 한글(kor)

### 8.1 macOS (Homebrew)

```bash
# Tesseract 엔진 설치
brew install tesseract

# 설치 경로 확인 (일반적으로 /opt/homebrew 또는 /usr/local)
which tesseract
tesseract --version
```

### 8.2 Linux (Debian/Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr
```

### 8.3 Linux (RHEL/CentOS/Fedora)

```bash
sudo yum install -y tesseract
# 또는
sudo dnf install -y tesseract
```

### 8.4 tessdata 한글(kor) 설치

- Tesseract 기본 설치만으로는 한글 데이터가 없을 수 있음.
- [tesseract-ocr/tessdata](https://github.com/tesseract-ocr/tessdata) 또는 [tesseract-ocr/tessdata_fast](https://github.com/tesseract-ocr/tessdata_fast)에서 `kor.traineddata` 다운로드.
- 설치된 tessdata 디렉터리에 복사:
  - **macOS (Homebrew)**: `/opt/homebrew/share/tessdata/` 또는 `/usr/local/share/tessdata/`
  - **Linux (apt)**: `/usr/share/tesseract-ocr/4.00/tessdata/` (버전에 따라 경로 상이)

```bash
# 예: Linux에서 tessdata 디렉터리 확인
tesseract --list-langs
# kor가 없으면 해당 디렉터리에 kor.traineddata 추가

# 다운로드 예시 (tessdata_fast)
curl -L -o kor.traineddata https://github.com/tesseract-ocr/tessdata_fast/raw/main/kor.traineddata
sudo mv kor.traineddata /usr/share/tesseract-ocr/4.00/tessdata/
```

### 8.5 프로젝트에서 tessdata 경로 지정

- **환경 변수**: `TESSDATA_PREFIX`를 tessdata **상위** 디렉터리로 설정.  
  예: tessdata가 `/usr/share/tesseract-ocr/4.00/tessdata`이면 `TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00`.
- **Tess4J**: Tess4J는 기본적으로 `TESSDATA_PREFIX`를 사용한다. 또는 `Tesseract` 인스턴스에 `setDatapath("...")`로 `tessdata` 디렉터리 경로를 직접 지정.
- **Spring 설정**: `psych.assessment.tesseract.datapath`를 application.yml 또는 환경 변수로 두고, OCR 서비스에서 주입해 사용.

---

## 9. 리스크·제약

- **Tesseract 네이티브 설치**: 서버/개발 PC에 Tesseract가 없으면 Tess4J가 동작하지 않음. CI/로컬 테스트 시 Docker 또는 스킵 옵션 고려.
- **한글 인식률**: 휴대폰 사진 품질(해상도·기울기·조명)에 따라 OCR 품질이 달라질 수 있음. 전처리는 비범위로 두었으나 추후 개선 가능.
- **멀티테넌트**: 저장·조회 시 `tenantId` 계속 필수. `/core-solution-multi-tenant` 준수.
- **기존 PDF 플로우**: Phase 1·2에서 기존 PDF 업로드·추출 경로는 유지되어야 하며, 회귀 없이 동작해야 함.

---

## 10. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| Phase 1 | PDF·이미지 1개 업로드 시 검증·저장·문서 레코드 생성 | [ ] Validator에서 PDF/JPEG/PNG 허용 및 매직 바이트 검사 [ ] storeFile 또는 동일 암호화 저장 [ ] 문서 엔티티에 sourceType/경로 반영 [ ] 단일 이미지 업로드 시 DB에 1건 저장 |
| Phase 2 | PDF 기존 동작 유지, 이미지(1장/N장) OCR → 파싱 → 리포트 | [ ] PDF 추출 분기 유지 [ ] Tess4J 연동 및 kor tessdata [ ] 이미지 단일/다중 경로 순서대로 OCR·텍스트 결합 [ ] Mmpi2ExtractionParser에 결합 텍스트 전달 [ ] 리포트 생성 E2E |
| Phase 3 | 프론트에서 PDF 1개 또는 이미지 N장 업로드 가능 | [ ] accept 및 다중 선택 [ ] 타입 검사·에러 메시지 [ ] API 연동(단일 PDF / 다중 이미지) [ ] 목록에 문서 1건 표시 |
| Phase 4 | 서버에서 Tesseract·kor 사용 가능 | [ ] tesseract --list-langs 에 kor [ ] 애플리케이션 설정으로 datapath 지정 [ ] (선택) 배포 문서에 설치 절차 기재 |

---

## 11. 실행 위임 요청문 (서브에이전트 호출 순서)

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 1 (core-coder)**  
   - **태스크**: “`docs/psych-assessment/PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN.md` §7.1 Phase 1 부분을 구현. PsychAssessmentFileValidator 이미지 허용·매직 바이트, EncryptedFileStorageService storeFile/readDecryptedFileAsInputStream 확장, 도메인(문서 1건 = 이미지 N장 시 storagePath 또는 DocumentPage 테이블) 확장. 기존 PDF 업로드 경로 유지. 참조: `/core-solution-backend`, `/core-solution-database-first`.”

2. **Phase 2 (core-coder)**  
   - **태스크**: “동일 기획서 §7.1 Phase 2. PsychAssessmentExtractionServiceImpl에서 PDF vs 이미지 분기, Tess4J OCR 서비스 추가, 다중 이미지 순서 OCR·텍스트 결합 후 Mmpi2ExtractionParser 호출. Tess4J datapath는 설정/환경 변수로 주입. 참조: `/core-solution-backend`.”

3. **Phase 3 (core-designer → core-coder)**  
   - **core-designer**: “`docs/psych-assessment/PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN.md` §6 디자이너 전달 사항 반영. PsychUploadSection 업로드 영역 안내 문구(PDF/이미지, 여러 장 순서), 에러 메시지, 지원 형식·용량 표시. B0KlA·unified-design-tokens.css 참조. 코드 작성 없이 스펙·시안만.”
   - **core-coder**: “동일 기획서 §7.2. PsychUploadSection accept·다중 파일·API 연동, PsychAssessmentManagement·PsychAssessmentAdminWidget 타입 검사·에러 메시지. 디자이너 산출물 반영. 참조: `/core-solution-frontend`, `/core-solution-api`.”

4. **Phase 4 (shell 또는 문서화)**  
   - 서버/로컬에 Tesseract·tessdata kor 설치 및 `TESSDATA_PREFIX`(또는 `psych.assessment.tesseract.datapath`) 설정. 필요 시 `docs/psych-assessment/` 또는 배포 문서에 설치 절차 추가.

Phase 4는 Phase 2 개발·테스트와 병렬 또는 선행 수행 가능하다.

---

## 12. 다음 단계 체크리스트

구현·배포 후 아래 순서로 동작을 확인한다.

| 순서 | 항목 | 확인 |
|------|------|------|
| 1 | `scripts/install-tesseract.sh` 실행 (Tesseract 엔진 + tessdata 한글 kor 설치) | [ ] |
| 2 | `TESSDATA_PREFIX` 환경 변수 또는 `psych.assessment.tesseract.datapath` 설정 (예: macOS Homebrew `/opt/homebrew/share/tessdata`) | [ ] |
| 3 | 애플리케이션 재기동 | [ ] |
| 4 | PDF 1개 업로드 후 저장·목록 표시 확인 | [ ] |
| 5 | 이미지 1장 또는 N장 업로드 후 AI 리포트 생성 확인 | [ ] |
