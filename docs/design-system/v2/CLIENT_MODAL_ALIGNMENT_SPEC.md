# 내담자 등록/수정 모달 — 상담사 기준 정렬 스펙

**목표**: 내담자 등록/수정 화면을 **상담사 등록/수정** 모달과 동일한 형식·레이아웃으로 맞추고, 내담자도 **프로필 사진 등록**을 할 수 있도록 하는 디자인 제안.

**참조**:  
- 기준(상담사): `ConsultantComprehensiveManagement.js` — 단일 `UnifiedModal`로 create/edit/delete 처리.  
- 현재 내담자: `ClientComprehensiveManagement.js` + `ClientComprehensiveManagement/ClientModal.js` (UnifiedModal 사용).  
- 프로필 사진 상세: [CONSULTANT_PROFILE_PHOTO_DESIGN_SPEC.md](./CONSULTANT_PROFILE_PHOTO_DESIGN_SPEC.md), `imageResizeCrop.js`(리사이즈·크롭).

**역할**: 디자인 스펙만 정의. 코드 작성은 하지 않음.

---

## 1. 상담사 대비 내담자 모달 변경 요약

| 구분 | 상담사(기준) | 내담자(현재) | 내담자(정렬 후) |
|------|--------------|--------------|------------------|
| **모달 구조** | 단일 UnifiedModal, create/edit/view + 별도 삭제 확인 모달 | 단일 ClientModal(UnifiedModal), create/edit/delete 동일 모달 내 전환 | create/edit은 동일 모달, **삭제는 상담사처럼 별도 확인 모달** 권장 |
| **폼 순서** | ① 안내 → ② 프로필 사진 → ③ 이름 → ④ 이메일(중복확인) → ⑤ 비밀번호(등록 시) → ⑥ 전화 → ⑦ 전문분야 → 기타 | 정보 박스 → 이름 → 이메일 → 비밀번호 → 전화 → 상태 → 등급 → 메모 | ① 안내 → **② 프로필 사진** → ③ 이름 → ④ 이메일(중복확인) → ⑤ 비밀번호(등록 시) → ⑥ 전화 → ⑦ 상태 → ⑧ 등급 → ⑨ 메모 |
| **프로필 사진** | 있음 (미리보기 + 선택/제거, 리사이즈·크롭, 최대 2MB) | 없음 | **추가** — 상담사와 동일 블록·클래스·동작 |
| **정보 박스** | `mg-v2-info-box mg-v2-ad-b0kla-info-box`, 등록 시만 "비밀번호 미입력 시 자동 생성" | `mg-v2-info-box` + 인라인 스타일 | **클래스 통일**: `mg-v2-info-box mg-v2-ad-b0kla-info-box` |
| **삭제 확인** | 별도 UnifiedModal, `variant="confirm"`, 제목 "상담사 삭제 확인", 본문 문구 + 취소/삭제 버튼 | 동일 모달 내 `renderDeleteContent`, `mg-v2-delete-confirmation` | **상담사와 동일**: 별도 확인 모달 + 동일 문구·경고 스타일 |

---

## 2. 폼 필드 순서 표

내담자 모달 폼은 아래 순서로 배치한다. 상담사는 ⑦이 전문분야, 내담자는 ⑦·⑧·⑨가 상태·등급·메모이다.

| 순서 | 필드 | 필수 | 비고 | 공통 클래스(필드 래퍼) |
|------|------|------|------|------------------------|
| 0 | 정보 박스 | — | 등록 시만 표시. "비밀번호 미입력 시 자동 생성" 안내 | `mg-v2-info-box mg-v2-ad-b0kla-info-box` |
| 1 | 프로필 사진 | 선택 | 미리보기 + 사진 선택/제거, 최대 2MB, 리사이즈·크롭 | `mg-v2-form-group mg-v2-profile-photo-group` |
| 2 | 이름 | 등록 시 * | — | `mg-v2-form-group` |
| 3 | 이메일 | * | 중복확인 버튼(등록 시), 수정 시 비활성·도움말 | `mg-v2-form-group`, 이메일 행: `mg-v2-form-email-row` |
| 4 | 비밀번호 | 선택 | 등록 시만 노출. 미입력 시 자동 생성 | `mg-v2-form-group` |
| 5 | 전화번호 | 선택 | — | `mg-v2-form-group` |
| 6 | 상태 | 선택 | 공통코드 USER_STATUS 기반 셀렉트 | `mg-v2-form-group` |
| 7 | 등급 | 선택 | 공통코드 USER_GRADE 또는 고정 옵션 | `mg-v2-form-group` |
| 8 | 메모 | 선택 | textarea | `mg-v2-form-group` |

