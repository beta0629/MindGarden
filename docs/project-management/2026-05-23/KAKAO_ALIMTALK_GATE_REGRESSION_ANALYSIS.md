# `isKakaoAlimTalkEnabled` 게이트 회귀 분석

- **작성일**: 2026-05-23
- **작성 역할**: `core-debugger` (코드 무변경, 진단 보고서만 산출)
- **대상 브랜치**: `develop` (HEAD `99391efbf`)
- **선행 산출물**: 직전 SMS·알림톡 인벤토리 (`984e0c06` 참조 — 본 워크트리에서는 직접 식별 불가, 호출자 컨텍스트 기반)
- **관련 표준/스킬**: `.cursor/agents/core-debugger.md`, `.cursor/skills/core-solution-debug/SKILL.md`, `.cursor/skills/core-solution-business-flow/SKILL.md`

---

## 1. 회귀 의심 시나리오 (요약)

마이페이지 채널 선호도 라디오에서 "카카오 알림톡(KAKAO)"을 선택한 **일반 회원가입 사용자**가 실제로는 SMS로만 알림을 받는 현상이 의심됨.

핵심 가설:

1. `dispatchByResolvedChannelOrder`는 `resolveDeliveryOrder(pref, priority, mayKakao, maySms, tenantId)` 호출 시 `mayKakao = isKakaoAlimTalkEnabled(user)`, `maySms = isSmsEnabled(user)` 두 boolean을 게이트로 사용한다.
2. `isKakaoAlimTalkEnabled` 게이트는 **소셜 로그인 = "kakao"** 또는 **레거시 `notification_preferences` 문자열이 `"kakao"` 포함**일 때만 `true`를 반환한다.
3. 일반 회원가입 사용자는 `socialProvider != "kakao"`이고, **현재 코드 경로 어디에서도 `notification_preferences`에 `"kakao"`를 기록하는 곳이 없다** (정적 grep 검증, §2.3).
4. 결과적으로 `mayKakao = false`가 되어 `resolveDeliveryOrder`가 `KAKAO` 선호를 `TENANT_DEFAULT`로 강등 → SMS 단일 채널 발송.
5. 사용자 기대(KAKAO 우선)와 실제 동작(SMS 단일)이 불일치 → 회귀 확정.

회귀는 **운영 효과**가 있으나, 정확한 영향 범위는 운영 DB의 `notification_channel_preference` 분포에 의존(§4).

---

## 2. 코드 흐름 분석

### 2.1 메서드 매트릭스

| # | 메서드/필드 | 파일 | 책임 | 비고 |
|---|---|---|---|---|
| M1 | `NotificationServiceImpl.dispatchByResolvedChannelOrder` | `src/main/java/com/coresolution/consultation/service/impl/NotificationServiceImpl.java:166-196` | 알림 발송 진입점. `pref` + `mayKakao` + `maySms`를 묶어 `resolveDeliveryOrder` 호출 | 회귀의 발화 지점 |
| M2 | `NotificationServiceImpl.isKakaoAlimTalkEnabled` | 같은 파일 `L201-205` | mayKakao 결정 — 소셜=kakao OR legacy `"kakao"` 포함 | **회귀 근원 (좁은 게이트)** |
| M3 | `NotificationServiceImpl.isSmsEnabled` | `L209-214` | maySms 결정 — `"sms_disabled"` 미포함 시 true (opt-out) | 일관성 OK |
| M4 | `NotificationChannelPreferenceResolutionService.resolveDeliveryOrder` | `src/main/java/com/coresolution/consultation/service/impl/NotificationChannelPreferenceResolutionService.java:106-131` | `canKakao = infra && userMayUseKakao`, KAKAO 선호 + `!canKakao` → `TENANT_DEFAULT`로 다운그레이드 | 다운그레이드 로직은 의도된 설계이나, M2의 게이트가 좁아 회귀가 표면화됨 |
| M5 | `NotificationChannelPreferenceResolutionService.normalizeIncomingPreference` | 같은 파일 `L60-70` | 저장 시 보정 — `KAKAO` 요청 시 **테넌트 인프라**만 검사 (사용자 레거시 동의 미검사) | 저장 단계에서는 게이트가 더 넓음 — **저장과 발송 게이트의 비대칭** |
| M6 | `NotificationChannelPreferenceCode.fromStored` | `src/main/java/com/coresolution/consultation/constant/NotificationChannelPreferenceCode.java:26-35` | DB 문자열 → enum, null/빈/Unknown → `TENANT_DEFAULT` | OK |
| M7 | `MyPageServiceImpl.updateMyPageInfo` | `src/main/java/com/coresolution/consultation/service/impl/MyPageServiceImpl.java:233-238` | CLIENT/CONSULTANT 한정으로 `normalizeIncomingPreference` 호출 후 `notification_channel_preference` 저장. **`notification_preferences`(legacy)는 건드리지 않음** | **legacy/신규 컬럼이 분리되어 자동 sync 부재** |

