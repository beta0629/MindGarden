# 프로시저 배포·빌드 오류 대응 계획

**목표**: 프로시저 배포 시 SCP exit 255(Host key verification failed) 및 애플리케이션 기동 시 ANTLR 버전 불일치 exit 1을 해결하기 위한 대응 단계와 CI 체크리스트를 정리한다.  
**참조**: `docs/debug/PROCEDURE_DEPLOY_AND_BUILD_ERROR_ANALYSIS.md` (원인 분석).

---

## 1. 범위

| 구분 | 포함 | 제외 |
|------|------|------|
| SCP/SSH | CI 워크플로에 known_hosts 추가 단계 예시·문서 안내, 배포 스크립트 옵션 안내 | 실제 호스트명·키·비밀번호 기재, 시크릿 값 코드 반영 |
| ANTLR/빌드 | pom.xml Spring Boot·ANTLR 의존성 정렬(버전 통일) | 인프라/시크릿 변경 |
| CI | deploy-procedures-dev.yml, deploy-procedures-prod.yml 단계 보강 | 다른 워크플로 대대적 변경 |

---

## 2. 의존성·순서

- **선행**: 원인 분석 완료 → `docs/debug/PROCEDURE_DEPLOY_AND_BUILD_ERROR_ANALYSIS.md` 참조.
- **순서**: (1) ANTLR/빌드 수정(pom.xml)으로 기동 exit 1 해소 → (2) CI에 known_hosts 관련 단계 추가(문서·주석 예시 포함)로 SCP exit 255 해소.  
  - SCP와 ANTLR은 서로 독립적이므로, 운영 정책에 따라 SCP 대응만 먼저 적용해도 됨.

---

## 3. 대응 단계(Phase)

### Phase 1: ANTLR/빌드 (exit 1) — 코드 수정

- **담당**: core-coder  
- **목표**: ANTLR 4.10.1 vs 4.13.0 불일치 제거, 애플리케이션 기동 시 exit 1 방지.  
- **내용**:
  - **권장**: Spring Boot를 3.2.1 이상(또는 3.3.x)으로 업그레이드하여 Spring Data JPA가 ANTLR 4.13.0과 맞는 버전을 사용하도록 함. Hibernate 6.4.0.Final과의 호환은 릴리즈 노트로 확인.
  - **선택**: `pom.xml`에 `antlr4-runtime` 4.13.0 명시(property + dependencyManagement 또는 dependencies).  
- **완료 기준**: `mvn clean package` 및 애플리케이션 기동 시 ANTLR 버전 불일치 경고/exit 1이 발생하지 않음.

### Phase 2: SCP/호스트 키 (exit 255) — CI·문서

- **담당**: core-coder(CI 예시·주석 추가), 운영/인프라(시크릿·실제 호스트 키 등록)  
- **목표**: CI 러너에서 scp/ssh 시 "Host key verification failed"로 인한 exit 255 제거.  
- **내용**:
  - **문서 안내**: `docs/debug/PROCEDURE_DEPLOY_AND_BUILD_ERROR_ANALYSIS.md` §1.4 대로, 운영/CI에서 (A) known_hosts 추가, (B) SSH_KNOWN_HOSTS 시크릿 사용, (C) StrictHostKeyChecking 옵션(임시·보안 주의) 중 선택 적용. 실제 호스트명·키·비밀번호는 문서에 넣지 않음.
  - **CI 코드**: `.github/workflows/deploy-procedures-dev.yml`, `deploy-procedures-prod.yml`에 배포 스텝 **이전**에 known_hosts를 추가하는 단계 **예시(주석)** 또는 `docs/debug/...` 링크를 추가. 실제 값은 시크릿/환경에 맞게 사용자가 채움.
  - **선택**: `scripts/automation/deployment/deploy-standardized-procedures.sh`의 scp/ssh 호출에 `-o StrictHostKeyChecking=no` 등 옵션 추가 시, 보안 주의 주석을 반드시 달고, 가능하면 known_hosts 방식으로 전환하도록 문서에 명시.  
- **완료 기준**: 워크플로 수동 실행 시 프로시저 배포가 exit 255 없이 끝까지 완료됨(시크릿 등록 후).

---

## 4. 리스크·제약

- **ANTLR**: Spring Boot 상위 버전으로 올릴 경우 다른 의존성·동작 변경 가능 → 테스트 및 릴리즈 노트 확인 필요.  
- **SSH**: StrictHostKeyChecking=no 사용 시 MITM 위험 있음 → 내부/CI 전용·임시용으로만 사용하고, 가능하면 known_hosts 등록 방식 적용.  
- **시크릿**: 호스트 키·SSH 키 등은 리포지토리 시크릿에만 저장하고, 코드·문서에는 예시·변수명 수준만 기재.

---

## 5. 단계별 체크리스트

### ANTLR/빌드

- [ ] pom.xml에서 Spring Boot 3.2.1+ (또는 3.3.x) 적용 및 Hibernate 6.4 호환 확인.
- [ ] 필요 시 antlr4-runtime 4.13.0 property/dependencyManagement 명시.
- [ ] `mvn clean package` 및 로컬/CI 기동으로 ANTLR 경고·exit 1 없음 확인.

### SCP/CI

- [ ] deploy-procedures-dev.yml / deploy-procedures-prod.yml에 known_hosts 추가 단계(또는 주석 예시) 반영.
- [ ] 운영에서 SSH_KNOWN_HOSTS(또는 동등) 시크릿 등록 및 워크플로에서 참조.
- [ ] 수동 실행으로 프로시저 배포가 exit 255 없이 완료되는지 확인.

---

## 6. 실행 위임(분배)

| Phase | 서브에이전트 | 전달할 태스크 요약 |
|-------|--------------|---------------------|
| 1 | core-coder | `docs/debug/PROCEDURE_DEPLOY_AND_BUILD_ERROR_ANALYSIS.md` §2.4·§2.5 참고. Spring Boot 3.2.1+ 업그레이드로 ANTLR 4.13.0 정렬. 필요 시 pom.xml에 antlr4-runtime 4.13.0 명시. 수정 후 `mvn clean package` 및 기동으로 exit 1 소멸 확인. |
| 2 | core-coder | `docs/debug/PROCEDURE_DEPLOY_AND_BUILD_ERROR_ANALYSIS.md` §1.4 참고. deploy-procedures-dev.yml, deploy-procedures-prod.yml에 배포 전 known_hosts 추가 단계 예시(주석) 또는 문서 링크 추가. 실제 호스트/키는 넣지 말 것. 필요 시 deploy-standardized-procedures.sh에 SSH 옵션 추가 시 보안 주의 주석 반드시 추가. |

---

**문서 유형**: 프로젝트 관리·대응 계획  
**관련**: `docs/debug/PROCEDURE_DEPLOY_AND_BUILD_ERROR_ANALYSIS.md`
