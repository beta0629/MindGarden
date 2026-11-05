# 운영 반영 묶음 홀드 — 2026-09-12 15:00 KST

**문서 유형**: 문서/홀드 (운영 배포 실행 아님)  
**조사 시각**: 2026-09-12 11:11 KST (UTC 02:11)  
**홀드 해제**: 2026-09-12 **15:00 Asia/Seoul** (UTC 06:00) 이후  
**상태**: 15:00 이전 — `main` 머지·운영 워크플로 **미실행 확인**

> 본 문서는 시안/런타임 코드를 넣지 않는다. 15:00 이전 이 PR을 머지해도 운영 서버는 바뀌지 않는다.

---

## 1. 홀드 정책 (확정)

| 구간 | 허용 | 금지 |
|------|------|------|
| **15:00 KST 이전** | `develop` 푸시. 개발 백엔드/프론트 자동 배치 (`deploy-backend-dev.yml`, `deploy-frontend-dev.yml`) | `main` 머지. `deploy-production.yml` 실행. 코어솔루션 운영 배포. `deploy-frontend-prod.yml` 수동 실행 |
| **15:00 KST 이후** | 테스터 PASS된 **회기(백엔드+필요 시 프론트)** PR만 **한 번에** `main` 머지 → 운영 코어(+프론트 자동/필요 시 확인) | 문서만·시안만 PR을 운영 묶음에 넣기. 회기 외 오픈 PR을 같은 묶음에 섞기 |

근거: 사용자 지시(운영은 오늘 15시 이후 일괄). 개발은 계속.

