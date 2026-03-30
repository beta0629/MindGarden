# 운영 반영 오케스트레이션 회의안 (2026-03-30)

**문서 유형**: core-planner 주관 운영 반영 회의 실행안  
**상태**: 회의 진행용 (실행 전 승인 필요)  
**기준 문서**:
- `PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`
- `../deployment/PRODUCTION_ESSENTIAL_DATA.md`
- `../project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17
- `../project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3
- `../project-management/CORE_PLANNER_DELEGATION_ORDER.md`

---

## 0. 회의 기록 헤더 (작성)

| 항목 | 내용 |
|------|------|
| 회의 일시 | YYYY-MM-DD HH:MM ~ HH:MM |
| 운영 환경 | Production / Staging (해당만) |
| 릴리즈 태그·커밋 SHA | 예: `prod-2026.03.30-r1` / `abc1234` |
| 변경 티켓·Change ID | |
| 작업 허용 시간대(Maintenance window) | 시작: _____ 종료: _____ |
| 증적 보관 경로 | 예: `evidence/<release-tag>/` |

**참석(실명)**

| 역할 | 이름 | 서브에이전트 역할 대응 |
|------|------|------------------------|
| 기획(core-planner) | | |
| 운영(shell) | | |
| QA(core-tester) | | |
| 분석(core-debugger) | | |
| 개발(core-coder) | | |
| 배포·운영 승인(A) | | |

---

## 1. 강제 운영 원칙

- 일반 대화형 어시스턴트 직접 코드 수정 금지, 구현은 `core-coder`만 수행
- 코드 변경 배치는 `core-tester` 검증 게이트 통과 전 완료 처리 금지
- 하드코딩은 검색/CI/스크립트 검출 시 운영 반영 전까지 예외 없이 수정
- 운영 테넌트 데이터는 개발 DB 덤프 이관 금지, 온보딩으로만 생성
- 쉘 작업(프로세스 종료/재기동/DB 설정)은 승인 게이트 후 실행
- `kill -9` 선행 금지 (최후 수단 + 추가 승인 필수)

---

## 2. 90분 회의 아젠다 (타임박스 + 체크리스트)

| 완료 | 시간 | 아젠다 | 담당 | 산출물 | 증적(경로·캡처) |
|:----:|------|--------|------|--------|-----------------|
| [ ] | 0~10분 | 범위 동결, 영향도 확인, No-Go 기준 재확인 | core-planner | 범위/제외 목록 | |
| [ ] | 10~25분 | 데이터 정책/시크릿/OAuth/CORS 점검 | core-planner + shell + core-debugger | 데이터·보안 체크 결과 | |
| [ ] | 25~45분 | 하드코딩 게이트 점검 | core-coder + core-tester | 검출/해결 현황표 | |
| [ ] | 45~65분 | shell 런북 리허설 | shell + core-debugger | 실행/중단 기준표 | |
| [ ] | 65~80분 | 테스트 게이트 확정 | core-tester | Pre/Post 테스트 계획 | |
| [ ] | 80~90분 | Go/No-Go 판정 및 서명 | core-planner + 승인자 | 최종 승인표 | |

**실제 완료 시각 메모**

| 구간 | 계획 종료 시각 | 실제 완료 시각 | 비고 |
|------|----------------|----------------|------|
| 0~10분 | | | |
| 10~25분 | | | |
| 25~45분 | | | |
| 45~65분 | | | |
| 65~80분 | | | |
| 80~90분 | | | |

---

## 3. Phase 0~8 실행 계획 (분배실행)

| Phase | 목적 | 담당 subagent | 완료 조건 | Go/No-Go |
|------|------|---------------|-----------|----------|
| 0 | 증적 인벤토리 잠금 | explore, generalPurpose | 상태표/증적 경로 확정 | 미작성 시 No-Go |
| 1 | 위임/검증 규칙 잠금 | core-planner | 역할/승인권자 확정 | 역할 불명확 시 No-Go |
| 2 | 데이터/환경 게이트 | shell, core-debugger | 필수 env/데이터 정책 적합 | 정책 위반 시 No-Go |
| 3 | 하드코딩 제거 | core-coder, core-tester | 검출 0건(또는 합의 예외 문서화) | 미해결 1건 이상 No-Go |
| 4 | 실행 승인 게이트 | shell, core-debugger | 승인/백업/롤백 3요건 충족 | 미충족 시 No-Go |
| 5 | 승인 범위 반영 | core-coder | 변경 반영/빌드 준비 | 승인 외 변경 시 No-Go |
| 6 | 테스트 게이트 | core-tester | 스모크/회귀 필수 통과 | 실패 1건 이상 No-Go |
| 7 | 운영 실행/안정화 | shell, core-debugger | 재기동+헬스+오류율 안정 | 헬스 실패 시 롤백 |
| 8 | 최종 승인/사후정리 | core-planner, generalPurpose | 승인표 서명/리스크 등록 | 미서명 시 No-Go |

### 3.1 Phase별 실행 체크리스트

