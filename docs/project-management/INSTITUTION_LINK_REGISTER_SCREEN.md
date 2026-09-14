# 타기관 연계 등록 UI/UX 스펙

최가을 유형. 기관 정보·내담자·월결제·초기선납만 받는다. 이후 정보 확인·월말 상담내역 문서용. **스펙만. 구현 없음.**

제품 정의: [`INSTITUTION_LINK_THEN_VOUCHER.md`](./INSTITUTION_LINK_THEN_VOUCHER.md) (이 파일은 늘리지 않음).

## 1. 개요

어드민이 타기관 연계 건을 **한 화면에서 등록**한다. 회기권 매칭 위저드(패키지·바우처·잔여 회기)를 쓰지 않는다.

## 2. 레이아웃

Quiet header + **main stage 카드 하나**. 스테퍼·요약 스트립·좌측 악센트 바 없음.

```
AdminCommonLayout (LNB 기존)
└─ ContentArea
   ├─ ContentHeader  타기관 연계 등록 | 취소(ghost) · 등록(solid primary 하나)
   └─ ContentSection.mg-v2-content-section--card   ← stage 하나
      ├─ 기관
      ├─ hairline
      ├─ 내담자
      ├─ hairline
      └─ 결제
```

- 셸: `AdminCommonLayout` + `ContentArea` + `ContentHeader` + `ContentSection`(card 1개)
- 페이지 배경: `var(--mg-v2-color-neutral-50)`
- Stage: 배경 `var(--mg-v2-color-neutral-50)`, 테두리 `1px solid var(--mg-v2-color-border-default)`, radius `var(--mg-v2-radius-lg)`, padding `var(--mg-v2-space-6)`, 내부 gap `var(--mg-v2-space-6)`
- 섹션 제목: h2 `var(--mg-v2-font-size-h2)` / `var(--mg-v2-font-weight-bold)` / `var(--mg-v2-color-text-primary)` — **레일 금지**
- 헤더 제목: h1 `var(--mg-v2-font-size-h1)` / 700. 부제 한 줄(caption): `최가을 유형 · 월말 상담내역 문서용`
- 본문·라벨: body-md `var(--mg-v2-font-size-body-md)` · caption `var(--mg-v2-font-size-caption)` / `var(--mg-v2-color-text-secondary)`
- CTA: `MGButton` solid primary `var(--mg-v2-color-primary-solid)`, 높이 `var(--mg-v2-component-height-md)`(모바일 `var(--touch-target-min)`). 취소는 ghost. **페이지 primary 하나.**
- 폰트: `var(--mg-v2-font-family-base)`
- 신규 `AdminDashboardB0KlA.css` import 금지. forest `#3D5246` primary 금지.

데스크톱(≥1280): 기관 필드 2열. 태블릿·모바일: 1열. 터치 `var(--touch-target-min)`.

## 3. 섹션·필드

공통: `FormInput`(라벨+필수 `*`+에러). 이메일만 `MgEmailFieldWithAutocomplete`. 소수 옵션은 `BadgeSelect`. 금액은 `tabular-nums`, 표시 `formatKrw` → `1,234,000원`.

| 섹션 | 필드 | 컴포넌트 | 필수 | 비고 |
|------|------|----------|------|------|
| 기관 | 기관 이름 | FormInput text | ● | |
| 기관 | 담당자 | FormInput text | ● | |
| 기관 | 담당자 연락처 | FormInput tel | ● | |
| 기관 | 문서 발송 연락처 | FormInput tel | ● | 월말 내역 수신. 담당자와 달라도 됨 |
| 기관 | 문서 발송 이메일 | MgEmailFieldWithAutocomplete | ● | 월말 내역 수신 |
| 내담자 | 내담자 연결 | 검색 → 선택 | ● | 아래 |
| 결제 | 월 단위 결제 | 고정 표시 | — | 배지 텍스트 `월 단위`. 선택·금액 입력 없음(월 인보이스 풀세트 아님) |
| 결제 | 초기 상담 선납 | BadgeSelect `선납함` / `선납 안 함` | ● | 기본 미선택 |
| 결제 | 선납 일자 | FormInput date | 선납함일 때만 ● | `선납 안 함`이면 행 숨김 |
| 결제 | 선납 금액 | FormInput | 선납함일 때만 ● | 위와 동일 |

**내담자 연결**

- 미선택: `MGButton` ghost `내담자 선택` → `UnifiedModal`. 본문: `SearchInput` + 이름 목록. 기존 매칭 위저드 단계(상담사·패키지·결제) 재사용 금지.
- 선택됨: 이름 한 줄 + ghost `변경`. **잔여 회기 숫자 표시·입력 없음.**
- 검색 0건: `EmptyState` 「검색 결과가 없습니다.」 이모지 없음.

**넣지 않음**

바우처, 회기 잔여 입력, 패키지, 상담사, 주소·사업자번호·메모·첨부, 월말 문서 미리보기, 스테퍼, KPI.

## 4. 상태

| 상태 | 표시 |
|------|------|
| 초기 | 필드 공란. 선납 일자·금액 숨김. 등록 가능(클라 검증은 submit 시) |
| 선납함 | 일자·금액 행 나타남. 미입력 시 submit 차단 |
| 선납 안 함 | 일자·금액 숨김·비움 |
| 필드 에러 | FormInput `error`. 문구 caption, `var(--mg-v2-color-semantic-error)` |
| 내담자 미선택 submit | 내담자 섹션 에러: `내담자를 선택하세요.` |
| 선납 미선택 submit | `선납 여부를 선택하세요.` |
| 저장 중 | 등록 버튼 `loading`. 본문 `UnifiedLoading` |
| 저장 실패 | 토스트(기존 `UnifiedNotification`). 폼 유지 |
| 저장 성공 | 토스트 후 이전 화면(매칭 관리 등) |
| 취소 | 변경 있으면 `ConfirmModal` 「작성을 취소할까요?」 / 없으면 즉시 이탈 |
| 모달 목록 로딩 | UnifiedModal 본문 `UnifiedLoading` |

필수 미완이면 등록은 비활성하지 않고, submit 시 첫 오류 필드로 스크롤.

## 5. 공통 모듈·아토믹

| 계층 | 재사용 | 신규 금지 |
|------|--------|-----------|
| Template | AdminCommonLayout, ContentArea, ContentHeader, ContentSection | 페이지 전용 레이아웃 셸 |
| Organism | UnifiedModal, ConfirmModal, EmptyState, UnifiedLoading | 매칭 생성 위저드 복제 |
| Molecule | FormInput, BadgeSelect, MgEmailFieldWithAutocomplete, SearchInput, ActionBar(헤더 우측에 쓸 때만) | 로컬 배지/셀렉트 |
| Atom | MGButton (solid primary / ghost) | 페이지 hex 버튼 |

API는 구현 시 `StandardizedApi`. 이 스펙은 UI만.

## 6. 코더 체크

- [ ] 필드 = §3 표만. 바우처·잔여 회기 없음
- [ ] Clinic-OS: quiet header, stage 하나, 좌측 4px 바 없음, `--mg-v2-*`만
- [ ] Primary CTA 하나 = 등록
- [ ] 선납함 ↔ 일자/금액 표시 분기
- [ ] 문서 발송 연락처·이메일은 담당자 연락처와 별 필드
