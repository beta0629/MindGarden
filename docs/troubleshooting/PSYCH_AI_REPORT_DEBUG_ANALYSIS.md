# 심리검사 AI 리포트 baseMarkdown만 표시·AI 해석 없음 — 원인 분석 및 수정 제안

**분석 일자**: 2026-03-03  
**목적**: baseMarkdown(규칙 기반 초안)만 표시되고 AI 해석이 없는 원인 파악 및 core-coder용 수정 제안

**전제**: Gemini API 키는 시스템 설정에서 "정상 동작"으로 테스트됨. API 키 미설정은 아님.

---

## 1. 원인 분석 요약

### 1.1 증상

- 리포트에 **규칙 기반 초안(baseMarkdown)** 만 표시됨
- AI 해석(요약·권고·추적 질문 등) 없음
- Gemini API 키 테스트는 성공

### 1.2 추적 경로

```
PsychAssessmentReportServiceImpl.generateLatestReport()
  → psychAiService.generateKoreanReport(assessmentType, aiInputs, baseMarkdown)
  → OpenAIPsychAiServiceImpl.generateKoreanReport()
       → systemConfigService.getAiDefaultProvider()        // "gemini"
       → systemConfigService.getApiKeyForProvider("gemini") // GEMINI_API_KEY
       → systemConfigService.getApiUrlForProvider("gemini")  // GEMINI_API_URL (또는 기본값)
       → systemConfigService.getModelForProvider("gemini")  // GEMINI_MODEL (또는 기본값)
       → callGeminiApiWithFallback(apiKey, apiUrl, model, ...)
       → callGeminiApi() → RestTemplate.exchange(url, ...)
```

**실패 시**: 예외 발생 → `catch` 블록 → `AiResult(baseMarkdown, "{\"ai\":\"failed\"}", model, PROMPT_VERSION)` 반환 → 리포트에 baseMarkdown만 저장

---

## 2. 가능한 원인별 상세 분석

### 2.1 키 테스트 vs 실제 리포트 생성 경로 차이

| 항목 | 키 테스트 (`/test-gemini`) | Psych AI 리포트 생성 |
|------|---------------------------|----------------------|
| **API 키** | 요청 body의 `apiKey` (폼 입력값) 또는 `GEMINI_API_KEY` | `systemConfigService.getApiKeyForProvider("gemini")` |
| **API URL** | **하드코딩** `https://generativelanguage.googleapis.com/v1beta` | `getApiUrlForProvider()` → DB `GEMINI_API_URL` 또는 기본값 |
| **모델** | ListModels API로 첫 번째 `generateContent` 지원 모델 사용, 없으면 `gemini-3.1-pro` | DB `GEMINI_MODEL` 또는 기본값 `gemini-1.5-pro` |
| **요청** | 단순 "Say OK in one word." | JSON 스키마 요구(심리검사 전용 프롬프트) |

**핵심 차이**:
- 키 테스트는 **URL·모델을 하드코딩/ListModels로 결정** → 항상 동작 가능한 조합 사용
- 리포트 생성은 **DB에 저장된 GEMINI_API_URL, GEMINI_MODEL 사용** → 잘못 저장 시 실패

**문제 시나리오**:
1. `GEMINI_API_URL`이 빈 문자열로 저장된 경우: `getConfigValue`는 빈 값을 그대로 반환 → `baseUrl = ""` → `url = "/models/...:generateContent"` (상대 경로) → 호출 실패
2. `GEMINI_MODEL`이 `gemini-3.1-pro` 등 존재하지 않는 모델로 저장된 경우 → 404

---

### 2.2 Gemini 404 (모델명/URL)

**로그 근거** (PSYCH_AI_REPORT_LOG_ANALYSIS.md):
- `Psych AI report generation failed: ... error=404 Not Found: [no body]`
- `callGeminiApi()`: `baseUrl + "/models/" + model + ":generateContent"` 로 POST → 404 수신

**404 원인 후보**:
1. **모델명 오류**: `gemini-3.1-pro` 등 Google 문서와 다른 ID 사용. 실제 모델 ID는 `gemini-3.1-pro-preview` 등일 수 있음.
2. **baseUrl 오류**: `GEMINI_API_URL`이 빈 문자열이거나 잘못된 URL로 저장됨.
3. **API 버전 불일치**: v1 vs v1beta 등.

