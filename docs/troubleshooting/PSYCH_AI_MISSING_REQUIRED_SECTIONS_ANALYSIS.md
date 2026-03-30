# missing_required_sections 검증 실패 원인 분석 및 수정 제안

**분석 일자**: 2026-03-03  
**목적**: 심리검사 AI 리포트에서 `missing_required_sections` 검증 실패 시 원인 파악 및 core-coder용 수정 제안

---

## 1. 원인 분석 요약

### 1.1 증상

- `validateModelOutput`에서 `missing_required_sections`로 실패
- 사용자 화면에는 `## 요약`, `## 주요 지표`, `## 권고`가 포함된 리포트가 표시됨

### 1.2 핵심 인사이트: 사용자가 보는 내용 vs 검증 대상

**검증 실패 시 반환되는 값**:
```java
return new AiResult(
    baseMarkdownWithDisclaimer(baseMarkdown, validation.reason),  // ← 사용자가 보는 리포트
    buildEvidenceJson("rejected", validation.reason, true),
    ...
);
```

- **사용자가 보는 리포트**: `baseMarkdown`(규칙 기반 초안) + `## 안내` 섹션
- **검증 대상**: AI가 반환한 JSON 내 `reportMarkdown` 필드

`baseMarkdown`은 `PsychAssessmentReportServiceImpl.buildRuleBasedMarkdown()`에서 생성되며, 이미 `## 요약`, `## 권고`를 **정확한 형식**으로 포함함. 따라서 사용자가 보는 화면에 해당 섹션이 있는 것은 **폴백(baseMarkdown)** 때문이며, **AI 출력(reportMarkdown)** 검증은 별도로 실패한 상태이다.

---

## 2. missing_required_sections 조건 상세

### 2.1 검증 로직 (OpenAIPsychAiServiceImpl 328–329행)

```java
if (!reportMarkdown.contains("## 요약") || !reportMarkdown.contains("## 권고")) {
    return new Validation(false, "missing_required_sections");
}
```

- **조건**: `reportMarkdown`에 `"## 요약"`과 `"## 권고"`가 **정확한 부분 문자열**로 포함되어야 함
- **검증 대상**: AI JSON 응답의 `reportMarkdown` 필드 (baseMarkdown 아님)

### 2.2 validateModelOutput 실행 순서

| 순서 | reason | 조건 |
|------|--------|------|
| 1 | invalid_json_root | JSON 루트가 객체가 아님 |
| 2 | missing_report_markdown | reportMarkdown 없음/빈 문자열 |
| 3 | **missing_required_sections** | `## 요약` 또는 `## 권고` 없음 |
| 4 | invalid_evidence_structure | evidence.highlights가 배열 아님 |
| 5 | insufficient_evidence | highlights.size() < 1 |
| 6 | missing_basedOn / missing_scaleCode / hallucinated_scaleCode | evidence 구조 검증 |

`missing_required_sections`로 실패했다는 것은 1~2번은 통과했고, **AI의 reportMarkdown에 `"## 요약"` 또는 `"## 권고"`가 없다고 판단**된 경우이다.

---

## 3. 실패 가능 원인 (가설)

### 3.1 마크다운 포맷 차이

| AI 출력 예시 | contains("## 요약") | contains("## 권고") |
|--------------|--------------------|--------------------|
| `## 요약` | ✅ | - |
| `##  요약` (공백 2개) | ❌ | - |
| `##\t요약` (탭) | ❌ | - |
| `### 요약` | ❌ | - |
| `# 요약` | ❌ | - |
| `## 종합 요약` | ❌ | - |
| `## 검사 요약` | ❌ | - |
| `## 결과 요약` | ❌ | - |
| `## 권고` | - | ✅ |
| `## 권고사항` | - | ✅ (부분 문자열 포함) |
| `## 권고 사항` | - | ✅ |

### 3.2 섹션명 변형

- **요약**: `## 요약`, `## 종합 요약`, `## 검사 요약` 등 → `"## 요약"`이 **정확히** 포함되지 않으면 실패
- **권고**: `## 권고`, `## 권고사항`, `## 권고 사항` → `"## 권고"`는 대부분 포함되어 통과 가능성 높음

### 3.3 인코딩·특수문자

- 전각 `＃＃` (U+FF03) vs 반각 `#` (U+0023)
- 제로폭 공백(U+200B) 등 보이지 않는 문자
- JSON 이스케이프(`\n`, `\t`) 처리 차이

### 3.4 evidence 실패와의 혼동 가능성

`missing_required_sections`는 **섹션 검증**에서만 발생한다.  
`invalid_evidence_structure`, `insufficient_evidence` 등은 evidence 검증 단계에서 발생하므로, 로그의 `reason`이 정확히 `missing_required_sections`인지 확인 필요.

---

## 4. 수정 제안 (core-coder용)

### 4.1 제안 1: 유연한 섹션 매칭 (정규식)

