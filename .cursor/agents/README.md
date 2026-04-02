# 마인드가든 홈페이지 — 서브에이전트 가이드

Cursor에서 **에이전트/커스텀 모드**로 역할을 나눌 때 사용하는 정의입니다. 각 에이전트는 대응하는 **스킬**을 먼저 읽고 동작합니다.

## 오케스트레이터 (메타)

| 서브에이전트 | 파일 | 스킬 |
|-------------|------|------|
| **0. 오케스트레이션** | `orchestrator.md` | `skills/homepage-orchestrator/SKILL.md` + `gnb-inquiry-bottom-sheet`(정책 확인 시) |

**역할**: 다음에 어떤 에이전트를 쓸지, 핸드오프 프롬프트 초안, 워크플로 정리. 구현·배포는 직접 하지 않음. **산출물의 기본 수신자는 기획** — 기획이 디자인·퍼블·코더로 다시 위임한다.

**위임 문구**: 사용자가 「오케스트레이션에 위임」이라고 하면, **어느 채팅이든** 먼저 코드를 고치지 말고 `.cursor/skills/homepage-orchestrator/SKILL.md` 출력 형식으로만 답한다 (`.cursorrules` 동일 규칙).

## 역할 요약 (실행)

| 서브에이전트 | 파일 | 스킬 |
|-------------|------|------|
| **1. 기획** | `planning.md` | `skills/homepage-planning/SKILL.md` + `gnb-inquiry-bottom-sheet` |
| **2. 퍼블리셔** | `publisher.md` | `skills/homepage-publisher/SKILL.md` + `gnb-inquiry-bottom-sheet` |
| **3. 코더** | `coder.md` | `skills/homepage-coder/SKILL.md` + `gnb-inquiry-bottom-sheet` |
| **4. 디버거** | `debugger.md` | `skills/homepage-debugger/SKILL.md` + 배포 스킬(필요 시) |
| **5. 디자이너** | `designer.md` | `skills/homepage-designer/SKILL.md` + `gnb-inquiry-bottom-sheet` |
| **6. 배포·운영** | `deploy-ops.md` | `skills/homepage-deploy-ops/SKILL.md` + `deploy-and-servers` + `verify-changes` |

## 공통 스킬 (정책)

- **GNB·문의·바텀시트**: `skills/gnb-inquiry-bottom-sheet/SKILL.md`

## 권장 워크플로

1. **오케스트레이터** → 단계 요약·**기획용 핸드오프 프롬프트**·선택 과제 (구현 역할로 직접 넘기지 않음)  
2. **기획** → 오케스트 산출물 수령·보강 → 범위·AC 확정 → **디자이너·퍼블·코더용 핸드오프를 각각 작성**  
3. **디자이너** → Pencil로 시각 확정 (기획이 필요 시 위임)  
4. **퍼블리셔** / **코더** → 마크업·로직 (기획이 순서·병행 지정, 경계는 각 스킬 참고)  
5. **디버거** → 이슈 시 투입  
6. **배포·운영** → 푸시·SSH·검증  

## 기존 에이전트

- `verify-changes.md` — UI 검증·배포 연계 전용 (배포·운영과 함께 사용 가능)

## 스킬 위치

전체: `.cursor/skills/`  
홈페이지 전용: `homepage-*` 접두 스킬 **7종** (orchestrator 포함).
