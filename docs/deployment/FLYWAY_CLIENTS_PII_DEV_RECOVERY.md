# Flyway: clients PII 마이그레이션 실패 시 개발 DB 복구

개발 서버(`beta0629`)에서 `V20260330_001`이 `ALTER ... email NOT NULL` 단계에서 **MySQL 1138 (Invalid use of NULL value)** 로 실패하면, 이후 버전(`V20260331_001` 등)은 **실행되지 않는다**. 앱은 기동 실패하거나(과거 로그), 부분 스키마 상태로 런타임 FK·길이 오류가 난다.

## 1. 상태 확인

MySQL에서 (스키마명은 환경에 맞게, 예: `core_solution`):

```sql
SELECT version, description, success, installed_on
FROM flyway_schema_history
WHERE version LIKE '2026033%'
ORDER BY installed_rank DESC;
```

`success = 0` 인 행이 있으면 해당 버전이 **실패 기록**이다.

## 2. 데이터 선행 정리 (NOT NULL 전 필수)

`clients`에 `email`/`name`이 NULL이거나 공백만 있는 행을 없앤 뒤에만 `NOT NULL` DDL이 통과한다. 아래는 저장소 `V20260330_001`·`V20260331_001`과 동일한 의도의 **수동 실행용** 요약이다.

- `email`/`name`: NULL → `users`(동일 `id`, 역할 CLIENT)에서 복사 가능하면 복사, 아니면 id 기반 placeholder.
- `phone` 등 500자 초과: `LEFT(..., 500)` 로 잘라 길이 오류 방지.

운영·개발 DB에 직접 SQL을 실행하기 전에 **백업·행 수 확인**을 권장한다.

## 3. Flyway 정리 후 재기동

1. 실패 레코드가 남아 있으면 `flyway repair`(또는 팀 정책에 맞는 실패 행 삭제) 후,
2. 최신 `app.jar` 배포( `V20260330_001` + `V20260331_001` 포함),
3. 서비스 재시작으로 `migrate` 재실행.

**이미 적용된 마이그레이션 파일(`V20260330_001`)의 내용을 바꾸면 checksum 불일치가 난다.** 내용 변경이 필요하면 **새 버전 번호**의 SQL 파일로만 추가한다.

## 4. 앱 코드와의 관계

- `AdminServiceImpl.updateClient`: `clients.tenant_id` 불일치 시 테넌트 조회가 비어 **잘못된 INSERT** → `users` FK 위반이 날 수 있음. 저장소의 `findById` 폴백·`tenant_id` 정합 패치가 배포되어야 한다.
- 공통코드: 테넌트 행과 코어(`tenant_id IS NULL`) 행이 **같은 group+value**로 동시에 매칭되면, 단일 JPQL OR 쿼리는 2건을 반환할 수 있다. `CommonCodeServiceImpl#getCommonCodeByGroupAndValue`는 **테넌트 단건 조회 → 코어 단건 조회** 순으로 분리되어 있다.

## 5. 반복 오류 방지 체크리스트

- [ ] 신규 마이그레이션: NOT NULL·길이 확장 전 **백필·TRIM·길이 자르기**를 같은 파일 또는 선행 버전에 둔다.
- [ ] 배포 후 dev에서 `flyway_schema_history` 성공 여부 확인.
- [ ] `common_codes`에 동일 `(code_group, code_value)`로 테넌트·코어 **중복 활성 행**이 없는지 점검(급여 마감일 등 스케줄러 조회와 연관).
