# 개발 배포 안정화 체크리스트

**목적**: 배포 후 오류가 발생하지 않도록, 변경 시 반드시 확인할 항목과 CI에서 자동 검증하는 항목을 정리합니다.

---

## 1. CI에서 자동 검증 (배포 전)

다음은 `deploy-backend-dev.yml`, `deploy-onboarding-dev.yml` 에서 **배포 전** 자동으로 수행됩니다.

| 검증 항목 | 설명 |
|-----------|------|
| **JAR 내 application-dev.yml 존재** | dev 프로파일 설정 파일이 빌드 결과물에 포함되는지 확인. |
| **OAuth2 provider.apple 정의** | application-dev.yml에 `provider:` 및 `apple:` 이 포함되는지 확인. 미포함 시 기동 시 `Provider ID must be specified for client registration 'apple'` 로 실패함. |

위 검증 실패 시 **배포가 진행되지 않고** 워크플로가 실패합니다.

---

## 2. 설정 파일 변경 시 반드시 확인할 것

### 2.1 application-dev.yml

- **OAuth2**
  - `spring.security.oauth2.client.registration` 에 등록한 **Apple** 은 Spring 내장 provider가 아니므로, 반드시 **`spring.security.oauth2.client.provider.apple`** 블록(authorization-uri, token-uri, user-info-uri, user-name-attribute)을 두어야 합니다.
  - Google은 내장이라 provider 없이 동작합니다.
- **JWT / encryption**
  - dev에서는 미설정 시 기본값으로 기동 가능하도록 되어 있음. 기본값 제거 시 환경 변수 필수로 바뀌므로 배포 서버 env 확인 필요.

### 2.2 DB 마이그레이션 (Flyway)

- **엔티티와 스키마 일치**: 새 컬럼/테이블을 JPA 엔티티에 반영했다면, Flyway 마이그레이션으로 DB에도 동일하게 반영되어 있어야 합니다. (예: system_config.tenant_id → V20260228_001)
- **배포 브랜치 포함**: 마이그레이션 파일이 develop(또는 배포 브랜치)에 커밋·푸시되어 있어야 CI 빌드 JAR에 포함되고, 기동 시 Flyway가 적용합니다.

### 2.3 트리거 paths

- **application-dev.yml**, **application.yml** 변경 시 배포가 돌도록 두 워크플로 모두 paths에 포함되어 있습니다.
  - `deploy-backend-dev.yml`: `src/main/resources/application.yml`, `src/main/resources/application-dev.yml`
  - `deploy-onboarding-dev.yml`: 동일 paths 추가됨.

---

## 3. 배포 후 실패 시 점검 순서

1. **워크플로 로그**  
   "🔒 dev 프로파일 설정 검증" 단계 실패 → JAR 내 application-dev.yml 또는 provider.apple 누락.  
   "서비스 시작 실패" / "헬스체크 실패" → 서버에서 아래 확인.

2. **서버 로그 (SSH 접속 후)**  
   - `sudo journalctl -u mindgarden-dev.service --no-pager -n 400`  
   - `sudo tail -200 /var/log/mindgarden/dev-error.log`  
   - `/var/www/mindgarden-dev/logs/error.log`  
   → Flyway, Hibernate, OAuth2, NPE 등 **기동 직후 예외** 메시지 확인.

3. **롤백**  
   - `/var/www/mindgarden-dev/backups/` 에 이전 JAR 백업이 있음.  
   - 필요 시 이전 백업으로 복원 후 `sudo systemctl restart mindgarden-dev.service`.

---

## 4. 요약

- **배포 전**: CI가 JAR 내 application-dev.yml 및 OAuth2 provider.apple 유무를 검증하여, 문제 있으면 배포 단계로 넘어가지 않음.
- **설정/마이그레이션 변경 시**: 위 체크리스트와 paths 트리거를 의식하여 푸시하면, 배포 후 오류를 줄일 수 있습니다.
