# 솔라피 알림톡·SMS 미수신 — 개발 환경 원인 분석 (core-debugger)

- **작성**: 2026-05-22 13:35 KST · core-debugger 서브에이전트(분석·권고만)
- **현장**: dev.core-solution.co.kr (개발 서버 / `mindgarden-dev.service`)
- **참조**: 어제 운영 반영 커밋 `c5b181d28` "feat(notifications): 결제·매핑 정산에 알림톡+SMS(Solapi) 병행 연동", `52308827d` "솔라피 SMS·카카오 알림톡 어댑터 추가"
- **관련 SSOT 문서**: `docs/project-management/PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md`

---

## §0 결정 요약 (TL;DR)

**유력 원인 — 두 개의 독립 결함이 동시에 발생 (확정)**

1. **(확정) AlimTalk 채널 비활성화** — `KakaoAlimTalkServiceImpl.isServiceAvailable()`가 `false`를 반환해 **카카오 알림톡 채널이 발송 시도 순서에서 제거**되고 있음. 원인은 `application.yml`(dev 활성 프로필)에 **`kakao.alimtalk.solapi.api-key / api-secret / pf-id` ↔ ENV 매핑이 누락**되어 있어, dev 서버 `/etc/mindgarden/dev.env`에 정상으로 등록된 `SOLAPI_ALIMTALK_PFID` 등 ENV 값이 Spring 프로퍼티로 바인딩되지 않기 때문.
2. **(확정) SMS 폴백이 실제 발송이 아닌 시뮬레이션** — dev 서버 ENV의 `SMS_TEST_MODE=true`로 인해, `SmsAuthService.sendNotificationMessage`가 외부 호출을 건너뛰고 `🧪 SMS 테스트 모드: 알림 메시지 발송 시뮬레이션` 로그만 남긴 뒤 `true`(성공) 반환. 솔라피 SMS API에 실제 요청이 가지 않음.

→ 두 결함이 합쳐져, 코드는 “성공”으로 흘러가지만(`✅ SMS 발송 성공`), 사용자 휴대폰에는 **알림톡·SMS 둘 다 도착하지 않음**. 솔라피 콘솔의 “오늘자 발송 내역”도 0건일 가능성이 매우 높음(가설 1·2 검증 포인트).

**즉시 검증 가능한 액션 (사용자 1줄 작업)**
- (A) 솔라피 콘솔 → 발송 내역 → 오늘 자 → SMS·알림톡 모두 0건인지 확인 (=백엔드 호출 자체가 안 나간 증거).
- (B) 본 보고서 §6 로그 인용 — `WARN ⚠️ solapi 알림톡 default 자격 증명 또는 pfId가 설정되지 않았습니다` + `🧪 SMS 테스트 모드` 라인 직접 확인.

**후속 (core-coder 위임 권고)**
- `application.yml`에 `kakao.alimtalk.solapi.{api-key,api-secret,pf-id,sender-number,api-url}` 항목을 ENV 변수(`SOLAPI_ALIMTALK_*`)로 바인딩하는 한 블록 추가.
- dev 서버 `/etc/mindgarden/dev.env`의 `SMS_TEST_MODE=false`로 전환(개발 환경 실발송 정책 합의 후) 또는 dev 전용 발신번호·테스트 수신자 화이트리스트 합의.

---

## §1 사용자 보고 정리

| 항목 | 내용 |
|---|---|
| 시점 | 2026-05-22 13:00 전후 |
| 환경 | 개발 (`dev.core-solution.co.kr`) |
| 시나리오 | 관리자 콘솔 → 매칭 후 일정 등록 / 또는 가예약 확정 → 사용자에게 알림 |
| 수신자 | 카카오톡 등록 본인 번호(알림톡 수신 가능 조건 충족) |
| 증상 | **카카오 알림톡 + SMS 모두 미수신**, 백엔드 에러 화면 없음 |
| 어제 작업 | 운영 반영 커밋 `c5b181d28`(2026-05-22 12:04 KST), 솔라피 콘솔에 발신번호·템플릿 등록 직접 진행 |

dev 서버 ENV는 어제 저녁(`/etc/mindgarden/dev.env` mtime: **2026-05-21 20:46:48**) `scripts/deployment/sync-solapi-sms-env.sh`로 동기화된 상태.

---

## §2 코드·흐름 분석

### §2.1 일정 등록·확정 시 알림 트리거 호출 경로

