# 디러티 PENDING_PAYMENT 매칭 취소 UI 디자이너 핸드오프

**작성일**: 2026-05-28
**작성자**: core-planner
**관련**: R4 트랙 (옵션 B 디러티 매칭 정리)

## 1. 개요 및 목적
사이드바 통합 스케줄링 패널에 노출되는 `PENDING_PAYMENT` 매칭 카드에 대해, 관리자가 직접 해당 매칭(및 가예약 일정)을 취소/정리할 수 있는 UI를 추가합니다.

## 2. UI 요구사항
- **위치**: 사이드바 매칭 카드 내 액션 그룹 (`MappingMatchActions`) 영역. 
  - 기존 "Checkout Same Day Payment" 버튼 하단 또는 인접한 위치.
- **버튼 형태**: 
  - 텍스트 링크 형태(Secondary) 또는 B0KlA palette 기준 `--mg-v2-danger-*` 토큰을 활용한 Danger 버튼 중 적절한 위계 선택.
  - "결제/일정 등록"이 Primary 액션이므로, "취소"는 보조적(Secondary) 위계를 가질 것.
- **취소 확인 모달 (`UnifiedModal`)**:
  - **Title**: 매칭 취소
  - **Body**: 결제 대기 중인 매칭을 취소합니다. 연결된 가예약 일정도 함께 취소됩니다.
  - **액션**: 취소 (Cancel) / 확인 (Confirm - Danger)
  - 기존 `CLIENT_DELETE_MODAL_UX_REDESIGN_HANDOFF.md`의 `medium` 사이즈 규격 및 `AlertTriangle` 아이콘 레이아웃 재사용 권장.

## 3. i18n 대상
- `admin:mapping.card.actions.cancel`: "취소"
- `admin:mapping.cancel.modal.title`: "매칭 취소"
- `admin:mapping.cancel.modal.body`: "결제 대기 중인 매칭을 취소합니다. 연결된 가예약 일정도 함께 취소됩니다."
- `admin:mapping.cancel.modal.confirm`: "확인"
- `admin:mapping.cancel.modal.cancel`: "닫기"

## 4. 코더 위임 연계
- 디자이너가 확정한 색상 토큰(SSOT)과 모달 레이아웃(UnifiedModal variant)을 `core-coder`에게 전달하여 `MappingMatchActions.js` 및 모달 구현 시 반영되도록 함.
