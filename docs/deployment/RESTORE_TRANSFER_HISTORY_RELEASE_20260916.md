# SessionTransferHistory → release/prod + release/dev restore
# Date: 2026-09-16 UTC | Role: core-deployer | SSH cutover: FORBIDDEN

## Verdict
SessionTransferHistory BE+FE (+ 승계 terminology) already present on release/prod tip
9e7d344d4 and release/dev (synced). 6-gate PASS both. DATAFIX not required.
Live gap = deploy lag (investigation JAR @ 66f3d1401 lacked controller; FE main.d6f3ce25.js
had 0× session-transfer-history). Actions push deploys for tip 9e7d344d4 are queued/
waiting. Cloud agent cannot workflow_dispatch (HTTP 403). Manual hub dispatch also
blocked from this token; prior hub failure on runner: `gh: command not found`.

## Merge status (no further code merge needed for feature)
| Ref | SHA | AdminSessionTransferHistory* | SidePeek mount | 승계 labels | 6-gate |
|-----|-----|------------------------------|----------------|-------------|--------|
| origin/release/prod | 9e7d344d4 | YES | YES | YES (SECTION_TITLE=회기 승계 이력) | pass=31 fail=0 |
| origin/release/dev  | 582328828 (merge of 9e7d344d4) | YES | YES | YES | pass=31 fail=0 |

Ancestry: cursor/unified-prod-ship-7f13 + cursor/fix-sidepeek-transfer-history-7f13
ARE ancestors of release/prod. cursor/session-transfer-history-7f13 is NOT required
separately (content landed via unified tip).

release/dev sync commit this session:
  582328828 merge(dev): sync SessionTransferHistory accordion tip from release/prod
  (pushed to origin/release/dev)

## Symbols (gate item 4)
- SessionTransferHistorySection.js + mount in MappingScheduleSidePeekContent.js
- AdminSessionTransferHistoryController
  GET /api/v1/admin/clients/{id}/session-transfer-history
  GET /api/v1/admin/mappings/{id}/session-transfer-history
- API path string session-transfer-history

## Deploy path (Actions only — no SSH)
Workflow SSOT: .github/workflows/deploy.yml  name: 🚀 Deploy (manual hub)

Preferred (when token/runner healthy):
  gh workflow run '🚀 Deploy (manual hub)' --ref release/prod \
    -f env=prod -f target=core-prod-unified -f deploy_ref=release/prod
  # Note: core-prod-unified → deploy-unified-production.yml also shells out to `gh`;
  # runner historically missing gh → prefer be+fe direct:

  gh workflow run '🚀 Core Solution 운영 배포' --ref release/prod -f deploy_ref=release/prod
  gh workflow run '🎨 Frontend (CoreSolution) 운영 배포' --ref release/prod -f deploy_ref=release/prod

  gh workflow run '🚀 Deploy (manual hub)' --ref release/dev \
    -f env=dev -f target=core-be -f deploy_ref=release/dev
  gh workflow run '🚀 Deploy (manual hub)' --ref release/dev \
    -f env=dev -f target=core-fe -f deploy_ref=release/dev
  # or direct:
  gh workflow run '🚀 CoreSolution 백엔드 개발 서버 배포' --ref release/dev
  gh workflow run '🎨 Frontend (CoreSolution) 개발 서버 배포' --ref release/dev

This agent attempted the above → all HTTP 403 Resource not accessible by integration.

## In-flight Actions (push-triggered — already Actions, not SSH)
PROD @ 9e7d344d4 (accordion merge brought STHistory onto release/prod):
- BE  https://github.com/beta0629/MindGarden/actions/runs/35042388479  status=waiting (env prod)
- FE  https://github.com/beta0629/MindGarden/actions/runs/35042388724  status=queued

DEV (earlier sync containing STHistory + accordion):
- BE  https://github.com/beta0629/MindGarden/actions/runs/35042180584  in_progress
- FE  https://github.com/beta0629/MindGarden/actions/runs/35042180749  queued
- FE  https://github.com/beta0629/MindGarden/actions/runs/35042272667  queued

Human next: approve GitHub Environment `prod` pending deployment for run 35042388479
(or re-run workflow_dispatch with a token that has actions:write). Do NOT SSH cutover.

## Verification guide (post-deploy)
DATA: audit_logs MAPPING_SESSION_SUCCESSION 임선희(61)↔김예린(75) = 2 rows (DATAFIX 0).

1. Open mapping **175** (client 61 ACTIVE) Side Peek → expect **회기 승계 이력 2건**.
2. Or client **61** history API / client-scoped peek path → 2건.
3. mapping **180** alone (TERMINATED, not source/target) → may show **empty** due to
   mappingId filter (source/target only). Do not treat as missing data.
4. Post-check: JAR contains AdminSessionTransferHistoryController.class;
   live main.*.js contains string `session-transfer-history`.

## Policy refs
- docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md (6-item freeze)
- scripts/deployment/check-deploy-no-overwrite-symbols.sh
- docs/standards/DEPLOYMENT_STANDARD.md
- docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md
- .github/workflows/deploy.yml (manual hub)
