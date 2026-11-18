# assets-v1 슬롯 인벤토리

작성 2026-11-11 KST · 원자료 `_build/slots.json` (v2 홈 1440/390, subpages-v1.1 전 페이지, v1 guide·counseling·location·faq·contact 플랜에서 추출) + 신규 제안 슬롯 10개.
전체 239행 (기존 플랜 229 + 신규 10). 상세는 `inventory.csv`(UTF-8 BOM, 엑셀에서 바로 열림).

## 결정별 개수

| 결정 | 행 |
|---|---|
| 제외 · 실사 유지 (실제 공간) | 69 |
| 아이콘 재수출 (원본 SVG + 2x 폴백) | 55 |
| 제외 · Clinic-OS에서 관리하는 배너 콘텐츠 | 36 |
| 제외 · 블로그/유튜브 썸네일 그대로 사용 | 35 |
| 제외 · 법률 본문 자리 유지 | 16 |
| 신규 에셋 (제안 슬롯) | 10 |
| 제외 · 실사 필요 (원장 사진) | 6 |
| 제외 · UI 구조 자리(이미지 아님) | 6 |
| 제외 · 지도 임베드/캡처 | 4 |
| 제외 · 기존 히어로 3D(홈 전용) 유지 | 2 |

## 에셋별로 묶은 슬롯 (에셋 22종)

| 에셋 | 쓰이는 슬롯 (route·bp CSS) | 내보낸 크기 |
|---|---|---|
| `icon-area-child` | home 1440 136×136, home 390 64×64, about 1440 88×88, about 390 56×56, counseling-children-adolescents 1440 260×260, counseling-children-adolescents 390 150×150, counseling (v1) 1440 180×180, counseling (v1) 390 96×96 | 520×520 (최대 슬롯 ×2) |
| `icon-area-adult` | home 1440 88×88, home 390 64×64, about 1440 88×88, about 390 56×56, counseling-adults 1440 260×260, counseling-adults 390 150×150, counseling (v1) 1440 96×96, counseling (v1) 390 64×64 | 520×520 (최대 슬롯 ×2) |
| `icon-area-overlap` | home 1440 88×88, home 390 64×64, about 1440 88×88, about 390 56×56, counseling-overlapping-concerns 1440 260×260, counseling-overlapping-concerns 390 150×150, counseling (v1) 1440 96×96, counseling (v1) 390 64×64 | 520×520 (최대 슬롯 ×2) |
| `icon-area-family` | home 1440 136×136, home 390 64×64, about 1440 88×88, about 390 56×56, counseling-couples-family 1440 260×260, counseling-couples-family 390 150×150, counseling (v1) 1440 180×180, counseling (v1) 390 96×96 | 520×520 (최대 슬롯 ×2) |
| `icon-step-book` | home 1440 88×88, home 390 44×44, guide (v1) 1440 72×72, guide (v1) 390 48×48 | 176×176 (최대 슬롯 ×2) |
| `icon-step-visit` | home 1440 88×88, home 390 44×44, guide (v1) 1440 72×72, guide (v1) 390 48×48 | 176×176 (최대 슬롯 ×2) |
| `icon-step-first` | home 1440 88×88, home 390 44×44, guide (v1) 1440 72×72, guide (v1) 390 48×48 | 176×176 (최대 슬롯 ×2) |
| `icon-step-next` | home 1440 88×88, home 390 44×44, guide (v1) 1440 72×72, guide (v1) 390 48×48 | 176×176 (최대 슬롯 ×2) |
| `icon-contact-phone` | contact (v1) 1440 56×56 | 112×112 (최대 슬롯 ×2) |
| `icon-loc-subway` | location (v1) 1440 64×64, location (v1) 390 48×48 | 128×128 (최대 슬롯 ×2) |
| `icon-loc-bus` | location (v1) 1440 64×64, location (v1) 390 48×48 | 128×128 (최대 슬롯 ×2) |
| `icon-loc-parking` | location (v1) 1440 64×64, location (v1) 390 48×48 | 128×128 (최대 슬롯 ×2) |
| `event-visual-16x9` | event (대안) 1440 708×398 | 1416×796 (최대 슬롯 ×2) |
| `event-visual-4x3` | event (대안) 390 390×292 | 780×584 (최대 슬롯 ×2) |
| `event-visual-3x2` | home (대안) 1440 300×200 | 600×400 (최대 슬롯 ×2) |
| `event-visual-1x1` | home (대안) 390 117×117 | 234×234 (최대 슬롯 ×2) |
| `not-found-4x3` | 404 (신규) 1440 480×360 | 960×720 (최대 슬롯 ×2) |
| `not-found-1x1` | 404 (신규) 390 280×280 | 560×560 (최대 슬롯 ×2) |
| `empty-reviews` | reviews (신규) 1440/390 160×160 | 320×320 (최대 슬롯 ×2) |
| `empty-event-off` | event-off (신규) 1440/390 160×160 | 320×320 (최대 슬롯 ×2) |
| `empty-generic` | blog/videos/gallery (신규) 1440/390 160×160 | 320×320 (최대 슬롯 ×2) |
| `divider-sprig` | 공통 (신규) 1440/390 240×32 | 480×64 (최대 슬롯 ×2) |

