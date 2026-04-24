# 테넌트·OPS용 SMS(문자) 연동 온보딩

**대상**: 테넌트(지점) 운영자·OPS·시스템 관리자  
**목적**: SMS(문자) 인증·발송 연동 시 **비밀값 관리**와 **환경별 설정**을 맞춘다.

## 원칙

- **API 키·시크릿**은 Git 저장소, DB 평문, 티켓·채팅 본문에 넣지 않는다.
- 서버 **환경 변수** 또는 **Secrets Manager**(배포 파이프라인 시크릿 등)로만 주입한다.

`src/main/resources/application.yml` 의 `sms.auth` 블록은 아래 환경 변수 이름과 1:1로 대응한다.

| 환경 변수 | 설명 |
|-----------|------|
| `SMS_AUTH_ENABLED` | SMS 인증·연동 기능 전체 사용 여부를 켜거나 끈다. |
| `SMS_PROVIDER` | 사용할 SMS 게이트웨이 벤더 식별자(예: nhn, twilio, aligo)를 지정한다. |
| `SMS_API_KEY` | 프로바이더가 발급한 API 키(식별자)로, 외부에 노출되지 않게 주입한다. |
| `SMS_API_SECRET` | API 호출 서명·인증에 쓰이는 시크릿으로, 키와 분리해 안전하게 보관한다. |
| `SMS_SENDER_NUMBER` | 발신 번호(등록된 발신자 식별)로, 프로바이더·통신사 정책에 맞게 설정한다. |
| `SMS_TEST_MODE` | true면 실제 단문 발송 없이 테스트·모의 동작에 맞춘다. |
| `SMS_MOCK_CODE` | 테스트 모드 등에서 쓰는 고정 인증번호(로컬·스테이징 검증용)를 지정한다. |

## 개발

- **`SMS_TEST_MODE=true` 권장**: 비용·실발송 없이 흐름과 로그를 검증한다.

## 운영

- **`SMS_TEST_MODE=false`** 로 두고 실제 발송 경로를 사용한다.
- **키·시크릿**은 애플리케이션 설정 파일이 아니라 **배포 파이프라인 Secrets**(또는 동급 비밀 저장소)에서 주입한다.

## DB·테넌트 설정

- 테넌트별 SMS 연동 메타는 DB에 **`tenant_sms_settings`(가칭)** 등으로 두되, **참조·비민감 값만** 저장하고 **실제 키·시크릿은 환경 변수·Secrets**에서만 주입한다.
- 위 메타·참조는 **Admin 화면**에서 저장·갱신한다.
- 알림톡 쪽과 동일한 비밀값 분리 원칙은 [카카오 알림톡 — 테넌트(지점) 온보딩 가이드](kakao-alimtalk-tenant-onboarding.md)를 참고한다.

## 관리자 UI

- **`/admin/tenant-sms-settings`**(가칭) 화면에서 테넌트별 안내·설정을 확인한다.
- 앱 내에서는 **관리자(admin) 메뉴**에서 해당 경로로 이동하는 항목을 따른다(메뉴명은 릴리스에 맞게 갱신될 수 있음).

## 관련 문서

- [USER 채널 SMS 오케스트레이션](../project-management/2026-04-24/USER_CHANNEL_SMS_ORCHESTRATION.md)
- [알림 시스템 표준](../standards/NOTIFICATION_SYSTEM_STANDARD.md)
