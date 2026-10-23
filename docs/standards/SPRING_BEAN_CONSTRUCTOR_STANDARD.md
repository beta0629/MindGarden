# Spring Bean 생성자 표준

**문서 유형**: 백엔드 운영 보안 표준 · SSOT
**버전**: 1.0.0
**최종 갱신**: 2026-06-12
**상태**: 정착 (PR #227 cascade fix 회수)
**적용 범위**: `src/main/java/**` Spring Bean 전체 (`@Service`/`@Component`/`@Repository`/`@Controller` 등)

---

## 0. 요약

- **단일 생성자**: Spring 4.3+ 자동 주입 — `@Autowired` 생략 가능. (Lombok `@RequiredArgsConstructor` 단독 사용 시 동일.)
- **다중 생성자**: production 진입점 생성자에 **`@Autowired` 명시 필수**. 명시 누락 시 Spring 은 default 생성자(`<init>()`)로 fallback 시도하다가 `NoSuchMethodException` 으로 ApplicationContext 로딩이 실패하고 후속 컨텍스트 의존 테스트가 cascade skip 된다.
- **테스트 보조 생성자**는 패키지 가시성(또는 protected) 으로 유지하고, production 생성자에는 절대 `@Autowired` 를 빠뜨리지 않는다.
- **PR 리뷰 체크**: production Bean 의 생성자가 2개 이상이면 reviewer 가 `@Autowired` 위치를 반드시 확인.
- **CI 검사**: 현재 SpotBugs 빌트인 룰로는 자동 검출이 어려우므로 PR 리뷰 체크리스트 + 스모크 빌드 (`mvn -DskipTests=false test -Dtest=…SmokeTest`) 로 회귀를 차단한다 (§4 참조).

---

## 1. 배경 (PR #227 cascade fix)

2026-06-12 PR sequential 4차에서 `SmsGatewayServiceImpl` 가 NCP SENS 정식 호출 구현으로 진화하며 **테스트 전용 RestTemplate 주입 보조 생성자**가 추가되었다. 두 생성자 모두 `@Autowired` 미지정 상태였고, Spring `SimpleInstantiationStrategy` 는 다중 생성자 상황에서 default 생성자를 찾으려다 `NoSuchMethodException: SmsGatewayServiceImpl.<init>()` 을 던졌다.

### 1.1 영향 범위

- `PsychAssessmentExtractionEnqueueAfterCommitTest` 첫 컨텍스트 로딩 실패.
- Spring 의 `ApplicationContext failure threshold (1) exceeded: skipping repeated attempt` 보호 로직이 **후속 100+개 통합/단위 테스트를 자동 skip** → 단위 테스트 job FAIL.
- 통합 테스트 job 도 동일 cause 로 cascade fail 가능성.

### 1.2 수정 (참고)

PR #227 cascade fix 커밋 (`c12fba39d` — `fix(sms): SmsGatewayServiceImpl 다중 생성자 @Autowired 명시 — ApplicationContext 로딩 cascade fail 해소`) 에서 production 진입점 `public SmsGatewayServiceImpl(Environment)` 에 `@Autowired` 를 명시하여 진입점을 고정. 테스트 보조 `SmsGatewayServiceImpl(Environment, RestTemplate)` 는 패키지 가시성을 그대로 둔다.

수정 후: ApplicationContext cascade fail 0건 (100+개 → 0개), `mvn test` 결과 2205 / 본 PR 범위 내 회귀 0.

---

## 2. 표준 정책

### 2.1 단일 생성자 — `@Autowired` 생략 가능

Spring 4.3+ 부터 단일 생성자는 자동으로 주입 대상으로 picking 된다. Lombok `@RequiredArgsConstructor` 가 단일 생성자를 생성하는 경우 동일.

```java
@Service
public class FooServiceImpl implements FooService {

    private final BarRepository barRepository;

    public FooServiceImpl(BarRepository barRepository) {
        this.barRepository = barRepository;
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class FooServiceImpl implements FooService {
    private final BarRepository barRepository;
}
```

> 이 두 패턴은 본 표준의 기본 형태. 추가 작업 불필요.

### 2.2 다중 생성자 — production 생성자에 `@Autowired` 명시 필수

production 운영 DI 진입점 생성자에 `@Autowired` 를 **반드시** 명시한다. 보조 생성자는 패키지 가시성(또는 protected) 로 유지하고 `@Autowired` 를 붙이지 않는다.

```java
@Service
public class FooServiceImpl implements FooService {

    private final Environment environment;
    private final RestTemplate restTemplate;

    /** Spring DI 운영용 생성자 — 다중 생성자 시 명시 필수. */
    @Autowired
    public FooServiceImpl(Environment environment) {
        this(environment, buildDefaultRestTemplate());
    }

    /** 테스트 전용 — RestTemplate 주입 패키지 가시성 보조 생성자. */
    FooServiceImpl(Environment environment, RestTemplate restTemplate) {
        this.environment = environment;
        this.restTemplate = restTemplate;
    }
}
```

요점:

1. **production 진입점에 `@Autowired`** — 이게 빠지면 본 표준 위반 + cascade fail 위험.
2. **보조 생성자는 비-public** (`package-private` 또는 `protected`). 외부 호출을 막아 운영 코드가 잘못된 진입점을 쓰지 않도록 한다.
3. **public 생성자가 2개 이상 필요한 경우** 는 거의 없으니, 그렇게 만든 PR 은 리뷰에서 설계 재검토를 요구한다.

### 2.3 Lombok `@RequiredArgsConstructor` + 추가 보조 생성자

`@RequiredArgsConstructor` 가 만든 생성자에 더해 별도 보조 생성자를 직접 추가하면 **다중 생성자**가 된다. 이때:

- Lombok 측은 `@Autowired` 를 자동으로 붙이지 않는다.
- 따라서 `@RequiredArgsConstructor(onConstructor_ = @Autowired)` 를 사용하거나, Lombok 을 제거하고 직접 `@Autowired` 명시 생성자를 작성한다. 본 프로젝트는 후자(직접 작성)를 권장한다 — Lombok `onConstructor_` 는 Java 17 + Lombok 1.18.x 환경에서도 IDE 인식이 불완전한 경우가 있다.

```java
@Service
public class FooServiceImpl implements FooService {

    private final Environment environment;
    private final RestTemplate restTemplate;

    @Autowired
    public FooServiceImpl(Environment environment) {
        this(environment, buildDefaultRestTemplate());
    }

    FooServiceImpl(Environment environment, RestTemplate restTemplate) {
        this.environment = environment;
        this.restTemplate = restTemplate;
    }
}
```

### 2.4 setter / field 주입은 신규 코드에서 금지

본 표준은 **생성자 주입만** 허용한다. 신규 코드에서 `@Autowired` 필드 주입이나 setter 주입은 금지. (이미 존재하는 레거시는 점진 마이그레이션 대상이며 본 표준의 cascade 정책 대상은 아님.)

---

## 3. 예시·반례

### 3.1 정상 — production 생성자 `@Autowired` 명시

PR #227 cascade fix 후 정착된 형태.

```java
// src/main/java/com/coresolution/consultation/service/impl/SmsGatewayServiceImpl.java
@Service
public class SmsGatewayServiceImpl implements SmsGatewayService {

    private final Environment environment;
    private final RestTemplate restTemplate;

    @Autowired
    public SmsGatewayServiceImpl(Environment environment) {
        this(environment, buildDefaultRestTemplate());
    }

    SmsGatewayServiceImpl(Environment environment, RestTemplate restTemplate) {
        this.environment = environment;
        this.restTemplate = restTemplate;
    }
}
```

### 3.2 반례 — PR #227 회귀 패턴 (수정 전)

```java
// 두 생성자 모두 @Autowired 미지정 → ApplicationContext 로딩 실패.
@Service
public class SmsGatewayServiceImpl implements SmsGatewayService {

    public SmsGatewayServiceImpl(Environment environment) {
        this(environment, buildDefaultRestTemplate());
    }

    SmsGatewayServiceImpl(Environment environment, RestTemplate restTemplate) {
        // ...
    }
}
```

증상:

```text
NoSuchMethodException: com.coresolution.consultation.service.impl.SmsGatewayServiceImpl.<init>()
... (ApplicationContext failure threshold (1) exceeded: skipping repeated attempt) × 100+ tests
```

### 3.3 반례 — 보조 생성자에 `@Autowired` 를 잘못 붙임

```java
// 잘못된 진입점 — Spring 이 RestTemplate Bean 을 찾지 못해 NoSuchBeanDefinitionException.
@Service
public class FooServiceImpl implements FooService {

    public FooServiceImpl(Environment environment) {
        this(environment, buildDefaultRestTemplate());
    }

    @Autowired // ❌ 보조 생성자에 명시 — RestTemplate Bean 미등록 시 실패
    FooServiceImpl(Environment environment, RestTemplate restTemplate) {
        // ...
    }
}
```

`@Autowired` 가 단 하나만 붙어 있더라도, 그 생성자가 **테스트 전용 보조** 라면 운영에서는 잘못된 진입점이 된다. 진입점은 항상 production 생성자.

### 3.4 반례 — `@RequiredArgsConstructor` + 직접 보조 생성자

```java
@Service
@RequiredArgsConstructor // public FooServiceImpl(BarRepository) 자동 생성
public class FooServiceImpl implements FooService {

    private final BarRepository barRepository;

    // 이 보조 생성자가 추가되는 순간 다중 생성자 — Lombok 생성자에 @Autowired 자동 부여 없음.
    FooServiceImpl(BarRepository barRepository, MockClock clock) {
        this.barRepository = barRepository;
        // ...
    }
}
```

→ `@RequiredArgsConstructor(onConstructor_ = @Autowired)` 로 바꾸거나, Lombok 을 제거하고 §2.3 예시처럼 직접 작성한다.

---

## 4. 검증·CI

### 4.1 자동 검출 가능 여부

- **Checkstyle (현재 `checkstyle.xml`)**: 다중 생성자 + `@Autowired` 누락 패턴을 직접 표현하는 빌트인 모듈은 없다. 사용자 정의 `RegexpSingleline` 또는 외부 모듈로 일부 패턴 검출이 가능하지만 false-positive 가 많다.
- **SpotBugs (현재 `spotbugs-include.xml`)**: 본 패턴 전용 룰 없음. (SpotBugs 는 런타임 동작 분석 중심.)
- **결론 — 정적 분석으로는 100% 차단 어렵다.** 따라서 본 표준은 **PR 리뷰 체크리스트 + 컨텍스트 스모크 테스트** 의 2단계로 차단한다. 향후 Spring 자체의 `@Autowired` 미지정 다중 생성자 경고를 INFO → WARN 로 격상하는 옵션(`spring.main.lazy-initialization=false` 외 별도 startup analyzer) 이 도입되면 본 표준 §4.3 으로 흡수한다 (placeholder).

### 4.2 PR 리뷰 체크리스트 (필수)

production `@Service`/`@Component`/`@Repository`/`@Controller` 클래스에 변경이 있는 PR 은 reviewer 가 다음을 확인한다.

- [ ] 클래스에 생성자가 **2개 이상**인가?
  - [ ] 그렇다면 production 진입점 생성자에 `@Autowired` 가 명시되어 있는가?
  - [ ] 보조 생성자는 패키지 가시성 또는 `protected` 인가?
  - [ ] 보조 생성자에 잘못 `@Autowired` 가 붙어 있지 않은가?
- [ ] Lombok `@RequiredArgsConstructor` 를 쓰면서 추가 생성자를 직접 작성했는가?
  - [ ] 그렇다면 `onConstructor_ = @Autowired` 또는 직접 `@Autowired` 명시로 회귀 차단했는가?
- [ ] PR description 에 다중 생성자 추가 사실이 명시되어 있는가? (cascade 회귀 위험 알림)

### 4.3 컨텍스트 스모크 테스트 (권장)

다중 생성자 변경이 포함된 PR 은 최소 1개의 ApplicationContext 로딩 IT 를 실행해 cascade fail 을 즉시 검출한다.

```bash
# 변경 클래스가 SmsGatewayServiceImpl 인 경우 예시
mvn -B test -Dtest='Smoke*Test,*ApplicationContext*Test' -DfailIfNoTests=false
```

CI 의 `code-quality-check.yml` 에서 단위 테스트 단계가 실패하면 cascade 패턴 가능성을 의심하고, ApplicationContext failure 로그 (`failure threshold (1) exceeded`) 를 grep 한다.

### 4.4 향후 개선 (TBD)

- Spring `BeanInstantiationException` 발생 시 cascade skip 대신 즉시 fail-fast 정책으로 변경 검토 (`spring.test.context.cache.maxSize=0` 등 옵션 평가).
- ArchUnit 또는 사용자 정의 정적 분석으로 production Bean 의 다중 생성자 + `@Autowired` 미지정 패턴 검출 — Phase 2 후속 작업으로 이관 (B5 후속 항목).

> 본 절은 짝꿍 ⑬a (core-coder) 의 SpotBugs/Checkstyle 검출 룰 가능성 조사 결과를 회수하면 본 문서에 인용하거나 본 절을 갱신한다.

---

## 5. 마이그레이션 가이드

### 5.1 기존 다중 생성자 Bean 식별

```bash
# 다중 생성자가 있는 @Service/@Component 클래스 후보 스캔
rg -l --type java \
   '@(Service|Component|Repository|Controller|RestController)' \
   src/main/java | \
xargs -I{} sh -c 'rg -c "public\s+\w+\s*\(" "{}" | awk -F: "\$2 >= 2 {print \$1}"'
```

위 결과에 나온 후보를 sub-agent (`explore`) 가 대상화해 분석한다. 같은 패턴을 보이는 후보 우선 순위:

1. `@Service` Bean 중 테스트 전용 보조 생성자가 추가된 케이스 (PR #227 직접 회귀 패턴).
2. `@RequiredArgsConstructor` 와 직접 작성 보조 생성자가 공존하는 케이스.
3. `@Component` 중 `RestTemplate`/`Clock`/`Random` 등 테스트 mocking 대상이 추가된 케이스.

### 5.2 마이그레이션 절차

각 후보 Bean 에 대해:

1. production 진입점 생성자에 `@Autowired` 명시 + JavaDoc 추가 (cascade 회귀 차단 사유 명시 — 본 표준 §1 인용).
2. 보조 생성자가 `public` 이면 패키지 가시성으로 강등.
3. ApplicationContext 로딩 IT 1개를 로컬에서 실행하여 fail 0 확인.
4. PR description 에 본 표준(`docs/standards/SPRING_BEAN_CONSTRUCTOR_STANDARD.md`) 링크 + PR #227 cascade fix 인용.

### 5.3 주의사항

- **production 운영 코드가 보조 생성자를 직접 호출하지 않도록** 한다. (production 호출처는 항상 진입점.)
- **테스트 코드가 보조 생성자를 호출** 할 때, 같은 패키지(`src/test/java/.../service/impl/`) 에 위치시켜 패키지 가시성 진입을 보장한다. 다른 패키지에서 호출이 필요하면 `@VisibleForTesting` 주석을 추가하고 본 표준 §3.3 반례를 인용해 review.
- **Lombok `onConstructor_`** 는 Eclipse / IntelliJ Lombok 플러그인 버전에 따라 빨간 줄 문제가 발생할 수 있다. 우선은 직접 `@Autowired` 명시(§2.3) 를 권장.

---

## 6. 참조

- **PR #227 cascade fix** — [#227](https://github.com/beta0629/MindGarden/pull/227) `c12fba39d` `fix(sms): SmsGatewayServiceImpl 다중 생성자 @Autowired 명시 — ApplicationContext 로딩 cascade fail 해소`.
- **표준화 v2 로드맵** — [`docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md`](../project-management/2026-06-11/STANDARDIZATION_ROADMAP.md) §B5 / §5.2 / §부록 B.1.
- **Spring 공식 — Constructor-based Dependency Injection** — <https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html#beans-constructor-injection>.
- **Spring 4.3+ Single Constructor Implicit Autowiring** — <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/annotation/Autowired.html> (Class-level 설명: "As of Spring Framework 4.3, an `@Autowired` annotation on such a constructor is no longer necessary if the target bean only defines one constructor to begin with.").
- **백엔드 코딩 표준** — [`BACKEND_CODING_STANDARD.md`](./BACKEND_CODING_STANDARD.md) (계층 분리 + 생성자 주입 원칙).
- **테스트 격리 표준 (예정)** — `TEST_ISOLATION_STANDARD.md` (H2 / Phase 3 도입 예정).
- **표준 문서 색인** — [`README.md`](./README.md).

---

## 부록 A. 변경 이력

| 버전 | 날짜 | 변경 |
|---|---|---|
| 1.0.0 | 2026-06-12 | 신규 작성 (PR #227 cascade fix 회수, 표준화 v2 §B5). |

**문서 끝.**
