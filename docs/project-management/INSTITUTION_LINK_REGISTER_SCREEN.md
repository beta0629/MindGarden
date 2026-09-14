# 내담자 등록 — 타기관 분기 UI/UX 스펙

본류는 **내담자 등록 유형**. 별 타기관 화면은 본류 아님. 유형에서 타기관을 고르면 **기관 Select(불러오기) 또는 신규**. 기관은 **별 테이블**. 매번 기관 등록 아님. **여러 내담자 = 한 기관.** 처음엔 없어서 등록. **배정**은 그 유형을 읽는다. 가예약 전용 / 기관연계 전용(교차 배정 금지). 월 단위 고정 아님. 월결제는 후속. **스펙만. 구현 없음.**

제품 정의: [`INSTITUTION_LINK_THEN_VOUCHER.md`](./INSTITUTION_LINK_THEN_VOUCHER.md).

## 1. 개요

어드민 `ClientModal`(create/edit/view)에 **연계 유형** 한 줄을 넣는다. 기본값 `일반`. `타기관`일 때만 기관(Select/신규)·초기선납이 나타난다. 최가을 유형은 이 분기다. 별 타기관 화면은 본류가 아니다.

## 2. 레이아웃

새 페이지·스테퍼 없음. 기존 `UnifiedModal` + 폼 리듬 유지.

```
UnifiedModal  내담자 등록|수정|조회
└─ 기존 내담자 필드
   연계 유형  BadgeSelect  [일반] [타기관]
   └─ 타기관일 때만
      ContentSection(noCard) 기관  Select 불러오기 | 신규
      ContentSection(noCard) 초기 상담 선납
```

- 셸: 기존 `ClientModal` / `UnifiedModal`. 별 타기관 전용 화면은 본류 아님(신규 LNB 금지).
- 유형 행: 라벨 caption `var(--mg-v2-font-size-caption)` / `var(--mg-v2-color-text-secondary)`. 배지↔라벨 `var(--mg-v2-space-2)`. 소수 옵션이므로 `BadgeSelect` (`docs/design/BADGE_SELECT_LAYOUT_GUIDE.md`).
- 조건부 섹션: 기존 `ContentSection` noCard `mg-v2-client-modal__subsection`. 제목 h2 토큰 `var(--mg-v2-font-size-h2)`. **좌측 4px 레일 금지.**
- 기관: **별 테이블**. 내담자마다 기관을 다시 적지 않음. 목록 있으면 `CustomSelect`(검색 가능하면 `SearchInput` 결합). 소수면 `BadgeSelect` 허용. 없으면 `EmptyState` 「등록된 기관이 없습니다」+ ghost `기관 등록`.
- 신규 기관 필드만 2열(`mg-v2-form-row--two`), 좁으면 1열. `FormInput` / `mg-v2-form-*`. 이메일 `MgEmailFieldWithAutocomplete`. 불러오기 선택 시 필드는 읽기 요약(이름·담당자)만.
- 버튼: 모달 기존 저장이 primary 하나 (`MGButton` solid `var(--mg-v2-color-primary-solid)`). 타기관용 두 번째 CTA 없음.
- 토큰: `--mg-v2-*`. `AdminDashboardB0KlA.css` 신규 import 금지.

## 3. 필드

| 언제 | 필드 | 컴포넌트 | 필수 |
|------|------|----------|------|
| 항상 | 연계 유형 | BadgeSelect `일반` / `타기관` | ● 기본 `일반` |
| 타기관만 | 기관 | CustomSelect **불러오기** / ghost `신규 기관` | ● 기존 있으면 선택. 없으면 신규 |
| 타기관 + 신규만 | 기관 이름 | FormInput text | ● 기관 테이블에 1회 저장. 여러 내담자가 공유 |
| 타기관 + 신규만 | 담당자 | FormInput text | ● |
| 타기관 + 신규만 | 담당자 연락처 | FormInput tel | ● |
| 타기관 + 신규만 | 문서 발송 연락처 | FormInput tel | ● 월말 내역. 담당자와 달라도 됨 |
| 타기관 + 신규만 | 문서 발송 이메일 | MgEmailFieldWithAutocomplete | ● |
| 타기관 + 불러오기 | (요약) | 기관 이름·담당자 읽기 전용 한 줄. `변경`=Select | ● 이미 고른 기관 |
| 타기관만 | 초기 상담 선납 | BadgeSelect `선납함` / `선납 안 함` | ● **내담자** 단위. 기관이 아님 |
| 타기관 + 선납함 | 선납 일자 | FormInput date | ● |
| 타기관 + 선납함 | 선납 금액 | FormInput, `tabular-nums`, `formatKrw` | ● |

