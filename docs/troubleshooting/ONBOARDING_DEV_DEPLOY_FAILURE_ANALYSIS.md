# 온보딩 개발 서버 배포 실패 — 원인 분석 및 수정 제안

**작성일**: 2026-02-28  
**역할**: core-debugger (원인 분석·수정 제안만, 코드 수정 없음)

---

## 1. 증상 요약

- **워크플로**: `.github/workflows/deploy-onboarding-dev.yml`
- **실패 스텝**: "개발 서버 서비스 재시작" — 서비스 시작 후 60초 내에 `curl http://localhost:8080/actuator/health` 성공하지 못해 `exit 1`
- **추가 정보**: Flyway 마이그레이션 상태에서 version 41~49, **version 43이 두 건**(타입 DELETE 1건, SQL 1건). CreateOrActivateTenant 프로시저 존재. error.log 약 8.9MB, sql-error.log 등 대용량 에러 로그 존재.

---

## 2. 요청 사항별 확인 결과

### 2.1 JAR 및 서비스 동일 여부

| 항목 | deploy-onboarding-dev.yml | deploy-backend-dev.yml |
|------|---------------------------|-------------------------|
| 빌드 명령 | `mvn clean package -DskipTests` | 동일 |
| JAR 파일명 | `consultation-management-system-1.0.0.jar` | 동일 |
| 업로드 경로 | `/var/www/mindgarden-dev/` | 동일 |
| systemd 서비스 | `mindgarden-dev.service` | 동일 |
| 서비스 파일 소스 | `config/systemd/mindgarden-dev.service` | 동일 |

**결론**: 두 워크플로 모두 **동일한 JAR**(consultation-management-system)를 빌드하여 **동일한 mindgarden-dev 서비스**로 배포한다.  
차이점은 **트리거 경로**뿐이다. 온보딩 워크플로는 온보딩 관련 Java/마이그레이션/테스트/워크플로 파일 변경 시, 백엔드 워크플로는 그 외 백엔드/consultation 등 변경 시 실행된다.  
한 번에 하나만 실행되므로, **마지막에 성공한 배포가 어떤 워크플로였는지**에 따라 서버의 JAR·start.sh 내용이 결정된다.

### 2.2 V20260228_001 (system_config tenant_id) 마이그레이션

- **파일 존재**: `src/main/resources/db/migration/V20260228_001__add_tenant_id_to_system_config.sql` 존재함.
- **내용**: system_config에 `tenant_id` 컬럼 추가, 기존 행 `tenant_id = ''` 처리, `config_key` 단일 UNIQUE 제거 후 `(tenant_id, config_key)` 복합 UNIQUE 추가.
- **앱 기동 시 적용 경로**: Spring Boot 기본 Flyway 위치는 `classpath:db/migration`. 해당 JAR에 리소스로 포함되면 기동 시 Flyway가 **버전 순**(V… 정렬)으로 미적용 스크립트만 실행한다.  
  `V20260228_001`는 `V20260227_004` 다음으로 정렬되므로, **현재 마이그레이션 목록에 포함되어 있고 JAR에 들어가 있으면** 기동 시 적용 대상이다.
- **트리거**: 온보딩 워크플로의 `paths`에 `src/main/resources/db/migration/V*__*.sql`가 포함되어 있으므로, **V20260228_001 추가/수정 후 push하면 온보딩 워크플로가 실행**된다.  
  단, **다른 경로만 변경**하고 마이그레이션은 건드리지 않은 push로 온보딩 워크플로가 돌았다면, 그 시점의 커밋에 V20260228_001이 포함돼 있어야 JAR에 들어간다.
- **주의**: git status 상 `V20260228_001__add_tenant_id_to_system_config.sql`가 **untracked(??)** 로 보인 경우, 해당 브랜치에 아직 커밋되지 않았을 수 있다.  
  **develop 등 배포 브랜치에 이 파일이 커밋·푸시되어 있어야** CI에서 빌드하는 JAR에 포함되고, 기동 시 Flyway가 적용할 수 있다.

