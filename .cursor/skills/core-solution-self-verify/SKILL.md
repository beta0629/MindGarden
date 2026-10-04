---
name: core-solution-self-verify
description: release/dev 머지 전 자체 검증 실행 절차. `.cursor/rules/self-verify.mdc` 7항목과 하드스톱(타인 데이터, 스모크 동작 확인, 커넥션 점유 0, 추정 PASS 금지, 스텁으로 가린 프로시저·외부 HTTP)을 실제로 실행한다. 항목 1은 요구사항 표(항목/결과/근거), 항목 5의 FE는 실제 URL 스크린샷과 .dev 실제 데이터다. Jest·curl 200·mock·파라미터 모드를 검사하지 않는 thenReturn으로 통과시키지 않는다. 운영 배포 전 .dev에서 같은 프로시저를 1회 실행하지 않았으면 미확인이고 운영 배포는 하지 않는다. PR 본문 「## 자체 검증」 갱신 + 규칙 형식 요약. .dev 배포 후 5번 스모크. FAIL이면 머지 금지.
---

# 자체 검증 실행 스킬 (Self-Verify)

규칙 SSOT는 **`.cursor/rules/self-verify.mdc`** 다. 이 스킬은 그 체크리스트를 **읽는 것이 아니라 실행**하는 절차다. 규칙과 충돌하면 규칙이 우선한다.

이 스킬과 규칙, deployer 게이트는 **이 git 저장소**에 있다. 클론하거나 pull 하면 로그인 계정이 달라도 같은 절차다. 사용자 홈의 Cursor 스킬 폴더나 개인 agent store에만 복사해 두고 저장소 파일을 비우지 않는다. 로그인·이메일·사용자 id·토큰 값을 이 파일에 적지 않는다. 스모크 계정은 아래 환경변수 이름만 쓴다.

## 언제 · 누가

| 시점 | 항목 | 실행자 |
|------|------|--------|
| PR 생성 후, `release/dev` 머지 **전** | 1, 2, 3, 4, 6, 7 + 하드스톱 1·3·4·5(스텁으로 통과 금지) | **core-coder** (PR 열기·머지 요청 전에 실행하고 PR 본문 기록) |
| 머지 직전 | PR 본문 「## 자체 검증」 1~4, 6, 7 전부 PASS인지, 하드스톱 문구가 PASS로 둔갑하지 않았는지 재확인 | **core-deployer** |
| 머지 후 `.dev` 배포 완료 | 5 + 하드스톱 2 | **core-deployer** (결과를 PR 본문에 추가) |
| 운영 배포 **전** | 하드스톱 5의 .dev 1회. 서버가 호출할 것과 같은 프로시저(외부 HTTP면 그 경로를 스텁 없이). HTTP 상태와 알려진 예외 부재. 미호출이면 미확인, 운영 배포 금지 | **core-deployer** |

## 절대 금지 (규칙 요약)

- `release/prod` 직접 수정·push·머지
- 운영 도메인·운영 DB에 요청. 검증은 **로컬과 .dev만**
- heal·데이터 강제 수정 스크립트·기존 데이터 일괄 UPDATE/DELETE
- PortOne live 전환·testMode 변경·실결제
- 공용 관리자 계정으로 로그아웃 호출. 테스트 계정은 새로 만들고 PR에 id 기록
- 비밀값을 로그·PR 본문·코드에 기록
- 테스트 삭제·skip으로 통과시키기
- 하드스톱을 「남은 위험」으로 적고 전체를 PASS로 두는 것

## 0. 준비

```bash
git fetch origin release/dev release/prod
BASE=origin/release/dev
git diff --name-only "$BASE"...HEAD > /tmp/sv-changed.txt
PR=$(gh pr view --json number -q .number)
: > /tmp/sv-report.md
```

- 변경 파일 목록(`/tmp/sv-changed.txt`)이 이후 모든 항목의 입력이다.
- `/tmp/sv-report.md` 가 검증 리포트다. 각 명령의 stdout을 이 파일에 붙인다. 파일이 없거나 비어 있으면 동작을 추정한 것이다.
- 각 항목 결과는 `PASS`/`FAIL` + 근거(명령·숫자·파일:줄)로 적는다. 근거 없는 PASS는 FAIL로 본다.

환경변수 (값 없음. 셸에서만 넣고, PR·로그·이 스킬에 값을 쓰지 않는다):