핵심 코드 (CODE REFERENCES):

```201:205:src/main/java/com/coresolution/consultation/service/impl/NotificationServiceImpl.java
    private boolean isKakaoAlimTalkEnabled(User user) {
        // 카카오 로그인 사용자이거나 알림톡 수신 동의한 경우
        return user.getSocialProvider() != null && "kakao".equalsIgnoreCase(user.getSocialProvider()) ||
               (user.getNotificationPreferences() != null && user.getNotificationPreferences().contains("kakao"));
    }
```

```106:131:src/main/java/com/coresolution/consultation/service/impl/NotificationChannelPreferenceResolutionService.java
    public List<NotificationPhysicalChannel> resolveDeliveryOrder(
        NotificationChannelPreferenceCode preference,
        NotificationPriority priority,
        boolean userMayUseKakao,
        boolean userMayUseSms,
        String tenantId) {
        TenantInfrastructureGates gates = resolveTenantInfrastructure(tenantId);
        boolean canKakao = gates.kakaoInfrastructureUp() && userMayUseKakao;
        boolean canSms = gates.smsInfrastructureUp() && userMayUseSms;

        NotificationChannelPreferenceCode pref = preference;
        if (pref == NotificationChannelPreferenceCode.KAKAO && !canKakao) {
            pref = NotificationChannelPreferenceCode.TENANT_DEFAULT;
        }
        // ...
    }
```

### 2.2 legacy `notification_preferences` vs 신규 `notification_channel_preference` 의미 분리

| 컬럼 | 타입 | 의미 (코드 사용처 기준) | 갱신 경로 (코드 grep 결과) |
|---|---|---|---|
| `users.notification_preferences` | `TEXT` (JSON/문자열 free-form) | **opt-out 플래그**: `"sms_disabled"`, `"email_disabled"` 포함 시 해당 채널 차단 / 부수적으로 `"kakao"` 포함 시 알림톡 opt-in 시그널로 해석 | **`setNotificationPreferences` 호출 0건** — 신규 가입·소셜 로그인·마이페이지 저장 어디에서도 기록되지 않음. DB 시드 또는 수기 마이그레이션이 유일한 입력 경로 |
| `users.notification_channel_preference` | `VARCHAR(32)`, NOT NULL, default `TENANT_DEFAULT` | **채널 선호 SSOT**: `TENANT_DEFAULT` / `KAKAO` / `SMS` 중 하나 | `MyPageServiceImpl.updateMyPageInfo` → `normalizeIncomingPreference` → 저장 (CLIENT/CONSULTANT 한정) |

**관찰**: 두 컬럼은 **서로 다른 사용자 행위**에서 갱신되도록 설계되어 있으나, 발송 게이트(`isKakaoAlimTalkEnabled`)는 두 컬럼을 **AND-OR로 조합**하여 mayKakao를 결정한다. 그 결과 신규 컬럼이 KAKAO일지라도 legacy가 비어 있으면 mayKakao=false → KAKAO 선호가 강제 다운그레이드된다.

저장 단계(M5)는 신규 컬럼만 정규화하고 발송 단계(M2)는 legacy 컬럼까지 요구 → **저장/발송 게이트 비대칭**이 회귀의 본질.

### 2.3 정적 grep으로 본 `notification_preferences` 입력 경로

```bash
$ rg -n 'setNotificationPreferences|notificationPreferences\s*=' src/main
# (출력 없음)

$ rg -n '"kakao"|sms_disabled|email_disabled' src/main
# NotificationServiceImpl.java:203, 204, 213, 222 (4건 모두 *읽기* — 저자/저장은 없음)
```

