# Hand-off — Clinic-OS 커버+챕터 (상담사 홈)

## Concept
Clinic-OS 상담사 웹·태블릿 홈을 **커버+챕터** 구조로 재설계.  
토큰=clinic-os (slate / dusty teal / cream / Pretendard / MGButton).  
구조만 expo-struct-v2 IA 이식 — Expo 팔레트 금지.  
**Density pass:** 간격·계층만 조임 (IA/토큰/CTA 금지 유지).

## Paths
- Root: `/workspace/client-web-app-content-map/clinic-os-cover-chapter/`
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
- No 직접예약 CTA
- Teal/slate/cream + Pretendard gothic confirmed
- Floor: no mesh / gradient text / ALL-CAPS eyebrow / 3 equal tiles / Pencil bars
- Tablet L & Web = left cover | right sheet+chapters
- break-ui long client name in sheet + rows
- mobile-native: viewport-fit=cover, safe-area, 100vh+100dvh, tap-highlight off
- prefers-reduced-motion respected
- Density: next-sheet DOM > chapter h2; zero sheet Primary only

