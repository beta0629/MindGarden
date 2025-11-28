# 테스트 계획서

**작성일**: 2025-11-25  
**테스트 범위**: 하드코딩 제거 및 동적 카드 레이아웃 구현

---

## 📋 테스트 항목

### 1. 하드코딩 제거 테스트

#### 1.1 세션비 조회 로직 테스트
- [ ] 매핑에서 회기당 단가 조회 성공
- [ ] 매핑이 없을 때 CommonCode에서 기본값 조회
- [ ] CommonCode가 없을 때 Fallback 값 사용
- [ ] StatisticsServiceImpl의 3곳 하드코딩 제거 확인
- [ ] RealTimeStatisticsServiceImpl의 3곳 하드코딩 제거 확인

#### 1.2 CommonCode 기본 세션비 테스트
- [ ] V51 마이그레이션 실행 확인
- [ ] SYSTEM_CONFIG.DEFAULT_SESSION_FEE 코드 생성 확인
- [ ] extra_data에 값이 올바르게 저장되는지 확인

### 2. 동적 카드 레이아웃 테스트

#### 2.1 위젯 카드 래퍼 테스트
- [ ] WidgetCardWrapper 컴포넌트 렌더링 확인
- [ ] 기본 카드 스타일 (v2) 적용 확인
- [ ] 글래스모피즘 스타일 적용 확인
- [ ] 위젯별 카드 스타일 적용 확인

#### 2.2 대시보드 설정 테스트
- [ ] 대시보드 생성 시 cardLayout 자동 추가 확인
- [ ] 위젯별 cardStyle 설정 적용 확인
- [ ] 기본값과 위젯별 설정 병합 확인

#### 2.3 카드 스타일 변형 테스트
- [ ] v2, glass, flat, bordered, minimal 스타일 모두 테스트
- [ ] elevated, outlined, filled, text variant 테스트
- [ ] 패딩, 보더 반경, 그림자 크기 변경 테스트
- [ ] 호버 효과 작동 확인

---

## 🧪 테스트 시나리오

### 시나리오 1: 통계 계산 시 세션비 조회

1. **매핑이 있는 경우**
   - 상담사-내담자 매핑 생성 (packagePrice: 500000, totalSessions: 10)
   - 스케줄 완료 처리
   - 통계 계산 시 회기당 단가(50000) 사용 확인

2. **매핑이 없는 경우**
   - 매핑 없는 스케줄 완료 처리
   - CommonCode에서 기본값(50000) 조회 확인

3. **CommonCode가 없는 경우**
   - CommonCode 삭제 또는 비활성화
   - Fallback 값(50000) 사용 확인
   - 경고 로그 출력 확인

### 시나리오 2: 대시보드 카드 레이아웃

1. **기본 카드 스타일**
   - 대시보드 생성
   - cardLayout 설정 확인
   - 모든 위젯에 기본 스타일 적용 확인

2. **위젯별 카드 스타일**
   - 위젯 config에 cardStyle 추가
   - 해당 위젯만 다른 스타일 적용 확인

3. **다양한 카드 스타일 조합**
   - 글래스모피즘 + 호버 효과
   - 미니멀 + 텍스트 variant
   - 테두리 강조 + 큰 그림자

---

## 🔍 검증 방법

### 1. 백엔드 검증
```bash
# 통계 계산 API 호출
POST /api/v1/statistics/calculate
{
  "statisticCodes": ["TOTAL_REVENUE_TODAY"],
  "date": "2025-11-25"
}

# 대시보드 설정 확인
GET /api/v1/tenant/dashboards/{dashboardId}
# cardLayout 필드 확인
```

### 2. 프론트엔드 검증
- 브라우저 개발자 도구에서 카드 클래스 확인
- 위젯별 cardStyle 설정 확인
- 카드 스타일 변경 시 즉시 반영 확인

### 3. 데이터베이스 검증
```sql
-- CommonCode 확인
SELECT * FROM common_codes 
WHERE code_group = 'SYSTEM_CONFIG' 
  AND code_value = 'DEFAULT_SESSION_FEE';

-- 대시보드 설정 확인
SELECT dashboard_id, dashboard_config 
FROM tenant_dashboards 
WHERE dashboard_id = '{dashboardId}';
-- JSON에서 cardLayout 필드 확인
```

---

## ✅ 테스트 체크리스트

### 하드코딩 제거
- [ ] StatisticsServiceImpl 하드코딩 제거 확인
- [ ] RealTimeStatisticsServiceImpl 하드코딩 제거 확인
- [ ] 세션비 조회 로직 정상 작동
- [ ] CommonCode 기본값 조회 정상 작동
- [ ] Fallback 메커니즘 정상 작동

### 동적 카드 레이아웃
- [ ] WidgetCardWrapper 컴포넌트 정상 렌더링
- [ ] 기본 카드 스타일 적용
- [ ] 위젯별 카드 스타일 적용
- [ ] 대시보드 생성 시 cardLayout 자동 추가
- [ ] 다양한 카드 스타일 변형 테스트

---

## 🐛 예상 이슈 및 해결

### 이슈 1: CommonCode 조회 실패
- **원인**: 마이그레이션 미실행
- **해결**: V51 마이그레이션 실행

### 이슈 2: 카드 스타일 미적용
- **원인**: WidgetCardWrapper import 누락
- **해결**: DynamicDashboard.js에서 import 확인

### 이슈 3: 위젯별 스타일 무시
- **원인**: 설정 우선순위 로직 오류
- **해결**: widget.cardStyle 우선 적용 확인

---

## 📊 테스트 결과 기록

### 테스트 환경
- 날짜: 2025-11-25
- 브라우저: 
- 백엔드 버전:
- 프론트엔드 버전:

### 테스트 결과
- [ ] 모든 테스트 통과
- [ ] 일부 테스트 실패 (상세 기록 필요)
- [ ] 추가 수정 필요