```
[admin] 매칭 후 일정 등록 / 가예약 확정
  └─ ScheduleServiceImpl.confirmSchedule(scheduleId, adminNote)              ← `confirmSchedule:743`
        └─ tryDispatchScheduleConfirmedExternalNotification(saved)           ← `:771`
              └─ notificationService.sendConsultationConfirmed(client, ...)  ← `:799`
                    └─ NotificationServiceImpl.sendNotification(HIGH)        ← `:64`
                          └─ dispatchByResolvedChannelOrder                  ← `:166`
                                └─ NotificationChannelPreferenceResolutionService
                                      .resolveDeliveryOrder(pref, HIGH,
                                          isKakaoAlimTalkEnabled, isSmsEnabled, tenantId)
                                          ↑
                                   여기서 내부적으로
                                   `kakaoAlimTalkService.isServiceAvailable()` 호출 (`:43`)
```

가예약 입금 확정 직후의 BOOKED 전환 흐름(`finalizeTentativeSchedulesAfterDepositConfirmed → notifyTentativeScheduleBookedAfterDeposit → tryDispatchScheduleConfirmedExternalNotification`, `ScheduleServiceImpl:558,584`)도 동일하게 같은 함수에 합류.

### §2.2 채널별 SPI(어제 도입분 포함)

- 알림톡 — `KakaoAlimTalkServiceImpl.sendAlimTalk`(`:107`)
  - `alimTalkEnabled`(`${kakao.alimtalk.enabled:false}`)
  - `simulationMode`(`${kakao.alimtalk.simulation-mode:true}`)
  - `provider`(`${kakao.alimtalk.provider:bizmsg}`) → `solapi`면 `sendViaSolapi`(`:179`)
  - `sendViaSolapi`는 `KakaoSolapiCredentialResolver.resolveCredentials(apiKeyRef)` / `resolvePfId(senderKeyRef)`로 자격증명·발신 프로필 ID를 lookup. 둘 중 하나라도 비면 WARN 후 false. 그 다음 `SolapiAlimTalkClient.send` → `POST /messages/v4/send-many/detail` (type=ATA, kakaoOptions{pfId,templateId,variables}).
- SMS — `SmsAuthService.sendNotificationMessage`(`:120`)
  - `isEffectiveSmsEnabled()`: `sms.auth.enabled` && 테넌트 SMS on/off
  - `smsProperties.isTestMode()`(`${sms.auth.test-mode:true}`) 가 true면 `🧪 SMS 테스트 모드: 알림 메시지 발송 시뮬레이션`만 로그 남기고 **즉시 true 반환**(외부 호출 X) ← 결함 #2 지점.
  - 실모드일 때만 `SolapiSmsProvider.sendMany` → `POST /messages/v4/send-many/detail` (HMAC-SHA256 헤더는 `SolapiSignatureSigner`).

### §2.3 어제 커밋(`c5b181d28`)이 영향을 준 표면

| 표면 | 영향 |
|---|---|
| `MappingSettlementNotificationHelperImpl` | confirm-payment / confirm-deposit 시 `notificationService.sendPaymentCompleted` 호출 → 동일 발송 파이프라인. |
| `PaymentServiceImpl` | PG APPROVED 후 결제 완료 알림 동일 파이프라인 합류. |
| `SmsAuthService.sendNotificationMessage` | 신규 메서드. 본 결함의 핵심 진입점. |
| `sync-solapi-sms-env.sh` | dev에 `SMS_TEST_MODE=true` 명시(`:71`) — **결함 #2의 직접 원인**. |
| `config/environments/sms.local.env.example` | 키 채움 대상 가이드. |

> 본 사용자 시나리오(상담 일정 확정)는 `c5b181d28` 이전 커밋 `a2228611 a2263a611 feat(notifications): 예약 확정·취소·스케줄 확정 알림톡 연동`에서 도입된 흐름이며, `c5b181d28`의 결제·매핑 정산 흐름과 같은 `NotificationServiceImpl` 파이프라인을 공유한다.

---

## §3 환경 변수·설정 매트릭스

### §3.1 코드가 읽는 Spring 프로퍼티 (검증 결과)

