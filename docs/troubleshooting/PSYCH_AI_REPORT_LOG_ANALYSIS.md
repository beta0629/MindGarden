# Psych AI / Gemini 리포트 로그 분석 결과

**분석 일자**: 2026-03-02  
**목적**: 리포트 결과에 해석이 없는 원인 파악 (서버/로컬 로그에서 Psych AI·Gemini 관련 로그 확인)

---

## 1. 확인한 로그 파일

| 파일 | 경로 | 비고 |
|------|------|------|
| 일반 로그 | `logs/coresolution.log`, `logs/coresolution.2026-03-02.*.log` | INFO 포함 |
| 에러 로그 | `logs/error.log`, `logs/error.2026-03-02.*.log` | ERROR만 |

- **현재 활성 파일**: `coresolution.log` (약 33,811줄), `error.log` (약 27,839줄)
- **최근 500줄**: 위 키워드 없음 → 최근에는 Psych AI 리포트 생성 요청이 없었음
- **롤링 파일** (`coresolution.2026-03-02.0.log`, `error.2026-03-02.0.log`, `*.2026-03-02.1.log`)에서만 Psych AI·Gemini 관련 로그 발견

---

## 2. 발견 내용 요약

### 2.1 Psych AI 리포트 생성 실패 (404 Not Found)

| 항목 | 내용 |
|------|------|
| **타임스탬프** | 2026-03-02 01:18:09.120, 2026-03-02 01:19:33.926 |
| **로그 메시지** | `Psych AI report generation failed: tenantId=tenant-incheon-consultation-006, type=MMPI, error=404 Not Found: [no body]` |
| **발생 위치** | `OpenAIPsychAiServiceImpl.generateKoreanReport` → `RestTemplate.exchange` (Gemini API 호출) |
| **성공/실패** | **실패** |
| **에러** | `org.springframework.web.client.HttpClientErrorException$NotFound: 404 Not Found: [no body]` |

**호출 경로**

1. `PsychAssessmentExtractionServiceImpl`: 추출 완료 후 `reportService.generateLatestReport(documentId)` 호출
2. `PsychAssessmentReportServiceImpl.generateLatestReport()` → `psychAiService.generateKoreanReport(...)`
3. `OpenAIPsychAiServiceImpl`: `providerId == "gemini"` 이면 `callGeminiApiWithFallback()` → `callGeminiApi()`  
4. `callGeminiApi()`: `baseUrl + "/models/" + model + ":generateContent"` 로 POST → **404 수신**

**원인 추정**

- Gemini API 엔드포인트에서 **해당 모델 리소스를 찾을 수 없음**.
- 사용 중인 **모델명**이 Google 쪽 실제 모델/경로와 다르거나, **API URL(baseUrl)** 이 잘못되었을 가능성.
- 코드상 404 폴백: **모델명에 `"3.1"`이 포함된 경우에만** `gemini-1.5-pro`로 재시도.
  - 설정 모델이 `gemini-3.1-pro`가 아니거나, 404가 다른 이유로 나오면 폴백 없이 실패.

**해석 없음과의 연결**

- API가 404로 실패 → `generateKoreanReport()` 예외 → `AiResult(baseMarkdown, "{\"ai\":\"failed\"}", ...)` 형태로 규칙 기반 초안만 반환.
- 따라서 **리포트에는 규칙 기반 요약만 나오고, AI 해석(요약/권고/추적 질문 등)이 빠진 상태**가 됨.

---

### 2.2 validation failed / insufficient_evidence

- **검색 결과**: 로그에 **한 건도 없음**.
- **의미**: Psych AI가 **검증 단계까지 도달하지 못함**.
  - 404로 API 호출이 실패하여, `parseAndValidateAiOutput()` 또는 `validateModelOutput()` (예: `insufficient_evidence`, `validation failed`) 로그가 남을 기회가 없음.
- 즉, **해석 없음의 직접 원인은 validation이 아니라 API 404**로 보는 것이 맞음.

---

### 2.3 OpenAIPsychAiServiceImpl 생성자 예외 (기동 실패)

