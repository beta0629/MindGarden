# RESUME — PROD 일상 배포는 GitHub Actions만 (그록봇 hub)

**상태**: 정책 고정 + hub(`deploy.yml`) main 반영 PR  
**일자**: 2026-09-15  
**SSH**: 일상 FE/JAR 컷오버 **안 함** (금지)

## 쓸 워크플로 (유일 수동 진입)

| 항목 | 값 |
|------|-----|
| 파일 | `.github/workflows/deploy.yml` |
| 표시 이름 | `🚀 Deploy (manual hub)` |
| 트리거 | `workflow_dispatch` only |
| 풀스택 PROD | `env=prod`, `target=core-prod-unified`, `deploy_ref=`(빈값→main) |
| 하위 오케스트레이션 | `deploy-unified-production.yml` (`🛰️ 운영 통합 배포 (단일 진입점)`) |

## 그록봇/개선 커밋

| SHA | 내용 | 위치 |
|-----|------|------|
| `647abfded` | Actions 분 절감 (cron·CI push 이중 제거) | #1026 → **develop** |
| `be023dc59` | `ci.yml` + `deploy.yml` 허브 통합 | #1027 → **develop** |
| merge `a00ea5dd7` | #1027 merge commit | **develop tip** (main 아님) |

`main`에 `deploy.yml`이 없으면 Actions 레지스트리 path가 구 **Deploy Homepage**와 충돌·미등록될 수 있다. **본 브랜치 PR로 hub를 main에 올린 뒤** UI에서 `🚀 Deploy (manual hub)` 로 Run.

## UI 수동 실행 (agent `workflow_dispatch` 403 시)

1. GitHub → **Actions**
2. 좌측 **`🚀 Deploy (manual hub)`** (없으면 아직 main 미반영 — 본 PR merge 후)
3. **Run workflow** → branch **`main`**
4. `env` = **prod**, `target` = **core-prod-unified** (또는 core-be / core-fe)
5. `deploy_ref` 비우거나 **main**
6. Run → 하위 `deploy-unified-production` / `deploy-production` watch

Actions budget 막힘 → **billing/Actions 한도 해제만**. SSH 우회 금지.

## 참조

- `/core-solution-deployment`
- `core-deployer`
- `docs/deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md`
- `docs/standards/DEPLOYMENT_STANDARD.md`
