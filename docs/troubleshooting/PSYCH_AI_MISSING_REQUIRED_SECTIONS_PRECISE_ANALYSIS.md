# missing_required_sections 정밀 분석 — 화면에는 요약/권고가 있는데 오류가 나는 이유

**분석 일자**: 2026-03-03  
**목적**: "## 요약", "## 권고"가 화면에 보이는데도 `missing_required_sections`가 나오는 원인 정밀 추적 및 수정 제안(코드 수정 없음, core-coder 위임용)

---

## 1. 검증 실패 경로 및 사용 문자열 추적

### 1.1 `missing_required_sections`를 반환하는 코드 경로 (유일)

| 위치 | 파일:라인 | 조건 |
|------|-----------|------|
| **유일 경로** | `OpenAIPsychAiServiceImpl.java:335-336` | `validateModelOutput()` 내부에서 `!hasRequiredSections(reportMarkdown)` 일 때 |

```java
// 329행
String reportMarkdown = out.path("reportMarkdown").asText("");
// ...
if (!hasRequiredSections(reportMarkdown)) {
    return new Validation(false, "missing_required_sections");
}
```

다른 클래스/메서드에서는 `"missing_required_sections"` 문자열을 반환하지 않음. 문서(`PSYCH_AI_MISSING_REQUIRED_SECTIONS_ANALYSIS.md`)에 나오는 106/118/138행 등은 **과거 contains() 기반 버전**에 대한 설명이며, 현재 코드는 위 한 곳에서만 반환함.

### 1.2 검증에 쓰이는 문자열의 출처 (전체 경로)

| 단계 | 변수/위치 | 설명 |
|------|-----------|------|
| 1 | `content` | LLM 원문 응답. `callOpenAiFormatApi()` 또는 `callGeminiApi()` 반환값(`rawContent`) |
| 2 | `trimmed` | `extractJsonFromContent(content)` — ```json … ``` 블록 또는 첫 `{`~짝 맞는 `}` 까지 추출한 **JSON 문자열** |
| 3 | `out` | `objectMapper.readTree(trimmed)` — 파싱된 JSON 루트(객체) |
| 4 | **검증에 쓰는 문자열** | `out.path("reportMarkdown").asText("")` — **AI가 생성한 JSON 필드 값 하나**만 사용 |

즉, **검증 대상은 항상 "AI 응답 JSON의 `reportMarkdown` 필드 값"**이며, `baseMarkdown`(규칙 기반 초안)은 이 단계에서 사용되지 않음.

### 1.3 검증 실패 시 프론트에 내려가는 문자열 (다름)

검증 실패 시 `parseAndValidateAiOutput()`에서는:

```java
return new AiResult(
    baseMarkdownWithDisclaimer(baseMarkdown, validation.reason),  // ← 사용자에게 보이는 본문
    buildEvidenceJson("rejected", validation.reason, true),
    model, PROMPT_VERSION
);
```

- **사용자가 보는 리포트 본문**: `baseMarkdown` + `## 안내` + "사유: missing_required_sections"  
- **baseMarkdown**은 `PsychAssessmentReportServiceImpl.buildRuleBasedMarkdown(metrics)`에서 생성되며, 이미 **"## 요약\n"**, **"\n## 권고\n"** 를 포함함(100행, 118행).

따라서 **화면에 "## 요약", "## 권고"가 보이는 것은 실패 시 보여주는 폴백(baseMarkdown) 때문**이고, **검증에 실패한 것은 AI의 `reportMarkdown` 필드**이다.  
즉, "검증에 쓰는 문자열"과 "화면에 보이는 문자열"이 **실패 시에는 서로 다름**(검증=AI 출력, 화면=baseMarkdown+안내).

---

## 2. 정규식 불일치 가능성 검토

### 2.1 현재 패턴 (`hasRequiredSections` 317–321행)

```java
Pattern summaryPattern = Pattern.compile("^#+\\s+.*요약", Pattern.MULTILINE | Pattern.UNICODE_CASE);
Pattern recommendationPattern = Pattern.compile("^#+\\s+.*권고", Pattern.MULTILINE | Pattern.UNICODE_CASE);
return summaryPattern.matcher(reportMarkdown).find() && recommendationPattern.matcher(reportMarkdown).find();
```

- `^`: 줄의 시작 (MULTILINE이므로 매 줄마다)
- `#+`: 한 개 이상의 `#` (U+0023만 해당)
- `\s+`: 한 개 이상의 공백 문자(스페이스, 탭 등)
- `.*요약` / `.*권고`: 그 줄 안에서 "요약" / "권고" 포함

### 2.2 놓칠 수 있는 경우 정리

| 케이스 | 예시 | 매칭 여부 | 비고 |
|--------|------|-----------|------|
| BOM으로 줄 시작 | `\uFEFF## 요약` | ❌ | `^` 다음에 `#`가 아니라 BOM이라 `#+` 불일치 |
| `#` 뒤 공백 없음 | `##요약`, `##권고` | ❌ | `\s+`가 최소 1개 공백을 요구함 |
| 공백 2개 | `##  요약` | ✅ | `\s+`로 매칭 |
| 탭 | `##\t요약` | ✅ | `\s`에 탭 포함 |
| 전각 `#` | `＃＃ 요약` (U+FF03) | ❌ | 패턴의 `#`는 U+0023만 |
| 제로폭 공백 등 | `##\u200B요약` | ❌ | `\s+`가 ZWSP를 공백으로 보지 않을 수 있음, 또는 `#+\s+` 이후 구조 깨짐 |
| 다른 필드/페이로드 | 검증은 항상 `out.path("reportMarkdown").asText("")` | - | 다른 필드는 검증에 사용되지 않음 |