일반으로 되돌리면 기관 연결·선납을 숨기고 값을 비운다(제출하지 않음). 신규 작성 중 불러오기로 바꾸면 신규 필드를 비움. 같은 기관을 여러 내담자에 재사용.

**넣지 않음:** 내담자마다 기관 재등록, 별 타기관 화면을 본류로, 내담자 재선택, 월결제·결제 주기(월 단위 고정 배지), 바우처, 회기 잔여 입력, 패키지, 상담사, 가예약↔기관연계 교차 배정.

## 3.1 통합스케줄 배정 — `기관연계`

용어는 **배정**. 가예약 전용 / 기관연계 전용. **교차 배정 금지.** 고정 금액. 월 단위 고정 아님.

- **위치:** 배정 옵션에서 가예약과 **나란히**, 상호 배타. 신규 위저드 없음.
- **가예약 전용:** 일반(회기) 배정만. 타기관 내담자·기관연계 배정에 가예약 불가.
- **기관연계 전용:** 내담자 유형=`타기관`만. 일반 내담자에 기관연계 불가. 가예약·당일결제 토글 없음.
- **선택 시(기관연계):** 회기권 패키지·잔여 회기 경로 없음. **고정 금액** `FormInput` 하나(필수, `tabular-nums`, `formatKrw`).
- **스케줄 등록:** 기관연계 일정은 가예약 체크 없음(회기 차감 없음). 색은 아래 표 — 회기·가예약·기관연계 혼용 금지.
- **배정 카드/피크:** `StatusBadge`/`Badge` 라벨 `기관연계`. `variant` info.

### 캘린더·범례 색 (hex 금지, 기존 시맨틱만)

| 구분 | 토큰 | 형태 |
|------|------|------|
| 회기 | 기존 상담사색 / `var(--mg-v2-color-primary-main)` | 실선. 변경 없음 |
| 가예약 | `var(--mg-v2-color-semantic-warning)` · wash `var(--mg-v2-color-semantic-warning-light)` | **점선** 2px (현행) |
| 기관연계 | `var(--mg-v2-color-semantic-info)` · wash `var(--mg-v2-color-semantic-info-light)` · 글자 `var(--mg-v2-color-semantic-info-dark)` | **실선** 2px. 이탤릭·점선 금지 |

이유: warning=미확정(가예약), info=다른 채널(기관), primary/상담사색=회기. 새 팔레트·hex·전용 토큰 추가 금지. 장부 캘린더의 info(나간 돈)와 화면이 다름 — 통합스케줄 이벤트에만 이 매핑.

범례: 가예약 스와치 옆에 동일 크기 기관연계 스와치(실선 info). 클래스만 추가 (`integrated-schedule__event--institution-link` 등). `AdminDashboardB0KlA.css` 신규 import 금지.

## 4. 상태

| 상태 | 표시 |
|------|------|
| 일반 | 기관·선납 숨김. 기존 내담자 저장과 동일 |
| 타기관 + 기관 0건 | EmptyState + 신규 기관 필드. 기관 미완 submit 차단 |
| 타기관 + 기관 있음 | Select 불러오기 기본. 미선택 submit → `기관을 선택하세요.` |
| 타기관 + 신규 | 기관 필드 표시. 저장 시 기관 1건 + 내담자 연결 |
| 타기관 + 선납 미선택 submit | `선납 여부를 선택하세요.` |
| view | 유형·연결 기관 이름 읽기 전용. 일반이면 기관 블록 없음 |
| edit | Select로 다른 기관 가능. 신규 기관도 가능. 유형 변경 시 숨김/비움 |

에러: 기존 모달 `mg-v2-form-error` + `var(--mg-v2-color-semantic-error)`.

## 5. 공통 모듈

재사용: `ClientModal`, `UnifiedModal`, `CustomSelect`, `BadgeSelect`, `SearchInput`, `EmptyState`, `FormInput`, `MgEmailFieldWithAutocomplete`, `ContentSection`, `MGButton`, `StatusBadge`/`Badge`(배정 표시), 통합스케줄 범례 스와치 패턴. 신규 페이지 셸·배정 위저드 복제 금지.

## 6. 코더 체크

- [ ] 본류 = 내담자 등록 유형. 별 타기관 화면은 본류 아님
- [ ] 기관 테이블 분리. 매번 기관 등록 아님. 여러 내담자 = 한 기관
- [ ] 타기관: 등록된 기관 **불러오기**(Select). 없을 때만 신규
- [ ] 선납 = 내담자 단위. 기관 마스터 아님
- [ ] 용어 **배정**
- [ ] 가예약 전용 / 기관연계 전용. 교차 배정 금지
- [ ] 스케줄 색 구분: 회기·가예약(`semantic-warning` 점선)·기관연계(`semantic-info` 실선). hex 없음
- [ ] 월 단위 고정 아님. 월결제 UI 없음