| Spring 프로퍼티 | yml 매핑 위치 | 활성 프로필 | 결과 |
|---|---|:-:|---|
| `sms.auth.api-key` ← `${SMS_API_KEY}` | `application.yml:359` | dev/prod/local | ✅ 바인딩 |
| `sms.auth.api-secret` ← `${SMS_API_SECRET}` | `application.yml:360` | dev/prod/local | ✅ 바인딩 |
| `sms.auth.sender-number` ← `${SMS_SENDER_NUMBER}` | `application.yml:361` | dev/prod/local | ✅ 바인딩 |
| `sms.auth.test-mode` ← `${SMS_TEST_MODE:true}` | `application.yml:362` | dev/prod/local | ✅ 바인딩, **dev 기본 true** |
| `sms.auth.provider` ← `${SMS_PROVIDER:nhn}` | `application.yml:357` | dev/prod/local | ✅ 바인딩 |
| `kakao.alimtalk.enabled` ← `${KAKAO_ALIMTALK_ENABLED:false}` | (annotation `@Value` 직접) | dev/prod/local | ✅ ENV 직접 바인딩 |
| `kakao.alimtalk.simulation-mode` ← `${KAKAO_ALIMTALK_SIMULATION_MODE:true}` | (annotation 직접) | dev/prod/local | ✅ ENV 직접 바인딩 |
| `kakao.alimtalk.provider` ← `${KAKAO_ALIMTALK_PROVIDER:bizmsg}` | (annotation 직접) | dev/prod/local | ✅ ENV 직접 바인딩 |
| **`kakao.alimtalk.solapi.api-key`** ← `${SOLAPI_ALIMTALK_API_KEY:}` | `application-local.yml.example:135` | **local만** | ❌ **dev/prod에 매핑 없음** |
| **`kakao.alimtalk.solapi.api-secret`** ← `${SOLAPI_ALIMTALK_API_SECRET:}` | `application-local.yml.example:136` | **local만** | ❌ **dev/prod에 매핑 없음** |
| **`kakao.alimtalk.solapi.pf-id`** ← `${SOLAPI_ALIMTALK_PFID:}` | `application-local.yml.example:137` | **local만** | ❌ **dev/prod에 매핑 없음** |
| `kakao.alimtalk.solapi.sender-number` | `application-local.yml.example:138` | **local만** | ❌ dev/prod 매핑 없음 |
| `sms.auth.solapi.api-base-url` ← `${SOLAPI_API_BASE_URL:https://api.solapi.com}` | `application.yml:366` | dev/prod/local | ✅ 바인딩(SMS 측) |

`application.yml:442-460`은 위 ENV 키들을 **주석으로만** 나열하고 실제 매핑은 없다.

> 베이스 `application.yml`만 활성 + `--spring.profiles.active=dev`로 기동되면, **dev 환경에선 `kakao.alimtalk.solapi.*` 4개 프로퍼티 전부 빈 문자열**로 해석된다. `KakaoSolapiCredentialResolver.hasDefaultPfId()`가 `false`인 핵심 이유.
>
> Spring Boot 의 relaxed binding은 `KAKAO_ALIMTALK_SOLAPI_PF_ID` 같은 ENV 이름은 자동 매핑하지만, `SOLAPI_ALIMTALK_PFID`는 `solapi.alimtalk.pfid`에 해당하는 키일 뿐 `kakao.alimtalk.solapi.pf-id`로는 자동 변환되지 않는다.

### §3.2 dev 서버 실측 (`/etc/mindgarden/dev.env`, 비밀값은 길이만 표시)

```
KAKAO_ALIMTALK_ENABLED=true                      (len=4)
KAKAO_ALIMTALK_PROVIDER=solapi                   (len=6)
KAKAO_ALIMTALK_SIMULATION_MODE=false             (len=5)
SMS_AUTH_ENABLED=true                            (len=4)
SMS_PROVIDER=solapi                              (len=6)
SMS_TEST_MODE=true                               (len=4)   ← ★ 결함 #2 핵심
SOLAPI_ALIMTALK_PFID=<32 chars>                  ← 등록은 되어 있으나 §3.1 매핑 누락으로 미사용
SMS_API_KEY=<16 chars>
SMS_API_SECRET=<32 chars>
SMS_SENDER_NUMBER=<10 chars, prefix '03', suffix '01'>   ← 길이 10은 02·031 등 시내국번 가능. mobile(010, 11자) 아님
```

확인 누락: `SOLAPI_ALIMTALK_API_KEY`, `SOLAPI_ALIMTALK_API_SECRET` 키 자체는 `dev.env`에 **없다**. (resolver는 `sms.auth.api-key/api-secret` 즉 `SMS_API_KEY/SECRET`로 fallback이 되도록 설계되어 있어, **이 두 값은 가설 1과는 별개로 정상**.)

