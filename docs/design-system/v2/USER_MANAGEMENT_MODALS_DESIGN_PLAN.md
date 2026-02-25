# 사용자 관리 모달 통일 디자인 계획 (상담사/내담자 등록·수정·상세·삭제)

**목표**: 상담사 등록 모달(ConsultantComprehensiveManagement)과 내담자 등록 모달(ClientComprehensiveManagement)을 **UnifiedModal** 기반으로 통일하고, **B0KlA 아토믹 디자인** 토큰에 맞춘 레이아웃·UI/UX로 정리한다.

**참조**: 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), `UnifiedModal` 스킬, `frontend/src/styles/dashboard-tokens-extension.css`(B0KlA 토큰), `ScheduleB0KlA.css` / `MappingCreationModal.css`(B0KlA 모달 스타일)

---

## 1. 상담사 등록 모달 (ConsultantComprehensiveManagement)

### 1.1 현재 상태
- **커스텀 마크업 사용**: `mg-v2-modal-overlay`, `mg-v2-modal`, `mg-v2-modal-header`, `mg-v2-modal-body` 등 별도 오버레이/모달 div 사용 → 투명하거나 공통 모달과 다르게 보임.
- **모드**: `create`(새 상담사 등록), `edit`(상담사 정보 수정), `view`(상담사 상세 정보), `delete`(상담사 삭제 확인).

### 1.2 적용 방향

| 항목 | 적용 내용 |
|------|-----------|
| **컴포넌트** | `UnifiedModal` 단일 사용. `mg-v2-modal-overlay` / `mg-v2-modal` 제거. |
| **B0KlA 적용** | `className="mg-v2-ad-b0kla"` 전달. 기존 `ScheduleB0KlA.css`, `MappingCreationModal.css`와 동일한 오버레이·모달 본체 스타일 재사용. |
| **크기** | 폼/상세 콘텐츠 양 고려 → `size="large"` 권장. 삭제 확인만 있을 경우 `size="small"` 또는 `medium` 가능. |
| **variant** | 폼/상세: `variant="form"` 또는 `default`. 삭제 확인: `variant="confirm"`. |

### 1.3 레이아웃 구조

- **헤더 (UnifiedModal 내장)**
  - 제목: 모드별 문구
    - create → 「새 상담사 등록」
    - edit → 「상담사 정보 수정」
    - view → 「상담사 상세 정보」
    - delete → 「상담사 삭제 확인」
  - 닫기: `showCloseButton={true}` (UnifiedModal 기본)

- **바디 (children → `mg-modal__body` 내부, 스크롤 가능)**
  - **view**: 상세 정보 전용 블록
    - 아바타·이름·이메일·상태 배지
    - 섹션: 기본 정보(전화번호, 가입일), 전문분야
    - B0KlA 카드형: `mg-v2-ad-b0kla__card`, 섹션 제목 좌측 악센트 바(4px, `--ad-b0kla-green`)
  - **create / edit**: 폼
    - 상단 안내 문구 1개(💡 비밀번호 미입력 시 임시 비밀번호) → **안내 박스**로 통일(아래 3.2 참조)
    - 필드: 이름*, 이메일*(+ 중복확인 버튼), 비밀번호(create만), 전화번호, 전문분야(멀티셀렉트)
    - 필수 표시: 라벨에 `*`, 라벨/헬프 텍스트 색상 `--ad-b0kla-text-secondary`, `--ad-b0kla-title-color`
  - **delete**: 삭제 확인 문구 + 대상 요약(이름, 이메일 등) + 경고 문구(되돌릴 수 없음)

- **푸터 (UnifiedModal `actions`)**
  - 왼쪽 여백, 버튼 우측 정렬
  - create/edit: [취소(secondary)] [등록/수정(primary)]
  - delete: [취소(secondary)] [삭제(danger)]
  - 버튼: MGButton 또는 B0KlA 스타일(`--ad-b0kla-green` primary, `--ad-b0kla-danger` 삭제)

### 1.4 스타일 적용 방향

- **오버레이**: `--ad-b0kla-overlay-bg`(또는 `--droplet-bg-dark`) 반투명 배경. 기존 `.mg-modal-overlay.mg-v2-ad-b0kla` 재사용.
- **모달 본체**: `--ad-b0kla-card-bg`, `--ad-b0kla-border`, `--ad-b0kla-radius`(또는 16px). `.mg-modal.mg-v2-ad-b0kla` 재사용.
- **헤더/바디/액션**: `mg-modal__header`, `mg-modal__body`, `mg-modal__actions`에 B0KlA 토큰 적용된 기존 CSS 그대로 사용.
- **폼 내부**: input/select/textarea는 `.mg-modal.mg-v2-ad-b0kla .mg-modal__body` 하위 셀렉터로 border `--ad-b0kla-border`(또는 `--mg-gray-300`), radius `--ad-b0kla-radius-sm`, 포커스 시 `--ad-b0kla-green` 계열.

---

## 2. 내담자 등록 모달 (ClientComprehensiveManagement)

### 2.1 현재 상태
- **ClientModal**에서 이미 **UnifiedModal** 사용 중.
- B0KlA 클래스 미적용 → 기본(글래스 등) 스타일로 보일 수 있음.
- 모드: `create`, `edit`, `delete` (상세 view는 없음).