| 이름 | 쓸 때 |
|------|--------|
| `DEV_BASE_URL` | .dev 베이스 URL |
| `SV_TEST_EMAIL` | 이번에 만든 테스트 계정 식별자 |
| `SV_TEST_PASSWORD` | 그 계정 비밀번호. PR·리포트에 출력하지 않음 |
| `SV_SELF_PATH` | 본인 데이터 GET 경로 (`DEV_BASE_URL` 기준 절대 경로가 아닌 path) |
| `SV_OTHER_PATH` | 같은 API에 다른 사용자 id를 넣은 GET 경로 |
| `SV_OTHER_USER_ID` | 403 본문에 나오면 안 되는 다른 사용자 id |
| `SV_MONEY_READ_PATH` | 금액·환불 한도를 읽는 GET 경로 |
| `SV_MONEY_FIELDS` | 응답에 있어야 하는 필드 이름. 쉼표로 구분. 금액 숫자 아님 |
| `SV_UI_PHRASE` | diff에서 고른 새 화면 문구 한 줄 |

## 1. 요구사항 대조

구현을 시작하기 전에 사용자 요청을 번호 있는 체크리스트로 나눠 채팅에 보여 준다. 구현이 끝나면 같은 번호를 표로 PR 본문 「## 자체 검증」과 채팅에 넣는다. 이 표는 항목 1의 결과다. 1~7을 대체하는 두 번째 목록이 아니다.

| 항목 | 결과 | 근거 |
|------|------|------|
| 1. … | 통과 또는 실패 | 파일:줄, API 응답, 또는 화면 위치 |

결과가 실패인 행이 있으면 머지하지 않는다. 고친 뒤 같은 표를 다시 채운다. 근거 없이 통과로 적으면 FAIL. 확인하지 않은 행은 미확인과 이유다. 미확인은 PASS가 아니다.

1. 지시(이슈·위임 프롬프트·사용자 메시지)의 요구사항을 번호로 나열한다.
2. 각 번호마다 해결 위치를 `경로:줄`로 적는다 (`git diff "$BASE"...HEAD -U0 -- <파일>`로 줄 번호 확인).
3. 해결 위치가 없는 번호가 하나라도 있으면 **FAIL**.
4. 리포트가 없으면 추정이다. 돈·권한(결제, 환불, 매핑, 주문, 개인정보, 본인 id) 번호는 추정만으로 PASS하지 않는다.

```bash
if [ ! -s /tmp/sv-report.md ]; then
  echo "추정 — /tmp/sv-report.md 없음. 돈·권한 항목은 PASS 금지, 사용자 확인 전 머지 금지" | tee -a /tmp/sv-report.md
fi
# 돈·권한 요구 번호마다, 리포트에 테스트 메서드 또는 own-id/connection 스크립트 행이 있는지 확인
# 해당 행이 없으면 그 번호를 "추정"으로 적고 FAIL. 「남은 위험」으로 옮기지 않는다.
```

## 2. 테스트 실행 (로컬)

CI 백엔드 빌드는 `mvn clean package -DskipTests` 라 백엔드 테스트가 돌지 않는다. 반드시 로컬에서 실행한다. 저장소에 `mvnw`·offline 프로파일 규약은 없으므로 `mvn` + `test` 프로파일(`application-test.yml`)을 쓴다.

### 2-1. 백엔드

```bash
# 변경·신규 main 클래스 → 관련 테스트 클래스 후보
grep '^src/main/java/.*\.java$' /tmp/sv-changed.txt | xargs -n1 basename | sed 's/\.java$//' > /tmp/sv-classes.txt
# 관련 테스트: 클래스명으로 시작하는 테스트 + 클래스를 참조하는 테스트 + 이번 PR에서 추가·수정된 테스트
{
  while read -r c; do rg --files src/test/java -g "${c}*Test.java"; rg -l "\b${c}\b" src/test/java; done < /tmp/sv-classes.txt
  grep '^src/test/java/.*Test\.java$' /tmp/sv-changed.txt
} | xargs -n1 basename | sed 's/\.java$//' | sort -u | paste -sd, - > /tmp/sv-tests.txt

set -o pipefail
mvn -q -DfailIfNoTests=false -Dspring.profiles.active=test -DargLine=-Xmx2g \
  -Dtest="$(cat /tmp/sv-tests.txt)" test 2>&1 | tee /tmp/sv-mvn.log
# 통과/전체: target/surefire-reports 합산
grep -h 'Tests run:' target/surefire-reports/*.txt | tee -a /tmp/sv-report.md
```

- 기록: `통과 N / 전체 M (F 실패, E 에러, S 스킵)` + 실행한 테스트 클래스 목록.
- 관련 테스트가 0개면 **FAIL** — 3번 반례 테스트를 포함해 새로 작성한다.
- 스킵(S)이 이번 PR에서 새로 생겼으면 **FAIL** (`@Disabled`·`assumeTrue` 추가 금지).
- `mvn` 로그가 없고 결과만 문장으로 적었으면 그 항목은 추정이다. 돈·권한이면 PASS 금지.

### 2-2. 실패 시 base 비교 (기존 실패 구분)

```bash
git worktree add /tmp/sv-base "$BASE"
(cd /tmp/sv-base && mvn -q -DfailIfNoTests=false -Dspring.profiles.active=test \
  -Dtest=<실패한 테스트 클래스> test) ; echo "base exit=$?"
git worktree remove --force /tmp/sv-base
```

