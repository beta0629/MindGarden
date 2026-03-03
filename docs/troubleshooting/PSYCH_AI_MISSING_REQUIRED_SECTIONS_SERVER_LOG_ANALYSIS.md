# Psych AI missing_required_sections — 서버 로그 기반 원인 분석

**분석 일자**: 2026-03-04  
**목적**: 서버(beta0629) 로그 `Psych AI validation failed: reason=missing_required_sections, contentLen=702` 사례의 원인 분석 및 core-coder용 수정 제안(코드 수정 없음)

---

## 1. 로그·코드 정리

### 1.1 수집된 로그

- **서버**: beta0629.cafe24.com, coresolution.log  
- **메시지**: `Psych AI validation failed: reason=missing_required_sections, contentLen=702`  
- **추가**: reportMarkdown preview / unparsed / parse failed 로그는 수집분에 없음(예전 빌드 또는 해당 경로 미실행 가능성).

### 1.2 contentLen 의미

| 항목 | 의미 |
|------|------|
| **contentLen=702** | `parseAndValidateAiOutput()` 내부에서 **trimmed.length()** 로 출력됨(282행). 즉 **파싱된 JSON 문자열(trimmed) 전체 길이**이다. |
| **reportMarkdown 길이** | 702는 JSON 전체이므로, `reportMarkdown` 필드 값 길이는 그보다 짧음(필드명·evidence 등 포함). 별도 로그 없으면 알 수 없음. |

따라서 **reportMarkdown이 비어 있지 않음**이 전제이다.  
- `reportMarkdown`이 비어 있으면 `validateModelOutput()`에서 `missing_report_markdown`이 반환되고, 이번처럼 `missing_required_sections`는 나오지 않음.  
- 따라서 **검증 실패 원인은 “필드 없음”이 아니라 “요약/권고 섹션 매칭 실패”**이다.

### 1.3 검증 경로

- **위치**: `OpenAIPsychAiServiceImpl.java`  
  - 280행: `validateModelOutput(out, metrics)`  
  - 357–372행: `reportMarkdown` 비어 있지 않으면 `hasRequiredSections(reportMarkdown)` 호출, false 시 `missing_required_sections` 반환 및 371행 `log.warn("Psych AI missing_required_sections: reportMarkdown preview (len={}): {}", ...)`  
- 서버 로그에 preview가 없다면, **해당 warn을 포함한 최신 빌드가 배포되지 않았을 가능성**이 있음.

---

## 2. 원인 분석 — 가능한 원인 후보

contentLen=702(JSON 전체 길이)인데 `missing_required_sections`가 나온다는 것은, **reportMarkdown 문자열은 존재하지만 `hasRequiredSections(reportMarkdown)`가 false를 반환한 경우**에 해당한다.  
현재 `hasRequiredSections()` 구현(349–355행)은 다음과 같다.

- 정규식: `^[#＃]+\s*.*요약`, `^[#＃]+\s*.*권고` (Pattern.MULTILINE | Pattern.UNICODE_CASE)
- normalized: reportMarkdown에서 BOM(`\uFEFF`), `\r` 제거 후 위 패턴으로 매칭.

가능한 원인 후보를 우선순위대로 정리한다.

---

### (1) **한 줄로 된 reportMarkdown (가장 유력)**

- **내용**: AI가 `reportMarkdown`을 **실제 줄바꿈 없이** 한 줄로 내보낸 경우(예: `"## 요약\n\n..."` 대신 `"## 요약 ... ## 권고 ..."`를 한 줄로, 또는 JSON 직렬화 과정에서 개행이 하나로 합쳐진 경우).
- **왜 실패하는가**: MULTILINE에서 `^`는 “문자열 시작” 또는 “줄의 시작(개행 직후)”만 의미한다.  
  한 줄이면 `^`는 **한 번만** 등장한다.  
  - `^[#＃]+\s*.*요약` → 문자열 맨 앞에 `## 요약`이 있으면 매칭됨.  
  - `^[#＃]+\s*.*권고` → 같은 줄에서는 “줄의 시작”이 한 번뿐이므로, “## 권고”가 중간에 있어도 그 위치는 “줄의 시작”이 아니라서 **매칭되지 않음**.  
