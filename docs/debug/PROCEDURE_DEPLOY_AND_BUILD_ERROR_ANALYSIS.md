# 프로시저 배포(SCP) 및 애플리케이션 빌드(ANTLR) 오류 분석

**문서 유형**: 디버그·원인 분석  
**대상**: (1) SCP 업로드 단계 exit 255, (2) 애플리케이션 기동 단계 exit 1 (ANTLR 버전 불일치)  
**코드 수정**: 하지 않음. 분석·수정 제안만 문서에 기록.

---

## 개요

- **1번 오류**: CI(GitHub Actions)에서 표준화된 프로시저 배포 시 `scp`/`ssh` 호출 후 "Host key verification failed.", "scp: Connection closed" 발생 → **exit code 255**.
- **2번 오류**: Flyway·Hibernate 기동 후 ANTLR Tool 4.10.1 vs Runtime 4.13.0 불일치 메시지 반복 → **exit code 1**.

아래에서 각각 증상·원인·대응 옵션을 정리한다. 실제 호스트명·키 값·시크릿은 문서에 기재하지 않는다.

### 사용자 인식 vs 실제 원인 (exit 255)

- **사용자 인식**: "프로시져 빌드 오류"로 보일 수 있음 (메시지: "UpdateConsultantPerformance_deploy.sql 업로드 완료" → "📥 서버에서 프로시저 배포 중..." 후 실패).
- **실제 원인**: **exit 255는 프로시저 SQL 빌드 오류가 아님.** 프로시저 파일 업로드(SCP)까지는 성공하고, 그 다음 단계인 **서버에 SSH로 접속해 배포하는 구간**에서 **SSH 호스트 키 검증 실패(Host key verification failed.)**가 발생한 것이다. 즉, CI 러너의 `known_hosts`에 배포 대상 서버가 없어 `scp`/`ssh`가 연결을 거부한 결과이다.

---

## 1. SCP/호스트 키 실패 (exit 255)

### 1.1 증상

- 여러 `*_deploy.sql` 파일에 대해 "업로드 완료" 메시지 후 곧바로 다음 오류 발생:
  - `Host key verification failed.`
  - `scp: Connection closed`
- 결과: **exit code 255** (서버에서 프로시저 배포 단계 실패).

### 1.2 원인 요약

- **CI 러너(ubuntu-latest)의 `~/.ssh/known_hosts`에 배포 대상 서버의 호스트 키가 등록되어 있지 않음.**
- GitHub Actions 워크플로에는 SSH 키 설정 단계나 `known_hosts` 추가 단계가 없음.
- `scp`/`ssh` 호출 시 기본 동작(`StrictHostKeyChecking=yes`)으로 인해, 알 수 없는 호스트에 대해 연결이 거부됨.

### 1.3 확인한 위치

| 구분 | 경로 | 내용 |
|------|------|------|
| 워크플로(개발) | `.github/workflows/deploy-procedures-dev.yml` | `DEV_SERVER_HOST`, `DEV_SERVER_USER` 등 env만 설정, SSH 키/known_hosts 없음 |
| 워크플로(운영) | `.github/workflows/deploy-procedures-prod.yml` | 동일, `PROD_*` 시크릿만 사용 |
| 배포 스크립트 | `scripts/automation/deployment/deploy-standardized-procedures.sh` | 65행: `scp "$file" "$SERVER_USER@$SERVER:..."`, 76행: `ssh "$SERVER_USER@$SERVER" ...` — 호스트 키/StrictHostKeyChecking 관련 옵션 없음 |

### 1.4 CI/운영 대응 옵션

아래는 **옵션 정리**이며, 보안상 실제 호스트명·키 값·비밀번호는 문서에 넣지 않는다.

#### 옵션 A: 워크플로에서 `known_hosts` 추가 후 배포

- 배포 스텝 **이전**에 서버 호스트 키를 `~/.ssh/known_hosts`에 추가.
- 호스트 키는 사전에 서버에서 수출하거나, 재사용 가능한 공개값을 시크릿으로 저장한 뒤 사용.
- 예시(개념):
  - `ssh-keyscan -H <대상호스트> >> ~/.ssh/known_hosts` (호스트는 시크릿 또는 고정값).
  - 또는 시크릿 `SSH_KNOWN_HOSTS`에 한 줄(호스트 + 타입 + 키)을 넣어 두고 `echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts`.