- base에서도 같은 테스트가 실패 → `기존 실패`로 표기 (PASS 판정은 가능하나 목록을 남긴다).
- base에서는 통과 → 이번 변경의 회귀 → **FAIL**. 고친 뒤 2번부터 다시.
- 작업 트리가 더러우면 worktree를 쓴다. `git stash`는 커밋 안 된 변경 유실 위험이 있어 차선책.

### 2-3. 프론트엔드 / Expo (해당 파일이 바뀐 경우만)

```bash
# frontend (craco test)
FE=$(grep '^frontend/src/' /tmp/sv-changed.txt | sed 's#^frontend/##' | tr '\n' ' ')
[ -n "$FE" ] && (cd frontend && CI=true npx craco test --watchAll=false --findRelatedTests $FE)

# expo-app
EX=$(grep '^expo-app/' /tmp/sv-changed.txt | sed 's#^expo-app/##' | tr '\n' ' ')
[ -n "$EX" ] && (cd expo-app && npx jest --config jest.config.cjs --findRelatedTests $EX)
```

- 변경 파일 옆 `__tests__/` 스위트와 이번 PR에서 추가한 테스트가 결과에 포함됐는지 확인한다.
- 관련 문서에 회귀 고정 스위트 목록이 있으면 그 목록도 함께 돌린다.
- 기록: `Test Suites a/b, Tests n/m`.

## 3. 반례 테스트 (최소 3개)

"이 수정을 우회하거나 깨는 입력"을 **테스트 코드로** 최소 3개 작성·실행한다. 아래 중 변경에 해당하는 축에서 고른다.

| 축 | 반드시 확인할 것 |
|----|------------------|
| 돈 | 누적 환불 ≤ 결제금액, 재시도·중복 요청 시 1회만 반영 |
| 권한 | 미인증·다른 역할·다른 테넌트 호출 차단. permitAll/CSRF 예외 신규 추가 시 사유 기록. 같은 테넌트의 다른 사용자 id는 아래 하드스톱 |
| 동시성 | 같은 요청 동시 2회 (예: `ExecutorService` + `CountDownLatch`) |
| 트랜잭션 | 외부 호출 중 트랜잭션 플래그가 아니라 **커넥션 점유 0**. 아래 명령 |
| 시간 | KST 기준, 자정 넘김, 날짜·월 경계 |
| 저장 프로시저·외부 HTTP | 돈·상태 변경 호출을 파라미터 모드를 검사하지 않는 `thenReturn`·스텁만으로 통과 처리하지 않음. 아래 3-C |

- 기록 형식: `반례 n: <입력/상황> → 기대 <결과> → 테스트 <클래스#메서드> PASS|FAIL`
- 3개 미만이거나 하나라도 FAIL이면 **FAIL**. 반례 테스트는 2번 실행 대상에 포함한다.

### 3-A. 다른 사용자 데이터 (하드스톱)

같은 테넌트여도 내담자·일반 사용자가 다른 사용자의 결제·매핑·주문·개인정보를 읽으면 FAIL이다. 지시가 "호출은 바꾸지 말고 보고만"이어도 스크립트 결과와 다르게 PASS로 고치지 않는다. #1336이 그 실패 사례다.

```bash
node scripts/verification/check-client-admin-own-id.js \
  --changed /tmp/sv-changed.txt | tee -a /tmp/sv-report.md
echo "own-id exit=$?" | tee -a /tmp/sv-report.md
```

- 종료 코드 1이면 항목 3과 6은 **FAIL**. 서버가 본인 id를 강제하지 않는 것이다. 테스트만 추가해서 스크립트가 0이 되기 전에는 PASS로 적지 않는다.
- 출력된 경로마다 항목 6 회귀 목록에 `내담자 → /api/v1/admin/...` 를 적는다.
- 그 핸들러에 대해 반례 테스트를 돌린다. 테스트는 호출자 A와 다른 사용자 id B(같은 테넌트)로 호출하고, `AccessDeniedException` 또는 HTTP 403이어야 하며 응답에 B의 id가 없어야 한다. 메서드 이름이 리포트의 `→ Class.method` 와 같아야 한다.

```bash
# 스크립트가 FAIL own-id ... → SomeController.someMethod 를 찍었으면
rg -n "someMethod" src/test/java | tee -a /tmp/sv-report.md
rg -n -e 'AccessDeniedException|isForbidden|FORBIDDEN' src/test/java -g '*someMethod*' 
```

- 403 테스트가 없거나 B의 데이터가 응답에 남아 있으면 **FAIL**.
- 검사 대상이 없으면 `PASS own-id 검사 대상 없음` 이다. 그때도 항목 6에서 내담자 화면의 `/api/v1/admin/` 를 찾으면 `--path` 로 다시 돌린다.

