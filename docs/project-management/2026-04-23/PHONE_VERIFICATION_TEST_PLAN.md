# 전화 검증·중복·테넌트 — 테스트 계획서 (SSOT)

**문서 유형:** 프로젝트 관리 / 테스트 계획 (실행·코드 추가는 **core-coder P1 머지 이후 2차 배치** 권장)  
**작성일:** 2026-04-23  
**관련 SSOT·참고:**
- `docs/project-management/2026-04-23/PHONE_VERIFICATION_POLICY.md`
- `docs/project-management/2026-04-23/PHONE_VERIFICATION_COMPONENT_PROPOSAL.md`
- `docs/design-system/SCREEN_SPEC_PHONE_VERIFICATION_ADMIN_AND_SIGNUP.md`
- 테스트 표준: `docs/standards/TESTING_STANDARD.md`, `.cursor/skills/core-solution-testing/SKILL.md`

---

## 1. 범위·전제

| 항목 | 내용 |
|------|------|
| **목표** | 전화 **정규화·tenantId 스코프 중복·SMS 발송/검증** 및 **멀티테넌트 격리**가 정책·제안서와 합치되는지 **단위·통합·E2E·보안** 관점에서 검증 |
| **구현 전제** | `PHONE_VERIFICATION_COMPONENT_PROPOSAL.md`의 **P1(중복 API 의미 통합, `UserService` 단일 진입, `registerStaff` 정규화·중복 등)** 가 머지된 뒤 **본 문서의 자동화 테스트를 작성·실행**하는 것을 권장 |
| **정책 TBD** | `PHONE_VERIFICATION_POLICY.md` **§3·§4** — **테넌트 간** 동일 번호 허용, **역할별 동일 번호 매트릭스**는 `[제품결정]`. TBD가 확정되기 전 E2E/통합 케이스는 **(a) 기대값을 “문서·제품 결정에 따름”으로 표기**하거나 **(b) `@Disabled` + 이슈 링크**로 관리 |
| **문서 SSOT** | 본 턴은 **계획서만** 유지. 테스트 코드·스펙 파일 **신규 추가는 선택** — **P1 완료 후 2차 배치**로 명시 |

---

## 2. E2E 시나리오 목록 (Playwright)

**공통:** `tests/e2e/playwright.config.ts` — baseURL, `Authorization`·`X-Tenant-ID` 등 프로젝트 API 표준 준수. 멀티테넌트 시 **동적 생성 `tenantId`/시드 계정** 사용(하드코딩 ID·운영 전화 금지 — `core-solution-testing` 스킬).

### 2.1 공개 가입 — 전화 중복

**Wave 11 E2E 셀렉터:** 공개 가입 휴대폰 중복확인 클릭은 `button[data-action="register-public-phone-duplicate-check"]` (관리자 화면 값은 `PHONE_VERIFICATION_ADMIN_E2E_SCENARIOS.md` §5 `data-action` 표).

**Wave 12-B:** 공개 가입 이메일 중복확인 버튼은 `button[data-action="register-public-email-duplicate-check"]` (`TabletRegister.js`, `register.spec.ts` 스모크).

| ID | 시나리오 | 기대(원칙) | 비고 |
|----|----------|------------|------|
| E2E-PV-01 | 태블릿/공개 가입 흐름에서 **이미 tenant 내 등록된 정규화 번호** 입력 → 중복 안내 | UI에 “이미 가입된 번호” 등(카피는 `[제품결정]`) + 로그인/찾기 동선 | `TabletRegister` + `GET /api/v1/auth/duplicate-check/phone` 패턴. 스크린: `SCREEN_SPEC` §3.1·§3.2 |
| E2E-PV-02 | 동일 화면에서 **신규 유효 번호** → 중복 아님 → SMS 단계로 진행 가능(또는 스텁) | **중복 false** 이후 다음 스텝 노출/전환 | SMS 실제 발송이 어려운 CI에서는 **API 모킹·스테이징 플래그** 여부 P1 후 결정 |

### 2.2 관리자 — 내담자 / 상담사 / 스태프 등록 시 전화 중복

| ID | 시나리오 | 기대(원칙) | 비고 |
|----|----------|------------|------|
| E2E-PV-03 | **내담자** 등록: tenant 내 기존 사용자와 **동일 정규화 번호** | 저장 거부 + 테넌트 범위 충돌 메시지(스펙 §3.3 “관리자용 안내” 슬롯) | P1 `AdminService`·`UserService` 통합 이후 |
| E2E-PV-04 | **상담사** 종합/등록 UI 동일 | 위와 정책 정합 | `ConsultantComprehensiveManagement` 등 |
| E2E-PV-05 | **스태프** 등록: 전화 입력 시 **중복 검사** (제안서: 기존 `registerStaff` 경로 점검) | P1에서 중복 검사가 들어가면 **이메일 중복 UI와 대칭** 수준의 피드백 | |

### 2.3 테넌트 A vs B — 동일 번호

