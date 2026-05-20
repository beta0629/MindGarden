# 카카오 알림톡 — 테넌트(지점) 온보딩 가이드

**대상**: MindGarden을 사용하는 **각 테넌트(지점) 운영자·본사 OPS·시스템 관리자**  
**목적**: 카카오 비즈메시지 **알림톡**을 쓰기 위해 **카카오 측 준비**와 **MindGarden 측 설정**을 순서대로 진행한다.  
**SSOT 연계**: [예약·알림톡 오케스트레이션 체크리스트](../project-management/2026-04-23/RESERVATION_KAKAO_ALIMTALK_ORCHESTRATION_CHECKLIST.md) §11 · [알림 시스템 표준](../standards/NOTIFICATION_SYSTEM_STANDARD.md)

**주의**

- **API 키·발신 프로필 키(sender key)** 는 **Git 저장소·티켓 본문·스크린샷에 평문으로 올리지 않는다.**
- MindGarden **DB에도 키 평문을 저장하지 않는 것**이 원칙이다. (Secrets Manager·KMS 등 **참조 ID**만 DB에 둘 예정 — 구현 후 관리 화면 안내가 갱신된다.)

---

## 1. 역할 정리 (누가 무엇을 하나)

| 역할 | 카카오 비즈센터 | MindGarden 설정 |
|------|------------------|-------------------|
| **본사 OPS / 플랫폼 관리자** | 채널 개설·검수 제출 조율 가능 | 시크릿·`secret_ref`·전역 기본값 |
| **테넌트(지점) 슈퍼관리자** | 비즈 채널 소유 시 직접 검수 | **비즈 템플릿 코드·on/off** 등 비시크릿 항목(정책에 따라) |

실제 권한은 조직에 맞게 조정한다. **키 입력을 UI에서 직접 받을지**는 보안 정책 회의에서 확정한다.

---

## 2. 카카오 비즈니스(사전 준비)

1. **카카오 비즈니스** 계정 및 **비즈메시지(알림톡)** 서비스 이용 신청  
2. **발신 프로필** 등록·심사  
3. **알림톡 템플릿** 작성 — **정보성** 문구(예약 확정·변경·취소 안내)로 검수  
4. 템플릿 **검수 승인** 후, 비즈센터에 표시되는 **템플릿 코드**(또는 템플릿 ID)를 메모해 둔다.

---

## 3. MindGarden 측 등록 절차 (권장 순서)

구현 진행 후 **어드민 화면**에서 입력하게 될 항목이 늘어난다. 아래는 **기획 기준** 목표 절차이다.

1. **운영 환경**에서 MindGarden에 **테넌트(지점)** 가 생성되어 있고, 로그인·`tenant_id`가 정상인지 확인한다.  
2. (구현 후) **관리자 > 알림·연동 > 카카오 알림톡(테넌트)** 메뉴로 이동한다. *(화면 경로는 `SystemConfigManagement` 확장 또는 신규 `TenantNotificationSettings` 중 택1 — 체크리스트 §11.5 참고)*  
3. **알림톡 사용**을 켠다(테넌트 단위).  
4. 이벤트별로 카카오에 **승인된 템플릿 코드**를 입력한다. (예: 예약 확정 / 변경 / 취소 — 제품에서 요구하는 키 이름은 릴리스 노트를 따른다.)  
5. **개발·스테이징**에서는 `simulation-mode=true`로 **실제 카카오 API 없이** 동작·로그만 확인한다.  
6. **스테이징**에서 테스트 수신 번호로 발송 검증 후, **운영**에서만 `simulation-mode=false` 및 실키 연동을 OPS가 수행한다.  
7. 발송 실패 시 **SMS 등 폴백**이 동작하는지, **이메일** 기존 안내가 깨지지 않았는지 확인한다.

---

## 4. 전역 설정과 테넌트 DB의 관계 (이해용)

- **시크릿**(API 키 등): 원칙적으로 **환경(Secrets)·KMS**에만 두고, DB에는 **참조 ID**만 둔다.  
- **템플릿 코드·테넌트 on/off** 등: **테넌트 DB에 저장**하고, 값이 없으면 **전역 `application.yml`·공통코드**를 따르는 **폴백** 규칙이 적용된다(세부는 §11.4).

