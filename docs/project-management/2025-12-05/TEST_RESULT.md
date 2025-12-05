# CheckTimeConflict 프로시저 배포 테스트 결과

## 테스트 진행
1. ✅ `LEAVE` 문 제거: 완료
2. ✅ 기존 형식 적용: 완료
3. ❌ 배포 실패: 12번째 줄 구문 오류 지속 발생

## 발생 오류
```
ERROR 1064 (42000) at line 2: You have an error in your SQL syntax; 
check the manual that corresponds to your MySQL server version for the right syntax to use near '' at line 12
```

## 시도한 방법
1. ❌ DELIMITER 제거한 배포 파일
2. ❌ SCP로 파일 전송
3. ❌ SSH heredoc으로 직접 실행
4. ❌ 서버에서 직접 파일 생성
5. ❌ 간단한 버전으로 테스트

## 분석
- 12번째 줄: `IN p_exclude_schedule_id BIGINT,`
- 모든 방법에서 동일한 오류 발생
- 파일 전송/인코딩 문제가 아닌 것으로 보임
- SQL 구문 자체의 문제 가능성

## 다음 조치
1. 최소 파라미터로 테스트 (파라미터 하나씩 제거하며 확인)
2. 기존 작동 프로시저의 정확한 형식 재확인
3. MySQL 버전 확인 및 호환성 검토

---

**작성일**: 2025-12-05  
**상태**: 배포 실패, 원인 분석 중