| 완료 | Phase | 실행자 | 완료 시각 | 증적·비고 |
|:----:|-------|--------|-----------|-----------|
| [ ] | 0 | | | |
| [ ] | 1 | | | |
| [ ] | 2 | | | |
| [ ] | 3 | | | |
| [ ] | 4 | | | |
| [ ] | 5 | | | |
| [ ] | 6 | | | |
| [ ] | 7 | | | |
| [ ] | 8 | | | |

---

## 4. shell 전용 실행 런북 (회의용)

### 4.1 변수

```bash
SERVICE_NAME="mindgarden-backend"
APP_DIR="/var/www/mindgarden"
LOG_DIR="/var/log/mindgarden"
BACKUP_DIR="/var/backups/mindgarden"
DB_HOST="127.0.0.1"
DB_USER="mindgarden_ro"
APP_PORT="8080"
```

### 4.2 사전 승인/백업/롤백 체크

```bash
# 승인/작업창 확인 (티켓/체인지 ID는 운영 프로세스에 맞게 관리)
echo "CHANGE_ID=<id>, WINDOW=<start~end>, APPROVER=<name>"

# 백업 존재 확인
ls -lh "$BACKUP_DIR" | rg "mindgarden|mysql|dump|jar"

# 현재 서비스 상태/로그 확인
systemctl status "$SERVICE_NAME" --no-pager
journalctl -u "$SERVICE_NAME" -n 200 --no-pager
```

성공 기준:
- 승인자/작업창/롤백 담당자 명시 완료
- 최신 백업 파일 확인 가능
- 현재 서비스가 정상 상태로 관측됨

실패 시:
- 승인 누락/백업 부재/상태 이상이면 종료 절차 진입 금지

### 4.3 graceful stop (강제 종료 금지)

```bash
sudo systemctl stop "$SERVICE_NAME"
systemctl is-active "$SERVICE_NAME"
ss -lntp | rg ":$APP_PORT"
```

성공 기준:
- 서비스 inactive
- 앱 포트 리스닝 제거

실패 시:
- 즉시 `kill -9` 금지
- 로그 원인 확인 후 재시도, 지속 실패 시 승인권자 재판단

### 4.4 DB 연결/설정 점검

```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p -e "SHOW VARIABLES LIKE 'max_connections';"
mysql -h "$DB_HOST" -u "$DB_USER" -p -e "SHOW STATUS LIKE 'Threads_connected';"
```

성공 기준:
- `Threads_connected`와 앱 풀 합산이 `max_connections` 한도 내

실패 시:
- 풀/인스턴스 수 재조정 계획 수립 후 진행 재승인

### 4.5 디스크 공간/로그 점검

```bash
df -h
du -h --max-depth=1 "$LOG_DIR" | sort -h
```

성공 기준:
- 디스크/로그 사용률이 임계치 이내

실패 시:
- 보존정책 내 아카이브/임시파일 정리 후 재측정
- 현재 릴리즈·백업·활성 로그 삭제 금지

### 4.6 재기동/헬스체크

```bash
sudo systemctl start "$SERVICE_NAME"
systemctl is-active "$SERVICE_NAME"
curl -fsS "http://127.0.0.1:$APP_PORT/actuator/health"
```

성공 기준:
- 서비스 active
- 헬스 `UP`

실패 시:
- 즉시 롤백 절차 진입
- `journalctl` 오류 추출 후 `core-debugger` 분석 위임

### 4.7 롤백 기준

- 헬스 실패 지속
- 로그인/OAuth/핵심 플로우 실패
- 5xx 급증/치명 알람 발생

### 4.8 shell 단계별 실행 체크리스트 (실행 시)

| 완료 | 단계 | 담당 | 완료 시각 | 증적(명령 출력·경로) |
|:----:|------|------|-----------|----------------------|
| [ ] | 승인/작업창/롤백 담당 확정 | | | |
| [ ] | 백업 존재·시각 확인 | | | |
| [ ] | 재기 전 서비스·로그 스냅샷 | | | |
| [ ] | graceful stop (kill -9 금지) | | | |
| [ ] | 포트·프로세스 잔존 확인 | | | |
| [ ] | DB `max_connections`·연결 수 확인 | | | |
| [ ] | 디스크·로그 용량 확인·정리(보존정책 준수) | | | |
| [ ] | 배포 산출물 반영(해당 시) | | | |
| [ ] | 재기동 | | | |
| [ ] | 헬스 `UP` 확인 | | | |
| [ ] | 15분 모니터링(5xx·알람) | | | |
| [ ] | 이상 시 롤백 실행·재검증 | | | |

**롤백 실행 기록** (필요 시)

| 항목 | 내용 |
|------|------|
| 롤백 시작 시각 | |
| 롤백 수행자 | |
| 복구 버전·경로 | |
| 재헬스·스모크 결과 | |
| 증적 경로 | |

---

## 5. 테스트 게이트 (core-tester)

### 5.1 판정 규칙

- Critical/High 이슈 0건
- 필수 항목(아래 표) 실패 1건 이상이면 **No-Go**
- Medium은 우회책·후속 일정 문서화 후 진행 여부 합의

