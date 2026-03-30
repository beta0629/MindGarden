# 사용자 삭제 가이드

## 개요

이메일 또는 이메일 패턴으로 사용자 및 관련 데이터를 삭제하는 프로시저입니다.

## 프로시저

### 1. DeleteUserByEmail
특정 이메일로 사용자 1명을 삭제합니다.

**사용법:**
```sql
CALL DeleteUserByEmail('user@example.com', @success, @message);
SELECT @success, @message;
```

**파라미터:**
- `p_email`: 삭제할 사용자의 이메일 (정확히 일치)
- `p_success`: 삭제 성공 여부 (OUT)
- `p_message`: 결과 메시지 (OUT)

### 2. DeleteUsersByEmailPattern
이메일 패턴으로 여러 사용자를 일괄 삭제합니다.

**사용법:**
```sql
-- 이메일 일부로 검색 (자동으로 % 패턴 추가)
CALL DeleteUsersByEmailPattern('beta0629', @deleted_count, @message);
SELECT @deleted_count, @message;

-- 전체 이메일로 검색
CALL DeleteUsersByEmailPattern('beta0629@gmail.com', @deleted_count, @message);
SELECT @deleted_count, @message;
```

**파라미터:**
- `p_email_pattern`: 삭제할 사용자의 이메일 패턴 (LIKE 패턴)
- `p_deleted_count`: 삭제된 사용자 수 (OUT)
- `p_message`: 결과 메시지 (OUT)

## 삭제 순서

프로시저는 다음 순서로 데이터를 삭제합니다:

1. `user_role_assignments` - 역할 할당
2. `session_extension_requests` - 세션 연장 요청 (consultant_client_mappings 참조)
3. `consultant_client_mappings` - 상담사-내담자 매핑
4. `user_sessions` - 사용자 세션
5. `user_social_accounts` - 소셜 계정
6. `user_passkey` - 패스키
7. `password_reset_tokens` - 비밀번호 재설정 토큰
8. `consultants` - 상담사 정보
9. `clients` - 내담자 정보
10. `users` - 사용자

## 주의사항

1. **외래키 제약 조건**: 일부 테이블(`asset_revenues`, `consultations`, `deposit_records` 등)은 비즈니스 데이터이므로 삭제하지 않습니다. 이러한 테이블에 참조가 있는 경우 수동으로 처리해야 합니다.

2. **영구 삭제**: 이 프로시저는 물리적 삭제를 수행합니다. 복구가 불가능하므로 신중하게 사용하세요.

3. **트랜잭션**: 모든 삭제 작업은 트랜잭션으로 처리되며, 오류 발생 시 롤백됩니다.

4. **패턴 사용**: `DeleteUsersByEmailPattern`은 LIKE 패턴을 사용하므로 주의해서 사용하세요.

## 예시

### 특정 사용자 삭제
```sql
CALL DeleteUserByEmail('beta0629@gmail.com', @success, @message);
SELECT @success, @message;
```

### 여러 사용자 일괄 삭제
```sql
CALL DeleteUsersByEmailPattern('beta0629', @deleted_count, @message);
SELECT @deleted_count, @message;
```

## 파일 위치

- `scripts/database/delete_user_by_email.sql` - 단일 사용자 삭제 프로시저
- `scripts/database/delete_users_by_email_pattern.sql` - 패턴 기반 일괄 삭제 프로시저

## 적용 방법

```bash
# 프로시저 생성
mysql -h [host] -u [user] -p [database] < scripts/database/delete_users_by_email_pattern.sql
```

