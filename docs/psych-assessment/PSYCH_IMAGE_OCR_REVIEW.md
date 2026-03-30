# 심리검사 리포트(AI) — 휴대폰 사진(이미지) 업로드 검토

**작성일**: 2026-02-12  
**목적**: 현재 PDF 전용인 심리검사 업로드/추출 파이프라인에 **휴대폰 사진(이미지)** 지원 가능 여부 및 필요 라이브러리·플러그인 검토.

**배경**: 임상심리사가 결과지를 **PDF가 아닌 하드카피(종이)**로 전달하는 경우가 많다. 이때 담당자가 휴대폰으로 촬영한 사진을 올려도 AI 리포트가 생성되도록 하려는 요구가 있음.

---

## 1. 현재 구조 요약

| 구간 | 구현 | 비고 |
|------|------|------|
| **프론트** | `application/pdf`만 허용, `.pdf` 확장자 체크 | PsychAssessmentManagement.js, PsychAssessmentAdminWidget.js, PsychUploadSection.js |
| **업로드 검증** | `PsychAssessmentFileValidator`: Content-Type `application/pdf`, 확장자 `.pdf`, 매직 바이트 `%PDF-` | 이미지 거부 |
| **저장** | `EncryptedFileStorageService.storePdf()` — PDF 전용 암호화 저장 | |
| **추출** | `PsychAssessmentExtractionServiceImpl`: **Apache PDFBox**로 PDF 텍스트 추출 → `Mmpi2ExtractionParser` 파싱 | 이미지 미지원 |

즉, **이미지(JPG/PNG 등)를 넣으려면** (1) 업로드 허용, (2) 저장 방식, (3) **이미지 → 텍스트(OCR)** 단계가 추가되어야 함.

---

## 2. 휴대폰 사진 지원 가능 여부

**가능합니다.**  
이미지에서 텍스트를 추출하는 **OCR(광학 문자 인식)** 단계를 넣으면, 기존 MMPI-2 파서(`Mmpi2ExtractionParser`)는 “텍스트 문자열”만 받으므로 **추출된 텍스트**를 그대로 넘기면 됩니다.

- **단일 사진**: 이미지 → OCR → 텍스트 → 기존 파서 → `extracted_json` → AI 리포트.
- **여러 장 사진**:  
  - (A) 이미지별 OCR → 텍스트 이어붙이기 후 한 번 파서 통과  
  - (B) 이미지들을 PDF로 합친 뒤 기존 PDF 추출 경로 사용(구현 복잡도·품질에 따라 선택).

---

## 3. 필요한 라이브러리·플러그인 옵션

### 3.1 옵션 A: Tess4J (Tesseract OCR) — 온프레미스

