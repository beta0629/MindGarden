# Cursor Cloud · Self-Hosted Runner SSOT

**역할**: 리더 SSOT — Cursor 클라우드 환경과 개발/운영 SSH·운영 DB 연동, GitHub Actions runner 배치 옵션.

**상태**: 문서·주석만. 현재 워크플로 `runs-on`은 `ubuntu-latest` 유지(러너 미등록 시 전면 실패 방지).

---

## 1. SSOT 선언 (리더)

Cursor 클라우드 환경에서 **개발 SSH**, **운영 SSH**, **운영 DB** 연동이 가능하다.

따라서 GitHub Actions **self-hosted runner**를 **Cursor VM / 클라우드 SSH 호스트**에 둘 수 있다. 배포·검증 설계·문서·워크플로 주석은 이 경로를 기준으로 맞춘다.

---

## 2. Runner 배치 옵션

| 옵션 | `runs-on` 예 | 상태 |
|------|--------------|------|
| **(A) GitHub-hosted** | `ubuntu-latest` | **현재 유지**. 러너 등록 전 기본값. |
| **(B) Self-hosted on Cursor cloud** | `[self-hosted, linux, deploy]` | 전환 시. Cursor VM/SSH 호스트에 runner 등록 후 labels 일치 필요. |

전환 시점에는 **labels·문서만** 맞추면 된다. 러너가 준비되기 전에 `runs-on`만 self-hosted로 바꾸지 않는다.

---

## 3. 배포·검증 경로

Actions 잡이 **Cursor 호스트 러너**에서 돌면, 동일 호스트(또는 그 호스트가 이미 가진) **SSH / DB 경로**로 배포·스모크·검증이 가능하다.

- 개발: 개발 SSH → 개발 서버·DB
- 운영: 운영 SSH → 운영 서버·운영 DB
- 헬스/스냅샷 등 검증 잡도 동일 원칙(검증 러너를 Cursor cloud self-hosted로 둘 수 있음)

시크릿·호스트 키는 기존 Actions secrets / 호스트 로컬 경로를 그대로 활용한다. path push 자동 배포 시그니처는 변경하지 않는다.

---

## 4. 전환 체크리스트

- [ ] Cursor cloud VM/SSH 호스트에 GitHub Actions **runner 등록**
- [ ] runner **labels** 확인 (예: `self-hosted`, `linux`, `deploy`)
- [ ] [`deploy.yml`](../../.github/workflows/deploy.yml) / 배포·검증 잡의 `runs-on`을 self-hosted labels로 **전환**
- [ ] **fallback**으로 `ubuntu-latest` 유지 여부 결정(전환 전·이중 대비)
- [ ] 본 SSOT·[`GITHUB_ACTIONS_WORKFLOW_INDEX.md`](./GITHUB_ACTIONS_WORKFLOW_INDEX.md)·[`DEPLOYMENT_STANDARD.md`](../standards/DEPLOYMENT_STANDARD.md)와 labels 문구 일치

---

## 5. 금지

- **러너 미등록 상태**에서 `runs-on`만 `[self-hosted, …]`로 바꿔 **전면 실패**시키는 것
- path push 자동 배포 로직·제품 코드를 이 SSOT 작업으로 변경하는 것

현재는 **(A)** 유지. **(B)** 는 등록·labels 확인 후.

---

## 6. 관련 링크

| 문서·파일 | 비고 |
|-----------|------|
| [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) | 수동 배포 허브. 상단 주석에 Cursor runner TODO |
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | PR CI. github-hosted 유지 권장 |
| [`GITHUB_ACTIONS_WORKFLOW_INDEX.md`](./GITHUB_ACTIONS_WORKFLOW_INDEX.md) | 워크플로 인덱스 · Runner 단락 |
| [`DEPLOYMENT_STANDARD.md`](../standards/DEPLOYMENT_STANDARD.md) | 배포 표준 · 수동 deploy / runner |
| [`.github/workflows/ops-health-snapshot.yml`](../../.github/workflows/ops-health-snapshot.yml) | 헬스 cron — 검증 러너 Cursor self-hosted 가능(참고) |
