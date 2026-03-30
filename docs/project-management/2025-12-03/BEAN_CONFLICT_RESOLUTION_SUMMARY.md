# Bean 충돌 문제 해결 완료

**작성일:** 2025-12-03  
**문제:** 표준화 작업 후 Bean 충돌  
**상태:** 해결 완료

---

## 문제 원인

표준화 작업 중 **레거시 코드와 표준화 코드가 공존**하면서 같은 Bean 이름을 사용하여 충돌이 발생했습니다.

### 충돌 항목

1. **MenuController** (2개)
   - 레거시: `consultation.controller.MenuController`
   - 표준화: `core.controller.MenuController`

2. **MenuServiceImpl** (2개)
   - 레거시: `consultation.service.impl.MenuServiceImpl`
   - 표준화: `core.service.impl.MenuServiceImpl`

---

## 해결 방법

### 클래스 이름 변경으로 Bean 충돌 방지

#### 1. MenuController
- ✅ `consultation.controller.MenuController` → `ConsultationMenuController`

#### 2. MenuServiceImpl
- ✅ `consultation.service.impl.MenuServiceImpl` → `ConsultationMenuServiceImpl`

### Bean 이름 명시 (추가 보호)

- ✅ `core.service.impl.MenuServiceImpl` → Bean 이름: `coreMenuService`
- ✅ `ConsultationMenuServiceImpl` → Bean 이름: `consultationMenuServiceImpl` (자동)

---

## 변경 사항 요약

| 항목 | 변경 전 | 변경 후 | 위치 |
|------|---------|---------|------|
| Controller | `MenuController` | `ConsultationMenuController` | `consultation.controller` |
| Service | `MenuServiceImpl` | `ConsultationMenuServiceImpl` | `consultation.service.impl` |

---

## API 경로 유지

### 레거시 API (변경 없음)
- `/api/v1/menu/structure`
- `/api/v1/menu/permissions`
- `/api/v1/menu/common`
- `/api/v1/menu/by-role`
- `/api/v1/menu/check-permission`

### 표준화 API
- `/api/v1/menus/user`
- `/api/v1/menus/admin`
- `/api/v1/menus/all`

---

## 다음 단계

1. ✅ Bean 충돌 해결 완료
2. 🔄 서버 재시작 필요
3. 📝 테스트 진행

서버를 다시 시작하면 정상 작동할 것입니다.

