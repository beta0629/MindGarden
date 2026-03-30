# 스태프 계정 관리 UI 스펙

**버전**: 1.0.0  
**작성일**: 2026-03-05  
**담당**: core-designer  
**참조**: docs/planning/STAFF_ACCOUNT_MANAGEMENT_PLAN.md §8, 어드민 대시보드 샘플 (https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)

---

## 1. 개요 및 목적

- **배경**: 사용자 관리 페이지(`/admin/user-management`)에 스태프(사무원) 탭이 없어, 스태프 목록 조회·역할 변경 UI를 추가하는 설계.
- **목적**: 어드민이 한 화면에서 스태프 목록 확인 및 역할 변경을 **최소 클릭**으로 수행할 수 있도록, 상담사/내담자 탭과 **동일한 패턴**의 레이아웃·블록 구성을 적용한다.
- **적용 범위**: Phase 1 — 스태프 탭, 스태프 목록, 역할 변경 버튼·모달. (Phase 2 스태프 신규 등록은 별도 스펙.)

---

## 2. 디자인 기준·단일 소스

본 스펙은 아래를 **단일 소스**로 적용한다. 이외 색상·간격·클래스 사용 금지.

| 소스 | 용도 |
|------|------|
| **mindgarden-design-system.pen** (B0KlA) | 비주얼·레이아웃·색상·타이포 |
| **pencil-new.pen** | 아토믹 컴포넌트(버튼, 카드, Pill 등) 재사용 |
| **unified-design-tokens.css** | 구현 시 `var(--mg-*)` 토큰명 |
| **AdminDashboardB0KlA.css** | `mg-v2-ad-b0kla__*` 클래스 |
| **docs/design-system/PENCIL_DESIGN_GUIDE.md** | 팔레트·섹션 블록·타이포·체크리스트 |
| **docs/design-system/RESPONSIVE_LAYOUT_SPEC.md** | 브레이크포인트·패딩·터치 영역 |

---

## 3. 사용성(플로우)

- **대상 사용자**: 어드민(ADMIN)만 접근.
- **목표**: 스태프 목록 확인 → 필요 시 역할 변경(STAFF 선택)까지 **최소 클릭**.
- **흐름**:
  1. 사용자 관리 진입 (`/admin/user-management`)
  2. **스태프** Pill 탭 선택 → `?type=staff` 반영, 스태프 전용 본문 표시
  3. 스태프 목록 확인(테이블 또는 카드)
  4. 「역할 변경」 클릭 → **UnifiedModal** 오픈
  5. 모달에서 역할 셀렉트(STAFF 포함) 선택 → 확인 → API 호출
  6. 성공 시 목록 갱신(또는 해당 행/카드 갱신)
- **일관성**: 상담사 탭·내담자 탭과 **동일한** 탭 전환·목록·모달 패턴 유지. 탭만 추가하고 본문만 스태프 전용으로 치환.

---

## 4. 정보 노출 범위

### 4.1 스태프 목록

- **대상**: `role === 'STAFF'` 인 사용자만 표시. (API: `GET /api/v1/admin/user-management` 후 클라이언트 필터 또는 백엔드 `?role=STAFF`.)
- **노출 필드**:
  - **필수**: 이름, 이메일, 전화번호, 역할(표시용), 활성 여부
  - **선택**: 생성일
- **비노출**: 비밀번호, 토큰 등 민감 정보는 절대 노출하지 않음.
- **액션**: 행/카드별 **「역할 변경」** 버튼 노출.

### 4.2 역할 변경 모달

- **역할 목록**: `GET /api/v1/admin/user-management/roles` 응답 사용. ADMIN, STAFF, CONSULTANT, CLIENT 등 **STAFF 포함** 표시.
- **동작**: 현재 역할과 동일한 역할 선택 시 확인 버튼 비활성화(또는 동일 선택 시 API 호출 생략) 권장.
- **권한**: 관리자만 접근. 모달 내 민감 정보 없음.

---

## 5. 레이아웃·블록 구성

### 5.1 공통 구조

- **레이아웃**: **AdminCommonLayout** 유지. GNB·LNB 그대로, 본문만 사용자 관리 영역.
- **페이지 래퍼**: 기존과 동일.
  - 최상위: `mg-v2-ad-b0kla mg-v2-user-management-page`
  - 내부: `mg-v2-ad-b0kla__container`
  - 본문: **ContentArea** 사용