**현재 404 폴백 로직** (`OpenAIPsychAiServiceImpl` 102–113행):

```java
if (msg.contains("404") && !GEMINI_FALLBACK_MODEL.equals(model)) {
    return callGeminiApi(apiKey, baseUrl, GEMINI_FALLBACK_MODEL, ...);
}
throw e;
```

- **한계**: `model == gemini-1.5-pro`인데 404가 나면 (예: baseUrl 잘못됨) 폴백 없이 예외 전파.
- **한계**: baseUrl 자체가 잘못된 경우, 폴백 모델로 바꿔도 404 지속.

---

### 2.3 AI 응답 검증 실패 (parseAndValidateAiOutput)

**검증 실패 시**: `baseMarkdownWithDisclaimer(baseMarkdown, reason)` 반환 → baseMarkdown + "AI 생성 결과가 검증 기준을 통과하지 못해..." 안내 문구.

**검증 실패 조건** (`validateModelOutput`):

| reason | 조건 |
|--------|------|
| `invalid_json_root` | JSON 루트가 객체가 아님 |
| `missing_report_markdown` | `reportMarkdown` 없음 또는 빈 문자열 |
| `missing_required_sections` | `## 요약` 또는 `## 권고` 없음 |
| `invalid_evidence_structure` | `evidence.highlights`가 배열이 아님 |
| `insufficient_evidence:N` | `highlights.size() < 1` |
| `missing_basedOn` | highlight의 `basedOn` 없음/빈 배열 |
| `missing_scaleCode` | `basedOn` 항목에 `scaleCode` 없음 |
| `hallucinated_scaleCode:X` | `scaleCode`가 입력 metrics에 없음 |

**추가 검증** (parseAndValidateAiOutput 내부):
- `isMostlyKorean(reportMarkdown)` 실패 → "한국어 출력 위반"
- `containsForbiddenText(reportMarkdown)` → "금지 문구 탐지"
- JSON 파싱 예외 → "AI 출력 파싱 실패"

**판단**: 로그에 `Psych AI validation failed`, `insufficient_evidence` 등이 없으면, **검증 단계까지 도달하지 못한 것** → API 호출 단계에서 이미 실패(404 등)한 것으로 보는 것이 타당.

---

### 2.4 프롬프트/입력 형식

- `buildUserPrompt`에서 `baseMarkdown`, `metrics`(JSON) 전달.
- `responseMimeType: "application/json"`으로 JSON 출력 요구.
- AI가 JSON 형식을 지키지 않거나, `reportMarkdown`/`evidence` 구조가 다르면 `parseAndValidateAiOutput`에서 실패.

**판단**: API가 404로 실패하면 응답 자체가 없어, 프롬프트/파싱 이슈는 부차적. 우선 404·URL·모델 문제 해결이 선행되어야 함.

---

## 3. 수정 제안 (core-coder용)

### 3.1 SystemConfigServiceImpl — URL/모델 blank 시 기본값 사용

**파일**: `src/main/java/com/coresolution/consultation/service/impl/SystemConfigServiceImpl.java`

**문제**: `GEMINI_API_URL` 또는 `GEMINI_MODEL`이 DB에 빈 문자열로 저장되면, `getConfigValue`가 빈 값을 그대로 반환하여 잘못된 URL/모델 사용.

**수정**:

```java
@Override
public String getApiUrlForProvider(String providerId) {
    String key = providerId != null ? providerId.trim().toLowerCase() : "";
    String prefix = PROVIDER_PREFIX.get(key);
    if (prefix == null) {
        return "";
    }
    String defaultUrl = DEFAULT_API_URL.getOrDefault(key, "");
    String value = getConfigValue(prefix + "_API_URL", defaultUrl);
    return (value != null && !value.isBlank()) ? value : defaultUrl;
}

@Override
public String getModelForProvider(String providerId) {
    String key = providerId != null ? providerId.trim().toLowerCase() : "";
    String prefix = PROVIDER_PREFIX.get(key);
    if (prefix == null) {
        return "";
    }
    String defaultModel = DEFAULT_MODEL.getOrDefault(key, "");
    String value = getConfigValue(prefix + "_MODEL", defaultModel);
    return (value != null && !value.isBlank()) ? value : defaultModel;
}
```

