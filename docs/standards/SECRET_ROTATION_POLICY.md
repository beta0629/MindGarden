# Secret 회전 정책

**버전**: 1.0.0  
**최종 업데이트**: 2026-06-14  
**상태**: 공식 표준 (P0 표준 5종 묶음)

## 1. 정책 개요

운영(`production`) 의 모든 secret 은 **정기 회전** 한다. 회전 주기·승인 경로·롤백 절차를 표준화하여 회귀·평문 노출·미회전 누적을 차단한다.

## 2. 회전 대상·주기

| Secret | 주기 | 근거 |
|---|---|---|
| `JWT_SECRET` | **분기 1회** (Q1·Q2·Q3·Q4 초) | 토큰 위조·세션 탈취 시 영향 광범위 |
| `KAKAO_CLIENT_SECRET` | **분기 1회** | 카카오 CS 권고 + 소셜 로그인 핵심 |
| `NAVER_CLIENT_SECRET` | **분기 1회** | 네이버 CS 권고 + 소셜 로그인 핵심 |
| `PERSONAL_DATA_ENCRYPTION_KEY` | **연 1회** (다중 키 v1→v2→...) | AES-256 PII 키, 복호화 호환 유지 |
| `PERSONAL_DATA_ENCRYPTION_IV` | **연 1회** (KEY 와 동시) | IV 단독 회전 금지 |
| `MINDGARDEN_DORMANT_PII_ENC_KEY` | **연 1회** | 휴면 PII 키, KEY 와 동시 회전 |
| 기타 OAuth (Google·Apple) | **연 1회** | 변경 시 콘솔 동기화 필요 |

`PERSONAL_DATA_ENCRYPTION_KEYS=v2:...,v1:...` 형식의 **다중 키 등록** 으로 복호화 호환을 유지한다 (`PersonalDataEncryptionKeyProvider`).

## 3. 회전 절차

1. **승인**: Repo Admin + 운영팀 리드 2인 승인 (P0 채널).
2. **신규 secret 생성**: 64자 이상 랜덤 문자열 (`openssl rand -hex 32`).
3. **GitHub Secrets 갱신**: 새 값으로 update (이전 값은 KEY/IV 의 경우 다중키 리스트에 보존).
4. **`prod.env` 갱신**: deploy workflow 의 sync step 이 자동 반영 — 수동 SSH 편집 금지.
5. **운영 BE 재기동**: blue/green 무중단 (`core-deployer`).
6. **검증** (`core-tester`):
   - JWT/소셜: 신규 발급 토큰 1건 정상 검증, 기존 발급 토큰 만료 후 자연 invalid.
   - PII KEY: v1 로 암호화된 기존 row 복호화 + v2 신규 row 암호화 모두 GREEN.
7. **회전 기록**: 본 문서 §6 회전 이력 표에 추가 (날짜·키·승인자·완료자).

## 4. 롤백 절차

| 증상 | 액션 |
|---|---|
| 회전 직후 부팅 실패 | 직전 secret 으로 GitHub Secrets 재설정 → deploy workflow 재실행 |
| PII 복호화 실패 row 발생 | 다중 키 리스트에 이전 키(`v1`) 즉시 추가 + BE 재기동, `core-debugger` 위임 |
| 소셜 로그인 100% 실패 | 카카오/네이버 콘솔의 secret 과 GitHub Secrets 동기화 재확인 |

회전 후 24h 모니터링이 GREEN 이면 이전 secret 폐기. KEY/IV 는 **180일 보존** 후 폐기 (휴면 PII 복호화 호환).

## 5. 금지 사항

- 회전된 secret 평문을 채팅·티켓·문서·로그에 게시 금지.
- systemd unit `Environment=` 인라인 secret 회전 금지 — `prod.env` 단일 SSOT 만 사용 ([`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md)).
- IV 단독 회전 / 다중 키 등록 없이 KEY 회전 금지 (복호화 호환 깨짐).
- 운영 시간대(09:00 ~ 22:00 KST) JWT/PII 회전 강행 금지 — 23:00 ~ 06:00 권장.

## 6. 회전 이력

| 날짜 | Secret | 사유 | 승인자 | 완료자 | 비고 |
|---|---|---|---|---|---|
| (예시) 2026-Q2 초 | JWT_SECRET | 분기 정기 | Repo Admin | core-deployer | 무중단 GREEN |

## 7. 참조

- [`DB_ENV_SSOT_POLICY.md`](./DB_ENV_SSOT_POLICY.md) — env 파일 SSOT
- [`SYSTEMD_FALLBACK_DB_ENV_POLICY.md`](./SYSTEMD_FALLBACK_DB_ENV_POLICY.md) — unit 평문 금지
- [`ENCRYPTION_STANDARD.md`](./ENCRYPTION_STANDARD.md) — PII KEY 관리
- [`SECURITY_AUTHENTICATION_STANDARD.md`](./SECURITY_AUTHENTICATION_STANDARD.md) — JWT 표준
- [`PII_PROTECTION_STANDARD.md`](./PII_PROTECTION_STANDARD.md) — 다중 키 + AttributeConverter
