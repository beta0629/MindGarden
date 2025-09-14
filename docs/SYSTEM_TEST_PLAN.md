# 전체 시스템 테스트 계획

## 테스트 목표
Phase 1-4에서 구현된 모든 동적화 시스템의 정상 동작을 검증

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