## 제외한 실사·콘텐츠 슬롯 (일러스트로 바꾸지 않음)

| route | bp | 슬롯 | CSS | 현재 소스 | 사유 |
|---|---|---|---|---|---|
| home | 1440 | 히어로 3D 스틸 · 오빗 0s 프레임 (데스크톱 glb 실시간: 30s 1바퀴·줌 30s 왕복·날개 5s·틸트 최대 7°) | 810×600 | o_0000.png | 기존 히어로 3D(홈 전용) 유지 |
| home | 1440 | 플레이스홀더 · 대표원장 사진 | 420×560 | — | 실사 필요 (원장 사진) |
| home | 1440 | 이벤트 배너 사진 · 센터 로비 꽃 (center-64) | 300×200 | banner-flowers-c64-3x2.jpg | 실사 유지 (실제 공간) |
| home | 1440 | 공간 사진 1 · 모래놀이실 (center-73) | 690×388 | space-1-sandplay-c73-16x9.jpg | 실사 유지 (실제 공간) |
| home | 1440 | 공간 사진 2 · 미술 공간 | 231×182 | space-2-art-c109-4x3.jpg | 실사 유지 (실제 공간) |
| home | 1440 | 공간 사진 3 · 놀이 공간 | 231×182 | space-3-play-c122-4x3.jpg | 실사 유지 (실제 공간) |
| home | 1440 | 공간 사진 4 · 언어 상담 공간 | 231×182 | space-4-language-c112-4x3.jpg | 실사 유지 (실제 공간) |
| home | 1440 | 공간 사진 5 · 가족상담실 | 231×182 | space-5-family-c163-4x3.jpg | 실사 유지 (실제 공간) |
| home | 1440 | 영상 썸네일 1 · 억새는 왜 바람에 꺾이지 않을까요? / 마음 한 페이지 42화 | 384×216 | yt-WXUl5mcoxOo-16x9.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 1440 | 영상 썸네일 2 · 쉬어도 피곤이 풀리지 않을 때 / 오늘, 마음 괜찮나요? EP.45 | 384×216 | yt-ivD7YVMyigU-16x9.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 1440 | 영상 썸네일 3 · 저녁 하늘의 새들은 왜 함께 날아갈까요? / 마음 한 페이지 41화 | 384×216 | yt-2bIDGLQ_E5s-16x9.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 1440 | 블로그 썸네일 1 | 144×108 | blog-1-4x3.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 1440 | 블로그 썸네일 2 | 144×108 | blog-2-4x3.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 1440 | 블로그 썸네일 3 | 144×108 | blog-3-4x3.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 1440 | 플레이스홀더 · 지도 미리보기 (누르면 /location) | 220×165 | — | 지도 임베드/캡처 |
| home | 390 | 히어로 영상 포스터 · 오빗 0s 프레임 (모바일=기존 오빗 영상 가로 크롭, 3D·틸트 없음) | 390×260 | o_0000.png | 기존 히어로 3D(홈 전용) 유지 |
| home | 390 | 플레이스홀더 · 대표원장 사진 | 228×304 | — | 실사 필요 (원장 사진) |
| home | 390 | 이벤트 배너 사진 · 센터 로비 꽃 (center-64) | 117×117 | banner-flowers-c64-1x1.jpg | 실사 유지 (실제 공간) |
| home | 390 | 공간 사진 1 · 모래놀이실 (center-73) | 350×197 | space-1-sandplay-c73-16x9.jpg | 실사 유지 (실제 공간) |
| home | 390 | 공간 사진 2 · 미술 공간 | 170×128 | space-2-art-c109-4x3.jpg | 실사 유지 (실제 공간) |
| home | 390 | 공간 사진 3 · 놀이 공간 | 170×128 | space-3-play-c122-4x3.jpg | 실사 유지 (실제 공간) |
| home | 390 | 공간 사진 4 · 언어 상담 공간 | 170×128 | space-4-language-c112-4x3.jpg | 실사 유지 (실제 공간) |
| home | 390 | 공간 사진 5 · 가족상담실 | 170×128 | space-5-family-c163-4x3.jpg | 실사 유지 (실제 공간) |
| home | 390 | 영상 썸네일 1 (가로 스크롤 카드) | 264×148 | yt-WXUl5mcoxOo-16x9.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 390 | 영상 썸네일 2 (가로 스크롤 카드) | 264×148 | yt-ivD7YVMyigU-16x9.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 390 | 블로그 썸네일 1 | 96×72 | blog-1-4x3.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 390 | 블로그 썸네일 2 | 96×72 | blog-2-4x3.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 390 | 블로그 썸네일 3 | 96×72 | blog-3-4x3.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| home | 390 | 플레이스홀더 · 지도 미리보기 (누르면 /location) | 112×84 | — | 지도 임베드/캡처 |
| about | 1440 | 히어로 실사 · 로비 전경 (center-148) | 708×398 | about-hero-lobby-c148-16x9.jpg | 실사 유지 (실제 공간) |
| about | 1440 | 가치 옆 실사 · 창가 아동 코너 올리브나무 (center-137) | 282×376 | about-values-window-c137-3x4.jpg | 실사 유지 (실제 공간) |
| about | 1440 | 공간 실사 · 모래놀이실 전경 (center-145) | 1200×500 | about-space-sandplay-c145-16x9.jpg | 실사 유지 (실제 공간) |
| about | 1440 | 공간 실사 · 놀이 공간 (center-171) | 384×288 | about-space-play-c171-4x3.jpg | 실사 유지 (실제 공간) |
| about | 1440 | 공간 실사 · 대기 공간 (center-154) | 384×288 | about-space-waiting-c154-4x3.jpg | 실사 유지 (실제 공간) |
| about | 1440 | 공간 실사 · 상담실 (center-165) | 384×288 | about-space-room-c165-4x3.jpg | 실사 유지 (실제 공간) |
| about | 1440 | 플레이스홀더 · 대표원장 사진 | 384×512 | — | 실사 필요 (원장 사진) |
| about | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| about | 390 | 히어로 실사 · 로비 전경 (center-148) | 390×219 | about-hero-lobby-c148-16x9.jpg | 실사 유지 (실제 공간) |
| about | 390 | 공간 실사 · 모래놀이실 전경 (center-145) | 350×197 | about-space-sandplay-c145-16x9.jpg | 실사 유지 (실제 공간) |
| about | 390 | 공간 실사 · 놀이 공간 (center-171) | 169×127 | about-space-play-c171-4x3.jpg | 실사 유지 (실제 공간) |
| about | 390 | 공간 실사 · 대기 공간 (center-154) | 169×127 | about-space-waiting-c154-4x3.jpg | 실사 유지 (실제 공간) |
| about | 390 | 플레이스홀더 · 대표원장 사진 | 228×304 | — | 실사 필요 (원장 사진) |
| about | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| blog | 1440 | 블로그 대표 이미지 · 224473018673 | 384×480 | card-blog-224473018673-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 1440 | 블로그 대표 이미지 · 224472278779 | 384×480 | card-blog-224472278779-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 1440 | 블로그 대표 이미지 · 224471712304 | 384×480 | card-blog-224471712304-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 1440 | 블로그 대표 이미지 · 224471586619 | 384×480 | card-blog-224471586619-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 1440 | 블로그 대표 이미지 · 224469183518 | 384×480 | card-blog-224469183518-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| blog | 390 | 블로그 대표 이미지 · 224473018673 | 112×140 | card-blog-224473018673-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 390 | 블로그 대표 이미지 · 224472278779 | 112×140 | card-blog-224472278779-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 390 | 블로그 대표 이미지 · 224471712304 | 112×140 | card-blog-224471712304-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 390 | 블로그 대표 이미지 · 224471586619 | 112×140 | card-blog-224471586619-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 390 | 블로그 대표 이미지 · 224469183518 | 112×140 | card-blog-224469183518-3x4.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| blog | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling-adults | 1440 | 여백 실사 · 상담실 창가 몬스테라 (center-167, 방 이름 캡션 없음) | 486×364 | detail-adults-monstera-c167-4x3.jpg | 실사 유지 (실제 공간) |
| counseling-adults | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling-adults | 390 | 여백 실사 · 상담실 창가 몬스테라 (center-167, 방 이름 캡션 없음) | 350×262 | detail-adults-monstera-c167-4x3.jpg | 실사 유지 (실제 공간) |
| counseling-adults | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling-children-adolescents | 1440 | 여백 실사 · 놀이 공간 (center-127) | 486×364 | counseling-detail-play-c127-4x3.jpg | 실사 유지 (실제 공간) |
| counseling-children-adolescents | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling-children-adolescents | 390 | 여백 실사 · 놀이 공간 (center-127) | 350×262 | counseling-detail-play-c127-4x3.jpg | 실사 유지 (실제 공간) |
| counseling-children-adolescents | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling-couples-family | 1440 | 여백 실사 · 로비 꽃 (center-147, 가족상담실 미확정이라 꽃만) | 486×364 | detail-family-flowers-c147-4x3.jpg | 실사 유지 (실제 공간) |
| counseling-couples-family | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling-couples-family | 390 | 여백 실사 · 로비 꽃 (center-147, 가족상담실 미확정이라 꽃만) | 350×262 | detail-family-flowers-c147-4x3.jpg | 실사 유지 (실제 공간) |
| counseling-couples-family | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling-overlapping-concerns | 1440 | 여백 실사 · 식물 액자 디테일 (center-132, 방 이름 캡션 없음) | 486×364 | detail-overlap-plants-c132-4x3.jpg | 실사 유지 (실제 공간) |
| counseling-overlapping-concerns | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling-overlapping-concerns | 390 | 여백 실사 · 식물 액자 디테일 (center-132, 방 이름 캡션 없음) | 350×262 | detail-overlap-plants-c132-4x3.jpg | 실사 유지 (실제 공간) |
| counseling-overlapping-concerns | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counselors | 1440 | 플레이스홀더 · 대표원장 사진 | 486×648 | — | 실사 필요 (원장 사진) |
| counselors | 1440 | 여백 실사 · 창가 아동 코너 올리브나무 (center-129) | 282×352 | counselors-window-c129-4x5.jpg | 실사 유지 (실제 공간) |
| counselors | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counselors | 390 | 플레이스홀더 · 대표원장 사진 | 228×304 | — | 실사 필요 (원장 사진) |
| counselors | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| event | 1440 | 히어로 실사 · 로비 꽃 (center-64) | 708×398 | event-hero-flowers-c64-16x9.jpg | 실사 유지 (실제 공간) |
| event | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| event | 390 | 히어로 실사 · 로비 꽃 (center-64) | 390×292 | event-hero-flowers-c64-16x9.jpg | 실사 유지 (실제 공간) |
| event | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| event-off | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| event-off | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| gallery | 1440 | 히어로 실사 · 모래놀이실 모래상자 (center-73) | 708×531 | gallery-hero-sandplay-c73-4x3.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 갤러리 실사 · alt: 모래놀이실 · 피규어 선반과 모래상자 테이블 (center-133) | 384×480 | gallery-sandplay-c133-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 갤러리 실사 · alt: 모래놀이실 · 모래상자와 초록 방석 의자 (center-142) | 384×480 | gallery-sandplay-c142-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 갤러리 실사 · alt: 놀이 공간 · 아동 소파와 정리함 (center-122) | 384×480 | gallery-play-c122-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 갤러리 실사 · alt: 놀이 공간 · 원형 책상 쪽 전경 (center-174) | 384×480 | gallery-play-c174-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 갤러리 실사 · alt: 로비 · 유리 출입문과 낮은 책장 (center-148) | 384×480 | gallery-lobby-c148-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 갤러리 실사 · alt: 대기 공간 · 1인 소파 두 개 (center-152) | 384×480 | gallery-waiting-c152-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 갤러리 실사 · alt: 대기 공간 · 소파와 책장 (center-151, 안내문 확대 없음) | 384×480 | gallery-waiting-c151-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 갤러리 실사 · alt: 상담실 · 책상과 의자 세 개 (center-163) | 384×480 | gallery-room-c163-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 갤러리 실사 · alt: 상담실 · 입구에서 본 책상과 창 (center-168) | 384×480 | gallery-room-c168-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| gallery | 390 | 히어로 실사 · 모래놀이실 모래상자 (center-73) | 390×292 | gallery-hero-sandplay-c73-4x3.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 갤러리 실사 · alt: 모래놀이실 · 피규어 선반과 모래상자 테이블 (center-133) | 350×262 | gallery-sandplay-c133-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 갤러리 실사 · alt: 모래놀이실 · 모래상자와 초록 방석 의자 (center-142) | 169×225 | gallery-sandplay-c142-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 갤러리 실사 · alt: 놀이 공간 · 아동 소파와 정리함 (center-122) | 169×225 | gallery-play-c122-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 갤러리 실사 · alt: 놀이 공간 · 원형 책상 쪽 전경 (center-174) | 169×225 | gallery-play-c174-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 갤러리 실사 · alt: 로비 · 유리 출입문과 낮은 책장 (center-148) | 169×225 | gallery-lobby-c148-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 갤러리 실사 · alt: 대기 공간 · 1인 소파 두 개 (center-152) | 169×225 | gallery-waiting-c152-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 갤러리 실사 · alt: 대기 공간 · 소파와 책장 (center-151, 안내문 확대 없음) | 169×225 | gallery-waiting-c151-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 갤러리 실사 · alt: 상담실 · 책상과 의자 세 개 (center-163) | 169×225 | gallery-room-c163-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 갤러리 실사 · alt: 상담실 · 입구에서 본 책상과 창 (center-168) | 169×225 | gallery-room-c168-3x4.jpg | 실사 유지 (실제 공간) |
| gallery | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| legal-privacy | 1440 | 플레이스홀더 · 목차 | 720×140 | — | 법률 본문 자리 유지 |
| legal-privacy | 1440 | 플레이스홀더 · 본문 1 | 720×196 | — | 법률 본문 자리 유지 |
| legal-privacy | 1440 | 플레이스홀더 · 본문 2 | 720×196 | — | 법률 본문 자리 유지 |
| legal-privacy | 1440 | 플레이스홀더 · 본문 3 | 720×196 | — | 법률 본문 자리 유지 |
| legal-privacy | 390 | 플레이스홀더 · 목차 | 350×168 | — | 법률 본문 자리 유지 |
| legal-privacy | 390 | 플레이스홀더 · 본문 1 | 350×236 | — | 법률 본문 자리 유지 |
| legal-privacy | 390 | 플레이스홀더 · 본문 2 | 350×236 | — | 법률 본문 자리 유지 |
| legal-privacy | 390 | 플레이스홀더 · 본문 3 | 350×236 | — | 법률 본문 자리 유지 |
| legal-terms | 1440 | 플레이스홀더 · 목차 | 720×140 | — | 법률 본문 자리 유지 |
| legal-terms | 1440 | 플레이스홀더 · 본문 1 | 720×196 | — | 법률 본문 자리 유지 |
| legal-terms | 1440 | 플레이스홀더 · 본문 2 | 720×196 | — | 법률 본문 자리 유지 |
| legal-terms | 1440 | 플레이스홀더 · 본문 3 | 720×196 | — | 법률 본문 자리 유지 |
| legal-terms | 390 | 플레이스홀더 · 목차 | 350×168 | — | 법률 본문 자리 유지 |
| legal-terms | 390 | 플레이스홀더 · 본문 1 | 350×236 | — | 법률 본문 자리 유지 |
| legal-terms | 390 | 플레이스홀더 · 본문 2 | 350×236 | — | 법률 본문 자리 유지 |
| legal-terms | 390 | 플레이스홀더 · 본문 3 | 350×236 | — | 법률 본문 자리 유지 |
| reviews | 1440 | 얇은 띠 실사 · 로비 꽃 (center-147) | 1440×200 | reviews-band-flowers-c147-6x1.jpg | 실사 유지 (실제 공간) |
| reviews | 1440 | 플레이스홀더 · 후기 카드 구조 | 486×206 | — | UI 구조 자리(이미지 아님) |
| reviews | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| reviews | 390 | 얇은 띠 실사 · 로비 꽃 (center-147) | 390×72 | reviews-band-flowers-c147-6x1.jpg | 실사 유지 (실제 공간) |
| reviews | 390 | 플레이스홀더 · 후기 카드 구조 | 350×120 | — | UI 구조 자리(이미지 아님) |
| reviews | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| screening | 1440 | 플레이스홀더 · 문항 | 690×320 | — | UI 구조 자리(이미지 아님) |
| screening | 1440 | 플레이스홀더 · 결과(참고용) | 486×320 | — | UI 구조 자리(이미지 아님) |
| screening | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| screening | 390 | 플레이스홀더 · 문항 | 350×220 | — | UI 구조 자리(이미지 아님) |
| screening | 390 | 플레이스홀더 · 결과(참고용) | 350×160 | — | UI 구조 자리(이미지 아님) |
| screening | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| videos | 1440 | 영상 썸네일(채널 자동) · WXUl5mcoxOo | 282×501 | card-yt-WXUl5mcoxOo-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 1440 | 영상 썸네일(채널 자동) · ivD7YVMyigU | 282×501 | card-yt-ivD7YVMyigU-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 1440 | 영상 썸네일(채널 자동) · 2bIDGLQ_E5s | 282×501 | card-yt-2bIDGLQ_E5s-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 1440 | 영상 썸네일(채널 자동) · _mT8llqU4E8 | 282×501 | card-yt-_mT8llqU4E8-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 1440 | 영상 썸네일(채널 자동) · Ymun09Sg6M8 | 282×501 | card-yt-Ymun09Sg6M8-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 1440 | 영상 썸네일(채널 자동) · E7tt2pYsKL8 | 282×501 | card-yt-E7tt2pYsKL8-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 1440 | 영상 썸네일(채널 자동) · F00fZREtBKY | 282×501 | card-yt-F00fZREtBKY-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 1440 | 영상 썸네일(채널 자동) · m5da3uflKQk | 282×501 | card-yt-m5da3uflKQk-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| videos | 390 | 영상 썸네일(채널 자동) · WXUl5mcoxOo | 169×300 | card-yt-WXUl5mcoxOo-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 390 | 영상 썸네일(채널 자동) · ivD7YVMyigU | 169×300 | card-yt-ivD7YVMyigU-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 390 | 영상 썸네일(채널 자동) · 2bIDGLQ_E5s | 169×300 | card-yt-2bIDGLQ_E5s-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 390 | 영상 썸네일(채널 자동) · _mT8llqU4E8 | 169×300 | card-yt-_mT8llqU4E8-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 390 | 영상 썸네일(채널 자동) · Ymun09Sg6M8 | 169×300 | card-yt-Ymun09Sg6M8-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 390 | 영상 썸네일(채널 자동) · E7tt2pYsKL8 | 169×300 | card-yt-E7tt2pYsKL8-9x16.jpg | 블로그/유튜브 썸네일 그대로 사용 |
| videos | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| contact (v1) | 1440 | 폼 옆 실사 · 대기 코너 (center-161) | 384×512 | contact-corner-c161-4x3.jpg | 실사 유지 (실제 공간) |
| contact (v1) | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| contact (v1) | 390 | 히어로 실사 · 대기 코너 (center-161) | 390×219 | contact-corner-c161-4x3.jpg | 실사 유지 (실제 공간) |
| contact (v1) | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling (v1) | 1440 | 히어로 실사 · 상담실 창가 몬스테라 (center-166) | 708×303 | counseling-hero-monstera-c166-21x9.jpg | 실사 유지 (실제 공간) |
| counseling (v1) | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| counseling (v1) | 390 | 히어로 실사 · 상담실 창가 몬스테라 (center-166) | 390×167 | counseling-hero-monstera-c166-21x9.jpg | 실사 유지 (실제 공간) |
| counseling (v1) | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| faq (v1) | 1440 | 히어로 실사 띠 · 로비 꽃 (center-64) | 708×274 | faq-flowers-c64-4x1.jpg | 실사 유지 (실제 공간) |
| faq (v1) | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| faq (v1) | 390 | 히어로 실사 띠 · 로비 꽃 (center-64) | 390×98 | faq-flowers-c64-4x1.jpg | 실사 유지 (실제 공간) |
| faq (v1) | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| guide (v1) | 1440 | 히어로 실사 · 대기 라운지 (center-152) | 708×398 | guide-hero-lounge-c152-16x9.jpg | 실사 유지 (실제 공간) |
| guide (v1) | 1440 | 이벤트 블록 실사 · 로비 꽃 (center-147) | 360×280 | guide-event-flowers-c147-3x2.jpg | 실사 유지 (실제 공간) |
| guide (v1) | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| guide (v1) | 390 | 히어로 실사 · 대기 라운지 (center-152) | 390×219 | guide-hero-lounge-c152-16x9.jpg | 실사 유지 (실제 공간) |
| guide (v1) | 390 | 이벤트 블록 실사 · 로비 꽃 (center-147) | 350×88 | guide-event-flowers-c147-4x1.jpg | 실사 유지 (실제 공간) |
| guide (v1) | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| location (v1) | 1440 | 플레이스홀더 · 지도 | 1200×514 | — | 지도 임베드/캡처 |
| location (v1) | 1440 | 건물·입구 실사 1 · 로비 전경 (center-148) | 690×388 | location-lobby-c148-16x9.jpg | 실사 유지 (실제 공간) |
| location (v1) | 1440 | 건물·입구 실사 2 · 유리 출입문 (center-149, 안내문 확대 안 함) | 486×364 | location-entrance-c149-4x3.jpg | 실사 유지 (실제 공간) |
| location (v1) | 1440 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 1200×160 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
| location (v1) | 390 | 플레이스홀더 · 지도 | 390×219 | — | 지도 임베드/캡처 |
| location (v1) | 390 | 건물·입구 실사 1 · 로비 전경 (center-148) | 350×197 | location-lobby-c148-16x9.jpg | 실사 유지 (실제 공간) |
| location (v1) | 390 | 건물·입구 실사 2 · 유리 출입문 (center-149) | 350×262 | location-entrance-c149-4x3.jpg | 실사 유지 (실제 공간) |
| location (v1) | 390 | 플레이스홀더 · 관리자 배너 슬롯(서브 하단) | 350×117 | — | Clinic-OS에서 관리하는 배너 콘텐츠 |
