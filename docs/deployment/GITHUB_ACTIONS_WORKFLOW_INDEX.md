# GitHub Actions 워크플로 인덱스 (Trinity·Ops 정적 프론트)

**목적**: Trinity·Ops·Core 정적 프론트 배포 워크플로와 재사용(`workflow_call`) 구성을 한눈에 정리한다.

**유지보수**: 과거 워크플로 스냅샷은 저장소에 별도 폴더로 두지 않는다. 필요 시 **git 히스토리**를 참고한다.

**관련(인프라·Nginx)**: [SEC-01 공개 API 엣지 레이트리밋 가이드](NGINX_RATE_LIMIT_PUBLIC_API.md) · [SEC-01 공개 온보딩 엣지·운영 역할](SEC01_PUBLIC_ONBOARDING_EDGE_AND_OPS.md)

**무중단(SSOT)**: [무중단 갭·로드맵 — 현재 파이프라인·Go-Live 정합](ZERO_DOWNTIME_GAP_AND_ROADMAP.md) · Core 블루그린(예시·systemd·Nginx 스니펫): [deployment/README-BLUEGREEN.md](../../deployment/README-BLUEGREEN.md)

---

## 운영 통합 배포 (단일 진입점)

| 파일 | 역할 | 트리거·비고 |
|------|------|-------------|
| [`deploy-unified-production.yml`](../../.github/workflows/deploy-unified-production.yml) | Core 운영(`deploy-production`) → Trinity 운영 → Ops 프론트 운영 → Ops 백엔드 운영 → 표준 프로시저 운영을 **순서대로** `workflow_dispatch` 후 **`gh run watch`로 완료·성공 여부 감시** | `workflow_dispatch`만. 입력: `deploy_ref`(main만), `run_core` / `run_trinity` / `run_ops_frontend` / `run_ops_backend` / `run_procedures`(각 boolean, 기본 true). `GITHUB_TOKEN`에 `actions: write` 필요. |

온보딩 백엔드는 **운영 전용 자동 워크플로가 없음**; 통합 워크플로 마지막 안내 스텝에서도 동일 내용을 출력한다.

---

## 정적 사이트 SSH 배포 쌍

| 구분 | 워크플로 | 트리거 (브랜치) | paths (요약) | 시크릿 (SSH) | 헬스 URL |
|------|-----------|-----------------|--------------|----------------|----------|
| Core 개발 | [`deploy-frontend-dev.yml`](../../.github/workflows/deploy-frontend-dev.yml) | `develop` push, `workflow_dispatch` | `frontend/**`, 해당 workflow | `DEV_SERVER_HOST` / `DEV_SERVER_USER` / `DEV_SERVER_SSH_KEY` → 재사용 워크플로 `ssh_*` | `https://dev.core-solution.co.kr` (실패 시 경고만, exit 0) |
| Trinity 개발 | [`deploy-trinity-dev.yml`](../../.github/workflows/deploy-trinity-dev.yml) | `develop` push, `workflow_dispatch` | `frontend-trinity/**`, 해당 workflow | 동일 | `https://apply.dev.e-trinity.co.kr`, `https://dev.e-trinity.co.kr` (순차, 하나 성공 시 통과; 전부 실패 시 경고만) |
| Trinity 운영 | [`deploy-trinity-prod.yml`](../../.github/workflows/deploy-trinity-prod.yml) | `main` push, `workflow_dispatch`(`deploy_ref`, main만 허용) | 동일 | `PRODUCTION_HOST` / `PRODUCTION_USER` / `PRODUCTION_SSH_KEY` | `https://apply.e-trinity.co.kr` |
| Ops 개발 | [`deploy-ops-dev.yml`](../../.github/workflows/deploy-ops-dev.yml) | `develop` push, `workflow_dispatch` | `frontend-ops/**`, 해당 workflow | `DEV_SERVER_*` | `https://ops.dev.e-trinity.co.kr` |
| Ops 운영 | [`deploy-ops-prod.yml`](../../.github/workflows/deploy-ops-prod.yml) | `main` push, `workflow_dispatch`(main 가드) | 동일 | `PRODUCTION_*` | `https://ops.e-trinity.co.kr` |