---

## 5. provider 선택 — bizmsg vs solapi

알림톡 발송 채널은 **provider 스위치**로 분기한다. 기본값은 후방호환을 위해 `bizmsg`이며, 솔라피(Solapi/CoolSMS)로 전환하려면 아래 ENV를 설정한다.

### 5.1 ENV 키 정리

| 키 | 용도 | 비고 |
|------|------|------|
| `KAKAO_ALIMTALK_ENABLED` | 알림톡 채널 사용 (`true`/`false`) | 공통 |
| `KAKAO_ALIMTALK_SIMULATION_MODE` | 시뮬레이션 모드 (실제 API 호출 안 함) | 공통 — 개발·스테이징 권장 `true` |
| `KAKAO_ALIMTALK_PROVIDER` | `bizmsg` (기본) 또는 `solapi` | 공통 |
| `KAKAO_ALIMTALK_API_KEY` | 비즈엠 API Key | provider=bizmsg |
| `KAKAO_ALIMTALK_SENDER_KEY` | 비즈엠 발신자 키 | provider=bizmsg |
| `KAKAO_ALIMTALK_API_URL` | 비즈엠 API base URL | 기본 `https://alimtalk-api.bizmsg.kr` |
| `SOLAPI_ALIMTALK_PFID` | 솔라피 발신 프로필(채널) ID (`PF……`) | provider=solapi 필수 |
| `SOLAPI_ALIMTALK_API_KEY` | 솔라피 API Key (`NCS……`) | provider=solapi 필수 |
| `SOLAPI_ALIMTALK_API_SECRET` | 솔라피 API Secret | provider=solapi 필수 — **Secrets로만 주입** |
| `SOLAPI_ALIMTALK_API_URL` | 솔라피 API base URL | 기본 `https://api.solapi.com` |
| `SOLAPI_ALIMTALK_SENDER_NUMBER` | 솔라피 발신 번호(SMS 폴백 등 선택) | 선택 |

- **운영 키 본문은 DB·Git·티켓 본문에 절대 저장하지 않는다.** Secrets Manager / GitHub Secrets / 호스트 환경 변수에만 두고, MindGarden DB에는 `kakao_api_key_ref`·`kakao_sender_key_ref`(참조 ID)만 둔다.
- `kakao.alimtalk.*` YAML 키는 `application-local.yml.example`·`application-{profile}.yml`에서 위 ENV를 참조하도록 작성한다. `application.yml`(공통)에는 키 이름만 정리되어 있고 값은 두지 않는다.

### 5.2 솔라피 발신 프로필·템플릿 등록 절차

1. **솔라피 콘솔(`console.solapi.com`)** 에서 회원 가입·로그인 후, **카카오 채널 등록**(채널 검색·소유권 확인)으로 발신 프로필(`pfId`)을 만든다.  
2. **알림톡 템플릿 등록** → 변수(`#{name}` 등) 정의 → **카카오 검수 제출**. 정보성 문구만 사용한다(광고성은 별도 채널).  
3. 승인된 템플릿의 **`templateId`** 를 메모해 둔다. MindGarden 어드민 알림톡 설정의 이벤트별 템플릿 코드 입력란에 같은 값을 넣는다.  
4. **API Key/Secret 발급**(콘솔 → API 키 관리)을 받아 **운영 Secrets**에 등록한다(`SOLAPI_ALIMTALK_API_KEY` / `SOLAPI_ALIMTALK_API_SECRET`).  
5. 발신 프로필 ID(`PF……`)는 `SOLAPI_ALIMTALK_PFID`로 등록한다. 테넌트별로 다를 경우, 테넌트의 `kakao_sender_key_ref`에 해당 식별자를 넣고 ENV에 `<REF>_PFID` 형태(예: `TENANT_A_PFID`)로 매핑한다.

### 5.3 시크릿 참조(`*_ref`) 규칙

`tenant_kakao_alimtalk_settings` 테이블의 두 참조 컬럼은 **단순 식별자**(영숫자·언더스코어·하이픈)만 둔다. 실제 키 lookup은 다음 우선순위로 동작한다.

