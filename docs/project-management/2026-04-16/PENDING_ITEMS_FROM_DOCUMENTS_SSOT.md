# 문서 기준 미완료·후속 작업 통합 목록 (SSOT)

**목적**: 여러 기획·오케스트레이션·체크리스트에 흩어진 **아직 끝나지 않은 항목**을 한곳에서 찾을 수 있게 한다.  
**성격**: 실행 상태의 **스냅샷**이다. 세부 설계·수용 기준은 **원문 문서**가 단일 출처(SSOT)이다.  
**갱신 주기**: 배포·스프린트 종료 시 또는 월 1회 — 담당자가 본 표와 원문 중 한쪽을 반드시 갱신한다.

**최종 갱신**: 2026-04-15  
**주관**: core-planner(오케스트레이션) — 구현 위임은 `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` 준수.

---

## 1. 요약 표 (우선 참고)

| 트랙 | 상태 요약 | 상위 문서 (원문) |
|------|-----------|------------------|
| **ERP UX·품질 (P4)** | P4-04 전역 MGButton `erpMgButtonProps` 적용 **완료**(2026-04-15); P4-01·03·05 일부 **진행 중** | [ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md](../ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md) §1 |
| **공통 UI·레이아웃** | UI-01·02·03 **진행 중** | 동일 문서 §2 |
| **보안·공개 API (온보딩)** | SEC-01 **진행 중** (엣지·Trinity 잔여) | 동일 문서 §3 · [TODO_ONBOARDING_PUBLIC_API_HARDENING.md](../2026-03-31/TODO_ONBOARDING_PUBLIC_API_HARDENING.md) |
| **검증 게이트** | QA-01·02 **진행 중** | ONGOING §4 |
| **운영 반영·손오프** | OPS-01 **진행 중**, OPS-02 **미착수** | ONGOING §5 · [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) |
| **ERP 이후 전역 확대 (G-02~G-07)** | G-01 버튼 정리는 완료; **G-02~G-07**은 에픽 단위 후속 | ONGOING §6 |
| **고도화 초안 (온보딩·구독·테넌트 종료)** | 초안 체크박스 **대부분 미체크** | [CORE_SOLUTION_ENHANCEMENT_DIRECTION_DRAFT.md](../2026-04-02/CORE_SOLUTION_ENHANCEMENT_DIRECTION_DRAFT.md) |
| **개발–운영 정합** | **절차·위임 프롬프트만 존재** — explore 갭표·SHA 고정 등 **실행 산출은 별도** | [DEV_PROD_ALIGNMENT_ORCHESTRATION.md](../2026-04-02/DEV_PROD_ALIGNMENT_ORCHESTRATION.md) |
| **운영 헬스·디스크·로그 배치** | 기획 위임 기록만 — **스크립트·워크플로 도입은 미완** | [OPS_HEALTH_DISK_LOG_BATCH_ORCHESTRATION.md](../2026-04-02/OPS_HEALTH_DISK_LOG_BATCH_ORCHESTRATION.md) |
| **Trinity 온보딩 UI 스펙** | UI/UX 스펙 문서 — **구현 완료 여부는 본 문서에 미기재** (디자인 적용·코드 정합은 별도 검증) | [SCREEN_SPEC_TRINITY_APPLY_ONBOARDING.md](../SCREEN_SPEC_TRINITY_APPLY_ONBOARDING.md) |
| **대외·사업 문서 (예비창업 패키지 등)** | 시장·재무·팀 등 **보완 필요** — 제품 백로그와 구분 | [04_ENHANCEMENT_CHECKLIST.md](../../2026-startup-plan/04_ENHANCEMENT_CHECKLIST.md) |

---

## 2. ONGOING_WORK_MASTER_PROGRESS_CHECKLIST — 미완·진행 중 (세부)

원문 최종 갱신은 **2026-04-10** 기준(원문 헤더 참고). 아래는 그 중 **☐ / 🔄** 또는 비고상 잔여가 명시된 항목만 추렸다.

### 2.1 ERP (§1)

