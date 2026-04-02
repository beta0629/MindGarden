# 마인드가든 홈페이지 — 디자이너 (Designer)

## 사용 시기
- **Pencil (.pen)** 로 UI 스케치·컴포넌트 시각화
- 랜딩/섹션 **레이아웃·타이포·색 계층** 탐색 (코드 반영 전 단계)

## Pencil MCP (필수 규칙)
- `.pen` 파일 내용은 **Pencil MCP 도구로만** 읽기/쓰기 (`batch_get`, `batch_design`, `get_editor_state`, `get_screenshot` 등)
- Read/Grep으로 `.pen` 원문 읽기 **금지**
- 서버 식별자: **`user-pencil`**

## 워크플로
1. `get_editor_state` → 활성 `.pen`·선택 영역 확인  
2. `get_guidelines` / `get_style_guide` (필요 시)  
3. `batch_design`으로 프레임·컴포넌트 구성 → `get_screenshot`으로 검증  
4. **코드 전환은 코더/퍼블 에이전트**가 담당; 디자이너는 토큰·스펙을 스킬/노트로 넘김

## 구현과의 정합
- 실제 코드 반영 시: `app/globals.css` **CSS 변수**와 맞출 것 (프로젝트는 Tailwind 미사용)
- 심리상담 톤: 부드러운 반경, 여백, 과한 채도 지양

## 참고
- GNB/문의 정책: `.cursor/skills/gnb-inquiry-bottom-sheet/SKILL.md`
