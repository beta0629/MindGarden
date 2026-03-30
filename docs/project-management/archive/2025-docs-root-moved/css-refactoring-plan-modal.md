# CSS 리팩토링 및 통합 모달(UnifiedModal) 재구축 계획서

## 1. 개요
현재 프로젝트 내에 레거시 CSS 파일(`.backup` 파일, `Old` 파일 등)이 다수 존재하며, `_modals.css`, `mindgarden-design-system.css`, `ScheduleB0KlA.css` 등 여러 파일에서 동일한 모달 클래스(`.mg-modal`, `.mg-modal__body`, `.mg-v2-ad-b0kla`)를 중복 정의하고 있습니다. 
이로 인해 모달의 높이가 화면 전체(100vh)로 늘어나는 등 심각한 레이아웃 사이드 이펙트가 발생하고 있습니다.

이를 해결하기 위해 **기존 모달 관련 파편화된 CSS 및 사용하지 않는 레거시 CSS를 삭제**하고, **단일 진실 공급원(Single Source of Truth)** 원칙에 따라 새로운 공통 모달 CSS를 구축합니다.

## 2. 작업 목표
- 파편화된 모달 스타일 및 불필요한 테마(B0KlA 등)의 레이아웃 간섭 제거.
- `.mg-v2-ad-b0kla` 등 테마 클래스가 오직 색상/타이포그래피만 제어하도록 역할 축소.
- `UnifiedModal`이 어떠한 테마 클래스와 결합되더라도 레이아웃(너비, 높이, flex)이 망가지지 않도록 **독립적인 CSS 캡슐화** 적용.

## 3. 삭제 대상 파일 (레거시 찌꺼기)
- `frontend/src/styles/**/*.backup.*` (모든 백업 파일)
- `frontend/src/components/common/MGModal.css` (사용 안함/레거시)
- `frontend/src/components/schedule/ScheduleModalOld.css` (레거시)
- `frontend/src/components/admin/backup/AdminDashboardB0KlA.legacy.backup.css` (레거시)
- `frontend/src/components/common/Modal.css` (레거시)

## 4. 리팩토링 규칙 (새로운 모달 CSS 시스템)
1. **단일 파일 관리**: `frontend/src/styles/06-components/_unified-modals.css`를 신규 생성하여 모든 모달 레이아웃 관리.
2. **테마 격리**: `ScheduleB0KlA.css` 및 `AdminDashboardB0KlA.css`에 존재하는 `.mg-modal` 관련 **레이아웃/크기(높이, flex) 제어 코드 일괄 삭제**. (테마 CSS는 색상 변수(`--ad-b0kla-card-bg` 등)만 덮어쓰도록 수정)
3. **크기 자동화(`size="auto"`) 완벽 구현**: 
   - 모달 컨테이너: `height: auto !important`, `min-height: 0 !important`
   - 모달 바디: `flex: 0 0 auto !important`, `min-height: 0 !important`
   - `.mg-v2-ad-b0kla`의 `min-height: 100vh`가 모달 오버레이를 통해 모달 내부에 상속/영향을 미치는 것을 완벽 차단.

## 5. 진행 순서
1. 문서 생성 완료 (현재 단계)
2. 서브에이전트(Core-Coder) 실행
   - 레거시 CSS 파일 삭제 (`rm`)
   - `ScheduleB0KlA.css`, `AdminDashboardB0KlA.css`, `mindgarden-design-system.css` 등에서 모달 레이아웃을 망가뜨리는 규칙 제거.
   - `_unified-modals.css` 신규 생성 및 모달 핵심 룰 작성.
   - `main.css`에서 `_modals.css` 대신 `_unified-modals.css`를 import 하도록 교체.
3. 결과 검증 및 커밋/푸시.
