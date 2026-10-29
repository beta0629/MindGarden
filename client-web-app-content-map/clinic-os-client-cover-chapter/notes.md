# Clinic-OS · 커버+챕터 — 내담자 웹 홈 TO-BE

> 담당: 앱웹 디자인 (Mock only)  
> 경로: `/workspace/client-web-app-content-map/clinic-os-client-cover-chapter/`  
> 구조 출처: `expo-struct-v2` IA. 토큰 = clinic-os SSOT. Expo dusk/clay **이식 금지**.  
> 상담사 시안(`clinic-os-cover-chapter/`) = 밀도·셸 참고만 · **수정 금지**.

## Concept
앱 대비 웹이 밋밋·나열식이던 문제를, Expo와 **동일 커버+챕터**로 정렬.  
풀블리드 SVG 커버(상담실 창·슬레이트/틸) + 플로팅 next-sheet 1개 + 챕터(회기→안내) + 미니멀 독.

## Expo와의 정렬
| 축 | Expo (`expo-struct-v2`) | 본 시안 (내담자 웹) |
| --- | --- | --- |
| IA | 커버 · next-시트 · 01 회기 · 02 안내 · 독 | 동일 |
| has CTA | 상담 상세 보기 | `상담 일정 보기` (결과형 · 직접예약 없음) |
| zero CTA | 회기 고르기 / 결제하기 | 동일 쌍 |
| SoftChip | 가변폭 플로우 · amber=미결제만 | 동일 |
| 팔레트 | dusk/clay (Expo) | **clinic-os** slate/teal/cream (이식 금지) |
| 프레임 | phone / tablet P / L | web / tablet P / L (폰 확대 금지) |

## IA (After)
1. **커버면** (~45–55%) — SVG 상담실 창 + 오버레이(센터·내담자명)
2. **플로팅 시트** — Primary next 1개 (has=다가오는 상담 / zero=0회+고르기·결제)
3. **챕터** — `01 회기` (잔량·미결제 SoftChip) → `02 안내` (2차)
4. **Web / Tablet L** — 좌 커버 고정 | 우 시트+챕터. Tablet P — 상 커버 | 하 시트+챕터
5. **독** — 홈·예정·마음·나 (미니멀 · 카드스택 로비 금지)

## Tokens (clinic-os ONLY)
| Token | Hex | Use |
| --- | --- | --- |
| slate / ink | `#0F172A` | 커버 딥·제목 |
| dusty teal | `#0E5F5A` / `#0F766E` | MGButton · 챕터 번호 · 슬롯 |
| cream | `#FAF9F7` | 캔버스 |
| white | `#FFFFFF` | 시트·dense |
| line | `#E2E8F0` | 보더 |
| mute | `#64748B` | 보조 |
| amber | `#B45309` | **미결제 배지만** |

- Font: Pretendard 고딕 only
- Button: MGButton — primary `#0E5F5A`, on `#FAF9F7`, hover `#0A4F4B`
- Shell: full-bleed (중앙 max-width 카드스택 FAIL)
- Floor: mesh / gradient text / ALL-CAPS eyebrow / 3 equal tiles / Pencil bar = FAIL

## Motion (제품형 · 내담자 웹·Expo 동일)
| Token | Use |
| --- | --- |
| cover light drift 8s | SVG 창빛 opacity (미묘) |
| sheet rise 480ms | 플로팅 시트 translateY+opacity |
| chapter reveal 420ms | 스크롤 진입 opacity+Y (stagger 60/120ms) |
| press 120ms | CTA `scale(0.97)` |
| dock pill 280ms | 활성 탭 인디케이터 |

허용: 화면 진입 · CTA press · 독 전환.  
금지: 마케팅 블롭·오로라·섹션마다 fade-up 남발·hover 스케일 남발.  
`prefers-reduced-motion: reduce` → 전부 off.

## Density
상담사 밀도 패스 수준: section-gap~26 · sheet-dom ≫ chap-title · row minH 48 · 시트↔챕터 간격 조임.

## break-ui / mobile-native
- 긴 이름 `남궁민서윤아림정한솔예린` — 커버·시트 말줄임
- viewport-fit=cover · safe-area · 100vh+100dvh · tap-highlight off

## Screens
- `tobe-home.html` — has + zero · web / tablet P / tablet L
- Shots: `home-web`, `home-tablet-portrait`, `home-tablet-landscape` (+ `-zero`)

## Out of scope
상담사 FE 코어 · 상담사 폴더 수정 · PortOne · Expo 앱 구현