### §3.3 systemd 정합

- `/etc/systemd/system/mindgarden-dev.service`: `ExecStart=/opt/mindgarden/start.sh`
- `/opt/mindgarden/start.sh`: `set -a; source /etc/mindgarden/dev.env; set +a` 후 `java -jar app.jar --spring.profiles.active=dev` 실행 → ENV 모두 export됨(누락 아님).
- 현재 jar mtime **2026-05-22 12:05:59**, 서비스 ExecMainStart **2026-05-22 12:09:02 KST** → 어제 커밋 `c5b181d28` 반영된 신규 JAR 정상 기동 중.

---

## §4 가설별 검증 결과

| # | 가설 | 검증 방법 | 결과 |
|---:|---|---|:---:|
| 1 | **개발 환경에 솔라피 키 미설정** | dev.env 키 길이 검증 | ❌ 부분 사실: SMS 키는 있음(16/32). `SOLAPI_ALIMTALK_*` 전용 키는 없음 — 단, fallback 설계상 SMS 키로 충분. **그러나** §3.1의 yml 매핑 누락으로 인해 **실효적으로 사용 불가**. 결과는 "AlimTalk 자격증명 빈 상태와 동일" — **확정 결함**. |
| 2 | 솔라피 콘솔 발신번호 미승인 | 사용자 콘솔 확인 필요 | ⏳ 사용자 확인 필요(§5 체크리스트) — 단, 본 결함이 해결되어도 발신번호가 미승인이면 별개 실패. |
| 3 | 알림톡 템플릿 미승인 | 사용자 콘솔 확인 필요 | ⏳ 사용자 확인 필요(§5) — 별도 검증 항목. |
| 4 | 백엔드 일정 확정 흐름에서 알림톡 호출 누락 | 코드 추적 (`§2.1`) | ✅ 호출 정상. `confirmSchedule:758` → `tryDispatchScheduleConfirmedExternalNotification:771` → `notificationService.sendConsultationConfirmed:799` 경로 존재 — 결함 아님. |
| 5 | Provider 스위치 미설정 | dev.env 확인 | ✅ `KAKAO_ALIMTALK_PROVIDER=solapi`, `SMS_PROVIDER=solapi` 정확. **결함 아님**. |
| 6 | 수신자 번호 매핑 오류 | 로그 `📱 SMS 발송: 010****2121` | ✅ 복호화·전화번호 lookup은 정상. |
| 7 | 템플릿 변수 매핑 오류 | 솔라피 호출 자체가 안 나가므로 평가 불가 | — |
| 8 | dev 백엔드 미배포 | jar mtime / systemctl ExecMainStart | ✅ 12:09:02 기동, 신규 JAR — **결함 아님**. |
| **신규** | **`application.yml`에 `kakao.alimtalk.solapi.*` ENV 매핑 누락** | yml grep | ⛔ **확정 결함 #1** |
| **신규** | **dev `SMS_TEST_MODE=true`** | dev.env 직접 확인 + 로그 `🧪 SMS 테스트 모드` | ⛔ **확정 결함 #2** |

---

## §5 솔라피 콘솔 cross-check 체크리스트 (사용자 1줄 액션)

> **본 §6에서 코드·환경 결함이 확정**되었으므로, 콘솔 점검은 “결함 수정 후 진짜 발송 단계의 추가 게이트”까지 포함하는 의미. 4개 모두 확인 권장.

- [ ] **콘솔 → 잔액**: 0원인지(잔액 0이면 결함 수정 후에도 발송 차단됨)
- [ ] **콘솔 → 발신번호**: 어제 등록한 발신번호의 상태가 `승인됨/등록됨` vs `대기중/검수중`. (dev.env의 `SMS_SENDER_NUMBER`는 10자, 시내국번/`031` 가능성 — 승인 후 발신 등록 완료 상태인지)
- [ ] **콘솔 → 알림톡 → 템플릿**: 백엔드가 `templateId`로 보낼 비즈 템플릿 코드의 상태가 `승인` 인지 (`반려/검수중`이면 ATA 호출 시 솔라피 측 거부)
- [ ] **콘솔 → 발송 내역 → 오늘**: SMS·알림톡 둘 다 **0건**으로 표시되면 = §0의 진단(백엔드 호출 자체가 나가지 않음) **직접 확정**. 만약 0건이 아니면 추가 가설 분기 필요.

---

## §6 개발 서버 로그 분석 결과