결론: **운영 환경에서 `notification_preferences = "kakao"`로 직접 마이그레이션·시드된 사용자가 아닌 한**, 일반/소셜=non-kakao 사용자의 `notification_preferences`는 항상 `null` 또는 `"kakao"` 미포함이며 mayKakao는 영원히 `false`다.

### 2.4 단위 테스트로 본 회귀 재현

`NotificationChannelPreferenceResolutionServiceTest.resolveDeliveryOrder_userKakaoDisabled_fallsBackToTenantDefaultOrder` (test 파일 L221-233) 가 **본 회귀를 그대로 모사**하고 통과한다:

```221:233:src/test/java/com/coresolution/consultation/service/impl/NotificationChannelPreferenceResolutionServiceTest.java
    @Test
    @DisplayName("resolveDeliveryOrder: 사용자 레거시로 알림톡 불가면 TENANT_DEFAULT 경로로 재계산")
    void resolveDeliveryOrder_userKakaoDisabled_fallsBackToTenantDefaultOrder() {
        stubBothChannelsUp(TENANT_ID);

        List<NotificationPhysicalChannel> order = service.resolveDeliveryOrder(
            NotificationChannelPreferenceCode.KAKAO,
            NotificationPriority.HIGH,
            false,
            true,
            TENANT_ID);

        assertThat(order).containsExactly(NotificationPhysicalChannel.SMS);
    }
```

→ pref=KAKAO + mayKakao=false + maySms=true → 결과 `[SMS]`. 이 동작은 **테스트가 의도적으로 잠근 결과**다. 즉 회귀가 아닌 사양으로 인식되었을 가능성이 높다 → **사양과 사용자 기대의 정렬이 깨진 시점**으로 재정의된다.

---

## 3. 15 케이스 시나리오 매트릭스

### 3.1 게이트 표

테넌트 인프라(`kakaoInfrastructureUp`, `smsInfrastructureUp`)가 둘 다 `true`라고 가정. 인프라가 OFF인 경우는 §3.3에서 보조.

| # | 사용자 유형 | `notification_preferences` | `mayKakao` (`isKakaoAlimTalkEnabled`) | `maySms` (`isSmsEnabled`) |
|---|---|---|---|---|
| 1 | 일반 회원 | `null` | **false** | true |
| 2 | 일반 회원 | `"[kakao]"` (수기 마이그레이션) | true | true |
| 3 | 카카오 소셜 | `null` | **true** (소셜로 인정) | true |
| 4 | 일반 회원 | `"[sms_disabled]"` | **false** | **false** |
| 5 | 카카오 소셜 | `"[sms_disabled]"` | **true** (소셜로 인정) | **false** |

### 3.2 발송 순서 매트릭스 (15 케이스)

표 셀 표기: `pref 결정 후 채널 순서 (HIGH) / (MEDIUM)`. ⚠ = 사용자 기대 ≠ 실제 동작.

| 사용자 유형 | `TENANT_DEFAULT` 선택 | `KAKAO` 선택 | `SMS` 선택 |
|---|---|---|---|
| (1) 일반 + `null` | `[SMS]` (HIGH, ⚠ KAKAO 시도 없음) / `[SMS]` (MEDIUM, OK) | ⚠⚡ `[SMS]` / `[SMS]` (**회귀 본 케이스 — KAKAO 선택했는데 SMS만**) | `[SMS]` / `[SMS]` (의도 일치) |
| (2) 일반 + `"[kakao]"` | `[KAKAO, SMS]` / `[SMS, KAKAO]` (HIGH/MEDIUM 사양) | `[KAKAO, SMS]` / `[KAKAO, SMS]` (의도 일치) | `[SMS, KAKAO]` / `[SMS, KAKAO]` (의도 일치) |
| (3) 카카오 소셜 + `null` | `[KAKAO, SMS]` / `[SMS, KAKAO]` | `[KAKAO, SMS]` / `[KAKAO, SMS]` (의도 일치) | `[SMS, KAKAO]` / `[SMS, KAKAO]` (의도 일치) |
| (4) 일반 + `"[sms_disabled]"` | `[]` (시스템 알림 폴백) | ⚠ `[]` (시스템 알림 폴백 — KAKAO 선택했는데 메시지 무발송) | `[]` (의도가 합리적 — SMS 거부했으므로 자연 결과) |
| (5) 카카오 소셜 + `"[sms_disabled]"` | `[KAKAO]` (둘 다 HIGH/MEDIUM, SMS 거부) | `[KAKAO]` (의도 일치) | ⚠ `[KAKAO]` (SMS 선택했지만 SMS 거부 동의로 KAKAO 단일) |

