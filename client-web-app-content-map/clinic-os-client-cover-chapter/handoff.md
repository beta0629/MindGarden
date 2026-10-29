# Hand-off — Clinic-OS 커버+챕터 (내담자 웹 홈)

## Concept
내담자 웹·태블릿 홈을 Expo와 **동일 커버+챕터**로 정렬.  
토큰=clinic-os (slate / dusty teal / cream / Pretendard / MGButton).  
구조만 expo-struct-v2 IA · Expo 팔레트 금지 · 상담사 폴더 미수정.  
모션=제품형 (sheet rise · chapter reveal · CTA press · dock pill).

## Paths
- Root: `/workspace/client-web-app-content-map/clinic-os-client-cover-chapter/`
- Notes: `notes.md`
- Home (has + zero): `tobe-home.html`
- Shots: `shots/`

## Shots
| data-shot | file |
| --- | --- |
| home-web | `shots/home-web.png` |
| home-tablet-portrait | `shots/home-tablet-portrait.png` |
| home-tablet-landscape | `shots/home-tablet-landscape.png` |
| home-web-zero | `shots/home-web-zero.png` |
| home-tablet-portrait-zero | `shots/home-tablet-portrait-zero.png` |
| home-tablet-landscape-zero | `shots/home-tablet-landscape-zero.png` |

## Constraints
- Mock only — no API / core PR
- No 직접예약 CTA (has=`상담 일정 보기` / zero=`회기 고르기`+`결제하기`)
- Teal/slate/cream + Pretendard gothic
- Floor: no mesh / gradient text / ALL-CAPS eyebrow / 3 equal tiles / Pencil bars
- Tablet L & Web = left cover | right sheet+chapters
- break-ui long client name on cover + sheet
- mobile-native: viewport-fit=cover, safe-area, 100vh+100dvh, tap-highlight off
- Motion product-only; `prefers-reduced-motion: reduce` → off
- 상담사 `clinic-os-cover-chapter/` 수정 금지

## Next
리더 보고 → 크리틱 검수
