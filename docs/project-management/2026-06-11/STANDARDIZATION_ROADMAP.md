# 2026-06-11 표준화 로드맵 (Standardization Roadmap)

> **버전**: v2 (2026-06-12 새벽 PR 시리즈 반영)
> **작성자**: core-planner (오케스트레이터)
> **작성일**: 2026-06-11 (v1) → 2026-06-12 (v2 업데이트)
> **목적**: 본일 세션에서 디버거·코더·explore 보고서에 누적 언급된 "후속 표준화" 항목을 카테고리별로 정리하고, 우선순위·위임 대상·Phase를 명확히 분배하여 운영 반영 안정성·admin override 0 정책·보안 강화를 체계적으로 진행하기 위한 단일 진입 문서.
> **범위**: 코드 변경 금지 — 본 문서는 docs 작성 + 위임 계획만 다룬다. 실제 실행은 분배실행 표대로 각 서브에이전트에 위임한다.
> **v2 변경 요약**: 신규 6종 항목(A4·B5·B6·B7·C6·C7) 추가 + Phase 재분배 (38 → 44개). 상세 diff는 §부록 B 참조.

---

## 0. 인용 소스

### 0.1 v1 (Session 2026-06-11)

| 약식 ID | 유형 | 인용 위치 |
|---|---|---|
| [a73567ad] | core-debugger | PR #226 hotfix 정밀 재진단 §A·B·C |
| [ab99762b] | core-debugger | npm 빌드 진단 §F |
| [57eb1a87] | explore | 멀티 역할 로그인 분석 §B·E |
| [af09fc9a] | core-coder | PR #224 SMS 회귀 보고 |
| [b714bc91] | core-coder | PR #227 NCP SENS 후속 PR 권장 |
| [33daeb86] | core-coder | PR #228 §사전 커밋 훅 하드코딩 정리 권고 |
| [e5c366d1] | core-coder | Phase B 이메일 §보안 결함 동봉 |

### 0.2 v2 추가 (Session 2026-06-12 새벽)