### 5.2 상단 Pill 탭

- **위치**: ContentArea 직후, 본문 콘텐츠 위.
- **구조**: 기존 Pill 탭 오른쪽에 **「스태프」** 탭 추가.
- **순서**: **상담사 | 내담자 | 스태프** (또는 요청에 따라 상담사 | 스태프 | 내담자).
- **클래스·토큰**:
  - 컨테이너: `mg-v2-ad-b0kla__pill-toggle`
  - 각 Pill: `mg-v2-ad-b0kla__pill`
  - 활성 Pill: `mg-v2-ad-b0kla__pill mg-v2-ad-b0kla__pill--active`
  - 활성 배경: `var(--mg-color-primary-main)` (#3D5246)
  - 비활성 텍스트: `var(--mg-color-text-secondary)` (#5C6B61)
  - 타이포: Noto Sans KR, 14–16px, Pill 높이·패딩은 상담사/내담자 탭과 동일 유지

### 5.3 스태프 탭 본문 — 목록 영역

- **표시 조건**: `type === 'staff'` (또는 `?type=staff`) 일 때만 렌더.
- **블록 구조**:
  - **섹션 블록** 하나로 「스태프 목록」 전체를 감쌈.
  - **섹션 제목**: 좌측 **세로 악센트 바** + 제목 텍스트.
    - 악센트 바: 폭 4px, `var(--mg-color-primary-main)`, border-radius 2px
    - 제목: "스태프 목록" (또는 "스태프(사무원) 관리"), 16px, fontWeight 600, `var(--mg-color-text-main)`
  - 클래스: `mg-v2-section-heading`, `mg-v2-section-heading--accent`, `mg-v2-section-heading__bar`, `mg-v2-section-heading__title`
- **목록 형태**: **테이블**(데스크톱) 또는 **반응형 카드**(모바일·태블릿). 상담사/내담자 목록과 동일한 B0KlA·ContentSection/ContentCard 구조 사용 권장.
- **테이블인 경우**:
  - 컨테이너: ContentSection + ContentCard 또는 `mg-v2-content-section mg-v2-content-section--card`
  - 테이블 배경: `var(--mg-color-surface-main)` (#F5F3EF), 테두리 1px `var(--mg-color-border-main)`, border-radius 16px
  - 헤더 행: 12px, `var(--mg-color-text-secondary)`, 배경 약간 구분(선택)
  - 데이터 셀: 14px, `var(--mg-color-text-main)`
  - 각 행 마지막 열(또는 액션 열): **「역할 변경」** 버튼
- **카드형인 경우**(반응형):
  - 카드 컨테이너: 그리드, 브레이크포인트별 컬럼 수는 RESPONSIVE_LAYOUT_SPEC (모바일 1, 태블릿 2, 데스크톱 3~4)
  - 카드 한 장: 배경 #FFFFFF, 테두리 1px `var(--mg-color-border-main)`, border-radius 12px, 패딩 16px
  - 카드 내 필드: 이름·이메일·전화·역할·활성 여부 (라벨 12px, 값 14px)
  - 카드 하단 또는 우측: **「역할 변경」** 버튼
- **버튼 스타일**:
  - 주조 버튼(역할 변경): `mg-v2-button mg-v2-button--primary` 또는 프로젝트 공통 주조 버튼 클래스
  - 배경 `var(--mg-color-primary-main)`, 텍스트 #FAF9F7, height 40px, padding 10–20px, border-radius 10px

### 5.4 빈 상태(스태프 0명)

- **표시**: "등록된 스태프가 없습니다." 등 안내 문구.
- **스타일**: `var(--mg-color-text-secondary)`, 14px, 목록 영역 중앙 또는 상단. 기존 empty state 패턴(`mg-v2-empty-state` 등) 재사용 가능.

---

## 6. 역할 변경 모달 (UnifiedModal)

- **사용 컴포넌트**: **UnifiedModal** 필수. 커스텀 오버레이/래퍼 사용 금지.
- **트리거**: 목록 행/카드의 「역할 변경」 버튼 클릭.
- **구성**:
  - **제목**: "역할 변경" (또는 "사용자 역할 변경")
  - **바디**:
    - 대상 사용자 표시(이름 또는 이메일 한 줄, 선택)
    - **역할 셀렉트**: `<select>` 또는 라디오/버튼 그룹. 옵션은 `GET /api/v1/admin/user-management/roles` 응답으로 채움. STAFF(사무원) 포함.
    - 라벨: "역할", 12px `var(--mg-color-text-secondary)`
  - **액션**: `actions` prop으로 전달
    - **취소**: 우측에서 두 번째. `mg-v2-button mg-v2-button--secondary` (아웃라인). 클릭 시 `onClose`.
    - **확인**: 우측 끝. 주조 버튼. 클릭 시 선택 역할로 `PUT /api/v1/admin/user-management/{userId}/role?newRole=...` 호출 후 성공 시 모달 닫고 목록 갱신.
- **모달 크기**: `size="small"` 또는 `size="medium"` (콘텐츠 양에 따라).
- **로딩**: API 요청 중 `loading={true}` 전달, 확인 버튼 비활성화 및 스피너 표시.

---

## 7. 디자인 토큰·클래스 요약

코더가 **추측 없이** 적용할 수 있도록 토큰·클래스만 정리.

| 용도 | 토큰 또는 클래스 |
|------|------------------|
| 메인 배경 | `var(--mg-color-background-main)` |
| 서페이스/카드 | `var(--mg-color-surface-main)` |
| 주조 | `var(--mg-color-primary-main)` |
| 본문 텍스트 | `var(--mg-color-text-main)` |
| 보조 텍스트 | `var(--mg-color-text-secondary)` |
| 테두리 | `var(--mg-color-border-main)` |
| 페이지 래퍼 | `mg-v2-ad-b0kla mg-v2-user-management-page` |
| 컨테이너 | `mg-v2-ad-b0kla__container` |
| Pill 탭 영역 | `mg-v2-ad-b0kla__pill-toggle` |
| Pill 버튼 | `mg-v2-ad-b0kla__pill`, 활성 `mg-v2-ad-b0kla__pill--active` |
| 섹션 제목(악센트 바) | `mg-v2-section-heading mg-v2-section-heading--accent`, `mg-v2-section-heading__bar`, `mg-v2-section-heading__title` |
| 섹션/카드 | `mg-v2-content-section`, `mg-v2-content-card` |
| 모달 | UnifiedModal, `mg-modal__*` (헤더/바디/액션) |
| 버튼 | `mg-v2-button`, `mg-v2-button--primary`, `mg-v2-button--secondary` |

---

## 8. 반응형

- **브레이크포인트**: RESPONSIVE_LAYOUT_SPEC.md 기준 (375px ~ 3840px). 목록은 데스크톱에서 테이블, 모바일/태블릿에서 카드 1~2열 권장.
- **터치**: 모바일에서 버튼·Pill 최소 터치 영역 44×44px 유지.
- **패딩**: 섹션 패딩 24px(기준), 모바일 16px, 4K 32px 등 브레이크포인트별 적용.

---

## 9. 체크리스트 (코더 전달용)

- [ ] UserManagementPage에 스태프 Pill 탭 추가, URL `?type=staff` 반영
- [ ] 스태프 전용 패널(목록)은 `type === 'staff'` 일 때만 렌더, ContentArea + `mg-v2-ad-b0kla__*` 구조 유지
- [ ] 목록: role=STAFF 필터, 필드(이름·이메일·전화·역할·활성·선택 생성일), 행/카드별 「역할 변경」 버튼
- [ ] 역할 변경: UnifiedModal, 제목 "역할 변경", 역할 셀렉트(roles API), 취소/확인 버튼
- [ ] 확인 클릭 시 PUT .../role?newRole=... 호출, 성공 시 목록 갱신
- [ ] AdminCommonLayout, unified-design-tokens.css, B0KlA·mg-v2-ad-b0kla__* 클래스 준수

---

## 10. 참조 문서

| 문서 | 용도 |
|------|------|
| docs/planning/STAFF_ACCOUNT_MANAGEMENT_PLAN.md | 기획 §8·§9, Phase 1 범위 |
| docs/design-system/PENCIL_DESIGN_GUIDE.md | 팔레트·섹션 블록·타이포·체크리스트 |
| docs/design-system/RESPONSIVE_LAYOUT_SPEC.md | 브레이크포인트·패딩·그리드 |
| docs/design-system/ATOMIC_DESIGN_SYSTEM.md | Atoms → Pages, 컴포넌트 계층 |
| .cursor/skills/core-solution-unified-modal/SKILL.md | UnifiedModal 사용 규칙 |
| frontend/src/styles/unified-design-tokens.css | 토큰명 참고(코드 수정 없음) |
