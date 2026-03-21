# 개발 서버 error.log 정리 — 기획 전달 · 디버거 의뢰 · 코더 위임

**문서 버전**: 1.0.0  
**작성일**: 2026-03-22  
**수집 경로**: `root@beta0629.cafe24.com` → `/var/www/mindgarden-dev/logs/error.log` (core-shell SSH)  
**로그 샘플 시각**: 2026-03-21 11:09 ~ 11:45 (KST 기준 서버 시각)  

---

## 0. 역할별 액션 (요약)

| 역할 | 할 일 |
|------|--------|
| **core-planner (기획)** | §1 검토 → 우선순위·스프린트 반영 여부 결정, 이슈 티켓 생성(선택) |
| **core-debugger** | §2 수행 → 원인·재현·수정 범위 확정, §4에 결과 기입 |
| **core-coder** | **디버거 산출물(원인 확정) 후** §3 범위에서만 코드 수정·PR (임의 대형 수정 금지) |

---

## 1. 기획(core-planner) 전달 요약

### 1.1 한 줄 요약

개발 서버 백엔드 로그에 **(A) 테넌트별 ERD 재생성 스케줄 작업의 Hibernate 오류 다발**, **(B) 메트릭·이상탐지 스케줄이 DB 커넥션 풀 종료 후에도 동작하며 실패**, **(C) 기동 직후 `Application run failed` 및 Hikari `has been closed`** 가 확인됨.

### 1.2 비즈니스 관점 영향

| 구분 | 영향 |
|------|------|
| **운영 체감** | 동일 증상이 운영에도 있으면 **간헐적 API 실패·기동 실패**로 이어질 수 있음. 개발 전용 이슈일 수도 있음(재기동/배포 타이밍). |
| **데이터/기능** | ERD 재생성 실패는 **스키마/ERD 관리 기능** 신뢰도 저하. 테스트 테넌트 ID 다수에서 반복. |
| **관측/알림** | CPU·메모리·JVM 메트릭 수집·이상 탐지가 **풀 종료 이후에도 호출**되면 로그 노이즈·오탐 상승. |

### 1.3 기획 판단용 우선순위 제안

1. **P0**: Hikari 풀 종료 후 스케줄/리스너가 DB에 접근하는 **라이프사이클·종료 순서** 문제 (기동 실패 연관).  
2. **P1**: `SchemaChangeErdRegenerationServiceImpl` + `ErdDiagram` **null id / Session flush** 패턴 (테넌트 루프당 반복).  
3. **P2**: 메트릭·이상탐지 실패의 **근본 원인**(DB 불가 시 graceful skip vs 버그).  

---

## 2. core-debugger 의뢰 (분석·재현·수정 범위 제안)

### 2.1 증상 클러스터 A — ERD 재생성 (스케줄러)

**로그 키워드**

- `SchemaChangeErdRegenerationServiceImpl` — `테넌트 ERD 재생성 실패`
- `org.hibernate.AssertionFailure: null id in com.coresolution.core.domain.ErdDiagram entry (don't flush the Session after an exception occurs)`

**의뢰 사항**

- [ ] `SchemaChangeErdRegenerationServiceImpl`에서 **테넌트 단위 트랜잭션/세션 경계** 확인. 한 세션에서 예외 후 flush/save 혼선 여부.  
- [ ] `ErdDiagram` persist 시 **ID 할당 전략**(DB identity vs UUID) 및 실패 테넌트 공통점(테스트 테넌트만인지).  
- [ ] 재현: 개발 DB에서 스케줄 트리거 또는 동일 서비스 메서드 단위 호출.  

**수정 방향 가설** (확정은 디버거)

- 테넌트별 `@Transactional(REQUIRES_NEW)` 또는 실패 시 **세션 clear / 별도 persistence context**.  
- 배치 루프에서 **실패한 테넌트는 스킵하고 세션 초기화**.

---

### 2.2 증상 클러스터 B — 메트릭 수집 · 이상 탐지

**로그 키워드**

- `MetricCollectionService` — `CPU 메트릭 수집 실패`, `메모리 메트릭 수집 실패`, `JVM 메트릭 수집 실패`
- `AnomalyDetectionService` — `CPU_LOAD / MEMORY_USAGE / JVM_MEMORY 이상 탐지 실패`
- 근본 `Caused by`: `java.sql.SQLException: HikariDataSource (MindGardenHikariPool-Dev) has been closed`

**의뢰 사항**

- [ ] 애플리케이션 **종료(shutdown) 시점**에 스케줄러가 여전히 도는지, `@PreDestroy` / `TaskScheduler` 정리 순서 확인.  
- [ ] **기동 완료 전** 스케줄이 DB를 치는지(타이밍).  
- [ ] 메트릭 저장이 DB 의존인지, 풀 닫힘 시 **no-op 또는 로그 레벨 하향**이 맞는지 기획과 합의 포인트 정리.  