**재사용 워크플로**: [`reusable-static-site-ssh-deploy.yml`](../../.github/workflows/reusable-static-site-ssh-deploy.yml) — `workflow_call`로 `secrets`(ssh_host, ssh_user, ssh_key)와 inputs(site_label, remote_html_dir, backup_*, scp_source, strip_components, artifact_name, health_urls)를 받아 SSH 테스트·백업(retention 5)·SCP·권한·index 검증·nginx -t·curl 헬스를 수행한다.

각 호출 워크플로는 **`build`**(checkout·운영은 가드 후 ref·Node·npm ci·빌드·산출 검증·`_gha_static_site_upload` 스테이징 후 `upload-artifact`)와 **`deploy`**(`needs: build`, `uses` 재사용 워크플로, `download-artifact`) 두 잡으로 구성된다. 아티팩트 이름은 `core-frontend-static-site-artifact`, `trinity-static-site-artifact`, `ops-static-site-artifact`이며 SCP 전 `_static_site_upload/*`에 풀리고 `strip_components: 1`로 원격 `html-*` 루트에 맞춘다.

---

## 루트 워크플로 요약 (`.github/workflows/*.yml` 32개)

표는 배포·CI 중심 열거이며, 전체 워크플로 목록은 `.github/workflows/` 디렉터리를 참조한다.

### 정적 사이트 SSH / 재사용

| 파일 | 역할 | 트리거 요약 | dev/prod 쌍 | reusable | 비고 |
|------|------|-------------|-------------|----------|------|
| `reusable-static-site-ssh-deploy.yml` | 정적 SSH 배포 공통 | `workflow_call`만 | — | 정의본 | 호출 전용 |
| `deploy-frontend-dev.yml` | Core 메인 프론트 → html-dev | `develop`+paths, dispatch | — / [`deploy-production.yml`](../../.github/workflows/deploy-production.yml)(코어 통합) | 사용 | |
| `deploy-trinity-dev.yml` | Trinity 프론트 개발 | `develop`+paths, dispatch | [`deploy-trinity-prod.yml`](../../.github/workflows/deploy-trinity-prod.yml) | 사용 | |
| `deploy-trinity-prod.yml` | Trinity 프론트 운영 | `main`+paths, dispatch | 상위와 쌍 | 사용 | |
| `deploy-ops-dev.yml` | Ops 프론트 개발 | `develop`+paths, dispatch | [`deploy-ops-prod.yml`](../../.github/workflows/deploy-ops-prod.yml) | 사용 | |
| `deploy-ops-prod.yml` | Ops 프론트 운영 | `main`+paths, dispatch | 상위와 쌍 | 사용 | |

### 기타 배포·운영

| 파일 | 역할 | 트리거 요약 | dev/prod 쌍 | reusable | 비고 |
|------|------|-------------|-------------|----------|------|
| `deploy-unified-production.yml` | 운영 통합 오케스트레이션 | `workflow_dispatch`(단계별 bool) | — | — | 하위 워크플로 순차 디스패치·watch |
| `deploy-backend-dev.yml` | 코어 백엔드 개발 | `develop`+세분 paths | — / `deploy-production.yml` | — | 온보딩 경로 제외 |
| `deploy-onboarding-dev.yml` | 온보딩 개발 | `develop`+paths | — | — | |
| `deploy-nginx-dev.yml` | Nginx 설정 개발 | `develop`+`config/nginx/**` | — | — | |
| `deploy-production.yml` | 코어 운영 통합 | `main` push(코어 Java 온보딩 제외·`pom`·`db/migration`·`deployment/application-production.yml`·`sql/**`·`database/schema/**`·`config/nginx/**`·해당 workflow), `workflow_dispatch`(`deploy_ref`, main 가드) | — | — | 백엔드: **블루그린**(비활성 슬롯 기동·헬스·Nginx upstream 스니펫·`reload`) — [PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md](./PRODUCTION_BLUE_GREEN_BACKEND_CUTOVER.md). push 시 checkout `github.sha` |
| `deploy-ops-backend-prod.yml` | Ops 백엔드 운영 | `main`+paths, dispatch | — | — | |
| `deploy-procedures-dev.yml` | 표준 프로시저 개발 | `develop`+DB paths | [`deploy-procedures-prod.yml`](../../.github/workflows/deploy-procedures-prod.yml) | — | |
| `deploy-procedures-prod.yml` | 표준 프로시저 운영 | `workflow_dispatch` | 상위와 쌍 | — | **개발 서버 SSH → 그 서버에서 mysql로 개발 DB(`DEV_DB_*`) 적용** — 운영 앱→개발 DB 3306 직접 연결 아님. |
| `deploy-dev.yml` | 통합 개발 배포 | `workflow_dispatch`만 | — | — | **DEPRECATED** (주석·푸시 비활성) |
| `deploy-mobile.yml` | 모바일 빌드 | `main`+`mobile/**`, dispatch | — | — | |

