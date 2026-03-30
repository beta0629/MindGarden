# 환불 관리 시스템 헤더 높이 비정상(869px) 원인 분석

**작성일**: 2025-03-16  
**담당**: core-debugger  
**목적**: `header.mg-v2-content-header`가 비정상적으로 크게 보이는 원인 분석 및 수정 제안(코드 수정 없음, 기획 보고용)

---

## 1. 증상 요약

| 항목 | 내용 |
|------|------|
| **대상** | 환불 관리 시스템 페이지 (`/erp/refund-management`) |
| **DOM** | `header.mg-v2-content-header` |
| **표시 내용** | "환불 관리 시스템", "상담 환불 현황 및 환불·결제 연동", "운영 현황으로 돌아가기" 버튼 |
| **문제** | 헤더 영역 높이가 지나치게 큼(예: 869px) |
| **기대** | 헤더는 제목·부제목·액션만 담는 1줄~2줄 수준(약 56~80px 수준) |

---

## 2. 추적 경로

### 2.1 컴포넌트 계층

```
RefundManagement.js
  └─ AdminCommonLayout (title="환불 관리")
        └─ DesktopLayout (children = content)
              └─ .mg-v2-desktop-layout__main  ← 여기 안에 아래 두 개가 직접 자식
                    ├─ ContentHeader (mg-v2-content-header)  ← 첫 번째 자식
                    └─ ContentArea (mg-v2-content-area)      ← 두 번째 자식
                          └─ RefundKpiBlock, RefundFilterBlock, RefundHistoryTableBlock, ...
```

### 2.2 RefundManagement에서의 렌더 구조

- **RefundManagement.js** (169~226행): `AdminCommonLayout` 안에 **ContentHeader**와 **ContentArea**를 **형제(sibling)**로 배치.
- **ContentHeader**: `title`, `subtitle`, `actions`만 전달. children/className 오버라이드 없음.
- **ContentArea**: `className="mg-v2-ad-b0kla refund-management__main"`, 내부에 KPI·필터·테이블 등 블록만 포함. 본문이 헤더 안에 들어가 있지 않음.

### 2.3 레이아웃 CSS 경로

- **DesktopLayout.css**
  - `.mg-v2-desktop-layout__main`: `display: flex; flex-direction: column; flex: 1; min-height: 0;`
  - **`.mg-v2-desktop-layout__main > *`**: `flex: 1 1 0%; min-height: 0;` ← **모든 직접 자식**에 적용
- **ContentHeader.css**
  - `.mg-v2-content-header`: `display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: …`
  - **height / min-height 지정 없음** → 높이는 부모 flex 레이아웃에 의해 결정됨

---

## 3. 근본 원인(가설)

### 3.1 결론

**`.mg-v2-desktop-layout__main > *`에 적용된 `flex: 1 1 0%`가 ContentHeader에도 동일하게 적용되어, 헤더가 “남는 세로 공간”을 나눠 갖으면서 커진 것**이 근본 원인으로 판단됩니다.

### 3.2 상세

- `mg-v2-desktop-layout__main`은 **flex column**이며, 주석상 “단일 자식(로딩 또는 콘텐츠)이 영역을 채우도록” **단일 자식**을 전제로 한 규칙입니다.
- 환불 관리 페이지는 **자식이 두 개**입니다.
  - 1번째: `ContentHeader` (헤더)
  - 2번째: `ContentArea` (본문)
- 두 자식 모두 `flex: 1 1 0%`를 받아, **동일한 flex-grow**로 남는 높이를 나눠 가짐.
- 그 결과 헤더도 본문과 비슷한 비율로 세로 공간을 차지하게 되고, 뷰포트가 클수록(예: 869px 등) 헤더 높이도 함께 커짐.

### 3.3 다른 페이지와의 차이

- **ContentHeader를 ContentArea 안에 넣는 페이지**(예: ErpDashboard, PsychAssessmentManagement, CommonCodeManagement 등)는 `__main`의 **직접 자식이 ContentArea 하나**뿐이므로, `flex: 1 1 0%`가 ContentArea에만 적용되어 헤더가 커지는 현상이 없음.
- **ContentHeader와 ContentArea를 형제로 두는 페이지**(RefundManagement, AdminApprovalDashboard, ImprovedTaxManagement, ItemManagement, TaxManagement 등)는 동일한 레이아웃 규칙의 영향을 받아, **동일한 헤더 비대 현상**이 발생할 수 있음.

### 3.4 배제한 원인

- **헤더 내부에 KPI·테이블 등이 잘못 포함됨**: JSX상 ContentHeader와 ContentArea는 형제이며, 본문 블록은 모두 ContentArea 안에 있음. 제외.
- **ContentHeader.css의 min-height/height**: 해당 클래스에 height/min-height 설정 없음. 제외.
- **RefundManagement.css의 header 관련 규칙**: `.mg-v2-content-header`에 대한 높이/확대 규칙 없음. 제외.

