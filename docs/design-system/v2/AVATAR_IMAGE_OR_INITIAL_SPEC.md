# 내담자·상담사 카드/리스트 아바타 표시 기준 (이미지 vs 이니셜)

**버전**: 1.0.0  
**최종 업데이트**: 2026-02-26  
**기준**: MindGarden 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), B0KlA·아토믹 디자인  
**목적**: 프로필 이미지(`profileImageUrl`) 유무에 따른 아바타 표시 규칙을 통일하여, 카드/리스트 전역에서 동일한 비주얼·폴백을 적용한다.

---

## 1. 표시 우선순위

| 순위 | 조건 | 표시 방식 |
|------|------|-----------|
| **1** | `profileImageUrl`이 있고 유효한 URL/데이터 | 아바타 영역에 **`<img>`** 로 표시. 원형(circle), `object-fit: cover`. 로드 실패 시 → 이니셜로 폴백. |
| **2** | `profileImageUrl`이 없거나 빈 값 | **이니셜**(이름 첫 글자)만 표시. 기존 배경색·폰트 스타일 유지. |

- **폴백**: 이미지 로드 실패(`onerror`) 시에는 이니셜과 동일한 스타일(기존 `__avatar` 이니셜 전용 룩)로 전환한다.

---

## 2. 이미지 사용 시 공통 규칙

### 2.1 권장 공통 클래스

- **이미지 요소**: `mg-v2-avatar-img` (아바타 컨테이너 내부의 `<img>`에 부여).
- **의도**: 카드/리스트/위젯 등 위치와 관계없이, 아바타 안에 들어가는 이미지의 크기·비율·모양을 한 곳에서 제어.

### 2.2 img 스타일 요약

| 속성 | 값 | 비고 |
|------|-----|------|
| **width** | 100% | 부모(`__avatar`) 영역 가득 채움 |
| **height** | 100% | 부모 영역 가득 채움 |
| **border-radius** | 50% | 원형 |
| **object-fit** | cover | 비율 유지하며 영역 채움, 잘림 허용 |
| **display** | block | 하단 여백 제거 |
| **폴백** | `onerror` 시 img 제거 또는 숨김 후 이니셜 노출 | 구현 시 `onError`에서 이니셜 모드로 전환 |

### 2.3 로드 실패 시 동작

- `img`의 `onError`(또는 React `onError`)에서:
  - 이미지를 숨기거나 제거하고,
  - 같은 `__avatar` 컨테이너 안에 **이니셜 텍스트**를 표시한다.
- 이니셜 표시 시에는 기존 이니셜 전용 스타일(배경색·폰트·정렬)을 그대로 사용한다.

---

## 3. 기존 이니셜 전용 클래스(`__avatar`) 안에 img가 들어갈 때 CSS 권장

아바타 컨테이너는 기존처럼 **이니셜 전용 클래스**(예: `mg-v2-mapping-creation-modal__avatar`, `mg-consultant-card__avatar`, `mg-client-card__avatar` 등)를 유지한다.  
이 컨테이너 **안에** `img`가 들어가는 경우, 아래를 적용한다.

### 3.1 컨테이너(`__avatar`)

- **이미지 있을 때**: 자식 `img`가 영역을 채우므로, 컨테이너는 **크기·원형**만 유지하면 됨.  
  기존 `width`, `height`, `border-radius: 50%`, `overflow: hidden`(이미지가 삐져나오지 않도록) 유지.
- **이니셜일 때**: 기존대로 `display: flex`, `align-items: center`, `justify-content: center`, 배경색·폰트 스타일 유지.

### 3.2 자식 img (공통 클래스 `mg-v2-avatar-img`)

| 속성 | 값 |
|------|-----|
| **width** | 100% |
| **height** | 100% |
| **border-radius** | 50% |
| **object-fit** | cover |
| **display** | block |

- 컨테이너에 `overflow: hidden`이 있으면, `border-radius: 50%`와 함께 원형 크롭이 보장된다.

---

## 4. 적용 대상 컴포넌트 목록

아래 컴포넌트·위치에서 카드/리스트 아바타를 쓸 때, 본 스펙(이미지 있음 → img / 없음 → 이니셜, img 스타일·폴백)을 적용한다.

| # | 대상 | 아바타 클래스/위치 | 비고 |
|---|------|---------------------|------|
| 1 | **매핑 생성 모달** (MappingCreationModal) | `mg-v2-mapping-creation-modal__avatar` | 상담사 카드, 내담자 카드 |
| 2 | **상담사 카드** (ConsultantCard.js) | `mg-consultant-card__avatar` (compact / detailed / schedule-select / mobile / mobile-simple 등 variant) | |
| 3 | **내담자 카드** (ClientCard.js) | `mg-client-card__avatar` (동일하게 여러 variant) | |
| 4 | **상담사 종합 관리** (ConsultantComprehensiveManagement) | 프로필 카드 아바타, 선택 시 미리보기 아바타 | ProfileCard 등 |
| 5 | **대시보드 내담자 위젯/섹션** | ConsultantClientWidget, ConsultantClientSection 카드 아바타 | 예: `consultant-client-avatar`, `mg-v2-client-card-avatar` |
| 6 | **세션 관리** (SessionManagement) | 내담자 이니셜 아바타 | 예: `mg-v2-quick-mapping-avatar`, `mg-v2-client-avatar` |
| 7 | **매핑 카드** (MappingCard) | 내담자 아바타 | `mg-v2-client-avatar` |
| 8 | **스케줄** | ClientSelector, ConsultantStatus — 선택/상태 카드 아바타 | 해당 카드 내 아바타 영역 |

- 위 목록은 **적용 대상 요약**이며, 실제 구현 시 각 컴포넌트의 데이터 소스에서 `profileImageUrl`을 내려받아 1절 우선순위에 따라 분기하면 된다.

---

## 5. 참조

- **디자인 시스템**: `pencil-new.pen`, `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`
- **프로필 사진 입력(등록/수정 모달)**: [CONSULTANT_PROFILE_PHOTO_DESIGN_SPEC.md](./CONSULTANT_PROFILE_PHOTO_DESIGN_SPEC.md)
- **토큰**: `frontend/src/styles/unified-design-tokens.css` (예: `--avatar-size-sm`, `--avatar-size-md`, `--avatar-size-lg` — 크기 참고용)

---

이 스펙은 **디자인/표시 기준 정의**이며, 구현은 core-coder가 진행한다.