1. `<REF 대문자>_API_KEY` / `<REF 대문자>_API_SECRET` 환경 변수에서 lookup  
2. 없으면 전역 default(`SOLAPI_ALIMTALK_API_KEY` / `SOLAPI_ALIMTALK_API_SECRET`) 사용  
3. **위 1·2 둘 다 비어 있으면 `SMS_API_KEY` / `SMS_API_SECRET`(= `sms.auth.api-key`/`api-secret`)로 자동 fallback**  
   - 솔라피는 계정당 통합 API Key/Secret 하나로 SMS·알림톡 모두 발송하므로, **단일 계정 운영자**는 `.env`에 `SMS_API_KEY` / `SMS_API_SECRET`만 채우면 `SOLAPI_ALIMTALK_API_KEY` / `SOLAPI_ALIMTALK_API_SECRET`를 따로 설정하지 않아도 알림톡 발송이 가능하다.  
   - 단, **테넌트별 `<REF>_API_KEY`/`<REF>_API_SECRET`** 는 **SMS 키로 fallback하지 않는다** (테넌트 분리 의도 보존). 전역 default가 비어 있고 테넌트 ref env도 비어 있을 때에만 SMS 키로 fallback된다.

발신 프로필(`kakao_sender_key_ref`)도 동일하게 `<REF>_PFID` → 전역 `SOLAPI_ALIMTALK_PFID` 순으로 lookup하며, `<REF>` 값이 이미 PFID 식별자라면 그 값을 그대로 사용한다. **PFID(`SOLAPI_ALIMTALK_PFID`)는 카카오 채널마다 다르므로 SMS 키 fallback 대상이 아니다.**

#### 자격증명 lookup 요약

| 단계 | API Key | API Secret | 비고 |
|------|---------|------------|------|
| 1 | `<REF>_API_KEY` | `<REF>_API_SECRET` | 테넌트별 전용 키 (`kakao_api_key_ref`가 채워져 있을 때) |
| 2 | `SOLAPI_ALIMTALK_API_KEY` | `SOLAPI_ALIMTALK_API_SECRET` | 전역 알림톡 전용 키 |
| 3 | `SMS_API_KEY` | `SMS_API_SECRET` | **신규** — 1·2가 모두 비었을 때 자동 fallback (솔라피 통합 키) |

### 5.4 동작 매트릭스

| 조건 | 결과 |
|------|------|
| `KAKAO_ALIMTALK_ENABLED=false` | provider 무관, 발송 안 함(로그만) |
| `KAKAO_ALIMTALK_SIMULATION_MODE=true` | 실제 API 호출 없이 항상 `true` 반환(로그) |
| `KAKAO_ALIMTALK_PROVIDER=bizmsg` (기본) | 기존 비즈엠 경로 — `api-key`/`sender-key` 사용 |
| `KAKAO_ALIMTALK_PROVIDER=solapi` + 시뮬레이션 | 솔라피 클라이언트 호출 없이 `true` 반환 |
| `KAKAO_ALIMTALK_PROVIDER=solapi` + 실제 모드 | 솔라피 API 호출, ATA 메시지 + HMAC 인증 |
| 솔라피 자격 증명/PFID 누락 | `false` 반환(로그) — 발송 차단 |

---

## 6. 문의·변경 요청

- 템플릿 검수 반려·변수 불일치: **카카오 비즈센터** 또는 **솔라피 콘솔**에서 수정 후, MindGarden에 **새 템플릿 코드(또는 솔라피 `templateId`)** 를 다시 등록한다.  
- MindGarden 제품/버그: 내부 채널(이슈 트래커)에 **테넌트 ID·재현 절차**를 남긴다(키·전화번호 전문 붙이기 금지).

---

## 7. 변경 이력

| 일자 | 내용 |
|------|------|
| 2026-04-23 | 최초 작성 — core-planner 기획 산출 반영 |
| 2026-05-20 | 솔라피(Solapi) provider 스위치·ENV 키·시크릿 참조 절차 추가 — core-coder |
| 2026-05-20 | 알림톡 전용 키 미설정 시 `SMS_API_KEY`/`SMS_API_SECRET`로 자동 fallback 안내 추가 — core-coder |