```bash
node scripts/verification/check-client-admin-own-id.js \
  --path /api/v1/admin/<경로> | tee -a /tmp/sv-report.md
```

### 3-B. 외부 호출 커넥션 (하드스톱)

`TransactionSynchronizationManager.isActualTransactionActive()==false` 만 보면 안 된다. #1328은 플래그만 통과하고 커넥션은 잡혀 있었다. 호출 시점(mock `thenAnswer`/`doAnswer` 안)에 아래가 모두 참이어야 한다.

- `isActualTransactionActive()` false
- `isSynchronizationActive()` false
- `TransactionSynchronizationManager.getResource(...)` null (EntityManager 미바인딩)
- `getHikariPoolMXBean().getActiveConnections()` == 0 (`assertEquals(0, ...)`)
- `getActiveConnections()` 를 `thenReturn(0)` 으로 고정하면 FAIL

```bash
node scripts/verification/check-external-call-connection.js \
  --changed /tmp/sv-changed.txt | tee -a /tmp/sv-report.md
echo "connection exit=$?" | tee -a /tmp/sv-report.md
```

- 종료 코드 1이면 항목 3은 **FAIL**. 플래그 단언만 있는 테스트를 PASS로 적지 않는다.
- 외부 호출 변경이 없으면 `PASS connection 외부 호출 변경 없음`.
- 스크립트가 요구하는 단언 예 (호출되는 클라이언트 mock의 `thenAnswer` 본문):

```java
assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
assertFalse(TransactionSynchronizationManager.isSynchronizationActive());
assertNull(TransactionSynchronizationManager.getResource(entityManagerFactory));
assertEquals(0, hikariDataSource.getHikariPoolMXBean().getActiveConnections());
```

이 네 줄은 메서드가 끝난 뒤가 아니라 **외부 호출이 들어오는 시점**에 있어야 한다. 단위 테스트가 DataSource를 mock해서 active를 0으로 돌려주면 스크립트가 FAIL이다.

### 3-C. 저장 프로시저·외부 HTTP 파라미터 모드 (하드스톱 5)

2026-10-02 급여 확정은 `RecalcUnpaidSalaryCalculation` 을 Mockito `thenReturn` 으로 감쌌다. 실제 JDBC는 파라미터 4를 OUT으로 등록했고, 운영 프로시저는 그 OUT 파라미터를 선언하지 않았다. `SQLException: Parameter number 4 is not an OUT parameter` 는 운영 배포 뒤에만 났다. .dev는 그 프로시저를 실행하지 않았다.

- 돈 또는 상태를 바꾸는 경로가 저장 프로시저 또는 외부 HTTP API를 호출하면, 그 호출을 `thenReturn` 또는 실제 파라미터 모드(IN/OUT/INOUT)를 검사하지 않는 스텁으로 바꾼 테스트만으로 **통과로 적지 않는다**. 그렇게 적으면 항목 3은 **FAIL**.
- 파라미터 모드를 검사하는 테스트가 있어도 그것만으로 운영 배포를 허용하지 않는다. 운영 배포 전 확인은 5-D다.
- 이 확인에서 비밀값을 로그·리포트·PR에 쓰지 않는다. heal·데이터 강제 수정을 하지 않는다. 운영 도메인·운영 DB를 호출하지 않는다.

변경된 테스트에서 후보를 찾는다. 히트만으로 PASS/FAIL을 정하지 않는다. 돈·상태 변경 경로인지, 스텁이 실제 파라미터 모드를 검사하는지를 보고 판정한다.

```bash
git diff "$BASE"...HEAD -U2 -- src/test | rg -n 'thenReturn|registerOutParameter|CallableStatement' || true
```

## 4. DB 마이그레이션

```bash
MIG=src/main/resources/db/migration
# 4-1. 운영에 이미 있는 파일 수정 0건 (A=신규만 허용)
git diff --name-status origin/release/prod -- "$MIG" | grep -v '^A' || echo "existing-modified=0"
# 4-2. 신규 버전 > 운영 최신 버전
git ls-tree -r --name-only origin/release/prod -- "$MIG" | sed -n 's#.*/V\([0-9_.]*\)__.*#\1#p' | tr '_' '.' | sort -V | tail -1
git diff --name-only --diff-filter=A origin/release/prod -- "$MIG" | sed -n 's#.*/V\([0-9_.]*\)__.*#\1#p' | tr '_' '.' | sort -V
# 4-3. 위험 구문
git diff --name-only --diff-filter=A origin/release/prod -- "$MIG" | xargs -r rg -n -i \
  -e 'NOT NULL' -e '^\s*UPDATE\s' -e '^\s*DELETE\s' -e 'TRUNCATE' -e 'DROP\s+(TABLE|COLUMN)'
```

