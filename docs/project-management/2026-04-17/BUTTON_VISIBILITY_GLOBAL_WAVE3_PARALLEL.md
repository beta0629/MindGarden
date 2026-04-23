# 전역 버튼 가시성 — Wave 3 병렬 위임 기록

**일자**: 2026-04-17  
**상위 문서**: `BUTTON_VISIBILITY_A11Y_PARALLEL_BATCH.md`

---

## 1. 병렬 위임 구성

| 역할 | 에이전트 ID (`resume`) | 상태 |
|------|-------------------------|------|
| **explore** (전역 2차 인벤토리) | `107a5fc6-f947-4d3a-8e8f-393e41c79a8d` | 완료 — 표 + 코더용 경로 20개 |
| **core-coder** (1차 패치) | `400218ba-1a69-4289-8f1b-e5715ff3b130` | 완료(응답 트렁케이트, 워킹트리 반영) |
| **core-coder** (2차 P1 잔여) | `72dc5bc4-29cc-4d4a-846c-2856e8c65476` | 완료 — §2b |
| **core-tester** (E2E·체크리스트) | `08c543f5-2fe6-45c4-aecf-0b6ca2d1abc7` | 완료 |

---

## 2a. core-coder 1차로 반영된 파일

- `frontend/src/styles/auth/UnifiedLogin.css`
- `frontend/src/styles/06-components/_unified-modals.css`
- `frontend/src/components/common/MGTable.css`
- `frontend/src/components/ui/Table/Table.css`
- `frontend/src/components/erp/ErpCommon.css`
- `frontend/src/components/homepage/Homepage.css` / `Homepage.js` (Wave2 연속)

## 2b. core-coder 2차로 반영된 파일

- `frontend/src/styles/06-components/_header.css`
- `frontend/src/components/layout/SimpleLayout.css`
- `frontend/src/styles/auth/social-signup-modal.css`
- `frontend/src/components/admin/MappingCreationModal.css`
- `frontend/src/components/common/IPhone17Modal.css`
- `frontend/src/components/erp/common/molecules/ErpFilterToolbar.css`
- `frontend/src/components/ui/Button/Button.css` (`.mg-v2-button-group` overflow)

## 2c. 3차(선택) 잔여 후보

- `frontend/src/styles/06-components/_base/_header.css` (main 미포함 레거시 — 병합은 별도 조사)
- `frontend/src/components/landing/CounselingHero.css` / `CounselingContact.js`
- `frontend/src/components/dashboard/widgets/consultation/ConsultationRecordWidget.css`
- `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`

---

## 3. explore 요약 (홈 GNB 제외)

- **높음**: `_unified-modals.css` 푸터 primary·`color: inherit`; `_header.css` 헤더 내 `color: inherit`; 소셜 가입 모달; B0KlA 매핑 모달.
- **중**: ERP 필터/대시보드·SimpleLayout·IPhone17Modal·테이블 래퍼 overflow.
- **낮~중**: 버튼 그룹 `overflow: hidden`, 랜딩 히어로 CTA, 상담 위젯 소형 버튼, 레거시 `.mg-btn`.

전문 표·20개 경로 bullet은 explore 응답(에이전트 트랜스크립트) 참조.

---

## 4. core-tester 산출

- **신규**: `tests/e2e/tests/auth/login-register-visibility-smoke.spec.ts`
- **체크리스트**: `BUTTON_VISIBILITY_WAVE2_TEST_CHECKLIST.md`에 **Wave 3** 절 추가됨.
- **실행 예**:  
  `cd tests/e2e && npx playwright test tests/landing/landing-home-header.spec.ts tests/auth/login-register-visibility-smoke.spec.ts --project=chromium`  
  보고: **3 passed** (chromium).

---

## 5. 다음 액션

1. 사용자 **검수·커밋** (Wave2·Wave3 전체 diff + `docs/...` + `tests/e2e/` 스냅샷·신규 스펙).
2. **core-coder 3차**(선택): §2c 잔여 파일 + `_base/_header.css` 병합·삭제 여부 조사.
3. **CI**: Linux Playwright 스냅샷 불일치 시 `--update-snapshots` 또는 체크리스트 절차.
4. **Jest**: `ClientModal.emailForm.test.js` 다중 매칭 실패는 본 에픽과 별도로 `core-coder`에 위임 가능.
5. **Wave 5 완료**(§7): 레거시 `_base/_header.css` 삭제, 위젯 이중 경로 주석, Playwright 4건 chromium 통과(로컬).

---

## 6. Wave 4 — 병렬 위임 (2026-04-17)

| 역할 | 에이전트 ID | 산출 |
|------|-------------|------|
| **explore** | `75560517-e1e2-4c9f-83a2-b5a41a2920a7` | `_base/_header.css`는 **import 0건·dead 후보(A)**; 루트 `_header.css`가 정본. `/landing` 히어로 `overflow:hidden`+opacity, `ConsultationRecordWidget` 두 갈래 CSS 요약. 코더 4차 경로 8개 bullet |
| **core-coder** (3c) | `8505776f-25da-4b01-8f0a-bcdcee72177c` | `CounselingHero.js/css`, `CounselingContact.js` + **신규** `CounselingContact.css`, `ConsultationRecordWidget.css`, `AdminDashboardB0KlA.css`. **`_base/_header.css`는 내용 상이로 삭제 보류** |
| **core-tester** | `5d118c7a-19e4-4c55-a378-458660802299` | `tests/e2e/tests/landing/counseling-landing-buttons.spec.ts`; 체크리스트 Wave 4 절; `landing`+`auth`+`counseling` **chromium 4 passed** |

### Wave 4 Playwright 묶음

```bash
cd tests/e2e && npx playwright test tests/landing/landing-home-header.spec.ts tests/auth/login-register-visibility-smoke.spec.ts tests/landing/counseling-landing-buttons.spec.ts --project=chromium
```

### Wave 5 제안 → §7 반영

- `_base/_header.css`: **§7에서 삭제 완료**(번들 미포함 dead 파일).
- `widgets/ConsultationRecordWidget` **이중 진입점**: §7 — JS 상단 주석만 추가; **CSS 통합·위젯 병합**은 별도 에픽.

## 7. Wave 5 (2026-04-23)

**core-coder** 에이전트 ID: `eda39013-289d-4b90-9e99-799d0ab758fb`

- **삭제**: `frontend/src/styles/06-components/_base/_header.css` — `frontend/src` 전역 `rg` 기준 `_base/_header`·`06-components/_base/_header` import **0건**; `main.css`는 `./06-components/_header.css`만 import(정본).
- **위젯 이중 경로 주석(코드만)**: `frontend/src/components/dashboard/widgets/ConsultationRecordWidget.js` 상단, `frontend/src/components/dashboard/widgets/consultation/ConsultationRecordWidget.js` 상단 — 스타일 변경 시 두 `ConsultationRecordWidget.css` 점검 안내(대규모 리팩터 없음).
