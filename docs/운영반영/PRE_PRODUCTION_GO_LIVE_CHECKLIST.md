# 운영 반영(Go-Live) 전 체크리스트

**문서 유형**: 운영 준비 · 전 에이전트 합의용  
**버전**: 2.0.0  
**최종 갱신**: 2026-02-12  
**상태**: 상시 업데이트 (배포 직전 반드시 최신본 확인)

> **오케스트레이션 위임**: 운영 반영 플랜 수립·실행을 **core-planner(기획)** 에게 위임하면, 본 체크리스트·데이터 선별·서브에이전트(shell·core-debugger·core-tester·문서정리 등) 분배실행을 주관하여 오케스트레이션한다. "운영 반영 플랜 수립해줘", "Go-Live 오케스트레이션 진행해줘" 등으로 호출.

---

## 문서 계층

| 용도 | 문서 |
|------|------|
| **본 문서** | 도메인·서브도메인·보안·운영 환경 **종합 Go-Live 체크** |
| 배포 프로세스 표준 | [DEPLOYMENT_STANDARD.md](../standards/DEPLOYMENT_STANDARD.md) |
| 보안 세부 | [SECURITY_STANDARD.md](../standards/SECURITY_STANDARD.md), [SECURITY_AUTHENTICATION_STANDARD.md](../standards/SECURITY_AUTHENTICATION_STANDARD.md) |
| 기능 단위 배포 예시(레거시) | [DEPLOYMENT_CHECKLIST.md](../guides/deployment/DEPLOYMENT_CHECKLIST.md) |
| 개발 서버 안정화 참고 | [DEV_DEPLOYMENT_STABILITY_CHECKLIST.md](../troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md) |
| **운영 필수·비필수 DB 데이터 선별** | [PRODUCTION_ESSENTIAL_DATA.md](../deployment/PRODUCTION_ESSENTIAL_DATA.md) |
| 서브도메인·와일드카드 DNS 검증 기록 | [WILDCARD_DNS_SUCCESS.md](../project-management/2025-12-12/WILDCARD_DNS_SUCCESS.md) |

---

## 0. 2026-02-12 전 에이전트 회의 합의 요지

> 아래는 **기획(core-planner) 주관**으로 shell · core-tester · core-debugger · core-coder · core-designer · core-component-manager가 같은 기준을 쓰기로 한 **운영 반영 전 최소 합의**입니다. 실제 IP·호스트명은 테넌트/호스팅 계약에 맞게 치환하세요.

| 에이전트 | 회의에서 본 문서에 반영한 책임 |
|----------|-------------------------------|
| **기획** | Go-Live 범위·일정·의사결정(도메인 정책, OAuth 노출 범위, 유지보수 창) |
| **shell** | DNS·TLS·배포 파이프라인·서버 방화벽·systemd·백업 스크립트 현장 일치 |
| **core-coder** | `application-prod`(또는 운영 프로파일)·CORS·OAuth redirect·API Base URL·Actuator 노출 |
| **core-tester** | 본 체크리스트의 스모크·회귀 항목 실행·증적(스크린샷·로그) |
| **core-debugger** | 장애 시 로그 위치·롤백 검증·알려진 이슈(예: 서브도메인 로그아웃) |
| **core-designer** | 운영 브랜딩 URL·OG 이미지 경로가 **실제 도메인**과 일치하는지 |
| **core-component-manager** | 중복 화면/공지 진입점이 운영 URL에서 동일 동작하는지(문서만) |

**서명(オプション)**: 배포 책임자 / 검증 책임자 / 보안 검토자 이름·날짜를 배포 티켓에 남깁니다.

---

## 1. 도메인 · DNS · 서브도메인

### 1.1 Apex 및 고정 호스트

| # | 확인 항목 | 담당 | 증적 예시 |
|---|-----------|------|-----------|
| 1.1.1 | **Apex 도메인**(`example.com`) A/AAAA 레코드가 운영 LB/서버로 향함 | shell | `dig +short example.com` |
| 1.1.2 | **www** CNAME 또는 A 레코드 정책이 기획과 일치(리다이렉트 포함) | 기획/shell | 브라우저 301/302 확인 |
| 1.1.3 | **이전 도메인**에서 신규 도메인으로 리다이렉트 필요 여부 결정 | 기획 | — |
| 1.1.4 | **개발/스테이징/운영** 호스트명이 코드·환경변수·OAuth 콘솔과 **혼재 없음** | coder | env 목록 |

