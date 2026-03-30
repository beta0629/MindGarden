# Mind Garden 운영 반영(Go-Live) 오케스트레이션 플랜

**문서 유형**: 기획(core-planner) 산출 — 실행 위임용  
**작성일**: 2026-03-23  
**상태**: 초안  
**참조**: [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](./PRE_PRODUCTION_GO_LIVE_CHECKLIST.md), [PRODUCTION_ESSENTIAL_DATA.md](../deployment/PRODUCTION_ESSENTIAL_DATA.md), [core-solution-deployment](../../.cursor/skills/core-solution-deployment/SKILL.md), [운영반영_문서정리_계획](../planning/운영반영_문서정리_계획.md)

---

## 1. 제목·목표

**제목**: Mind Garden 운영 반영(Go-Live) 전반 오케스트레이션  
**목표**: Go-Live를 위한 체크리스트·데이터 선별·문서 구조의 현황 점검을 완료하고, Phase별 서브에이전트(shell·core-debugger·core-tester·core-coder·문서정리·explore) 분배실행 표를 작성하여 배포 직전 검증·판정을 수행할 수 있도록 한다.

---

## 2. 현황 점검 결과 (기획 관점)

### 2.1 문서·체크리스트 정리 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| `docs/운영반영/` 폴더 | ✅ 정리 완료 | README, 체크리스트, 회의·의견서 6개 존재 |
| PRE_PRODUCTION_GO_LIVE_CHECKLIST | ✅ §1~§10 존재 | 도메인·TLS·CORS·OAuth·DB·인프라·스모크·Go/No-Go |
| PRODUCTION_ESSENTIAL_DATA | ✅ §1.1 원칙 명시 | 운영 테넌트 온보딩만 생성, 덤프 금지 |
| 회의·의견서 4종 | ✅ 동일 폴더에 존재 | READINESS, TESTER, DEBUGGER, SHELL |
| DEPLOYMENT_STANDARD | ✅ 참조 링크 | `docs/standards/` 에 유지, README에서 연결 |

### 2.2 데이터 선별 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| Flyway 마스터·참조 | 문서화됨 | PRODUCTION_ESSENTIAL_DATA §2 |
| 운영 필수(마이그레이션 외) | 문서화됨 | DB·JWT·메일·OAuth·PG·파일·최초 관리주체 |
| 운영 금지(덤프 X) | 문서화됨 | test-*@example.com, 개인정보, 테스트 플랜 등 |
| 온보딩 테스트 데이터 | 주의 필요 | `V20251227_*`, `insert_onboarding_test` 등 운영 프로파일 제외 검토 |

### 2.3 하드코딩 게이트 (운영 배포 전 필수)

| 항목 | 상태 | 비고 |
|------|------|------|
| ADMIN_LNB §17 / SETTINGS §1.3 | 기준 명시됨 | 검사 0건 또는 합의 예외만 문서화 |
| check-hardcode 스크립트 | ⚠️ 경로 확인 필요 | `config-old/shell-scripts/check-hardcode.sh` 존재, `config/` 이동 여부 |
| hardcoding-report (2026-03-21) | ❌ warnings 다수 | 운영 게이트 미충족 — 수정 필요 |

### 2.4 E2E·스모크 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| 체크리스트 §9 스모크 S1~S6 | 정의됨 | S1 HTTPS·S2 API·S3 OAuth·S4 비즈니스·S5 서브도메인·S6 공지 |
| E2E 스펙 | 일부 실패 보고 | admin-pg-configuration 등 git status에 실패 결과 — 원인·회귀 여부 검토 |
| 스모크 자동화 | 부분 | Playwright 기반, 운영 직후 스모크 1~2개 추가 권장(테스터 의견) |

### 2.5 배포 워크플로

| 항목 | 상태 |
|------|------|
| deploy-production.yml | ✅ 존재 |
| deploy-procedures-prod.yml | ✅ 존재 |
| workflow_dispatch 수동 게이트 | DEPLOYMENT_STANDARD 준수 |

---

## 3. 범위 (포함/제외)

| 구분 | 내용 |
|------|------|
| **포함** | (1) 현황 점검·누락 보완 (2) Phase별 서브에이전트 분배실행 (3) 하드코딩 게이트·데이터 선별·문서 정합 (4) 스모크·회귀 검증 |
| **제외** | 실제 DNS·TLS·서버 설정 변경(인프라 담당), 배포 일정·유지보수 창 결정(기획·PM) |

---

## 4. 의존성·순서

1. **선행**: 문서·체크리스트·데이터 선별 문서가 `docs/운영반영/`, `docs/deployment/`에 존재(완료).
2. **하드코딩**: 운영 게이트 통과 전까지 배포 NO-GO.
3. **스모크**: §1~§4 절 미충족 없음 + §5.1 백업 + §9 스모크 통과 → GO.