**파일**: `src/main/java/com/coresolution/consultation/assessment/service/impl/OpenAIPsychAiServiceImpl.java`

**현재 (328–329행)**:
```java
if (!reportMarkdown.contains("## 요약") || !reportMarkdown.contains("## 권고")) {
    return new Validation(false, "missing_required_sections");
}
```

**수정안**:
```java
// 섹션 최소 요건: ## 요약, ## 권고 (공백·헤딩 레벨 변형 허용)
private static final Pattern SECTION_SUMMARY = Pattern.compile("^##+\\s+요약", Pattern.MULTILINE);
private static final Pattern SECTION_RECOMMENDATION = Pattern.compile("^##+\\s+권고", Pattern.MULTILINE);

// validateModelOutput 내부 (328행 부근):
if (!SECTION_SUMMARY.matcher(reportMarkdown).find() || !SECTION_RECOMMENDATION.matcher(reportMarkdown).find()) {
    return new Validation(false, "missing_required_sections");
}
```

- `##`, `###` 등 h2 이상 허용
- `##  요약`, `##\t요약` 등 공백/탭 변형 허용
- `## 권고사항`, `## 권고:` 등 `권고`로 시작하는 제목 허용

### 4.2 제안 2: 대안 섹션명 허용 (contains 다중 조건)

정규식 도입이 부담스러우면, 기존 `contains`에 대안 문자열 추가:

```java
boolean hasSummary = reportMarkdown.contains("## 요약")
        || reportMarkdown.contains("## 종합 요약")
        || reportMarkdown.contains("## 검사 요약");
boolean hasRecommendation = reportMarkdown.contains("## 권고")
        || reportMarkdown.contains("## 권고사항")
        || reportMarkdown.contains("## 권고 사항");
if (!hasSummary || !hasRecommendation) {
    return new Validation(false, "missing_required_sections");
}
```

### 4.3 제안 3: 디버그 로그 추가 (원인 추적)

검증 실패 시 `reportMarkdown` 앞부분을 로그에 남겨, 실제 형식 확인:

```java
if (!reportMarkdown.contains("## 요약") || !reportMarkdown.contains("## 권고")) {
    String preview = reportMarkdown.length() > 500
            ? reportMarkdown.substring(0, 500) + "..."
            : reportMarkdown;
    log.warn("Psych AI missing_required_sections: reportMarkdown preview (first 500 chars): [{}]", preview);
    return new Validation(false, "missing_required_sections");
}
```

- 민감정보가 포함될 수 있으므로, 운영에서는 `log.debug` 또는 조건부 로깅 검토

### 4.4 제안 4: parseAndValidateAiOutput의 hasRequiredSections 통일

현재 255행의 `hasRequiredSections`도 동일한 `contains` 조건 사용:

```java
boolean hasRequiredSections = StringUtils.hasText(reportMd)
        && reportMd.contains("## 요약") && reportMd.contains("## 권고");
```

섹션 검증 로직을 **공통 메서드**로 분리하고, `validateModelOutput`과 `parseAndValidateAiOutput`에서 함께 사용하는 것이 좋다.

```java
private boolean hasRequiredSections(String reportMarkdown) {
    if (!StringUtils.hasText(reportMarkdown)) return false;
    return SECTION_SUMMARY.matcher(reportMarkdown).find()
            && SECTION_RECOMMENDATION.matcher(reportMarkdown).find();
}
```

---

## 5. 체크리스트 (수정 후 확인)

- [ ] AI 리포트 생성 후 `missing_required_sections` 실패가 재현되지 않는지 확인
- [ ] `##  요약`(공백 2개), `### 요약` 등 변형 형식이 통과하는지 단위 테스트
- [ ] `Psych AI validation failed: reason=missing_required_sections` 로그가 더 이상 발생하지 않는지 확인
- [ ] (제안 3 적용 시) 디버그 로그에 reportMarkdown 미리보기가 적절히 출력되는지 확인

---

## 6. core-coder용 태스크 설명 초안

```
OpenAIPsychAiServiceImpl의 missing_required_sections 검증을 유연하게 수정해 주세요.

1. validateModelOutput (328행 부근)
   - 현재: reportMarkdown.contains("## 요약") && contains("## 권고") 정확 매칭
   - 변경: 정규식 Pattern.compile("^##+\\s+요약", MULTILINE), Pattern.compile("^##+\\s+권고", MULTILINE)로
     ##/###, 공백 2개·탭 등 변형 허용

2. hasRequiredSections 공통 메서드 추출
   - parseAndValidateAiOutput 255행의 hasRequiredSections 조건과 통일

3. (선택) missing_required_sections 실패 시 reportMarkdown 앞 500자 디버그 로그 추가
   - log.warn 또는 log.debug로, 민감정보 고려

수정 후 docs/troubleshooting/PSYCH_AI_MISSING_REQUIRED_SECTIONS_ANALYSIS.md 체크리스트로 동작 확인.
```