- **결과**: 요약은 통과하고 권고만 실패하거나, 순서/형식에 따라 둘 다 실패할 수 있어 **false negative** 발생.

---

### (2) **줄 시작이 아닌 위치의 헤딩(들여쓰기·앞에 공백)**

- **내용**: 각 “줄”이 공백/탭으로 시작하는 경우. 예: `"\n  ## 요약"`, `"\n   ## 권고"`.
- **왜 실패하는가**: `^`는 줄의 **첫 문자**를 의미한다. 줄 시작이 공백이면 `^` 다음에 오는 것은 `#`가 아니라 공백이므로 `^[#＃]+`와 맞지 않는다.
- **결과**: 실제로 “## 요약”, “## 권고”가 있어도 매칭 실패.

---

### (3) **헤딩 표현이 “요약”/“권고”가 아님**

- **내용**: “종합 요약”, “요약 및 해석” 등은 `.*요약`으로 매칭 가능하지만, “**요약**”, “1. 요약”, “■ 요약”처럼 **`#`가 없는** 제목만 있는 경우.
- **왜 실패하는가**: `[#＃]+`가 반드시 있어야 하므로, `#` 없이 “요약”/“권고”만 있으면 매칭되지 않는다.
- **결과**: 의미상 섹션은 있는데 정규식만으로는 인정되지 않는 false negative.

---

### (4) **이스케이프된 개행(리터럴 `\n`)**

- **내용**: JSON 안에서 문자열이 `"..."` 안에 있을 때는 `\n`이 실제 개행으로 파싱되므로, 일반적으로는 “한 줄” 문제와 구분된다.  
  다만, 모델이 **리터럴 백슬래시+n**을 내용에 넣어서 실제 개행이 없고 “\n” 두 문자가 들어간 경우, 줄 단위 매칭이 깨질 수 있음(실제로는 (1)과 유사한 “한 줄” 효과).
- **확인 방법**: reportMarkdown preview 로그에 실제 줄바꿈이 있는지, `\n` 두 문자가 보이는지 확인.

---

### (5) **기타(보이지 않는 문자·인코딩)**

- **내용**: BOM/`\r`은 이미 제거하고, 전각 `＃`는 패턴에 포함되어 있음.  
  그 외 제로폭 공백(U+200B), 다른 유니코드 공백 등이 `#`와 “요약”/“권고” 사이에 끼어 있으면 `\s*`로 잡히지 않을 수 있음.
- **가능성**: (1)(2)보다는 낮지만, preview 로그로 확인 시 유의할 만한 후보.

---

## 3. 수정 제안 (core-coder용)

**목표**: `hasRequiredSections()`를 더 유연하게 하여 **false negative**를 줄인다.  
**파일**: `OpenAIPsychAiServiceImpl.java`  
**메서드**: `hasRequiredSections(String reportMarkdown)` (349–355행 부근)

### 3.1 제안 1: 줄 시작 공백 허용

- **현재**: `^[#＃]+\s*.*요약` / `^[#＃]+\s*.*권고`  
- **변경**: 줄 시작에 공백/탭 허용  
  - 예: `^\s*[#＃]+\s*.*요약`, `^\s*[#＃]+\s*.*권고`  
- **효과**: (2) “들여쓰기된 헤딩” 케이스 수용.

### 3.2 제안 2: “줄 시작”이 아니어도 헤딩 형태 인정(보조)

