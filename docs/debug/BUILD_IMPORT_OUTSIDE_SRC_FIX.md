# 빌드 오류: import outside src/ 수정

**발생**: `npm run build` / `build:ci` 실패  
**에러**: `You attempted to import ../../../../constants/roles which falls outside of the project src/ directory.`

## 원인

- **파일**: `frontend/src/components/admin/molecules/SystemNotificationFormModal.js`
- **위치**: `admin/molecules/` 는 `src/components/admin/molecules/` 이므로, 상위 4단계(`../../../../`)는 `src` 밖인 `frontend/` 를 가리킴.
- **잘못된 경로**: `../../../../constants/roles`, `../../../../styles/...` → `src/` 밖 참조로 CRA 빌드 실패.

## 조치 (반영 완료)

- `SystemNotificationFormModal.js` 에서:
  - `../../../../constants/roles` → `../../../constants/roles`
  - `../../../../styles/unified-design-tokens.css` → `../../../styles/unified-design-tokens.css`
  - `../../../common/modals/UnifiedModal` → `../../common/modals/UnifiedModal` (components 쪽은 상위 2단계)
- 빌드 재실행 후 성공 확인.

## 참고

- `src` 내에서는 **상대 경로가 `src` 를 벗어나면 안 됨**. `admin/molecules/` 기준 상위 3단계(`../../../`)가 `src` 이므로, `src/constants/`, `src/styles/` 는 `../../../constants/`, `../../../styles/` 로 참조.
- `src/components/common/` 은 같은 `components` 아래이므로 `admin/molecules/` 에서는 `../../common/` 로 참조.
