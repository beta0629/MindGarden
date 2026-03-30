# Flyway 마이그레이션 실패 후 repair·재적용 (개발 환경)

**대상**: 개발 DB 등 **아직 해당 버전이 success=1 로 기록되지 않은** 경우.  
**비밀·호스트**: 이 문서는 URL·비밀번호·SSH 대상을 적지 않는다. 연결 정보는 배포 환경 변수·비밀 저장소를 따른다.

**운영 반영 전 점검**: `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md`(하드코딩·완료 조건), `docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 를 운영 배포 시 참고.

---

## 1. 증상

- 앱 기동 시 Flyway 가 특정 버전에서 멈추거나, `flyway_schema_history` 에 해당 `version` 행의 `success` 가 `0` 인 경우.
- 엔티티·JPA `length` 는 이미 길어졌으나 DB 컬럼이 짧아 **런타임 truncation** 이 나는 경우(해당 DDL 미적용).

---

## 2. 전제

- 해당 버전이 **성공(success=1)으로 끝난 적이 없으면**, 스크립트·체크섬을 고친 뒤 `repair` 로 실패 행을 정리하고 **동일 버전을 다시 migrate** 할 수 있다.
- 이미 success=1 이면 **동일 버전 파일 수정 후 재실행은 하지 않는다**(새 버전 마이그레이션으로 처리).

---

## 3. 절차 (개발 담당자용)

1. **실패 행 확인** (DB 클라이언트에서, 스키마는 환경에 맞게 지정):

   ```sql
   SELECT installed_rank, version, description, success, checksum
   FROM flyway_schema_history
   WHERE success = 0
   ORDER BY installed_rank DESC;
   ```

2. **앱 중지** 후, 배포 환경에서 Flyway **repair** 실행.  
   - Spring Boot를 쓰는 경우: 프로젝트에서 문서화된 방식으로 `flyway repair` 를 호출하거나, 동일 데이터소스를 가리키는 Flyway CLI로 `repair` 수행.  
   - 목적: `success = 0` 인 행 제거(또는 도구에 따른 정리) 후, 수정된 JAR의 마이그레이션으로 **다시 migrate**.

3. **앱 재기동** (또는 `migrate` 만 단독 실행)하여 해당 버전이 **success=1** 로 남는지 확인.

4. **검증 예시** (`clients` PII 확장 등 DDL 적용 확인용):

   ```sql
   SHOW FULL COLUMNS FROM clients LIKE 'phone';

   SELECT version, description, success, checksum
   FROM flyway_schema_history
   WHERE version = '20260330.001'
   ORDER BY installed_rank DESC;
   ```

   `Collation`·`Type` 이 기대(예: `varchar(500)`)인지, `success` 가 `1` 인지 확인한다.

---

## 4. 관련 마이그레이션 예시

- `V20260330_001__extend_clients_columns_for_encrypted_pii.sql`: `clients` 의 name, email, phone 등 PII VARCHAR 확장.  
  실패 시 위 repair 절차 후 재적용; 스크립트는 컬럼별 `ALTER` 로 분리되어 MySQL 8 InnoDB 에서 적용 실패 가능성을 낮춘다.