---

## 5. Phase 목록 및 분배실행 표

| Phase | 담당 | 목표 | 의존성 | 전달할 태스크 설명 요약 |
|-------|------|------|--------|-------------------------|
| **Phase 0** | **explore** | check-hardcode 경로·하드코딩 스캔 결과·Flyway 테스트 마이그레이션 현황 탐색 | 없음 | 아래 §7.1 |
| **Phase 1a** | **core-coder** | 하드코딩 게이트 충족(§17, §1.3 기준) | Phase 0 | 아래 §7.2 |
| **Phase 1b** | **generalPurpose** | PRODUCTION_ESSENTIAL_DATA §2에 테스트 마이그레이션 파일명·운영 제외 정책 반영 | Phase 0 | 아래 §7.3 |
| **Phase 2** | **shell** | DNS·TLS·배포 파이프라인·인프라 체크리스트 §1~§2, §6~§7 현장 검증 | 없음 | 아래 §7.4 |
| **Phase 3** | **core-coder** | application-prod·CORS·OAuth·환경변수 §3~§4 검증 | 없음 | 아래 §7.5 |
| **Phase 4** | **core-tester** | §9 스모크 S1~S6 실행·회귀 검증·증적 | Phase 1a | 아래 §7.6 |
| **Phase 5** | **core-debugger** | 장애 시나리오·롤백 검증·로그 위치·알려진 이슈 점검 | 없음 | 아래 §7.7 |
| **Phase 6** | **기획** | Go/No-Go 판정·최종 보고 | Phase 1~5 | 체크리스트 §10 기준 |

**병렬 가능**: Phase 0 완료 후 Phase 1a·1b 병렬. Phase 2·3·5는 서로 독립이므로 병렬 가능.

---

## 6. 리스크·제약

| 구분 | 내용 |
|------|------|
| **운영 테넌트** | Mind Garden 온보딩으로만 생성. 개발 DB 덤프 금지(PRODUCTION_ESSENTIAL_DATA §1.1) |
| **하드코딩** | 검사·스캔에 걸리면 운영 전까지 전부 수정. 예외는 문서화된 합의 목록만 |
| **스테이징 부재** | 개발→운영 직행 시 환경 차이로 인한 오동작 발견 어려움 — 스테이징 활용 권장 |

---

## 7. Phase별 전달할 태스크 설명 (실행 위임문)

### 7.1 Phase 0 — explore

**목적**: check-hardcode 스크립트 경로·실행 방법, Flyway 테스트 마이그레이션 파일 현황, 하드코딩 스캔 결과 요약 파악.

**전달 프롬프트 요약**:
> "Mind Garden 저장소에서 다음을 탐색해 주세요.
> 1. `check-hardcode` 또는 `check-hardcode.sh` 스크립트의 **실제 경로**와 실행 방법(예: `./check-hardcode.sh` 또는 `npm run check:hardcode`). `config/`, `config-old/`, `scripts/` 등 검색.
> 2. Flyway 마이그레이션 중 **테스트 데이터 삽입**이 포함된 파일(`*test*`, `*onboarding_test*`, `insert_onboarding_test` 등)의 목록과 파일명 패턴.
> 3. `test-reports/hardcoding/` 또는 동일 목적 디렉터리에 있는 최신 하드코딩 리포트의 **errors/warnings 건수 요약**과, 운영 게이트 기준(0건 또는 합의 예외만) 충족 여부.
> 산출: (1) 스크립트 경로·실행 예시 (2) 테스트 마이그레이션 파일 목록 (3) 하드코딩 현황 요약 1~2문단."

**적용 스킬**: 없음(탐색 전용).

---

### 7.2 Phase 1a — core-coder

**목적**: ADMIN_LNB §17, SETTINGS §1.3, PRE_PRODUCTION_GO_LIVE_CHECKLIST 하드코딩 게이트 충족. 검사 0건 또는 합의 예외만 문서화.

**전달 프롬프트 요약**:
> "운영 반영(Go-Live) 전 하드코딩 게이트를 충족해 주세요. 참조: `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17, `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`, `docs/운영반영/GO_LIVE_ORCHESTRATION_PLAN.md`.
> 1. Phase 0(explore)에서 확인한 `check-hardcode` 스크립트를 실행하고, **검사 결과에 나온 파일·라인을 전부 수정**한 뒤 재실행하여 0건(또는 합의 예외만)으로 맞춰 주세요.
> 2. 색상·URL·상태값·비밀 등 §17.1 원칙에 맞게 토큰화·환경변수·공통코드로 치환해 주세요.
> 3. `frontend`에서 `npm run build:ci` 통과를 확인해 주세요.
> 완료 조건: 하드코딩 검사 0건(또는 문서화된 예외만), `npm run build:ci` 통과."

