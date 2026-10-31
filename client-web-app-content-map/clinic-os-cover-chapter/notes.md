# Clinic-OS · 커버+챕터 — 상담사 홈 TO-BE

> 담당: 앱웹 디자인 (레이아웃 이관 아님)  
> 경로: `/workspace/client-web-app-content-map/clinic-os-cover-chapter/`  
> 구조 출처: `expo-struct-v2` IA만. Expo dusk/clay 색 **이식 금지**.

## Concept
**커버+챕터** — Clinic-OS 상담사 웹·태블릿 홈을 카드스택 로비에서 벗어난 구조로 재설계.  
풀블리드 SVG 커버(상담실 창·슬레이트/틸) + **플로팅 next-sheet 1개** + 챕터 스크롤(일정 → 안내).

## IA (After)
1. **커버면** (~45–55%) — 원본 SVG 상담실 창 + 오버레이(센터·상담사명)
2. **플로팅 시트** — 유일한 Primary next (다음 상담 1건 / zero=0건·일정 열기)
3. **챕터** — `01 일정` dense rows → `02 안내` 2차 정보
4. **Tablet L / Web** — 좌 커버 고정 | 우 시트+챕터 (폰 확대 금지)

## Tokens (clinic-os ONLY)
| Token | Hex | Use |
| --- | --- | --- |
| slate / ink | `#0F172A` | 커버 딥·제목 |
| dusty teal | `#0E5F5A` / `#0F766E` | MGButton primary · 챕터 번호 · 슬롯 |
| cream | `#FAF9F7` | 캔버스 |
| white | `#FFFFFF` | 시트·dense |
| line | `#E2E8F0` | 보더 |
| mute | `#64748B` | 보조 |
| amber | `#B45309` | 대기 배지만 |

- **Font:** Pretendard 고딕 only (세리프 금지)
- **Button:** MGButton language — primary solid `#0E5F5A`, on `#FAF9F7`, hover `#0A4F4B`
- **Shell:** full-bleed (중앙 max-width 카드스택 금지)
- **Floor:** purple/pink/cyan mesh · gradient text · ALL-CAPS eyebrow · 3 equal icon tiles · Pencil bar = FAIL
- **CTA:** 직접예약 없음. has=`상담일지 열기`+`일정` / zero=`일정 열기`

## Motion
| Token | Use |
| --- | --- |
| cover light drift 8s | SVG 창빛 opacity |
| sheet rise 480ms | 플로팅 시트 |
| chapter reveal | 스크롤 진입 |
| press 120ms | CTA scale(0.97) |

`prefers-reduced-motion: reduce` → off.

## break-ui
내담자명 `남궁민서윤아림정한솔예린` — 시트·일정 행에 노출(말줄임).

## Screens
- `tobe-home.html` — has + zero · web / tablet P / tablet L
- Shots: `home-web`, `home-tablet-portrait`, `home-tablet-landscape` (+ `-zero`)

## Out of scope
Expo 내담자 앱 · 코어 PR · PortOne · 유료 레퍼런스 MCP

## Density pass (2026-10-29)
구조·토큰·CTA 라벨 유지. 간격·계층만 조임.

- **간격:** section-gap 40→26 · chapter mb 22→15 · float-sheet padding/margin↓ · scroll top(시트↔챕터)↓ · row pad 9/12·minH 48(≥44) · guide/empty 안쪽 12–14
- **계층:** sheet-dom 1.875/2.125rem ≫ chap-title 1.0625rem · chap-num caption teal · time tabular 앵커 · cover-sub 보조
- **zero:** 시트 Primary「일정 열기」1개 · empty 챕터는「주간 일정 보기」링크급으로 약화(중복 CTA 제거)
- **밀도:** has 칩 오늘/완료/남은 · 안내 일지 힌트 유지 · break-ui 말줄임 유지
