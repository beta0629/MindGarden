# Clinic-OS · 결제 연결 상세/설정 (데스크톱)

리더 P0 2026-09-17 · 원칙: 쉽고·편하고·가지고 싶게 · ink/slate · **녹 링·워시 금지** · 표준어  
범위: 센터 웹 관리자 **상세·등록·수정** (`/tenant/pg-configurations/:id` · `/new` · `/:id/edit`)  
목록 PASS분(`clinic-os-pg-settings.md`)·ops 승인(`clinic-os-pg-ssot.md`)과 분리.

## AS-IS
- 목록: `asis-pg-settings.png` (카드·세로 필터 — 모바일 밀도)
- 상세/폼: 섹션·필드 **세로 스택** · 데스크톱에서도 좁은 1열 감각 · `channelKey` 노출 약함
- 선택·포커스에 틸/녹 링 잔재 위험 (사용자 비선호)

## AS-IS 증상
1. 데스크톱에서 **한 줄에 안 읽힘** — 필드가 폰 폼처럼 길게 쌓임
2. 결제에 꼭 필요한 **채널 키 · 테스트 모드 · 스토어 ID**가 눈에 안 띔
3. 상태 배지 이중·영문 PG 제목 · 삭제 solid 빨강
4. 녹/틸 선택 링

## TO-BE (데스크톱 우선)
- 셸: LNB + quiet 헤더 + **단일 스테이지** (대시보드 뼈대)
- 제목 「결제 연결」 · 부제 「카드·간편결제 · 승인 후 사용」
- 상태 배지 **하나**: 사용중 / 승인 대기 / 거부 (ink/slate·amber)
- **열쇠 스트립**(독특한 한 점): 상단 가로 3칸  
  1. **채널 키** (`channelKey`)  
  2. **스토어 ID** (`storeId`)  
  3. **테스트 모드** (`testMode` 스위치)  
  → 아래 2열: 제공자·가맹·시크릿·연결 시험 (URL 기본 없음)
- 액션 한 줄 높이 36: 목록으로 · 연결 시험 · 저장(수정) · ⋯(삭제 muted brick `#A84848`)
- 선택/포커스: 채움 `#E2E8F0` + `1px #94A3B8` · **녹 링 금지**
- Primary CTA만 dusty teal `#0E5F5A` (선택 링 아님)
- 시안: `clinic-os-pg-detail-tobe.html`

## 카피 (보이는 이름)
| 필드 키 | 라벨 | 힌트 |
|---------|------|------|
| channelKey | 채널 키 | 포트원 채널 키 |
| storeId | 스토어 ID | 상점·스토어 식별 |
| testMode | 테스트 모드 | 켜면 테스트 결제만 |
영문 키는 힌트/코드칸만. 제목에 PG·channelKey 금지.

## 하지 말 것
- 모바일 1열을 데스크톱에 그대로
- 녹/틸 링·워시·녹색 칩
- ops 승인 UI를 이 시안으로 덮기
- 코드·구현 지시

## Ship (크리틱 PASS · Ship 2026-09-17)
- 열쇠 스트립 + 2열 · channelKey·storeId·testMode · 녹링 없음 · 배지 1
- 검수: `/workspace/design-critiques/core-solution-unity/2026-09-17-pg-detail-critique.md`

## Worth fixing (막지 않음 · 구현 시)
1. **URL 필드** — 포트원 필요 시 2열에 추가, 아니면 스펙에서 제외(현재 폼에 URL 없음 → **스펙에서 URL 문구 제거**, 필요 시 코어가 추가).
2. **열쇠 스트립** — **읽기 요약만**. 포커스/`.sel` 편집 연출 금지. 편집은 「연결 정보」만.
3. **테스트 모드 라벨** — 「켜짐」만. `testMode`는 help.
4. **삭제** — ⋯ 메뉴 · muted brick `#A84848` (본문 solid 삭제 금지).

## TO-BE 정합 (Worth 반영)
- 열쇠 스트립 아래 2열: 제공자·가맹·시크릿·연결 시험 (**URL 칸 기본 없음**)
- 스트립 셀 = 요약 표시(클릭해도 인라인 편집 없음)

## 핸드오프
`clinic-os-pg-detail.md` · `clinic-os-pg-detail-tobe.html` · `shot-pg-detail-tobe.png`  
@코어개발 · @코어솔루션 — PASS·Ship. Worth는 구현 때.