---

## 4. 재현 절차

1. 관리자 권한으로 로그인 후 **환불 관리** 메뉴로 이동 (`/erp/refund-management`).
2. 브라우저 개발자 도구로 `header.mg-v2-content-header` 요소 선택.
3. **Computed** 또는 **Elements** 탭에서 해당 헤더의 **높이(height)** 확인.
4. (선택) 뷰포트 높이를 크게 한 뒤 새로고침하여, 헤더 높이가 viewport/2에 가깝게 늘어나는지 확인.

---

## 5. 수정 제안(core-coder 위임용)

코드 수정은 하지 않고, **수정 방향만** 제안합니다. 실제 적용은 **core-coder** 서브에이전트에 위임하세요.

### 5.1 권장: 헤더는 flex 성장 제외

- **파일**: `frontend/src/components/dashboard-v2/templates/DesktopLayout.css`
- **대상**: `.mg-v2-desktop-layout__main > *` 규칙으로 인해 `mg-v2-content-header`까지 확장되는 부분
- **변경 방향**  
  - **옵션 A**: 헤더만 성장하지 않도록 예외 처리  
    - `.mg-v2-desktop-layout__main > .mg-v2-content-header { flex: 0 0 auto; }` 추가  
    - 기존 `.mg-v2-desktop-layout__main > *`는 유지(ContentArea 등 나머지 자식은 계속 `flex: 1 1 0%` 유지).  
  - **옵션 B**: “콘텐츠 영역”만 성장하도록 선택자 조정  
    - `.mg-v2-desktop-layout__main > *`를 `.mg-v2-desktop-layout__main > .mg-v2-content-area` 등으로 한정하고,  
    - `.mg-v2-desktop-layout__main > .mg-v2-content-header { flex: 0 0 auto; }`를 명시해 헤더는 콘텐츠로 간주하지 않도록 처리.

### 5.2 선택: 스펙 상 헤더 높이 고정

- **파일**: `frontend/src/components/dashboard-v2/content/ContentHeader.css`
- **변경 방향**: 스펙(예: 56~64px)을 만족시키고 싶다면 `.mg-v2-content-header`에 `min-height`, `max-height` 또는 고정 `height`를 두는 방법이 있음.  
  - 다만 **근본 원인은 main의 flex 배분**이므로, **5.1 적용을 우선**하고, 필요 시 보완으로 사용 권장.

### 5.3 체크리스트(수정 후 확인)

- [ ] 환불 관리 페이지(`/erp/refund-management`)에서 `header.mg-v2-content-header` 높이가 56~80px 수준으로 줄어드는지 확인
- [ ] 동일 레이아웃 패턴(ContentHeader + ContentArea 형제)을 쓰는 다른 페이지(AdminApprovalDashboard, ImprovedTaxManagement, ItemManagement, TaxManagement 등)에서 헤더가 비대해지지 않는지 확인
- [ ] 단일 자식만 두는 페이지(ErpDashboard, PsychAssessmentManagement 등)에서 기존처럼 ContentArea가 메인 영역을 채우는지 확인
- [ ] 반응형(축소/확대)에서 스크롤·레이아웃 깨짐 없음 확인

---

## 6. core-coder용 태스크 설명 초안

> **목표**: 환불 관리 시스템 페이지에서 `header.mg-v2-content-header`가 비정상적으로 커지는 현상 수정.  
> **원인**: `DesktopLayout.css`의 `.mg-v2-desktop-layout__main > * { flex: 1 1 0%; }`가 ContentHeader에도 적용되어, 헤더가 메인 영역의 남는 세로 공간을 나눠 갖고 있음.  
> **요청 사항**:  
> 1. `frontend/src/components/dashboard-v2/templates/DesktopLayout.css`에서 `.mg-v2-desktop-layout__main > .mg-v2-content-header`에 `flex: 0 0 auto;`를 추가하여 헤더가 세로로 확장되지 않도록 처리.  
> 2. 위 체크리스트 항목으로 회귀 확인 후, 필요 시 ContentHeader.css에서 min/max height 보완 검토.

---

## 7. 참조

- **디버그 스킬**: `.cursor/skills/core-solution-debug/SKILL.md`
- **관련 컴포넌트**:  
  - `frontend/src/components/erp/RefundManagement.js`  
  - `frontend/src/components/dashboard-v2/content/ContentHeader.js`, `ContentHeader.css`  
  - `frontend/src/components/dashboard-v2/templates/DesktopLayout.js`, `DesktopLayout.css`  
  - `frontend/src/components/layout/AdminCommonLayout.js`
- **레이아웃 스펙**: `docs/design-system/UNIFIED_LAYOUT_SPEC.md` (ContentHeader 높이 56~64px 등)