- **내용**: MULTILINE `^` 매칭만으로는 한 줄일 때 “## 권고”를 놓치므로, **같은 normalized 문자열**에 대해 “줄 시작이 아니어도” `[#＃]+\s*.*요약`, `[#＃]+\s*.*권고` 형태가 **문자열 어딘가에 있는지** 추가로 검사.
- **구체 예**:  
  - 1단계: 기존(또는 제안 1 적용) `^\s*[#＃]+\s*.*요약` / `^\s*[#＃]+\s*.*권고` 로 매칭 시도.  
  - 2단계: 둘 중 하나라도 실패하면, `.*[#＃]+\s*.*요약` / `.*[#＃]+\s*.*권고` 같은 “줄 시작 불필요” 패턴으로 **fallback** 검사.  
  - 단, “요약”/“권고”만 단독으로 쓰인 일반 문장까지 인정하지 않도록, **반드시 `[#＃]+`가 앞에 오는** 형태로 제한하는 것이 안전함.
- **효과**: (1) “한 줄 reportMarkdown”에서도 “## 요약 … ## 권고”가 있으면 통과.

### 3.3 제안 3: 키워드 보조 검사(선택)

- **내용**: 위 패턴들이 모두 실패했을 때, **최후 수단**으로 normalized 문자열에 “요약”, “권고” 키워드가 각각 한 번 이상 포함되는지 확인.  
  (예: `normalized.contains("요약") && normalized.contains("권고")`.)  
  단, “요약하면”, “권고할 만하다” 등 본문만 있는 경우까지 통과시킬 수 있으므로, **헤딩 유사 패턴 실패 시에만** 사용하고, 로그에 “keyword fallback” 등 표시를 남기면 추적에 유리함.
- **효과**: (3) “# 없이 제목만 있는” 변형을 일부 수용. 다만 완화 수준이 크므로 도입 시 정책 결정 필요.

### 3.4 구현 순서 제안

1. **필수**: 제안 1 적용 (`^\s*[#＃]+\s*.*요약` / `^\s*[#＃]+\s*.*권고`).  
2. **권장**: 제안 2 적용 — 1단계 실패 시 `.*[#＃]+\s*.*요약` / `.*[#＃]+\s*.*권고` fallback.  
3. **선택**: 제안 3 — 키워드 보조 검사는 정책에 따라 도입 여부 결정.

---

## 4. 적용 후 확인 체크리스트

- [ ] **단위/로컬**: `hasRequiredSections()`에 다음 입력을 주었을 때 **기대값**으로 동작하는지 확인.  
  - 한 줄: `"## 요약\n\n내용\n\n## 권고\n\n내용"` → true (이미 true일 수 있음).  
  - 한 줄 변형: `"## 요약 내용 ... ## 권고 내용"` (중간에 실제 개행 없음) → **수정 후 true**.  
  - 들여쓰기: `"\n  ## 요약\n  ## 권고"` → **수정 후 true**.  
  - “요약”/“권고” 없음: `"## 서론\n## 결론"` → false 유지.  
- [ ] **서버**: 동일/유사 시나리오로 Psych AI 리포트 생성 후, `missing_required_sections` 대신 정상 저장되는지 확인.  
- [ ] **로그**: `missing_required_sections` 발생 시 371행 `log.warn("Psych AI missing_required_sections: reportMarkdown preview (len={}): {}", ...)` 가 최신 빌드에 포함되어 있어, 다음 발생 시 **preview**로 위 (1)~(5) 후보를 구분할 수 있는지 확인.

---

## 5. core-coder에게 전달할 태스크 (한 줄 요약)

**OpenAIPsychAiServiceImpl.hasRequiredSections()를 유연화: (1) 줄 시작 공백 허용(`^\s*[#＃]+\s*.*요약/권고`), (2) 한 줄 reportMarkdown 대비 fallback으로 줄 시작 없이 `[#＃]+\s*.*요약/권고` 패턴 추가, (3) 선택적으로 키워드 보조 검사 도입 후, 위 체크리스트로 회귀 확인.**