- **장점**: 서버 키 검증 유지. **주의**: `ssh-keyscan` 출력을 그대로 신뢰하면 첫 연결 시 MITM 위험 있음 → 가능하면 검증된 한 줄을 시크릿으로 두는 방식 권장.

#### 옵션 B: `SSH_KNOWN_HOSTS` 시크릿 사용

- GitHub 리포지토리 시크릿에 `SSH_KNOWN_HOSTS` 생성.
- 값: 해당 서버에 대한 `known_hosts` 한 줄(호스트명, 키 타입, 공개키).
- 워크플로에서:
  - `mkdir -p ~/.ssh`
  - `echo "${{ secrets.SSH_KNOWN_HOSTS }}" >> ~/.ssh/known_hosts`
  - 그 다음 기존 배포 스크립트 실행.
- **장점**: 호스트 키 검증 유지, 키 값은 시크릿으로 관리.

#### 옵션 C: `scp`/`ssh` 호출 시 옵션으로 호스트 키 검증 완화

- 스크립트 또는 워크플로에서 `scp`/`ssh` 호출 시 다음 추가:
  - `-o StrictHostKeyChecking=no` 또는
  - `-o UserKnownHostsFile=/dev/null` (known_hosts 미사용).
- **보안 주의**: 알 수 없는 호스트도 수용하므로 **MITM(중간자 공격) 위험**이 있음. CI 전용·내부 서버에만 제한하고, 가능하면 옵션 A/B로 실제 known_hosts를 두는 편이 안전함.

#### 권장 조합

- **권장**: 옵션 B(시크릿에 `SSH_KNOWN_HOSTS` 저장) + 필요 시 옵션 A(스텝에서 `known_hosts`에 추가).  
- **최소 변경**: 옵션 C는 "임시 우회"로만 사용하고, 원인 제거를 위해 추후 옵션 A 또는 B 도입.

#### 수정 제안 요약 (exit 255 해결)

| 우선순위 | 수정 위치 | 내용 |
|----------|-----------|------|
| **A (권장)** | 워크플로 | `ssh-keyscan -H $DEV_SERVER_HOST >> ~/.ssh/known_hosts` 또는 리포지토리 시크릿 `SSH_KNOWN_HOSTS`에 대상 서버의 known_hosts 한 줄을 넣고, 배포 스텝 **이전**에 `echo "${{ secrets.SSH_KNOWN_HOSTS }}" >> ~/.ssh/known_hosts` 실행. (`.github/workflows/deploy-procedures-dev.yml` 등에 배포 전 단계 추가.) |
| **B (선택)** | 배포 스크립트 | `scp`/`ssh` 호출 시 `-o StrictHostKeyChecking=no` 등 옵션 추가 시 호스트 키 검증을 건너뜀. 보안상 가능하면 A 방식(known_hosts 추가)을 권장하고, B는 임시 우회용으로만 사용. |

---

## 2. ANTLR/빌드 실패 (exit 1)

### 2.1 증상

- Flyway 마이그레이션 완료, Hibernate 6.4.0, MySQL8Dialect deprecated 경고 등 정상 로그 후,
- **"ANTLR Tool version 4.10.1 used for code generation does not match the current runtime version 4.13.0"** (및 ANTLR Runtime 4.10.1 vs 4.13.0) 경고 반복.
- 최종: **Error: Process completed with exit code 1.**

### 2.2 원인 요약

- **직접 원인**: ANTLR **코드 생성 버전(4.10.1)** 과 **런타임 버전(4.13.0)** 이 불일치하여, Spring Data JPA 내부 생성 클래스(예: `HqlLexer`)의 `RuntimeMetaData.checkVersion()` 검사에서 실패하고 프로세스가 종료(exit 1)한 것으로 판단됨.
- **구조적 원인**:
  - 프로젝트는 **Hibernate 6.4.0.Final**을 명시적으로 사용하며, `hibernate-core`가 **antlr4-runtime 4.13.0**을 transitive로 끌어옴.
  - **Spring Boot 3.2.0**이 끌어오는 **Spring Data JPA 3.2.0**은 ANTLR **4.10.1** 기반으로 빌드되어, JAR 내부 생성 클래스에 4.10.1이 하드코딩됨.
  - Maven은 의존성 충돌 시 한 버전만 선택하며, 현재 트리에서는 **4.13.0**이 선택되고 4.10.1은 "omitted for conflict". 따라서 **런타임 클래스패스에는 4.13.0만** 올라가고, Spring Data JPA의 생성 코드(4.10.1 기대)가 4.13.0과 맞지 않아 버전 체크에서 실패함.