**결론**:  
- V20260228_001은 **코드베이스에 있고**, 기동 시 Flyway 적용 경로(`classpath:db/migration`)에 포함된다.  
- **실제 배포되는 JAR에 포함되려면** 해당 마이그레이션 파일이 **배포 브랜치에 커밋·푸시된 상태**에서 워크플로가 돌아야 한다.  
- 과거 system_config에 tenant_id 없어 Hibernate 기동 실패했던 이슈를 막으려면, **이 마이그레이션이 적용된 JAR로 배포**되어야 하며, DB에는 한 번만 성공 적용되면 된다.

### 2.3 헬스체크 대기 시간 및 서비스 시작 대기 로직

| 항목 | deploy-onboarding-dev.yml | deploy-backend-dev.yml |
|------|---------------------------|-------------------------|
| SSH step timeout | 60s | 60s |
| command_timeout | 5m | 5m |
| 헬스체크 루프 | **최대 60초** (`for i in {1..60}`) | **최대 90초** (`for i in {1..90}`) |
| 서비스 중지 후 추가 대기 | 3초 | 5초 + DB 연결 정리 스크립트 |
| 배포 전 단계 | 백업·중지 위주 | 디스크 정리·DB 연결 정리·백업·중지 |

**결론**:  
- 온보딩 워크플로는 **헬스체크 대기 60초**, 백엔드 워크플로는 **90초**이다.  
- Flyway 마이그레이션 다수 적용·DB 부하·컴파일/초기화 지연 시 **60초로는 부족**할 수 있다.  
- 서비스 중지 후 안정화 대기·배포 전 DB 연결 정리 등은 백엔드 워크플로에만 있어, 온보딩 배포 시 **기동이 더 불안정**할 여지가 있다.

### 2.4 flyway_schema_history에 version 43이 두 종류(DELETE / SQL)인 경우

- Flyway 문서·동작상, `type` 컬럼 값으로 **SQL**, **DELETE**, **JDBC** 등이 있다.  
  **DELETE** 타입은 “이전에 적용된 마이그레이션 파일이 현재 버전(코드베이스)에 없을 때” Flyway가 기록하는 항목이다.
- **동일 version에 SQL 1건 + DELETE 1건**이 있으면:  
  - 과거에 해당 버전의 마이그레이션이 적용됐고(success=true, type=SQL),  
  - 이후 한때 그 마이그레이션 **파일이 제거된** JAR/코드로 기동되면서 Flyway가 “삭제됨”으로 기록(DELETE)한 상황으로 해석할 수 있다.
- 현재 코드베이스에는 **V43__add_is_admin_role_to_role_templates.sql** 가 존재한다.  
  따라서 **현재 JAR에는 V43이 다시 포함**되어 있고, DB에는 이미 적용된 이력(SQL) + DELETE 이력이 공존하는 상태다.
- **영향**:  
  - Flyway 버전·설정에 따라, **validate 단계에서 이력 불일치로 실패**하거나, **repair 필요**로 안내될 수 있다.  
  - **실제 기동 실패 원인**이 Flyway인지 확인하려면, 실패 시점의 로그에서 `Flyway` 예외·에러 메시지를 확인해야 한다.  
  - 일반적으로 **같은 version에 success=1인 SQL 행이 있으면** “이미 적용됨”으로 스킵하고, DELETE 행은 이력 추적용으로만 쓰이므로, **기동 자체가 반드시 실패하는 것은 아니다**.  
  - 다만 **validate-on-migrate** 등이 켜져 있고, 로컬과 다른 이력이 있으면 검증에서 실패할 수 있다.

**결론**:  
- version 43이 DELETE 1건 + SQL 1건 있는 것은 **과거에 파일 삭제/복구 이력**으로 설명 가능하다.  
- **단독 원인으로 단정하기 어렵고**, 기동 실패 로그에 Flyway 관련 예외가 있는지 확인하는 것이 필요하다.  
- 문제가 된다면 **flyway repair** 또는 수동으로 불필요한 행 정리(아래 5.3 참고)를 검토할 수 있다.

---