- 4-1: `M`/`D`/`R` 행이 하나라도 있으면 **FAIL** (내용 교체·`flyway repair` 금지).
- 4-2: 신규 버전이 운영 최신 이하이면 **FAIL**.
- 4-3: `NOT NULL`은 같은 줄/정의에 `DEFAULT`가 있어야 한다. 데이터 `UPDATE`/`DELETE`는 **FAIL**. 재실행 안전성(`IF NOT EXISTS`·information_schema 확인)이 없으면 **FAIL**.
- 마이그레이션 변경이 없으면 `PASS (변경 없음)`.

## 5. .dev 스모크 (배포 후 · core-deployer)

**.dev 도메인만.** 운영 도메인·운영 DB 호출 금지. 호스트는 코드에 박지 말고 `DEV_BASE_URL` 로 받는다. 주소 200, 로그인 없는 index.html, `/actuator/health` UP 만으로는 PASS가 아니다. FE를 바꾼 PR은 아래 번들 확인(5-C)과 함께 실제 화면·실제 데이터를 본다. Jest 렌더와 curl 200은 그 확인이 아니다. 화면을 바꾸지 않았거나 이 PR을 배포하지 않으면 화면·5번은 미확인 또는 해당 없음으로 적고 통과로 두지 않는다.

### 실제 화면 (FE 변경, 항목 5)

- `.dev` 배포가 끝난 뒤 `DEV_BASE_URL` 의 해당 화면을 연다. PC 너비 1280px, 모바일 너비 390px. 스크린샷 최소 2장을 PR 본문에 붙인다.
- 공개 페이지는 로그인 세션 없이 본다.
- 스크린샷을 찍지 않았으면 그 행은 미확인이다. 통과로 적지 않는다. 찍지 않은 스크린샷을 있다고 적지 않는다.
- FE 변경이 없으면 이 확인은 해당 없음이다.

### 실제 데이터 (항목 5)

- mock, 테스트 픽스처, Jest 가짜 데이터로 이 확인을 대체하지 않는다. .dev에 있는 데이터를 본다.
- 화면에 나온 개수, 빠져야 할 숨김·테스트 상품, 빈 값이 「—」 하나만으로 그려지는지를 적는다.
- 멀티테넌트 기능은 대상 테넌트와 다른 테넌트를 각각 연다. 두 테넌트 데이터가 섞이면 FAIL. MindGarden 내용이 다른 테넌트 화면에 있으면 FAIL.

```bash
: "${DEV_BASE_URL:?DEV_BASE_URL 필요}"
MERGE_SHA=$(gh pr view "$PR" --json mergeCommit -q .mergeCommit.oid)
RUN=$(gh run list --workflow deploy-backend-dev.yml --commit "$MERGE_SHA" --limit 1 --json databaseId,conclusion -q '.[0]')
curl -fsS "$DEV_BASE_URL/actuator/info" | tee /tmp/sv-info.json
curl -fsS "$DEV_BASE_URL/actuator/health" | tee /tmp/sv-health.json
# git.commit.id(또는 short) == MERGE_SHA, health status == UP 를 리포트에 적는다
```

- 프론트 변경이 있으면 `deploy-frontend-dev.yml` 런도 같은 SHA로 success인지 확인한다.
- `.dev` 일정을 옮겼으면 원래대로 되돌리고 **일정 id + 되돌린 시각(KST)** 을 기록한다.
- 커밋 불일치·UP 아님 → **FAIL**.

### 5-A. 권한을 바꾼 PR

테스트 계정이 없으면 여기서 끝이다. 항목 5는 `FAIL(대기)` 이고, 머지 후 검증이 끝나지 않았음을 사용자에게 알린다. 계정을 만들 수 있으면 만들고 PR에는 id만 적는다. `SV_TEST_PASSWORD` 는 출력하지 않는다. 공용 관리자 로그아웃은 호출하지 않는다.

```bash
: "${SV_TEST_EMAIL:?없으면 5번은 FAIL(대기)}"
: "${SV_TEST_PASSWORD:?}"
: "${SV_SELF_PATH:?}"
: "${SV_OTHER_PATH:?}"
: "${SV_OTHER_USER_ID:?}"
CJ=/tmp/sv-cookies.txt
rm -f "$CJ"
jq -nc --arg email "$SV_TEST_EMAIL" --arg password "$SV_TEST_PASSWORD" \
  '{email:$email,password:$password}' \
  | curl -sS -c "$CJ" -b "$CJ" -H 'Content-Type: application/json' \
      -o /tmp/sv-login.json -w 'login_http=%{http_code}\n' \
      -d @- "$DEV_BASE_URL/api/v1/auth/login"
SELF=$(curl -sS -b "$CJ" -o /tmp/sv-self.json -w '%{http_code}' "$DEV_BASE_URL$SV_SELF_PATH")
OTHER=$(curl -sS -b "$CJ" -o /tmp/sv-other.json -w '%{http_code}' "$DEV_BASE_URL$SV_OTHER_PATH")
echo "self_http=$SELF other_http=$OTHER" | tee -a /tmp/sv-report.md
# OTHER 본문에 SV_OTHER_USER_ID 가 있으면 leak=yes
if grep -q -F "$SV_OTHER_USER_ID" /tmp/sv-other.json; then echo "leak=yes"; else echo "leak=no"; fi | tee -a /tmp/sv-report.md
rm -f /tmp/sv-login.json
```