### 3.3 테넌트 인프라가 OFF인 경우 보조

- `gates.kakaoInfrastructureUp() = false` → 모든 KAKAO 시도 `canKakao=false` → 결과: 가능한 한 SMS 단일 또는 빈 리스트(시스템 알림 폴백)
- `gates.smsInfrastructureUp() = false` → 모든 SMS 시도 `canSms=false` → mayKakao=true인 케이스만 발송 가능

### 3.4 사용자 기대 vs 실제 동작 정합 요약

| 케이스 | 정합? | 비고 |
|---|---|---|
| (1) × `KAKAO` (HIGH·MEDIUM) | **불일치 — 본 회귀** | 사용자는 KAKAO 선택, 실제 SMS만 발송 |
| (1) × `TENANT_DEFAULT` × HIGH | 불일치 (잠재) | 테넌트 기본 정책(HIGH=KAKAO 우선)이 적용되지 않음 — 다만 사용자 명시 선택은 아님 |
| (4) × `KAKAO` | 불일치 | 사용자는 KAKAO 원했으나 무발송 |
| (5) × `SMS` | 불일치 | 사용자가 SMS 선택했으나 KAKAO 단일 발송 |
| 나머지 11 케이스 | 정합 | — |

회귀의 사용자 체감 핵심은 **케이스 (1)**: 운영 모집단 분포상 다수일 가능성이 높음.

---

## 4. 운영 DB 영향 추정

### 4.1 실행 가능성

본 워크스테이션은 운영 SSH/MySQL 접속이 활성화되어 있지 않다 (`scripts/database/sync/prod-to-dev-daily.sh` 는 운영 서버 내부 cron 용 — `/etc/mindgarden/prod-to-dev-sync.env` 필요). 따라서 본 보고서에서는 **실 SELECT 결과는 첨부하지 않으며**, 후속 운영 SSH 권한자가 직접 실행할 수 있도록 SQL 만 명시한다.

### 4.2 권장 운영 SELECT (read-only)

```sql
-- 4.2.1 채널 선호도 분포
SELECT notification_channel_preference, COUNT(*) AS cnt
FROM users
WHERE deleted_at IS NULL
GROUP BY notification_channel_preference;

-- 4.2.2 KAKAO 선택했지만 isKakaoAlimTalkEnabled=false 가 되는 사용자 카운트
--      (= 본 회귀의 직접 피해자)
SELECT COUNT(*) AS affected_kakao_selectors
FROM users
WHERE deleted_at IS NULL
  AND notification_channel_preference = 'KAKAO'
  AND (social_provider IS NULL OR LOWER(social_provider) <> 'kakao')
  AND (notification_preferences IS NULL OR notification_preferences NOT LIKE '%kakao%');

-- 4.2.3 영향 카운트 + role 분포
SELECT role_code, COUNT(*) AS affected
FROM users
WHERE deleted_at IS NULL
  AND notification_channel_preference = 'KAKAO'
  AND (social_provider IS NULL OR LOWER(social_provider) <> 'kakao')
  AND (notification_preferences IS NULL OR notification_preferences NOT LIKE '%kakao%')
GROUP BY role_code;

-- 4.2.4 추가 — TENANT_DEFAULT 사용자 중 HIGH priority 알림에서 KAKAO 누락 가능성 추정
SELECT COUNT(*) AS tenant_default_users_potentially_sms_only_on_high
FROM users
WHERE deleted_at IS NULL
  AND notification_channel_preference = 'TENANT_DEFAULT'
  AND (social_provider IS NULL OR LOWER(social_provider) <> 'kakao')
  AND (notification_preferences IS NULL OR notification_preferences NOT LIKE '%kakao%');

-- 4.2.5 추가 — 두 컬럼이 충돌하는 케이스(`SMS` 선호 + `sms_disabled` legacy 동의)
SELECT COUNT(*) AS conflicting_sms_disabled_with_sms_preference
FROM users
WHERE deleted_at IS NULL
  AND notification_channel_preference = 'SMS'
  AND notification_preferences LIKE '%sms_disabled%';
```

