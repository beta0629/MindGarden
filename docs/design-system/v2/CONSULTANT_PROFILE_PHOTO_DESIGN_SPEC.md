# 상담사 등록·수정 모달 — 프로필 사진 입력 영역 디자인 스펙

**목표**: 상담사 등록/수정 모달에 프로필 사진 입력 영역을 추가할 때의 UI/UX·레이아웃·인터랙션·접근성 스펙. B0KlA/아토믹 디자인 및 기존 모달 폼 그룹과 일관 유지.

**참조**: [USER_MANAGEMENT_MODALS_DESIGN_PLAN.md](./USER_MANAGEMENT_MODALS_DESIGN_PLAN.md), 어드민 대시보드 샘플, `unified-design-tokens.css` / B0KlA 토큰(`--ad-b0kla-*`).

**데이터**: 프로필 사진은 **base64** 저장 (파일 선택 → base64 인코딩 → 서버 전송).

---

## 1. 위치

| 항목 | 권장 |
|------|------|
| **배치** | 폼 **첫 번째 필드** (이름 위). 안내 박스(💡 비밀번호…) 아래, 이름* 위. |
| **이유** | 프로필 사진은 상담사 신원을 가장 먼저 떠올리게 하는 요소. 상단에 두면 시선 흐름이 자연스럽고, 목록 카드의 아바타와도 개념적으로 맞음. 기존 `mg-v2-form-group` 순서만 하나 앞에 추가하면 되어 변경 범위가 작음. |

---

## 2. 레이아웃

- **한 행 구성**: 왼쪽 **미리보기** + 오른쪽 **버튼 영역**.
  - **미리보기**: **원형** 권장. 크기 **80px** (또는 `--spacing-3xl` / 64px). 배경 `--ad-b0kla-bg` 또는 `--ad-b0kla-border`, 테두리 1px `--ad-b0kla-border`, `border-radius: 50%`. 이미지 없을 때는 **기본 아바타**(이니셜 또는 디자인 시스템 아바타 플레이스홀더) 표시.
  - **오른쪽**: 세로 배치. **[사진 선택]** 버튼(primary: `--ad-b0kla-green`) + **(사진이 있을 때만)** **[제거]** 버튼(secondary: 테두리만). 버튼 간격 `var(--spacing-sm)` 또는 8px. 버튼 높이 40px, radius `--ad-b0kla-radius-sm`(10px).
- **폼 그룹 래퍼**: 기존과 동일하게 `mg-v2-form-group` 한 개로 감싸고, 내부는 `mg-v2-profile-photo-row`(가칭)로 좌(미리보기) 우(버튼) flex. gap 16px(`var(--spacing-md)`).
- **대안(미채택)**: 상단 중앙에 미리보기만 크게 두고 아래 버튼 — 모달 폼이 이미 세로로 길어서, 한 행에 미리보기+버튼을 두는 편이 스크롤을 덜 늘리고 라벨·도움말과의 정렬도 유지하기 좋음.

---

## 3. 인터랙션

| 동작 | 처리 |
|------|------|
| **파일 선택** | `input type="file" accept="image/*"` (또는 `image/jpeg,image/png,image/webp`). 선택 시 미리보기를 선택 이미지로 즉시 갱신, base64 인코딩 후 폼 상태에 저장. |
| **제거** | 선택된 사진/기존 프로필 제거 시 미리보기를 **기본 아바타(플레이스홀더)** 로 복귀, base64 값 빈 문자열로. |
| **파일 타입** | 이미지만 허용: `image/jpeg`, `image/png`, `image/webp`. |
| **용량 제한** | **권장 2MB**. 초과 시 클라이언트에서 안내 메시지(예: "2MB 이하 이미지를 선택해 주세요.") 표시, `mg-v2-form-help--error` 스타일. |

---

## 4. 접근성

- **라벨**: 눈에 보이는 라벨 "프로필 사진" (선택 필드이므로 `*` 없음). `mg-v2-form-label` 사용, `htmlFor`는 숨겨진 file input의 id와 연결.
- **설명**: 도움말 한 줄 예: "JPG, PNG, WEBP (권장 2MB 이하)." — `mg-v2-form-help`, `id="profile-photo-desc"`. file input에 `aria-describedby="profile-photo-desc"` 연결.
- **키보드**: [사진 선택] 버튼으로 file input을 트리거할 경우, 버튼에 `tabIndex={0}`, 클릭 시 `input.click()`. file input은 `visually-hidden`으로 숨기되 포커스/스크린리더는 접근 가능하게.
- **미리보기**: `img`일 경우 `alt="프로필 미리보기"` 또는 빈 문자열(장식용이면 `alt=""`). 플레이스홀더/이니셜만 있을 때는 `role="img"` + `aria-label="기본 프로필"` 등으로 의미 전달.

---

## 5. 수정 모달

- **동일한 프로필 사진 영역**을 수정 모달에도 둠. 레이아웃·라벨·버튼·접근성은 등록 모달과 동일.
- **기존 프로필이 있는 경우**: 서버에서 프로필 이미지(base64 또는 URL)를 내려주면, 미리보기에 **기존 이미지** 표시. 없으면 등록 모달과 동일하게 기본 아바타.
- **수정 시**: 새로 선택하면 미리보기 갱신 + base64로 저장 payload에 포함. 제거하면 빈 값으로 저장해 기존 사진 삭제로 처리.

---

## 6. 스타일·토큰 요약

| 요소 | 클래스/토큰 |
|------|-------------|
| 폼 그룹 | `mg-v2-form-group` |
| 라벨 | `mg-v2-form-label` |
| 도움말 | `mg-v2-form-help`, 에러 시 `mg-v2-form-help--error` |
| 미리보기 컨테이너 | 원형 80px, `--ad-b0kla-border`, `--ad-b0kla-bg` |
| 버튼 primary | `mg-v2-button mg-v2-button-primary` (`--ad-b0kla-green`) |
| 버튼 secondary | `mg-v2-button mg-v2-button-secondary` |
| 행 레이아웃 | flex, gap `var(--spacing-md)` |

이 스펙은 **디자인/UX 정의**이며, 구현은 core-coder가 진행한다.
