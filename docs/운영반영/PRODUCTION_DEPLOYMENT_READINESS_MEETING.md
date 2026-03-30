# 운영 서버 반영 준비 회의 결론

**문서 유형**: 기획(플래너) 주관 — 운영 배포 준비 회의 산출물  
**작성일**: 2025-03-17  
**개정**: 2026-02-12 — Go-Live 종합 체크리스트 신설 및 전 에이전트 합의 반영  
**추가 개정**: 2026-03-30 — 운영반영 오케스트레이션 회의안 링크 추가  
**상태**: 준비 회의용 (실제 배포 실행 없음)  
**참조**: `../standards/DEPLOYMENT_STANDARD.md`, `../guides/deployment/DEPLOYMENT_CHECKLIST.md`, `../troubleshooting/DEV_DEPLOYMENT_STABILITY_CHECKLIST.md`, `../../.cursor/skills/core-solution-deployment/SKILL.md`

### 회의 참여·의견서 링크

| 담당 | 의견서 문서 |
|------|-------------|
| **기획(플래너)** | 본 문서 |
| **테스터** | [OPERATION_DEPLOYMENT_TESTER_OPINION.md](OPERATION_DEPLOYMENT_TESTER_OPINION.md) — 배포 전/중/후 검증 체크리스트, 스모크·회귀 시나리오 |
| **디버거** | [PRODUCTION_DEPLOYMENT_DEBUGGER_OPINION.md](PRODUCTION_DEPLOYMENT_DEBUGGER_OPINION.md) — 리스크·장애 시나리오, 롤백 시 확인 항목 |
| **셸(배포·빌드)** | [SHELL_DEPLOYMENT_MEETING_NOTE.md](SHELL_DEPLOYMENT_MEETING_NOTE.md) — 빌드·스크립트·워크플로 점검 결과 |

---

## 1. 목표·범위

- **목표**: 운영 서버(beta74.cafe24.com) 반영 전, 각 담당(셸·테스터·디버거·코더)이 점검할 항목과 회의 결과를 정리하여 일관된 준비 절차를 갖춘다.
- **범위**: 체크리스트 정리, 담당별 태스크 분배, 회의 결론 요약, 서브에이전트별 기대 출력 명시. **실제 배포 실행은 하지 않음.**

---

## 2. 운영 배포 준비 관점 체크 항목

### 2.1 빌드·환경 변수·시크릿

| 항목 | 확인 내용 |
|------|-----------|
| **백엔드 빌드** | `mvn clean package -DskipTests` 성공, JAR 산출물 경로·파일명 표준 준수 (`app.jar`) |
| **프론트엔드 빌드** | `npm ci` + `npm run build:ci` (또는 동일 표준) 성공, `frontend/build/` 산출물 |
| **운영 전용 시크릿** | GitHub Secrets: `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY` 존재·유효 |
| **운영 환경 변수** | systemd 서비스 또는 서버 env: `DB_HOST`, `DB_PORT`, `DB_NAME`, `JWT_SECRET`, 암호화 키 등 표준 문서와 일치 |
| **설정 파일** | `application.yml` / 운영 프로파일에 OAuth2 provider(Apple 등) 필수 설정 포함 여부 — 개발과 동일 검증 원칙 적용 권장 |

### 2.2 DB·마이그레이션

| 항목 | 확인 내용 |
|------|-----------|
| **Flyway 마이그레이션** | 배포 브랜치(main)에 반영된 마이그레이션 파일이 빌드 JAR에 포함되는지, 기동 시 적용 순서·에러 없음 |
| **스키마·엔티티 일치** | 새 컬럼/테이블이 엔티티와 마이그레이션 양쪽에 동일하게 반영되었는지 |
| **표준화 프로시저** | 프로시저 변경 시 `deploy-procedures-prod.yml` 수동 실행 필요 여부, 배포용 SQL 파일 생성·검토 완료 |
| **운영 DB 백업** | 배포 전 백업 계획 수립 및 실행 주체·시점 명확화 |

### 2.3 헬스체크·롤백·배포 순서

| 항목 | 확인 내용 |
|------|-----------|
| **헬스체크** | `curl -f http://localhost:8080/actuator/health` 타임아웃·재시도 횟수 표준 준수(운영 60초 등) |
| **롤백 절차** | 백업 JAR 경로(`/var/www/mindgarden/app.jar.backup.*`), 복구 명령·검증 순서 문서화 및 팀 공유 |
| **배포 순서** | 1) DB 백업 → 2) (필요 시) 마이그레이션/프로시저 → 3) 백엔드 → 4) 프론트엔드(정적 파일) → 5) 서비스 재시작·헬스체크. 스케줄러/배치가 별도 프로세스면 순서에 포함 |
| **실패 시** | 헬스체크 실패 시 로그 수집(journalctl, error.log) 및 롤백 트리거 여부 |