운영 DB 쓰기는 절대 금지 — 본 분석 단계에서는 SELECT 만 실행할 것.

### 4.3 정성적 추정

- 일반 회원 가입 비중이 우세하고 카카오 소셜 가입자가 일부인 운영 패턴에서, `notification_channel_preference = 'KAKAO'` 사용자 중 **소셜 != kakao 인 비율 ≈ 100%** 가 회귀 영향권에 속한다 (코드 경로상 `notification_preferences`에 `"kakao"`가 기록될 수 없으므로).
- `TENANT_DEFAULT` 사용자(default) 중 일반 회원도 HIGH priority(예약 확정/취소/리마인더 등)에서 1순위 KAKAO 시도가 일어나지 않고 SMS로 빠진다. 사용자 체감 회귀는 KAKAO 명시 선택자보다 약하나(기본값이라 기대 강도 낮음), **알림톡 발송량/비용 모델**에는 영향이 있다.

---

## 5. 권고 옵션 D1/D2/D3

### 옵션 D1 — `isKakaoAlimTalkEnabled` 게이트 완화

**변경 범위**: `NotificationServiceImpl.isKakaoAlimTalkEnabled` 만 수정. 다른 SSOT 흐름 유지.

**제안 시맨틱**:
- legacy `notification_preferences` 의 opt-**out** 플래그(예: 추후 도입될 `"kakao_disabled"`) 가 있을 때만 false.
- 그 외에는 mayKakao = true (테넌트 인프라 게이트가 `resolveDeliveryOrder` 안에서 별도로 작동).
- 즉, "사용자가 명시적으로 거부하지 않는 한 알림톡 시도 허용".

**장점**:
- 최소 침습, 회귀 즉시 해소. 케이스 (1) × KAKAO·TENANT_DEFAULT(HIGH) 모두 정상화.
- 마이그레이션 불필요 (legacy 컬럼에 `"kakao_disabled"`가 적재된 사용자가 0건이라 추정).
- 단위 테스트 1건 (위 §2.4) 의 expected 값을 `[KAKAO, SMS]`로 갱신해야 함 — 사양 변경이라 명시 문서화 필요.

**단점/주의**:
- legacy 컬럼의 의미를 "opt-out 전용"으로 재정의하는 사양 결정이 필요. 운영자가 `notification_preferences`를 `"kakao"`로 직접 시드한 이력이 있다면 그 사용자에 한해 동작이 미세하게 변하지 않음 (계속 true) — 영향 없음.
- `isSmsEnabled`와의 시맨틱 정합을 위해 `"kakao_disabled"` 키 도입 시 문서화 필요.

**위험도**: 낮음 (Phase 1, fast-follow).

### 옵션 D2 — `NotificationChannelPreferenceResolutionService` 단일 SSOT 정합

**변경 범위**: `NotificationServiceImpl` 의 `isKakaoAlimTalkEnabled`/`isSmsEnabled` 두 메서드를 deprecate. 발송 게이트는 `resolveTenantInfrastructure` 의 인프라 게이트 + 사용자 선호(`notification_channel_preference`) 만으로 결정.

**제안 시맨틱**:
- 사용자 동의/거부 의사는 **`notification_channel_preference`** 와 (옵션) 별도 boolean 컬럼(`kakao_alimtalk_notification`, `email_notifications` 등 기존 Boolean 필드)으로만 표현.
- legacy `notification_preferences` 는 deprecate (DB 컬럼은 보존하되 읽기 미사용).
- `dispatchByResolvedChannelOrder` 호출 시 `userMayUseKakao = user.getKakaoAlimTalkNotification() != Boolean.FALSE`, `userMayUseSms = user.getSmsNotification() != Boolean.FALSE` 처럼 boolean 컬럼 또는 항상 `true`(테넌트 인프라가 SSOT) 로 통일.

**장점**:
- 게이트가 1개 흐름(테넌트 인프라 + enum 선호)으로 수렴. 디버깅·테스트 매트릭스 감소.
- legacy free-form TEXT 컬럼의 모호함 제거.

