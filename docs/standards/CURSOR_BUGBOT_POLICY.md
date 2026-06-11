# Cursor Bugbot 사용 정책

> **목적**: PR 머지 전 코드 결함을 자동 리뷰로 잡되, **무료 한도 내** 수동 호출만 사용한다 (Zero-Cost AI 모니터링 Phase 1).
>
> - 출처: `docs/project-management/2026-06-11/AI_MONITORING_ROADMAP.md` §6 Phase 1 — P1-4
> - 표준화 로드맵 G 카테고리: `docs/project-management/2026-06-11/STANDARDIZATION_ROADMAP.md`
> - 함께 보기: `docs/standards/CODE_STYLE_STANDARD.md`, `docs/standards/BACKEND_CODING_STANDARD.md`, `docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md`

---

## 1. 사용 시점

- **모든 PR 머지 전**, 사용자(또는 코더 워커)가 **수동으로** Bugbot 자동 리뷰를 호출한다.
- 호출 도구는 다음 중 하나:
  - Cursor IDE 의 **Bugbot 메뉴** / 슬래시 커맨드
  - Cursor 서브에이전트 `subagent_type=bugbot`
  - 저장소 스킬 `/Users/mind/.cursor/skills-cursor/review-bugbot/SKILL.md`
- 본 PR 의 sequential 머지 워커가 머지 직전에 호출하는 워크플로도 허용 (수동 1회 한정).

> **금지**: CI 매 단계에서 Bugbot 자동 호출 (PR open · push · workflow 매 step). 무료 한도 초과 위험 + 노이즈 PR 코멘트 폭증.

---

## 2. 호출 명령

### 2.1 메인 어시스턴트에서 호출

자연어로 "Bugbot 리뷰" 또는 "리뷰 부탁" 요청 → 메인은 다음 형태로 위임:

```
subagent_type: bugbot
description: Bugbot
prompt:
  Full Repository Path: /Users/mind/mindGarden 또는 워크트리 경로
  Diff: branch changes
  Custom Instructions: (선택, 사용자가 별도 지시한 경우만)
```

### 2.2 워크트리에서 직접 호출 (코더 워커)

```
Task(
  subagent_type="bugbot",
  description="Bugbot",
  prompt="""
    Full Repository Path: /Users/mind/mindGarden-<feature-name>
    Diff: branch changes
  """,
  readonly=true,
  run_in_background=false
)
```

`Diff` 값은 두 가지 중 하나만 사용한다:

- `branch changes` — 현재 브랜치의 develop/main 대비 모든 커밋 (기본 권장)
- `uncommitted changes` — 워킹 트리의 staged/unstaged 변경만

---

## 3. 적용 영역 (반드시 호출)

다음 PR 은 머지 전 Bugbot 리뷰를 **건너뛸 수 없다**:

- **백엔드 Java 코드 변경** (`src/main/java/com/coresolution/**`)
  - Service / ServiceImpl / Repository / Controller 신규·수정
  - `entity/` ·`dto/` 변경 (DB 마이그레이션 동반 시 특히 강제)
- **프론트엔드** (`frontend/src/**`, `expo-app/**`)
  - 인증·결제·민감 정보 화면 수정
  - `StandardizedApi`·`AuthService` 직접 변경
- **보안 민감 영역** (자동 차단 — 머지 차단까지)
  - `Auth`, `OAuth*`, `OTP`, `AppleSignIn*`, `JwtService`, `XssFilter`, `SecurityConfig`
  - `service/AuditLog*`, `controller/AuditLog*`
  - `migration/V*__.sql` (Flyway 마이그레이션)
- **배포·CI/CD 워크플로** (`.github/workflows/**`, `scripts/automation/deployment/**`)

> 적용 영역에 해당하는 PR 은 **PR 본문 체크리스트** 에 `Bugbot 리뷰 결과 첨부` 항목을 넣고, PR 코멘트로 결과를 첨부한다.

---

## 4. 결과 처리

### 4.1 PR 코멘트 첨부

Bugbot 리뷰가 끝나면 핵심 발견 항목을 PR 코멘트로 첨부한다. 형식:

```
## 🤖 Bugbot 리뷰 결과 (요약)

- 모델: <Bugbot 사용 모델>
- Diff 범위: branch changes
- 발견: P0 0건 · P1 2건 · P2 5건 · P3 3건

### P1 (머지 차단 사유)
1. <파일:라인> — <짧은 요약>
2. ...

### P2/P3 (사용자 결정)
- <간단 목록>

전체 리뷰: <링크 또는 본문 펼침>
```

### 4.2 우선순위별 처리

| 등급 | 정의 | 조치 |
| --- | --- | --- |
| **P0** | 보안 취약점·데이터 손상·운영 장애 직결 | **머지 차단** + 즉시 `core-coder` 위임 |
| **P1** | 기능 결함·회귀 위험·표준 위반 | **머지 차단** + `core-coder` 위임 (사용자 승인 시 별도 PR 분리) |
| **P2** | 가독성·중복·성능 (즉시 영향 없음) | **사용자 결정** (병합 후 후속 정리 PR 또는 본 PR 에 포함) |
| **P3** | 코멘트·네이밍·취향성 권고 | **사용자 결정** (대부분 무시 가능) |

### 4.3 코드 수정은 코더 위임

Bugbot 발견을 받아도 **메인 어시스턴트는 코드를 직접 수정하지 않는다**. 본 저장소 규칙 (`.cursor/rules/mindgarden-subagents.mdc`) 에 따라 `core-coder` 서브에이전트에 다음을 명시해 위임:

- 수정 대상 파일·라인
- Bugbot 의 P0/P1 본문
- 관련 표준 문서 경로 (예: `docs/standards/BACKEND_CODING_STANDARD.md`)
- 검증 방법 (테스트 명령, 통과 기준)

수정 후 **반드시 동일 워크트리에서 Bugbot 1회 재호출**해 P0/P1 이 잡혔는지 확인한다.

---

## 5. 무료 사용 정책

- **카드 등록 없는 무료 한도** 내에서만 사용한다.
- 한도 초과 임박 시:
  1. 현재 진행 중인 PR 머지가 끝날 때까지 사용을 일시 중단
  2. 사용자에게 한도 초과 여부 + 유료 전환 의사 확인
  3. 유료 결정 전까지 **수동 호출도 일시 중단** (CI fallback: `code-quality-check.yml` + `notify-discord-on-failure` 가 최소 게이트 역할)
- 한도 초과 직접 확인 방법: Cursor 설정 → Bugbot 사용량 / 결제 페이지

---

## 6. 본 정책의 변경

- 본 문서를 변경할 때는 **반드시** PR 로 진행하고, `core-coder` 가 아니라 **사용자 결정** 으로 머지한다 (정책 자체의 변경이므로).
- AI 모니터링 로드맵 (`AI_MONITORING_ROADMAP.md`) Phase 2 / 3 에서 본 정책 확장 시 본 문서 §1·§3·§5 동시 갱신.

---

## 7. 체크리스트 (PR 머지 전)

- [ ] §3 적용 영역 해당 여부 확인
- [ ] (해당 시) Bugbot 수동 호출 완료
- [ ] PR 코멘트에 §4.1 형식으로 결과 첨부
- [ ] P0/P1 발견 시 `core-coder` 위임 → 수정 → Bugbot 재호출
- [ ] 무료 한도 초과 여부 확인 (한도 임박 시 §5 절차)
