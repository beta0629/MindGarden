# 어드민 콘텐츠 마스터 등록 UX 개선 합의서

- 작성일: 2026-06-03
- 작성자: 메인 어시스턴트 (core-planner gemini 사용량 한도 — 사용자 컨펌 main-direct 채택)
- 대상 화면: `/admin/content-master` (`AdminContentMasterPage.js`)
- 사용자 요청: “등록하기가 너무 불편해 좀더 편하게 등록하고 입력은 최소화 해줘”
- 사용자 컨펌
  - Q1 (등록 방식) = **C. 인라인 빠른 추가 + 모달 압축 둘 다**
  - Q2 (자동 채움 범위) = **a. 최대 자동** (code · sortOrder · readMinutes · published · mediaType)
  - Q3 (힐링 콘텐츠 타입 처리) = **a. mediaType BadgeSelect (MEDITATION/ARTICLE/AUDIO/VIDEO) + 타입별 조건부 필드 노출**

---

## 1. 현재 인벤토리 (사실 기록)

### 1.1 프론트 폼 필드

| 탭 | 필드 (현재) | 비고 |
| --- | --- | --- |
| 심리교육 (PSYCHO) | title · summary · body · category · readMinutes | 백엔드 DTO 의 `slug · categoryLabel · pages · published · sortOrder` 가 프론트 payload 에서 누락 — 저장 실패 위험 |
| 힐링 (HEALING) | code · title · description · category · mediaType (자유 입력) · durationMinutes · thumbnailUrl · contentUrl · published · sortOrder | mediaType 이 자유 텍스트라 사용자가 오타 시 400 (`지원하지 않는 mediaType`) 발생 |

### 1.2 백엔드 DTO 필수값 (변경 금지)

- `PsychoEducationArticleUpsertRequest`
  - `@NotBlank` : `slug · title · summary · body · category · categoryLabel`
  - `@NotEmpty` : `pages` (List<Page>)
  - `@PositiveOrZero` : `readMinutes`
  - 그 외: `published · sortOrder`
- `HealingContentCatalogUpsertRequest`
  - `@NotBlank` : `code · title · category · mediaType`
  - 그 외: `description · thumbnailUrl · contentUrl · durationMinutes · published · sortOrder`
- `HealingContentMediaType` enum: `MEDITATION · ARTICLE · AUDIO · VIDEO`

### 1.3 UX 페인 포인트 요약

1. **mediaType 자유 텍스트** → 오타로 인한 400 빈발 + 사용자는 enum 값을 외워야 함
2. **code · slug 직접 입력 요구** → 한글 제목에서 사용자가 영문 식별자를 매번 손으로 생성
3. **sortOrder · published 매번 입력** → 신규 등록 시 0 / false 가 거의 항상 동일
4. **PsychoEducation `slug · categoryLabel · pages` 가 프론트에 없음** → 백엔드 `@Valid` 실패 (현 시점 저장 자체가 망가져 있을 가능성)
5. **modal 1 단 nested 폼이 너무 길어** 첫 화면에서 “이 필드 다 필요한가?” 부담
6. **인라인 빠른 추가 없음** → 단순 1줄 콘텐츠도 모달 열고 9 필드 입력해야 함

---

## 2. 목표 (Definition of Done)

- 사용자가 **제목 + 콘텐츠 URL (힐링) 또는 제목 + 본문 (심리교육)** 만 입력해도 등록 가능
- mediaType 은 **타이핑 불가** — BadgeSelect 4 종 (MEDITATION/ARTICLE/AUDIO/VIDEO)
- code · slug · sortOrder · readMinutes · published · categoryLabel · pages 는 **자동 생성** (사용자가 모달 “고급 옵션” 펼쳐서 수정도 가능)
- contentUrl 만 입력하면 mediaType 을 **URL 패턴 기반 자동 추론** (오디오/영상/글)
- 인라인 빠른 추가 행 1 줄로 **모달 없이 1 회 클릭 등록** 가능
- 백엔드 API 변경 0건 — 프론트 payload 보강만으로 해결
- 단위 테스트로 자동 채움 helper 4 종 (`generateCode · inferMediaType · estimateReadMinutes · nextSortOrder`) 회귀 차단

---

## 3. 변경 범위

### 3.1 프론트 — `frontend/src/components/admin/AdminContentMasterPage.js`

#### A. 자동 채움 helper (신설, 동일 파일 내)
```js
function slugify(text) // 한글 제거 + 영숫자만 + lower + dash + max 56자
function generateHealingCode(title) // slugify(title) + '-' + nowEpochSec(6)
function generatePsychoSlug(title)  // slugify(title) + '-' + nowEpochSec(6)
function estimateReadMinutes(body)  // ceil(length / 350)  (기본 5)
function nextSortOrder(rows)        // max(row.sortOrder) + 10  (없으면 10)
function inferMediaType(contentUrl) // .mp3/.wav/.m4a → AUDIO, .mp4/youtube/vimeo → VIDEO,
                                    // /meditation/ → MEDITATION, else ARTICLE
```