### 2.3 의존성 정리 (의존성 트리 관점)

| 구분 | 의존성 | 가져오는 ANTLR 버전 | 비고 |
|------|--------|----------------------|------|
| 프로젝트 직접 의존 | `org.hibernate.orm:hibernate-core:6.4.0.Final` | **antlr4-runtime 4.13.0** | 최종 선택됨(compile) |
| Spring Boot 3.2.0 경유 | `spring-boot-starter-data-jpa` → `spring-data-jpa` | **antlr4-runtime 4.10.1** | “omitted for conflict with 4.13.0” |
| pom.xml | antlr 직접 선언 | 없음 | transitive만 존재 |

- **4.13.0을 끌어오는 쪽**: `hibernate-core:6.4.0.Final`.
- **4.10.1을 끌어오는 쪽**: Spring Data JPA 3.2.0 (Spring Boot 3.2.0이 관리).
- **실제 클래스패스**: antlr4-runtime **4.13.0** 하나만 사용. Spring Data JPA JAR 안의 생성 클래스는 4.10.1로 빌드되어 런타임 검사에서 불일치 → exit 1.

### 2.4 pom.xml에서의 대응 방안 (버전 통일·호환)

- 목표: **런타임 ANTLR 버전을 하나로 통일**하고, 가능하면 **Spring Data JPA가 기대하는 버전과 맞추거나**, Spring 쪽을 ANTLR 4.13.0에 맞는 버전으로 올리는 것.

#### 방안 1: Spring Boot 상위 버전으로 업그레이드 (권장)