### CI·품질·점검·수동 유지보수

| 파일 | 역할 | 트리거 요약 | dev/prod 쌍 | reusable | 비고 |
|------|------|-------------|-------------|----------|------|
| `code-quality-check.yml` | 코드 품질 | PR/push main·develop, dispatch | — | — | |
| `e2e-trinity-build-smoke.yml` | Trinity 빌드 스모크 | PR/push main·develop, paths `frontend-trinity/**` 등, `workflow_dispatch` | — | — | `frontend-trinity`에서 `npm ci` → `npm run build:ci` (`ESLINT_NO_DEV_ERRORS=true next build`). Playwright 없음. Secrets 불필요. |
| [`e2e-erp-smoke.yml`](../../.github/workflows/e2e-erp-smoke.yml) | ERP 라우트 정적 검증(`npm run verify:erp`) + Playwright 리다이렉트·스모크(로그인 불필요, `tests/e2e/tests/erp/` 일부) | PR `main`/`develop`, paths: `frontend/src/components/erp/**`, `frontend/src/App.js`, `tests/e2e/tests/erp/**`, `tests/e2e/playwright.config.ts`, `frontend/scripts/verify-erp-navigate-targets.mjs`, `frontend/scripts/verify-erp-menu-items-sync.mjs`, `frontend/src/components/dashboard-v2/constants/menuItems.js`, `frontend/package.json`, `workflow_dispatch` | — | — | Secrets 불필요. 상세 시나리오·QA 연계: `docs/planning/ERP_TEST_SCENARIOS.md`, `docs/project-management/ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md` QA-02. |
| [`e2e-consultation-log-smoke.yml`](../../.github/workflows/e2e-consultation-log-smoke.yml) | 상담일지 모달 어드민 스모크(`tests/e2e/tests/admin/consultation-log-modal-smoke.spec.ts`, Chromium) | PR `main`/`develop` + paths(스펙·playwright 설정·`ConsultationLogModal`·로컬 자동저장 훅·드래프트 어댑터·`consultationLogAutosave*` 상수), `workflow_dispatch` | — | — | **백엔드·로그인 전제 — 워크플로에 백엔드 기동 없음.** 잡 조건: `secrets.E2E_TEST_EMAIL` 또는 `secrets.E2E_ADMIN_USERNAME` 중 하나(`.cursor/skills/core-solution-testing/SKILL.md` 권장: `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`). 선택 `E2E_BASE_URL`. `BASE_URL` 기본 `http://localhost:3000`. |
| `ci-bi-protection.yml` | CI/BI 보호 | PR/push main·develop | — | — | |
| `ops-frontend.yml` | Ops 프론트 CI | push/PR `frontend-ops/**` | — | — | |
| `ops-backend.yml` | Ops 백엔드 CI | push/PR `backend-ops/**` | — | — | |
| `ssl-auto-renewal-check.yml` | SSL 갱신 점검 | `workflow_dispatch`(dev/prod 선택) | — | — | |
| `check-dev-server-logs.yml` | 개발 서버 로그 | `workflow_dispatch` | — | — | |
| `fix-procedure-direct.yml` | 프로시저 직수정 | `workflow_dispatch` | — | — | |
| `fix-production-db.yml` | 운영 DB 수정(확인 입력) | `workflow_dispatch` | — | — | 수동·위험 작업 |
| `emergency-db-cleanup.yml` | 긴급 DB 정리 | `workflow_dispatch` | — | — | |
| `diagnose-onboarding-issues.yml` | 온보딩 진단 | `workflow_dispatch` | — | — | |

---

## 변경·운영 시 프로세스

배포·워크플로 구조 변경은 **core-planner** 주관 하에 [위임 순서](../project-management/CORE_PLANNER_DELEGATION_ORDER.md)에 따라 explore(탐색)·core-coder(구현)·shell(실행)·core-tester(검증) 등으로 분배하는 것을 원칙으로 한다.
