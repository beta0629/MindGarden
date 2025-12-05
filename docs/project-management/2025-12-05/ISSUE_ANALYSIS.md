# 프로시저 배포 구문 오류 분석

## 문제 상황
- 12번째 줄에서 지속적인 구문 오류 발생
- 빈 프로시저로도 동일한 오류 발생
- 모든 배포 방법에서 동일한 오류

## 오류 메시지
```
ERROR 1064 (42000) at line 2: You have an error in your SQL syntax; 
check the manual that corresponds to your MySQL server version for the right syntax to use near '' at line 12
```

## 12번째 줄 내용
```sql
IN p_exclude_schedule_id BIGINT,
```

## 가능한 원인
1. **MySQL 버전 호환성**: 특정 버전에서 BIGINT 파라미터 처리 문제
2. **파라미터 개수 제한**: MySQL의 파라미터 개수 제한 초과
3. **특수 문자/인코딩**: 숨겨진 특수 문자 또는 인코딩 문제
4. **파일 전송 문제**: SCP/SSH를 통한 파일 전송 시 문자 변환

## 테스트 결과
- 빈 프로시저로도 동일한 오류 발생
- 파라미터 선언 부분에 문제가 있는 것으로 추정

## 다음 조치
1. MySQL 버전 확인
2. 파라미터를 하나씩 제거하며 테스트
3. 기존 작동 프로시저와 정확히 동일한 형식으로 재작성

---

**작성일**: 2025-12-05