### 2.2 적용 방향

| 항목 | 적용 내용 |
|------|-----------|
| **컴포넌트** | 계속 **UnifiedModal** 사용. |
| **B0KlA 적용** | `className="mg-v2-ad-b0kla"` 추가. 상담사 모달과 동일한 오버레이·카드형 본체. |
| **크기** | `size="large"` 유지(폼 필드 수 고려). |
| **variant** | form/default, delete 시 confirm. |

### 2.3 레이아웃 구조

- **헤더**
  - create → 「새 내담자 등록」, edit → 「내담자 정보 수정」, delete → 「내담자 삭제」(또는 「내담자 삭제 확인」)

- **바디**
  - **create / edit**: 상단 안내(💡 비밀번호 미입력 시 임시 비밀번호) → 안내 박스 통일
  - 필드: 이름*, 이메일*(+ 중복확인), 비밀번호(create만), 전화번호, 상태(셀렉트), 등급(셀렉트), 메모(textarea)
  - 필수(*) 및 헬프/에러/성공 메시지 색상 통일(3.2 참조)
  - **delete**: 삭제 확인 문구 + 대상(이름, 이메일, 전화번호) + 되돌릴 수 없음 경고

- **푸터**
  - [취소] [등록/수정/삭제] — primary/danger 구분

### 2.4 스타일 적용 방향

- 상담사 모달과 동일: B0KlA 오버레이·모달 본체·헤더·바디·액션·폼 컨트롤 토큰 적용.
- 내부 클래스명: 가능하면 `mg-v2-ad-b0kla__*` 또는 기존 `mg-v2-form-*`를 B0KlA 토큰으로 스타일하는 셀렉터 추가(`.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-form-input` 등).

---

## 3. 공통 적용 원칙

### 3.1 모달 래퍼
- **UnifiedModal만 사용**. `mg-v2-modal-overlay`, `mg-v2-modal`, `mg-v2-ad-b0kla-modal-overlay` 등 커스텀 오버레이/래퍼 금지.
- 어드민·B0KlA 영역이므로 **className="mg-v2-ad-b0kla"** 전달해 기존 B0KlA 모달 CSS와 동일한 비주얼 유지.

### 3.2 B0KlA 토큰 (모달·폼)
- **오버레이**: `--ad-b0kla-overlay-bg`
- **모달 본체**: `--ad-b0kla-card-bg`, `--ad-b0kla-border`, `--ad-b0kla-radius` / `--ad-b0kla-radius-sm`
- **제목**: `--ad-b0kla-title-color`(또는 `--mg-text-primary`)
- **본문/라벨/헬프**: `--ad-b0kla-text-secondary`, `--ad-b0kla-title-color`
- **버튼**: primary → `--ad-b0kla-green`, danger → `--ad-b0kla-danger`, secondary → 테두리/배경 `--ad-b0kla-border`, `--ad-b0kla-bg`
- **안내 박스(💡)**: 배경 `--ad-b0kla-green-bg`, 테두리 `--ad-b0kla-green`, 텍스트 `--ad-b0kla-text-secondary` 또는 `--ad-b0kla-title-color`. 아이콘(💡 또는 Lightbulb) + 문구 한 줄.

### 3.3 가독성·일관성
- **필수 필드**: 라벨 옆 `*` 표시, 색상은 라벨과 동일(필수만 강조).
- **안내 문구**: 💡 등은 아이콘+텍스트 블록으로 한 곳에 정리(상단 1블록). 인라인 스타일 제거, 클래스로 `--ad-b0kla-*` 적용.
- **버튼 variant**: 취소 → secondary, 등록/수정 → primary, 삭제 → danger. 우측 정렬, 간격 `var(--spacing-md)` 또는 12px.

### 3.4 삭제 확인 모달
- 삭제 시에도 동일한 UnifiedModal + `mg-v2-ad-b0kla` 사용.
- 본문만 삭제 안내·대상 요약·경고로 구성하고, 푸터에 [취소] [삭제(danger)].
- 필요 시 `variant="confirm"`으로 제목/본문 톤 조정(기존 모달 CSS에 confirm 스타일 있음).

---

## 4. 산출물 체크리스트 (구현 시 참고)

- [ ] ConsultantComprehensiveManagement: 커스텀 `mg-v2-modal-overlay`/`mg-v2-modal` 제거, UnifiedModal로 교체, `className="mg-v2-ad-b0kla"`, `size="large"`, 모드별 title/children/actions 매핑.
- [ ] ClientModal: UnifiedModal에 `className="mg-v2-ad-b0kla"` 추가, 기존 구조 유지.
- [ ] 두 모달 모두 B0KlA 모달 CSS가 로드되도록 해당 페이지에서 `ScheduleB0KlA.css` 또는 `MappingCreationModal.css` 또는 공통 B0KlA 모달 스타일 import 확인.
- [ ] 안내 문구(💡) 블록: 공통 클래스로 스타일, B0KlA 토큰 사용.
- [ ] 폼 라벨/input/select/textarea/버튼: B0KlA 토큰 적용된 셀렉터 범위 안에 두어 일관된 색·간격·radius 유지.

이 문서는 **디자인 계획/스펙 요약**이며, 구현은 core-coder가 위 사항을 반영하여 진행한다.