| 항목 | 내용 |
|------|------|
| **역할** | 이미지(JPG/PNG 등) → 텍스트 문자열 |
| **라이브러리** | **Tess4J** (Tesseract의 Java JNA 래퍼) |
| **Maven** | `net.sourceforge.tess4j:tess4j:5.13.0` (또는 최신 패치 버전) |
| **전제 조건** | 서버에 **Tesseract 엔진** 설치 필요 (네이티브 라이브러리) |
| **한글** | `tessdata`에 `kor.traineddata` 추가 시 한글 지원 (`tessdata` / `tessdata_best` / `tessdata_fast` 중 선택) |
| **장점** | 비용 없음, 데이터 외부 전송 없음, 온프레미스·민감 데이터에 유리 |
| **단점** | 서버 설치·버전 관리 필요, 한글 인식률은 전처리(해상도·노이즈 제거)에 의존 |
| **참고** | [Tess4J](https://github.com/nguyenq/tess4j), [Tesseract tessdata](https://github.com/tesseract-ocr/tessdata) |

- 지원 이미지: PNG, JPEG, BMP, TIFF, GIF 등.  
- 휴대폰 사진은 해상도·기울기·조명에 따라 전처리(리사이즈·그레이스케일·노이즈 제거)를 권장.

---

### 3.2 옵션 B: Google Cloud Vision API — 클라우드

| 항목 | 내용 |
|------|------|
| **역할** | 이미지/문서 → 텍스트(및 레이아웃 정보) |
| **라이브러리** | **google-cloud-vision** (Java 클라이언트) |
| **Maven** | `com.google.cloud:google-cloud-vision` (버전은 프로젝트 호환 범위 내) |
| **전제 조건** | GCP 프로젝트, Vision API 활성화, 서비스 계정 키 또는 ADC |
| **한글** | DOCUMENT_TEXT_DETECTION / TEXT_DETECTION 모두 한글 지원 |
| **장점** | 설치 없음, 문서/사진 품질 대비 인식률 우수 |
| **단점** | 유료(호출당 과금), 이미지가 Google 클라우드로 전송됨(개인정보·의료 데이터 정책 검토 필요) |

- **TEXT_DETECTION**: 일반 이미지용.  
- **DOCUMENT_TEXT_DETECTION**: 문서/표 등 밀집 텍스트에 적합.  
- 심리검사 결과지 스캔/사진이면 DOCUMENT_TEXT_DETECTION 권장.

---

### 3.3 옵션 C: 이미지 → PDF 변환 후 기존 파이프라인

| 항목 | 내용 |
|------|------|
| **역할** | 이미지(1장 또는 N장) → PDF 1개 생성 → 기존 “PDF 업로드”와 동일 경로 |
| **라이브러리** | PDF 생성: **iText**, **Apache PDFBox**, 또는 **OpenPDF** 등 |
| **장점** | 업로드·저장·추출 로직을 “PDF만”으로 유지 가능. 사용자 경험은 “사진 올리면 내부에서 PDF로 만든다”로 통일. |
| **단점** | “이미지 PDF”는 텍스트 레이어가 없어서, **결국 PDF 페이지를 이미지로 렌더한 뒤 OCR**이 필요. 즉 PDFBox `PDFTextStripper`만으로는 부족하고, **PDF 각 페이지 → 이미지 → OCR** 파이프라인이 필요. |

- 정리: “사진 업로드”를 허용하되 **이미지를 바로 OCR**하는 편이 구현이 단순함.  
- “사진 여러 장 → PDF로 묶어서 보관”은 보존용으로만 쓰고, **추출은 이미지별 OCR 결과를 합치는 방식**이 낫습니다.

---

## 4. 구현 시 변경 포인트 요약

1. **프론트**
   - `accept`에 `image/jpeg`, `image/png` 등 추가.
   - 파일 타입 검사: PDF 또는 허용 이미지 포맷.

2. **PsychAssessmentFileValidator**
   - 허용 Content-Type/확장자에 이미지 추가 (예: `.jpg`, `.jpeg`, `.png`).
   - 이미지용 매직 바이트 검사 (JPEG: `FF D8 FF`, PNG: `89 50 4E 47 0D 0A 1A 0A`).

3. **저장소**
   - `EncryptedFileStorageService`: `storePdf` 외에 `storeImage` 또는 `storeFile(tenantId, file)` 형태로 이미지/바이너리 저장.
   - 기존과 동일하게 AES-GCM 암호화 저장 가능 (입력만 MultipartFile로 통일).

4. **추출**
   - 문서 타입/경로에 따라 분기:
     - PDF → 기존대로 PDFBox로 텍스트 추출.
     - 이미지 → **선택한 OCR 엔진**(Tess4J 또는 Vision API)으로 텍스트 추출.
   - 추출된 텍스트는 동일하게 `Mmpi2ExtractionParser.parse(text)`에 넘겨 기존 리포트 플로우 유지.

5. **여러 장 사진**
   - 업로드 시: 다중 파일 업로드 또는 1건당 “이미지 여러 장”을 하나의 문서로 묶는 정책 결정.
   - 추출 시: 페이지/이미지 순서대로 OCR 결과를 줄 단위로 이어붙인 뒤, 파서가 기대하는 테이블/텍스트 형식에 맞게 한 번에 파싱.

### 4.1 여러 장 이미지: ZIP vs 다중 파일 업로드

| 방식 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **ZIP 업로드** | 사용자가 이미지들을 zip으로 압축해 1개 파일로 업로드 | 요청 1회, 서버에서 압축 해제 후 순서 보장 가능 | 사용자가 압축 방법을 알아야 함, 모바일에서 번거로움 |
| **다중 파일 업로드** | input `multiple` + 한 번에 여러 장 선택 또는 순차 선택 | 압축 불필요, 휴대폰·PC 모두 익숙한 UX | API가 multipart 다중 파일 또는 여러 요청 지원 필요, **순서** 전달 방식 정의 필요 |

**권장: 압축(zip) 필수 아님 — 다중 파일 업로드**

- 사용자는 **여러 장을 그냥 한꺼번에 선택**해서 올리면 됨 (ZIP 만들 필요 없음).
- 프론트: `<input type="file" accept="image/*" multiple />` 또는 드래그앤드롭으로 여러 파일 수집 후, **파일 순서(이름 또는 선택 순서)** 를 유지해 한 번에 전송.
- 백엔드: `MultipartFile[]` 또는 `List<MultipartFile>`로 받아, 순서대로 저장·OCR 후 텍스트 이어붙이기.
- DB/도메인: "문서 1건 = 이미지 N장"이면 `PsychAssessmentDocument` 1개 + 첨부 이미지 경로/순서를 별도 테이블 또는 JSON으로 보관하는 방식으로 확장.

ZIP을 **허용**할지는 선택 사항(예: zip도 받고 내부 이미지만 꺼내서 처리)으로 두고, 기본 UX는 **다중 이미지 선택 업로드**로 가는 것을 권장.

---

## 5. 권장 방향

| 환경/요구사항 | 권장 |
|---------------|------|
| **데이터 외부 반출 불가·온프레미스** | **Tess4J(Tesseract)** + 한글 `tessdata` + 이미지 전처리(선택) |
| **빠른 도입·높은 인식률·클라우드 가능** | **Google Cloud Vision API** (DOCUMENT_TEXT_DETECTION) |
| **이미지 + PDF 통합 저장** | 저장은 “바이너리 암호화 저장”으로 통일하고, Content-Type/확장자로 PDF vs 이미지 구분 후 추출 단계에서만 PDFBox vs OCR 분기 |

**최소 변경으로 검증하려면**:  
- 이미지 허용 확장자/Content-Type만 추가하고,  
- 추출 단계에 **Tess4J** 또는 **Vision API** 한 가지를 선택해 “이미지일 때만 OCR 호출” 분기 추가하는 방식이 적당합니다.

---

## 6. 참고 링크

- [Tess4J (Tesseract for Java)](https://github.com/nguyenq/tess4j)
- [Tesseract tessdata (한글: kor)](https://github.com/tesseract-ocr/tessdata)
- [Google Cloud Vision API - Document text detection](https://cloud.google.com/vision/docs/samples/vision-document-text-tutorial)
- [Google Cloud Vision API - Text detection (Java)](https://cloud.google.com/vision/docs/samples/vision-fulltext-detection)
