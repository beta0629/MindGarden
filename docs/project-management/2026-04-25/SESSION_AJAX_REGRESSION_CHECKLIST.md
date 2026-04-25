# `ajax.js` `checkSessionAndRedirect` 회귀 체크리스트

`ajax.js`의 세션/리다이렉트 보강(5xx 시 로그인 이동 방지) **머지 전후**에 수행할 짧은 검증입니다.

## 기록 (정적 체크)

| 항목 | 값 |
|------|-----|
| **대상 파일** | `frontend/src/utils/ajax.js` |
| **명령** | `cd frontend && npx eslint --max-warnings 0 src/utils/ajax.js` |
| **실행 시점** | `core-coder` 패치 **머지 전** (동일 기준으로 머지 후에도 재실행 권장) |
| **Exit code** | `0` |

> 머지 전후 `Exit code`가 `0`이 아니면 린트 오류/경고를 먼저 해결한 뒤 머지·배포합니다.

## Jest (자동)

| 항목 | 값 |
|------|-----|
| **`ajax.js` / `checkSessionAndRedirect` 전용 단위 테스트** | **없음** (다른 테스트에서 `utils/ajax`를 mock 하는 사례만 존재) |

## 수동 검증

### 1) 403 1회 + `current-user` 200 (기대: 로그인으로 안 감)

- **전제**: 인증이 필요한 화면에서 API 한 곳이 **403**을 한 번 반환하고, 이어서(또는 병렬) `/api/.../current-user`(또는 앱이 사용하는 current-user API)는 **200**인 시나리오.
- **기대**: **로그인 페이지로 리다이렉트되지 않음** (403만으로 “세션 만료” 판정으로 취급되지 않아야 함 — 제품 기준이 403을 어떻게 정의하든, 본 체크는 “current-user 200이면 머물러야 함”에 초점).

### 2) `current-user` 500 (코더 패치 후, 로그인으로 안 감)

- **의도**: 서버 5xx일 때 `checkSessionAndRedirect`가 **로그인 강제 이동**을 하지 않는지 확인.
- **모의(가능한 경우)**: Chrome 개발자 도구 **Network**에서 `current-user` 요청에 대해 **Override / Local override / Request blocking** 등 환경에 맞는 방식으로 **500 응답**을 주입하거나, **Fetch/XHR override**로 동일 URL을 500으로 치환. (팀에서 쓰는 Network 모의 도구/확장이 있으면 그 절차를 여기에 보강.)
- **기대**: **로그인 페이지로 보내지 않음** (에러 UI·토스트·재시도 등은 앱 기존 동작에 따름).

### P0) 공개 경로(로그인 화면) — 401 시 **리다이렉트 루프 없음**

- **대상 URL 예**: 로그인·회원가입 등 **비로그인 공개** 라우트.
- **의도**: 공개 경로에서 발생하는 401(또는 비인증 API 호출)이 `checkSessionAndRedirect`와 맞물려 **로그인 ↔ (다시 401) ↔ 로그인** 같은 루프를 만들지 않는지.
- **기대**: **무한 리다이렉트/탭 전체 깜빡임 없음**; 한 번의 안정적 화면 표시.

---

## 완료 시 스냅샷 (이번 세션)

- **문서**: `docs/project-management/2026-04-25/SESSION_AJAX_REGRESSION_CHECKLIST.md`
- **ESLint `src/utils/ajax.js` exit code**: `0`