| ID | 항목 | 문서상 상태 | 잔여·비고 요약 |
|----|------|-------------|----------------|
| ERP-P4-01 | UnifiedLoading 인라인·섹션 로딩 | 🔄 | 일부 화면 ☑, **기타 ERP 화면·모달 점검** 잔여 |
| ERP-P4-03 | ErpFilterToolbar 도입·정렬 | 🔄 | 도입(코드) ☑, **정렬·반응형·토큰·소규모 화면** 잔여 |
| ERP-P4-04 | MGButton loading 패턴 | ☑ | 전역 적용 완료; 회귀는 수동 스모크·ESLint |
| ERP-P4-05 | 네이티브 새로고침·검색 인벤토리 | 🔄 | P4-05a~f ☑, **추가 화면** 배치별 |

### 2.2 공통 UI (§2)

| ID | 항목 | 문서상 상태 | 잔여·비고 요약 |
|----|------|-------------|----------------|
| UI-01 | AdminCommonLayout 미적용 페이지 | 🔄 | 인벤토리·의도적 비적용 표 ☑, **잔여 적용·정리** |
| UI-02 | UnifiedModal 등 공통화 2차 | 🔄 | 다수 ☑, **잔여 모달·전역 린트** 등 |
| UI-03 | COMPONENT_COMMONIZATION 병렬 후속 | 🔄 | 병렬 체크리스트 표상 잔여 없음 — **마스터 후속은 UI-01·ERP 등과 연계** |

### 2.3 보안 (§3)

| ID | 항목 | 문서상 상태 | 잔여·비고 요약 |
|----|------|-------------|----------------|
| SEC-01 | 공개 온보딩 API 보강 | 🔄 | 백엔드·CAPTCHA·레이트리밋 일부 ☑ · **엣지 Nginx·WAF·Prometheus/Grafana·실IP 정합**은 인프라 트랙 |

### 2.4 검증 (§4)

| ID | 항목 | 문서상 상태 | 잔여·비고 요약 |
|----|------|-------------|----------------|
| QA-01 | core-tester 스모크·회귀 | 🔄 | 배치마다 권장, ERP 재무 등 **회귀 스모크** 지속 |
| QA-02 | ERP E2E·스모크 | 🔄 | 워크플로 정의 ☑, **시나리오 확대** |

### 2.5 운영 반영 (§5)

| ID | 항목 | 문서상 상태 | 잔여·비고 요약 |
|----|------|-------------|----------------|
| OPS-01 | 운영 반영 전 체크리스트 실행 | 🔄 | 문서 존재 ☑, **배포 전 실행·증적**은 배치별 |
| OPS-02 | 하드코딩·표시 경계·LNB 손오프 | ☐ | `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` 등 **검사 미완** |

### 2.6 전역 확대 검토 (§6) — G-02 ~ G-07

ERP 권역 합의 완료 후 트리거. **G-01(버튼)** 은 문서상 ☑.

| ID | 축 | 문서상 상태 |
|----|-----|-------------|
| G-02 | 표시 경계·React #130 | 계획(미실행 트랙) |
| G-03 | API·테넌트 일관성 | 계획 |
| G-04 | 레이아웃·ContentHeader 잔여 | UI-01·02와 통합 |
| G-05 | 보안·공개 API | SEC-01과 통합 |
| G-06 | 검증 확대 | QA와 통합 |
| G-07 | 운영·하드코딩 CI | OPS·deploy와 통합 |

---

## 3. TODO_ONBOARDING_PUBLIC_API_HARDENING — 체크리스트 잔여

**원문**: [TODO_ONBOARDING_PUBLIC_API_HARDENING.md](../2026-03-31/TODO_ONBOARDING_PUBLIC_API_HARDENING.md)

| 항목 | 원문 표기 | 미완 요약 |
|------|-----------|-----------|
| 봇 완화 | [~] | **Trinity 온보딩 UI**(Turnstile·발송 직전)·**운영 키**·hCaptcha 등 잔여 |
| 엣지 레이트리밋 | 문서 본문 | **실서버 nginx 적용·WAF** — 인프라 합의 후 |

(나머지 Rate limit·이메일 쿨다운·모니터링·문서 일부는 원문에서 [x] 처리됨.)

---

## 4. CORE_SOLUTION_ENHANCEMENT_DIRECTION_DRAFT — 초안 미체크 항목

