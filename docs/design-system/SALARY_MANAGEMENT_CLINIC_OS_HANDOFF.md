# 급여 관리 Clinic-OS UI/UX 스펙 (Design Handoff)

**대상**: `/erp/salary` (`SalaryManagement`)  
**비주얼 SSOT**: `docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`  
**트윈**: `/erp/purchase` (`PurchaseQuietHeader` / `PurchaseSummaryStrip` / `__stage`)  
**범위**: Frontend chrome / layout / CSS / class cleanup only. 급여 계산·원천세·지급·저장·API **변경 금지**.

---

## 레이아웃

```
AdminCommonLayout title="급여 관리"
└─ ContentArea
   └─ ErpPageShell (.salary-management-shell.salary-management--clinic-os)
      ├─ headerSlot: SalaryQuietHeader (h1 + ghost CTAs; NO ContentHeader)
      └─ children:
         └─ .salary-management
            ├─ SalarySummaryStrip (등록 프로필 / 계산 완료 / 지급 총액·expense blue)
            ├─ .salary-management__tabs-wrap + TabChipRow
            └─ .salary-management__stage (min-height 36rem, neutral-300/50)
               ├─ filter bar (ErpFilterToolbar)
               └─ tab panels (profiles | calculations | tax)
```

## 금지 / 게이트

- `AdminDashboardB0KlA.css` import, 페이지 `mg-v2-ad-b0kla*` 클래스
- 왼쪽 4px accent (`border-left: none !important` 유지)
- Hex soft-gate: ADMIN_LNB §17, SETTINGS §1.3 — 신규 CSS는 `--mg-v2-*`만

## 의도적 잔여 (P1)

- `SalaryConfigModal` / `SalaryProfileFormModal` / `TaxDetailsModal` / `SalaryExportModal` / `ConsultantProfileModal` 등 모달 내부 B0KlA·레거시 스킨 → financial/salary 모달 큐 (P1 #10)
- 상담사 피커 `UnifiedModal`은 페이지에서 B0KlA className 제거(크롬 클린)

## Lock test

- `frontend/src/components/erp/__tests__/SalaryManagement.clinicOsChrome.test.js`

## .dev 검증

1. `/erp/salary` — quiet header「급여 관리」, ghost「기산일/급여 설정」·「목록 새로고침」
2. 3-cell summary strip; 지급 총액 semantic-info(blue)
3. stage 안 filter + tabs 패널 동작 유지(계산·승인·세금 로직 동일)