| ID | 시나리오 | 기대 | 비고 |
|----|----------|------|------|
| E2E-PV-06 | **Tenant A**에 정규화 번호 X 등록 후, **Tenant B**에서 동일 X로 가입/등록 시도 | **정책 TBD** — `PHONE_VERIFICATION_POLICY` §3: 일반적으론 **테넌트 간 독립 허용**. **반대로 글로벌 유일**이면 거부. | 확정 전: 케이스는 스펙에 “기대: 제품 결정 AN”으로 두고, **결정 시 단언(assert) 갱신** |
| E2E-PV-07 | (선택) **운영/보안** 요구로 글로벌 제약이 생기는 경우, **에러 문구가 과도한 PII/내부 사유**를 노출하지 않는지 | 사용자 메시지는 일반화(정책 §7·§9) | |

### 2.4 SMS — 발송 / 검증 / 재전송 (기존 API 기준)

**기준 엔드포인트(제안서·코드베이스):** `SmsAuthController` — `/send-code`, `/verify-code` 등; Auth 레거시 SMS는 `AuthController` 내 경로 병합 여부 P1. 프론트 상수·실제 URL **불일치 제거** 후 E2E는 **최종 단일 경로**에 맞출 것.

| ID | 시나리오 | 기대(원칙) |
|----|----------|------------|
| E2E-PV-10 | **발송 성공** — 유효 정규화 번호, 한도 내 | 2xx, 세션/요청 ID 등 내부 식별만(평문 전화 응답 금지 — §4 보안) |
| E2E-PV-11 | **검증 성공** — 올바른 OTP | 이후 단계(가입 완료·검증됨 플래그)로 연결 |
| E2E-PV-12 | **검증 실패** — 코드 불일치 | 사용자 메시지는 정책 §7(과다 정보 없음) |
| E2E-PV-13 | **만료** — TTL 초과 후 검증 | 만료 문구 + 재요청 동선(스크린 §3.2) |
| E2E-PV-14 | **재전송** — 쿨다운 내 재시도 | 버튼 비활성·“N초 후”(스크린 §3.2) |
| E2E-PV-15 | **일일 한도** — 한도 초과 | 일반화된 “요청 횟수 초과” 문구(정책 §7) |

> CI에서 SMS 게이트웨이·실번호가 없을 경우: **스테이징 전용 바이패스** 또는 **Mock 서버** 전략을 P1 팀과 합의 후, E2E는 **“통합 환경에서만”** 실행하도록 태그(`@sms`) 분리 권장.

---

## 3. 회귀 (Regression) — 기존 플로우

| 영역 | 시나리오 | 검증 포인트 |
|------|----------|-------------|
| **OAuth2Callback** | 소셜 로그인 후 **다중 User·`requiresPhoneAccountSelection`** / 계정 선택 모달 | 기가입·전화 매칭 **충돌 해소**; SMS 검증 P2 이후와 **상태 정합** |
| **TabletRegister** | 공개 가입, `duplicate-check/phone`, `koreanMobilePhone` 정규화 | P1에서 `formatPhoneNumber` 단일화 시 **UI 회귀**(표시·제출 payload) |
| (연관) | `UnifiedLogin` / 태블릿 로그인 | 전화 **표시·마스킹**만 영향받는지 스모크 | |

---

## 4. 단위·통합 테스트 후보 (백엔드)

**프론트 단위 (Wave 9-B):** 관리자 `ClientModal` create 휴대폰 중복확인 — [`ClientModal.phoneDuplicate.test.js`](../../../frontend/src/components/admin/ClientComprehensiveManagement/__tests__/ClientModal.phoneDuplicate.test.js).

**백엔드 통합 (Wave 8-B):** `GET /api/v1/admin/duplicate-check/phone` MockMvc 계약 검증 — [`AdminControllerDuplicateCheckPhoneIntegrationTest`](../../../src/test/java/com/coresolution/consultation/integration/AdminControllerDuplicateCheckPhoneIntegrationTest.java).

**참고 표준:** JUnit 5, Mockito, Given-When-Then, `@DisplayName` 한글, `tenantId` 동적 데이터.

### 4.1 단위 (우선)

| 대상 | 내용 | 비고 |
|------|------|------|
| **`UserService`** (또는 P1에서 도입되는 **단일 진입** 메서드) | `existsPhoneDuplicateForTenant` / `existsPhoneDuplicateForPublicSignup` **동일 정규화·암호화 복호화** 하에서 True/False | **excludeUserId**(편집) 분기 |
| **`LoginIdentifierUtils`** | `normalizeKoreanMobileDigits` / `isValidKoreanMobileDigits` — 동일 의미 입력 → 동일 정규화 | 프론트 `koreanMobilePhone.js`와 **케이스 동기** |
| **마스킹 유틸** (공용화 시) | `maskPhone` — 로그/응답에 **전체 번호 미포함** | |
| **`SmsAuthService`** (있다면) | 발송 전 정규화·유효성 거부, 쿨다운·한도 **단위는 Clock/카운터 Mock** | |

### 4.2 API 통합 (`*IntegrationTest.java`)

