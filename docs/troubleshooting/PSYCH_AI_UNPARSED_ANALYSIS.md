# Psych AI "unparsed" / "AI 출력 파싱 실패" 정밀 분석

**분석 일자**: 2026-03-03  
**목적**: `parseAndValidateAiOutput()` catch 블록에서 "AI 출력 파싱 실패", reason="unparsed"가 발생하는 원인 정밀 분석 및 core-coder용 수정 제안(코드 수정 없음)

---

## 1. 예외가 나는 구체 케이스 — `readTree(trimmed)` 실패 상황

`objectMapper.readTree(trimmed)`는 `JsonProcessingException`(또는 그 하위 `JsonParseException`, `JsonMappingException` 등)을 던진다. 아래는 실패하는 대표 케이스다.

| # | 케이스 | trimmed 상태 | Jackson 동작 / 예외 |
|---|--------|--------------|---------------------|
| 1 | **빈 문자열** | `""` | `JsonMappingException` 등 — "No content to map due to end-of-input" 유사 메시지. `readTree("")`는 유효한 JSON 값이 없으므로 예외 발생. |
| 2 | **JSON이 아닌 평문** | 마크다운만 있거나 "Here is the analysis..." 등 | `MismatchedInputException` 또는 `JsonParseException` — JSON 루트(객체/배열)가 아니므로 실패. |
| 3 | **중괄호 없음** | `extractJsonFromContent`가 `{`를 찾지 못해 원문 그대로 반환한 경우(마크다운, 설명문 등) | (2)와 동일 — `readTree`가 객체로 파싱 불가. |
| 4 | **불완전한 JSON (잘림)** | `{"reportMarkdown":"## 요약\n...` (끝 `}"` 누락), 또는 `{"reportMarkdown":"...","evidence":` 에서 끊김 | `JsonParseException` — Unexpected end-of-input, 또는 token 관련 메시지. |
| 5 | **이스케이프/인코딩 오류** | 문자열 내 미이스케이프 `"`, `\` 또는 잘못된 `\uXXXX`, 제어문자 등 | `JsonParseException` — invalid escape sequence 등. |
| 6 | **괄호 불균형** | `extractJsonFromContent`의 depth 로직이 **문자열 내부의 `}`를 구분하지 못해** 잘못 잘라서 앞부분만 넘긴 경우(아래 2절 참고) | 잘린 결과가 불완전한 JSON이면 (4)와 동일. |
| 7 | **trailing 비JSON** | `{"reportMarkdown":"..."} 추가 설명` — 현재 ObjectMapper가 기본 설정이면 첫 값만 읽고 나머지는 무시할 수 있음. 단, 나머지가 파서를 방해하면 예외 가능. | 설정에 따라 성공할 수도, 실패할 수도 있음. |
| 8 | **배열만 있음** | `[{ ... }]` 형태로만 반환된 경우 | `readTree`는 배열도 파싱 가능. 단, 상위 코드가 `out.isObject()` 등 객체 기대 시 이후 검증에서 실패. **파싱 단계에서는 예외가 아닐 수 있음.** |

정리하면, **실제로 catch로 이어지는 주요 케이스**는 (1) 빈 문자열, (2)(3) 비JSON 평문/중괄호 없음, (4)(5)(6) 불완전·잘못된 JSON이다.

---

## 2. `extractJsonFromContent` 한계 분석

**파일**: `OpenAIPsychAiServiceImpl.java` 202~240행.

### 2.1 현재 동작 요약

- ````json ... ```` 또는 ```` ... ```` 블록 제거 후, 첫 `{`부터 괄호 깊이로 짝 맞는 `}`까지 추출.
- `{`가 없으면(`braceStart == -1`) **원문 그대로** 반환(trim만 적용).
- `braceStart == 0`이면(이미 `{`로 시작) depth 추출 로직을 타지 않고 **전체 trimmed** 반환.

### 2.2 (a) JSON 없이 마크다운만 반환

- **처리 여부**: ❌ 미처리.
- `{`가 없으므로 `braceStart == -1` → 원문 그대로 반환 → 마크다운 전체가 `readTree`에 전달 → 파싱 실패 → "unparsed".

### 2.3 (b) ```` 없이 "Here is the report: { ... }" 형태

- **처리 여부**: ✅ 처리됨.
- `braceStart > 0`이면 첫 `{`부터 depth로 끝 `}` 찾아서 잘라서 반환. 따라서 "Here is the report: { ... }"는 `{ ... }`만 넘어가서 파싱 가능.

### 2.4 (c) 여러 개의 `{` `}`가 있어서 첫 번째 `{`~`}`만 쓰면 불완전해지는 경우

- **처리 여부**: ⚠️ 부분적 한계 있음.
  - **여러 개 객체가 연속**: 예) `{"note":"ok"}{"reportMarkdown":"..."}`  
    현재 로직은 **첫 번째 `{`와 depth 0이 되는 첫 `}`**까지만 잘라서 반환. 따라서 `{"note":"ok"}`만 추출되고, 실제 리포트가 있는 두 번째 객체는 버려짐 → **불완전** → `reportMarkdown` 없음 → 이후 검증 실패 또는 구조가 달라서 오동작.
  - **문자열 내부에 `}` 포함**:  
    depth 카운팅이 **문자열/이스케이프 구간을 구분하지 않음**. `reportMarkdown` 값이 `"## 요약\n... }\n## 권고"`처럼 **값 안에 `}`**가 있으면, 그 `}`에서 depth가 0이 되어 버려 **그 앞까지만** 잘라버림.  
    → **불완전한 JSON**이 `readTree`에 전달 → `JsonParseException` → "unparsed".

위 (c)의 "문자열 내부 `}`" 케이스는 **실제로 "unparsed"가 자주 나는 매우 유력한 원인**이다.

---

## 3. 로그 개선 제안

**위치**: `OpenAIPsychAiServiceImpl.java` 311~314행 catch 블록.

현재:

```java
log.warn("Psych AI parse failed: model={}, error={}, contentPreview={}", model, parseError.getMessage(),
        trimmed.length() > 300 ? trimmed.substring(0, 300) + "..." : trimmed);