- 상담사와 동일하게 **프로필 사진을 1번**으로 두고, 이름·이메일·비밀번호·전화 순서를 유지한다.  
- 내담자 전용 필드(상태·등급·메모)는 상담사의 "전문분야" 위치(⑦) 이후에 이어서 배치한다.

---

## 3. 프로필 사진 블록 추가 (내담자)

### 3.1 위치

- **폼 내 순서**: 정보 박스(등록 시만) **바로 다음**, 이름* **앞**.
- 상담사 모달과 동일한 순서로, 폼 최상단 인근에 둔다.

### 3.2 동작

| 동작 | 설명 |
|------|------|
| **파일 선택** | `input type="file"` accept 이미지. 선택 시 `imageResizeCrop.js`의 리사이즈·크롭 적용 후 base64 저장, 미리보기 즉시 갱신. |
| **제거** | 버튼 클릭 시 미리보기를 플레이스홀더로 되돌리고, 저장값은 빈 문자열. |
| **용량** | 최대 2MB. 초과 시 안내 메시지(예: "처리 후에도 용량이 2MB를 초과합니다."), `mg-v2-form-help--error` 등으로 표시. |
| **수정 모달** | 기존 프로필이 있으면 미리보기에 표시; 없으면 플레이스홀더. 새로 선택/제거 시 동일 로직. |

(구현은 `imageResizeCrop.js`의 `resizeImage`, `cropImageToSquare`, `getDataUrlByteSize` 활용 — 상담사와 동일.)

### 3.3 시각적 구조·클래스 (상담사와 동일)

- **래퍼**: `mg-v2-form-group mg-v2-profile-photo-group`
- **라벨**: `mg-v2-form-label` — "프로필 사진" (선택 필드이므로 `*` 없음)
- **미리보기 영역**: `mg-v2-profile-photo-preview-wrap` → 내부 `mg-v2-profile-photo-preview`(원형), 없을 때 `mg-v2-profile-photo-placeholder`
- **버튼 영역**: `mg-v2-profile-photo-actions`  
  - 사진 선택: `mg-v2-button mg-v2-button-secondary mg-v2-profile-photo-label`, 내부 `input`은 `mg-v2-profile-photo-input`(숨김)
  - 제거: 동일 스타일의 버튼(사진 있을 때만 표시)
- **도움말**: `mg-v2-form-help` — "이미지 파일만 가능, 최대 2MB"

상담사 모달에 사용 중인 B0KlA 프로필 사진 클래스와 동일하게 사용하면, 어드민 대시보드 샘플과 한 톤으로 통일된다.

---

## 4. 정보 박스 통일

- **용도**: 등록 시 "비밀번호 미입력 시 자동 생성" 안내.
- **클래스**: `mg-v2-info-box mg-v2-ad-b0kla-info-box` (상담사와 동일).  
- **표시**: create일 때만 폼 최상단(프로필 사진 블록 위)에 한 블록으로 표시.  
- 내담자 모달에서 인라인 스타일로 쓰던 부분은 제거하고, 위 클래스만 사용해 B0KlA 스타일이 적용되도록 한다.

---

## 5. 삭제 확인 정리

- **권장**: 상담사와 동일하게 **별도 UnifiedModal**로 삭제 확인 처리.
  - 제목: "내담자 삭제 확인" (상담사는 "상담사 삭제 확인").
  - 크기: `size="medium"`, `variant="confirm"`.
  - 본문: 해당 내담자 이름(또는 "이 내담자") + "정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다." 등 동일 톤의 문구.
  - 버튼: 취소 `mg-v2-button mg-v2-button-secondary`, 삭제 `mg-v2-button mg-v2-button-danger`.
- **모달 스코프**: `className="mg-v2-ad-b0kla"` 적용해 B0KlA 버튼·경고 스타일 유지.

기존처럼 create/edit 모달 안에서 delete 화면을 전환하는 방식이라면, 삭제 콘텐츠 영역에는 `mg-v2-modal-body`, `mg-v2-delete-confirmation`, 경고 문구 스타일을 상담사 삭제 확인 본문과 같은 톤으로 맞춘다.