**원문**: [CORE_SOLUTION_ENHANCEMENT_DIRECTION_DRAFT.md](../2026-04-02/CORE_SOLUTION_ENHANCEMENT_DIRECTION_DRAFT.md)

§3 전체가 **기획 미확정 초안**이며, 원문에서 `[ ]` 인 항목은 아래와 같다 (에픽 분해 전).

- **3.1** 플랫폼 단 온보딩 허용/중지 스위치, 중복·남용 방지, B2B 온보딩 모델(선택)
- **3.2** 구독·계약 기간 필드의 **관리자·OPS UI/API 노출**, REST와 만료 배치·테넌트 차단 정책 연동
- **3.3** 테넌트 종료·소프트삭제 **전용 API·OPS 플로우**, 온보딩 복구 충돌 정책
- **3.4** 법무·계약 문구 (저장소 외)
- **3.5** 배포 시 스키마·Flyway·스모크 **문서화 검토**

---

## 5. 오케스트레이션 전용 문서 — “절차는 있음, 실행 산출 별도”

아래는 **위임 프롬프트·체크리스트**가 준비되어 있으나, **저장소만으로는 완료 여부를 단정할 수 없는** 항목이다. 착수 시 explore → coder → tester 순으로 본문 §5~§7을 따른다.

| 문서 | 미완 의미 (요약) |
|------|------------------|
| [DEV_PROD_ALIGNMENT_ORCHESTRATION.md](../2026-04-02/DEV_PROD_ALIGNMENT_ORCHESTRATION.md) | 운영 SHA 고정, dev/prod 갭 표, 분기 정책 — **P0 explore 산출·P2 구현** 필요 시 별도 기록 |
| [OPS_HEALTH_DISK_LOG_BATCH_ORCHESTRATION.md](../2026-04-02/OPS_HEALTH_DISK_LOG_BATCH_ORCHESTRATION.md) | 헬스·디스크·로그 정리 **스크립트·timer/cron·GHA schedule** — dry-run 우선 |

---

## 6. 기타 참고 (제품 백로그와 구분)

| 문서 | 비고 |
|------|------|
| [COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md](../COMPONENT_COMMONIZATION_PARALLEL_CHECKLIST.md) | Phase 표상 **☑** — 마스터는 UI-03 후속을 ERP·UI-01과 연계해 기술 |
| [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) | **상시 체크리스트** — 완료 “일시”가 아니라 **배포 티켓마다 실행** |
| [04_ENHANCEMENT_CHECKLIST.md](../../2026-startup-plan/04_ENHANCEMENT_CHECKLIST.md) | 예비창업 패키지 등 **대외 문서 보완** — 개발 백로그와 별도 관리 권장 |

---

## 7. 다음 액션 (문서 유지 담당)

1. **스프린트마다**: [ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md](../ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md)의 🔄/☐를 갱신한 뒤, **본 문서 §1 요약 표** 한 줄만 맞춘다.  
2. **온보딩 보안 잔여**: `TODO_ONBOARDING` 원문 [~] 해소 시 §3을 삭제하거나 완료로 옮긴다.  
3. **고도화 초안**: core-planner가 에픽으로 쪼갠 뒤, **본 문서 §4는 링크만 남기고** 이슈/PR 번호로 치환한다.  
4. **오케스트레이션 실행 시**: DEV_PROD·OPS_HEALTH에 **날짜·산출물 경로·워크플로 이름**을 기록한 부록을 두거나, 본 SSOT에 “완료 부록” 절을 추가한다.

---

## 8. 병렬 위임 산출 (2026-04-16)

explore·병렬 Task에서 나온 후속 위임 메모(원문 SSOT는 각 트랙 문서).