- `self_http` 가 200이 아니면 **FAIL**.
- `other_http` 가 403이 아니거나 `leak=yes` 이면 **FAIL**. 본인 200만 보고 PASS로 적지 않는다.
- 응답 본문 전체를 PR에 붙이지 않는다. 상태 코드와 `leak=no` 만 적는다.

### 5-B. 돈을 바꾼 PR

읽기만 한다. POST 환불, 결제 생성, PortOne URL 호출은 하지 않는다.

```bash
: "${SV_MONEY_READ_PATH:?}"
: "${SV_MONEY_FIELDS:?필드 이름을 쉼표로. 금액 숫자 금지}"
MONEY=$(curl -sS -b "$CJ" -o /tmp/sv-money.json -w '%{http_code}' "$DEV_BASE_URL$SV_MONEY_READ_PATH")
echo "money_http=$MONEY" | tee -a /tmp/sv-report.md
python3 - <<'PY' | tee -a /tmp/sv-report.md
import json, os
body = json.load(open("/tmp/sv-money.json"))
fields = [f.strip() for f in os.environ["SV_MONEY_FIELDS"].split(",") if f.strip()]
missing = [f for f in fields if f not in json.dumps(body)]
print("money_fields_missing=" + (",".join(missing) if missing else "none"))
PY
```

- HTTP가 200이 아니거나 `money_fields_missing` 이 none이 아니면 **FAIL**.
- 필드 이름을 DTO에서 못 골랐으면 추정이다. PASS 금지.

### 5-C. 화면만 바꾼 PR

개발 프론트 워크플로 로그에 해시가 항상 찍히지는 않는다. 런 산출물을 받는다. 산출물을 못 받으면 FAIL이다. index.html 200으로 대체하지 않는다.

```bash
: "${SV_UI_PHRASE:?diff의 새 문구 한 줄}"
FE_RUN=$(gh run list --workflow deploy-frontend-dev.yml --commit "$MERGE_SHA" --limit 1 --json databaseId,conclusion -q '.[0].databaseId')
rm -rf /tmp/sv-fe && mkdir -p /tmp/sv-fe
gh run download "$FE_RUN" -n core-frontend-static-site-artifact -D /tmp/sv-fe
ART=$(basename "$(ls /tmp/sv-fe/static/js/main.*.js | head -1)")
curl -fsS "$DEV_BASE_URL/" | tee /tmp/sv-index.html >/dev/null
grep -q -F "$ART" /tmp/sv-index.html && echo "live_hash=$ART" || echo "live_hash=mismatch"
curl -fsS "$DEV_BASE_URL/static/js/$ART" -o /tmp/sv-live-main.js
grep -q -F "$SV_UI_PHRASE" "/tmp/sv-fe/static/js/$ART" && echo "artifact_phrase=yes" || echo "artifact_phrase=no"
grep -q -F "$SV_UI_PHRASE" /tmp/sv-live-main.js && echo "live_phrase=yes" || echo "live_phrase=no"
```

- `live_hash` 가 mismatch이거나 phrase가 no이면 **FAIL**.
- 문구를 diff에서 못 집어 빈 문자열로 두면 추정이다. PASS 금지.

### 5-D. 운영 배포 전 프로시저 실행 (하드스톱 5)

돈 또는 상태를 바꾸는 경로가 저장 프로시저 또는 외부 HTTP API를 호출하면, **운영 배포 전**에 .dev에서 그 경로를 1회 실행한다. 저장 프로시저이면 서버가 호출할 것과 **같은 프로시저**여야 한다. 외부 HTTP이면 스텁이 아니라 .dev의 그 경로여야 한다.

5-B가 막는 환불 POST, 결제 생성, PortOne 호출, 실결제, testMode 변경은 그대로 하지 않는다. 5-D는 그 결제 호출을 허용하지 않는다. 저장 프로시저(또는 그 경로의 외부 HTTP)가 돈 또는 상태를 바꾸면, 운영 배포 전에 .dev에서만 1회 실행하고 아래만 기록한다.

- `proc_target`: 프로시저 이름 또는 API path. 호스트·비밀값 없음
- `proc_http`: HTTP 상태 코드
- `proc_known_exception=no`: 그 경로에서 알려진 예외가 응답과 로그에 없음. 2026-10-02 사례의 알려진 예외는 `Parameter number 4 is not an OUT parameter`

.dev를 호출하지 않았으면 `proc_http=미확인` 이다. 미확인이면 **운영 배포하지 않는다**. `release/dev` 머지 전에는 이 실행을 요구하지 않는다. 그 코드는 아직 .dev에 없다.

