# 상담의 종류 페이지 이미지 — 디자이너 산출

**상위 문서**: [COUNSELING_TYPE_PAGES_IMAGE_PLAN.md](./COUNSELING_TYPE_PAGES_IMAGE_PLAN.md)  
**코드 참조**: `lib/counseling-type-pages.ts`의 section `id`와 일치시킬 것.

---

## 공통 IA

- 모든 slug: **H1·리드 직후** 대표 이미지 1슬롯 → §3의 **section id 직전**에 2번째·(선택) 3번째.
- 페이지당 **2~3장 권장**, 상한 4장. §2 금지 요소 준수.

## 슬롯별 배치 (slug)

| slug | 순서 |
|------|------|
| `child-adolescent-adhd` | 히어로(`who` 전) → `features` 앞 또는 카드 상단 → (선택) `family` 직전/직후. `related`·`process` 전용 대형 비권장. |
| `adult-adhd` | 히어로 → `presentation` **또는** `focus` 앞 → (선택) `comorbid` 앞. `related` 직전 대형 비권장. |
| `comorbidity` | 히어로 → `areas` 앞 → (선택) `counseling` 앞. **`medical` 옆·바로 인접 배치 금지**. |
| `counseling-areas` | 히어로 → `examples` 앞 → (선택) `intake` 앞. **`out-of-scope`에 부정·거절 연상 이미지 비권장**. |

## 비율·크롭

- **16:9 또는 3:2**, 원본 약 **1200~1600px**, **WebP** 우선.
- 모바일: 주요 피사체를 **가로·세로 중앙 ~62%** 안에.
- 데스크톱: `object-fit: cover` 가정 시 **좌우 12~18%** 잘림 가능 → 중심 구도. 상하 **약 8~12%** 여유.
- 프레임 참고: 모바일 **390px** 콘텐츠 폭, 데스크톱 컬럼 **~720px** 수직 스택.

## 파일명 (`public/assets/images/counseling/{slug}/`)

| slug | 파일 |
|------|------|
| `child-adolescent-adhd` | `hero.webp`, `section-features.webp`, (선택) `section-family.webp` |
| `adult-adhd` | `hero.webp`, `section-presentation.webp` **또는** `section-focus.webp`(택1), (선택) `section-comorbid.webp` |
| `comorbidity` | `hero.webp`, `section-areas.webp`, (선택) `section-counseling.webp` |
| `counseling-areas` | `hero.webp`, `section-examples.webp`, (선택) `section-intake.webp` |

## alt 초안 (제목·진단명·효과 금지)

### child-adolescent-adhd

- hero: 햇살이 스며든 거실, 부드러운 색의 쿠션과 책이 놓인 조용한 가정 분위기.
- section-features: 창가 책상 위에 정돈된 필기구와 노트가 있는 차분한 학습 코너.
- section-family: 소파에 마주 앉은 성인의 어깨와 손만 보이는, 부담 없는 대화 장면의 실내.

### adult-adhd

- hero: 노트북과 머그잔이 놓인 밝은 책상과 창으로 들어오는 자연광이 있는 일반적인 업무 공간.
- presentation/focus: 화이트보드와 의자가 정돈된 중립적인 회의실 풍경.
- section-comorbid: 화분과 부드러운 조명만 있는 창가 휴게 코너, 차분한 톤.

### comorbidity

- hero: 따뜻한 목재 톤과 균형 잡힌 실내 조명이 이어지는 상담 센터 복도.
- section-areas: 여러 문이 나란히 있는 단정하고 중립적인 실내 통로.
- section-counseling: 상담실 앞 벤치와 벽면 색만 보이는 대기 공간 느낌.

### counseling-areas

- hero: 책장과 은은한 조명이 있는 전문 상담 사무실 분위기의 실내.
- section-examples: 특정 주제를 과장하지 않는 일반 서가와 식물이 있는 열람 공간.
- section-intake: 접수대와 안내 표지가 보이지만 인물 얼굴은 없는 초기 방문 동선의 실내.

## Pencil 스케치

- 에디터에 열린 **`/pencil-new.pen`**에 와이어(모바일 390 / 데스크톱 컬럼, 히어로 16:9, 크롭 메모) 반영됨.
- 레포 보관 시 **`docs/counseling-type-layout.pen`** 등으로 저장 권장.

## 코더: 환경 변수

`NEXT_PUBLIC_COUNSELING_IMAGES_ENABLED=true`일 때만 `public/assets/images/counseling/{slug}/` 아래 파일을 요청하고, 그 외에는 투명 1×1 GIF로 레이아웃만 유지합니다. 메타·경로 로직은 `lib/counseling-type-page-images.ts`를 참고하세요.