### 5.2 Pre-Go (운영 반영 직전) 15항목

| 완료 | ID | 검증 내용 | 결과(Pass/Fail) | 증적 파일명·경로 |
|:----:|----|-----------|-----------------|------------------|
| [ ] | P01 | 메인·서브도메인 DNS 해석 | | |
| [ ] | P02 | TLS 체인·만료·SAN | | |
| [ ] | P03 | HTTP→HTTPS 강제 리다이렉트 | | |
| [ ] | P04 | OAuth 로그인(정상 콜백) | | |
| [ ] | P05 | OAuth 오류/취소 처리 (5xx 없음) | | |
| [ ] | P06 | 일반 로그인 성공·세션 | | |
| [ ] | P07 | 로그인 실패·잠금 정책 | | |
| [ ] | P08 | 핵심 비즈니스 플로우 #1 | | |
| [ ] | P09 | 핵심 비즈니스 플로우 #2 (저장=조회) | | |
| [ ] | P10 | 핵심 비즈니스 플로우 #3 (예외 입력·500 없음) | | |
| [ ] | P11 | 서브도메인 라우팅·접근 | | |
| [ ] | P12 | 테넌트 격리·교차 노출 없음 | | |
| [ ] | P13 | GNB 공지 읽음 반영 | | |
| [ ] | P14 | API Health·핵심 API 200 | | |
| [ ] | P15 | P95·5xx·에러 버짓 (합격 기준 충족) | | |

### 5.3 Post-Go (운영 반영 직후) 15항목

| 완료 | ID | 검증 내용 | 결과(Pass/Fail) | 증적 파일명·경로 |
|:----:|----|-----------|-----------------|------------------|
| [ ] | S01 | 메인 도메인 첫 화면·리소스 로드 | | |
| [ ] | S02 | DNS 전파(주요 리전) | | |
| [ ] | S03 | 브라우저 TLS 경고 0 | | |
| [ ] | S04 | OAuth 실계정 로그인 | | |
| [ ] | S05 | 일반 로그인 | | |
| [ ] | S06 | 로그아웃 후 보호 페이지 차단 | | |
| [ ] | S07 | 핵심 생성 트랜잭션 성공 | | |
| [ ] | S08 | 생성 데이터 조회 일치 | | |
| [ ] | S09 | 상태 전이(승인 등) 성공 | | |
| [ ] | S10 | 서브도메인 순회 200 | | |
| [ ] | S11 | 권한 없는 서브도메인 차단 | | |
| [ ] | S12 | GNB 공지 읽음·배지 | | |
| [ ] | S13 | Health 라이브·인스턴스 정상 | | |
| [ ] | S14 | 배포 직후 치명 Exception/5xx 없음 | | |
| [ ] | S15 | Critical 알람 0건 | | |

### 5.4 증적 파일명 규칙 (권장)

`YYYYMMDD_HHMM_<항목ID>_<환경>_Pass|Fail.png` (또는 `.log`, `.json`)

---

## 6. 서브에이전트 호출 템플릿

### core-debugger
- 운영 반영 단계별 장애 리스크, 징후, 롤백 트리거를 High/Medium으로 분류

### core-coder
- 승인된 변경만 반영, 하드코딩 검출 전수 해결, 운영 설정 정합 확인

### core-tester
- Pre/Post 게이트 실행 후 증적 첨부, Pass/Fail와 Blocker 제출

### shell
- 승인/백업/롤백 준비 확인 후 런북 실행, 단계별 결과와 증적 제출

---

## 7. 최종 승인표 (RACI)

| 작업 | R | A | C | I | 결과 |
|------|---|---|---|---|------|
| 위임/게이트 잠금 | core-planner | 배포책임자 | QA/보안 | 전원 | GO/NO-GO |
| 데이터/환경 검증 | shell | 운영책임자 | core-debugger | 전원 | GO/NO-GO |
| 하드코딩 제거 | core-coder | 개발리드 | core-tester | 전원 | GO/NO-GO |
| 테스트 게이트 | core-tester | QA리드 | core-coder | 전원 | GO/NO-GO |
| 프로세스 종료/재기동 | shell | 운영책임자 | core-debugger | 전원 | GO/NO-GO |
| 최종 판정 | core-planner | 배포책임자 | QA/보안/운영 | 전원 | GO/NO-GO |

서명:
- 배포책임자: __________________ / 일시: ________
- 운영책임자: __________________ / 일시: ________
- QA리드: ______________________ / 일시: ________
- 보안검토자: __________________ / 일시: ________
- 기획(core-planner): ____________ / 일시: ________

### 7.1 최종 판정 요약

| 항목 | 내용 |
|------|------|
| 판정 | GO / NO-GO |
| 근거(3줄 이내) | |
| 잔여 High 이슈 | 없음 / 있음(티켓: ) |
| 후속 배치·일정 | |

---

**개정 이력**

- 2026-03-30: 운영반영 오케스트레이션 회의안 신규 작성
- 2026-03-30: 회의 헤더·아젠다/Phase/shell/테스트 게이트 체크리스트·판정 요약 보강