> **프로젝트 과거 참고값**(반드시 현행 인프라와 대조): 레거시 체크리스트에 `m-garden.co.kr → 211.37.179.204` 등 기록이 있으나, **실제 운영은 배포 전 DNS/LB 기준으로 재확인**할 것.

### 1.2 멀티테넌트 · 와일드카드 서브도메인

| # | 확인 항목 | 담당 | 비고 |
|---|-----------|------|------|
| 1.2.1 | 테넌트 랜딩용 **와일드카드 DNS** (`*.dev.core-solution.co.kr` 등) 존재 및 전파 완료 | shell | [WILDCARD_DNS_SUCCESS.md](../project-management/2025-12-12/WILDCARD_DNS_SUCCESS.md) 참고 |
| 1.2.2 | **운영** 와일드카드(`*` → 운영 IP)가 **의도한 서버**만 가리키는지(개발과 분리) | shell | 보안 CRITICAL |
| 1.2.3 | 신규 테넌트 **서브도메인 가입·로그인·로그아웃** 플로 전 구간 검증 | tester | [LOGOUT_SUBDOMAIN_ANALYSIS.md](../troubleshooting/LOGOUT_SUBDOMAIN_ANALYSIS.md) |
| 1.2.4 | 쿠키 **Domain / SameSite** 정책이 서브도메인 전략과 일치 | coder | HTTPS 전제 |

### 1.3 이메일 · 기타 레코드

| # | 확인 항목 |
|---|-----------|
| 1.3.1 | SPF / DKIM / DMARC (발송 도메인 사용 시) |
| 1.3.2 | 인증 메일·비밀번호 재설정 링크가 **운영 URL**을 가리킴 |

---

## 2. TLS · 인증서 · 리버스 프록시

| # | 확인 항목 | 담당 |
|---|-----------|------|
| 2.1 | **HTTPS 강제**(HTTP → HTTPS 리다이렉트) | shell |
| 2.2 | 인증서 SAN에 **apex / www / 와일드카드(해당 시)** 포함 | shell |
| 2.3 | **만료일·자동 갱신**(certbot/ACME/LB) 모니터링 연동 | shell |
| 2.4 | Nginx/프록시에서 **프록시 헤더** `X-Forwarded-Proto`, `Host`, `X-Forwarded-For` 정합(Spring 신뢰 프록시 설정) | coder/shell |
| 2.5 | **압축·타임아웃·업로드 크기** 한도가 운영 정책과 일치 | shell |

---

## 3. 애플리케이션 URL · CORS · API 게이트웨이

| # | 확인 항목 | 담당 |
|---|-----------|------|
| 3.1 | 프론트 빌드 시 **공개 API Base URL**·`REACT_APP_*`가 운영값 | coder/shell |
| 3.2 | **CORS**: 운영에서는 `*` 금지(허용 Origin 화이트리스트만) — 개발과 동일하면 안 됨 | coder | [SECURITY_STANDARD.md](../standards/SECURITY_STANDARD.md) |
| 3.3 | WebSocket/SSE 사용 시 운영 Origin 허용 | coder |
| 3.4 | **Actuator / Swagger** 운영 공개 범위 최소화(필요 시 IP 제한 또는 비공개) | coder/shell |
| 3.5 | **헬스체크 경로**가 로드밸런서·모니터링과 동일하게 설정됨 | shell | 예: `/actuator/health` |

---

## 4. 인증 · OAuth2 · 세션 · 보안 헤더

| # | 확인 항목 | 담당 |
|---|-----------|------|
| 4.1 | Kakao/Naver/Apple 등 **OAuth 리디렉션 URI**를 운영 도메인 전부 등록 | 기획/coder |
| 4.2 | `JWT_SECRET`, DB·PG·외부 API 키 **GitHub Secrets / 서버 env**만 사용(저장소 무기입) | coder/shell |
| 4.3 | 운영 **세션 동시 접속 제한** 등 정책이 SECURITY_STANDARD와 일치 | coder |
| 4.4 | **HSTS**(필요 시), **X-Frame-Options**, **CSP** 정책 기획·보안 합의 | shell/coder |
| 4.5 | 결제(PG)·웹훅 URL이 **운영 도메인** | coder/tester |
| 4.6 | 파일 업로드 경로·실행 금지·용량·검증 | coder |
| 4.7 | Rate limiting / WAF(가용 시) | shell |

---

## 5. 데이터베이스 · 마이그레이션 · 백업