| 항목 | 내용 |
|------|------|
| **타임스탬프** | 2026-03-02 02:01:49.320 |
| **로그** | `Failed to instantiate [OpenAIPsychAiServiceImpl]: Constructor threw exception` |
| **원인** | `java.lang.Error: Unresolved compilation problems:` (Syntax error, record Validation 등) |
| **의미** | **컴파일 실패 상태의 클래스**가 로드됨. 해당 시점에 소스 수정 후 컴파일 오류가 있는 채로 빌드된 것으로 추정. |
| **이후** | 02:01:56 재시작 로그로 정상 기동된 것으로 보임. 현재 소스는 정상이므로 과거 일시적 컴파일 오류로 보는 것이 타당. |

---

## 3. 코드 참고 (확인된 로그 메시지 위치)

- **Psych AI report generation start**: `OpenAIPsychAiServiceImpl` 73–74행 (INFO)
- **Psych AI report generation failed**: 94행 (ERROR) ← **404 시 여기 기록됨**
- **Psych AI Gemini model X 404, retrying with gemini-1.5-pro**: 105행 (404 폴백 시)
- **Psych AI validation failed: reason=...**: 203행 (검증 실패 시, 이번 로그에는 없음)
- **insufficient_evidence**: 269행 `Validation(false, "insufficient_evidence:" + highlights.size())` (이번 로그에는 미발생)
- **Psych auto report generation failed**: `PsychAssessmentExtractionServiceImpl` 200행 (리포트 생성 예외 시)

---

## 4. 권장 조치

1. **Gemini 모델·URL 확인**
   - 시스템 설정(DB 등)의 `GEMINI_MODEL`, `GEMINI_API_URL` 확인.
   - 기본값: URL `https://generativelanguage.googleapis.com/v1beta`, 모델 `gemini-1.5-pro` (SystemConfigServiceImpl).
   - 404가 나는 환경에서는 **실제 사용 중인 모델명**과 **Google 문서의 generateContent 지원 모델/경로**가 일치하는지 확인.

2. **404 폴백 확대 검토**
   - 현재는 모델명에 `"3.1"`이 포함된 경우에만 `gemini-1.5-pro`로 재시도.
   - **모델명과 무관하게** 404 시 `gemini-1.5-pro` 등 안정 모델로 한 번 재시도하도록 변경하면, 잘못된 모델명/경로로 인한 “해석 없음”을 줄일 수 있음.

3. **운영/개발 서버 로그 추가 확인**
   - 이 분석은 **로컬/테스트** 로그 기준.
   - **운영·개발 서버**에서도 동일 키워드로 검색 권장:
     - `tail -n 400` 이상: `logs/coresolution.log`, `logs/error.log` (또는 `coresolution.2026-*.log`, `error.2026-*.log`)
     - 검색어: `Psych AI`, `Gemini`, `callGeminiApi`, `validation failed`, `insufficient_evidence`, `report generation`, `404`

4. **리포트 생성 시 로그 확인**
   - 실제 사용자가 리포트 생성한 직후에는 다음 로그가 나와야 함:
     - `Psych AI report generation start: provider=..., model=..., metricsCount=...`
     - 성공 시: `Psych AI Gemini success: model=..., responseLen=...` 또는 (OpenAI 형식 사용 시) 해당 성공 로그
     - 실패 시: `Psych AI report generation failed: ...` 또는 `Psych AI validation failed: ...`
   - 위 로그가 전혀 없으면: 해당 요청이 Psych AI까지 도달하지 않았거나, 추출/리포트 생성 경로가 다르게 동작하는지 확인 필요.

---

## 5. 한 줄 요약

- **리포트에 해석이 없는 이유**: Psych AI가 **Gemini API 호출에서 404 Not Found**를 받아 실패하고, 규칙 기반 초안만 저장되기 때문.
- **validation failed / insufficient_evidence**는 로그에 없으며, 원인은 **API 404**로 보는 것이 맞음.
- 조치: **Gemini 모델명·API URL 설정 점검** 및 **404 시 폴백(예: gemini-1.5-pro 재시도) 확대**.
