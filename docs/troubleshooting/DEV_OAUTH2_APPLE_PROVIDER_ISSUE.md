# 개발 서버 OAuth2 Apple "Provider ID must be specified" 이슈

**작성일**: 2026-02-28

---

## 1. 왜 application-dev.yml을 쓰는가

- 개발 서버는 **`--spring.profiles.active=dev`** 로 기동한다.  
  (배포: `.github/workflows/deploy-backend-dev.yml`, `deploy-onboarding-dev.yml` → `/opt/mindgarden/start.sh` → `java -jar app.jar --spring.profiles.active=dev`)
- Spring Boot는 **application.yml** + **application-{profile}.yml** 을 합쳐서 로드한다.
- 따라서 profile=**dev** 일 때 **application-dev.yml** 이 로드된다.  
  (이 파일이 없던 시절에는 application.yml만 로드됨.)

---

## 2. Apple 설정이 application-dev.yml에 있는 이유

- **2026-02-28** 커밋 **61443061** 에서 한 번에 추가되었다.  
  커밋 메시지: `fix(dev): 개발 서버 기동 실패 방지 - dev 프로파일 완화 및 application-dev.yml 추가`
- 그때 **server.base-url**, **JWT/암호화 기본값**과 함께 **OAuth2 google/apple redirect-uri 기본값**을 넣으면서,  
  `spring.security.oauth2.client.registration` 아래에 **google**, **apple** 두 개의 클라이언트만 넣었다.
- **provider** 블록은 넣지 않았다.  
  Google은 Spring 내장 `CommonOAuth2Provider`에 있어서 provider 없이 동작하지만,  
  **Apple은 내장 지원이 없어** `provider.apple`(authorization-uri, token-uri 등)이 없으면  
  Spring이 `Provider ID must be specified for client registration 'apple'` 를 던진다.

---

## 3. Git에서 언제 바뀌었는지

| 항목 | 내용 |
|------|------|
| **파일** | `src/main/resources/application-dev.yml` |
| **최초 추가** | **61443061** (2026-02-28 01:26, Sat Feb 28 01:26:20 2026 +0900) |
| **작성자** | Your Name \<your.email@example.com\> |
| **메시지** | fix(dev): 개발 서버 기동 실패 방지 - dev 프로파일 완화 및 application-dev.yml 추가 |
| **같은 커밋에서 수정된 파일** | JwtSecretValidator.java, PersonalDataEncryptionKeyProvider.java, application-dev.yml |

이전에는 **application-dev.yml 자체가 없었고**, dev 서버는 **application.yml만** 읽었기 때문에 OAuth2 client 등록이 없었고, 위와 같은 오류도 없었다.

---

## 4. 여태 문제가 없었던 이유

- **과거**: profile=dev 일 때 **application-dev.yml 이 없음** → application.yml만 로드 → OAuth2 섹션이 주석 처리되어 있어 client registration 빈이 생성되지 않음 → Apple 관련 오류 없음.
- **61443061 이후**: application-dev.yml 이 생기면서 **google/apple registration** 이 추가됐지만 **provider.apple** 이 없음 → 기동 시 `InMemoryClientRegistrationRepository` 생성 단계에서 Apple에 대한 provider-id 부재로 예외 발생.

---

## 5. 적용한 수정

- **application-dev.yml** 에 **spring.security.oauth2.client.provider.apple** 블록을 추가했다.  
  (authorization-uri, token-uri, user-info-uri, user-name-attribute — application-local.yml 의 Apple provider와 동일한 형태.)
- 이렇게 하면 Spring이 Apple용 provider를 인식해 **Provider ID must be specified** 예외 없이 기동한다.

---

## 6. 참고

- Apple은 Spring 내장 `CommonOAuth2Provider`에 없으므로, registration 만 있고 provider 가 없으면 반드시 **provider.apple** 을 수동 정의해야 한다.
- application-local.yml 에는 원래부터 provider.apple 이 있어서 로컬에서는 문제가 없었다.