- **DEV/PROD 정합**: `application-*.yml` gitignore, ~~Node 18 대 20~~ → **dev 프론트 CI Node 20 통일 완료**(§9). 프론트 시크릿 키 이름 차이 등 잔여는 워크플로·`REACT_APP_*` 정책으로 후속.
- **ERP P4**: 환불 `refund-management/*` UnifiedLoading·TaxManagement·SalaryConfigModal·RefundHistoryTableBlock `buildErpMgButtonClassName` 등 — **일부 배치 완료**(§9). 잔여는 [ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md](../ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md) ERP-P4 표.
- **UI-01**: `App.js`·래퍼 적용 vs 마스터 표 **파일명·경로 정합** 검토 후보로 남김.
- **SEC-01**: 인프라 측 **nginx·Grafana** 등 잔여 과제.
- **QA**: [`.github/workflows/code-quality-check.yml`](../../../.github/workflows/code-quality-check.yml) — **`mvn test`의 `|| true` 제거 완료**(§9). 가이드: [CI_CODE_QUALITY_AND_MVN_GATE.md](../../guides/testing/CI_CODE_QUALITY_AND_MVN_GATE.md).

---

## 9. 완료 반영 부록 (2026-04-17)

병렬 위임으로 **저장소에 반영된 누적**을 짧게 남긴다(상세는 커밋·PR·원문 트랙 문서).

| 구분 | 반영 내용 | 참조 |
|------|-----------|------|
| CI / QA | `code-quality-check.yml`에서 **`mvn test` 실패 시 job 실패**로 전파. Checkstyle·SpotBugs는 레거시 대량 위반으로 **아직 `|| true` 유지**(엄격화는 별도 에픽) | [CI_CODE_QUALITY_AND_MVN_GATE.md](../../guides/testing/CI_CODE_QUALITY_AND_MVN_GATE.md) |
| CI / QA | `GITHUB_ACTIONS_WORKFLOW_INDEX.md`에 루트 워크플로 **31개** 요약·**`e2e-erp-smoke.yml`** CI 표·각주; [ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md](../ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md) QA-02·최종 갱신과 동기 | [GITHUB_ACTIONS_WORKFLOW_INDEX.md](../../deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md) |
| 프론트 CI | `deploy-frontend-dev.yml` Node **20**으로 prod와 메이저 통일 | `.github/workflows/deploy-frontend-dev.yml` |
| OPS | `prod-health-snapshot.sh`에 `journalctl`·`memory-alert` tail + 마스킹, `README` 환경변수 | `scripts/ops/README.md`, [OPS_HEALTH_DISK_LOG_BATCH_ORCHESTRATION.md](../2026-04-02/OPS_HEALTH_DISK_LOG_BATCH_ORCHESTRATION.md) |
| DB | Flyway 코어 vs Ops 이중 트랙 SSOT 문서 신규 | [FLYWAY_CORE_VS_OPS_TRACKS.md](../../deployment/FLYWAY_CORE_VS_OPS_TRACKS.md) |
| ERP P4 | 환불 블록 UnifiedLoading, TaxManagement·SalaryConfigModal·RefundHistoryTableBlock MGButton 정합 | `frontend/src/components/erp/**` (해당 브랜치 기준) |

**미완(다음 배치)**: 루트 워크플로 인덱스는 §9 부록으로 이관됨(목록·표 본문은 위 표 참조). Checkstyle·SpotBugs **엄격 게이트**(워크플로 `|| true` 제거)는 레거시 위반 정리 에픽 후. SEC-01 인프라, UI-01 표 정합, Flyway **실제 DB·운영 값** 정합은 팀·explore 후속. `check-hardcoding-enhanced.js`는 **exit 0이나 경고 대량**(ONGOING OPS-02 증적·`test-reports/hardcoding/*.json`) — 운영 게이트에서 **경고 0**을 요구하면 **core-coder 에픽**으로 리포트 기준·우선순위 합의 후 처리한다.

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-04-16 | 최초 작성 — 저장소 내 활성 문서 기준으로 미완 항목 통합·문서화 |
| 2026-04-16 | §8 병렬 위임 산출(2026-04-16) 추가 — explore·병렬 Task 후속 메모 |
| 2026-04-17 | §8 QA·DEV 문구 갱신, §9 완료 부록·워크플로·문서 링크 추가 |
| 2026-04-17 | §9: `env.dev.example` Flyway 주석·CI 가이드 동기화. Checkstyle/SpotBugs 엄격화 시도 후 레거시 대량 위반으로 워크플로 **`|| true` 유지**·문서에 현행 명시 |
| 2026-04-17 | §9 워크플로 인덱스·ERP 스모크 반영 |
| 2026-04-17 | §9 미완·하드코딩 에픽 문구 |
