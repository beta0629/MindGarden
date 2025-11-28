# 전체 시스템 테스트 계획

## 테스트 목표
상담센터 운영에 필요한 모든 시스템의 정상 동작을 검증
- Phase 1-4: 동적화 시스템
- Phase 5: 환불 관리 시스템  
- Phase 6: 카카오 알림톡 시스템

## 테스트 범위

### Phase 1: 스케줄 시스템 동적화
- [ ] ScheduleCalendar.js 동적 색상/아이콘 로딩
- [ ] 스케줄 상태별 동적 표시
- [ ] API 엔드포인트 정상 동작

### Phase 2: 매핑 시스템 동적화  
- [ ] MappingStats.js 동적 색상/아이콘/라벨
- [ ] MappingCard.js 동적 상태 정보
- [ ] mapping.js 상수 파일 동적 처리

### Phase 3: 클라이언트 관리 시스템 동적화
- [ ] ClientComprehensiveManagement.js 동적 처리
- [ ] ConsultantComprehensiveManagement.js 동적 처리
- [ ] 사용자 상태/등급 동적 표시

### Phase 4: CSS 테마 동적화 시스템
- [ ] CSS 테마 API 엔드포인트 테스트
- [ ] 테마별 색상 동적 로딩
- [ ] cssThemeHelper.js 캐싱 시스템
- [ ] css-variables.js 동적 처리

### Phase 5: 환불 관리 시스템
- [ ] 내담자 관리에서 다중 매핑 환불 처리
- [ ] 매핑 관리에서 개별 매핑 환불 처리
- [ ] 환불 시 스케줄 자동 취소 확인
- [ ] ERP 연동 및 환불 데이터 전송
- [ ] 환불 통계 및 이력 조회
- [ ] 안전한 내담자/상담사 삭제 시스템

### Phase 6: 카카오 알림톡 시스템
- [ ] 알림톡 서비스 상태 확인
- [ ] 공통 코드 기반 템플릿 생성
- [ ] 시뮬레이션 모드 테스트
- [ ] 통합 알림 시스템 (우선순위별 발송)
- [ ] 환불 처리 시 자동 알림 발송
- [ ] 상담 확정 시 알림 발송
- [ ] 대체 발송 시스템 (알림톡→SMS→이메일)

## 테스트 방법

### 1. API 엔드포인트 테스트
```bash
# 공통코드 API
curl -X GET "http://localhost:8080/api/admin/common-codes/group-metadata"
curl -X GET "http://localhost:8080/api/admin/common-codes/group/SCHEDULE_STATUS/display-options"

# CSS 테마 API  
curl -X GET "http://localhost:8080/api/admin/css-themes/themes"
curl -X GET "http://localhost:8080/api/admin/css-themes/themes/default/colors"
```

### 2. 프론트엔드 동적 처리 테스트
- 브라우저에서 각 컴포넌트 로딩 확인
- 개발자 도구에서 API 호출 확인
- 캐싱 시스템 동작 확인

### 3. 데이터베이스 확인
```sql
-- 공통코드 테이블 확인
SELECT * FROM code_group_metadata WHERE is_active = true;
SELECT * FROM common_codes WHERE code_group = 'SCHEDULE_STATUS';

-- CSS 테마 테이블 확인
SELECT * FROM css_theme_metadata WHERE is_active = true;
SELECT * FROM css_color_settings WHERE theme_name = 'default';
```

## 성공 기준
1. 모든 API 엔드포인트가 정상 응답
2. 프론트엔드에서 동적 데이터 정상 로딩
3. 캐싱 시스템 정상 동작
4. 에러 시 fallback 메커니즘 정상 동작
5. 성능 저하 없이 동적 처리 완료

## 테스트 결과 기록
- [ ] Phase 1 테스트 결과
- [ ] Phase 2 테스트 결과  
- [ ] Phase 3 테스트 결과
- [ ] Phase 4 테스트 결과
- [ ] 전체 통합 테스트 결과
