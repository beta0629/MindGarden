# Log Injection 가드 정책

**버전**: 1.0.0  
**최종 업데이트**: 2026-06-14  
**상태**: 공식 표준 (P0 표준 5종 묶음)

## 1. 정책 개요

사용자 입력 등 신뢰할 수 없는 문자열을 로그에 그대로 출력하면 **CRLF Injection (가짜 로그 라인 삽입)**, 로그 DoS, 모니터링 우회가 발생할 수 있다. 본 정책은 모든 로그 출력에 `LogSanitizer` 적용을 의무화하고, CodeQL Log Injection 규칙 위반 **0건** 을 유지한다.

## 2. 적용 대상

다음 출처의 문자열을 로그에 포함할 때는 **반드시** `LogSanitizer.forLog(input)` 으로 sanitize 한다.

| 출처 | 예시 |
|---|---|
| HTTP request (header / param / body) | `request.getParameter(...)`, `@RequestParam`, `@RequestBody` |
| 사용자 입력 폼 / DTO | `userDto.getName()`, `loginRequest.getEmail()` |
| 외부 API 응답 본문 | OAuth callback `state`, kakao/naver `code` |
| 파일명 · 업로드 메타 | `multipartFile.getOriginalFilename()` |
| DB 조회 후 사용자 영역 컬럼 | name, email, address 등 (PII 는 별도 마스킹 §4) |
| 로그·메시지 큐의 외부 페이로드 | discord webhook, slack inbound |

서버 내부 상수·식별자(`UUID`, 숫자 PK, enum) 는 적용 대상 외이나, **습관적으로 sanitize 권장**.

## 3. 사용법

`src/main/java/com/coresolution/core/util/LogSanitizer.java` 의 `forLog(String)` static 메서드를 사용한다.

```java
import com.coresolution.core.util.LogSanitizer;

log.info("로그인 시도: email={}, ip={}",
        LogSanitizer.forLog(email),
        LogSanitizer.forLog(clientIp));

log.warn("OAuth 콜백 state 불일치: receivedState={}",
        LogSanitizer.forLog(receivedState));
```

`LogSanitizer` 의 동작:

- `null` → `"null"` 문자열 반환
- 길이 > 200 → 잘라낸 뒤 `"..."` 부가 (로그 DoS 차단)
- `\r`·`\n`·`\t` 및 기타 제어 문자 (`0x00 ~ 0x1F`, `0x7F`) → `_` 치환 (CRLF Injection 차단)

## 4. PII 마스킹과의 관계

`LogSanitizer` 는 **제어 문자 차단 + 길이 제한** 만 담당한다. **PII 마스킹은 별도 호출**한다.

```java
// PII 는 PiiMasker / MaskingUtil 적용 후 LogSanitizer 적용
log.info("사용자 조회: email={}", LogSanitizer.forLog(PiiMasker.maskEmail(email)));
```

PII 표준은 [`PII_PROTECTION_STANDARD.md`](./PII_PROTECTION_STANDARD.md) 참조.

## 5. 금지 사항

- 사용자 입력을 sanitize 없이 로그 출력 — CodeQL Log Injection 위반.
- 자체 sanitize 로직 사본 작성 — `LogSanitizer.forLog` 단일 SSOT 사용.
- `String.format` / `+` 문자열 결합으로 로그 메시지 조립 — SLF4J `{}` placeholder 만 사용.
- `e.getMessage()` 의 메시지를 그대로 출력 — 사용자 입력이 메시지에 포함될 수 있어 sanitize 필요.

## 6. CI / 검증 게이트

- **CodeQL**: `java/log-injection` 규칙 활성화. 위반 0건 유지. 위반 발견 시 머지 차단.
- **단위 테스트**: `LogSanitizerTest` (`src/test/java/com/coresolution/core/util/LogSanitizerTest.java`) 가 CR/LF/Tab/length 케이스를 cover.
- **PR 리뷰**: 신규 `log.{info,warn,error}` 호출 중 사용자 입력 출처 변수는 `LogSanitizer.forLog` 적용 확인.
- **하드코딩 검사**: 운영 반영 게이트(`PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`) 에서 CodeQL 결과 확인.

## 7. 회귀 차단

새 PR 이 sanitize 없는 사용자 입력 로그를 도입하면 CodeQL CI 단계에서 즉시 실패한다. 회귀 발견 시:

1. 위반 라인에 `LogSanitizer.forLog(...)` 적용.
2. 동일 패턴이 같은 컨트롤러/서비스에 추가로 있는지 grep 확인 (`rg "log\.(info|warn|error).*\b<varname>\b"`).
3. `LogSanitizerTest` 에 회귀 케이스 1건 추가.

## 8. 참조

- `src/main/java/com/coresolution/core/util/LogSanitizer.java` — 구현
- `src/test/java/com/coresolution/core/util/LogSanitizerTest.java` — 테스트
- [`LOGGING_STANDARD.md`](./LOGGING_STANDARD.md) — 로깅 표준
- [`SECURITY_STANDARD.md`](./SECURITY_STANDARD.md) §입력 검증
- [`PII_PROTECTION_STANDARD.md`](./PII_PROTECTION_STANDARD.md) — PII 마스킹
- CodeQL `java/log-injection` (Semmle)
