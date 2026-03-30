# 환불 관리 시스템 헤더 높이 수정 결과

**작성일**: 2025-03-16  
**담당**: core-planner (분배실행)  
**관련**: 사용자 보고 — `mg-v2-content-header` 비정상적 과대(869px 등)

---

## 1. 목표

환불 관리 시스템 페이지에서 **헤더(header.mg-v2-content-header)**가 비정상적으로 크게 보이는 문제를 원인 분석 후 수정하여, 헤더가 **제목·부제·액션만 포함하는 적정 높이**(약 56~80px)로 보이도록 함.

---

## 2. 수행 단계(분배실행)

| Phase | 담당 | 내용 | 결과 |
|-------|------|------|------|
| 1 | **core-debugger** | mg-v2-content-header 사용처·ContentHeader 구조·높이 확대 원인 후보 분석 → `docs/debug/REFUND_MANAGEMENT_HEADER_HEIGHT_ANALYSIS.md` 작성 | 완료 |
| 2 | **core-planner** | 디버거 결과로 수정 체크리스트 정리 후 **core-coder** 호출 | 완료 |
| 3 | **core-coder** | DesktopLayout.css에 헤더만 flex 성장 제외 규칙 추가 | 완료 |
| 4 | **core-planner** | 본 요약 문서 작성 및 사용자 최종 보고 | 완료 |

---

## 3. 원인 요약

- **DesktopLayout** 메인 영역(`.mg-v2-desktop-layout__main`)은 “단일 자식만 둔다”는 전제로 **모든 직접 자식**에 `flex: 1 1 0%`를 적용함.
- 환불 관리 페이지는 **ContentHeader**와 **ContentArea**를 **형제**로 두어, **헤더도 본문과 같이 남는 세로 공간을 나눠 갖는** 구조였음.
- 그 결과 헤더 높이가 869px 등으로 비정상적으로 커짐.

상세 추적 경로·재현 절차·배제한 원인은 `docs/debug/REFUND_MANAGEMENT_HEADER_HEIGHT_ANALYSIS.md` 참고.

---

## 4. 수정 내용

**파일**: `frontend/src/components/dashboard-v2/templates/DesktopLayout.css`

**추가 규칙**:

```css
/* ContentHeader는 본래 크기만 사용, 세로 확장 제외(ContentHeader+ContentArea 형제 페이지 대응) */
.mg-v2-desktop-layout__main > .mg-v2-content-header {
  flex: 0 0 auto;
}
```

- **효과**: 메인의 직접 자식 중 `mg-v2-content-header`만 flex로 확장되지 않고, 본래 콘텐츠 높이만 사용.
- **기존 규칙**: `.mg-v2-desktop-layout__main > *`는 유지하여 ContentArea 등 나머지 자식은 계속 영역을 채우도록 함.

---

## 5. 수정 후 확인 체크리스트

다음 항목은 수동/QA 확인 권장.

- [ ] **환불 관리** (`/erp/refund-management`)에서 `header.mg-v2-content-header` 높이가 56~80px 수준으로 보이는지
- [ ] ContentHeader + ContentArea를 형제로 쓰는 다른 페이지(AdminApprovalDashboard, ImprovedTaxManagement, ItemManagement, TaxManagement 등)에서 헤더가 비대해지지 않는지
- [ ] 단일 자식만 두는 페이지(ErpDashboard, PsychAssessmentManagement 등)에서 ContentArea가 메인 영역을 그대로 채우는지
- [ ] 반응형(창 크기 변경) 시 스크롤·레이아웃 깨짐 없음

---

## 6. 산출물

| 문서 | 경로 | 용도 |
|------|------|------|
| 원인 분석 | `docs/debug/REFUND_MANAGEMENT_HEADER_HEIGHT_ANALYSIS.md` | 증상·추적 경로·근본 원인·재현 절차·수정 제안·core-coder 태스크 초안 |
| 수정 결과 요약 | `docs/project-management/REFUND_MANAGEMENT_HEADER_FIX_RESULT.md` | 본 문서 — 목표·단계·원인·수정 내용·체크리스트 |

---

## 7. 참조

- 디버그 스킬: `.cursor/skills/core-solution-debug/SKILL.md`
- 서브에이전트 활용: `docs/standards/SUBAGENT_USAGE.md`
- 관련 컴포넌트: RefundManagement.js, ContentHeader.js/.css, DesktopLayout.js/.css, AdminCommonLayout.js