이 검증에서 비밀값을 로그·리포트·PR에 남기지 않는다. 실패해도 heal·데이터 강제 수정·일괄 UPDATE/DELETE를 하지 않는다. 운영 도메인·운영 DB를 호출하지 않는다. `DEV_BASE_URL` 이 운영을 가리키면 실행하지 않고 미확인으로 적는다.

## 6. 회귀 확인 (호출처)

```bash
# 변경된 public 메서드·엔드포인트·컴포넌트·상수 심볼마다
rg -n "<심볼 또는 /api/v1/경로>" src/main/java frontend/src expo-app --glob '!**/node_modules/**'
# 내담자 화면의 admin API
rg -n "/api/v1/admin/" frontend/src/components/client frontend/src/components/dashboard expo-app/src \
  --glob '!**/node_modules/**' --glob '!**/__tests__/**' --glob '!**/admin/**'
```

- 영향 목록을 경로별로 분류: **웹(frontend)**, **Expo(expo-app)**, **관리자(admin 화면·API)**, **배치(`@Scheduled`·Job·Scheduler)**.
- 내담자 화면(`frontend/src/components/client`, 대시보드의 `Client*` 파일, expo 내담자 경로)이 `/api/v1/admin/**` 를 호출하면 목록에 반드시 적고, 3-A 명령으로 본인 id 강제를 확인한다. 강제하지 않으면 **FAIL**.
- 영향 경로마다 테스트가 있는지 확인하고, 없거나 안 돌렸으면 2번에 추가 실행. 영향 경로 미검증이면 **FAIL**.

## 7. 하드코딩 확인

```bash
# 저장소 스캐너 (CI code-quality-check 와 동일) — 전체 스캔 후 변경 파일만 필터
node scripts/design-system/css-tools/check-hardcoding-enhanced.js > /tmp/sv-hc.log 2>&1; echo "exit=$?"
grep -F -f /tmp/sv-changed.txt /tmp/sv-hc.log
# 비밀·테넌트·호스트·금액 상수 추가분 직접 검색 (추가된 줄만)
git diff "$BASE"...HEAD -U0 | grep '^+' | rg -n -i \
  -e 'password|secret|api[_-]?key|token' -e 'tenant[_-]?id\s*[=:]\s*["0-9]' \
  -e 'https?://' -e '\b[0-9]{1,3}(\.[0-9]{1,3}){3}\b' -e '#[0-9a-fA-F]{3,6}\b'
```

- 변경 파일에서 새로 걸린 항목이 있으면 **FAIL** — 같은 PR에서 env·system_config·공통코드·디자인 토큰으로 치환 (`AGENTS.md §6`).
- 오탐은 근거와 함께 명시(예: 테스트 픽스처 전용).
- 동결 심볼은 `./scripts/deployment/check-deploy-no-overwrite-symbols.sh --source-root .` 가 담당한다. 이 스킬이 그 스크립트를 느슨하게 만들지 않는다.

## 출력

### PR 본문 갱신

「## 자체 검증」 섹션을 새 결과로 교체(없으면 추가)한다. 비밀값·비밀번호·토큰은 쓰지 않는다. 테스트 계정은 id만 적는다.

```bash
gh pr view "$PR" --json body -q .body > /tmp/sv-body.md
# /tmp/sv-body.md 에서 "## 자체 검증" ~ 다음 "## " 직전 구간을 /tmp/sv-section.md 내용으로 교체(없으면 끝에 추가)
gh pr edit "$PR" --body-file /tmp/sv-body.md
```

섹션에는 아래를 모두 넣는다. 표가 1~7 요약을 대체하지 않는다. 비밀값·비밀번호·토큰은 쓰지 않는다.

1. 체크리스트 표. 결과 값은 통과, 실패, 미확인, 해당 없음. 근거는 파일:줄, API 응답, 화면 위치, 또는 미확인 이유.

| 항목 | 결과 | 근거 |
|------|------|------|
| … | 통과 / 실패 / 미확인 / 해당 없음 | … |

2. FE를 바꿨으면 스크린샷 2장 이상 (PC 1280px, 모바일 390px). 공개 페이지는 로그아웃 상태. 스크린샷이 없으면 미확인.
3. PR 번호, 머지 커밋, .dev 배포 run 결과. 아직 없으면 미확인과 이유.
4. 아래 1~7 한 줄 요약 + 항목별 근거(테스트 클래스 목록, 반례 3개, 마이그레이션 diff 결과, 호출처 목록, 스캔 결과, own-id·connection 스크립트 출력).
5. 실제로 확인하지 않은 행은 미확인. 추정으로 통과를 적지 않는다 (하드스톱 4).

### 채팅 요약 (규칙 형식 그대로)