**적용 스킬**: `/core-solution-frontend`, `/core-solution-standardization`, `/core-solution-backend`.

---

### 7.3 Phase 1b — generalPurpose (문서정리)

**목적**: PRODUCTION_ESSENTIAL_DATA §2에 Flyway 테스트 마이그레이션 파일명·운영 프로파일 제외 정책 반영.

**전달 프롬프트 요약**:
> "`docs/deployment/PRODUCTION_ESSENTIAL_DATA.md` §2 'Flyway로 이미 들어오는 것' 절을 보강해 주세요. Phase 0(explore)에서 확인한 **테스트 데이터 삽입 마이그레이션** 파일명 패턴(예: `*test*`, `insert_onboarding_test`, `V20251227_*` 등)을 §2 하단 또는 별도 단락에 추가하고, **운영 프로파일에서 제외·차단**하는 정책을 명시해 주세요. 기존 §2 테이블 형식과 톤을 유지하면서, '주의' 문단을 확장하거나 '운영 제외 마이그레이션' 소절을 새로 두면 됩니다. `/core-solution-documentation` 스킬 참조."

**적용 스킬**: `/core-solution-documentation`.

---

### 7.4 Phase 2 — shell

**목적**: PRE_PRODUCTION_GO_LIVE_CHECKLIST §1(도메인·DNS·서브도메인), §2(TLS·인증서·리버스 프록시), §6(인프라·네트워크), §7(빌드·배포·롤백) 항목의 현장 검증.

**전달 프롬프트 요약**:
> "운영 반영 체크리스트의 shell 담당 항목을 검증해 주세요. 참조: `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` §1.1~1.3, §2.1~2.5, §6.1~6.5, §7.1~7.5. 실제 운영 환경(또는 스테이징)에 대해:
> 1. §1: Apex·www·와일드카드 DNS, 이메일 레코드(SPF/DKIM 등) 존재·전파 확인. `dig` 등으로 검증 가능한 항목 실행.
> 2. §2: HTTPS 강제, 인증서 SAN·만료일·갱신, 프록시 헤더·압축·타임아웃 확인.
> 3. §6: 방화벽 포트·SSH·NTP·디스크·systemd 설정 확인.
> 4. §7: main/운영 브랜치 태깅·빌드 재현·롤백 경로·다운타임 공지 채널 확인.
> 산출: 각 절별 '완료/미완료/해당없음' 및 증적 예시(명령·출력 요약) 1~2문단. IP·호스트명 등 민감 정보는 마스킹."

**적용 스킬**: `/core-solution-deployment`, `/core-solution-server-status`.

---

### 7.5 Phase 3 — core-coder

**목적**: application-prod·CORS·OAuth·API Base URL·Actuator 등 §3~§4 검증 및 필요 시 수정.

**전달 프롬프트 요약**:
> "운영 반영 체크리스트의 coder 담당 항목을 검증·수정해 주세요. 참조: `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` §3.1~3.5, §4.1~4.7. 
> 1. §3: 프론트 빌드 시 API Base URL·REACT_APP_* 운영값, CORS 허용 Origin 화이트리스트(운영에서 `*` 금지), WebSocket/SSE, Actuator/Swagger 공개 범위, 헬스체크 경로.
> 2. §4: OAuth 리디렉션 URI 운영 도메인 등록, JWT/DB/PG/API 키 Git 무기입, 세션 제한, HSTS/X-Frame-Options/CSP, PG 웹훅 URL, 파일 업로드 경로·검증.
> `application-prod.yml`(또는 동일 프로파일), 프론트 env, CORS 설정을 점검하고, 불일치 시 수정해 주세요. 완료 조건: 체크리스트 §3·§4 coder 항목 전부 충족."

**적용 스킬**: `/core-solution-deployment`, `/core-solution-frontend`, `/core-solution-api`.

---

### 7.6 Phase 4 — core-tester

**목적**: PRE_PRODUCTION_GO_LIVE_CHECKLIST §9 스모크 S1~S6 실행, 회귀 검증, 증적(스크린샷·로그) 확보.

**전달 프롬프트 요약**:
> "운영 반영 체크리스트 §9 '배포 직후 스모크'를 실행해 주세요. 참조: `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` §9, `docs/운영반영/OPERATION_DEPLOYMENT_TESTER_OPINION.md`. 
> 시나리오: S1 HTTPS 랜딩·로그인, S2 API 헬스, S3 OAuth 한 가지 이상, S4 핵심 비즈니스 플로 1개, S5 테넌트 서브도메인·로그아웃, S6 GNB 시스템 공지 읽음. 
> 스테이징 또는 개발 환경에서 동일 빌드로 수행 가능. 각 시나리오별 기대 결과(200, UP, 콜백 성공 등)와 실제 결과, 스크린샷·로그 요약을 증적으로 남겨 주세요. E2E 스펙(admin-pg-configuration 등) 실패 원인 분석 및 수정·회귀 방지도 포함해 주세요. `/core-solution-testing` 스킬 참조."