### 2.4 모니터링·알림

| 항목 | 확인 내용 |
|------|-----------|
| **배포 알림** | 워크플로 성공/실패 시 Slack·이메일 등 알림 연동 여부 |
| **배포 후 확인** | 서비스 정상 동작, API 응답, 프론트 접근, 에러 로그·성능 모니터링 항목 정리 |

### 2.5 최근 반영 변경이 운영에 미치는 영향

| 변경 영역 | 운영 영향 점검 포인트 |
|-----------|------------------------|
| **공통 배지 모듈** | 신규 `Badge.js`/`Badge.css` 및 공통 모듈 참조가 포함된 빌드가 정적 파일에 반영되는지. 기존 페이지(어드민 대시보드, 알림/메시지, ERP, 결제 등)에서 배지 미노출·스타일 깨짐 없음 확인. |
| **B0KlA 대비·스타일 개선** | `unified-design-tokens.css`, B0KlA 관련 토큰·CSS 변경이 프론트 빌드에 포함되는지. 대비 개선으로 인한 레이아웃/색상 회귀 여부. |
| **어드민 알림/메시지 통합 UI** | AdminNotificationsPage, SystemNotificationManagement, LNB/GNB 알림 배지 등 API·경로·권한이 운영과 호환되는지. |
| **UnifiedModal·공통 컴포넌트** | 모달·헤더·스피너 등 공통 모듈 변경 시 해당 리소스가 모든 사용처에서 로드 가능한지(번들·경로). |
| **백엔드 API 변경** | SystemNotification, Admin, Schedule 등 최근 수정된 Controller/Service가 운영 DB 스키마·프로시저와 호환되는지. |

---

## 3. 담당별 태스크 분배표

| Phase | 담당 서브에이전트 | 태스크 요약 | 비고 |
|-------|-------------------|-------------|------|
| **빌드·스크립트 검증** | **shell** | 로컬 또는 CI와 동일 환경에서 `mvn clean package -DskipTests`, `npm ci` + `npm run build:ci` 실행해 빌드 성공 여부 확인. 배포 스크립트·paths 트리거 목록 점검. | 의존성 없으면 테스터·디버거와 병렬 가능 |
| **검증 체크리스트 작성·실행** | **core-tester** | 배포 전/중/후 검증 체크리스트 초안 작성 또는 기존 체크리스트와 대조. (선택) 스모크 테스트·주요 시나리오 목록. | shell 결과 확인 후 상세 시나리오 가능 |
| **리스크·장애 시나리오 정리** | **core-debugger** | 배포 실패·기동 실패·헬스체크 실패 시 원인 추적 포인트, 롤백 후 확인할 항목, 최근 변경(배지·B0KlA·알림) 관련 회귀 시나리오 1~2페이지 분량으로 정리. 코드 수정 없음. | shell·tester와 병렬 가능 |
| **배포 관련 코드·설정 점검** | **core-coder** | 워크플로 파일(`deploy-production.yml` 등) paths·헬스체크 타임아웃·롤백 단계와 표준 문서 일치 여부. 운영 전용 설정(application-prod 등) 누락·민감정보 노출 여부 검토. 필요 시 수정 제안만 또는 표준에 맞게 수정. | 디버거 리스크 문서 참고 후 보완 가능 |

- **병렬 실행**: shell / core-tester / core-debugger 는 동시에 호출 가능. core-coder는 디버거 리스크 문서를 참고한 뒤 배포 관련 코드 점검 시 일관성 있음.

---

## 4. 회의 결과 요약 (1~2페이지)

### 4.1 결론 요약

- 운영 반영 전 **표준 문서(DEPLOYMENT_STANDARD, DEPLOYMENT_CHECKLIST, DEV_DEPLOYMENT_STABILITY_CHECKLIST)** 를 기준으로 체크리스트를 채우고, **빌드·환경·DB·헬스체크·롤백·모니터링** 항목을 담당별로 나누어 점검하기로 했다.
- **최근 변경(공통 배지, B0KlA 대비·스타일, 어드민 알림 통합 UI, UnifiedModal 등)** 은 프론트 정적 빌드·백엔드 API 호환성 관점에서 영향 범위를 정리했고, 테스터·디버거가 검증 시나리오와 리스크 시나리오에서 이를 반영하기로 했다.
- **배포 순서**는 DB 백업 → (필요 시 마이그레이션/프로시저) → 백엔드 → 프론트엔드 → 재시작·헬스체크를 유지한다. 운영은 **workflow_dispatch(수동)** 만 사용하며, 배포 시간대는 비즈니스 시간(평일 9~18시) 권장을 유지한다.
- **롤백**은 기존 표준대로 백업 JAR 복구 후 서비스 재시작·헬스체크로 수행하며, 실패 시 로그 수집( journalctl, error.log ) 후 디버거 분석·코더 수정으로 이어지도록 한다.