**단점/주의**:
- 대규모 리팩터. 영향 파일·테스트 다수. 운영 데이터 점검 필요(레거시 컬럼 의존성 확인).
- 합의서 + 단계 분리 필요. fast-follow 핫픽스로는 부적합.
- Phase 2 이상에서 통합 정리 권장.

**위험도**: 중-상. 대신 향후 SSOT 통합 효과 큼.

### 옵션 D3 — 마이페이지 저장 시 `notification_preferences` 자동 sync

**변경 범위**: `MyPageServiceImpl.updateMyPageInfo` (또는 그 하단 호출 hook) 에서 `notification_channel_preference` 저장 시 legacy 컬럼을 다음 규칙으로 동기화:

- `KAKAO` 선택 → legacy 에 `"kakao"` 추가 (없으면), `"sms_disabled"` 제거.
- `SMS` 선택 → legacy 에서 `"kakao"` 제거, `"sms_disabled"` 추가하지 않음 (SMS opt-in 유지).
- `TENANT_DEFAULT` → 둘 다 손대지 않음 (사용자 명시 의사 없음).

**장점**:
- 발송 게이트 코드(`isKakaoAlimTalkEnabled`/`isSmsEnabled`) 변경 없음 — 최소 리스크.
- 기존 로직과 호환되며, legacy 컬럼이 신규 컬럼의 "그림자" 역할.

**단점/주의**:
- 기존 사용자(이미 KAKAO 선택 후 legacy 비어 있는 케이스)에 대한 **백필 마이그레이션** 필요 (V`yyyyMMdd_xxx`__backfill_kakao_alimtalk_optin.sql). 마이그레이션 미실행 시 회귀 잔존.
- legacy 컬럼이 "JSON-like free-form" 인 상태에서 in-place 문자열 조작 — 파싱 안전성 검증 필요.
- 2개 컬럼이 의미적으로 중복 → 추후 D2 정리 시 빚이 됨.
- 마이페이지 외 경로(가입 직후, 관리자 사용자 편집 등)에서 신규 컬럼만 갱신하는 시점이 있으면 동기 누락 가능 → grep 필요.

**위험도**: 중. 회귀 해소 + 마이그레이션 1회.

### 5.4 옵션 비교표

| 항목 | D1 | D2 | D3 |
|---|---|---|---|
| 침습 범위 | 게이트 1메서드 | 다수 클래스 + 테스트 | 마이페이지 hook + 마이그레이션 |
| 즉시 회귀 해소 | ✅ | ⏳ Phase 2 | ✅ (백필 후) |
| SSOT 정합 | 부분 (legacy 의미 재정의) | 완전 | 임시 (이중 컬럼 유지) |
| 위험도 | 낮음 | 중-상 | 중 |
| 후속 위임 대상 | `core-coder` | `core-planner` | `core-coder` |
| 마이그레이션 필요 | 없음 | 가능 (legacy deprecate) | 1회 (KAKAO 선호자 backfill) |

### 5.5 최종 권고

**1차: 옵션 D1 (즉시 핫픽스)** 채택 권고.

근거:
- 본 회귀의 본질은 `isKakaoAlimTalkEnabled` 가 "사용자 동의의 적극 표현"을 요구하는 데 반해, 신규 채널 선호 UI 가 "사용자가 KAKAO 선택" 자체를 동의로 간주하기 때문. legacy 컬럼이 비어 있는 한 두 의미가 영원히 엇갈린다.
- D1 은 게이트 1메서드만 손대므로 핫픽스 위험 최소. 단위 테스트 1건만 갱신.
- 사용자 명시 선택(`notification_channel_preference = KAKAO`) + 인프라 OK 라면 `mayKakao = true` 가 직관적이며 §3.2 매트릭스의 ⚠ 셀들이 모두 해소.

**2차: 옵션 D2 (Phase 2 리팩터)** 합의서 위임 권고.

근거:
- legacy `notification_preferences` 의 free-form TEXT 가 SSOT 분산을 만들고 있다 (저장 0건, 읽기 4건). 장기적 deprecate.
- 디자인 핸드오프 (`SMS_ALIMTALK_SETTINGS_COPY_DESIGN_HANDOFF.md`) 의 UI-3 라디오 시안과 정렬.