| # | 확인 항목 |
|---|-----------|
| 5.1 | **배포 전 풀 백업** 및 복구 테스트 주기 문서화 |
| 5.2 | Flyway/Liquibase 등 마이그레이션 **dry-run 또는 스테이징 선적용** |
| 5.3 | 표준화 **프로시저** 변경 시 [deploy-procedures-prod.yml](../../.github/workflows/deploy-procedures-prod.yml) 등 별도 실행 여부 |
| 5.4 | 운영 DB **네트워크 접근**(퍼블릭 X, bastion/VPN만) |
| 5.5 | 연결 풀·타임아웃·읽기 부하(리플리카) 정책 |
| 5.6 | **데이터 선별**: 마스터·참조는 Flyway, **개발 테스트·개인정보 덤프는 운영 미이관**. **운영 테넌트는 Mind Garden 온보딩으로만 생성**(개발 테넌트 덤프 금지) — [PRODUCTION_ESSENTIAL_DATA.md](../deployment/PRODUCTION_ESSENTIAL_DATA.md) §1.1 |
| 5.7 | **MySQL 연결 합산(배포 전)**: `(앱 인스턴스 수 × Hikari maximum-pool-size)` + 기타 DB 클라이언트 ≤ MySQL `max_connections`. 초과 시 `Too many connections` 발생 가능. 풀 상한은 `HIKARI_MAXIMUM_POOL_SIZE` 등으로 조절 — [DEV_DEPLOYMENT_STABILITY_CHECKLIST.md](../troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md) 2.4 참고 |

---

## 6. 인프라 · 네트워크 · 접근 통제

| # | 확인 항목 |
|---|-----------|
| 6.1 | 방화벽: **필요 포트만** 공개(예: 80/443, SSH는 제한) |
| 6.2 | SSH 키 로그인·sudo·배포 전용 계정 분리 |
| 6.3 | 서버 시간 NTP · 타임존(로그·스케줄 일치) |
| 6.4 | 디스크·메모리 알림(임계치) |
| 6.5 | systemd(또는 동등) **Restart=on-failure**, `LimitNOFILE` 등 |

---

## 7. 빌드 · 배포 파이프라인 · 롤백

| # | 확인 항목 |
|---|-----------|
| 7.1 | `main`/운영 브랜치 커밋 SHA 태깅·변경 요약 |
| 7.2 | Maven/프론트 빌드 **CI와 동일 명령**으로 재현 성공 |
| 7.3 | 운영 배포는 **workflow_dispatch 등 수동 게이트** 유지 — 표준 준수 |
| 7.4 | **롤백**: 이전 JAR·정적 파일 백업 경로·복구 명령·헬스 검증 |
| 7.5 | 배포 중 **다운타임 공지** 채널(기획) |

---

## 8. 관측성 · 로그 · 알림

| # | 확인 항목 |
|---|-----------|
| 8.1 | 애플리케이션 로그·액세스 로그 수집 위치·보존 기간 |
| 8.2 | 에러율·지연·5xx 알림(Slack/메일 등) |
| 8.3 | 비용·쿼터(외부 API) 모니터링 |

---

## 9. 배포 직후 스모크(필수)

| # | 시나리오 | 기대 |
|---|----------|------|
| S1 | HTTPS로 랜딩·로그인 | 200, 인증서 유효 |
| S2 | API 헬스 | `UP` |
| S3 | OAuth 한 가지 이상 | 콜백 성공 |
| S4 | 핵심 비즈니스 플로 1개(예약/결제/매핑 중 조직 정의) | 데이터 정합 |
| S5 | 테넌트 서브도메인 접속·로그아웃 | 세션·리다이렉트 정상 |
| S6 | GNB 시스템 공지 **읽음**(클릭 시 POST `/read`)·메시지 딥링크(필요 시) | 통합 알림 페이지는 푸터 링크 |

---

## 10. Go / No-Go 판정

| 조건 | 판정 |
|------|------|
| 1·2·3·4절 미충족 항목 없음 + 5.1 백업 완료 + 9절 스모크 통과 | **GO** |
| TLS/OAuth/CORS/백업 중任一 불충족 | **NO-GO** |

---

**문서 끝.** 변경 시 `docs/운영반영/README.md` 및 [PRODUCTION_DEPLOYMENT_READINESS_MEETING.md](./PRODUCTION_DEPLOYMENT_READINESS_MEETING.md)에 개정 이력을 한 줄 추가할 것.