`mindgarden-dev.service` 오늘 자 journalctl에서 본 사용자 시나리오와 직접 일치하는 로그:

```
13:13:13.800 WARN  c.c.c.s.i.KakaoAlimTalkServiceImpl - ⚠️ solapi 알림톡 default 자격 증명 또는 pfId가 설정되지 않았습니다
13:13:13.803 INFO  c.c.c.s.impl.NotificationServiceImpl - 📱 SMS 발송: 010****2121
13:13:13.803 INFO  c.c.c.service.SmsAuthService          - 🧪 SMS 테스트 모드: 알림 메시지 발송 시뮬레이션
13:13:13.803 INFO  c.c.c.s.impl.NotificationServiceImpl - ✅ SMS 발송 성공: 이재학
13:13:15.967 WARN  c.c.c.s.i.KakaoAlimTalkServiceImpl - ⚠️ solapi 알림톡 default 자격 증명 또는 pfId가 설정되지 않았습니다
13:13:15.971 INFO  c.c.c.s.impl.NotificationServiceImpl - 📱 SMS 발송: 010****2121
13:13:15.972 INFO  c.c.c.service.SmsAuthService          - 🧪 SMS 테스트 모드: 알림 메시지 발송 시뮬레이션
```

해석:
1. **`⚠️ solapi 알림톡 default 자격 증명 또는 pfId가 설정되지 않았습니다`** — `KakaoAlimTalkServiceImpl#isServiceAvailable():304` 로그. `KakaoSolapiCredentialResolver.hasDefaultPfId()`가 `false`라는 직접 증거. ⇒ **결함 #1 확정**.
2. **`🧪 SMS 테스트 모드: 알림 메시지 발송 시뮬레이션`** — `SmsAuthService.sendNotificationMessage:126` 로그. `SmsProperties.testMode == true` 직접 증거. ⇒ **결함 #2 확정**.
3. **솔라피 호출 흔적 부재** — `Solapi 알림톡 HTTP 오류`, `✅ Solapi SMS 발송 성공`, `Solapi 알림톡 호출 실패` 등의 라인은 오늘 자 로그에 0건. ⇒ **백엔드에서 솔라피로 나가는 HTTP 요청이 단 한 건도 없었음** = 솔라피 콘솔에 오늘자 발송 내역이 0건일 것으로 강하게 예측.

---

## §7 권장 후속 조치 매트릭스

| 우선순위 | 담당 | 액션 |
|:-:|---|---|
| 즉시 | 사용자 | §5 콘솔 4 항목 확인 → 결함 수정 후 추가 게이트 사전 점검 |
| 즉시 | 사용자/운영 | dev `/etc/mindgarden/dev.env` 정책 결정: 개발에서 SMS·알림톡 실발송을 허용할 것인지(요금·수신자 white-list 합의 필요) |
| 단기 | **core-coder** | `src/main/resources/application.yml`에 다음 한 블록 추가(분량 5~7줄, 구조 §3.1 SSOT). 같은 블록을 dev/prod 양쪽에 적용되는 위치(베이스 yml의 `kakao:` 트리)로. 예시(아래는 권고이며 실 작성은 core-coder): |
| | | `kakao.alimtalk.solapi.api-key: ${SOLAPI_ALIMTALK_API_KEY:${sms.auth.api-key:}}` |
| | | `kakao.alimtalk.solapi.api-secret: ${SOLAPI_ALIMTALK_API_SECRET:${sms.auth.api-secret:}}` |
| | | `kakao.alimtalk.solapi.pf-id: ${SOLAPI_ALIMTALK_PFID:}` |
| | | `kakao.alimtalk.solapi.sender-number: ${SOLAPI_ALIMTALK_SENDER_NUMBER:}` |
| | | `kakao.alimtalk.solapi.api-url: ${SOLAPI_ALIMTALK_API_URL:https://api.solapi.com}` |
| 단기 | **core-coder** | dev에서 알림톡 실발송을 허용해야 한다는 정책 합의 시: `sync-solapi-sms-env.sh`의 `merge_remote "$DEV_HOST" "$DEV_ENV_FILE" "true"` → `"false"` 변경, 또는 `SMS_TEST_MODE` ENV를 dev 정책 합의 후 별도 토글. 실발송 정책 문서화는 `docs/project-management/PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md`에 추가. |
| 단기 | **core-coder** | (선택) `KakaoAlimTalkServiceImpl#isServiceAvailable`가 false일 때 한 번/주기적으로만 WARN을 남기도록 rate limit 추가 권고(현재 매 호출마다 WARN — 정상 운영 시 노이즈). |
| 검수 | **core-tester** | 결함 수정 후 dev 재기동 → §8 재현 절차 수행 → 솔라피 콘솔 발송 내역 1건 이상 + 실제 카카오톡/SMS 수신 확인 → E2E 통과. `ScheduleServiceImplConfirmScheduleAlimTalkTest` / `NotificationServiceImplAlimtalkTemplateResolveTest` 회귀. |

