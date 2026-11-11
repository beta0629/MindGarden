# assets-v1: 마인드가든 홈페이지 일러스트·스틸 에셋

만든 날: 2026-11-11 KST (20:08 재개 ~ 20:40)
따른 스킬: `blender-calm-still-render`, `craft-tools-asset-pipeline` (`/home/box/agent-data/workflows/<slug>/` 헬퍼는 수정 없이 그대로 사용)
학습 자료: `study/`

**게시·발송한 것은 없습니다.** 다른 폴더의 파일은 읽기만 했습니다(히어로 .blend와 v2·subpages 아이콘 SVG는 원본 해시가 바뀌지 않은 것을 확인).

## 폴더

| 경로 | 내용 |
|---|---|
| `inventory.md` / `inventory.csv` | 슬롯 239행 (기존 플랜 229 + 신규 제안 10). 결정·에셋 id·2x 크기 포함 |
| `web/` | **최종 납품본.** WebP + AVIF (래스터), SVG + WebP/AVIF 폴백 (벡터). `manifest.json`에 크기·용량·해시 |
| `masters/` | PNG 마스터 (PhotoCraft 합성 결과), `masters/vector/` 신규 SVG 원본과 4x 미리보기 PNG |
| `sources/blender/` | `event-bed.blend`, `not-found.blend` (히어로 꽃밭에서 나비를 뺀 별도 파일) |
| `sources/renders/<id>/` | Blender 투명 16bit RGBA 렌더 + `render-settings.json` (인자·Blender 버전·뷰 트랜스폼) |
| `sources/photocraft/` | 합성 원본 .pcraft (cream 바탕 레이어 / 렌더 스마트 오브젝트 / 그레인 오버레이 5%) |
| `sources/vectorcraft/` | `mindgarden-empty-states-v1.vectorcraft` (빈 상태 3종 + 구분 장식, 아트보드 4개) |
| `contact-sheet.png` | 22종 전체 (AVIF를 디코드해서 그림) |
| `preflight/` | `preflight.md` (design-taste 읽기·사후 점검), `preflight.json` (자동 검사), `1x-strip.png` (CSS 1x 크기), `clay/` (클레이 패스) |
| `_build/` | 재현 스크립트: scenes.py, composite.py, build_vectors.py, export-jobs.json, preflight.py, contact_sheet.py, make_inventory.py, slots.py/json |
| `study/` | 지난 학습 단계 결과 (변경 없음) |

## 에셋 22종