```text
자체 검증: PASS 또는 FAIL
1. 요구사항 대조: PASS|FAIL|추정 — <근거>
2. 테스트 실행: PASS|FAIL — BE 통과 N/전체 M, FE a/b, 기존 실패 <목록|없음>
3. 반례 찾기: PASS|FAIL — <반례 3개 요약> / own-id <exit> / connection <exit> / 프로시저·외부HTTP 스텁 <파라미터 모드 미검사이면 FAIL|해당 없음>
4. DB 마이그레이션: PASS|FAIL — 기존 수정 0건, 신규 V<x> > 운영 V<y>
5. .dev 스모크: PASS|FAIL|대기(머지 전)|미확인|해당 없음 — <본인 200·타인 403·금액 필드·번들 해시·스크린샷 2장·.dev 실제 데이터 중 해당 결과. 못 봤으면 미확인과 이유>
프로시저·외부 HTTP(.dev, 운영 배포 전): <HTTP 상태와 알려진 예외 없음 | 미확인(운영 배포 금지) | 해당 없음>
6. 회귀 확인: PASS|FAIL — 웹/Expo/관리자/배치 영향 <목록>. 내담자 /api/v1/admin 호출 <목록|없음>
7. 하드코딩 확인: PASS|FAIL — <스캔 결과>
남은 위험: <없으면 "없음". 하드스톱 내용은 여기 적지 말고 해당 항목을 FAIL로 둔다>
.dev 배포 run 번호: <run id> / /actuator/info 커밋: <sha>
```

머지 전 실행에서는 5번을 `대기(머지 전)`, run 번호·커밋을 `배포 후 기록`으로 두고, 배포 후 core-deployer가 같은 블록을 갱신한다. 배포하지 않는 문서 PR은 5번과 화면 확인을 `해당 없음`으로 적고 통과로 두지 않는다. 프로시저·외부 HTTP 행은 그 경로가 없으면 `해당 없음`이다. .dev에서 1회 실행하지 않았으면 `미확인(운영 배포 금지)`이고 통과로 두지 않는다. 대기 중에 하드스톱 1·3·4·5(스텁으로 통과)가 FAIL이면 전체를 PASS로 두지 않는다.

## 판정 (게이트)

- **1~4, 6, 7 전부 PASS일 때만** `release/dev` 머지. core-deployer는 PR 본문 섹션이 없거나 FAIL이 있으면 머지하지 않는다.
- 하드스톱(다른 사용자 데이터, 스모크가 동작을 증명하지 않음, 커넥션 미증명, 돈·권한 추정, 파라미터 모드를 검사하지 않는 프로시저·외부 HTTP 스텁으로 통과)은 FAIL이다. 「남은 위험」으로 적고 PASS로 바꾸지 않는다. 사용자가 명시적으로 머지하겠다고 하기 전에는 머지하지 않는다.
- 운영 배포 전 .dev 프로시저(또는 같은 외부 HTTP) 1회가 없으면 그 항목은 미확인이다. 미확인이면 운영 배포하지 않는다.
- FAIL이 있으면 머지하지 않는다. 고칠 수 있으면 고친 뒤 **해당 항목부터 다시 실행**한다.
- 정책 결정·범위 밖 FAIL은 머지하지 않고 사용자에게 질문한다. "호출은 유지하고 보고만"은 타인 데이터 구멍을 통과시키지 않는다.
- 5번 FAIL은 사용자에게 즉시 보고한다 (롤백 여부는 사용자 결정, 운영 반영 보류). 테스트 계정이 없어 5번이 `FAIL(대기)` 이면 머지 후 검증 미완임을 알린다.

## 참조

- `.cursor/rules/self-verify.mdc` — 규칙 SSOT (alwaysApply, 저장소 안)
- `scripts/verification/check-client-admin-own-id.js` — 내담자 `/api/v1/admin/**` 본인 id
- `scripts/verification/check-external-call-connection.js` — 외부 호출 시점 커넥션 0
- `node scripts/verification/self-verify-hard-stops.test.js` — 위 두 스크립트의 픽스처 검사
- `/core-solution-deployment` — 머지 전 이 스킬을 실행. FAIL에 하드스톱 포함
- `/core-solution-testing` — 테스트 작성 표준
- `AGENTS.md` §6 — 하드코딩 금지
- `scripts/design-system/css-tools/check-hardcoding-enhanced.js` — 하드코딩 스캔
- `scripts/deployment/check-deploy-no-overwrite-symbols.sh` — 6항 동결

## 디자인 자체 검증

1~7과 하드스톱은 바꾸지 않는다. 화면을 바꾼 PR만 추가한다. 포인터: `.cursor/rules/design.mdc`.

- 1280px와 390px에서 변경 전·후 스크린샷. 스크린샷을 찍지 않았으면 이 항목은 미확인이다. 통과로 적지 않는다.
- diff에 기존 토큰이 아닌 새 색 또는 raw px가 있으면 보고한다.
- 참조 화면과 톤이 다르면 적는다.
