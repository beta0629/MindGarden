# AI SSOT 사용 가이드

> **표준 문서**. AI 호출은 이 문서가 정의하는 단일 진입점·DTO·정책을 따른다.
>
> 관련 기획: `docs/project-management/2026-05-23/AI_SSOT_STANDARDIZATION_PLAN.md`
> 트랙 B PR-1 (`6130fd63a`) — SSOT 인프라 / PR-2 (`c19fb1b33`) — caller 마이그레이션 / **PR-3 (현재)** — 어드민 UI 가드 + 본 가이드.

## 목차

- [§1 SSOT 원칙](#1-ssot-원칙)
- [§2 `AiCompletionRequest` 사용법](#2-aicompletionrequest-사용법)
- [§3 응답 처리 (`AiChatCompletionResult`, `AiJsonResponseParser`)](#3-응답-처리-aichatcompletionresult-aijsonresponseparser)
- [§4 멀티테넌트 — tenantId 전파](#4-멀티테넌트--tenantid-전파)
- [§5 Provider 선택 정책](#5-provider-선택-정책)
- [§6 헬스체크 API + 어드민 UI 가드](#6-헬스체크-api--어드민-ui-가드)
- [§7 fallback 정책](#7-fallback-정책)
- [§8 로깅·메트릭](#8-로깅메트릭)
- [§9 ShedLock + 스케줄러 misfire 가드](#9-shedlock--스케줄러-misfire-가드)
- [§10 금지 사항](#10-금지-사항)

---

## §1 SSOT 원칙

**모든 AI 호출은 단일 진입점 `AiChatCompletionService.completeChat(AiCompletionRequest)` 를 경유한다.**

- 직접 OpenAI/Gemini/Claude HTTP 호출 금지 (어드민 키 테스트 도구만 예외).
- caller(웰니스·힐링·심리검사 등) 는 자체적으로 provider 분기·키 조회·재시도를 구현하지 않는다.
- 모든 호출은 `tenantId` 와 `callerId` 를 명시한다. 멀티테넌트 격리·로그 라벨링의 SSOT.
- 흐름: `caller → AiChatCompletionService → AiProviderResolver(테넌트별 60s 캐시) → OpenAI/Gemini → AiJsonResponseParser → ai_usage_logs`.

---

## §2 `AiCompletionRequest` 사용법

`AiCompletionRequest` (`com.coresolution.consultation.service.ai.dto.AiCompletionRequest`) 는 빌더 패턴 DTO 다.

| 필드 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `systemPrompt` | 권장 | — | 시스템 역할 프롬프트 (1~3 문장 권장) |
| `userPrompt` | 필수 | — | 사용자/도메인 프롬프트 |
| `maxTokens` | 옵션 | `800` (`getMaxTokensOrDefault`) | 출력 토큰 상한 |
| `temperature` | 옵션 | `0.7` (`getTemperatureOrDefault`) | 샘플링 온도 0.0~2.0 |
| `responseFormat` | 옵션 | `TEXT` (`getResponseFormatOrDefault`) | `TEXT` / `JSON` / `MARKDOWN` |
| `requestedProvider` | 옵션 | resolver 캐시 | `openai`/`gemini`/`claude`/`replicate` |
| `traceId` | 권장 | — | 분산 추적 ID (요청 단위) |
| `tenantId` | **필수** | — | 멀티테넌트 격리 키. null/빈값 금지 |
| `callerId` | **필수** | — | 호출처 라벨 (`wellness`, `healing`, `psych-ai` 등) |

### 예제 1 — 웰니스 일일 팁 (JSON 응답)

```java
AiCompletionRequest request = AiCompletionRequest.builder()
        .systemPrompt("당신은 친절한 웰니스 코치입니다. 한국어로 응답하세요.")
        .userPrompt(promptBuilder.build(user, today))
        .responseFormat(AiResponseFormat.JSON).maxTokens(600).temperature(0.8)
        .tenantId(TenantContextHolder.getRequiredTenantId())
        .callerId("wellness-daily-tip").traceId(traceId).build();
AiChatCompletionResult result = aiChatCompletionService.completeChat(request);
```

### 예제 2 — 힐링 메시지 (TEXT)

```java
AiCompletionRequest request = AiCompletionRequest.builder()
        .systemPrompt("내담자의 감정에 공감하는 따뜻한 메시지를 작성하세요.")
        .userPrompt(healingPrompt)
        .tenantId(tenantId).callerId("healing-message").build();
AiChatCompletionResult result = aiChatCompletionService.completeChat(request);
```

### 예제 3 — 심리검사 AI 리포트 (JSON, 명시 provider)

```java
AiCompletionRequest request = AiCompletionRequest.builder()
        .systemPrompt(psychReportSystemPrompt).userPrompt(reportInputJson)
        .responseFormat(AiResponseFormat.JSON)
        .maxTokens(2000).temperature(0.4).requestedProvider("openai")
        .tenantId(tenantId).callerId("psych-ai-report").traceId(traceId).build();
AiChatCompletionResult result = aiChatCompletionService.completeChat(request);
```

---

## §3 응답 처리 (`AiChatCompletionResult`, `AiJsonResponseParser`)

`AiChatCompletionResult` 의 주요 필드:

| 필드 | 설명 |
|------|------|
| `success` | 호출 성공 여부 |
| `text` | 모델 응답 본문 (TEXT/MARKDOWN) |
| `parsedJson` | `responseFormat=JSON` 시 파서가 채운 `JsonNode` (없으면 `null`) |
| `requestedProviderId` | 요청 시 선택된 provider |
| `effectiveProviderId` | 실제 호출된 provider (fallback 발생 시 다름) |
| `isFallback` | requested != effective |
| `model` / `promptTokens` / `completionTokens` / `totalTokens` | 사용량 |
| `errorMessage` | 실패 사유 |

### TEXT / MARKDOWN

```java
if (!result.success() || !result.hasUsableText()) {
    // caller 별 fallback 정책 적용 (§7)
    return defaultMessage();
}
return result.text();
```

### JSON (파서 fallback 포함)

```java
JsonNode json = result.parsedJson();
if (json == null) {
    json = AiJsonResponseParser.parseLeniently(result.text());
}
if (json == null || !json.has("title")) {
    // 파싱 실패 — caller 정책에 따라 회전 풀 / 에러 응답
    return wellnessFallbackPool.next();
}
String title = json.get("title").asText();
```

`AiJsonResponseParser` 는 백틱 펜스, 선행 한국어 안내 문구, trailing comma 등을 lenient 하게 정리한다.

---

## §4 멀티테넌트 — tenantId 전파

> **`tenantId == null` 호출은 절대 금지.** SSOT 진입점은 가드를 통과해도 service 가 `IllegalArgumentException` 을 던진다.

### 호출 흐름 (controller → service → AI)

1. **Controller**: 세션의 `User.tenantId` 검증 → null 시 403 반환 → `TenantContextHolder.setTenantId(...)` 설정.
2. **Service**: `TenantContextHolder.getRequiredTenantId()` 또는 explicit 인자로 전달.
3. **Caller**: `AiCompletionRequest.builder().tenantId(...)` 에 명시.
4. **`AiProviderResolver.resolveProvider(tenantId)`**: `tenantId` null/blank 이면 `IllegalArgumentException`.
5. **finally**: `TenantContextHolder.clear()`.

### 스케줄러 (세션 외 컨텍스트)

스케줄러는 `TenantContextHolder` 가 비어 있으므로 **테넌트 루프** 로 explicit 전파:

```java
for (Tenant tenant : tenantRepository.findAllActive()) {
    try {
        TenantContextHolder.setTenantId(tenant.getId());
        AiCompletionRequest req = baseRequest.toBuilder().tenantId(tenant.getId()).build();
        AiChatCompletionResult r = aiChatCompletionService.completeChat(req);
    } finally {
        TenantContextHolder.clear();
    }
}
```

---

## §5 Provider 선택 정책

선택 우선순위 (높은 → 낮은):

1. **`AiCompletionRequest.requestedProvider`** — caller 가 명시 시 강제.
2. **`AiProviderResolver`** 캐시 (TTL 60s) — `system_config.AI_DEFAULT_PROVIDER` 기반.
3. **시스템 기본값** — `openai`.

`AiProviderResolver` 는:
- `findByTenantIdAndConfigKeyAndIsActiveTrue(tenantId, "AI_DEFAULT_PROVIDER")` 로 조회.
- 결과를 60초 TTL 로 `ConcurrentHashMap` 캐시.
- `invalidate(tenantId)` 로 즉시 무효화 — **provider 변경 PUT 가드 통과 시 컨트롤러가 호출**.

### Provider 변경 워크플로우

```
어드민 UI
  └─ POST /api/v1/admin/system-config/ai-default-provider {providerId: "gemini"}
       └─ SystemConfigController.setAiDefaultProvider
            ├─ guardAiProviderChange (§6)  →  키 미등록이면 400
            ├─ systemConfigService.setAiDefaultProvider("gemini")
            └─ aiProviderResolver.invalidate(tenantId)  ← 캐시 즉시 무효화
```

---

## §6 헬스체크 API + 어드민 UI 가드

> 트랙 B PR-1 신설 / PR-3 어드민 UI 가드 정착.

### `GET /api/v1/admin/ai/health`

- 권한: `ADMIN` / `STAFF` (그 외 401/403)
- 응답 (`AiProviderHealth`):

```json
{
  "tenantId": "tenant-foo",
  "activeProvider": "openai",
  "openaiKeyRegistered": true,
  "geminiKeyRegistered": false,
  "checkedAt": "2026-05-23T12:00:00Z"
}
```

- **키 값 미노출** (등록 여부만 boolean).
- 응답은 테넌트 격리 — 세션의 `tenantId` 를 사용.

### 어드민 UI 라디오 가드 (PR-3)

`SystemConfigManagement.js` 가 마운트 시 헬스 API 를 호출해 라디오 disable 가드를 적용한다.

| 상태 | OpenAI 라디오 | Gemini 라디오 | Claude/Replicate |
|------|--------------|--------------|------------------|
| 헬스 로딩 중 | disabled | disabled | (헬스 미커버 — 폼 입력값 fallback) |
| `openaiKeyRegistered=true` | enable | (헬스 결과에 따라) | 폼 입력값 fallback |
| `*KeyRegistered=false` | disabled + tooltip | disabled + tooltip | — |
| 헬스 실패 (네트워크 오류) | disabled (가드된 provider) | disabled | 폼 입력값 fallback |

- 미등록 라디오 tooltip: **"API 키 미등록 — 시스템 설정에서 등록 후 사용 가능"**
- "헬스 새로고침" 버튼으로 즉시 재조회 가능.
- 활성 provider 는 `현재 활성: <activeProvider>` 로 표시.

### 백엔드 PUT 가드

`SystemConfigController` 의 두 엔드포인트가 동일 가드를 공유한다:

- `POST /api/v1/admin/system-config/ai-default-provider` (`{providerId}`)
- `POST /api/v1/admin/system-config/AI_DEFAULT_PROVIDER` (`{configValue}`)

| 상황 | 응답 |
|------|------|
| 세션 tenantId 없음/빈값 | **403** + `테넌트 정보가 없습니다.` |
| `providerId` 누락 | 400 + `providerId는 필수입니다.` (전용 엔드포인트만) |
| 키 미등록 | **400** + `선택한 provider 의 API 키가 등록되지 않았습니다.` |
| 가드 통과 | 200 + 캐시 무효화 (`AiProviderResolver.invalidate(tenantId)`) |

---

## §7 fallback 정책 (caller 별)

| caller | 정책 | 비고 |
|--------|------|------|
| **Wellness 일일 팁** | SSOT 실패 시 **회전 풀(8종)** 반환, **DB 미저장** | 트랙 A `1a5b672f2` 정착 |
| **Healing 메시지** | SSOT 실패 시 caller 정책 — TBD | PR-2 caller 마이그레이션 후 정책 확정 예정 |
| **심리검사 AI 리포트** | SSOT 실패 시 **에러 응답** (fallback 풀 없음) | 보고서는 임의 fallback 금지 |

공통 원칙:

- `result.isFallback` 인 경우라도 `success=true` 면 사용 가능 (provider 가 다를 뿐).
- 응답이 빈 문자열·null·파싱 실패 → caller 정책에 따른 fallback.
- **fallback 시 DB 저장 정책은 caller 가 결정한다.** SSOT 가 강제하지 않는다.

---

## §8 로깅·메트릭

### `ai_usage_logs` 테이블

매 SSOT 호출은 다음 필드를 기록한다:

| 필드 | 설명 |
|------|------|
| `tenant_id` | 테넌트 격리 |
| `caller_id` | 호출처 (`wellness-daily-tip` 등) — 분석 라벨 |
| `requested_provider` / `effective_provider` | fallback 추적 |
| `model` | 사용 모델 |
| `prompt_tokens` / `completion_tokens` / `total_tokens` | 사용량 |
| `success` / `error_message` | 결과 |
| `latency_ms` | 호출 지연 |
| `trace_id` | 분산 추적 |

분석 쿼리 예: `SELECT caller_id, effective_provider, COUNT(*), AVG(latency_ms) FROM ai_usage_logs WHERE tenant_id=? AND created_at >= NOW()-INTERVAL 7 DAY GROUP BY caller_id, effective_provider`.

### 표준 로깅

- INFO: provider 해석, 정상 응답 요약
- WARN: fallback 발생, 키 미등록 가드 거부, JSON 파싱 lenient fallback
- ERROR: provider HTTP 실패, 알 수 없는 응답 형식

---

## §9 ShedLock + 스케줄러 misfire 가드

웰니스 자동 발송·기타 AI 배치는 ShedLock 으로 단일 인스턴스 실행을 보장한다.

```java
@Scheduled(cron = "${wellness.notification.cron}")
@SchedulerLock(name = "wellness-daily-notification",
        lockAtMostFor = "PT10M", lockAtLeastFor = "PT1M")
public void run() { /* 테넌트 루프 + AiCompletionRequest 호출 */ }
```

- **잠긴 동안 트리거 누락 시**: 다음 실행에서 누락 윈도우를 catch-up (예: 자정 누락 → 익일 catch-up).
- **`lockAtLeastFor`**: 너무 짧은 재시도 폭주 방지.
- 트랙 A `1a5b672f2`: 웰니스 fallback 회전 풀 + DB INSERT 차단 + ShedLock 가드 정착.

---

## §10 금지 사항

> 이 절의 사항은 **운영 게이트** 에서 차단된다. 검출 시 PR 머지 거부.

| # | 금지 | 검사 방법 |
|---|------|-----------|
| 1 | 직접 OpenAI/Gemini HTTP 호출 (caller 측) | `rg "callOpenAi\|callGeminiApi" src/main/java -g '!**/AiChatCompletionServiceImpl.java' -g '!**/SystemConfigController.java'` 결과 0건 |
| 2 | `AiCompletionRequest` 우회 (직접 OpenAI SDK·RestTemplate 사용) | 코드 리뷰 + 위 1번 |
| 3 | `tenantId == null` 또는 빈 문자열로 SSOT 호출 | `AiProviderResolver` 가 `IllegalArgumentException` 으로 차단. 단위 테스트 필수 |
| 4 | 어드민 UI 에서 디자인 토큰 외 색상 사용 | `npm run check:token-ssot` |
| 5 | 어드민 라디오에서 헬스체크 미반영 (가드 우회) | 단위 테스트 (`SystemConfigManagement.aiHealth.test.js`) |
| 6 | provider 변경 시 캐시 무효화 누락 | 단위 테스트 (`SystemConfigControllerAiProviderGuardTest`) |
| 7 | 미등록 provider 로 PUT 요청 통과 | 백엔드 가드 (§6) — 400 반환 |

---

### 참조

- 기획: `docs/project-management/2026-05-23/AI_SSOT_STANDARDIZATION_PLAN.md`
- 모니터링: `docs/standards/AI_MONITORING_HYBRID_STRATEGY.md` / 모델 추상화: `docs/standards/AI_MODEL_ABSTRACTION_GUIDE.md`
- 멀티테넌트: `.cursor/skills/core-solution-multi-tenant/SKILL.md` / API 표준: `docs/standards/API_CALL_STANDARD.md`
- 관련 코드: `service/ai/AiChatCompletionService.java`, `service/ai/AiProviderResolver.java`, `service/ai/AiProviderHealthService.java`, `controller/AdminAiHealthController.java`, `controller/SystemConfigController.java`, `frontend/src/api/admin/aiHealthApi.js`, `frontend/src/components/admin/SystemConfigManagement.js`