```

- `contentPreview`만 300자로 남기고, **trimmed가 비어 있는지·특수 케이스인지** 구분이 어렵다.
- 원인 추적을 위해 아래를 **추가**할 것을 제안한다(로깅 표준: 키-값, 구조화).

| 추가 로그 항목 | 목적 |
|----------------|------|
| `trimmedEmpty=true/false` | 빈 문자열 여부로 (1)번 케이스 즉시 판별. |
| `trimmedLen` | 이미 length는 자르기 전 값이므로, `trimmed.length()`를 명시적으로 로그(0이면 빈 문자열). |
| `hasBrace=true/false` | `trimmed.indexOf('{') >= 0` — 중괄호 없음(2)(3) 케이스 판별. |
| `exceptionClass` | `parseError.getClass().getSimpleName()` — JsonParseException / JsonMappingException / MismatchedInputException 등 구분. |

예시(의도만 전달):

```text
log.warn("Psych AI parse failed: model={}, exception={}, message={}, trimmedLen={}, trimmedEmpty={}, hasBrace={}, contentPreview={}",
    model, parseError.getClass().getSimpleName(), parseError.getMessage(),
    trimmed.length(), trimmed.isEmpty(), trimmed.indexOf('{') >= 0,
    trimmed.length() > 300 ? trimmed.substring(0, 300) + "..." : trimmed);
