# MindGarden 개발 서버 기동 실패 — 심층 원인 분석

**작성일**: 2025-02-28  
**역할**: core-debugger (원인 분석·수정 제안만, 코드 수정 없음)

---

## 1. 증상 요약

- **로그**: `"✅ JWT 비밀키 검증 완료: 길이=64자"` 직후 프로세스 종료.
- **미출력**: `"Started ConsultationManagementApplication"`, `"Tomcat started on port(s)"` 없음.
- **종료**: Process exited with status 1. 헬스체크 3~6회 실패 후 워크플로 exit 1.
- **추정**: JWT 검증 직후 ~ Tomcat 기동 전 구간에서 미처리 예외 발생. 예외는 stderr에만 출력되어 제공된 로그에 없을 수 있음.

**Flyway로 기동이 막히는 경우**(예: `flyway_schema_history.success = 0`): `docs/troubleshooting/FLYWAY_REPAIR_FAILED_MIGRATION.md` 에서 repair·재적용·검증 SQL 절차를 참고.

---

## 2. 기동 순서 (코드 기준)

### 2.1 Spring Boot 기동 단계

1. **Context 생성** → 빈 생성(생성자) → **@PostConstruct** (빈별 순서 비보장) → **CommandLineRunner / ApplicationRunner** → **Embedded Tomcat 시작** → **Filter init** → "Started ..." 로그.
2. **ApplicationReadyEvent** 리스너(PlSqlInitializer, RoleTemplateInitializationConfig, PermissionInitializationConfig, FinancialCommonCodeInitializer, CodeInitializationServiceImpl, PasswordCommonCodeInitializer)는 **"Started" 이후**에 실행되므로, 이번 크래시의 1차 원인 후보에서 제외.

### 2.2 JwtSecretValidator 직후에 실행될 수 있는 @PostConstruct (순서 미보장)

| 클래스 | 역할 | TenantContextHolder / SystemConfigService 사용 |
|--------|------|-----------------------------------------------|
| `JwtSecretValidator` | JWT 비밀키 검증 | 사용 안 함 |
| `EnvironmentValidationConfig` | 운영 환경 변수 검증 (`environment.validation.enabled=true`일 때만) | 사용 안 함 |
| `PersonalDataEncryptionKeyProvider` | 개인정보 암호화 키/IV 초기화 | 사용 안 함. **비 dev/local + 키 미설정 시 IllegalStateException** |
| `AesGcmEncryptedFileStorageService` | 심리검사 PDF 암호화 키 검증 | 사용 안 함. **비 dev/local + PSYCH_DOC_KEY_B64 미설정 시 IllegalStateException** |
| `OAuth2DomainUtil` | OAuth2 도메인/서브도메인 패턴 초기화 | 사용 안 함. **잘못된 정규식 시 IllegalStateException** |
| `TimeZoneConfig` | 기본 타임존 KST 설정 | 사용 안 함 |
| `OAuth2Controller` | 로깅만 | 사용 안 함 |
| `OAuth2FactoryService` | OAuth2 서비스 등록 | 사용 안 함 |
| `AppleOAuth2ServiceImpl` / `NaverOAuth2ServiceImpl` / `GoogleOAuth2ServiceImpl` | 설정 로깅 | 사용 안 함 |

**정리**: 코드 상으로 **JwtSecretValidator 직후에 TenantContextHolder 또는 SystemConfigService를 직접 사용하는 @PostConstruct는 없음**.  
다만 **기동 시점(요청 전)에 SystemConfigService를 호출하는 다른 경로**가 있는지는 아래 2.3에서 정리.

### 2.3 기동 시점에 SystemConfigService를 호출하는 코드 경로

- **확인 결과**: `@PostConstruct`, `ApplicationRunner`, `CommandLineRunner`, `@Bean` 메서드 내부에서 **SystemConfigService.getConfigValue / getAiDefaultProvider / getApiKeyForProvider 를 호출하는 코드 경로는 없음**.
- **사용처**: `OpenAIPsychAiServiceImpl.generateKoreanReport()`, `SystemConfigController`, `GeminiModelProvider`, `OpenAIMonitoringService` 등은 모두 **HTTP 요청·스케줄·비동기 등 요청/실행 시점**에만 호출됨.
- **결론**: 현재 코드베이스만 보면 **“기동 중 Tenant ID 없음 → SystemConfigService 호출 → IllegalStateException”** 경로는 **찾지 못함**. 다만 `SystemConfigServiceImpl.getConfigValue()` 는 항상 `TenantContextHolder.getRequiredTenantId()` 를 부르므로, **앞으로 기동 시점에서 이 서비스를 호출하는 코드가 추가되면 동일 예외가 발생할 수 있음**.

