# 백엔드: MySQL에서 H2 전용 `@Disabled` 통합 테스트 실행

기본 `mvn test`는 **저장소 루트(단일 모듈 `consultation-management-system`)** 의 `src/test/resources/application-test.yml`과 프로파일 **`test`**(각 테스트 클래스의 `@ActiveProfiles("test")`)로 **인메모리 H2**를 쓴다. 일부 통합 테스트는 MySQL 저장 프로시저·구문에 의존해 **`@Disabled`**로 두며, H2에서는 실행되지 않는다.

**Maven `-Dspring.profiles.active=test`와의 관계**: 이 저장소의 `pom.xml`은 Surefire에 `spring.profiles.active`를 테스트 JVM으로 넘기도록 설정되어 있지 않다. 따라서 **`test` 프로파일과 `application-test.yml` 로드는 `@ActiveProfiles("test")`가 담당**한다. IDE에서 VM 옵션으로 `-Dspring.profiles.active=test`를 주는 것은 선택 사항이며, CLI에서 `mvn -Dspring.profiles.active=test test`만으로 포크 JVM에 동일 프로퍼티가 보장되지는 않을 수 있다.

## 대상(현재 저장소 인벤토리)

| 클래스 | 메서드(@DisplayName 요약) | 비활성 사유 |
|--------|---------------------------|-------------|
| `ErpProcedureJournalEntryIntegrationTest` | ApplyDiscountAccounting 프로시저 실행 시 자동 분개 생성 | H2에는 MySQL PL/SQL 프로시저가 없음 — MySQL 통합·시드 환경에서 검증 |
| `StoredProcedureStandardizationIntegrationTest` | GetRefundStatistics 프로시저 … | H2에는 MySQL 저장 프로시저·구문이 없음 — MySQL 통합에서 검증 |
| `StoredProcedureStandardizationIntegrationTest` | GetConsolidatedFinancialData 프로시저 … | 동일 |

## 전제

- **MySQL** 인스턴스(스테이징·로컬 Docker 등)에 **스키마·Flyway 마이그레이션·프로시저**가 배포된 상태.
- 테스트 클래스는 **`test`** 프로파일을 사용한다(`@ActiveProfiles("test")`). 별도 `application-dev.yml` / `application-prod.yml`은 본 저장소 `src/main/resources`에 없으며(`application.yml`만 존재), 루트 `pom.xml`의 Maven 프로파일 `local`·`prod`는 **`spring.profiles.active` 속성**과 애플리케이션 기동 시나리오용이다. JUnit 통합 테스트의 설정 기준은 **`src/test/resources/application-test.yml`** 이다.

## 환경 변수로 H2 대신 MySQL 가리키기

`application-test.yml` 주석과 동일하게, **빈** `SPRING_DATASOURCE_URL`이 기본값을 덮어쓰지 않도록 주의한다.

필요 시 예시(호스트·DB명·쿼리 파라미터는 환경에 맞게 조정):

```bash
export SPRING_DATASOURCE_URL='jdbc:mysql://HOST:3306/DB_NAME?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8'
export SPRING_DATASOURCE_USERNAME='...'
export SPRING_DATASOURCE_PASSWORD='...'
export SPRING_JPA_DATABASE_PLATFORM=org.hibernate.dialect.MySQL8Dialect
export SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT=org.hibernate.dialect.MySQL8Dialect
# 스키마를 Flyway로 맞출 때
export SPRING_FLYWAY_ENABLED=true
# MySQL 프로시저 초기화가 필요할 때(application-test.yml 기본은 false)
export MINDGARDEN_PLSQL_INITIALIZER_ENABLED=true
```

IDE에서 실행할 때도 동일한 환경 변수를 테스트 실행 구성에 넣는다.

## `@Disabled` 테스트 “실행”에 대해

JUnit 5는 **`@Disabled`가 붙은 메서드를 기본 실행에서 제외**한다. MySQL을 연결해도 **주석을 제거하지 않으면 해당 케이스는 돌지 않는다.**

- **로컬·스테이징 검증용**: 해당 메서드의 `@Disabled`를 **일시적으로 제거**한 뒤 클래스만 지정해 실행하고, **커밋 전에 원복**한다.
- 예(저장소 루트에서):  
  `mvn -Dtest=StoredProcedureStandardizationIntegrationTest test`  
  `mvn -Dtest=ErpProcedureJournalEntryIntegrationTest test`  
  전체 스위트: `mvn test`

## 관련 문서

- [자동화 테스트 가이드](./AUTOMATED_TESTING_GUIDE.md) — 스크립트 기반 API/E2E
- [테스트 표준](../../standards/TESTING_STANDARD.md) — 피라미드·통합 테스트 규칙

