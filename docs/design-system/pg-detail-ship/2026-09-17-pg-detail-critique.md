# Clinic-OS · 결제 연결 상세/설정 (데스크톱) — 검수

- Who: 센터 관리자 — PG 등록·수정·연결 시험
- From: clinic-os-pg-detail.md + tobe.html + shot-pg-detail-tobe.png
- Date: 2026-09-17 (Asia/Seoul)
- Bar: 쉽고·편하고·가지고 싶게 · ink/slate · 녹링 금지 · 데스크톱 우선

## Verdict
**PASS · Ship** — 열쇠 스트립(채널 키·스토어 ID·테스트 모드) · 2열 폼 · 배지 1 · 선택=#E2E8F0+1px #94A3B8 · Primary 틸=저장만 · 모바일 1열 탈피. @코어개발/@코어솔루션 OK.

## Fix first
없음.

## Worth fixing
1. **URL 필드** — 스펙 TO-BE에 「URL」있음. 폼에 없음. 포트원에 필요하면 2열에 추가, 아니면 md에서 빼기.
2. **열쇠 스트립 vs 폼 이중 편집** — 스트립은 읽기 요약만(`.sel` 포커스 연출 제거). 편집은 「연결 정보」만.
3. **테스트 모드 라벨** — 「켜짐 · testMode」→ 「켜짐」. 영문 키는 help만.
4. **⋯ 삭제** — 펼침 한 컷 또는 md에 「삭제=⋯ · muted brick」명시.

## Working well
- channelKey·storeId·testMode 상단 노출
- 녹/틸 선택 링 없음 · amber 승인 대기 레일
- 표준어 · ops 승인 범위 밖 명시
- AI티/제네릭 SaaS 히어로 없음

## Could not judge
- 1280 실측 스크롤 · 빈/오류/긴 키 상태

## Open fixes
| id | severity | finding | cleared |
|----|----------|---------|---------|
| pgd1 | worth fixing | URL 필드 스펙 정합 | open |
| pgd2 | worth fixing | 스트립=요약만 | open |
| pgd3 | worth fixing | testMode 라벨 | open |
| pgd4 | worth fixing | 삭제 ⋯ 명시 | open |