---

## 3. TenantContextHolder와 SystemConfigService

- **SystemConfigServiceImpl**  
  - `getConfigValue(String)`, `getConfigValue(String, String)` 등은 내부에서 **`TenantContextHolder.getRequiredTenantId()`** 호출 (31행 등).  
  - 기동 중(HTTP 요청 없음)에는 테넌트 컨텍스트가 없으므로, 이 시점에 호출되면 **`IllegalStateException("Tenant ID is not set in current context")`** 발생 가능.
- **수정 방향(제안)**:  
  - 기동/배치 등 테넌트가 정해지지 않은 경로에서 설정이 필요하면,  
    - **호출 자체를 하지 않거나**,  
    - **TenantContextHolder.isTenantContextSet() 체크 후 미설정 시 기본값 반환/스킵**,  
    - 또는 **테넌트 무관 전역 설정 전용 API 분리** 등을 검토.

---

## 4. SystemConfig 엔티티 / 테이블

### 4.1 엔티티

- **파일**: `src/main/java/com/coresolution/consultation/entity/SystemConfig.java`
- **제약**: `config_key` 에 대해 **`unique = true` 단일 컬럼** (37행).  
  **`(tenant_id, config_key)` 복합 unique 아님**.

### 4.2 DB 스키마

- **파일**: `src/main/resources/sql/create_system_config_table.sql`
- **내용**: `config_key VARCHAR(100) NOT NULL UNIQUE` 만 존재.  
  **`tenant_id` 컬럼 없음** (엔티티에는 `tenantId` 필드 있음).
- **해석**:  
  - 실제 DB가 이 스크립트만으로 생성됐다면, **멀티테넌트로 동일 config_key 를 여러 tenant 에 저장할 때 unique 제약 위반** 가능.  
  - 별도 마이그레이션으로 `tenant_id` 를 추가했더라도, **unique 가 여전히 `config_key` 단일이면** 동일 문제.

### 4.3 수정 제안 (core-coder 전달용)

- **DB**: `system_config` 테이블에 **`(tenant_id, config_key)` 복합 UNIQUE** 로 변경하는 마이그레이션 추가 검토.  
  (기존 `config_key` 단일 UNIQUE 제거 후 복합 unique 로 대체.)
- **엔티티**: `@Table(uniqueConstraints = { @UniqueConstraint(columnNames = {"tenantId", "configKey"}) })` 등으로 **복합 unique** 로 정합성 맞출 것.

---

## 5. 원인 가설 목록 (우선순위)

### 가설 1 (높음): 비 dev/local 프로파일 + 필수 환경 변수 미설정

- **내용**: 개발 서버가 **dev/local 이 아닌 프로파일**로 기동되고, 아래 중 하나라도 미설정이면 **@PostConstruct 에서 IllegalStateException** 이 발생해 JWT 검증 직후 종료.
  - **PersonalDataEncryptionKeyProvider**: `PERSONAL_DATA_ENCRYPTION_KEY` / `PERSONAL_DATA_ENCRYPTION_KEYS`·IV 미설정.
  - **AesGcmEncryptedFileStorageService**: `PSYCH_DOC_KEY_B64` 미설정.
- **근거**:  
  - 두 클래스 모두 `@PostConstruct` 에서 `isDevOrLocalProfile()` 이 false 일 때만 위 조건 검사 후 `throw new IllegalStateException(...)`.  
  - JWT 검증 완료 로그 직후에 실행될 수 있는 대표적인 초기화 구간.
- **확인 방법**:
  - 서버의 `spring.profiles.active` 확인: `journalctl -u mindgarden-dev -n 100 --no-pager` 또는 `/var/log/mindgarden/dev.log` 에서 `active profiles` 검색.
  - stderr 로그: `tail -n 500 /var/log/mindgarden/dev-error.log` 에서 `IllegalStateException`, `PSYCH_DOC_KEY_B64`, `암호화 키` 등 검색.