```

- 필요 시 `trimmed.isEmpty()`일 때는 `contentPreview` 대신 `"(empty)"`만 남기거나, 원본 `content` 길이만 추가해도 된다(`contentLen=...`).

---

## 4. 수정 제안 (core-coder 적용용)

코드 수정은 하지 않고, **파일·메서드 단위**로 적용할 수정 방향만 제시한다.

### 4.1 `extractJsonFromContent` (202~240행)

| 방향 | 내용 |
|------|------|
| **중괄호 없을 때** | `braceStart < 0`이면 JSON으로 볼 수 없으므로, **빈 문자열을 반환**하거나, 또는 정규식 등으로 `\{[\s\S]*\}` 형태를 한 번 더 시도해 볼 수 있다. 빈 문자열을 반환하면 `parseAndValidateAiOutput`에서 readTree 전 early return으로 "unparsed" + 로그 처리와 연계 가능. |
| **문자열 내부 `}` 무시** | 괄호 깊이 계산 시 **문자열 안에 있는 `{`, `}`는 카운트에서 제외**하도록 변경(이스케이프된 `\"` 안인지, raw string 구간인지 판단). 예: 큰따옴표로 시작한 구간을 찾아서 다음 비이스케이프 `"`까지 건너뛴 뒤 depth 계산. 이렇게 하면 (c)의 "값 안에 `}`" 케이스에서 잘못 잘리는 문제를 줄일 수 있음. |
| **여러 객체 중 최종 객체 선호** | 첫 `{`~`}`만 쓰지 말고, **마지막으로 등장하는 `{`~`}`**를 사용하거나, 또는 `reportMarkdown` 키를 포함한 객체를 찾는 방식으로 후보를 골라 반환. (우선순위는 팀 정책에 맞게.) |

### 4.2 `parseAndValidateAiOutput` (243~318행)

| 방향 | 내용 |
|------|------|
| **readTree 전 early return** | `extractJsonFromContent` 반환값 `trimmed`가 **빈 문자열**이거나 **`StringUtils.hasText(trimmed)`가 false**이면, `readTree`를 호출하지 않고 바로 "unparsed" + `baseMarkdownWithDisclaimer` + `buildEvidenceJson("rejected", "unparsed", true)` 반환. 이때 **위 3절 로그를 먼저 한 번 남기면** 원인 추적에 유리함(trimmed empty 등). |
| **catch 블록 로그 보강** | 3절에서 제안한 `trimmedLen`, `trimmedEmpty`, `hasBrace`, `exceptionClass` 등을 포함하도록 수정. |
| **선택: JSON 복구 시도** | trimmed가 실패할 때만, **1회 한정**으로 다음을 시도한 뒤 다시 `readTree` 호출:  
  - 앞뒤 공백/개행 제거,  
  - `reportMarkdown` 문자열 값 안의 개행을 `\n`으로 정규화(이미 이스케이프된 부분은 건드리지 않도록 주의),  
  - 또는 trailing comma 제거 등 **안전한 치환**만 적용.  
  복구 시도는 로직이 복잡해지므로, 우선 (1) early return과 (2) extractJsonFromContent 개선을 권장하고, 필요 시 추가.

### 4.3 체크리스트 (수정 후 확인)

- [ ] AI가 **마크다운만** 반환(JSON 없음)할 때: "unparsed"로 폴백되고, 로그에 `trimmedEmpty` 또는 `hasBrace=false` 등으로 원인 구분 가능한지.
- [ ] AI가 **"Here is the report: { ... }"** 형태로 반환할 때: 기존처럼 정상 파싱되는지.
- [ ] **reportMarkdown 값 안에 `}`가 포함**된 응답(또는 유사 테스트 문자열)으로 호출 시: (가능하다면) extractJsonFromContent가 전체 객체를 잘라서 readTree가 성공하는지, 또는 복구 로직이 동작하는지.
- [ ] **빈 응답** 또는 **빈 trimmed**: readTree 호출 전에 early return하고, 로그에 trimmed 길이·empty 여부가 남는지.

---

## 5. 결론

- **"AI 출력 파싱 실패(unparsed)"가 자주 나는 가장 유력한 원인**  
  1) **`reportMarkdown` 문자열 값 안에 `}`가 들어가는 경우** — `extractJsonFromContent`의 depth 로직이 문자열 경계를 보지 않아, 그 `}`에서 잘라버려 **불완전한 JSON**이 `readTree`에 전달되고 `JsonParseException` 발생.  
  2) **JSON 없이 마크다운/설명만 반환** — `{`가 없어 원문이 그대로 넘어가 `readTree`가 실패.

- **우선 수정안**  
  - **extractJsonFromContent**에서 괄호 깊이 계산 시 **문자열 내부의 `{`, `}`는 제외**하도록 수정하고,  
  - **parseAndValidateAiOutput**에서 **trimmed가 비어 있으면 readTree 호출 전에 early return**으로 "unparsed" + 보강된 로그(trimmedLen, trimmedEmpty, hasBrace, exceptionClass)를 남기는 것**을 권장한다.  
  - 이렇게 하면 (1) 문자열 내부 `}`로 잘리는 문제와 (2) 빈/비JSON 입력으로 인한 불필요한 예외를 줄일 수 있다.
