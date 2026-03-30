# SimpleLayout → AdminCommonLayout 마이그레이션 가이드

> 기존 SimpleLayout 사용 페이지를 AdminCommonLayout으로 전환하는 방법  
> @author MindGarden | @since 2025-02-22

## 배경

- **SimpleLayout**: 단순 헤더(UnifiedHeader) + 콘텐츠 구조
- **AdminCommonLayout**: GNB + LNB + 콘텐츠, 권한별 메뉴 통합
- SimpleLayout은 점진적으로 제거되고 AdminCommonLayout으로 통일

## 마이그레이션 단계

### 1. Import 변경

```diff
- import SimpleLayout from '../layout/SimpleLayout';
+ import AdminCommonLayout from '../layout/AdminCommonLayout';
+ import { DEFAULT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
```

권한별 메뉴 사용 시:

```javascript
import { CLIENT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import { CONSULTANT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import { ERP_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import { HQ_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
```

### 2. 컴포넌트 교체

```diff
- <SimpleLayout title="페이지 제목" loading={loading} loadingText="...">
+ <AdminCommonLayout
+   title="페이지 제목"
+   menuItems={DEFAULT_MENU_ITEMS}
+   loading={loading}
+   loadingText="..."
+ >
    {children}
- </SimpleLayout>
+ </AdminCommonLayout>
```

### 3. 권한별 menuItems 매핑

| 페이지/역할 | menuItems |
|-------------|-----------|
| Admin 관련 | DEFAULT_MENU_ITEMS |
| Client 관련 | CLIENT_MENU_ITEMS |
| Consultant 관련 | CONSULTANT_MENU_ITEMS |
| ERP 관련 | ERP_MENU_ITEMS |
| HQ(본사) 관련 | HQ_MENU_ITEMS |

### 4. 상대 경로 확인

`AdminCommonLayout`과 `menuItems` import 경로는 페이지 위치에 맞게 조정:

- `components/admin/` → `../layout/AdminCommonLayout`, `../dashboard-v2/constants/menuItems`
- `components/client/` → `../layout/AdminCommonLayout`, `../dashboard-v2/constants/menuItems`
- `pages/client/` → `../../components/layout/AdminCommonLayout`, `../../components/dashboard-v2/constants/menuItems`

## 유지 페이지 (SimpleLayout 그대로 사용)

- **인증**: ResetPassword, HeadquartersLogin, BranchSpecificLogin, TenantSelection
- **랜딩/결제**: Homepage, BillingCallback
- **테스트**: test/*

## 완료된 마이그레이션 (2025-02 기준)

- Admin: 매칭 관리, 스케줄 관리, 회기 관리, 내담자 종합관리, 사용자 관리 등
- Client: 대시보드, 스케줄, 회기 관리, 결제 내역, 설정, 메시지
- Consultant: 스케줄, 상담 기록, 메시지, 가능 시간, 내담자 목록
- ERP: 구매, 재무, 예산, 세무, 대시보드, 승인, 환불, 급여
- HQ: 지점 관리, 재무 보고서, 지점별 재무, 통합 재무
- 기타: Compliance, Ops, Academy, Tenant, Wellness, Notifications