## 3. 가능 원인 후보 정리

1. **애플리케이션 기동 실패(Spring Boot 크래시)**  
   - system_config에 tenant_id가 없던 상태에서, tenant_id가 있는 엔티티로 Hibernate가 기동하면 스키마 불일치로 실패할 수 있음.  
   - **V20260228_001이 배포 JAR에 포함되어 있고 DB에 성공 적용되어 있으면** 이 원인은 제거된다.  
   - **포함 여부**: 배포 브랜치에 해당 마이그레이션 커밋 여부·실제 서버의 JAR/DB 적용 이력 확인 필요.

2. **Flyway schema_history 불일치**  
   - version 43의 DELETE/SQL 두 종류는 **가능한 혼선 요인**이지만, 위와 같이 단독 원인으로 단정하기 어렵다.  
   - Flyway 예외 로그 유무로 판단하는 것이 좋다.

3. **60초 안에 헬스체크에 도달하지 못함(타임아웃)**  
   - 온보딩 워크플로는 **60초**만 대기하고, 백엔드 워크플로는 **90초**이다.  
   - 마이그레이션·초기화 지연이 있으면 60초로는 부족할 수 있어, **타임아웃 증가**가 권장된다.

4. **기동 중 SQL 예외로 크래시**  
   - sql-error.log 등이 비대한 것은 **런타임 SQL 오류**가 반복됐을 가능성을 시사한다.  
   - 기동 직후(요청 전)에서 발생하는 SQL은 보통 **Flyway 마이그레이션** 또는 **Hibernate DDL 검증/초기화** 구간이다.  
   - 서버의 **error.log / journalctl 최근 로그**에서 스택트레이스·예외 메시지를 확인하면 원인 특정에 도움이 된다.

---

## 4. 마지막 성공 시점과 비교

- **deploy-onboarding-dev.yml**  
  - 최근 커밋: `64733c24` (2025-12-25) — "fix: 온보딩 배포 워크플로우 헬스체크 개선".  
  - 그 후 워크플로 파일 자체는 수정되지 않은 것으로 보인다(같은 브랜치 기준).
- **마이그레이션**  
  - `V20260228_001` 추가: 커밋 `c0b9179a` — "fix: 개발 서버 기동 실패 대응 - system_config tenant_id 마이그레이션 및 엔티티 정렬".  
  - 그 외 최근 마이그레이션: V20260227_003, V20260227_004 등 (psych_assessment, system_config 이슈 대응과 무관할 수 있음).
- **정리**:  
  - **마지막으로 성공한 배포**가 언제였는지(워크플로 run 이력) 확인하면 좋다.  
  - 그 시점 이후 **V20260228_001 추가·system_config 엔티티 변경**이 들어갔다면, **해당 마이그레이션이 포함된 JAR로 배포되지 않았거나**, **DB에 미적용**이면 기동 실패가 날 수 있다.  
  - 동시에 **헬스체크 60초**는 백엔드 워크플로(90초)보다 짧아, 기동만 늦어져도 실패할 수 있다.

---

## 5. 수정 제안 (코드/워크플로/DB 구분)

### 5.1 앱 기동 실패 원인 제거 (코드·배포)

- **V20260228_001이 배포에 포함되도록 보장**  
  - `src/main/resources/db/migration/V20260228_001__add_tenant_id_to_system_config.sql` 이 **배포 브랜치(예: develop)에 커밋·푸시**되어 있는지 확인.  
  - 현재 워크플로는 **전체 프로젝트**를 빌드하므로, 해당 브랜치에 파일이 있으면 JAR에 포함된다.
- **서버 측 확인(수동 또는 shell 서브에이전트)**  
  - 배포 후 서버에서:  
    - `jar tf /var/www/mindgarden-dev/app.jar | grep V20260228`  
  - DB에서:  
    - `SELECT * FROM flyway_schema_history WHERE version = '20260228001' OR script LIKE '%20260228%';`  
  - 위로 **JAR 포함 여부**와 **마이그레이션 적용 여부**를 확인할 수 있다.