## 검증 체크리스트

| 항목 | 확인 |
|------|------|
| 로컬(또는 대상) MySQL이 기동했고, 스키마·마이그레이션·프로시저 요구 수준에 맞는지 | ☐ |
| `SPRING_DATASOURCE_URL`·`USERNAME`·`PASSWORD` 등을 설정했고, **빈** `SPRING_DATASOURCE_URL`로 기본값을 덮어쓰지 않았는지 (`application-test.yml` 주석과 동일) | ☐ |
| Flyway·PlSql 초기화가 필요하면 `SPRING_FLYWAY_ENABLED`·`MINDGARDEN_PLSQL_INITIALIZER_ENABLED` 등을 환경에 맞게 설정했는지 | ☐ |
| 저장소 루트에서 `mvn test` 또는 `mvn -Dtest=<클래스명> test`로 실행했는지; **`test` 프로파일은 `@ActiveProfiles("test")`로 활성**되는지 확인했는지 | ☐ |
| `@Disabled`를 임시로 뺀 경우, 검증 후 **커밋 전에 원복**했는지 | ☐ |

## 주간·릴리스 전 점검(권장)

**주간** — 저장소 루트에서 전체 `mvn test`(기본은 H2·`test` 프로파일)로 회귀를 확인한다. MySQL 인스턴스와 스키마·Flyway·프로시저가 준비된 환경에서만, 위 「전제」·「환경 변수로 H2 대신 MySQL 가리키기」를 맞춘 뒤 `@Disabled`를 일시 해제하고 **클래스만 지정**해 실행한다. 명령 예는 아래와 같으며, 상세 절차는 위 「`@Disabled` 테스트 "실행"에 대해」절과 동일하다.

- `mvn -Dtest=StoredProcedureStandardizationIntegrationTest test`
- `mvn -Dtest=ErpProcedureJournalEntryIntegrationTest test`

**릴리스 전** — 저장 프로시저·ERP 분개 연동이 변경된 경우에는 본 문서 절차로 MySQL 통합을 한 번 더 돌리는 것을 권장한다.

배치 단위 스모크·회귀와의 정합은 마스터 체크리스트 [ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md — QA-01 행](../../project-management/ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md)을 참고한다.

### @Disabled 대상 상세 (Flyway·시드)

MySQL에 연결한 뒤 아래 `@Disabled` 3건을 **일시적으로 제거**해 돌릴 때는, 대상 DB가 **Flyway 마이그레이션·저장 프로시저 배포** 수준과 맞는지 확인하고, **시드·참조 ID**(테넌트·매핑 등)가 없으면 실패하거나 의미 없는 통과가 날 수 있다.

| # | 클래스 | 메서드 | 임시 활성화 시 주의 (Flyway·시드) |
|---|--------|--------|-----------------------------------|
| 1 | `ErpProcedureJournalEntryIntegrationTest` | `testApplyDiscountAccountingAutoJournalEntry` (`@DisplayName`: ApplyDiscountAccounting 프로시저 실행 시 자동 분개 생성) | **Flyway**로 최신 스키마·프로시저 일치. **`MINDGARDEN_PLSQL_INITIALIZER_ENABLED`** 등 PlSql 초기화가 필요하면 `application-test.yml`·환경 변수로 켠다. **시드**: 코드상 `testMappingId = 1L`, `test-tenant-001` 등이 DB에 존재해야 하며, 할인·분개 검증에 맞는 데이터가 있어야 한다. |
| 2 | `StoredProcedureStandardizationIntegrationTest` | `testGetRefundStatisticsWithTenantId` (GetRefundStatistics …) | **Flyway**로 프로시저·관련 객체 배포. **시드**: `TenantContextHolder`의 테넌트와 환경에 맞는 환불·세션 통계 입력이 없으면 `success=false` 등으로 끝날 수 있다. |
| 3 | `StoredProcedureStandardizationIntegrationTest` | `testGetConsolidatedFinancialDataWithTenantId` (GetConsolidatedFinancialData …) | **Flyway** 동일. **시드**: 기간·테넌트 기준 통합 재무 데이터가 없으면 검증이 약해질 수 있다. |

**실행 예(저장소 루트, Surefire `-Dtest`는 단일 테스트 클래스 단위)** — 위 환경 변수·MySQL 연결을 먼저 설정한 뒤:

1. `mvn -q -Dtest=ErpProcedureJournalEntryIntegrationTest test`
2. `mvn -q -Dtest=StoredProcedureStandardizationIntegrationTest test`

(`-q`는 로그 최소화용이며, 디버깅 시에는 생략해도 된다.)
