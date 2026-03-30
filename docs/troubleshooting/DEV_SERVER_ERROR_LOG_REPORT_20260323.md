# 개발 서버(beta0629.cafe24.com) 오류 로그 점검 결과

**점검일**: 2026-03-23  
**실행**: core-shell (SSH 접속, 로그 확인)

---

## 1. 로그 요약 및 오류 유형별 정리

### 1.1 nginx
- **상태**: 이상 없음
- **에러 로그**: `/var/log/nginx/error.log` — 0줄(비어 있음)

### 1.2 Spring Boot 애플리케이션 (`mindgarden-dev`)
- **서비스**: `active (running)` (2026-03-21 19:44:27부터)
- **에러 유형별 빈도**:
  - **CommonCode not found (SALARY_BASE_DATE)**: 3,060건
  - **Data too long for column 'tenant_id' (erd_diagrams)**: 132건

### 1.3 주요 오류 상세

| 유형 | 위치 | 원인 | 영향 |
|------|------|------|------|
| **CommonCode not found** | `SalaryScheduleServiceImpl` | `SALARY_BASE_DATE` 그룹의 `MONTHLY_BASE_DAY`, `CUTOFF_DAY`, `PAYMENT_DAY` 미등록 | 급여 기산일/마감일 조회 실패 |
| **Data truncation tenant_id** | `SchemaChangeErdRegenerationServiceImpl` | `erd_diagrams.tenant_id`가 VARCHAR(36)인데 38자 이상 tenantId 사용 (`tenant-verify-final-*` 등) | ERD 자동 재생성 실패 |
| **JVM_MEMORY** | `AnomalyDetectionService` | 사용률 80.76% (임계 80%) | 메모리 부족 가능성 |
| **UserSessionServiceImpl** | 세션 정리 | 테넌트별 세션 정리 반복 | 로그 과다, 스케줄 부하 가능 |

---

## 2. 적용한 수정 내역 (shell)

| 항목 | 조치 | 결과 |
|------|------|------|
| **로그 디스크 사용량** | `clean-dev-server-logs.sh 2` 수동 실행 | 1.9G → 1.3G (약 600MB 감소), 디스크 사용률 77%→76% |
| **nginx** | 점검 | 에러 없음 |
| **로그 로테이션** | cron(매일 02:00) 유지 | 3일 이상 로그 자동 삭제 중 |

---

## 3. 코드/설정 변경 필요 항목 (코더·기획 위임용)

### 3.1 [코드] CommonCode SALARY_BASE_DATE 보강 (core-coder)
- **파일**: `SalaryScheduleServiceImpl.java`, `common_codes` 시드
- **조치**:
  1. `common_codes`에 `SALARY_BASE_DATE` 그룹 코드 추가: `MONTHLY_BASE_DAY`, `CUTOFF_DAY`, `PAYMENT_DAY`
  2. 또는 코드 미존재 시 null 체크 후 기본값 사용하도록 방어 로직 추가

### 3.2 [DB/코드] erd_diagrams.tenant_id 길이 확장 (core-coder)
- **파일**: Flyway 마이그레이션, `ErdDiagram.java`
- **조치**:
  1. `erd_diagrams.tenant_id`를 `VARCHAR(64)` 또는 `VARCHAR(128)`로 확장
  2. `ErdDiagram.java`의 `@Column(length = 36)`을 `length = 64` 등으로 변경
- **근거**: `tenant-verify-final-*`, `tenant-final-report-*` 등 38자 tenantId 사용

### 3.3 [운영] JVM 힙 설정 점검 ✅ 적용 완료 (2026-03-23)
- **조치**: `config/systemd/mindgarden-dev.service`에 `JAVA_OPTS="-Xms1g -Xmx4g"` 추가, start.sh에서 `$JAVA_OPTS` 사용

### 3.4 [코드] UserSessionServiceImpl 세션 정리 최적화 ✅ 적용 완료 (2026-03-23)
- **조치**: `SessionCleanupScheduler` 테넌트 루프 제거, 1회 호출로 변경, `log.info` → `log.debug`

### 3.5 [보안] OPS 비밀번호 노출 ✅ 적용 완료 (2026-03-23)
- **조치**: `-Dops.admin.password` 제거, `application-dev.yml`에서 환경변수 `OPS_ADMIN_PASSWORD` 주입

---

## 4. 민감 정보 마스킹

- `journalctl`에서 `ops.admin.password` 값 확인됨 → 보고서에는 마스킹 처리
- systemd 단위는 `/etc/mindgarden/dev.env`에서 환경변수 로드 중