| 대상 | 내용 | 헤더 |
|------|------|------|
| `GET /api/v1/auth/duplicate-check/phone` | tenant 스코프, 암호화 저장과의 **일치** | 공개/세션 정책에 맞는 인증 |
| `UserController` … `duplicate-check/phone` | **Auth와 동일 시맨틱**인지(제안서 §2.2) | `Authorization`, `X-Tenant-ID` |
| `SmsAuthController` | send/verify — 잘못된 번호, 만료, 재전송 제한 | 동일 |
| **관리자 등록 API** (내담자·스태프·상담사) | 전화 중복 시 **409/400** 등 **합의된 계약** | 관리자 토큰 + tenant |

---

## 5. 보안·개인정보 (전용 시나리오)

| # | 항목 | 검증 방법 |
|---|------|-----------|
| S1 | **로그 마스킹** | 애플리케이션 로그에 **전화 전체 11자리** 미포함(정책 §9) — 구현 후 로그 샘플·정규식 스캔 테스트 또는 **통합에서 로그 appender** 스파이(프로젝트 허용 시) |
| S2 | **API 응답** | JSON에 **평문 전화** 필드가 불필요하게 노출되지 않음; 필요 시 **마스킹 필드만** (정책 §9, 스크린 §3.2) |
| S3 | **에러/한도** | 응답이 **account enumeration(계정 존재 여부 추론)** 을 과도하게 허용하지 않는지 — 정책 §7 |
| S4 | **SQLi/XSS** | 전화 파라미터·OTP 입력에 **MockMvc** 기반 퍼지(표준 `TESTING_STANDARD.md` 보안 절) |
| S5 | **테넌트 격리** | **Tenant A** 데이터로 **Tenant B** 토큰으로 duplicate/verify 호출 시 **접근 불가/빈 매칭** | |

---

## 6. CI·실행 제안 (경로만)

| 목적 | 제안 경로 / 명령 |
|------|------------------|
| **백엔드 전체 단위·통합** | `.github/workflows/code-quality-check.yml` — `mvn test -Dspring.profiles.active=test` |
| **프론트 Jest (유틸·훅)** | `frontend/package.json` — `npm test` / `craco test` (전화: `koreanMobilePhone`, `useConsultationLogLocalAutosave` 등 **인접 모듈 패턴** 재사용) |
| **E2E (기존 스모크 패턴)** | `tests/e2e/playwright.config.ts` + `npx playwright test` (`tests/e2e/` CWD) |
| **E2E 워크플로 예시 (신규 스모크 시)** | `.github/workflows/e2e-consultation-log-smoke.yml`, `.github/workflows/e2e-erp-smoke.yml`, `.github/workflows/e2e-trinity-build-smoke.yml` — **paths 필터**에 `tests/e2e/tests/**/phone-*.spec.ts`·관련 `frontend/.../TabletRegister.js`·`UserService` 등 **추가**하는 형태로 **전용 smokes** 추가 검토 |
| **정적/품질** | `config/shell-scripts/check-hardcode.sh` (또는 리포지토리의 `scripts/.../check-*.sh`) — 전화 **하드코딩** 방지에 **선택** 연계 |
| **Secrets** | E2E 자격은 GitHub **Secrets** — 스킬 `core-solution-testing`의 `E2E_*` / `X-Tenant-ID` **평문 워크플로 금지** |

**권장 순서 (팀):** P1 머지 → 단위/통합 커밋 → E2E **스모크 1~2개** (중복 + OAuth/Tablet 회귀) → 정책 TBD 반영 시 **E2E-PV-06** assert 갱신.

---

## 7. 추적·완료 정의

- [ ] `PHONE_VERIFICATION_POLICY` **§4·§3 테넌트 간** 결정이 테스트 기대값에 반영됨
- [ ] P1 `UserService` **단일 진입**에 대한 **단위·중복 API 통합** 테스트 통과
- [ ] E2E: §2.1~2.2 핵심 + §3 회귀 + §5 S2·S5 최소
- [ ] CI: `code-quality-check` + (선택) **전용 E2E workflow** paths 트리거

---

## 8. Wave 6 (문서 전용)

**Wave 6:** 관리자 영역 E2E-PV-03~05의 단계·모킹 API·라우트 인벤토리·CI 게이트·셀렉터 표는 [PHONE_VERIFICATION_ADMIN_E2E_SCENARIOS.md](./PHONE_VERIFICATION_ADMIN_E2E_SCENARIOS.md)에 정리했다. **관리자 E2E는 시드 계정·인증·테넌트 헤더 주입 방식이 팀 합의된 뒤 자동화**하는 것을 권장한다.

---

**E2E 보강 2026-04-23** — `tests/e2e/tests/register.spec.ts` 휴대폰 무효·제출 회귀.

| ID | 내용 |
|----|------|
| E2E-PV-R01 | 무효 번호(`12345` 등) → **중복확인** 클릭 시 `GET …/duplicate-check/phone` **미호출**, 중복·사용가능 `small` 미표시, 경고 토스트(무효 안내) |
| E2E-PV-R02 | 무효 번호(`01012`)로 필수·동의 충족 후 **회원가입** 제출 → 휴대폰 그룹 `span.mg-v2-error-text`에 `INVALID_PHONE` 문구(카피 동일) |

---

**문서 끝.**
