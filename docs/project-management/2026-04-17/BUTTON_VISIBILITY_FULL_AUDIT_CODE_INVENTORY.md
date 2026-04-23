# 전역 버튼 가시성 — 코드 인벤토리 (전수 점검)

**작성일**: 2026-04-23  
**출처**: `explore` 서브에이전트 전수 스캔 (에이전트 ID: `b5dff56b-f181-4502-bd98-e313b0137863`)  
**연계 문서**: [자동·수동·CI 매트릭스](./BUTTON_VISIBILITY_FULL_AUDIT_TEST_MATRIX.md) · [Wave3 병렬 기록](./BUTTON_VISIBILITY_GLOBAL_WAVE3_PARALLEL.md)

---

## 1. 우선순위 표 (가시성·대비·클리핑)

| 순위 | 영역 | 라우트·화면 추정 | 대표 파일 | 패턴 | 심각도 | 권장 |
|:---:|:---|:---|:---|:---|:---:|:---|
| 1 | 헤더·고정 레이어 | `/`, `/landing` | `Homepage.css`, `_header.css` | `mg-header--transparent` + outline/primary, sticky·z-index | **H** | 스코프 CSS·토큰; E2E 스크롤 y0/y80 |
| 2 | Simple 레이아웃 | 관리·설정·빌링 등 | `SimpleLayout.css`, `SimpleHeader.css` | 그라데이션 헤더·BEM vs MGButton 우선순위 | **M** | variant 단일화·충돌 최소화 |
| 3 | 랜딩 히어로 | `/landing` | `CounselingHero.css`, `CounselingContact.js` | 그라데이션·opacity·이중 클래스 스택 | **M** | 토큰·CTA 대비 문서화 |
| 4 | 대시보드 v2 GNB | 역할별 대시보드 | `DesktopGnb.css`, `ProfileDropdown.js` | ellipsis·알림·ERP 빌더 클래스 | **M** | 헤더 토큰·z-index·포커스 |
| 5 | 모달·iOS | 전역 | `_unified-modals.css`, `IPhone17Modal.css` | 푸터 `color: inherit`, mg-v2·mg-button 병행 | **H** | 스코프 토큰 동시 갱신 |
| 6 | 테이블 | ERP·관리 | `MGTable.css`, `Table.css` | `overflow: hidden`, 로딩 opacity | **M** | 셀·행 액션 `overflow: visible` |
| 7 | ERP 필터 | `/erp/*` | `ErpFilterToolbar.css` | `overflow: visible` 주석 패턴 | **L** | 상위 `hidden` 재적용 여부 grep |
| 8 | 이중 클래스 | 광범위 | `MGButton.js`, `erpMgButtonProps.js` | `mg-button`+`mg-v2-button-*` | **H** | 장기: 단일 시각 계약 |
| 9 | `color: inherit` | 모달·KPI 등 | `_unified-modals.css`, `PsychKpiSection.css` 등 | 부모 색 오류 시 대비 붕괴 | **M** | 부모 전경 토큰 보장 |
| 10 | `opacity` | 테이블·B0KlA·버튼 | `MGTable.css`, `AdminDashboardB0KlA.css`, `Button.css` | 로딩·disabled 겹침 | **L~M** | 비활성 시 색만·오버레이 분리 검토 |
| 11 | v2 Button 기본 | 전역 | `Button.css` | `.mg-v2-button { overflow: hidden }` | **M** | 포커스 ring 클리핑 |
| 12 | 심리 KPI 카드 | 어드민 | `PsychKpiSection.css` | 카드형 `mg-button` + inherit | **M** | 스코프 대비 명시 |

---

## 2. MGButton + `buildErpMgButtonClassName` 샘플 경로 (15)

- `components/base/BaseCard/BaseCard.js`
- `components/auth/ForgotPassword.js`
- `components/auth/TabletLogin.js`
- `components/auth/TabletRegister.js`
- `components/ui/Card/ClientCard.js`
- `components/ui/Card/ConsultantCard.js`
- `components/common/ProfileImageInput.js`
- `components/common/molecules/KoreanMobileDuplicateField.js`
- `components/common/DuplicateLoginAlert.js`
- `components/common/Toast.js`
- `components/dashboard-v2/molecules/NotificationDropdown.js`
- `components/admin/UserManagementPage.js`
- `components/settings/UserSettings.js`
- `components/admin/StaffManagement.js`
- `components/landing/CounselingContact.js`

---

## 3. core-coder 우선 20파일 (배치 입력용)

- `frontend/src/components/homepage/Homepage.css`
- `frontend/src/components/homepage/Homepage.js`
- `frontend/src/styles/06-components/_header.css`
- `frontend/src/components/layout/SimpleLayout.css`
- `frontend/src/components/layout/SimpleHeader.css`
- `frontend/src/components/landing/CounselingHero.css`
- `frontend/src/components/landing/CounselingContact.js`
- `frontend/src/styles/06-components/_unified-modals.css`
- `frontend/src/components/common/IPhone17Modal.css`
- `frontend/src/components/common/MGTable.css`
- `frontend/src/components/ui/Table/Table.css`
- `frontend/src/components/ui/Button/Button.css`
- `frontend/src/components/erp/common/molecules/ErpFilterToolbar.css`
- `frontend/src/components/dashboard-v2/organisms/DesktopGnb.css`
- `frontend/src/components/dashboard-v2/molecules/ProfileDropdown.js`
- `frontend/src/components/common/MGButton.js`
- `frontend/src/components/common/MGButton.css`
- `frontend/src/components/erp/common/erpMgButtonProps.js`
- `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`
- `frontend/src/components/erp/ErpCommon.css`

---

## 4. E2E 후보 라우트 (12) — 테스터 매트릭스와 동기

`/`, `/landing`, `/login`, `/login/tablet`, `/register`, `/forgot-password`, `/dashboard`, `/admin/dashboard`, `/consultant/dashboard`, `/client/dashboard`, ERP 재무·구매 등, `/consultant/schedule`, 마이페이지 계열.

자동 커버는 현재 **공개 4경로** 중심 — 나머지는 [매트릭스 §2](./BUTTON_VISIBILITY_FULL_AUDIT_TEST_MATRIX.md) 수동·향후 `storageState`.

---

## 5. 수동 스모크 10줄 (요약)

1. `/landing`·`/` — 투명↔고정 헤더, outline/primary 대비.  
2. `/login`·`/register`·태블릿 로그인 — 제출·보조 버튼 포커스.  
3. 역할별 대시보드 — GNB 알림·프로필.  
4. UnifiedModal 푸터 primary/outline.  
5. IPhone17Modal 푸터 색.  
6. ERP 필터·행 액션 클리핑.  
7. MGTable 좁은 뷰포트.  
8. B0KlA 관리 화면 hover·opacity.  
9. 로딩·disabled 겹침 시 가독성.  
10. DevTools Contrast·Layers·Overflow 표본 적용.

---

## 6. 다음 액션

| 담당 | 내용 |
|------|------|
| **core-coder** | 표 **H** 행부터 스코프 패치 배치(토큰·신규 hex 금지). |
| **core-tester** | `tests/auth/` **폴더 슬래시**로 공개 스모크만 CI에 고정; 역할별은 storageState 설계 후. |
| **기획** | 이중 위젯(`ConsultationRecordWidget`)·MGButton 수렴 에픽 백로그화. |