#### B. mediaType BadgeSelect (힐링)
- `<input>` → `<BadgeSelect>` 4 옵션 교체
- 옵션: `[ { value: 'MEDITATION', label: '명상' }, { value: 'ARTICLE', label: '글' }, { value: 'AUDIO', label: '오디오' }, { value: 'VIDEO', label: '영상' } ]`

#### C. 조건부 필드 (힐링)
- 모든 타입: code · title · category · published · sortOrder
- MEDITATION/AUDIO/VIDEO: durationMinutes 라벨 = “재생/명상 시간(분)” 강조
- ARTICLE: durationMinutes 라벨 = “예상 읽기(분)” (기본 5)
- AUDIO/VIDEO: contentUrl 필수 표시 (`aria-required`), thumbnailUrl 권장
- ARTICLE/MEDITATION: contentUrl 선택

#### D. 인라인 빠른 추가 (목록 상단 1 줄)
- 컬럼: 제목 input · BadgeSelect (탭이 PSYCHO 면 숨김) · [+ 등록] 버튼
- 동작:
  - 힐링: title + mediaType 만 받고, code/sortOrder/durationMinutes/published 자동
  - 심리교육: title 만 받고, slug/sortOrder/readMinutes/pages/categoryLabel 자동 (summary/body 는 “(추후 작성)” placeholder + published=false 로 저장)
- 백엔드 검증 위반 방지를 위해 인라인 등록 후 **자동으로 편집 모달이 열려** 사용자가 본문을 채울 수 있도록 한다 (선택 사항, MVP 는 published=false 로만 저장)

#### E. 모달 압축
- 섹션 1 (필수): 제목 · (힐링) BadgeSelect mediaType + 콘텐츠 URL / (심리교육) 본문
- 섹션 2 (선택): 설명 · 카테고리 · 썸네일 URL · 길이(분)
- 섹션 3 (고급 — 토글 접기, 기본 닫힘): 코드(자동) · 정렬 순서(자동) · 공개 여부
- 토글 라벨: “고급 옵션 표시 / 숨기기” (i18n 추가)

#### F. PsychoEducation 누락 필드 자동 보완 (handleSaveContent)
- payload 구성 시:
  - `slug` = 편집 모드면 기존 값 유지, 신규면 `generatePsychoSlug(title)`
  - `summary` = trim or `'(요약 작성 예정)'` (백엔드 `@NotBlank` 우회)
  - `body` = trim — 빈 값이면 **저장 차단 + 안내** (`@NotBlank`)
  - `category` = trim or `'general'`
  - `categoryLabel` = `categoryLabelFromCode(category)` (사전 매핑 없으면 category 그대로)
  - `readMinutes` = 직접 입력값 우선, 비어있으면 `estimateReadMinutes(body)`
  - `pages` = `[{ order: 0, title, body }]` (single-page 콘텐츠)
  - `published` = 편집 모드면 기존 값, 신규면 false
  - `sortOrder` = 편집 모드면 기존 값, 신규면 `nextSortOrder(psychoRows)`

### 3.2 i18n — `frontend/src/constants/adminWebScaffold.js`

신규 키 (한글 단일, 단순 추가):
- `CONTENT_QUICK_ADD_TITLE_PLACEHOLDER` = ‘새 콘텐츠 제목을 입력하고 [+] 를 누르세요’
- `CONTENT_QUICK_ADD_BUTTON` = ‘빠른 등록’
- `CONTENT_QUICK_ADD_SUCCESS` = ‘새 콘텐츠 초안을 추가했습니다. 상세 편집을 이어서 진행하세요.’
- `CONTENT_ADVANCED_TOGGLE_SHOW` = ‘고급 옵션 펼치기’
- `CONTENT_ADVANCED_TOGGLE_HIDE` = ‘고급 옵션 접기’
- `CONTENT_FORM_LABEL_TYPE` 갱신 = ‘유형’ (예시 안내 제거)
- `CONTENT_FORM_HINT_AUTO_CODE` = ‘비워두면 제목 기반으로 자동 생성됩니다.’
- `CONTENT_FORM_VALIDATION_BODY` = ‘본문을 입력해 주세요.’
- `CONTENT_FORM_LABEL_MEDIA_TYPE_MEDITATION` = ‘명상’
- `CONTENT_FORM_LABEL_MEDIA_TYPE_ARTICLE` = ‘글’
- `CONTENT_FORM_LABEL_MEDIA_TYPE_AUDIO` = ‘오디오’
- `CONTENT_FORM_LABEL_MEDIA_TYPE_VIDEO` = ‘영상’

### 3.3 단위 테스트 — `frontend/src/components/admin/__tests__/AdminContentMasterPage.helpers.test.js`

