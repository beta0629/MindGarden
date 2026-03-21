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

- **하드코딩 금지**. 코드값·상수는 공통코드 테이블 또는 환경변수·설정에서 조회. **검색·CI 하드코딩 검사에 노출되면 운영 반영 전까지 전부 정리**한다. 게이트·범례: `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` **§17**, `/core-solution-standardization`.
- JavaDoc: 클래스·public 메서드에 `@param` `@return` `@throws`. `@author CoreSolution` 또는 `@author MindGarden`, `@since` 날짜
- 로깅: `log.info` 등 적절히 사용

## Reference

- 전체 규칙: `docs/standards/BACKEND_CODING_STANDARD.md`, `docs/standards/CODE_STYLE_STANDARD.md` (Java 섹션)
- 멀티테넌트: `/core-solution-multi-tenant`, `docs/standards/DATABASE_MIGRATION_STANDARD.md`