---

## 6. 공통으로 쓸 B0KlA·폼 클래스 목록

구현 시 내담자·상담사 모달 모두 아래 클래스를 사용하면, 어드민 대시보드 샘플과 동일한 비주얼을 유지할 수 있다.

### 6.1 모달·레이아웃

| 클래스 | 용도 |
|--------|------|
| `mg-v2-ad-b0kla` | 모달(및 삭제 확인 모달) 루트 스코프. B0KlA 토큰·버튼 적용 |
| `mg-v2-modal-body` | 모달 본문 래퍼 |
| `mg-v2-form` | 폼 루트 |

### 6.2 정보 박스

| 클래스 | 용도 |
|--------|------|
| `mg-v2-info-box mg-v2-ad-b0kla-info-box` | 등록 시 비밀번호 자동 생성 안내 |
| `mg-v2-info-text` | 안내 문구 텍스트(필요 시) |

### 6.3 폼 그룹·라벨·입력

| 클래스 | 용도 |
|--------|------|
| `mg-v2-form-group` | 필드 한 덩어리 래퍼 |
| `mg-v2-form-label` | 라벨 |
| `mg-v2-form-input` | text input, email, password, tel |
| `mg-v2-form-select` | select(상태·등급) |
| `mg-v2-form-textarea` | 메모 textarea |
| `mg-v2-form-help` | 도움말/캡션 |
| `mg-v2-form-help--error` | 에러 안내 |
| `mg-v2-form-help--success` | 성공 안내(예: 이메일 사용 가능) |
| `mg-v2-form-email-row` | 이메일 입력 + 중복확인 버튼 행 |

### 6.4 프로필 사진

| 클래스 | 용도 |
|--------|------|
| `mg-v2-form-group mg-v2-profile-photo-group` | 프로필 사진 필드 래퍼 |
| `mg-v2-profile-photo-preview-wrap` | 미리보기 + 버튼 영역 감싸는 wrap |
| `mg-v2-profile-photo-preview` | 미리보기 원형 컨테이너 |
| `mg-v2-profile-photo-placeholder` | 이미지 없을 때 플레이스홀더 |
| `mg-v2-profile-photo-actions` | 사진 선택/제거 버튼 영역 |
| `mg-v2-button mg-v2-button-secondary mg-v2-profile-photo-label` | 사진 선택 라벨(버튼 형태) |
| `mg-v2-profile-photo-input` | file input(시각적으로 숨김) |

### 6.5 버튼

| 클래스 | 용도 |
|--------|------|
| `mg-v2-button mg-v2-button-primary` | 등록/수정 확인 |
| `mg-v2-button mg-v2-button-secondary` | 취소, 사진 선택 등 |
| `mg-v2-button mg-v2-button-danger` | 삭제 확인 모달의 삭제 버튼 |

### 6.6 삭제 확인(별도 모달 사용 시)

| 클래스 | 용도 |
|--------|------|
| `mg-v2-modal-body` | 삭제 확인 모달 본문 |
| `mg-v2-button mg-v2-button-secondary` | 취소 |
| `mg-v2-button mg-v2-button-danger` | 삭제 |

삭제 문구·경고는 상담사 삭제 확인과 동일한 톤(되돌릴 수 없음 등)으로 통일한다.

---

## 7. 체크리스트 (구현 검수용)

- [ ] 내담자 모달 폼 순서가 ① 정보 박스(등록 시) → ② 프로필 사진 → ③ 이름 → … → ⑨ 메모 로 되어 있는가?
- [ ] 프로필 사진 블록이 `mg-v2-profile-photo-group` 등 상담사와 동일 클래스로 구성되어 있는가?
- [ ] 파일 선택 → 리사이즈·크롭 → base64, 최대 2MB 제한이 상담사와 동일하게 동작하는가?
- [ ] 정보 박스가 `mg-v2-info-box mg-v2-ad-b0kla-info-box`만 사용하는가?(인라인 스타일 제거)
- [ ] 삭제 확인이 상담사와 동일하게 별도 모달·문구·경고 스타일로 정리되어 있는가?
- [ ] 모달 루트에 `mg-v2-ad-b0kla`가 적용되어 B0KlA 버튼·폼 스타일이 나오는가?

---

*이 문서는 디자인·UX 스펙이며, 구현은 core-coder가 수행한다.*