---

## §8 재현 절차 (수정 후 검증용)

```
[Step]                            [기대 동작]                                                     [실패 시 진단 지점]
1. core-coder가 application.yml에 §7 블록 추가, dev에 재배포(=새 JAR + restart)
2. 관리자 콘솔 → 매칭 후 일정 등록 / 가예약 입금 확정
   → ScheduleServiceImpl.confirmSchedule 또는 finalizeTentativeSchedulesAfterDepositConfirmed 호출
3. 로그 `tryDispatchScheduleConfirmedExternalNotification` 진입
   → `📤 통합 알림 발송: 사용자=…, 타입=CONSULTATION_CONFIRMED, 우선순위=HIGH`
   ↳ 보이지 않으면: TenantContext 또는 client lookup 실패. ScheduleServiceImpl.tryDispatch… 의 early-return 분기 점검.
4. NotificationChannelPreferenceResolutionService.resolveDeliveryOrder
   → `kakaoInfra=true` (KakaoAlimTalkServiceImpl.isServiceAvailable이 true 반환)
   ↳ 여전히 false면: §6 WARN 라인 재발생. resolver의 default 프로퍼티 바인딩 재점검.
5. KakaoAlimTalkServiceImpl.sendAlimTalk → sendViaSolapi
   → `📡 ` 류의 SolapiAlimTalkClient 요청, 솔라피 응답 200 + errorCode=null
   ↳ 401/403: HMAC 서명 / api-key·secret 불일치
   ↳ 4xx errorCode `ValidationError`: pfId 또는 templateId 매칭 실패(콘솔 검수 상태)
6. (알림톡 성공 시) 카카오톡 수신 확인. 실패 시 SMS 폴백 흐름 동일하게 진행.
7. (SMS 폴백) SMS_TEST_MODE=false 정책 적용 후, SolapiSmsProvider.sendMany → 솔라피 응답 200
   → `✅ Solapi SMS 발송 성공: count=1`
   ↳ `🧪 Solapi 테스트 모드 - 실제 발송 스킵`이면 SmsProperties.testMode 또는 dev.env 재확인.
8. 솔라피 콘솔 → 발송 내역에 1건 이상 표시 → 사용자 휴대폰 도착.
```

각 단계의 실패 지점이 명확하면 §0의 두 결함 외 추가 결함(가설 2·3·6·7)도 같은 절차로 분기.

---

## §9 변경 이력

| 일자 | 작성자 | 비고 |
|---|---|---|
| 2026-05-22 13:35 KST | core-debugger 서브에이전트 | 신규 작성. 코드·dev 서버 ENV·journalctl 실측 기반 결함 #1·#2 확정. core-coder 위임 권고 포함. |

---

## 부록 A. 참조 코드 위치 요약

- `src/main/java/com/coresolution/consultation/service/impl/ScheduleServiceImpl.java:743,758,771,799`
- `src/main/java/com/coresolution/consultation/service/impl/NotificationServiceImpl.java:64,113,166,409`
- `src/main/java/com/coresolution/consultation/service/impl/KakaoAlimTalkServiceImpl.java:107,179,285,304`
- `src/main/java/com/coresolution/consultation/integration/solapi/KakaoSolapiCredentialResolver.java:83,120,139,150`
- `src/main/java/com/coresolution/consultation/integration/solapi/SolapiAlimTalkClient.java:82,106`
- `src/main/java/com/coresolution/consultation/service/sms/impl/SolapiSmsProvider.java:69,83`
- `src/main/java/com/coresolution/consultation/service/SmsAuthService.java:120,125,160`
- `src/main/java/com/coresolution/consultation/config/SmsProperties.java:44,54`
- `src/main/resources/application.yml:354-366,442-460`
- `src/main/resources/application-local.yml.example:115-141` (local 전용 — dev/prod 미적용)
- `scripts/deployment/sync-solapi-sms-env.sh:71` (`SMS_TEST_MODE=true` for dev)
