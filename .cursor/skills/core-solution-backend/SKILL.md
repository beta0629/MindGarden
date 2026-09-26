---
name: core-solution-backend
description: Core Solution(MindGarden) 백엔드 Java/Spring Boot 코딩 시 적용할 룰. Controller·Service·Repository·Entity·DTO 구조, 테넌트 격리, 하드코딩 금지.
---

# Core Solution 백엔드 룰

Java/Spring Boot 코드를 작성·수정할 때 이 스킬을 적용하세요.

## When to Use

- Java 소스 수정·추가 (`src/main/java/com/coresolution/**`)
- Controller, Service, Repository, Entity, DTO 신규 작성 또는 수정
- 백엔드 API·비즈니스 로직·DB 접근 코드 작업

## Rules (필수 준수)

### 패키지·구조

- 루트 패키지: `com.coresolution.core`, `com.coresolution.consultation` 등
- 계층: `controller` → `service`(인터페이스) + `service.impl` → `repository` → `entity`, `dto`(request/response), `exception`, `config`
- Controller는 `BaseApiController` 상속. API 경로는 `@RequestMapping("/api/v1/...")` 형태로 버전 포함

### Controller

- 어노테이션: `@Slf4j` `@RestController` `@RequestMapping("/api/v1/...")` `@RequiredArgsConstructor`
- 응답: `success()`, `created()`, `noContent()` 사용. `ResponseEntity` 직접 생성 금지
- 비즈니스 로직·Repository 직접 호출 금지. Service만 호출
- 예외는 throw만 하고 GlobalExceptionHandler에 위임

### Service

- 인터페이스 + `*ServiceImpl` 구현체 분리
- `@Service` `@Transactional`. 조회 메서드는 `@Transactional(readOnly = true)`
- 의존성: 생성자 주입만 (`@RequiredArgsConstructor`). `@Autowired` 필드 주입 금지
- HTTP/ResponseEntity 반환 금지. DTO만 반환

### Entity

- `BaseEntity` 상속. **tenantId 필드 필수** (테넌트 격리). tenantId 없음 절대 허용 안 됨
- 브랜치(branch) 개념 사용 금지

### 공통

- **하드코딩 절대 금지** (지속 제거 중 · 신규 추가 금지). 코드값·상수는 공통코드 또는 env·설정. 호스트·경로·테넌트·시크릿 소스 박기 금지 (`.cursor/rules/mindgarden-no-hardcode-cloud.mdc`). 스캔 노출 시 **같은 PR에서 전부** 정리. §17·`/core-solution-standardization`.
- JavaDoc: 클래스·public 메서드에 `@param` `@return` `@throws`. `@author CoreSolution` 또는 `@author MindGarden`, `@since` 날짜
- 로깅: `log.info` 등 적절히 사용

### 화면·서버 한 세트 (필수)

같은 기능의 **API**와 **관리자·내담자 화면**은 한 변경 세트다. 서버만 고치고 끝내지 않는다.

- 배포도 한 세트다. 서버 커밋과 화면 커밋을 서로 다른 시점에 운영에 올리지 않는다. **한 커밋(또는 같은 SHA)** 에 화면과 서버가 같이 들어가야 한다.
- 프론트 전용 워크플로가 먼저 성공한 같은 SHA에서, 백엔드 배포가 그 화면을 **다른 빌드로 덮어쓰지 않게** 한다. 백엔드 워크플로의 **프론트 업로드 스킵 가드**(같은 SHA의 프론트 운영 배포가 이미 success면 업로드하지 않음)를 깨지 말 것.
- 사용자 트래픽이 받는 슬롯은 세트 배포 중 재시작으로 **로그인 이탈**을 만들지 않는다. **비활성 슬롯 헬스 통과 후**에만 전환한다.
- 분야·테넌트·호스트 하드코딩 금지. 공통코드·env.

## Reference

- 전체 규칙: `docs/standards/BACKEND_CODING_STANDARD.md`, `docs/standards/CODE_STYLE_STANDARD.md` (Java 섹션)
- 멀티테넌트: `/core-solution-multi-tenant`, `docs/standards/DATABASE_MIGRATION_STANDARD.md`