**주의 (워크플로 파일 사실)**: `.github/workflows/deploy-production.yml` 의 `on.push.branches: [main]` + `paths`에 `src/main/java/com/coresolution/consultation/**` 가 있다. leftover(#977)를 `main`에 머지하면 **푸시가 운영 코어 배포를 자동 기동**한다. 15:00 이전 머지는 곧 운영 배포다. `core-deployer.md`의 「push 자동 비활성화」 문구와 **파일이 불일치**하며, **파일 `on:` 이 우선**이다.

---

## 2. 인벤토리 (사실만, 2026-09-12 11:11 KST)

| 항목 | 식별 | develop | main | 운영 서버 배포 | 오늘 15:00 묶음 |
|------|------|---------|------|----------------|-----------------|
| leftover CANCELLED 복구 | PR **#977** draft · `cursor/session-succession-remaining-list-5920` (`69ed3409f`). develop 동일 패치 `2009ec0a7` (leftover 파일 diff 0). `ScheduleCancelLinkedMappingReopen.java` 는 develop에만 존재 | 반영됨. BE 배포 **success** [34666232369](https://github.com/beta0629/MindGarden/actions/runs/34666232369). FE 배포 **success** [34666232539](https://github.com/beta0629/MindGarden/actions/runs/34666232539) | **미머지** (OPEN draft). CI: 단위·통합 **IN_PROGRESS**. core-tester PASS 기록 없음 | 미배포 (`deploy-production` 오늘 런 0건) | **포함 후보**. 15:00 이후 **테스터 PASS + draft 해제** 후 한 번에 머지 |
| occupying COMPLETE rem 소진 | 에이전트 `bc-0f499d9b-f28c-5cef-8d4b-9e4f32334cd0` RUNNING. origin에 `cursor/succession-occupying-complete-exhaust-5920` **없음**. PR **없음**. diff/PR 메타 없음 | 미반영(브랜치·PR 없음) | 없음 | 없음 | **후보**. PR 생성 + **테스터 PASS 후에만** 같은 묶음 |
| Clinic-OS 앱 메뉴 시안 | PR **#975** draft · 파일 1개 `docs/design-system/clinic-os-app-menu-visibility-spec.md` | 해당 PR은 base `main` | 미머지 | 해당 없음 | **제외** (시안만) |
| debug-root-cause-first 스킬 | PR **#976** draft · `.cursor/skills` 3파일만 | 해당 PR은 base `main` | 미머지 | 해당 없음 | **제외** (문서/스킬만) |
| 스케줄 사이드바 `--draggable` | `773bf6b92` `fix(schedule): 사이드바 드래그를 fc-event에서 --draggable로 분리` | 동일 메시지 `9da1e9079` (다른 SHA) | **이미 있음** | BE **success** [34584738222](https://github.com/beta0629/MindGarden/actions/runs/34584738222) · FE **success** [34584738388](https://github.com/beta0629/MindGarden/actions/runs/34584738388) (2026-09-11 09:32 UTC, push) | **이미 반영** — 재배포 대상 아님 |
| ACTIVE rem>0 취소 보호 · 사이드바 검색 | main `495063340`, `b3af7b324` (773bf6b 스택 이전 커밋) | 동일 메시지 커밋 존재 | 이미 있음 | 773bf6b 운영 배포에 포함됨 | **이미 반영** |
| iOS TestFlight / EAS | PR **#974** MERGED → `main` `721013cbf`. 워크플로 `eas-ios-submit.yml` 은 `workflow_dispatch` only. 런 [34659144573](https://github.com/beta0629/MindGarden/actions/runs/34659144573), [34659131775](https://github.com/beta0629/MindGarden/actions/runs/34659131775) **failure** | 앱스토어 경로 | 워크플로 파일은 main에 있음 | **운영 서버 배포 아님** | **별도 행**. 15:00 서버 묶음과 무관 |
| 스케줄 CSS hex 제거 | PR **#943** (develop) · **#944** (main) OPEN. CSS만 | #943 미머지 | #944 미머지 | 미배포 | **제외** (회기 런타임 아님) |

오늘 `deploy-production.yml` 런: **0건**. 이 홀드 조사에서 운영 워크플로를 실행하지 않았다.

---

## 3. 15:00 이후 실행 순서 (core-deployer · 실행은 15:00 이후만)

개발은 지금처럼 유지한다.

| 단계 | 환경 | 동작 |
|------|------|------|
| 개발 | `develop` 푸시 + consultation/frontend paths | `deploy-backend-dev.yml` / `deploy-frontend-dev.yml` **자동**. 추가 수동 불필요 |
| 운영 준비 | 15:00 이후 | #977(및 occupying PR이 있고 테스터 PASS면 그것)만 ready 후 **한 번에** `main` 머지. #975 #976 #943 #944 넣지 않음 |
| 운영 코어 | `main` + consultation Java | `deploy-production.yml` — **push 자동**이 파일상 살아 있음. 자동이 안 뜨면 Actions에서 `workflow_dispatch` (`deploy_ref=main`만). Cloud Agent가 403이면 사용자가 Actions → 「Core Solution 운영 배포」 → Run workflow |
| 운영 프론트 | `main` + `frontend/**` | `deploy-frontend-prod.yml` push 자동. leftover는 프론트 파일 포함 |

15:00 이전에는 위 운영 단계를 **실행하지 않는다**. 체크리스트만.

---

## 4. 금지

- 15:00 KST 이전 `main` 머지, `gh workflow run deploy-production.yml`, 코어/프론트 운영 수동 실행
- 시안(#975)·스킬(#976)·CSS(#944)를 회기 운영 묶음에 포함
- leftover / occupying 기능 브랜치에 이 문서를 섞어 커밋
- 「배포할까요」 확인 질문

---

## 5. 분배실행 (15:00 이후 · 지금은 호출하지 않음)

| Phase | 담당 | 전달 요지 | 지금 |
|-------|------|-----------|------|
| A. occupying PR·테스터 | `core-tester` (occupying PR 생긴 뒤) | leftover #977 + occupying rem=0 회기 시나리오 PASS 여부만 | 대기 |
| B. 운영 머지·배포 | `core-deployer` | 15:00 이후 PASS된 회기 PR만 main 머지. 자동 런 확인. 미기동 시 `deploy-production.yml` dispatch. 403이면 Actions 한 줄 | **15:00 전 실행 금지** |

---

## 6. 참조

- `.cursor/agents/core-deployer.md`
- `/core-solution-deployment`
- `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- PR: [#977](https://github.com/beta0629/MindGarden/pull/977) · [#975](https://github.com/beta0629/MindGarden/pull/975) · [#976](https://github.com/beta0629/MindGarden/pull/976) · [#974](https://github.com/beta0629/MindGarden/pull/974)