| 에셋 | 슬롯 CSS (최대) | 2x px | 파일 |
|---|---|---|---|
| `event-visual-16x9` | 708×398 | 1416×796 | event-visual-16x9@2x.webp (16.3KB) · event-visual-16x9@2x.avif (12.0KB) |
| `event-visual-4x3` | 390×292 | 780×584 | event-visual-4x3@2x.webp (9.5KB) · event-visual-4x3@2x.avif (7.8KB) |
| `event-visual-3x2` | 300×200 | 600×400 | event-visual-3x2@2x.webp (6.1KB) · event-visual-3x2@2x.avif (5.5KB) |
| `event-visual-1x1` | 117×117 | 234×234 | event-visual-1x1@2x.webp (3.9KB) · event-visual-1x1@2x.avif (3.9KB) |
| `not-found-4x3` | 480×360 | 960×720 | not-found-4x3@2x.webp (4.4KB) · not-found-4x3@2x.avif (3.6KB) |
| `not-found-1x1` | 280×280 | 560×560 | not-found-1x1@2x.webp (2.4KB) · not-found-1x1@2x.avif (2.6KB) |
| `empty-reviews` | 160×160 | 320×320 | empty-reviews.svg (2.8KB) · empty-reviews@2x.webp (3.7KB) · empty-reviews@2x.avif (3.3KB) |
| `empty-event-off` | 160×160 | 320×320 | empty-event-off.svg (3.0KB) · empty-event-off@2x.webp (3.4KB) · empty-event-off@2x.avif (2.8KB) |
| `empty-generic` | 160×160 | 320×320 | empty-generic.svg (2.3KB) · empty-generic@2x.webp (3.3KB) · empty-generic@2x.avif (2.9KB) |
| `divider-sprig` | 240×32 | 480×64 | divider-sprig.svg (2.0KB) · divider-sprig@2x.webp (1.0KB) · divider-sprig@2x.avif (1.2KB) |
| `icon-area-child` | 260×260 | 520×520 | icon-area-child.svg (2.4KB) · icon-area-child@2x.webp (9.3KB) · icon-area-child@2x.avif (6.9KB) |
| `icon-area-adult` | 260×260 | 520×520 | icon-area-adult.svg (1.7KB) · icon-area-adult@2x.webp (8.7KB) · icon-area-adult@2x.avif (6.4KB) |
| `icon-area-overlap` | 260×260 | 520×520 | icon-area-overlap.svg (1.9KB) · icon-area-overlap@2x.webp (10.1KB) · icon-area-overlap@2x.avif (6.8KB) |
| `icon-area-family` | 260×260 | 520×520 | icon-area-family.svg (1.9KB) · icon-area-family@2x.webp (7.8KB) · icon-area-family@2x.avif (5.4KB) |
| `icon-step-book` | 88×88 | 176×176 | icon-step-book.svg (1.8KB) · icon-step-book@2x.webp (2.2KB) · icon-step-book@2x.avif (2.0KB) |
| `icon-step-visit` | 88×88 | 176×176 | icon-step-visit.svg (1.6KB) · icon-step-visit@2x.webp (3.1KB) · icon-step-visit@2x.avif (2.4KB) |
| `icon-step-first` | 88×88 | 176×176 | icon-step-first.svg (1.7KB) · icon-step-first@2x.webp (2.4KB) · icon-step-first@2x.avif (2.3KB) |
| `icon-step-next` | 88×88 | 176×176 | icon-step-next.svg (1.4KB) · icon-step-next@2x.webp (2.6KB) · icon-step-next@2x.avif (2.3KB) |
| `icon-loc-subway` | 64×64 | 128×128 | icon-loc-subway.svg (2.1KB) · icon-loc-subway@2x.webp (1.6KB) · icon-loc-subway@2x.avif (1.5KB) |
| `icon-loc-bus` | 64×64 | 128×128 | icon-loc-bus.svg (2.1KB) · icon-loc-bus@2x.webp (1.3KB) · icon-loc-bus@2x.avif (1.3KB) |
| `icon-loc-parking` | 64×64 | 128×128 | icon-loc-parking.svg (1.2KB) · icon-loc-parking@2x.webp (1.4KB) · icon-loc-parking@2x.avif (1.4KB) |
| `icon-contact-phone` | 56×56 | 112×112 | icon-contact-phone.svg (1.6KB) · icon-contact-phone@2x.webp (1.4KB) · icon-contact-phone@2x.avif (1.4KB) |

- **3D 스틸 6종:** 이벤트 비주얼 4비율, 404 2비율. cream #F5F0E6 위에 불투명 합성했다. 투명 버전이 필요하면 `sources/renders/`의 RGBA PNG를 같은 스크립트로 내보내면 된다.
- **벡터 4종:** 빈 상태 3종 + 구분 장식 1종 (신규). v2 아이콘 문법을 따른다: 잉크 #1C2430 2pt 라운드 선, garden #2F5B45 포인트, 샌드 #EAE2D2 블롭 하나(v2 BLOB_A/B 형태를 120 그리드로 비례 확대). 구분 장식만 1.5pt garden 가지와 line #CFC4AE 1pt 헤어라인이다. 텍스트는 없다.
- **아이콘 재수출 12종:**
  - SVG는 원본 바이트 그대로 복사했다(v2-home/icons/svg 8종, subpages-v1.1/_shared/icons/svg 4종).
  - 폴백은 그 아이콘이 쓰이는 가장 큰 슬롯의 2배다.
  - 상담 분야 260 → 520px, 절차 88 → 176px, 위치 64 → 128px, 전화 56 → 112px.

## 색 (정확한 값)

- **v2 토큰** (`v2-home/build/gen_home_v2.py`): cream #F5F0E6, sand #EAE2D2, ink #1C2430, soft #4A5261, garden #2F5B45, line #CFC4AE.
- **히어로 꽃 색:** `v1.3-home/blender/hero-butterfly-v1.3-orbit.blend` 재질 Base Color를 sRGB로 읽은 값이다(v2 홈 포스터 o_0000이 이 파일에서 나왔다). 씬에서 재질을 그대로 이어받았으므로 값이 바뀌지 않았다.

  | 재질 | 꽃잎 | 꽃술 |
  |---|---|---|
  | cream | #F1E8D8 | #C9A25E |
  | yellow | #DCC88E | #B88A4A |
  | blue | #97A5B8 | #4A5261 (soft 토큰과 같음) |
  | peach | #D9AA92 | #B8805E |

  잎은 Leaf #9DA898, LeafDeep #808E83이고, roughness는 꽃잎 0.75, 꽃술 0.8, 잎 0.7이다.