| 약식 ID | PR | 유형 | 표준화 항목 | 인용 위치 |
|---|---|---|---|---|
| [79bf2536] | [#234](https://github.com/beta0629/MindGarden/pull/234) | hotfix | A4 (SecurityContext leak 정리) | controller 단위 테스트 ThreadLocal leak → 다음 테스트 500L 회귀 |
| [af5a3633] | [#232](https://github.com/beta0629/MindGarden/pull/232) | CI 인프라 | C6 (CI heap + fork) | 244 IT 누적 `-Xmx3g` OOM → `Process Exit Code: 3` cancel |
| [c842ab14] | [#233](https://github.com/beta0629/MindGarden/pull/233) | CI 인프라 | C7 (CI workflow timeout) | `code-quality-check.yml` 30m hard timeout cancel |
| [8f8c4fb4] | [#227 cascade fix](https://github.com/beta0629/MindGarden/pull/227) | hotfix | B5 (다중 생성자 `@Autowired`) | `SmsGatewayServiceImpl` `NoSuchMethodException: <init>()` cascade |
| [2f1ae89f] | [#231](https://github.com/beta0629/MindGarden/pull/231) | 진단·hotfix | B6/B7 (FE dedup + BE 응답 최적화) | mypage `/auth/current-user` 9회 중복(4.5초), BE 256~1025ms |

---

## 1. 카테고리별 항목 매트릭스

> **컬럼 정의**
> - **우선순위**: P0(운영 보안 즉시), P1(1주 내), P2(1개월 내), P3(검토 후 결정)
> - **위임**: core-coder / core-debugger / core-deployer / core-tester / explore / generalPurpose(문서) / 사용자(외부)
> - **예상**: S(≤0.5d), M(0.5~2d), L(2d↑)
> - **의존성**: 선행 PR/조치/머지

---

### A. 테스트 격리 표준 (P1)

| ID | 항목 | 발견 소스 | 우선순위 | 위임 | 예상 | 의존성 |
|---|---|---|---|---|---|---|
| A1 | `AbstractTenantIsolatedTest` 공통 베이스 도입 (TENANT 36자 + `@AfterEach TenantContextHolder.clear()`) | [a73567ad] §B-5 옵션 3 | P1 | core-coder | M | hotfix-4 머지 |
| A2 | failsafe `reuseForks=true` ThreadLocal leak 회귀 차단 — 모든 IT의 ThreadLocal 정리 표준 신설 | [a73567ad] §B | P1 | core-tester → core-coder | M | A1 |
| A3 | CI Java timezone 표준화 — hotfix-4의 `argLine`(`-Duser.timezone=Asia/Seoul`) 패턴을 전사 표준으로 | [a73567ad] §A-3 | P1 | core-deployer | S | 없음 |
| **A4** | **SecurityContext leak 정리 표준** — 모든 controller 단위 테스트에 `@AfterEach SecurityContextHolder.clearContext()` 일괄 적용 + (가능 시) `AbstractSecurityIsolatedTest` 베이스 클래스 도입 | [79bf2536] PR #234 | **P1** | core-coder + explore | M | hotfix #234 머지 |

---

### B. 운영 보안 강화 (P0/P1)

| ID | 항목 | 발견 소스 | 우선순위 | 위임 | 예상 | 의존성 |
|---|---|---|---|---|---|---|
| B1 | `SessionBasedAuthenticationFilter.java`(line 185·270·309) `TenantContextHolder.clear()` finally 가드 — 운영 thread-pool 재사용 leak 차단 | [a73567ad] §B-4 | **P0** | core-coder | S | 없음 |
| B2 | silent first 패턴 잔존 점검 — `UserService` 다른 finder(이메일 로그인 등) | [57eb1a87] §B | P1 | explore → core-coder | M | 없음 |
| B3 | `AuditableTenantBase.tenantId @Column(length=36)` 정책 결정 (확장 vs 보존) | [a73567ad] §A | P1 | core-debugger → 사용자 | S | A1 |
| B4 | OTP body 평문 노출 전수 검색 (PR #227 외 잔존) | [b714bc91] | **P0** | explore → core-coder | M | PR #227 머지 |
| **B5** | **다중 생성자 `@Autowired` 명시 정책** — Spring Bean 다중 생성자(production + 테스트 RestTemplate 주입 등)에 production 생성자 `@Autowired` 명시 필수. 코드 표준 문서화 + SpotBugs/Checkstyle 검출 룰 검토 | [8f8c4fb4] PR #227 cascade | **P1** | core-coder + generalPurpose(문서) | M | PR #227 머지 |
| **B6** | **FE 중복 API 호출 dedup 표준 (sessionManager in-flight promise)** — `/auth/current-user` 9회 중복(4.5초 누적), `consultation-messages/all` 2회, `menus/lnb` 2회 → in-flight promise dedup 패턴 명문화 + admin/dashboard·/erp/*·/admin/integrated-schedule 등 다른 화면 스캔 + `SessionContext`+`useSession()` 우선 사용(Direct fetch 금지) | [2f1ae89f] PR #231 mypage | **P1** | explore (스캔) + core-coder (필요 시 hotfix) | M | PR #231 머지 |
| **B7** | **BE `/api/v1/auth/current-user` 응답 시간 최적화** — 실측 256~1025ms → 100ms 이내 목표. DB 인덱스 점검 + AuditLog 비동기 처리 + 외부 호출 최소화 | [2f1ae89f] PR #231 후속 | **P1** | core-debugger → core-coder | M | B6 진단 결과 반영 |

---

### C. 인프라 표준화 (P2)

| ID | 항목 | 발견 소스 | 우선순위 | 위임 | 예상 | 의존성 |
|---|---|---|---|---|---|---|
| C1 | `ci-bi-protection.yml` Node 18→20 (react-router 7 요구) | [ab99762b] §F | P2 | core-deployer | S | 없음 |
| C2 | 모든 워크플로 Node 20 통일 | [ab99762b] §F | P2 | core-deployer | S | C1 |
| C3 | pre-commit lint 게이트 — ESLint error 사전 차단 | [ab99762b] §F | P2 | core-coder | M | 없음 |
| C4 | 운영 BE Dockerfile/systemd `JAVA_TOOL_OPTIONS=-Duser.timezone=Asia/Seoul` 통일 | [a73567ad] §A-3 옵션 3 | P2 | core-deployer | M | A3 |
| C5 | 워크플로 systemctl restart 통합 — dev(PR #219) 패턴을 prod에도 적용 (현재 prod는 blue/green 분리) | (세션 누적) | P3 | core-deployer | L | 운영 영향 평가 |
| **C6** | **CI runner JVM heap + fork 표준** — `pom.xml` failsafe `forkCount=2 reuseForks=false -Xmx3g -Xms512m` 패턴 명문화. surefire 등 다른 plugin 에도 검토. 244 IT 누적 OOM 회귀 차단 | [af5a3633] PR #232 | **P1** | core-coder | M | PR #232 머지 |
| **C7** | **CI workflow timeout 표준** — 통합 테스트 50분, 단위 테스트 20분, 정적 검사 15분 명문화. `code-quality-check.yml`의 30m 한계 회귀 차단 | [c842ab14] PR #233 | **P2** | core-deployer | S | PR #233 머지 |

---

### D. OAuth/인증 표준화 (P1/P2)

| ID | 항목 | 발견 소스 | 우선순위 | 위임 | 예상 | 의존성 |
|---|---|---|---|---|---|---|
| D1 | OAuth REGISTERED_URLS GitHub Secrets 4종 등록 (Kakao/Naver/Google/Apple Console 1:1 매칭) | 외부 | P1 | **사용자(외부)** | S | 없음 |
| D2 | apex 단일 redirect_uri 정책 명문화 (PR #223 docs 완료) — 운영 Console 사용자 액션 남음 | 외부 | P1 | **사용자(외부)** | S | D1 |
| D3 | Apple/Google/Naver/Kakao callback 통합 분기 표준 (`OAuth2Controller` 분기 정리) | [57eb1a87] §E | P2 | core-debugger → core-coder | L | D1 |
| D4 | SPA `/oauth-account-selection` 라우트 등록 | [57eb1a87] §E | P2 | core-coder | S | 없음 |
| D5 | 멀티 테넌트 cross-tenant 정책 재검토 (`checkMultiTenantUser` 봉인) | [57eb1a87] §B 가설 D | P3 | core-debugger → 사용자 | M | B2 |

---

### E. SMS/OTP 표준화 (P0/P1)

| ID | 항목 | 발견 소스 | 우선순위 | 위임 | 예상 | 의존성 |
|---|---|---|---|---|---|---|
| E1 | NCP SENS 4종 GitHub Secrets 등록 | [b714bc91] | **P0** | **사용자(외부)** | S | PR #227 머지 |
| E2 | SMS 게이트웨이 다중 어댑터 (Aligo·AWS SNS) — 현재 NCP SENS only | [af09fc9a]/[b714bc91] | P2 | core-coder | L | E1 |
| E3 | expo-app push OTP 핸들러 (`data.purpose === "OTP"` → `/otp/current`) — OTA 가능 별도 PR | [b714bc91] | P1 | core-coder | M | OTA 정책 |
| E4 | Phase B 이메일 변경 push-first 확장 (PR #227 패턴을 이메일 OTP에도) | [e5c366d1] | P2 | core-coder | M | E3 |
| E5 | `AuditAction.OTP_SENT` 사용 통일 — 추가 사용 영역 점검 | [b714bc91] | P2 | explore → core-coder | S | 없음 |

---

### F. 타임존/로케일 표준 (P1)

| ID | 항목 | 발견 소스 | 우선순위 | 위임 | 예상 | 의존성 |
|---|---|---|---|---|---|---|
| F1 | `application.yml`/`application-test.yml` `hibernate.jdbc.time_zone: Asia/Seoul` 통일 | [a73567ad] §A-3 옵션 2 | P1 | core-coder | S | 없음 |
| F2 | `TimeZoneConfig.@PostConstruct` 제거 + 시스템 환경변수 통일 (fundamental) | [a73567ad] §A-3 옵션 3 | P2 | core-coder | M | C4, F1 |
| F3 | `docs/standards/TIMEZONE_STANDARD.md` 신규 | (세션 누적) | P2 | generalPurpose(문서) | S | F1·F2 결정 후 |

---

### G. 모니터링/관측성 (P2) — 사용자 외부 액션 포함

| ID | 항목 | 발견 소스 | 우선순위 | 위임 | 예상 | 의존성 |
|---|---|---|---|---|---|---|
| G1 | Prometheus 알람 `oauth2_callback_tenant_unresolved_total` (PR #218 메트릭 활성화) | (세션 누적) | P2 | **사용자(DevOps)** | M | PR #218 운영 반영 |
| G2 | SMS gateway stub mode 알람 (`[OPS-ALERT] SMS stub mode in production` ERROR 임계치) | [af09fc9a] | P1 | **사용자(DevOps)** | S | E1 |
| G3 | OTP 발송 채널 분포 메트릭 (PUSH/SMS/SMS_STUB/FAILED) | [b714bc91] | P2 | core-coder + DevOps | M | E1 |
| G4 | AuditLog 모니터링 대시보드 (USER_PHONE_CHANGE, USER_EMAIL_CHANGE, OTP_SENT 등 신규 액션) | [b714bc91]/[e5c366d1] | P2 | **사용자(DevOps)** | M | E5 |

---

### H. Docs/Standards (P2)

| ID | 항목 | 발견 소스 | 우선순위 | 위임 | 예상 | 의존성 |
|---|---|---|---|---|---|---|
| H1 | `docs/standards/TIMEZONE_STANDARD.md` (= F3) | (세션 누적) | P2 | generalPurpose(문서) | S | F1·F2 |
| H2 | `docs/standards/TEST_ISOLATION_STANDARD.md` (TENANT + @AfterEach + ThreadLocal) | (세션 누적) | P2 | generalPurpose(문서) | S | A1·A2 |
| H3 | `docs/standards/OAUTH_STANDARD.md` (4 provider 통합) | (세션 누적) | P2 | generalPurpose(문서) | M | D3 |
| H4 | `docs/standards/OTP_DELIVERY_STANDARD.md` (push-first + SMS 폴백) | (세션 누적) | P2 | generalPurpose(문서) | S | E3·E4 |
| H5 | `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 하드코딩 게이트 강화 | [33daeb86] | P1 | generalPurpose(문서) | S | 없음 |
| H6 | 사전커밋 hardcoding 검사 강화 (운영 게이트 기준 일치) | [33daeb86] | P1 | core-coder | M | H5 |

---

### I. 데이터/마이그레이션 (P2)

| ID | 항목 | 발견 소스 | 우선순위 | 위임 | 예상 | 의존성 |
|---|---|---|---|---|---|---|
| I1 | 운영 DB 잔여 base64 row 스캔 (PR #171 이후 자동 변환 활성화 잔존) | OPS_GUIDE §5 | P2 | shell → core-coder | M | 없음 |
| I2 | `users.profile_image_url longtext → varchar(500)` Flyway V20260609_002 운영 점검 (완료, 점검만) | (배포 후속) | P3 | shell | S | 완료 |
| I3 | `mind_garden` 레거시 schema 완전 정리 (PR #217 차단 후 DBA 수동 DROP) | (세션 누적) | P2 | **사용자(DBA)** | M | 백업 확인 |

---

## 2. Phase 분배 (실행 순서)

### Phase 1 — 즉시 (admin override 0 정책 복귀 + P0/P1, 1주 내)

> 운영 보안·테스트 격리·OTP/SMS 활성화에 직결되는 항목. **이번 주 안에 끝낸다.**

| ID | 항목 요약 | 위임 |
|---|---|---|
| **B1** | SessionBasedAuthenticationFilter `clear()` finally 가드 | core-coder |
| **B4** | OTP body 평문 노출 전수 검색·치환 | explore → core-coder |
| **E1** | NCP SENS 4종 GitHub Secrets 등록 | **사용자(외부)** |
| **E3** | expo-app push OTP 핸들러 | core-coder |
| **A1** | `AbstractTenantIsolatedTest` 공통 베이스 도입 | core-coder |
| **A2** | failsafe ThreadLocal leak 회귀 차단 | core-tester → core-coder |
| **A3** | CI Java timezone 표준화(`argLine`) | core-deployer |
| **F1** | `hibernate.jdbc.time_zone: Asia/Seoul` 통일 | core-coder |
| **H5** | PRE_PRODUCTION_GO_LIVE_CHECKLIST 하드코딩 게이트 강화 | generalPurpose(문서) |
| **H6** | 사전커밋 hardcoding 검사 강화 | core-coder |
| **G2** | SMS gateway stub mode 알람 | **사용자(DevOps)** |
| **A4** | SecurityContext leak 정리 표준 (`@AfterEach SecurityContextHolder.clearContext()` 일괄) | core-coder + explore |
| **B5** | 다중 생성자 `@Autowired` 명시 정책 (Spring Bean 표준 + 문서) | core-coder + generalPurpose(문서) |
| **B6** | FE 중복 API 호출 dedup 표준 (sessionManager in-flight promise) | explore (스캔) + core-coder (필요 시 hotfix) |
| **B7** | BE `/auth/current-user` 응답 시간 최적화 (100ms 이내 목표) | core-debugger → core-coder |
| **C6** | CI runner JVM heap + fork 표준 (failsafe `forkCount=2 reuseForks=false -Xmx3g`) | core-coder |

**Phase 1 항목 수**: **16개** (코드 11 + 외부 3 + 문서 2)
**v2 추가**: A4, B5, B6, B7, C6 (5개)

---

### Phase 2 — 1주~1개월 (운영 안정성·OAuth 정리·관측성)

| ID | 항목 요약 | 위임 |
|---|---|---|
| B2 | UserService silent first 패턴 잔존 점검 | explore → core-coder |
| B3 | `AuditableTenantBase.tenantId length` 정책 결정 | core-debugger → 사용자 |
| C1 | `ci-bi-protection.yml` Node 18→20 | core-deployer |
| C2 | 모든 워크플로 Node 20 통일 | core-deployer |
| C3 | pre-commit lint 게이트 (ESLint error 차단) | core-coder |
| C4 | 운영 BE `JAVA_TOOL_OPTIONS` 통일 | core-deployer |
| D3 | OAuth2Controller 4 provider 분기 정리 | core-debugger → core-coder |
| D4 | SPA `/oauth-account-selection` 라우트 | core-coder |
| E2 | SMS 다중 어댑터 (Aligo·AWS SNS) | core-coder |
| E4 | Phase B 이메일 변경 push-first 확장 | core-coder |
| E5 | `AuditAction.OTP_SENT` 사용 통일 | explore → core-coder |
| F2 | `TimeZoneConfig.@PostConstruct` 제거 | core-coder |
| G1 | Prometheus `oauth2_callback_tenant_unresolved_total` 알람 | **사용자(DevOps)** |
| G3 | OTP 채널 분포 메트릭 | core-coder + DevOps |
| G4 | AuditLog 모니터링 대시보드 | **사용자(DevOps)** |
| I1 | 운영 DB 잔여 base64 row 스캔 | shell → core-coder |
| I3 | mind_garden 레거시 schema DROP | **사용자(DBA)** |
| **C7** | CI workflow timeout 표준 (IT 50m / 단위 20m / 정적 15m 명문화) | core-deployer |

**Phase 2 항목 수**: **18개** (코드 11 + 외부 4 + 인프라 3)
**v2 추가**: C7 (1개)

---

### Phase 3 — 1개월 내 (표준 문서화 + 검토 후 결정)

| ID | 항목 요약 | 위임 |
|---|---|---|
| C5 | 워크플로 prod systemctl restart 통합 (blue/green 영향 평가 후) | core-deployer |
| D1 | OAuth REGISTERED_URLS 4종 GitHub Secrets | **사용자(외부)** |
| D2 | apex 단일 redirect_uri Console 반영 | **사용자(외부)** |
| D5 | 멀티 테넌트 cross-tenant 정책 재검토 | core-debugger → 사용자 |
| F3/H1 | `TIMEZONE_STANDARD.md` 신규 | generalPurpose(문서) |
| H2 | `TEST_ISOLATION_STANDARD.md` 신규 | generalPurpose(문서) |
| H3 | `OAUTH_STANDARD.md` 신규 | generalPurpose(문서) |
| H4 | `OTP_DELIVERY_STANDARD.md` 신규 | generalPurpose(문서) |
| I2 | Flyway V20260609_002 운영 점검 | shell |

**Phase 3 항목 수**: 9개 (문서 4 + 외부 3 + 검토 2)
**v2 변동 없음**

---

### Phase 합계 (v2)

| Phase | v1 항목 수 | v2 항목 수 | 변동 |
|---|---|---|---|
| Phase 1 | 11 | **16** | +5 (A4·B5·B6·B7·C6) |
| Phase 2 | 17 | **18** | +1 (C7) |
| Phase 3 | 9 | 9 | — |
| **총합** | **38** | **44** | **+6** |

---

## 3. 분배실행 (Phase 1 즉시 시작 시) — 호출 예시

> 부모 에이전트가 의존성 없는 항목을 **병렬**로 호출할 수 있도록 Phase 1 기준 분배실행 표를 제공한다. 각 프롬프트 초안은 호출 시 사용자 컨텍스트를 보강해 전달한다.

| Slot | subagent_type | 전달 prompt 요약 | 적용 스킬 | 병렬? |
|---|---|---|---|---|
| ① | **core-coder** | "**B1** `src/main/java/.../SessionBasedAuthenticationFilter.java`의 line 185·270·309에서 `TenantContextHolder.clear()`를 `finally` 가드로 감싸 thread-pool 재사용 leak을 차단하라. PR #226 hotfix-4 패턴 참조. 회귀 테스트 추가." | `/core-solution-backend`, `/core-solution-multi-tenant` | ✅ |
| ② | **explore** | "**B4** OTP body 평문 노출 전수 검색 — `MobilePushDispatchService`, `SmsOtpVerificationService`, `expo-app/src/services/PushNotification*` 영역에서 OTP 코드가 `data`·`title`·`body`에 평문으로 들어가는 위치를 리스트업. PR #227 패턴(masked body) 외 잔존을 보고." | (탐색) | ✅ |
| ③ | **core-coder** | "**E3** expo-app push 핸들러에 `data.purpose === 'OTP'` 분기 추가 → `/otp/current` 화면으로 라우팅. PR #227 백엔드 페이로드 매칭. OTA 가능 별도 PR." | `/core-solution-frontend` | ✅ |
| ④ | **core-coder** | "**A1** `src/test/java/.../base/AbstractTenantIsolatedTest.java` 신규 — TENANT UUID 36자 상수 + `@AfterEach` `TenantContextHolder.clear()`. 기존 IT 마이그레이션 가이드 1개 샘플 포함." | `/core-solution-testing` | ⚠ A2 선행 |
| ⑤ | **core-tester** | "**A2** failsafe `reuseForks=true` ThreadLocal leak 시나리오 회귀 테스트 — 두 IT 가 동일 fork 에서 순서대로 실행될 때 TenantContextHolder leak 검출 케이스." | `/core-solution-testing` | ✅ (① ② ③ 와 병렬) |
| ⑥ | **core-deployer** | "**A3** `.github/workflows/*.yml`의 maven/gradle 호출에 `-Duser.timezone=Asia/Seoul` `argLine` 통일. hotfix-4 적용 패턴을 전사 표준으로 확장. 변경 파일과 워크플로명 보고." | `/core-solution-deployment` | ✅ |
| ⑦ | **core-coder** | "**F1** `src/main/resources/application.yml` + `application-test.yml` 에 `spring.jpa.properties.hibernate.jdbc.time_zone: Asia/Seoul` 통일. 차이점·기존 설정과 충돌 여부 보고." | `/core-solution-backend` | ✅ |
| ⑧ | **generalPurpose(문서)** | "**H5** `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 하드코딩 게이트 절차 강화 — pre-commit 통과 ≠ 운영 게이트 통과 명문화, `check-hardcode` 실행 절차 포함." | `/core-solution-documentation`, `/core-solution-standardization` | ✅ |
| ⑨ | **core-coder** | "**H6** 사전커밋 hardcoding 검사 스크립트(`scripts/design-system/automation/pre-commit-hardcoding-check.sh`) 운영 게이트 기준과 일치하도록 강화. 현재 'development 허용' 분기 제거 또는 명시 옵션 분리." | `/core-solution-standardization`, `/core-solution-frontend` | ✅ |
| ⑩ | **사용자(외부)** | "**E1** NCP SENS 4종 시크릿(`NCP_SENS_ACCESS_KEY`, `NCP_SENS_SECRET_KEY`, `NCP_SENS_SERVICE_ID`, `NCP_SENS_FROM_NUMBER`) GitHub Secrets 등록 — `Settings → Secrets and variables → Actions`." | — | ✅ (외부) |
| ⑪ | **사용자(DevOps)** | "**G2** Prometheus/Grafana 또는 운영 로그 모니터링에서 `[OPS-ALERT] SMS stub mode in production` ERROR 임계치 알람 추가." | — | ✅ (외부) |
| ⑫ | **core-coder + explore** | "**A4** SecurityContext leak 정리 표준 — (1) explore: `src/test/java/.../controller/*Test.java` 중 `SecurityContextHolder.setAuthentication(...)` 호출 + `@AfterEach clearContext()` 미호출 케이스 전수 검색 (2) core-coder: 전 controller 단위 테스트에 `@AfterEach SecurityContextHolder.clearContext()` 일괄 적용 + (가능 시) `AbstractSecurityIsolatedTest` 베이스 클래스 도입. PR #234 패턴 참조." | `/core-solution-testing`, `/core-solution-backend` | ✅ |
| ⑬ | **core-coder + generalPurpose(문서)** | "**B5** Spring Bean 다중 생성자 `@Autowired` 명시 정책 — (1) core-coder: production 생성자에 `@Autowired` 명시. PR #227 cascade fix(`SmsGatewayServiceImpl`) 패턴 확장 — `SmsOtpVerificationServiceImpl`, `MobilePushDispatchServiceImpl` 등 동일 패턴 검토. SpotBugs/Checkstyle 검출 룰 가능 여부 조사 보고 (2) generalPurpose: `docs/standards/SPRING_BEAN_CONSTRUCTOR_STANDARD.md` 신규(짧은 가이드 + 예시·반례)." | `/core-solution-backend`, `/core-solution-documentation`, `/core-solution-standardization` | ✅ |
| ⑭ | **explore + core-coder** | "**B6** FE 중복 API 호출 dedup 표준 — (1) explore: `frontend/src/`·`expo-app/src/` 에서 `sessionManager`, `useSession`, `SessionContext` 사용처 및 `/auth/current-user`·`/consultation-messages/all`·`/menus/lnb` 호출 위치 스캔. admin/dashboard·/erp/*·/admin/integrated-schedule 우선 (2) core-coder: in-flight promise dedup 패턴 적용 + Direct fetch → `SessionContext`+`useSession()` 전환 hotfix. PR #231 mypage 패턴 참조." | `/core-solution-frontend`, `/core-solution-api` | ✅ |
| ⑮ | **core-debugger → core-coder** | "**B7** BE `/api/v1/auth/current-user` 응답 시간 256~1025ms → 100ms 이내 최적화 — (1) core-debugger: 응답 시간 프로파일링(DB 쿼리·AuditLog 동기 작성·외부 호출 식별) + 100ms 목표 위반 원인 분석 (2) core-coder: AuditLog 비동기 처리 + 인덱스 추가(필요 시 Flyway) + 외부 호출 캐싱·제거. PR #231 후속." | `/core-solution-backend`, `/core-solution-debug`, `/core-solution-multi-tenant` | ⚠ B6 결과 후 |
| ⑯ | **core-coder** | "**C6** `pom.xml` failsafe `forkCount=2 reuseForks=false -Xmx3g -Xms512m` 패턴 명문화 — 현재 설정 확인 후 표준 명시 + surefire 등 다른 plugin 에도 동일 검토. CI runner OOM(`Process Exit Code: 3`) 회귀 차단. PR #232 패턴 참조." | `/core-solution-deployment`, `/core-solution-backend` | ✅ |

**병렬 가능 그룹 (v2)**:
- **그룹 A** (코드·문서 동시 9건): ① · ② · ③ · ⑤ · ⑥ · ⑦ · ⑧ · ⑨ · ⑫
- **그룹 B** (코드·문서 동시 4건): ⑬ · ⑭ · ⑯ · (B7 진단 ⑮ 첫 단계 — debugger 만)
- **그룹 외부 액션** (동시 안내 2건): ⑩ · ⑪

**순차 의존성**:
- ② → (②결과 반영 시) ④ 마이그레이션 우선순위 결정, ④ ← A2 결과로 보강
- ⑭ B6 explore 결과(중복 호출 화면 리스트) → ⑮ B7 core-coder 단계(BE 최적화 영향 범위 산정)
- ⑫ A4 explore(누락 테스트 리스트) → A4 core-coder 일괄 적용

---

## 4. 사용자 외부 액션 (별도 안내)

> 코드/문서로 해결 불가, 사용자 직접 수행 필요.

| ID | 액션 | 비고 |
|---|---|---|
| **E1** | NCP SENS 4종 GitHub Secrets 등록 | PR #227 머지 후 즉시 — Phase 1 |
| **D1** | OAuth REGISTERED_URLS 4종 GitHub Secrets | Kakao/Naver/Google/Apple Console 1:1 매칭 — Phase 3 |
| **D2** | apex 단일 redirect_uri Console 반영 | PR #223 docs 완료, Console 운영 액션 — Phase 3 |
| **G1** | Prometheus `oauth2_callback_tenant_unresolved_total` 알람 | PR #218 메트릭 활성화 후 — Phase 2 |
| **G2** | SMS gateway stub mode ERROR 알람 | E1 완료 후 — Phase 1 |
| **G4** | AuditLog 활동 모니터링 대시보드 | USER_PHONE_CHANGE/EMAIL_CHANGE/OTP_SENT — Phase 2 |
| **I3** | `mind_garden` 레거시 schema DBA 수동 DROP | PR #217 차단 후 — Phase 2 |

---

## 5. 리스크·제약

### 5.1 v1 항목

- **Phase 1 의 B1·B4 는 운영 보안 직결** — 머지 후 hotfix 배포 검토 권장.
- **A1·A2 는 hotfix-4 머지 선행** — main 충돌 회피 필요.
- **E1 미등록 상태에서 PR #227 운영 반영 시** `[OPS-ALERT] SMS stub mode in production` 가 운영에서 트리거됨 — G2 알람 선행 권장.
- **D3 OAuth 통합** 은 진행 중 PR(#223, #227 등)과 분기 충돌 가능 — Phase 2 진입 전 머지 상태 확인.
- **C5 prod systemctl 통합** 은 blue/green 영향 평가 필요(P3 보류).

### 5.2 v2 추가 항목

- **A4 SecurityContext leak 정리** — explore 결과(누락 테스트 리스트)가 광범위(컨트롤러 단위 테스트 다수)일 가능성 → 마이그레이션을 1차 일괄 + 2차 회귀 잡기 식으로 분할 권장. `AbstractSecurityIsolatedTest` 베이스 도입 시 A1(`AbstractTenantIsolatedTest`)과 멀티 상속 회피 위해 **상속 트리 사전 설계 필요**.
- **B5 다중 생성자 `@Autowired` 명시** — production 코드 영향 범위가 적어 보이지만, **테스트 전용 보조 생성자가 동일 클래스에 추가된 모든 Service Bean**을 explore 단계에서 먼저 식별 → 위험 식별 후 일괄 hotfix.
- **B6/B7 진단 → fix 분리 워크플로** — B6 explore(중복 호출 화면 스캔)와 B7 core-debugger(응답 시간 프로파일링)를 **먼저 동시 진행 → 결과 회수 후 core-coder hotfix**로 이어 가는 2단계 워크플로 권장. 진단 없이 코드 hotfix 시 의미 없는 변경 가능.
- **C6/C7 인프라 변경은 다른 PR sequential 머지와 충돌 없음** — `pom.xml`(C6) 및 `.github/workflows/*.yml`(C7)만 건드리므로 main sequential 머지 워커와 코드 영역 충돌 가능성 낮음. 다만 **CI 실행 중 머지 시 일시적 빌드 큐 적체** 가능 → 머지 타이밍 조율(머지 직후 또는 머지 사이 갭).
- **B6 SessionContext + useSession() 전환**은 다수 컴포넌트 영향 → **explore 결과 기반 우선순위 화면 5개 선정 → 단계적 hotfix**(빅뱅 금지).
- **B7 BE 최적화는 AuditLog 비동기 처리** 도입 시 누락 가능성 → `@Async` 또는 별도 큐 도입 시 **실패 폴백·재시도 정책**을 core-debugger 진단 단계에서 함께 정리.

---

## 6. 단계별 완료 기준 (요약)

| Phase | 완료 기준 |
|---|---|
| Phase 1 | 11개 항목 모두 PR 머지·외부 액션 완료, 운영 hotfix 배포(필요 시), `[OPS-ALERT]` 알람 검증 |
| Phase 2 | OAuth 통합 분기 정리 PR 머지, Node 20 워크플로 통일 그린 빌드, 관측성 대시보드 1차 운영 |
| Phase 3 | 4종 표준 문서 게시(`TIMEZONE`/`TEST_ISOLATION`/`OAUTH`/`OTP_DELIVERY`), `mind_garden` schema DROP 완료, OAuth Console 4종 등록 |

---

## 7. 실행 요청문 (호출자 → 부모 에이전트)

> 사용자 승인 후, 부모 에이전트는 §3 분배실행 표의 Slot ①~⑯ 을 의존성 없는 그룹별로 **병렬 호출**한다. 각 서브에이전트 결과는 **core-planner(본 문서 작성자)** 에게 회수되어, planner 가 사용자에게 최종 보고를 작성한다.

```
[v1 항목]
1) Slot ①·②·③·⑤·⑥·⑦·⑧·⑨ 병렬 호출 (코드·문서 8건)
2) Slot ⑩·⑪ 외부 액션 사용자 안내 동시 전달
3) ② 결과 회수 후 ④ 의 마이그레이션 우선순위 보강

[v2 추가 항목 — Phase 1]
4) Slot ⑫·⑬·⑭·⑯ 병렬 호출 (코드·문서 4건: A4·B5·B6·C6)
5) Slot ⑮ 의 1단계(core-debugger 응답 시간 프로파일링) 병렬 호출 — B7
6) ⑭ B6 explore 결과 회수 후 → ⑭ B6 core-coder hotfix + ⑮ B7 core-coder BE 최적화
7) ⑫ A4 explore 결과 회수 후 → ⑫ A4 core-coder 일괄 적용

[수렴]
8) 모든 결과 core-planner 에 보고 → 사용자 최종 보고
```

**총 호출 가능 슬롯**: v1 11개(Slot ①~⑪) + v2 5개(Slot ⑫~⑯) = **16개** (Phase 1 기준)

---

## 부록 A. 이전 todo PENDING 표준화 성격 항목

| ID | 항목 | 상태 |
|---|---|---|
| designer-handoff-update | 로고 사이즈 핸드오프 업데이트 | Phase 3 (디자인 후속) |
| apple-review-monitor | iOS 1.0.8 심사 모니터 only | 진행 중 모니터링 |
| ota-policy-active | OTA 정책 상시 | 상시 적용 |

---

## 부록 B. v1 → v2 변경 요약 (2026-06-12 새벽 PR 시리즈 반영)

### B.1 신규 항목 6종

| ID | 카테고리 | 출처 PR | 우선순위 | Phase | 위임 |
|---|---|---|---|---|---|
| **A4** | 테스트 격리 (SecurityContext leak 정리) | [#234](https://github.com/beta0629/MindGarden/pull/234) `79bf2536` | P1 | Phase 1 | core-coder + explore |
| **B5** | 운영 보안 (다중 생성자 `@Autowired` 명시) | [#227 cascade fix](https://github.com/beta0629/MindGarden/pull/227) `8f8c4fb4` | P1 | Phase 1 | core-coder + generalPurpose(문서) |
| **B6** | 운영 보안 (FE 중복 API 호출 dedup) | [#231](https://github.com/beta0629/MindGarden/pull/231) `2f1ae89f` | P1 | Phase 1 | explore + core-coder |
| **B7** | 운영 보안 (BE `/auth/current-user` 응답 최적화) | [#231 후속](https://github.com/beta0629/MindGarden/pull/231) | P1 | Phase 1 | core-debugger → core-coder |
| **C6** | 인프라 (CI runner JVM heap + fork) | [#232](https://github.com/beta0629/MindGarden/pull/232) `af5a3633` | P1 | Phase 1 | core-coder |
| **C7** | 인프라 (CI workflow timeout) | [#233](https://github.com/beta0629/MindGarden/pull/233) `c842ab14` | P2 | Phase 2 | core-deployer |

### B.2 Phase 분배 변화

| Phase | v1 | v2 | 변동 |
|---|---|---|---|
| Phase 1 | 11개 | **16개** | +5 (A4·B5·B6·B7·C6) |
| Phase 2 | 17개 | **18개** | +1 (C7) |
| Phase 3 | 9개 | 9개 | — |
| **총합** | **38개** | **44개** | **+6** |

### B.3 분배실행 (§3) 변화

- **Slot 추가**: ⑫(A4) · ⑬(B5) · ⑭(B6) · ⑮(B7) · ⑯(C6) — Phase 1 즉시 시작 가능 항목 5개.
- **C7**은 Phase 2 항목이므로 §3 Phase 1 분배실행에는 미포함 (Phase 2 진입 시 별도 분배 표 작성).
- **병렬 그룹 재정의**:
  - 그룹 A (9건): ①·②·③·⑤·⑥·⑦·⑧·⑨·⑫
  - 그룹 B (4건): ⑬·⑭·⑯·⑮의 첫 단계(debugger)
  - 외부 액션(2건): ⑩·⑪
- **새로운 순차 의존성**:
  - ⑫ A4 explore → A4 core-coder 일괄 적용
  - ⑭ B6 explore → ⑮ B7 core-coder (BE 최적화 영향 범위 산정)

### B.4 인용 소스 변화 (§0)

- v1 7건(`a73567ad`, `ab99762b`, `57eb1a87`, `af09fc9a`, `b714bc91`, `33daeb86`, `e5c366d1`) 그대로 보존
- v2 추가 5건(`79bf2536`/PR #234, `af5a3633`/PR #232, `c842ab14`/PR #233, `8f8c4fb4`/PR #227 cascade, `2f1ae89f`/PR #231)

### B.5 리스크 보강 (§5)

- A4 상속 트리 사전 설계, B5 테스트 보조 생성자 사전 식별, B6/B7 진단→fix 분리 워크플로, C6/C7 sequential 머지 충돌 가능성 평가, B6 단계적 hotfix 권장, B7 AuditLog 비동기 폴백 정책 등 6건 추가.

### B.6 v1 항목 보존

- **v1 항목 38개 모두 변경·삭제 없이 보존.** v2는 추가만 수행(증분 업데이트).

---

**문서 끝.**
