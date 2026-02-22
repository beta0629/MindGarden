# 권한별 메뉴 상수 (Menu Items)

> LNB 좌측 메뉴 구성 정의  
> @author MindGarden | @since 2025-02-22

## 파일 위치

```
frontend/src/components/dashboard-v2/constants/menuItems.js
```

## Export 목록

| 상수명 | 용도 |
|--------|------|
| `BREAKPOINT_DESKTOP` | 768 (px), 데스크톱/모바일 분기 기준 |
| `DEFAULT_MENU_ITEMS` | 관리자 기본 메뉴 |
| `CLIENT_MENU_ITEMS` | 내담자 메뉴 |
| `CONSULTANT_MENU_ITEMS` | 상담사 메뉴 |
| `ERP_MENU_ITEMS` | ERP 메뉴 |
| `HQ_MENU_ITEMS` | 본사 관리 메뉴 |

## 메뉴 아이템 구조

```javascript
{
  to: string,      // 라우트 경로
  icon: Component, // lucide-react 아이콘
  label: string,   // 표시 라벨
  end: boolean     // React Router end
}
```

## 상수별 상세

### DEFAULT_MENU_ITEMS (Admin)

- `/admin/dashboard-v2` – 대시보드
- `/admin/mapping-management` – 매칭 관리
- `/admin/dashboard-v2/settings` – 설정
- `/admin/dashboard-v2/users` – 사용자
- `/admin/dashboard-v2/reports` – 보고서

### CLIENT_MENU_ITEMS

- `/client/dashboard` – 대시보드
- `/client/schedule` – 스케줄
- `/client/session-management` – 회기 관리
- `/client/payment-history` – 결제 내역
- `/client/settings` – 설정

### CONSULTANT_MENU_ITEMS

- `/consultant/dashboard` – 대시보드
- `/consultant/schedule` – 스케줄
- `/consultant/consultation-records` – 상담 기록
- `/consultant/availability` – 가능 시간
- `/consultant/messages` – 메시지

### ERP_MENU_ITEMS

- `/erp/dashboard` – ERP 대시보드
- `/erp/purchase` – 구매 관리
- `/erp/financial` – 재무 관리
- `/erp/budget` – 예산 관리
- `/erp/tax` – 세무 관리

### HQ_MENU_ITEMS

- `/hq/dashboard` – 대시보드
- `/hq/branch-management` – 지점 관리
- `/hq/erp/branch-financial` – 지점별 재무
- `/hq/erp/consolidated` – 통합 재무
- `/hq/erp/reports` – 재무 보고서

## 사용 예시

```javascript
import {
  DEFAULT_MENU_ITEMS,
  CLIENT_MENU_ITEMS,
  CONSULTANT_MENU_ITEMS,
  ERP_MENU_ITEMS,
  HQ_MENU_ITEMS
} from '../dashboard-v2/constants/menuItems';

<AdminCommonLayout title="회기 관리" menuItems={CLIENT_MENU_ITEMS}>
  ...
</AdminCommonLayout>
```

## 메뉴 추가 시

1. `menuItems.js`에 새 항목 추가
2. `to`는 `App.js` 라우트와 일치
3. `icon`은 `lucide-react`에서 import
4. `label`은 화면에 노출되는 한글 텍스트
