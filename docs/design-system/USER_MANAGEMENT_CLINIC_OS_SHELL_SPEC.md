# 사용자 관리 — Clinic-OS 셸 UI 스펙 (visual chrome only)

**대상**: `/admin/user-management` · `UserManagementPage`  
**상태 목표**: 페이지 셸 ALIGNED (embed 내부 B0KlA 잔여는 별도 메모)  
**SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**트윈**: mapping-management / consultation-logs / salary TabChipRow 패턴  
**코드 작성 없음** (본 문서는 디자이너 산출물)

---

## 1. 개요

운영자(ADMIN/STAFF)가 상담사·내담자·스태프·삭제 대기 유형을 전환하며 계정을 관리하는 진입 셸.  
KPI strip은 이미 Clinic-OS(`mapping-management-summary`) — **유지**.  
셸만 B0KlA pill chrome을 제거하고 quiet-header + TabChipRow로 정렬한다.

## 2. 사용성 · 정보 노출 · 레이아웃

| 항목 | 요구 |
|------|------|
| **사용성** | 유형 전환은 상단 quiet header 바로 아래 한 줄 칩. 활성 탭만 solid primary. `?type=` 딥링크·역할 게이팅 유지. |
| **정보 노출** | ADMIN/STAFF만 내담자·삭제 대기 탭 노출. 그 외는 상담사/스태프. API·권한·저장 경로 변경 없음. UI 라벨은 「센터」(「테넌트」 금지). |
| **레이아웃** | AdminCommonLayout → ContentArea(`user-management--clinic-os`) → ContentHeader → TabChipRow → embed(기존). UserQuietHeader 신설 금지. |

## 3. 블록 구성 (위→아래)

1. **Quiet header** — 기존 `ContentHeader` 유지  
   - title: `통합 사용자 관리`  
   - subtitle: `상담사·내담자·스태프 계정을 유형별로 조회·관리합니다.`
2. **유형 전환** — `TabChipRow` (공통)  
   - active = `MGButton` variant `primary` (dusty teal solid)  
   - inactive = `outline`  
   - size: `sm` (salary/purchase 트윈)  
   - items keys: `consultant` | `client` | `staff` | `pending-deletion`  
   - testid: `tab-chip-row-${key}` (구 `user-management-tab-pending-deletion` 폐기)
3. **Main stage / embeds** — 기존 Consultant/Client/Staff/PendingDeletion 임베드 **무변경** (KPI markup 유지)

## 4. 제거 · 금지

- `AdminDashboardB0KlA.css` import
- `mg-v2-ad-b0kla` / `__container` / `__pill-toggle` / `__pill` / `__pill--active`
- Pencil/B0KlA 4px left accent
- hex / `--ad-b0kla*` in optional page CSS
- UserQuietHeader 발명
- API·tenant·account≠role·save path 변경

## 5. 클래스 · 토큰

| 요소 | 클래스 / 컴포넌트 |
|------|-------------------|
| ContentArea | `mg-v2-user-management user-management--clinic-os` |
| 선택 CSS | `UserManagementPage.css` — mapping twin: transparent/full-width/min-height only, `var(--mg-v2-*)` only |
| 탭 | `TabChipRow` + `TabChipRow.css` (페이지원오프 탭 CSS 금지) |

## 6. 완료 기준 (코더)

- [ ] B0KlA import/wrappers/pills 없음
- [ ] TabChipRow + ContentHeader + `--clinic-os`
- [ ] `UserManagementPage.clinicOsChrome.test.js` lock
- [ ] KPI lock `UserManagement.clinicOsKpiChrome.test.js` green
- [ ] inventory: 셸 ALIGNED + embed leftover note (해당 시)
