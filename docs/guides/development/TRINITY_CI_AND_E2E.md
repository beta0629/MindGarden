# Trinity CI·E2E와 워크플로 구분

**목적**: Core 메인 프론트(`frontend/`)의 ERP 스모크, Trinity 전용(`frontend-trinity/`) 빌드 스모크, Trinity SSH 배포가 서로 다른 워크플로로 동작함을 한곳에 정리한다.

**상세 인덱스**: 저장소 전체 GitHub Actions 요약은 [GitHub Actions 워크플로 인덱스](../deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md)를 본다.

---

## `e2e-erp-smoke.yml` (이름: ERP E2E smoke)

- **대상**: Core **`frontend/`** — `npm ci`는 `frontend`에서 수행한다.
- **정적 검증**: `frontend`에서 `npm run verify:erp`(ERP 라우트·메뉴 등).
- **E2E**: `tests/e2e`에서 Playwright로 ERP **리다이렉트** 스모크(백엔드 없이 리다이렉트 위주).
- **`on.pull_request.paths`**: `frontend/src/components/erp/**`, `App.js`, `tests/e2e` 관련 경로, `verify-erp-*.mjs`, `menuItems.js`, `frontend/package.json` 등 — **`frontend-trinity/**`는 포함되지 않는다.** Trinity 변경만으로는 이 워크플로가 paths로 자동 실행되지 않는다.

---

## `e2e-trinity-build-smoke.yml` (이름: Trinity build smoke)

- **대상**: **`frontend-trinity`만** — `npm ci` 후 `npm run build:ci`(`ESLINT_NO_DEV_ERRORS=true` 등 CI 빌드).
- **Playwright 없음** — 포트·baseURL 혼선을 피하기 위한 정적 빌드 스모크.
- **GitHub Secrets 불필요** — checkout·Node·npm 캐시·빌드만 수행한다.
- **`paths`**: `frontend-trinity/**`, 해당 워크플로 파일, `frontend-trinity/package-lock.json`.

---

## Trinity 배포 워크플로 (빌드 스모크와 목적이 다름)

- **`deploy-trinity-dev.yml`**: `develop` 브랜치 등에서 `frontend-trinity` 변경 시 **개발 서버로 정적 사이트 SSH 배포** — 빌드 산출물을 원격에 올리는 파이프라인(인덱스의 dev용 시크릿·헬스 URL 참고).
- **`deploy-trinity-prod.yml`**: `main` 등에서 **운영 정적 사이트 SSH 배포** — 동일하게 “배포”이며, 위 빌드 스모크 잡과 역할이 다르다(인덱스의 prod용 시크릿·헬스 URL 참고).

배포·트리거·paths 요약표는 [워크플로 인덱스](../deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md) 상단의「정적 사이트 SSH 배포 쌍」표를 본다.

---

## 로컬에서 Trinity CI 빌드와 동일하게 확인

```bash
cd frontend-trinity && npm run build:ci
```

---

## 관련 문서 (역할 구분)

| 문서 | 용도 |
|------|------|
| [GITHUB_ACTIONS_WORKFLOW_INDEX.md](../deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md) | Trinity·Ops·Core 정적 프론트·CI 워크플로 **전체 인덱스** |
| [BACKEND_MYSQL_INTEGRATION_TESTS.md](./BACKEND_MYSQL_INTEGRATION_TESTS.md) | **백엔드(Java)** — MySQL을 쓰는 `@Disabled` 통합 테스트 실행 가이드. Trinity 프론트 CI·`build:ci`와는 **별 주제**이다. |
