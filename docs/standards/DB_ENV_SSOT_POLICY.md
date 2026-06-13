# DB / 운영 환경변수 SSOT 정책

**버전**: 1.0.0  
**최종 업데이트**: 2026-06-13  
**상태**: 공식 표준 (점검 문서 [`DB_ENV_SSOT_PRECHECK_20260613`](../운영반영/DB_ENV_SSOT_PRECHECK_20260613.md) 부록 D.4 권장안)

## 1. SSOT 단일화 결정

운영(`production`) 백엔드의 환경변수 SSOT는 **`/etc/mindgarden/prod.env` 단일 파일**로 통일한다 (점검 문서 부록 D.4 안1).

- 저장소 정본 (`deployment/systemd/mindgarden-core-{blue,green}.service.example`, `deployment/README-BLUEGREEN.md`)이 이미 `prod.env` 단일 EnvironmentFile 패턴을 채택하고 있어 **추가 표준 변경 최소**.
- 현재 운영 실측은 `prod.env`(DB pw 5종) + `prod-from-dev.env`(60종, drop-in `90-envfile.conf`) 2 파일 + unit `Environment=` 22종이 공존하나, 이는 과도기 상태이며 단일화 대상이다.
- **두 env 파일은 키 set이 완전히 분리(공통 0개)** 되어 있어 머지 시 키 충돌 없음 → 단일화 위험도 최저.

## 2. `prod-from-dev.env` 폐기 일정

| 단계 | 산출물 | 비고 |
|---|---|---|
| **PR-1 (본 PR)** | 표준 문서 정합화 + `DB_ENV_SSOT_POLICY.md` 신설 + workflow 로그 메시지 정정 | 코드 로직 무변경 |
| **PR-2** | `deploy-production.yml` 4개 sync job DRY 통합 (composite action) + SSOT 파라미터화 | 별도 PR |
| **PR-3 (P0 chain)** | unit `Environment=` 평문 secret 6종 제거 (`JWT_SECRET` / `KAKAO/NAVER_CLIENT_SECRET` / `PERSONAL_DATA_ENCRYPTION_{KEY,IV}` / `MINDGARDEN_DORMANT_PII_ENC_KEY`) → `prod.env`로 이동 | JWT_SECRET hotfix 별도 |
| **PR-4** | `prod-from-dev.env` 60키 → `prod.env`로 이전 + drop-in `90-envfile.conf` 제거 + 운영 무중단 cutover | 운영팀 합의 + `core-tester` 게이트 필수 |

PR-2 ~ PR-4 가 머지되면 SSOT는 `/etc/mindgarden/prod.env` 단일이 되고, drop-in 및 unit `Environment=` 평문 secret은 0이 된다.

## 3. systemd unit `Environment=` 평문 secret 금지

- unit (`/etc/systemd/system/mindgarden-core-{blue,green}.service`) 및 drop-in (`*.service.d/*.conf`) 의 `Environment=` 라인에 **평문 secret 기재 금지**.
- 모든 secret은 `EnvironmentFile=/etc/mindgarden/prod.env` (perm `600`, owner `root:root`) 로만 주입한다.
- 비-secret 운영 상수(예: `SERVER_PORT=8080/8081` 슬롯 분리) 만 unit 인라인 허용.
- 위반 키는 운영 반영 게이트(`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`) 및 하드코딩 검사(`docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17) 에서 차단된다.

## 4. 백업 파일 보존 정책

- `deploy-production.yml` 의 sync job PRESERVE 단계에서 생성하는 `${ENV_FILE}.bak.${TIMESTAMP}` 백업은 **마지막 7개만 유지**한다 (현재 128개 누적, 디스크 압박 회피).
- 보존 정책은 PR-2 의 composite action 통합 시 단일 함수로 구현하며, 이전 백업은 동일 단계에서 `find ... -mtime +N -delete` 로 정리한다.
- RESTORE 가드(PR #296)는 그대로 유지하며, 보존 정책과 독립적으로 동작한다.

## 5. 참조 / 후속 절차

- 점검 / SSH 실측: [`docs/운영반영/DB_ENV_SSOT_PRECHECK_20260613.md`](../운영반영/DB_ENV_SSOT_PRECHECK_20260613.md) §1, §3, §6, 부록 D.4, E
- 보안 정책: [`SECURITY_STANDARD.md`](./SECURITY_STANDARD.md)
- 환경변수 네이밍: [`ENVIRONMENT_VARIABLE_STANDARD.md`](./ENVIRONMENT_VARIABLE_STANDARD.md)
- 배포 워크플로: [`DEPLOYMENT_STANDARD.md`](./DEPLOYMENT_STANDARD.md)
- 운영 반영 게이트: [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)

**최종 업데이트**: 2026-06-13 (신설 — D.4 권장안 명문화)