### 4.2 다음 액션

- **shell**: 빌드·스크립트 검증 결과와 paths 트리거 점검 결과를 기획에게 보고.
- **core-tester**: 배포 전/중/후 검증 체크리스트(또는 보완안)를 기획에게 보고.
- **core-debugger**: 리스크·장애 시나리오 문서(1~2페이지)를 기획에게 보고.
- **core-coder**: 배포 관련 코드·설정 점검 결과(일치 여부·수정 제안)를 기획에게 보고.
- **기획(플래너)**: 위 보고를 취합해 최종 “운영 배포 준비 완료 체크리스트” 및 필요 시 일정·담당 재정리 후, 사용자에게 최종 보고.

---

## 5. 서브에이전트별 기대 출력

- **테스터(core-tester)에게 기대하는 출력**  
  “배포 전(빌드·환경·DB)·배포 중(업로드·재시작·헬스체크)·배포 후(서비스·API·프론트·로그)” 단계별 검증 체크리스트와, 최근 변경(공통 배지, B0KlA, 어드민 알림)이 반영된 화면·API에 대한 스모크/회귀 시나리오 목록을 1~2페이지 분량으로 작성해 기획에게 전달해 주세요.”

- **디버거(core-debugger)에게 기대하는 출력**  
  “배포 실패·기동 실패·헬스체크 실패 시 확인할 로그 위치·명령어·원인 추적 포인트와, 롤백 후 검증할 항목, 그리고 최근 반영(배지 모듈·B0KlA·알림 통합) 관련 회귀·장애 시나리오를 1~2페이지 분량으로 정리해 기획에게 전달해 주세요. 코드 수정은 하지 않습니다.”

- **셸(shell) 담당에게 기대하는 출력**  
  “운영과 동일한 빌드 명령(Maven·npm)을 로컬 또는 CI 환경에서 실행한 결과(성공/실패·에러 메시지)와, `.github/workflows` 배포 워크플로의 paths·트리거 조건 점검 결과를 요약해 기획에게 전달해 주세요.”

- **코더(core-coder)에게 기대하는 출력**  
  “`deploy-production.yml` 등 운영 배포 워크플로와 표준 문서(DEPLOYMENT_STANDARD, 체크리스트)의 일치 여부, 및 운영 전용 설정(application-prod·시크릿 사용처)의 누락·오류 여부를 점검한 결과와, 필요 시 수정 제안(또는 적용한 수정 내용)을 기획에게 전달해 주세요.”

---

## 6. 2026-02-12 전 에이전트 회의 보완 (도메인·보안·운영)

| 구분 | 합의 내용 |
|------|-----------|
| **도메인/DNS** | Apex·www·와일드카드(테넌트) 레코드가 **개발/운영 IP 혼선 없이** 분리되었는지 배포 전 `dig`/LB 콘솔로 재확인. 과거 문서의 IP는 **참고용**. |
| **TLS** | HTTPS 강제, 인증서 SAN·만료·자동 갱신, 프록시 헤더와 Spring 신뢰 설정 일치. |
| **보안** | 운영 CORS 화이트리스트, OAuth redirect 전 등록, Actuator/Swagger 최소 공개, 시크릿 비저장소화. |
| **문서 체계** | 종합 체크리스트 **`PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`** 를 단일 진입으로 사용; 기능 단위 `DEPLOYMENT_CHECKLIST.md` 는 보조. |
| **담당** | 기획(Go/No-Go)·shell(DNS/TLS/방화벽)·coder(env/CORS/OAuth)·tester(스모크 S1–S6)·debugger(롤백)·designer(브랜딩 URL)·component-manager(중복 진입점). |

상세 체크 항목·표는 **[PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](./PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)** 에서 유지한다.

---

## 7. 문서 저장 위치

- **제안 저장 위치**: `docs/운영반영/PRODUCTION_DEPLOYMENT_READINESS_MEETING.md`  
- **이유**: 기획(planning) 산출물이며, 실제 배포 실행이 아닌 “준비 회의” 결론이므로 `docs/운영반영/` 에 두고, 배포 실행 시에는 **`PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`**, `../standards/DEPLOYMENT_STANDARD.md`, `../guides/deployment/DEPLOYMENT_CHECKLIST.md` 를 함께 참조하는 구조를 유지한다.

## 8. 최신 오케스트레이션 회의안

- `docs/운영반영/GO_LIVE_ORCHESTRATION_MEETING_20260330.md`
- 목적: core-planner 주관 운영 반영 회의를 타임박스(90분), Phase 0~8, shell 런북, 테스트 게이트, RACI 서명표 기준으로 즉시 실행 가능하도록 표준화
- 주의: 실제 프로세스 종료/재기동은 승인·백업·롤백 준비 완료 후 수행

---

**문서 끝.**