---

### 2.3 증상 클러스터 C — 기동 실패

**로그 키워드**

- `SpringApplication - Application run failed`
- 스택: `CodeInitializationServiceImpl.initialize` ← `ApplicationListener` `ready` 이벤트
- 동일 Hikari `has been closed` / `Could not open JPA EntityManager for transaction`

**의뢰 사항**

- [ ] `CodeInitializationServiceImpl` **리스너 실행 순서**와 DataSource 생명주기 관계.  
- [ ] 개발 프로필에서만 재현되는지(로컬·스테이징 비교).  
- [ ] Flyway/초기화 실패로 인한 **컨텍스트 중단**과의 인과 정리.  

---

## 3. core-coder 위임 (수정 시 준수)

- **디버거가 §4에 “원인 확정 + 권장 패치 범위”를 적기 전까지** 본 이슈에 대한 대규모 리팩터링·무관 파일 수정 금지.  
- 수정은 **확정된 클래스/패키지** 위주로 PR 분리 권장:  
  - (예) `SchemaChangeErdRegenerationServiceImpl`, `ErdDiagram` 관련 리포지토리/서비스  
  - (예) 스케줄러 설정, `MetricCollectionService`, `AnomalyDetectionService`, 종료 훅  
  - (예) `CodeInitializationServiceImpl` 및 `ApplicationListener` 등록 방식  
- 프론트/React #130 등과 **무관** — 본 티켓은 **백엔드 JVM 로그** 범위.  

---

## 4. core-debugger 회신 + core-coder 반영 (2026-03-22)

| 항목 | 내용 |
|------|------|
| 재현 절차 | 개발 서버 `error.log`에서 스케줄 시각대 ERD 재생성 루프·Hikari closed 연쇄 확인. 로컬은 활성 테넌트 다수 + 의도적 ERD 실패로 루프 검증 권장. |
| 근본 원인 | **A** `SchemaChangeErdRegenerationServiceImpl` **클래스 단일 `@Transactional`** + 테넌트 루프에서 예외 삼킴 → Hibernate 세션 오염·연쇄 `ErdDiagram` assertion. **B/C** 컨텍스트 종료/기동 실패 시 풀 종료 후 `@Scheduled`·리스너가 DB 접근. |
| 영향 범위 | dev에서 명확; prod도 동일 배치/스케줄 사용 시 동일 패턴 가능. |
| 권장 수정 요약 | 테넌트·전체시스템 ERD 작업 **`REQUIRES_NEW`** + **self 프록시 호출**; `ErdGenerationServiceImpl` 클래스 트랜잭션 축소; 메트릭/이상탐지 **컨텍스트 active·DataSource 검증**; `CodeInitializationServiceImpl` 클래스 `@Transactional` 제거 후 `initialize`에만 적용. |
| 코더 반영 커밋 | `224ebc78d` — 추가로 **REQUIRES_NEW 메서드 내부에서 예외를 삼키지 않도록** 루프에서 try/catch (롤백 보장) 보완 커밋 예정. |

**파일**: `SchemaChangeErdRegenerationServiceImpl`, `ErdGenerationServiceImpl`, `MetricCollectionService`, `AnomalyDetectionService`, `CodeInitializationServiceImpl`

---

## 5. 원문 로그 발췌 (참고)

```
2026-03-21 11:09:26 ... ERROR c.c.c.s.i.SchemaChangeErdRegenerationServiceImpl - ❌ 테넌트 ERD 재생성 실패: tenantId=..., error=null id in com.coresolution.core.domain.ErdDiagram entry (don't flush the Session after an exception occurs)
2026-03-21 11:09:26 ... ERROR org.hibernate.AssertionFailure - HHH000099: ... null id in com.coresolution.core.domain.ErdDiagram entry ...
2026-03-21 11:43:07 ... ERROR c.c.c.s.MetricCollectionService - CPU 메트릭 수집 실패
2026-03-21 11:43:07 ... ERROR c.c.c.s.MetricCollectionService - 메모리 메트릭 수집 실패
2026-03-21 11:43:07 ... ERROR c.c.c.s.MetricCollectionService - JVM 메트릭 수집 실패
2026-03-21 11:45:14 ... ERROR c.c.c.s.AnomalyDetectionService - CPU_LOAD 이상 탐지 실패
... Caused by: java.sql.SQLException: HikariDataSource ... (MindGardenHikariPool-Dev) has been closed.
2026-03-21 11:45:14 ... ERROR o.s.boot.SpringApplication - Application run failed
... CodeInitializationServiceImpl ... Caused by: ... HikariDataSource ... has been closed.
```

---

## 6. 변경 이력

| 일자 | 내용 |
|------|------|
| 2026-03-22 | 초안 — SSH 로그 샘플 기반 오케스트레이션 문서 작성 |
| 2026-03-22 | core-debugger 분석·core-coder 패치 반영, §4 갱신 |
