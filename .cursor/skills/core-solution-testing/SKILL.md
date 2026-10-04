---
name: core-solution-testing
description: Core Solution(MindGarden) 테스트 표준 요약. 단위·통합·E2E·보안 테스트 작성·실행 시 적용할 규칙과 체크리스트.
---

# Core Solution 테스트 스킬

테스트 관련 작업 시 **docs/standards/TESTING_STANDARD.md** 전체를 우선 참조하고, 아래 요약을 적용하세요.

## 테스트 피라미드

- **단위 70%**: JUnit 5 + Mockito. Service 90%+, 전체 80%+ 커버리지 목표
- **통합 20%**: MockMvc/DataJpaTest. API·DB·인증/인가 검증
- **E2E 10%**: Playwright. 주요 시나리오만

## 공통 규칙

- **Given-When-Then** 구조 유지
- **@DisplayName("한글 설명")** (JUnit) / 한글 describe·test (Playwright) 사용
- **테스트 데이터**: UUID·TestDataBuilder 등 **동적 생성**. 프로덕션 데이터·하드코딩 ID 금지
- **테스트 독립성**: 테스트 간 순서·데이터 의존 금지
- **테넌트 격리**: 멀티테넌트 시나리오는 별도 테스트로 검증

## 백엔드 (Java)

| 유형 | 어노테이션/도구 | 위치/네이밍 |
|------|-----------------|-------------|
| 단위 | @ExtendWith(MockitoExtension.class), @Mock, @InjectMocks | *Test.java |
| API 통합 | @SpringBootTest, @AutoConfigureMockMvc, MockMvc | *IntegrationTest.java |
| DB 통합 | @DataJpaTest, @AutoConfigureTestDatabase | *RepositoryTest 등 |
| 보안 | MockMvc로 SQL 인젝션/XSS/무차별대입 시나리오 | *SecurityTest 등 |

- API 호출 시: `Authorization: Bearer {token}`, `X-Tenant-ID: {tenantId}` 헤더 필수
- 인증: @BeforeEach에서 로그인 등으로 토큰 획득 후 재사용

## 프론트 / E2E

- **Jest**: `*.test.js`, `__tests__/*.test.js` (예: frontend-trinity, frontend)
- **Playwright**: `tests/e2e/playwright.config.ts`, `tests/e2e/tests/**/*.spec.ts`
- E2E: baseURL·chromium/firefox/webkit 프로젝트 설정 준수
- **폼·모달·마법사**: 필수 표시·validate(미입력 시 submit/다음·API 차단) 검증 포함. `/core-solution-frontend` 「폼·입력 validate」.

## 실행·커버리지

- 백엔드: `mvn test` — JaCoCo 리포트로 커버리지 확인
- 프론트: `npm test` / `npx jest`
- E2E: `npx playwright test` (tests/e2e에서)

## 체크리스트 (작성 후)

- [ ] TESTING_STANDARD.md 참조
- [ ] Given-When-Then, @DisplayName 적용
- [ ] 테스트 데이터 동적 생성, 프로덕션 데이터 미사용
- [ ] 통합 테스트 인증·X-Tenant-ID 포함
- [ ] 테스트 독립성·테넌트 격리 반영
- [ ] (폼·등록/수정 UI) 필수 표시·validate·미통과 시 API/다음 스텝 차단 확인

## E2E·수동 스모크용 로그인 계정 (필요 시)

**값은 저장소에 두지 않는다.** 로컬 `.env`(커밋 금지) 또는 비밀 저장소에서 주입하고, CI는 GitHub Secrets로만 넣는다. 값은 PR 본문·이슈·채팅·로그에도 쓰지 않는다.

| 용도 | 환경변수 |
|------|----------|
| 관리자·ERP·일반 웹 E2E (이메일 로그인) | `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD` (또는 `TEST_USERNAME` / `TEST_PASSWORD`, `getE2eCredentials()` 참고) |
| 상담사 웹 E2E (`/login`) | `CONSULTANT_USERNAME` 또는 `E2E_CONSULTANT_LOGIN_ID`, `CONSULTANT_PASSWORD` 또는 `E2E_CONSULTANT_PASSWORD` |
| 내담자 웹 E2E (`/login`) | `TEST_CLIENT_USERNAME` 또는 `E2E_CLIENT_LOGIN_ID`, `TEST_CLIENT_PASSWORD` 또는 `E2E_CLIENT_PASSWORD` |

- .dev 대상 실행은 새로 만든 테스트 계정만 쓰고 PR에는 id만 적는다(AGENTS.md §3).
- 로그인 실패를 이유로 DB 비밀번호 해시를 덮어쓰지 않는다. E2E는 UI 읽기 로그인만 하고 자격 증명을 바꾸지 않는다.
- 레거시 하드코딩 계정·미설정 시 무조건 스킵 패턴은 쓰지 않는다.
- 운영(production) URL·실사용자 데이터에 테스트 계정을 쓰지 않는다.

## 서브에이전트 활용

- **테스트 작성·실행·검토**: 반드시 `core-tester` 서브에이전트를 호출한다. 직접 테스트 코드 수정 금지.
- 참조: `.cursor/agents/core-tester.md`, `docs/standards/SUBAGENT_USAGE.md`
