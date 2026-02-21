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

테스트 전용 에이전트는 `.cursor/agents/core-tester.md`를 사용하세요.