### 가설 2 (높음): OAuth2 도메인 설정 오류

- **내용**: `OAuth2DomainUtil` 의 `@PostConstruct` 에서 `spring.security.oauth2.domain.subdomain-patterns` 의 **잘못된 정규식**으로 `Pattern.compile()` 실패 → **IllegalStateException**.
- **근거**: `OAuth2DomainUtil.init()` (38~55행) 에서 패턴 파싱 실패 시 `throw new IllegalStateException("OAuth2 subdomain 패턴 설정 오류: " + e.getMessage(), e)`.
- **확인 방법**:  
  - `dev-error.log` 에서 `OAuth2 subdomain 패턴 오류`, `PatternSyntaxException` 검색.  
  - `application.yml` / `application-dev.yml` 및 환경 변수에서 `spring.security.oauth2.domain.subdomain-patterns` 값 확인.

### 가설 3 (중간): EnvironmentValidationConfig (운영 검증)

- **내용**: `environment.validation.enabled=true` 인데, **운영 프로파일로 인식**되면서 JWT/암호화/DB/`PSYCH_DOC_KEY_B64` 등 검증에서 실패 → **IllegalStateException**.
- **근거**: `EnvironmentValidationConfig` 는 `@ConditionalOnProperty(name = "environment.validation.enabled", havingValue = "true", matchIfMissing = false)` 로 로드되며, `isProductionProfile()` 이 true 이면 필수 환경 변수 검사 후 실패 시 `throw new IllegalStateException(...)`.
- **확인 방법**:  
  - `environment.validation.enabled` 값과 `spring.profiles.active` 확인.  
  - `dev-error.log` 에서 `운영 환경 변수 검증`, `필수 환경 변수 누락` 검색.

### 가설 4 (중간): 포트 8080 선점 또는 Tomcat 바인딩 실패

- **내용**: Tomcat이 8080 포트를 바인딩하지 못해 기동 실패. "Started" 전에 실패하면 exit 1.
- **확인 방법**:  
  - `dev-error.log` 에서 `Address already in use`, `BindException`, `port` 검색.  
  - 서버에서 `sudo lsof -i :8080` 또는 `ss -tlnp | grep 8080` 로 선점 프로세스 확인.

### 가설 5 (낮음): Hibernate/JPA 초기화 예외

- **내용**: 엔티티 스키마 불일치, DB 연결 지연 등으로 Hibernate 초기화 중 예외.
- **확인 방법**:  
  - `dev-error.log` 에서 `Hibernate`, `SchemaManagementException`, `SQLException`, `CommunicationsException` 검색.

### 가설 6 (참고): 기동 시 SystemConfigService 호출 가능성

- **내용**: 기동 중(테넌트 컨텍스트 없음)에 **어딘가에서 SystemConfigService.getConfigValue 등 호출** → `TenantContextHolder.getRequiredTenantId()` → **IllegalStateException("Tenant ID is not set in current context")**.
- **현재 코드**: 위와 같은 **기동 시점 호출 경로는 발견되지 않음**.  
  다만 향후 스케줄러 초기화·헬스체크·Actuator 등에서 호출이 들어가면 동일 예외가 날 수 있음.
- **확인 방법**:  
  - `dev-error.log` 에서 `Tenant ID is not set in current context` 검색.  
  - 있다면 해당 스택트레이스로 호출 경로 역추적.

---

## 6. 즉시 확인할 명령/파일

배포 실패 시 **개발 서버에서 반드시 확인**할 항목.

### 6.1 로그 (stderr 우선)

- **명령**:
  ```bash
  # 최근 stderr (예외는 보통 여기)
  sudo tail -n 500 /var/log/mindgarden/dev-error.log

  # systemd 저널 (mindgarden-dev 서비스)
  sudo journalctl -u mindgarden-dev -n 300 --no-pager

  # stdout
  sudo tail -n 300 /var/log/mindgarden/dev.log
  ```
- **검색 패턴** (에디터/터미널에서):
  - `Exception`, `Error`, `Caused by`
  - `IllegalStateException`, `Tenant ID is not set`
  - `PSYCH_DOC_KEY_B64`, `암호화 키`, `OAuth2 subdomain 패턴`
  - `Address already in use`, `BindException`, `port`
  - `Started ConsultationManagementApplication` (없으면 기동 미완료)

