# RESUME — PROD 일상 배포는 GitHub Actions만

**상태**: 정책 고정 (문서화)  
**일자**: 2026-09-15  
**범위**: 스킬·에이전트·배포 표준 — **PROD 재배포 실행 없음**

## 정책 (모든 에이전트)

1. **일상 PROD 배포** = `workflow_dispatch` / 지정된 deploy workflow만  
   (`deploy-production.yml`, `deploy-frontend-prod.yml`, `deploy-unified-production.yml` 등).
2. **SSH FE/JAR 직접 컷오버**(atomic swap·수동 scp) = **금지**.  
   Actions budget이 막혀도 SSH로 우회하지 말 것 → 사용자에게 **billing/Actions 한도 해제** 안내.
3. **예외**: 긴급 장애 복구 문서에 명시된 **롤백만**. 일상 배포 경로 ≠ 롤백.
4. **유지**: 부분 tip 단독 금지 · `docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md` **6항** 게이트 · DATAFIX 0.

## 참조

- `/core-solution-deployment` → `.cursor/skills/core-solution-deployment/SKILL.md`
- `core-deployer` → `.cursor/agents/core-deployer.md`
- `docs/deployment/DEPLOY_NO_OVERWRITE_GATE.md`
- `docs/standards/DEPLOYMENT_STANDARD.md`

## 재개 시

- PROD 반영 요청 → Actions 워크플로만 안내/실행. SSH 컷오버 제안 금지.
- 본 핸드오프는 정책 SSOT 요약이며, 워크플로 `on:` 은 각 `deploy-*.yml`이 우선.
