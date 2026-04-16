# Flyway 이중 트랙: Core(Maven) vs Ops(Gradle)

이 저장소에는 **서로 다른 애플리케이션**이 각각 `classpath:db/migration` 기준으로 Flyway 마이그레이션을 둡니다. 경로·빌드 도구·대상 DB가 다르므로, **동일 데이터베이스에 두 트랙을 함께 적용할지**는 반드시 의도적으로 결정해야 합니다.

## 두 경로 요약

| 구분 | 마이그레이션 디렉터리 | 빌드·실행 단서 |
|------|------------------------|----------------|
| **Core** (통합 상담·코어 백엔드) | [`src/main/resources/db/migration/`](../../src/main/resources/db/migration/) | 루트 [`pom.xml`](../../pom.xml) 기반 Maven, Spring Boot 앱 기동 시 Flyway 실행(테스트·프로파일 설정은 별도 YAML 참고) |
| **Ops** (Trinity Ops 백엔드) | [`backend-ops/src/main/resources/db/migration/`](../../backend-ops/src/main/resources/db/migration/) | [`backend-ops/build.gradle.kts`](../../backend-ops/build.gradle.kts) 기반 Gradle, `flyway-core` / `flyway-mysql` 의존성 |

## 리스크

| 항목 | 설명 |
|------|------|
| **`flyway_schema_history` 단일 테이블** | 같은 DB에 연결하면 Core와 Ops가 **동일한 이력 테이블**을 공유합니다. |
| **버전 번호 충돌 (예: V1~V4)** | Core 쪽에도 `V1__…` ~ `V4__…` 형태의 스크립트가 있고, Ops에도 `V1`~`V4` 스크립트가 있습니다. **버전 문자열이 겹치면** Flyway가 이미 적용된 것으로 보거나, 서로 다른 내용이면 **체크섬/순서 오류**로 기동이 실패할 수 있습니다. |
| **DB 엔진·문법 정합** | Core는 기본 설정이 MySQL 계열 JDBC를 전제로 한 구성입니다. Ops 예시 환경에서는 개발·운영에 따라 MySQL vs PostgreSQL 등 **연결 URL이 다를 수** 있으므로, Ops DDL은 **실제로 붙이는 엔진**에 맞는 문법·타입을 써야 합니다. 한 엔진용 스크립트를 다른 엔진 DB에 그대로 적용하면 실패하거나 스키마가 어긋날 수 있습니다. |

## 권장

- **Ops 전용 DB**를 두고, 운영 예시처럼 **PostgreSQL 등 목표 엔진에 맞는 인스턴스**에만 Ops 마이그레이션을 적용하는 편이 안전합니다.
- Core 개발용 DB와 Ops를 **같은 호스트명·스키마로 쓸지**는 [`backend-ops/env.dev.example`](../../backend-ops/env.dev.example)과 [`backend-ops/env.production.example`](../../backend-ops/env.production.example)의 **변수 의미(어떤 DB에 붙는지)**만 참고해 팀에서 정합을 맞추고, 예시 파일에 적힌 값·비밀은 **실제 운영 값으로 가정하지 말 것**입니다.

## 관련 파일 (상대 경로, 비밀 없음)

- [`pom.xml`](../../pom.xml) — Core Maven 의존성(Flyway 등)
- [`backend-ops/build.gradle.kts`](../../backend-ops/build.gradle.kts) — Ops Gradle 의존성
- [`backend-ops/env.dev.example`](../../backend-ops/env.dev.example) — 개발 DB 등 환경 변수 예시(내용은 민감·비밀일 수 있으므로 저장소 외부에 복사해 사용)
- [`backend-ops/env.production.example`](../../backend-ops/env.production.example) — 운영 DB URL 등 예시(플레이스홀더 위주)

## 결론

Core와 Ops는 **서로 다른 마이그레이션 세트**이지만, 같은 DB·같은 `flyway_schema_history`에 양쪽을 붙이면 **버전 번호 충돌과 엔진 불일치**가 현실적인 문제입니다. **Ops는 전용 DB + 대상 엔진에 맞는 DDL**로 운영하고, **개발·스테이징에서도** 예시 env가 가리키는 DB가 의도한 대상인지 확인한 뒤 적용하는 것을 권장합니다.
