# Clinic-OS · PG 상세 P0 — 시안 샷 vs 운영 실물

- Who: 센터 관리자 — 결제 연결 상세
- Criterion: **시안 샷만** (`shot-pg-detail-tobe.png`). 실물≠시안 = FAIL (리더 2026-09-17)
- Live: `https://mindgarden.core-solution.co.kr/tenant/pg-configurations/22e68d7b-ea51-43e5-9781-435f00e8b577`
- Evidence: `p0-ops-live-pg-detail.png` · 대시보드 대조 `p0-ops-live-dashboard.png`
- Date: 2026-09-17 (Asia/Seoul)

## Verdict
**FAIL · Ship 금지** — 운영 실물이 TO-BE 시안과 구조적으로 불일치.

## Fix first (갭)
1. **상세=조회 전용** — 시안은 2열 **편집 폼**(제공자·가맹·채널 키·스토어 ID·테스트 모드·API 시크릿) + Primary **저장**. 실물은 읽기 그리드 + **채널 키 수정**만. 편집·저장 흐름이 시안과 다름.
2. **API 시크릿 칸 없음** — 시안 「연결 정보」에 시크릿 필드. 실물 없음.
3. **액션 바** — 시안: 목록 · 연결 시험 · **저장** · **⋯(삭제)**. 실물: 목록으로 · 연결 시험 · 채널 키 수정. 저장·⋯ 없음.
4. **승인 안내 레일 없음** — 시안 amber 「저장 후 ops 승인…」배너. 실물 없음(사용중 배지만).
5. **브레드크럼** — 시안 「결제 연결 / 상세」. 실물 없음(LNB 타이틀만 「PG 설정 상세」).

## Worth fixing
- 열쇠 스트립 3칸(채널 키·스토어 ID·테스트 모드)은 실물에 **이미 있음** — 유지.
- 제목·부제 「결제 연결」「카드·간편결제 · 승인 후 사용」실물 일치.
- 목록 화면(`p0-ops-live-pg-list.png`)은 이번 P0 범위 밖이나, 중앙 고정폭·틸 선택·영문 「PG 설정 관리」는 별도 FAIL 후보.

## 셸 폭 (대시보드 나란히)
대시보드·상세 모두 본문 좌측 거터 존재 · 카드가 LNB에 붙지 않음(엣지 붙음 FAIL 아님). 다만 상세가 시안 폼 구조가 아니라 **갭 1–5가 Ship을 막음**.

## Working well (실물)
- 열쇠 스트립 상단 3칸
- 녹 링(본문) 눈에 띄지 않음
- 표준어 제목 「결제 연결」

## Open fixes
| id | severity | finding | cleared |
|----|----------|---------|---------|
| p0-1 | blocker | 상세→시안 편집 폼+저장 | open |
| p0-2 | blocker | API 시크릿 필드 | open |
| p0-3 | blocker | 저장·⋯ 액션 | open |
| p0-4 | blocker | ops 승인 amber 레일 | open |
| p0-5 | worth | 브레드크럼 | open |

## Handoff
@코어개발 · @코어솔루션 — 시안 `clinic-os-pg-detail-tobe.html` / `shot-pg-detail-tobe.png` 기준으로 실물 갭 해소. @레이아웃 — 시안 최신분과 실물 경로 확인.