**적용 스킬**: `/core-solution-testing`.

---

### 7.7 Phase 5 — core-debugger

**목적**: 장애 시 로그 위치·롤백 검증·알려진 이슈(서브도메인 로그아웃 등) 점검. 코드 수정 없이 분석·제안만.

**전달 프롬프트 요약**:
> "운영 반영 시 예상 리스크·장애 시나리오와 롤백 시 확인사항를 점검해 주세요. 참조: `docs/운영반영/PRODUCTION_DEPLOYMENT_DEBUGGER_OPINION.md`, `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` §8(관측성·로그·알림). 
> 1. 알림/메시지 TypeError(n.filter), B0KlA 차트 데이터 없음, 공통 배지·UnifiedModal·NotificationContext 의존 경로 등 1.1~1.3 시나리오의 **현재 코드·설정 기준** 재확인.
> 2. 로그 수집 위치(journalctl, error.log), 헬스체크 경로, 롤백 시 로그 보관·캐시 비우기·DB 롤백 필요 여부를 체크리스트 형태로 정리.
> 3. 서브도메인 로그아웃 등 알려진 이슈가 문서에 반영되어 있는지 확인. 
> 산출: 점검 결과 요약 1~2페이지, 누락된 리스크·확인 항목이 있으면 추가 제안. 코드 수정은 하지 않습니다."

**적용 스킬**: `/core-solution-debug`.

---

## 8. 누락·보완 항목 정리

| 구분 | 항목 | 조치 |
|------|------|------|
| **문서** | check-hardcode 스크립트 경로 | Phase 0 탐색 후 `config/` vs `config-old/` 확정, README·체크리스트에 반영 |
| **문서** | PRODUCTION_ESSENTIAL_DATA 테스트 마이그레이션 | Phase 1b에서 §2 보강 |
| **하드코딩** | 2026-03-21 리포트 warnings 다수 | Phase 1a에서 core-coder가 수정·재검사 |
| **E2E** | admin-pg-configuration 등 실패 | Phase 4에서 core-tester가 원인 분석·수정 |
| **스모크** | S1~S6 자동화 | 테스터 의견대로 1~2개 Playwright 시나리오 추가 권장(별도 Phase 가능) |
| **데이터** | Flyway 운영 프로파일에서 테스트 마이그레이션 제외 | Phase 1b·core-coder 협의로 정책 명시 |

---

## 9. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 |
|-------|-----------|
| Phase 0 | 스크립트 경로·테스트 마이그레이션 목록·하드코딩 현황 요약 산출 |
| Phase 1a | 하드코딩 검사 0건(또는 문서화 예외만), `npm run build:ci` 통과 |
| Phase 1b | PRODUCTION_ESSENTIAL_DATA §2 테스트 마이그레이션·운영 제외 정책 반영 |
| Phase 2 | §1·§2·§6·§7 shell 항목 검증 완료, 증적 요약 |
| Phase 3 | §3·§4 coder 항목 충족 |
| Phase 4 | S1~S6 스모크 실행·증적·E2E 실패 해소 |
| Phase 5 | 리스크·롤백 점검 요약 산출 |
| Phase 6 | §1~§4 미충족 없음 + §5.1 백업 + §9 스모크 통과 → **GO** 판정 |

---

## 10. 실행 요청문

**다음 순서로 서브에이전트를 호출해 주세요.**

1. **Phase 0**: `explore` — §7.1 프롬프트로 check-hardcode 경로·Flyway 테스트 마이그레이션·하드코딩 현황 탐색. 결과를 기획에게 보고.
2. **Phase 1a·1b**(Phase 0 완료 후 병렬):  
   - `core-coder` — §7.2 프롬프트로 하드코딩 게이트 충족.  
   - `generalPurpose` — §7.3 프롬프트로 PRODUCTION_ESSENTIAL_DATA §2 보강.
3. **Phase 2·3·5**(병렬 가능):  
   - `shell` — §7.4 프롬프트로 DNS·TLS·인프라·배포 검증.  
   - `core-coder` — §7.5 프롬프트로 application-prod·CORS·OAuth 검증.  
   - `core-debugger` — §7.7 프롬프트로 리스크·롤백 점검.
4. **Phase 4**: `core-tester` — §7.6 프롬프트로 스모크 S1~S6·회귀 검증.
5. **Phase 6**: 기획이 Phase 1~5 결과를 취합하여 §10 Go/No-Go 판정 및 사용자에게 최종 보고.

---

**문서 끝.** 변경 시 `docs/운영반영/README.md`에 링크 추가.