- **core-coder 전달 예시**:  
  - "V20260228_001이 반드시 배포 JAR에 포함되도록, 해당 마이그레이션 파일이 develop(또는 배포 브랜치)에 커밋·푸시되어 있는지 확인하고, 없으면 추가·푸시해 주세요. 서버에서 JAR 내 존재 여부와 flyway_schema_history 적용 이력을 한 번 확인할 것을 권장합니다."

### 5.2 헬스체크 타임아웃·재시작 스텝 (워크플로만)

- **헬스체크 대기 시간 증가**  
  - **파일**: `.github/workflows/deploy-onboarding-dev.yml`  
  - **위치**: "개발 서버 서비스 재시작" 스텝 내, `for i in {1..60}` 부분.  
  - **변경**: `{1..60}` → `{1..90}` (또는 120)으로 변경하여, deploy-backend-dev와 동일하게 **최소 90초**까지 헬스체크 대기.
- **SSH step timeout**  
  - 동 스텝의 `timeout: 60s`는 **SSH 연결** 타임아웃이다.  
  - 전체 대기 시간이 90초 이상이면, step timeout을 **120s** 등으로 올려 두는 것이 안전하다.
- **서비스 중지 후 대기**  
  - 온보딩 워크플로는 중지 후 3초, 백엔드 워크플로는 5초 + DB 연결 정리.  
  - **선택**: 중지 후 대기를 5초로 늘리거나, 백엔드와 동일하게 DB 연결 정리 스크립트를 호출하도록 단계를 추가(스크립트가 서버에 있다면).
- **core-coder 전달 예시**:  
  - "deploy-onboarding-dev.yml의 '개발 서버 서비스 재시작' 스텝에서 헬스체크 대기 루프를 60초에서 90초로 늌다(for i in {1..90}). 동 스텝 timeout을 120s로 올린다. 서비스 중지 후 추가 대기는 3초에서 5초로 늘린다."

### 5.3 Flyway repair / schema_history 정리 (DB·문서 제안)

- **실행 조건**  
  - **기동 실패 로그에 Flyway 관련 예외**(예: validation failed, duplicate version, repair 권고)가 있을 때만 검토.  
  - **실행 전** 반드시 DB 백업.
- **repair**  
  - Flyway 공식: `flyway repair`는 실패한 마이그레이션 행을 “수리”하고, checksum 등을 맞출 수 있다.  
  - 프로젝트에서 Flyway를 CLI가 아닌 Spring Boot 내장으로 쓰고 있으므로, **repair가 필요하면**  
    - 별도 Flyway CLI로 DB 연결 정보를 넘겨 repair 실행하거나,  
    - **수동으로** `flyway_schema_history`에서 불필요한 행만 정리하는 방법이 있다.
- **version 43 두 행 정리(수동 시)**  
  - **목적**: 같은 version에 SQL(성공) + DELETE만 있고, 현재 코드에 V43이 다시 있는 경우, DELETE 행이 검증에 영향을 줄 수 있으므로 **문서상으로만** 정리 방법을 제안.  
  - **실제 실행은 shell 서브에이전트 또는 DBA가 백업 후 수행.**  
  - 예시(참고용, 실행 전 백업 필수):  
    - `SELECT installed_rank, version, description, type, success, script FROM flyway_schema_history WHERE version = '43' ORDER BY installed_rank;`  
    - 성공(success=1)인 SQL 행은 유지하고, **DELETE 타입 행만 삭제**할지 여부는 Flyway 버전 문서와 팀 정책에 맞춰 결정.  
  - **주의**: Flyway는 type=DELETE 행을 내부적으로 사용할 수 있으므로, 삭제 시 **문서/지원 매트릭스**를 확인하거나, **repair** 사용을 우선 권장.
- **문서화 제안**  
  - `docs/troubleshooting/` 또는 `docs/standards/`에 "Flyway schema_history 이상 시 점검 절차"를 짧게 정리:  
    - (1) 기동 로그에서 Flyway 예외 확인, (2) DB 백업, (3) repair 또는 수동 정리 조건·명령 예시(위와 같이), (4) 재기동 후 health 확인.

