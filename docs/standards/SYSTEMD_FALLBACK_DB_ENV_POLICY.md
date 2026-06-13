# systemd Fallback / DB Env 정책

**버전**: 1.0.0  
**최종 업데이트**: 2026-06-14  
**상태**: 공식 표준 (P0 표준 5종 묶음)

## 1. 정책 개요

운영(`production`) 환경변수 SSOT 는 **`/etc/mindgarden/prod.env` 단일 파일** 이다. systemd unit (`*.service`) 또는 drop-in (`*.service.d/*.conf`) 의 `Environment=` 라인에는 **평문 secret 을 두지 않는다**. 본 정책은 [`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md) 의 fallback / 운영 가드 측면을 표준화한다.

## 2. 절대 금지

- `Environment=JWT_SECRET=...` 등 secret 평문 인라인 (unit 또는 drop-in).
- `Environment=DB_PASSWORD=...` 등 DB 자격증명 인라인.
- `EnvironmentFile=-/etc/mindgarden/prod-from-dev.env` 처럼 dev env 를 prod fallback 으로 사용 (PR-4 cutover 완료 후).
- 운영 SSH 직접 편집 (`vim /etc/systemd/system/...`). 변경은 `deploy-production.yml` 워크플로 만 사용.

## 3. 허용 (unit 인라인)

`Environment=` 라인에 평문으로 둘 수 있는 값은 **비-secret 운영 상수** 뿐이다.

| 키 | 예 | 사유 |
|---|---|---|
| `SERVER_PORT` | `8080` / `8081` | blue/green 슬롯 분리 |
| `SPRING_PROFILES_ACTIVE` | `production` | 운영 프로파일 식별 |
| `MG_INSTANCE_SLOT` | `blue` / `green` | 자체 식별 메트릭 |

위 외 키는 전부 `EnvironmentFile=` 경유로 주입한다.

## 4. fallback 규칙

| 상황 | 정책 |
|---|---|
| `prod.env` 파일 미존재 | BE 부팅 실패 (Fail-Fast). fallback 으로 dev env 사용 금지. |
| `prod.env` 일부 키 누락 | `EnvironmentValidationConfig` 가 누락 키 로깅 + 부팅 차단 (필수 키) 또는 WARN (선택 키). |
| 키 일부 평문 인라인 (legacy) | 운영 반영 게이트(`PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`) 차단. PR-3 단계에서 prod.env 로 이전 후 unit 에서 삭제. |
| GitHub Actions sync 실패 | `deploy-production.yml` 의 PRESERVE/RESTORE 가드(PR #296·#299) 가 직전 정상 백업으로 자동 복원. |

## 5. unit 파일 작성 패턴 (정본)

```ini
[Service]
Type=simple
User=mindgarden
Group=mindgarden
EnvironmentFile=/etc/mindgarden/prod.env
Environment=SERVER_PORT=8080
Environment=SPRING_PROFILES_ACTIVE=production
Environment=MG_INSTANCE_SLOT=blue
ExecStart=/usr/bin/java ... -jar /opt/mindgarden/app.jar
Restart=always
```

`/etc/mindgarden/prod.env` 파일은 `perm 600`, `owner root:root` 로 유지. drop-in 폴더(`*.service.d/`) 는 비-secret 운영 상수 override 용도로만 허용.

## 6. CI / 운영 가드

- `deploy-production.yml` 4개 SSH step (PR #296·#299) — `prod-from-dev.env` 의 DB 키 sync 거부.
- 운영 반영 게이트(`PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`) — unit 평문 secret 검사 1회 필수.
- 향후: 운영 SSH 진단 스크립트(`scripts/check-systemd-env.sh`) 로 평문 secret 0건 정기 검증 (별도 PR).

## 7. 롤백

`prod.env` 무결성 손실 시 `deploy-production.yml` 의 PRESERVE 단계에서 보존한 직전 백업(`.bak.<timestamp>`) 으로 즉시 복원. 백업은 마지막 7개만 유지([`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md) §4).

## 8. 참조

- [`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md) — env SSOT 본 정책
- [`SECRET_ROTATION_POLICY.md`](./SECRET_ROTATION_POLICY.md) — secret 회전
- [`SECURITY_STANDARD.md`](./SECURITY_STANDARD.md) §2 환경 변수 관리
- [`DEPLOYMENT_STANDARD.md`](./DEPLOYMENT_STANDARD.md) — 배포 표준