- **404 디딤돌 (새 재질):** Base #BDB8AE, roughness 0.8, noise bump 0.12. 소프트 리그의 따뜻한 키 아래에서 화면에 ≈ #E4D8C5로 보이도록 잡았다(sand와 line 토큰 사이). 처음에 line #CFC4AE를 그대로 넣었더니 렌더에서 #EFD9B7(노란 빵색)이 나와서 바꿨다.

## 렌더 설정 (calm_still.py, soft 프리셋)

- Cycles CPU 192 spp, adaptive 0.01, OIDN, seed 7, film_transparent, 16bit RGBA.
- Khronos PBR Neutral, exposure −0.6.
- 조명: 따뜻한 큰 면광 키 + 차가운 필 + 림. 월드 0.3, 섀도 캐처는 히어로 파일 것.
- 카메라: lens 50.

| 에셋 | az / el / margin |
|---|---|
| 이벤트 16:9 | 20 / 50 / 1.45 |
| 이벤트 4:3 | 20 / 50 / 1.2 |
| 이벤트 3:2 | 20 / 50 / 1.3 |
| 이벤트 1:1 | 20 / 55 / 0.78 (480px 렌더 → 234px 축소) |
| 404 4:3 | −12 / 42 / 1.25 |
| 404 1:1 | 5 / 50 / 1.15 |

- 비교안: afternoon 프리셋도 미리보기로 렌더했다. 긴 그림자가 무거워서 soft를 택했다.
- 클레이 패스: `preflight/clay/`.

## 라이선스·출처

| 항목 | 출처 | 라이선스 |
|---|---|---|
| 꽃·잎 지오메트리와 재질 | 우리가 만든 v1.3 히어로 .blend (`v1.3-home/blender/`, 직접 모델링) | 자체 제작 |
| 디딤돌, 꽃 배치, 카메라·조명 | `_build/scenes.py` + `calm_still.py` (직접 작성) | 자체 제작 |
| 빈 상태·구분 장식 벡터 | `_build/build_vectors.py` (직접 작성, v2 블롭 형태 재사용) | 자체 제작 |
| 아이콘 12종 | v2-home / subpages-v1.1에서 우리가 만든 SVG | 자체 제작 |
| 폰트 (컨택트 시트 라벨만) | Pretendard | SIL OFL 1.1 |
| 외부 이미지·HDRI·3D 모델 | **사용 안 함** | — |

- 생성형 이미지 모델, 얼굴·인물·캐릭터, 실사처럼 보이는 가짜 사진은 쓰지 않았다.
- `study/refs/`의 레퍼런스 이미지는 학습용이며 어떤 에셋에도 들어가지 않았다.
- 스크립트에서 참고한 공개 저장소(MIT/Apache)의 목록은 `study/blender-reference-notes.md`에 있다. 코드는 복사하지 않았다.

## 다시 만들기

```bash
cd _build
H=../../v1.3-home/blender/hero-butterfly-v1.3.blend
blender -b $H -P scenes.py -- event-bed ../sources/blender/event-bed.blend   # not-found도 같은 방식
S=/home/box/agent-data/workflows/blender-calm-still-render/calm_still.py
blender -b ../sources/blender/event-bed.blend -P $S -- --out ../sources/renders/event-visual-16x9 --name event-visual-16x9 --preset soft --samples 192 --aspects wide:1416x796 --az 20 --el 50 --margin 1.45
python3 composite.py ../sources/renders/event-visual-16x9/event-visual-16x9-wide.png event-visual-16x9
python3 build_vectors.py && vectorcraft-cli run --commands vector-steps.json
python3 /home/box/agent-data/workflows/craft-tools-asset-pipeline/export_assets.py --out ../web --jobs export-jobs.json
python3 preflight.py && python3 contact_sheet.py && python3 make_inventory.py
```

`composite.py`와 `export_assets.py`는 기존 파일이 있으면 멈춥니다. 반면 `scenes.py`, `calm_still.py`, `vectorcraft-cli run`은 같은 경로에 그대로 씁니다. 다시 만들 때는 새 폴더를 지정하세요.
