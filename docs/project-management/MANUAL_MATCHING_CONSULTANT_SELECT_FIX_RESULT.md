# 매뉴얼 매칭 큐 — 상담사 선택 드롭다운 수정 결과

## 요약

- **증상**: "상담사 선택" 트리거는 보이지만 클릭 시 옵션 목록이 표시되지 않음.
- **원인**: `CustomSelect`가 드롭다운을 `document.body`에 포탈 렌더하는데, CSS는 `.custom-select.open .custom-select__dropdown`로만 표시를 제어해, 포탈된 노드(부모 `.custom-select` 없음)에는 해당 스타일이 적용되지 않아 항상 `opacity: 0`, `pointer-events: none` 상태로 남음.
- **조치**: 포탈된 드롭다운 노드에 `isOpen`일 때 `custom-select__dropdown--open` 클래스를 부여하고, 해당 클래스에 `opacity: 1`, `pointer-events: auto`를 적용하도록 수정.

## 참조 문서

- **원인 분석**: `docs/debug/MANUAL_MATCHING_CONSULTANT_SELECT_ANALYSIS.md`

## 수정 내역

| 파일 | 변경 내용 |
|------|-----------|
| `frontend/src/components/common/CustomSelect.js` | 포탈된 `div`에 `className={\`custom-select__dropdown ${isOpen ? 'custom-select__dropdown--open' : ''}\`}` 적용 |
| `frontend/src/components/common/CustomSelect.css` | `.custom-select__dropdown--open` 규칙 추가 (`opacity: 1`, `pointer-events: auto`) |

## 검증 체크리스트

- [ ] 매뉴얼 매칭 큐에서 "상담사 선택" 클릭 시 옵션 목록이 노출되는지
- [ ] 옵션 클릭 시 선택·닫힘·배정 플로우가 정상인지
- [ ] 다른 화면에서 동일 `CustomSelect` 사용 시 기존 동작이 깨지지 않는지

## 담당

- **분석**: core-debugger  
- **수정**: core-coder  
- **기획/분배**: core-planner  
