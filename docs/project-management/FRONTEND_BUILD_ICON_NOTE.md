# 프론트 빌드·아이콘 사용 기획 메모

**목적**: lucide-react 미export 아이콘으로 인한 빌드 오류 재발 방지를 기획·체크리스트에 반영한 메모.

**참조**: [docs/debug/BUILD_LAYOUTGRID2_IMPORT_FIX.md](../debug/BUILD_LAYOUTGRID2_IMPORT_FIX.md)

---

## 정리 내용

- **원인**: `LayoutGrid2` 등 lucide-react에서 export되지 않는 이름으로 import 시 빌드 오류 발생.
- **재발 방지**: 신규 아이콘 사용 시 **lucide export 확인**을 체크리스트에 포함.
- **반영 위치**:
  - **프론트엔드 개발 표준** (`docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md`): 기술 스택·아이콘 항목에 “신규 아이콘 사용 시 lucide export 확인” 한 줄 추가.
  - 배포/빌드 전 체크 시 프론트 빌드 통과 여부와 함께, 외부 아이콘(lucide 등) 사용 시 export 명칭 확인을 권장.

---

*코드 수정 없음. 기획·문서 보완만 수행.*