### 6.2 환경

- **프로파일**:
  ```bash
  grep -r "spring.profiles.active\|SPRING_PROFILES_ACTIVE" /var/www/mindgarden-dev /opt/mindgarden 2>/dev/null || true
  ```
- **기동 스크립트** (실제 JVM 인자/환경 변수):
  ```bash
  cat /opt/mindgarden/start.sh
  ```

### 6.3 포트

- ```bash
  sudo ss -tlnp | grep 8080
  sudo lsof -i :8080
  ```

---

## 7. 수정 제안 (core-coder 전달용)

### 7.1 기동 시 SystemConfigService 사용 방지 (방어 코드)

- **파일**: `src/main/java/com/coresolution/consultation/service/impl/SystemConfigServiceImpl.java`
- **대상**: `getConfigValue(String)`, `getConfigValue(String, String)` 및 이들을 사용하는 `getAiDefaultProvider`, `getApiKeyForProvider` 등.
- **방향**:  
  - 기동/배치 등 테넌트가 없는 상황에서 호출되면 예외 대신 **기본값 반환**하거나,  
  - **`TenantContextHolder.isTenantContextSet()`** 로 감싼 뒤, 미설정 시 `Optional.empty()` 또는 지정 default 반환.  
  (정책에 따라 “테넌트 없음이면 호출 금지”로 두고 예외를 유지할 수도 있음. 이 경우 **호출하는 쪽을 기동 시점에서 제거**하는 방향.)

### 7.2 SystemConfig 엔티티/DB unique 정합성

- **엔티티**: `src/main/java/com/coresolution/consultation/entity/SystemConfig.java`  
  - `config_key` 단일 unique 제거, **`(tenantId, configKey)` 복합 unique** 로 변경 (`@Table(uniqueConstraints = ...)`).
- **DB**:  
  - `system_config` 에 `tenant_id` 컬럼 추가 여부 및 기존 데이터 이전 여부 확인.  
  - **unique 제약을 `(tenant_id, config_key)` 복합으로** 변경하는 마이그레이션 추가.

### 7.3 dev 서버에서 @PostConstruct 예외 회피 (선택)

- **PersonalDataEncryptionKeyProvider** / **AesGcmEncryptedFileStorageService**:  
  - 개발 서버가 항상 `dev`(또는 `local`)로 기동된다는 전제가 있으면, 현재 로직으로도 가설 1만 환경으로 해소 가능.  
  - 추가로, **실패 시 로그만 남기고 기동은 계속**하는 옵션(예: 프로파일별로 throw 대신 warn)을 검토할 수 있음 (보안 요구사항에 따라 결정).

### 7.4 로깅 보강

- **목적**: 다음 번 기동 실패 시 원인 파악을 쉽게 하기 위함.
- **위치**:  
  - 각 @PostConstruct 직전/직후에 **클래스명·단계**를 구분할 수 있는 로그 한 줄 추가 (예: `log.info("초기화 시작: {}", getClass().getSimpleName());`).  
  - 특히 `PersonalDataEncryptionKeyProvider`, `AesGcmEncryptedFileStorageService`, `OAuth2DomainUtil` 에서 **실패 시 예외 메시지와 원인 값**을 로그에 남기기.

---

## 8. 체크리스트 (수정 후 검증)

- [ ] 개발 서버에서 `dev-error.log` 에 스택트레이스 없이 기동 완료되는지 확인.
- [ ] `journalctl -u mindgarden-dev` 에 `Started ConsultationManagementApplication` 이 보이는지 확인.
- [ ] `GET /actuator/health` (또는 사용 중인 헬스 URL) 200 응답 확인.
- [ ] `spring.profiles.active` 가 dev(또는 의도한 값)인지 확인.
- [ ] (수정한 경우) SystemConfig 테넌트별 저장 시 unique 제약 위반이 나지 않는지 확인.

---

**문서 끝.**  
실제 코드 수정은 **core-coder** 서브에이전트에 위임하고, 로그/DB 확인이 필요하면 **shell** 서브에이전트로 위 명령 실행을 요청하면 됨.
