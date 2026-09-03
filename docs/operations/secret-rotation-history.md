# Secret 회전 이력

**버전**: 1.0.0
**관리 정책**: [`docs/standards/SECRET_ROTATION_POLICY.md`](../standards/SECRET_ROTATION_POLICY.md)
**자동 append 워크플로**: [`.github/workflows/rotate-jwt-secret.yml`](../../.github/workflows/rotate-jwt-secret.yml)

---

## 0. 사용 방법

- **자동 append**: `rotate-jwt-secret.yml` 등 회전 워크플로가 성공 시 본 파일에 신규 행을 추가하고 PR을 생성한다.
- **수동 append**: 외부 콘솔 회전(KAKAO/NAVER/Apple/Google) 또는 DB_PASSWORD 회전처럼 워크플로 외에서 실행된 회전은 책임자가 직접 행을 추가한 PR을 올린다.
- **트리거 enum**: `정기` / `비상` / `롤백` / `재시도`
- **시크릿 값 평문 금지**: 본 표·PR·커밋 메시지 어디에도 시크릿 값 원문 0글자. 비고 열에는 길이·sha256 앞 8자·앞 4자 prefix 까지만 허용.

---

## 1. 이력 표

| 시점(KST) | 시크릿명 | 환경 | 트리거 | Run ID | 책임자 | 비고 |
|---|---|---|---|---|---|---|
| 2026-06-13 20:10 | `JWT_SECRET` | `prod` | 비상 | (수동, Run ID 없음) | 운영팀 | JWT_SECRET P0 사고(약 53자 로컬 fallback 키 운영 노출) 감지 — [P0 핸드오프](../운영반영/JWT_SECRET_P0_HANDOFF_20260613.md). 운영팀이 SSH 마스킹 명령으로 진위 확인 후 수동 회전. 사후 자동화 정책 신설(2026-06-14). |

---

## 2. 비고 열 표기 규칙

| 항목 | 표기 |
|---|---|
| 신규 키 강도 | `len=128 hex` 또는 `len=44 base64` 형식 |
| sha256 prefix | `sha256=abcd1234` (앞 8자만) |
| 평문 prefix | `prefix=abcd` (앞 4자만, 정말 필요한 경우에 한정) |
| 관련 사고 문서 | 상대 경로 마크다운 링크 |
| 외부 콘솔 | 콘솔명 + 회전 시각 |
| 2026-06-14 18:14 | `JWT_SECRET` | `dev` | 재시도 | [27494295730](https://github.com/beta0629/MindGarden/actions/runs/27494295730) | beta0629 | len=128 hex, sha256=ad7b3541 (구 키 N/A — 평문 미보유). 정책 §3 자동 회전. |
| 2026-07-02 02:48 | `JWT_SECRET` | `dev` | 정기 | [28536183895](https://github.com/beta0629/MindGarden/actions/runs/28536183895) | beta0629 | len=128 hex, sha256=60cde0f5 (구 키 N/A — 평문 미보유). 정책 §3 자동 회전. |

---

## 3. 회전 SLA 모니터링

- 정기 회전 누락 감지: 마지막 `정기` 트리거 행의 KST 일자 + 100일 초과 시 분기 회전 누락으로 판단한다.
- 동일 시크릿에 대해 30일 내 `비상` 트리거가 2회 이상 기록되면 보안 사고 사후 분석 의무 발동.