**결론**: **BOM**, **`##요약`/`##권고`(공백 없음)**, **전각 #**, **보이지 않는 문자** 등이 있으면 현재 정규식으로는 "요약/권고"가 있어도 `hasRequiredSections`가 false가 될 수 있음.

---

## 3. GPT 응답 구조와 검증·프론트 전달 문자열 일치 여부

### 3.1 응답 추출 흐름

1. **OpenAI**: `root.path("choices").path(0).path("message").path("content").asText(null)` → 한 덩어리 문자열.
2. **Gemini**: `content.path(0).path("text").asText(null)` → 한 덩어리 문자열.
3. **추출**: `extractJsonFromContent(content)`  
   - ` ```json` / ` ``` ` 블록 제거 후  
   - 첫 `{`부터 괄호 깊이로 짝 맞는 `}`까지 잘라서 **단일 JSON 문자열**로 만듦.
4. **파싱**: `objectMapper.readTree(trimmed)` → `JsonNode out`.
5. **검증**: `validateModelOutput(out, metrics)`에서 `reportMarkdown = out.path("reportMarkdown").asText("")` 로 **동일한** 파싱 결과에서 한 번만 읽음.

따라서 **검증 단계에 넘어가는 문자열**은 **항상** "파싱된 JSON의 `reportMarkdown` 필드 값" 하나로 고정되어 있음.  
(실패 시 프론트에 내려가는 건 위 1.3처럼 `baseMarkdown`+안내이므로, "검증에 쓰인 문자열"과 "실패 시 화면 문자열"은 다름.)

### 3.2 검증과 프론트 전달이 "같은 문자열"인 경우

- **검증 통과 시**: `parseAndValidateAiOutput()` 269행 `String reportMarkdown = out.path("reportMarkdown").asText(baseMarkdown);` 후 292행에서 `return new AiResult(reportMarkdown, ...);` → 이때만 **검증에 쓴 것과 동일한** `reportMarkdown`이 프론트/DB로 전달됨.
- **검증 실패 시**: AI의 `reportMarkdown`은 프론트에 전달되지 않고, `baseMarkdownWithDisclaimer(baseMarkdown, ...)`만 전달됨.

---

## 4. 결론 및 수정 제안

### 4.1 "화면에는 요약/권고가 있는데 missing_required_sections가 나오는" 이유 (한두 문장)

- **실패 시 화면에 보이는 본문은 `baseMarkdown`(규칙 기반 초안) + 안내 문구**이고, 이 baseMarkdown에는 이미 "## 요약", "## 권고"가 들어 있음.
- **검증은 AI 응답 JSON의 `reportMarkdown` 필드만 검사**하므로, AI가 그 필드에 BOM·공백 누락(`##요약`)·전각문자·잘림 등으로 "요약/권고"가 정규식에 잡히지 않으면 `missing_required_sections`가 나오고, 그때 사용자에게는 "섹션이 있는 것처럼 보이는" baseMarkdown이 보여서 혼동이 생김.

### 4.2 core-coder가 손댈 파일·메서드 및 권장 수정 방향

| 항목 | 내용 |
|------|------|
| **파일** | `src/main/java/com/coresolution/consultation/assessment/service/impl/OpenAIPsychAiServiceImpl.java` |
| **메서드** | `hasRequiredSections(String reportMarkdown)` (317행 부근), 및 검증 직전에 문자열을 정규화할 경우 `validateModelOutput(JsonNode out, ...)` (329행 부근) |

**권장 수정 방향 (구체적 코드 수준, 구현은 core-coder가 수행):**

1. **검증 전 정규화**  
   - `validateModelOutput()`에서 `reportMarkdown`을 넘기기 전에:  
     - `Character.codePointAt(0) == 0xFEFF` 이면 BOM 제거(또는 `replace("\uFEFF", "")`),  
     - 필요 시 `\r` 제거 또는 줄 시작/끝 공백 정규화(예: `trim()`만으로는 BOM이 남을 수 있으므로 BOM 제거 명시).
2. **정규식 완화**  
   - `#+`와 "요약"/"권고" 사이에 공백이 0개여도 인정하려면:  
     - `^#+\s*.*요약`, `^#+\s*.*권고` 처럼 `\s+` → `\s*` 로 변경 검토.  
   - (선택) 전각 `＃`까지 인정하려면 `[#＃]+` 등으로 확장.
3. **디버깅 로그**  
   - `missing_required_sections` 반환 직전에 `reportMarkdown` 앞 500자(또는 요약/권고 포함 여부만)를 `log.warn`으로 출력하면, 실제로 BOM·공백·잘림 중 어떤 케이스인지 재현·검증 시 확인하기 쉬움.

### 4.3 수정 후 체크리스트

- [ ] AI 리포트 생성 후 동일 조건에서 `missing_required_sections` 미발생 여부 확인.
- [ ] `"##요약"`, `"##권고"`(공백 없음), BOM 붙은 문자열로 단위 테스트 시 `hasRequiredSections` true 반환 여부 확인.
- [ ] 로그에 `Psych AI validation failed: reason=missing_required_sections` 가 남을 때, 추가한 preview 로그로 실제 `reportMarkdown` 앞부분 확인.

---

**문서 상태**: 디버그 분석만 수행했으며, 코드 수정은 하지 않음. 적용은 core-coder에게 위임.