---

### 3.2 OpenAIPsychAiServiceImpl — 404 폴백 확대 및 baseUrl 검증

**파일**: `src/main/java/com/coresolution/consultation/assessment/service/impl/OpenAIPsychAiServiceImpl.java`

**수정 1**: baseUrl이 blank일 때 기본 URL 사용

`generateKoreanReport` 내부, `callGeminiApiWithFallback` 호출 전:

```java
// 78행 근처, rawContent 할당 전
if ("gemini".equalsIgnoreCase(providerId)) {
    String effectiveUrl = (apiUrl != null && apiUrl.isBlank())
            ? "https://generativelanguage.googleapis.com/v1beta"
            : apiUrl;
    rawContent = callGeminiApiWithFallback(apiKey, effectiveUrl, model, systemPrompt, userPrompt);
}
```

**수정 2**: 404 시 모델과 무관하게 폴백 모델로 재시도

```java
private String callGeminiApiWithFallback(String apiKey, String baseUrl, String model, String systemPrompt, String userPrompt) {
    try {
        return callGeminiApi(apiKey, baseUrl, model, systemPrompt, userPrompt);
    } catch (Exception e) {
        String msg = e.getMessage() != null ? e.getMessage() : "";
        if (msg.contains("404") && !GEMINI_FALLBACK_MODEL.equals(model)) {
            log.info("Psych AI Gemini 404 (model={}), retrying with {}", model, GEMINI_FALLBACK_MODEL);
            return callGeminiApi(apiKey, baseUrl, GEMINI_FALLBACK_MODEL, systemPrompt, userPrompt);
        }
        // 404인데 이미 fallback 모델이었으면, baseUrl 문제일 수 있음 → 기본 URL로 재시도
        if (msg.contains("404")) {
            String defaultUrl = "https://generativelanguage.googleapis.com/v1beta";
            if (!defaultUrl.equals(baseUrl)) {
                log.info("Psych AI Gemini 404 with fallback model, retrying with default URL");
                return callGeminiApi(apiKey, defaultUrl, GEMINI_FALLBACK_MODEL, systemPrompt, userPrompt);
            }
        }
        throw e;
    }
}
```

---

### 3.3 키 테스트와 리포트 생성 경로 통일 (선택)

**파일**: `SystemConfigController.testGeminiKey`

- 현재: URL·모델을 하드코딩/ListModels로 결정.
- 제안: 리포트 생성과 동일하게 `getApiUrlForProvider`, `getModelForProvider`를 사용해, 실제 리포트 생성 시 사용할 URL·모델로 테스트.
- 단, 키 테스트 시점에 `TenantContextHolder`가 올바르게 설정되어 있어야 함.

---

## 4. 체크리스트 (수정 후 확인)

- [ ] 시스템 설정에서 `GEMINI_API_URL`을 비워두고 저장한 뒤, Psych AI 리포트 생성 → AI 해석이 포함되는지 확인
- [ ] `GEMINI_MODEL`을 `gemini-3.1-pro` 등으로 저장한 뒤 리포트 생성 → 404 폴백 후 성공하는지 확인
- [ ] 로그에 `Psych AI Gemini success: model=..., responseLen=...` 출력되는지 확인
- [ ] `Psych AI report generation failed` 로그가 더 이상 발생하지 않는지 확인

---

## 5. core-coder용 태스크 설명 초안

```
다음 수정을 적용해 주세요.

1. SystemConfigServiceImpl.getApiUrlForProvider, getModelForProvider
   - 반환값이 blank일 때 기본값 사용하도록 변경

2. OpenAIPsychAiServiceImpl
   - generateKoreanReport: Gemini 호출 시 apiUrl이 blank면 "https://generativelanguage.googleapis.com/v1beta" 사용
   - callGeminiApiWithFallback: 404 시 이미 fallback 모델이어도, baseUrl이 기본값이 아니면 기본 URL로 한 번 더 재시도

수정 후 docs/troubleshooting/PSYCH_AI_REPORT_DEBUG_ANALYSIS.md 체크리스트로 동작 확인.
```