---

## 6. 체크리스트 (수정 후 확인)

- [ ] **V20260228_001**  
  - 배포 브랜치에 커밋·푸시되어 있는지  
  - 배포 후 JAR 내 존재: `jar tf app.jar | grep V20260228`  
  - DB 적용 이력: `flyway_schema_history` 에 해당 version/script 존재 및 success=1
- [ ] **헬스체크·타임아웃**  
  - 온보딩 워크플로에서 헬스체크 루프 90초(이상), SSH step timeout 120s 반영 후  
  - 워크플로 한 번 수동 실행하여 "개발 서버 서비스 재시작" 스텝이 성공하는지
- [ ] **서비스 기동**  
  - 재시작 스텝 성공 후 `curl http://localhost:8080/actuator/health` 200 응답  
  - 실패 시: journalctl·error.log·sql-error.log에서 **Flyway/Hibernate/SQL 예외** 확인
- [ ] **Flyway**  
  - 기동 로그에 Flyway validation/repair 관련 에러가 있으면, 백업 후 repair 또는 schema_history 정리 검토

---

## 7. core-coder에게 전달할 태스크 설명 초안

- **태스크 1 (배포·마이그레이션)**  
  "온보딩 개발 서버 배포 실패 원인 중 하나로, system_config에 tenant_id가 없어 기동이 실패할 수 있음. V20260228_001 마이그레이션이 반드시 배포 JAR에 포함되도록, 해당 파일이 배포 브랜치(develop 등)에 커밋·푸시되어 있는지 확인하고, 없으면 추가·푸시해 주세요. 서버에서 JAR 내부와 flyway_schema_history로 적용 여부 확인하는 절차는 docs/troubleshooting/ONBOARDING_DEV_DEPLOY_FAILURE_ANALYSIS.md 5.1절을 참고해 주세요."

- **태스크 2 (워크플로)**  
  "deploy-onboarding-dev.yml의 '개발 서버 서비스 재시작' 스텝을 다음처럼 수정해 주세요. (1) 헬스체크 대기 루프를 `for i in {1..60}` 에서 `for i in {1..90}` 로 변경. (2) 해당 스텝의 timeout을 60s에서 120s로 변경. (3) 서비스 중지 후 추가 대기를 3초에서 5초로 변경. 목적: 60초 내 헬스체크 미도달로 인한 오류 가능성을 줄이기 위함."

- **태스크 3 (선택·문서)**  
  "Flyway schema_history에 동일 version에 DELETE와 SQL 두 행이 있는 경우, 기동 실패 시 로그 확인 후 repair 또는 수동 정리 절차를 docs에 추가해 주세요. 조건·명령 예시는 ONBOARDING_DEV_DEPLOY_FAILURE_ANALYSIS.md 5.3절을 참고."

---

## 8. 수정 적용 이력 (2026-02-28)

- **5.2 워크플로 적용 완료**  
  - `deploy-onboarding-dev.yml`: 헬스체크 대기 60→90초, step timeout 60s→120s, 중지 후 대기 3→5초.
- **5.1 V20260228_001**  
  - 이미 커밋 `c0b9179a`에 포함되어 있음. 배포 시 JAR에 포함·Flyway 적용되면 기동 실패 원인 제거.
- **마지막 성공 시점과 diff**  
  - 기준: `64733c24` (2025-12-25 온보딩 워크플로 헬스체크 개선).  
  - 그 후 `c0b9179a`에서 system_config tenant_id 마이그레이션·엔티티·백엔드 워크플로 수정.  
  - 이번 적용: 온보딩 워크플로만 위 5.2 변경(타임아웃·대기 시간).  
  - 문제가 커진 이유: 60초 타임아웃 + 기동 지연(마이그레이션/초기화) 또는 system_config 미적용 시 기동 실패가 겹쳤을 가능성.

---

**문서 끝.**  
5.2 수정은 적용됨. 5.1은 배포 브랜치 포함 여부 확인·서버 JAR/DB 점검으로 검증.