옵션 D3 는 D1 채택 시 불필요 (legacy 컬럼을 그림자로 유지할 가치가 없음).

---

## 6. 후속 위임 권고

### 6.1 D1 채택 시 — `core-coder` 위임

**프롬프트 초안**:

> `isKakaoAlimTalkEnabled` 게이트 회귀 핫픽스를 적용해 주세요. 분석 보고서 `/Users/mind/mindGarden/docs/project-management/2026-05-23/KAKAO_ALIMTALK_GATE_REGRESSION_ANALYSIS.md` (옵션 D1) 참조.
>
> 변경 사항:
> 1. `src/main/java/com/coresolution/consultation/service/impl/NotificationServiceImpl.java` `isKakaoAlimTalkEnabled` — legacy `notification_preferences` 의 opt-**out** 플래그(예: `"kakao_disabled"`) 가 있을 때만 false 반환. 그 외 true. JavaDoc 갱신.
> 2. (선택) `isSmsEnabled` JavaDoc 정합: 동일 패턴(opt-out 전용) 명시.
> 3. `src/test/java/com/coresolution/consultation/service/impl/NotificationChannelPreferenceResolutionServiceTest.java` `resolveDeliveryOrder_userKakaoDisabled_fallsBackToTenantDefaultOrder` — expected 값을 `[KAKAO, SMS]` 로 갱신하고 테스트 이름/DisplayName 도 시맨틱 변경 반영 (`legacy 거부 플래그가 있을 때만 강등` 등).
> 4. `NotificationServiceImpl` 단위 테스트 신설: `isKakaoAlimTalkEnabled`·`dispatchByResolvedChannelOrder` 매트릭스 §3.2 의 5×3 케이스 중 (1)·(2)·(3) × (TENANT_DEFAULT·KAKAO·SMS) 9 케이스 커버.
> 5. 회귀 영향 사용자 백필은 불필요 (`KAKAO` 선호가 이미 신규 컬럼에 저장되어 있어 게이트 완화만으로 즉시 정상화).
>
> 빌드/테스트 통과 후 `develop` 에 커밋. main 푸시 금지.

### 6.2 D2 채택 시 — `core-planner` 위임

**프롬프트 초안**:

> Phase 2 리팩터 합의서를 기안해 주세요. 분석 보고서 `/Users/mind/mindGarden/docs/project-management/2026-05-23/KAKAO_ALIMTALK_GATE_REGRESSION_ANALYSIS.md` (옵션 D2) 참조.
>
> 합의서 포함 항목:
> 1. legacy `users.notification_preferences` 의 운영 시드/마이그레이션 이력 정리 — 실제 데이터 분포 SELECT 첨부 (§4.2 SQL 활용).
> 2. SSOT 통합 방향: 발송 게이트는 (테넌트 인프라) + (`notification_channel_preference`) + (필요 시 boolean 옵트아웃 컬럼 1~2개) 만 사용.
> 3. legacy 컬럼 deprecate 단계 (read-only → drop → DB migration).
> 4. 영향 파일/테스트 인벤토리 (NotificationServiceImpl, AlertService, AdminNotification, 푸시 트리거 등 cross-check 필요).
> 5. 합의 후 `core-coder` 위임 분할.

### 6.3 D3 채택 시 — `core-coder` 위임 (선택)

본 진단은 D3 를 1차 권고하지 않음. 채택 시:

> `MyPageServiceImpl.updateMyPageInfo` 의 `notification_channel_preference` 저장 직후 legacy `notification_preferences` 를 동기화하는 hook 추가 (§5.3 규칙). 가입/관리자 사용자 편집 경로 등 다른 진입점도 grep 으로 확인하여 누락 시 hook 추가. KAKAO 선호자 백필 마이그레이션 (V`yyyyMMdd`__backfill_kakao_alimtalk_optin.sql) 첨부. 단위 테스트 + 운영 dry-run.

---

## 7. 코드 무변경 확약

본 분석은 `core-debugger` 역할 정의에 따라 **코드 무변경**으로 수행되었다. 실제 수정은 §6 의 옵션 채택 후 `core-coder` (또는 `core-planner`) 서브에이전트에게 위임되어야 한다.

운영 DB 쓰기는 본 분석 어디에서도 수행되지 않았으며, §4 의 SQL 은 SELECT 전용 read-only 이다.