- `slugify('마음 정원 가이드')` → 영숫자/대시만, 길이 ≤ 56
- `generateHealingCode('테스트')` 두 번 호출 → 서로 달라야 함 (epoch suffix)
- `inferMediaType('https://cdn.x/m.mp3')` === `'AUDIO'`
- `inferMediaType('https://www.youtube.com/watch?v=x')` === `'VIDEO'`
- `inferMediaType('/meditation/day-1')` === `'MEDITATION'`
- `inferMediaType('https://blog.x/post')` === `'ARTICLE'`
- `estimateReadMinutes('가나다라마' * 100)` → 정수 ≥ 1
- `nextSortOrder([])` === 10
- `nextSortOrder([{ sortOrder: 30 }, { sortOrder: 50 }])` === 60

### 3.4 백엔드 — 변경 없음

기존 API 안정성을 보호하기 위해 백엔드 수정은 하지 않는다. 만약 PsychoEducation 자동 채움 결과가 `summary` 의 `@Size(max=600)` 등 검증을 통과하지 못하면 추후 별도 PR 로 처리.

---

## 4. 게이트 & 리스크

| 항목 | 확인 방법 | 차단 기준 |
| --- | --- | --- |
| 단위 테스트 | `npm test -- --watchAll=false AdminContentMasterPage.helpers` | 1건이라도 FAIL |
| i18n 시드 | `npm run check:i18n-seed` | 신규 키 누락 |
| 하드코딩 게이트 | `npm run check-hardcode` | 신규 추가 |
| 회귀 — 편집 모드 | 기존 항목 편집 → published 토글 → 저장 200 | 데이터 손실/오버라이드 |
| 회귀 — 백엔드 검증 | PsychoEducation 신규 등록 → 200 응답 (`slug · categoryLabel · pages · published · sortOrder` 자동 채움 확인) | 400 발생 |
| 멀티테넌트 | TenantContextHolder 의존 (Tenant ID는 백엔드 처리), 프론트는 영향 없음 | — |

### 알려진 리스크

- **PsychoEducation `summary @NotBlank @Size(max=600)`**: 자동 채움 fallback `'(요약 작성 예정)'` 가 NotBlank/Size 통과. 사용자가 빠른 등록 후 즉시 편집해 채우는 워크플로 가정.
- **`pages` 가 단일 element list**: 현행 백엔드가 `pages.size() >= 1` 만 검증한다고 가정. 만약 추가 필드 (예: `pages[0].title @NotBlank`) 가 있다면 빈 string 으로 400 발생 가능성 — 첫 구현 후 `dev` 에서 즉시 확인 필요.
- **인라인 빠른 추가 published=false 정책**: 신규 항목은 절대 자동 공개되지 않음 (사용자 명시적 노출 토글이 있어야 공개).

---

## 5. 산출물

| 산출물 | 경로 | 책임 |
| --- | --- | --- |
| 이 합의서 | `docs/project-management/2026-05-22/ADMIN_CONTENT_MASTER_UX_REVAMP_PLAN.md` | 메인 |
| 프론트 구현 | `frontend/src/components/admin/AdminContentMasterPage.js` | 메인 |
| i18n 상수 추가 | `frontend/src/constants/adminWebScaffold.js` | 메인 |
| 자동 채움 helper 단위 테스트 | `frontend/src/components/admin/__tests__/AdminContentMasterPage.helpers.test.js` | 메인 |
| PR · 배포 | feature/admin-content-master-ux-revamp → develop → main | 메인 |

---

## 6. 사용자 검증 시나리오 (배포 후)

1. `/admin/content-master` 진입 → 두 탭 모두 인라인 빠른 추가 행 노출
2. **힐링** 탭 — 제목 입력 → BadgeSelect “명상” → [+ 등록] → 목록 최상단에 추가 + `code` 자동 생성 확인
3. **심리교육** 탭 — 제목 입력 → [+ 등록] → 목록에 추가 + 본문 미입력 경고 또는 즉시 편집 모달 오픈
4. 모달 열기 → “고급 옵션” 토글 시 코드/정렬/공개 영역 표시 / 숨김
5. 힐링 신규 등록 — mediaType 을 직접 입력할 수 없음 (BadgeSelect 만 가능), 콘텐츠 URL 만 입력 시 mediaType 자동 추론 (예: youtube → VIDEO)
6. 콘텐츠 마스터 사용자가 “이제 등록이 편하다” 라고 확인

---

## 7. 비범위 (Out of scope)

- 새 백엔드 API (자동 분류 등) — 차후 PR
- mediaType 별 별도 위자드 (3 step 등) — 차후 PR
- 이미지 업로더 in-place — 별도 합의서 필요
- PsychoEducation `pages[]` 다중 페이지 UI — 차후 PR
- `categoryLabel` 사전 (코드→한글) 풀 매핑 — 현재는 fallback 사용

---

> 본 합의서는 사용량 한도로 인한 메인 직접 작업이며, 정상 운영 복귀 시 동일 범위를 `core-planner` 가 재검토할 수 있다.
