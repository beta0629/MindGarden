# 알림 채널 선호(NOTIFICATION_CHANNEL_PREFERENCE) — 테스트 매트릭스·시나리오

| 항목 | 내용 |
| --- | --- |
| **작성일(기준)** | 2026-04-24 |
| **역할** | core-tester — 설계·문서; 구현·프로덕션 대량 수정은 core-coder |
| **참조** | [배치 계획](./NOTIFICATION_CHANNEL_PREFERENCE_PLAN.md), [화면 스펙](../../design-system/SCREEN_SPEC_CLIENT_CONSULTANT_NOTIFICATION_CHANNEL_PREFERENCE.md), [테스트 스킬](../../../.cursor/skills/core-solution-testing/SKILL.md), [TESTING_STANDARD.md](../../standards/TESTING_STANDARD.md) |

---

## 1. 범위·전제

- **대상**: 내담자·상담사 **알림 수신 채널 선호**(논리값: `TENANT_DEFAULT` / `KAKAO` / `SMS` 등)의 **조회·저장·발송 라우팅** 및 **테넌트 채널 가용성**과의 정합.
- **정책 표**(우선·폴백·미설정)는 계획서 [정책 표](./NOTIFICATION_CHANNEL_PREFERENCE_PLAN.md#정책-표)가 TBD이므로, 아래 **기대 결과**는 정책 확정 후 한 줄씩 “정책 ID”로 고정하는 것을 권장한다.
- **라우트·컴포넌트 경로**는 화면 스펙 §13 [TBD: 경로] — explore 반영 후 본 문서 §8을 갱신한다.

---

## 2. 역할·권한 매트릭스 (조회 / 수정 / 403)

화면 스펙 §3.2·§2와 정합. API·통합 테스트는 `Authorization: Bearer`, `X-Tenant-ID` 필수 ([TESTING_STANDARD.md](../../standards/TESTING_STANDARD.md), core-solution-testing 스킬).

| ID | 역할 | 액션 | 대상 리소스 | 기대 HTTP·동작 | 비고 |
| --- | --- | --- | --- | --- | --- |
| R-01 | CLIENT | 조회(GET) | **본인** 선호 | 200, 본인 `tenantId`와 일치 | JSON 스키마·enum 검증 |
| R-02 | CLIENT | 수정(PUT/PATCH) | **본인** | 200, 저장 후 재조회 일치 | 유효 enum만 |
| R-03 | CLIENT | 조회/수정 | **타 사용자** | **403** (또는 제품 표준 404 마스킹) | 크로스 사용자 ID |
| R-04 | CONSULTANT | 조회 | 본인 | 200 | R-01과 동등 패턴 |
| R-05 | CONSULTANT | 수정 | 본인 | 200 | |
| R-06 | CONSULTANT | 조회/수정 | 타 사용자 | **403** | |
| R-07 | ADMIN | 조회 | 동일 테넌트 내 대상 사용자 | 200 | 어드민 스코프·감사 로그 TBD |
| R-08 | ADMIN | 수정 | 정책 **허용** 시 | 200 | 기획 “편집 가능” 분기 |
| R-09 | ADMIN | 수정 | 정책 **읽기 전용** | **403** 또는 409 + 메시지 | UI는 disabled + §12 `adminReadOnlyHint` |
| R-10 | (임의 로그인) | 조회/수정 | 유효 토큰 없음 | **401** | |
| R-11 | CLIENT/CONSULTANT | 수정 | 본인이지만 **금지된 enum**(테넌트에 SMS 없는데 SMS) | **400/422** | API 거부; §7.2–7.3 |

---

## 3. 테넌트 격리 (`tenantId`)

| ID | 시나리오 | 기대 |
| --- | --- | --- |
| T-01 | 토큰의 테넌트 A + 헤더 `X-Tenant-ID: A` + A 소속 사용자 ID | 정상 조회·수정 |
| T-02 | 토큰 테넌트 A + 헤더 `X-Tenant-ID: B` | **403/400** (제품 표준에 따름) |
| T-03 | A 테넌트 관리자가 B 테넌트 사용자 ID로 경로 조회 | **403/404**, B 데이터 **비노출** |
| T-04 | 저장 시 본문·경로의 `tenantId` 불일치 | 거부 |
| T-05 | 발송 파이프라인에서 수신자 조회 시 `tenantId` 누락 | 발송 실패 또는 명시적 가드 (구현 후 단언) |

---

## 4. 테넌트 채널 가용성 × UI·API·폴백 기대

화면 스펙 §7.1–§7.5. E2E·컴포넌트 테스트는 “표시 옵션·안내 문구·disabled”를 검증한다.

| 테넌트 상태 | UI (요약) | API 저장 허용 | 비정상 저장 시 | 발송 시 폴백(발송 계층) |
| --- | --- | --- | --- | --- |
| **둘 다** (§7.1) | 3옵션 + 테넌트 기본 힌트 TBD | `TENANT_DEFAULT`/`KAKAO`/`SMS` | 해당 조합 외 거부 | 사용자 선호 → 정책 순 |
| **알림톡만** (§7.2) | SMS 옵션 숨김(또는 비활성+안내) | `TENANT_DEFAULT`/`KAKAO`만 | `SMS` → **거부** | SMS 불가 시 알림톡만 등 **정책 TBD** |
| **SMS만** (§7.3) | KAKAO 숨김 | `TENANT_DEFAULT`/`SMS`만 | `KAKAO` → **거부** | |
| **둘 다 없음** (§7.4) | 블록 정보 전용·컨트롤 숨김/disabled | 저장 **거부** 또는 N/A | 4xx + `hintNoChannelConfigured` 계열 | 발송 **스킵/에러** TBD |
| **충돌** (§7.5, 이전 SMS 선택 후 테넌트 SMS OFF) | 로드 시 `TENANT_DEFAULT`로 표시 보정 + 경고 | 서버도 보정값 반환 또는 정책 문서화 | 재저장 시 유효값만 허용 | 라우팅 시 유효 채널로 정규화 |

**추가 단위/통합 케이스 ID (채널 × 선호)**

| ID | 설명 |
| --- | --- |
| C-01 | 가용 “둘 다”에서 세 값 각각 저장·조회 round-trip |
| C-02 | “알림톡만”에서 `SMS` 저장 시도 → 4xx |
| C-03 | “SMS만”에서 `KAKAO` 저장 시도 → 4xx |
| C-04 | “둘 다 없음”에서 GET은 메타만(또는 null) + PUT 4xx |
| C-05 | 충돌 보정: DB에 SMS 선호 + 테넌트 SMS OFF → 응답이 `TENANT_DEFAULT`(또는 정책) + UI 경고 키 |

---

## 5. 발송: `NotificationServiceImpl` — 우선순위·HIGH/MEDIUM·카카오 실패 → SMS 폴백

> 구현 세부는 정책 확정 후 고정. 테스트는 **Mockito**로 카카오 어댑터 실패·SMS 성공/실패를 주입한다.

| ID | 축 | 시나리오 | 검증 포인트 |
| --- | --- | --- | --- |
| N-01 | 우선순위 | 수신자 선호 `KAKAO`, 테넌트 알림톡 사용 가능 | 알림톡 발송 경로 1회 호출 |
| N-02 | 우선순위 | 선호 `SMS` | SMS 경로 호출 |
| N-03 | 우선순위 | 선호 `TENANT_DEFAULT` | 테넌트 기본 채널 모킹값에 따름 |
| N-04 | **HIGH** | 정책상 즉시성·재시도가 있는 알림 유형 | 실패 시 재시도/폴백이 MEDIUM과 다르면 분기 단언 |
| N-05 | **MEDIUM** | 지연 허용 알림 | HIGH와 동일 정책인지 문서·코드 주석과 일치 |
| N-06 | 폴백 | 알림톡 전송 예외(4xx/5xx/timeout) + 테넌트 SMS 가능 | **SMS 폴백 1회** (정책이 폴백 허용일 때만) |
| N-07 | 폴백 | 알림톡 실패 + 테넌트 SMS 불가 | 폴백 없음·실패 기록·사용자 영향 TBD |
| N-08 | 폴백 | 선호 SMS인데 SMS 실패 | 알림톡 재시도 여부 **정책 TBD** |
| N-09 | 격리 | 동일 시나리오, `tenantId`만 다른 두 수신자 | 호출 인자에 테넌트/수신자 분리 검증 |

---

## 6. 회귀 테스트 (고정)

| ID | 영역 | 시나리오 | 기대 |
| --- | --- | --- | --- |
| G-01 | **인증 SMS** | `SmsAuthService` 발송(로그인·본인인증 등) | **채널 선호와 무관**하게 SMS(또는 기존 전용 경로) 유지 — 선호 도입 후에도 OTP 경로 회귀 |
| G-02 | **예약 확정 알림** | 기존 예약 확정·알림톡 템플릿 resolve | 기존 동작 유지; 선호는 **라우팅만** 변경 가능 |
| G-03 | 템플릿 | 테넌트별 비즈 템플릿 override | 기존 우선순위 유지 |

### 6.1 실제 테스트 클래스 링크 (코더 보강용)

아래 표에 **채널 선호·인프라 게이트·발송 순서** 단위 테스트를 포함한다. 그 외는 **인접·회귀**로 연결해 두면 Phase E 추적이 쉬움.

| 링크 | 용도 |
| --- | --- |
| [`NotificationChannelPreferenceResolutionServiceTest.java`](../../../src/test/java/com/coresolution/consultation/service/impl/NotificationChannelPreferenceResolutionServiceTest.java) | 선호 정규화·프로필 스냅샷·`resolveDeliveryOrder`(N/C 매트릭스 대응) 단위 |
| [`NotificationServiceImplAlimtalkTemplateResolveTest.java`](../../../src/test/java/com/coresolution/consultation/service/impl/NotificationServiceImplAlimtalkTemplateResolveTest.java) | `NotificationServiceImpl` + `SmsAuthService` 등 **모킹**; 알림톡 템플릿 resolve·테넌트 알림톡 on/off·**선호→resolver 전달** 검증 |
| [`AdminTenantKakaoAlimtalkSettingsControllerTest.java`](../../../src/test/java/com/coresolution/consultation/integration/AdminTenantKakaoAlimtalkSettingsControllerTest.java) | 테넌트 알림톡 설정 API (채널 가용성 입력 데이터 측) |
| [`TenantKakaoAlimtalkSettingsServiceImplTest.java`](../../../src/test/java/com/coresolution/consultation/service/impl/TenantKakaoAlimtalkSettingsServiceImplTest.java) | 테넌트 알림톡 설정 서비스 단위 |

`SmsAuthService` 전용 `*Test.java`가 추가되면 본 표에 한 행 추가할 것.

---

## 7. E2E 스모크 후보 경로 (라우트 TBD)

화면 스펙 §2·§13: 경로 확정 전 **후보만** 나열. 확정 시 `tests/e2e/tests/**/*.spec.ts`에 반영.

| 우선순위 | 후보 플로우 | 검증 요지 |
| --- | --- | --- |
| P1 | **CLIENT** 로그인 → (TBD) 프로필 → 채널 블록 표시 → 옵션 변경 → 저장 → 재방문 시 유지 | `getClientWebLogin()` (스킬) |
| P2 | **CONSULTANT** 동일 | `getConsultantWebLogin()` |
| P3 | **ADMIN** 동일 테넌트 사용자 상세에서 블록 노출; 읽기 전용 시 disabled + 안내 | `getMindGardenWebLogin()` |
| P4 | 테넌트 “SMS만” 설정된 스테이징 테넌트에서 KAKAO 옵션 **미노출** | 데이터 준비 의존 → `@tag` 또는 시드 픽스처 |
| P5 | “둘 다 없음” 테넌트에서 안내 문구·저장 불가 | |
| P6 | 저장 후 브라우저 **콘솔 에러 0건** | 아래 게이트 |

---

## 8. TBD 정합 표 (explore 후 갱신)

| 항목 | 테스트에 쓸 실경로·라우트 |
| --- | --- |
| 클라이언트 프로필 | TBD |
| 상담사 프로필 | TBD |
| 어드민 사용자 상세 | TBD |
| 선호 API 엔드포인트 | TBD (`/api/v1/...` 표준) |

---

## 9. core-tester 게이트 체크리스트 (한 줄 요약 + 실행)

**한 줄**: Phase E 통과 = `mvn test` 그린 + (해당 시) `npx playwright test` 스모크 서브셋 그린 + **E2E/스모크 시 브라우저 콘솔 에러 0건** + 신규/변경 테스트에 **동적 데이터·`X-Tenant-ID`·권한·폴백** 시나리오 포함 ([계획서 게이트](./NOTIFICATION_CHANNEL_PREFERENCE_PLAN.md#하드코딩--tenantid--테스터-게이트-짧은-체크리스트), [TESTING_STANDARD.md](../../standards/TESTING_STANDARD.md)).

- [ ] 단위: 선호 서비스·발송 라우팅·enum 검증
- [ ] 통합: MockMvc + 역할별 200/403/401 + 테넌트 헤더 불일치
- [ ] 회귀: G-01 ~ G-03 자동화 유지
- [ ] E2E: §7 후보 중 P1–P3 최소
- [ ] 보안: IDOR(타 사용자 ID), 테넌트 크로스 (표준 보안 절)

---

## 10. 시나리오 개수 요약

| 구역 | ID 범위 | 개수 |
| --- | --- | --- |
| 역할·권한 | R-01 ~ R-11 | **11** |
| 테넌트 격리 | T-01 ~ T-05 | **5** |
| 채널 가용성·저장 | C-01 ~ C-05 | **5** |
| 발송·폴백 | N-01 ~ N-09 | **9** |
| 회귀 | G-01 ~ G-03 | **3** |
| E2E 후보 | P1 ~ P6 | **6** (경로 TBD) |
| **합계** | | **39** |

(표 §4 상단 “테넌트 상태 × UI/API” 행 5개는 매트릭스 설명용이며 §10 개수에는 **중복 없이** ID만 집계.)

---

## 실행 기록 (자동)

| 일시 (로컬) | `mvn test` exit | 요약 | 실패 시 다음 액션 |
| --- | --- | --- | --- |
| 2026-04-24 ~16:45 | **0** | tests=**628**, failures=**0**, errors=**0**, skipped=**43**; `npx eslint`(알림 채널 선호 관련 3경로) exit **0** | — |

**문서 끝** — 정책 표·라우트 TBD 반영 시 §4 기대열·§8·§7을 갱신하고, 신규 `*Test.java` / `*.spec.ts` 경로를 §6.1에 추가한다.
