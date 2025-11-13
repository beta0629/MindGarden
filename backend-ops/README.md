# MindGarden Ops Portal – Backend

Spring Boot 기반 내부 운영 포털 백엔드. JWT 기반 인증과 RBAC/ABAC를 적용할 예정이며, `internal-api` 게이트웨이를 통해서만 접근 가능합니다.

## 요구 사항
- JDK 17 (Temurin 권장)
- Gradle 8+

## 빌드 & 실행
```bash
./gradlew clean build
./gradlew bootRun
```

## 주요 엔드포인트 (초기)
- `GET /actuator/health` : 공개 헬스 체크
- `POST /api/v1/auth/login` : 내부 운영 계정 로그인(JWT 발급)
- `GET /api/v1/ping` : 인증 필요, 기본 응답(서비스 가동 확인)

## 보안 정책
- OAuth2 Resource Server (JWT) 기반 인증
- `/api/v1/auth/login`에서 환경 변수(`OPS_ADMIN_USERNAME`, `OPS_ADMIN_PASSWORD`, `OPS_ADMIN_ROLE`)로 정의된 관리자 계정 검증 후 JWT 발급
- JWT 설정: `SECURITY_JWT_SECRET`, `SECURITY_JWT_ISSUER`, `SECURITY_JWT_EXPIRES`
- 세션less(stateless) 구성
- 추후 ABAC 정책/감사 로그 필터 추가 예정

## TODO (Phase 1)
- 테넌트 온보딩/요금제 API 구현
- 감사 로그/Feature Flag 연동
- OpenAPI 스펙 자동화 및 문서화
