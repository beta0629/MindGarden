# 운영 인수인계 — 빠른 링크 (1페이지)

운영 반영·엣지·배포·사후 검증 시 아래 문서·워크플로만 따라가도 역할 분리와 순서를 잃지 않도록 묶었다. **상대 경로만** 사용한다.

**인덱스**: [운영반영 폴더 README](./README.md)

---

## 링크

| 항목 | 경로 |
|------|------|
| Go-Live 전 종합 체크리스트 | [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](./PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) |
| 배포 후 확인 — CAPTCHA·공개 온보딩 | [POST_DEPLOY_VERIFY_CAPTCHA_ONBOARDING.md](../deployment/POST_DEPLOY_VERIFY_CAPTCHA_ONBOARDING.md) |
| SEC-01 공개 온보딩 — 엣지·운영 역할 | [SEC01_PUBLIC_ONBOARDING_EDGE_AND_OPS.md](../deployment/SEC01_PUBLIC_ONBOARDING_EDGE_AND_OPS.md) |
| GitHub Actions 워크플로 인덱스 | [GITHUB_ACTIONS_WORKFLOW_INDEX.md](../deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md) |
| 코어솔루션 운영 배포 | [deploy-production.yml](../../.github/workflows/deploy-production.yml) |
| Trinity 프론트 운영 배포 | [deploy-trinity-prod.yml](../../.github/workflows/deploy-trinity-prod.yml) |

---

## 역할 구분

| 구분 | 주요 대상 | 비고 |
|------|-----------|------|
| **인프라** | [SEC01](../deployment/SEC01_PUBLIC_ONBOARDING_EDGE_AND_OPS.md) (엣지·Nginx·레이트리밋·인프라 담당 경계), Go-Live 체크리스트 중 DNS·환경·보안 경계 항목 | 플랫폼·엣지 정책은 저장소 밖 절차와 병행 |
| **앱 배포** | [워크플로 인덱스](../deployment/GITHUB_ACTIONS_WORKFLOW_INDEX.md), [deploy-production.yml](../../.github/workflows/deploy-production.yml), [deploy-trinity-prod.yml](../../.github/workflows/deploy-trinity-prod.yml) | 각 파일 `on:`·paths가 트리거 근거 |
| **검증** | [POST_DEPLOY_VERIFY](../deployment/POST_DEPLOY_VERIFY_CAPTCHA_ONBOARDING.md), [PRE_PRODUCTION 체크리스트](./PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) | 배포 성공·스모크·설정 이름 확인 순서 |

---

*비밀값·토큰·운영 URL 평문은 문서에 적지 않는다. 시크릿·호스트 값은 운영 표준과 GitHub Secrets 정책을 따른다.*
