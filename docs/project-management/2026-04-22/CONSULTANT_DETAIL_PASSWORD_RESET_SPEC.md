# 상담사 상세 조회 모달 — 비밀번호 초기화 UX (기획 SSOT)

**작성일**: 2026-04-22  
**목적**: 「상담사 상세 정보」조회 모달에서도 내담자와 동등하게 비밀번호 초기화 진입 제공.  
**구현**: `core-coder` 위임(본 문서 6절). 검증: `core-tester`(선택).

---

## 1. 목표·배경

- **목표**: `modalType === 'view'`(상담사 상세 정보)에서 목록과 동일한 비밀번호 초기화 UX.
- **코드 사실**
  - `ConsultantComprehensiveManagement.js`: `PasswordResetModal`, `handlePasswordResetConfirm`, `PUT /api/v1/admin/user-management/{id}/reset-password` 이미 존재. 목록 등에서 진입 가능.
  - `getModalActions()`의 **view** 분기에는 현재 **닫기·수정**만 있음 → 여기에 진입점 추가.
  - `PasswordResetModal.js`: `userType` `consultant` 지원.
  - 참고 UX: `ClientComprehensiveManagement/ClientOverviewTab.js`의 `onResetPassword` 버튼 패턴.

---

## 2. 화면·IA

| 항목 | 권장 |
|------|------|
| 진입 위치 | **조회 모달 푸터**(`getModalActions` view 분기)에 버튼 추가. |
| 버튼 순서(좌→우) | `닫기`(secondary) → `비밀번호 초기화`(secondary, 목록과 동일) → `수정`(primary). |
| 위계 | 비밀번호 초기화는 **secondary**(목록과 동일). 주 작업은 계속 **수정** = primary. |
| 내담자와의 관계 | 배치만 다르고, 라벨·`PasswordResetModal` 흐름은 **동등**(`userType`으로 문구 구분). |

---

## 3. 상태·흐름

| 시나리오 | 원칙 |
|----------|------|
| 상세 + 비밀번호 모달 | 상세 `showModal` 유지 + `PasswordResetModal` 스택 2단(기존 패턴). |
| 닫기 | 비밀번호 모달 `onClose`에서만 `passwordResetConsultant` 초기화(기존과 동일). |
| 성공 후 | 상세 모달은 **열린 채** 유지(목록 이탈 없음) 권장. |
| 포커스 | `UnifiedModal` 기본 동작; 이슈 시 별도 점검. |

---

## 4. 권한·감사

- API: `AdminUserController` 등 `PUT .../reset-password` — 관리자 전용·감사 로그 성격은 백엔드 기존 정책 따름.
- 이번 Phase: **API 변경 없음**(프론트 진입점만 추가).

---

## 5. 문구·상수화

- 버튼 라벨·`title`: 목록과 동일 → `consultantComprehensiveStrings.js`(또는 기존 상수 모듈)로 통일 권장.
- `PasswordResetModal` 내부 검증 문구: 이번 범위에서 **변경 없음**.

---

## 6. core-coder 위임 패키지

| 항목 | 내용 |
|------|------|
| 파일 | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` — `getModalActions`의 `view` 분기. |
| 동작 | `selectedConsultant`로 `setPasswordResetConsultant` + `setShowPasswordResetModal(true)` (목록 버튼과 동일). |
| 표준 | `MGButton`, `buildErpMgButtonClassName`, `UnifiedModal` 관련 기존 패턴 유지. |
| 완료 조건 | `npm run build`, `npm run lint:check` 통과. |

---

## 7. 분배

| 순서 | 담당 | 내용 |
|------|------|------|
| 1 | core-coder | 위 6절 구현 |
| 2 | core-tester(선택) | 상세 → 비밀번호 초기화 → 취소/성공 스모크 |
