# GitHub Actions 워크플로 인덱스 (Trinity·Ops 정적 프론트)

**목적**: Trinity·Ops 정적 프론트 배포 워크플로와 재사용(`workflow_call`) 구성을 한눈에 정리한다.

---

## 정적 사이트 SSH 배포 쌍

| 구분 | 워크플로 | 트리거 (브랜치) | paths (요약) | 시크릿 (SSH) | 헬스 URL |
|------|-----------|-----------------|--------------|----------------|----------|
| Trinity 개발 | [`deploy-trinity-dev.yml`](../../.github/workflows/deploy-trinity-dev.yml) | `develop` push, `workflow_dispatch` | `frontend-trinity/**`, 해당 workflow | `DEV_SERVER_HOST` / `DEV_SERVER_USER` / `DEV_SERVER_SSH_KEY` → 재사용 워크플로 `ssh_*` | `https://apply.dev.e-trinity.co.kr`, `https://dev.e-trinity.co.kr` (순차, 하나 성공 시 통과; 전부 실패 시 경고만) |
| Trinity 운영 | [`deploy-trinity-prod.yml`](../../.github/workflows/deploy-trinity-prod.yml) | `main` push, `workflow_dispatch`(`deploy_ref`, main만 허용) | 동일 | `PRODUCTION_HOST` / `PRODUCTION_USER` / `PRODUCTION_SSH_KEY` | `https://apply.e-trinity.co.kr` |
| Ops 개발 | [`deploy-ops-dev.yml`](../../.github/workflows/deploy-ops-dev.yml) | `develop` push, `workflow_dispatch` | `frontend-ops/**`, 해당 workflow | `DEV_SERVER_*` | `https://ops.dev.e-trinity.co.kr` |
| Ops 운영 | [`deploy-ops-prod.yml`](../../.github/workflows/deploy-ops-prod.yml) | `main` push, `workflow_dispatch`(main 가드) | 동일 | `PRODUCTION_*` | `https://ops.e-trinity.co.kr` |

**재사용 워크플로**: [`reusable-static-site-ssh-deploy.yml`](../../.github/workflows/reusable-static-site-ssh-deploy.yml) — `workflow_call`로 `secrets`(ssh_host, ssh_user, ssh_key)와 inputs(site_label, remote_html_dir, backup_*, scp_source, strip_components, artifact_name, health_urls)를 받아 SSH 테스트·백업(retention 5)·SCP·권한·index 검증·nginx -t·curl 헬스를 수행한다.

각 호출 워크플로는 **`build`**(checkout·운영은 가드 후 ref·Node·npm ci·빌드·`out` 검증·평탄 스테이징 후 `upload-artifact`)와 **`deploy`**(`needs: build`, `uses` 재사용 워크플로, `download-artifact`) 두 잡으로 구성된다. Trinity/Ops 아티팩트 이름은 각각 `trinity-static-site-artifact`, `ops-static-site-artifact`이며 SCP 전 `_static_site_upload/*`에 풀리고 `strip_components: 1`로 원격 `html-*` 루트에 맞춘다.

---

## 변경·운영 시 프로세스

배포·워크플로 구조 변경은 **core-planner** 주관 하에 [위임 순서](../project-management/CORE_PLANNER_DELEGATION_ORDER.md)에 따라 explore(탐색)·core-coder(구현)·shell(실행)·core-tester(검증) 등으로 분배하는 것을 원칙으로 한다.