- **Spring Boot 3.2.1+** (또는 3.3.x)로 올리면, Spring Data JPA가 ANTLR 4.13.0과 정렬된 버전으로 올라가고, 생성 클래스도 4.13.0 기준으로 빌드됨.
- Spring Boot 3.2.1 / Spring Data JPA 3.2.1에서 ANTLR 4.13.0 정렬 이슈가 수정된 것으로 알려져 있음 (spring-projects/spring-data-jpa#3262 등).
- **pom.xml 수정 예시**: `<parent>`의 `spring-boot-starter-parent` 버전을 `3.2.1`(또는 3.3.x)로 변경.  
- Hibernate 6.4.0.Final은 property로 유지 가능. Spring Boot 3.2.1의 dependencyManagement와 호환되는지 릴리즈 노트로 확인 권장.

#### 방안 2: dependencyManagement로 ANTLR 버전 고정

- **antlr4-runtime**을 4.13.0으로 통일하고, Spring Data JPA가 끌어오는 4.10.1을 덮어쓰기.
- **pom.xml 수정 제안**:
  - `properties`에 예: `<antlr4.version>4.13.0</antlr4.version>` 추가.
  - `dependencyManagement`(또는 `dependencies`)에 다음 추가:
    - `org.antlr:antlr4-runtime` 버전 `${antlr4.version}` (또는 `4.13.0`) 명시.
- **한계**: Spring Data JPA 3.2.0 JAR 안의 생성 클래스는 여전히 4.10.1로 컴파일되어 있어, **버전 체크 경고/실패가 그대로 발생할 수 있음**. 즉, “의존성만 4.13.0으로 맞추는 것”으로는 해결되지 않고, **방안 1(Spring Boot/Spring Data JPA 업그레이드)** 이 근본 해결에 가깝다.

#### 방안 3: ANTLR 4.10.1로 통일 시도 (비권장)

- `dependencyManagement`로 antlr4-runtime을 **4.10.1**로 고정.
- **위험**: Hibernate 6.4.0.Final이 4.13.0을 요구할 수 있어, 호환성·테스트 필요. 공식적으로는 Hibernate 6.4가 4.13.0을 사용하므로 4.10.1로 강제하는 것은 권장하지 않음.

### 2.5 대응 방안 요약

| 우선순위 | 방안 | 내용 |
|----------|------|------|
| 1 | Spring Boot 3.2.1+ 업그레이드 | Spring Data JPA가 ANTLR 4.13.0과 맞는 버전으로 올라가 생성 코드·런타임 일치. Hibernate 6.4와의 호환은 릴리즈 노트로 확인. |
| 2 | ANTLR 4.13.0 명시 | `dependencyManagement`/`properties`로 antlr4-runtime 4.13.0 명시. 단, Spring Data JPA 3.2.0 내부 생성 클래스는 4.10.1이라 exit 1 해결에는 부족할 수 있음. |
| 3 | (참고) ANTLR 4.10.1 고정 | Hibernate 6.4와의 호환 불명확, 비권장. |

- **결론**: exit 1의 직접 원인은 **ANTLR 4.10.1(코드 생성) vs 4.13.0(런타임) 불일치**이며, **Spring Boot를 3.2.1 이상으로 올려 Spring Data JPA를 ANTLR 4.13.0 정렬 버전으로 사용하는 것**을 권장한다. 그 후 필요 시 `antlr4-runtime` 버전을 property로 명시해 일관성만 유지하면 된다.

---

## (선택) 체크리스트·core-coder 전달용 태스크 요약

### SCP/호스트 키 (exit 255)

- [ ] 워크플로에 `known_hosts` 추가 단계 도입: `SSH_KNOWN_HOSTS` 시크릿 사용 또는 `ssh-keyscan`으로 대상 호스트 키를 `~/.ssh/known_hosts`에 추가.
- [ ] 또는 배포 스크립트/워크플로에서 `scp`/`ssh` 호출 시 `-o StrictHostKeyChecking=no` 등 옵션 추가 (보안 리스크 문서화·임시 조치로만 사용 권장).
- [ ] 수정 후: 해당 워크플로를 수동 실행해 프로시저 배포가 끝까지 성공하는지 확인.

**수정 후 사용자 체크리스트 (3~5줄)**

- [ ] 리포지토리 시크릿에 `SSH_KNOWN_HOSTS`가 등록되어 있는지 확인 (옵션 A/B 사용 시). 값은 대상 서버의 known_hosts 한 줄(호스트명, 키 타입, 공개키).
- [ ] 워크플로에서 known_hosts 단계 주석을 해제했는지, 또는 `ssh-keyscan`/StrictHostKeyChecking 적용이 배포 스텝 **이전**에 오는지 확인.
- [ ] GitHub Actions에서 해당 워크플로를 수동 실행(workflow_dispatch)하여 "Host key verification failed" 없이 배포가 완료되는지 확인.
- [ ] (선택) 운영 워크플로(`deploy-procedures-prod.yml`)에도 동일한 known_hosts 설정이 필요하면 적용·시크릿(`PROD` 대응) 확인.

### ANTLR/빌드 (exit 1)

- [ ] **우선**: Spring Boot 버전을 3.2.1 이상(또는 3.3.x)으로 올리고, Hibernate 6.4.0.Final과의 호환성(공식 매트릭스·릴리즈 노트) 확인.
- [ ] 선택: `pom.xml`에 `antlr4-runtime` 버전 property 및 `dependencyManagement`/`dependencies`로 4.13.0 명시.
- [ ] 수정 후: `mvn clean package` 및 애플리케이션 기동으로 ANTLR 경고/exit 1 소멸 여부 확인.

### core-coder 전달용 요약

1. **SCP**: `.github/workflows/deploy-procedures-dev.yml`, `deploy-procedures-prod.yml`에 배포 전 `known_hosts` 추가(예: `SSH_KNOWN_HOSTS` 시크릿 사용). 필요 시 `scripts/automation/deployment/deploy-standardized-procedures.sh`의 `scp`/`ssh`에 `-o StrictHostKeyChecking=...` 등 옵션 추가(보안 주의).
2. **ANTLR**: Spring Boot를 3.2.1+로 업그레이드하여 Spring Data JPA를 ANTLR 4.13.0 정렬 버전으로 사용. 필요 시 `pom.xml`에 `antlr4-runtime` 4.13.0 명시.
