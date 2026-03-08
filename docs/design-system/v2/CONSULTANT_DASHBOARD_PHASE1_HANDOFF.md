# 상담사 대시보드 Phase 1 디자인 Handoff 요약

**작성일**: 2026-03-09  
**작성자**: Core Designer  
**목적**: core-coder에게 전달할 최종 handoff 문서 (구현 착수용)

**산출물**:
1. 디자인 스펙: `CONSULTANT_DASHBOARD_PHASE1_DESIGN_SPEC.md`
2. CSS 스펙: `CONSULTANT_DASHBOARD_PHASE1_CSS_SPEC.md`
3. 컴포넌트 스펙: `CONSULTANT_DASHBOARD_PHASE1_COMPONENT_SPEC.md`
4. 본 문서 (Handoff 요약)

---

## 0. 설계 완료 확인

### 0.1 펜슬 가이드 준수 체크리스트

- [x] **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`의 컴포넌트·색·간격만 사용
- [x] **색상**: 펜슬 팔레트 또는 `var(--mg-*)` 토큰만 사용, 하드코딩 금지
- [x] **레이아웃**: 사이드바 260px, 상단 바 56~64px, 본문 패딩 24~32px 준수
- [x] **섹션 블록**: 배경·테두리·radius·좌측 악센트 바로 구역 구분
- [x] **타이포**: Noto Sans KR, 제목/본문/라벨 크기·색상 일관성
- [x] **반응형**: 모바일~4K 브레이크포인트 검토 (특히 모바일 터치 44px)
- [x] **토큰 명시**: 스펙에 `var(--mg-*)` 또는 `mg-v2-*` 클래스명 명시
- [x] **재사용**: pencil-new.pen의 버튼·카드·네비 등 기존 컴포넌트 재사용

### 0.2 사용자 관점 (§0.4) 체크리스트

- [x] **사용성**: 상담사가 출근 직후 5분 이내에 핵심 정보 확인 가능
- [x] **1클릭 액션**: "바로 작성하기", "상세보기" 버튼 배치
- [x] **정보 노출 범위**: 민감 정보 최소화 (이름·회기·이슈 1줄)
- [x] **위험도·긴급 여부**: 색상·아이콘으로 명확히 표시
- [x] **우선순위 배치**: 준비·알림 상단, 통계 중단, 성과 하단
- [x] **조건부 렌더링**: 데이터 없으면 공간 효율화

---

## 1. Phase 1 컨텐츠 4개 요약

| 컨텐츠 | 목적 | 조건부 렌더링 | 우선순위 |
|--------|------|--------------|---------|
| **빠른 액션 바** | 자주 쓰는 동작 1클릭 접근 | 항상 표시 | 최상단 |
| **미작성 상담일지 알림** | 미작성 일지 알림 및 바로 작성 유도 | count > 0 | 상단 |
| **다음 상담 준비 카드** | 오늘/내일 상담 정보 표시 | 오늘/내일 상담 존재 | 상단 |
| **긴급 확인 필요 내담자** | 위험도 높은 내담자 알림 | clients.length > 0 | 중단 (통계 카드 아래) |

---

## 2. 구현 순서 (권장)

### 2.1 Phase 1-A (1주차) — API 개발 불필요

**1일차**: 빠른 액션 바
- 컴포넌트: `QuickActionBar.js`
- CSS: `.mg-v2-quick-action-bar`, `.mg-v2-btn-primary`, `.mg-v2-btn-outline`
- 작업: 버튼 4개 + 네비게이션 연결
- 예상 공수: 0.5일

**2일차**: 다음 상담 준비 카드
- 컴포넌트: `NextConsultationCard.js`, `InfoBlock.js`
- CSS: `.mg-v2-next-consultation-card`, `.mg-v2-info-block`, `.mg-v2-badge`
- API: 기존 `DASHBOARD_API.CONSULTANT_UPCOMING_SCHEDULES` 활용
- 작업: 오늘/내일 첫 번째 상담 필터링 + 정보 블록 3개 + 버튼 2개
- 예상 공수: 1일

### 2.2 Phase 1-B (2주차) — 신규 API 개발 필요

**3~4일차**: 미작성 상담일지 알림
- 백엔드 API: `GET /api/v1/consultants/{id}/incomplete-records`
  - Repository: `ScheduleRepository`, `ConsultationRecordRepository`
  - Service: `ConsultantStatsService.getIncompleteRecords()`
  - Controller: `ConsultantStatsController.getIncompleteRecords()`
- 컴포넌트: `IncompleteRecordsAlert.js`
- CSS: `.mg-v2-alert`, `.mg-v2-alert--warning`
- 예상 공수: 1일 (백엔드) + 0.5일 (프론트엔드)

**5~7일차**: 긴급 확인 필요 내담자
- 백엔드 API: `GET /api/v1/consultants/{id}/urgent-clients`
  - Repository: `ConsultationRecordRepository` (위험도·진행도 조회)
  - Service: `ConsultantStatsService.getUrgentClients()`
  - Controller: `ConsultantStatsController.getUrgentClients()`
- 컴포넌트: `UrgentClientsSection.js`, `UrgentClientCard.js`
- CSS: `.mg-v2-urgent-clients-section`, `.mg-v2-urgent-client-card`, `.mg-v2-badge--critical/high/medium`
- 예상 공수: 1.5일 (백엔드) + 1일 (프론트엔드)

### 2.3 총 예상 공수

| 작업 | 백엔드 | 프론트엔드 | 총 공수 |
|------|--------|-----------|---------|
| Phase 1-A | - | 1.5일 | 1.5일 |
| Phase 1-B | 2.5일 | 1.5일 | 4일 |
| **합계** | **2.5일** | **3일** | **5.5일** |

---

## 3. 파일 구조

### 3.1 프론트엔드 파일

```
frontend/src/components/dashboard-v2/consultant/
├── ConsultantDashboardV2.js (기존, 수정 필요)
├── ConsultantDashboard.css (기존, 확장 필요)
├── QuickActionBar.js (신규)
├── IncompleteRecordsAlert.js (신규)
├── NextConsultationCard.js (신규)
├── UrgentClientsSection.js (신규)
└── UrgentClientCard.js (신규)

frontend/src/components/dashboard-v2/molecules/
├── InfoBlock.js (신규, 재사용 가능)
└── Badge.js (기존 또는 신규)
```

### 3.2 백엔드 파일

```
src/main/java/com/coresolution/consultation/
├── controller/
│   └── ConsultantStatsController.java (신규 또는 기존 확장)
├── service/
│   ├── ConsultantStatsService.java (신규 인터페이스)
│   └── impl/
│       └── ConsultantStatsServiceImpl.java (신규 구현)
├── repository/
│   ├── ScheduleRepository.java (기존, 메서드 추가)
│   └── ConsultationRecordRepository.java (기존, 메서드 추가)
└── dto/
    ├── IncompleteRecordsResponse.java (신규)
    └── UrgentClientsResponse.java (신규)
```

---

## 4. API 명세 (신규 개발 필요)

### 4.1 미작성 상담일지 조회 API

**엔드포인트**: `GET /api/v1/consultants/{consultantId}/incomplete-records`

**요청**:
```
Path: consultantId (Long)
Header: tenantId (String, 필수)
```

**응답**:
```json
{
  "success": true,
  "data": {
    "count": 3,
    "schedules": [
      {
        "scheduleId": 123,
        "clientName": "홍길동",
        "consultationDate": "2026-03-08"
      },
      {
        "scheduleId": 124,
        "clientName": "김영희",
        "consultationDate": "2026-03-07"
      }
    ]
  }
}
```

**Repository 쿼리**:
```java
@Query("SELECT s FROM Schedule s " +
       "WHERE s.tenantId = :tenantId " +
       "AND s.consultantId = :consultantId " +
       "AND s.status = 'COMPLETED' " +
       "AND NOT EXISTS (" +
       "  SELECT cr FROM ConsultationRecord cr " +
       "  WHERE cr.scheduleId = s.id AND cr.isSessionCompleted = true" +
       ") " +
       "ORDER BY s.date DESC")
List<Schedule> findIncompleteRecords(
    @Param("tenantId") String tenantId,
    @Param("consultantId") Long consultantId
);
```

### 4.2 긴급 확인 필요 내담자 조회 API

**엔드포인트**: `GET /api/v1/consultants/{consultantId}/urgent-clients`

**요청**:
```
Path: consultantId (Long)
Header: tenantId (String, 필수)
```

**응답**:
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "clientId": 456,
        "clientName": "이철수",
        "sessionNumber": 5,
        "lastConsultationDate": "2026-03-05",
        "riskLevel": "HIGH",
        "mainIssue": "우울증 증상 악화"
      }
    ]
  }
}
```

**Repository 쿼리**:
```java
@Query("SELECT c.id, c.name, cr.sessionNumber, cr.sessionDate, cr.riskAssessment, cr.mainIssue " +
       "FROM Client c " +
       "JOIN ConsultationRecord cr ON c.id = cr.clientId " +
       "WHERE c.tenantId = :tenantId " +
       "AND cr.consultantId = :consultantId " +
       "AND (cr.riskAssessment IN ('HIGH', 'CRITICAL') " +
       "     OR cr.progressScore < (SELECT AVG(cr2.progressScore) FROM ConsultationRecord cr2 WHERE cr2.clientId = c.id) - 10) " +
       "ORDER BY cr.riskAssessment DESC, cr.sessionDate DESC")
List<Object[]> findUrgentClients(
    @Param("tenantId") String tenantId,
    @Param("consultantId") Long consultantId
);
```

---

## 5. 디자인 토큰 매핑 (필수 사용)

### 5.1 색상 토큰

| 용도 | 토큰명 | 색상 (참고) |
|------|--------|------------|
| 메인 배경 | `var(--mg-color-background-main)` | #FAF9F7 |
| 서페이스/카드 | `var(--mg-color-surface-main)` | #F5F3EF |
| 주조 (Primary) | `var(--mg-color-primary-main)` | #3D5246 |
| 주조 밝음 | `var(--mg-color-primary-light)` | #4A6354 |
| 보조 (Secondary) | `var(--mg-color-secondary-main)` | #6B7F72 |
| 포인트 (Accent) | `var(--mg-color-accent-main)` | #8B7355 |
| 본문 텍스트 | `var(--mg-color-text-main)` | #2C2C2C |
| 보조 텍스트 | `var(--mg-color-text-secondary)` | #5C6B61 |
| 테두리 | `var(--mg-color-border-main)` | #D4CFC8 |
| 경고 (Warning) | `var(--mg-color-warning-main)` | #F59E0B |
| 경고 밝음 | `var(--mg-color-warning-light)` | #FEF3C7 |
| 에러 (Error) | `var(--mg-color-error-main)` | #EF4444 |

### 5.2 간격 토큰

| 용도 | 값 |
|------|-----|
| 섹션 간격 | 24px |
| 카드 패딩 | 24px |
| 요소 간 간격 | 16px |
| 버튼 간격 | 12px |

### 5.3 radius 토큰

| 용도 | 값 |
|------|-----|
| 카드/섹션 | 16px |
| 버튼 | 10px |
| 배지 | 8px |
| 악센트 바 | 2px |

---

## 6. 반응형 브레이크포인트

| 브레이크포인트 | 최소 너비 | 레이아웃 변경 |
|--------------|----------|------------|
| 모바일 | 375px | flex-direction: column, 버튼 전체 너비, 정보 블록 1열 |
| 태블릿 | 768px | 정보 블록 2열, 버튼 2줄 배치 가능 |
| 데스크톱 | 1280px | 정보 블록 3열, 버튼 1줄 배치 |

**모바일 우선 고려사항**:
- 터치 영역: 최소 44px
- 버튼: 전체 너비 또는 flex: 1 1 auto
- 간격: gap 16px 유지
- 폰트: 본문 14px, 제목 16px (데스크톱과 동일)

---

## 7. 구현 체크리스트 (core-coder용)

### 7.1 프론트엔드 체크리스트

- [ ] **컴포넌트 생성**: QuickActionBar, IncompleteRecordsAlert, NextConsultationCard, UrgentClientsSection, UrgentClientCard, InfoBlock
- [ ] **CSS 작성**: `ConsultantDashboard.css`에 섹션 추가 (mg-v2-* 클래스)
- [ ] **디자인 토큰 사용**: `var(--mg-*)` 형식, 하드코딩 금지
- [ ] **PropTypes 정의**: 모든 props 타입 검증
- [ ] **조건부 렌더링**: count, consultation, clients 체크
- [ ] **이벤트 핸들러**: onClick, onNavigate 연결
- [ ] **접근성**: aria-label, role, tabIndex, onKeyPress
- [ ] **아이콘**: lucide-react 사용 (Zap, AlertTriangle, Calendar, FileText, Users, ChevronRight, AlertCircle)
- [ ] **반응형**: 모바일·태블릿·데스크톱 브레이크포인트 적용
- [ ] **로딩 상태**: Spinner 표시
- [ ] **에러 처리**: try-catch, 빈 데이터 처리
- [ ] **테스트**: 단위 테스트 작성

### 7.2 백엔드 체크리스트

- [ ] **Repository 메서드**: `findIncompleteRecords()`, `findUrgentClients()` 추가
- [ ] **Service 생성**: `ConsultantStatsService` 인터페이스 + 구현
- [ ] **Controller 엔드포인트**: `GET /api/v1/consultants/{id}/incomplete-records`, `GET /api/v1/consultants/{id}/urgent-clients`
- [ ] **DTO 클래스**: `IncompleteRecordsResponse`, `UrgentClientsResponse`
- [ ] **tenantId 필터링**: 모든 쿼리에 tenantId 조건 필수
- [ ] **TenantContextHolder**: 컨트롤러에서 tenantId 검증
- [ ] **에러 처리**: 400 Bad Request (tenantId 없음), 404 Not Found (데이터 없음)
- [ ] **단위 테스트**: Service, Repository 테스트 작성
- [ ] **통합 테스트**: Controller 테스트 작성

### 7.3 통합 작업 체크리스트

- [ ] **API 연동**: `constants/api.js`에 새 엔드포인트 추가
- [ ] **StandardizedApi 사용**: 프론트엔드 API 호출 시 필수
- [ ] **병렬 API 호출**: Promise.all로 성능 최적화
- [ ] **캐싱 전략**: Redis 캐싱 적용 (선택, 성능 개선 시)
- [ ] **로그 추가**: 백엔드 Service 레이어에 로그 추가
- [ ] **문서화**: API 명세서 업데이트 (Swagger 또는 README)

---

## 8. 디자인 검증 (구현 후)

### 8.1 비주얼 일관성 체크

- [ ] 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)과 동일한 톤·구조
- [ ] 색상: 펜슬 팔레트 또는 `var(--mg-*)` 토큰만 사용
- [ ] 타이포: Noto Sans KR, 제목/본문/라벨 크기·색상 일관성
- [ ] 섹션 블록: 배경·테두리·radius·좌측 악센트 바
- [ ] 버튼: 주조(Primary), 아웃라인(Outline), 고스트(Ghost) 스타일 일관성

### 8.2 기능 테스트

- [ ] 빠른 액션 바: 버튼 4개 클릭 시 올바른 페이지로 이동
- [ ] 미작성 상담일지 알림: count > 0일 때만 표시, "바로 작성하기" 클릭 시 필터링된 목록 표시
- [ ] 다음 상담 준비 카드: 오늘/내일 상담 표시, "이전 일지 보기"/"상세보기" 클릭 시 올바른 페이지로 이동
- [ ] 긴급 확인 필요 내담자: 위험도 HIGH/CRITICAL 내담자 표시, 카드 클릭 시 상세 페이지로 이동

### 8.3 반응형 테스트

- [ ] 모바일 (375px): 버튼 전체 너비, 정보 블록 1열, 카드 세로 배치
- [ ] 태블릿 (768px): 정보 블록 2열, 버튼 2줄 배치
- [ ] 데스크톱 (1280px): 정보 블록 3열, 버튼 1줄 배치
- [ ] 터치 영역: 최소 44px (모바일)

### 8.4 접근성 테스트

- [ ] 키보드 네비게이션: Tab 키로 모든 버튼·카드 접근 가능
- [ ] 포커스 스타일: focus-visible 적용 (outline 2px)
- [ ] 스크린 리더: aria-label, role 적용
- [ ] 색상 대비: WCAG AA 기준 충족 (4.5:1 이상)

---

## 9. 다음 단계

1. **core-coder에게 전달**: 본 handoff 문서 + 3개 스펙 문서 전달
2. **Phase 1-A 구현**: 빠른 액션 바 + 다음 상담 준비 카드 (1주차)
3. **Phase 1-B 구현**: 미작성 일지 알림 + 긴급 내담자 (2주차)
4. **디자인 검증**: 구현 후 core-designer가 비주얼 일관성 확인
5. **사용자 테스트**: 상담사 피드백 수집 후 개선
6. **Phase 2 기획**: 사용자 피드백 기반 추가 컨텐츠 설계

---

## 10. 참조 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| 디자인 스펙 | `docs/design-system/v2/CONSULTANT_DASHBOARD_PHASE1_DESIGN_SPEC.md` | 레이아웃·블록 구성·시각적 강조 규칙 |
| CSS 스펙 | `docs/design-system/v2/CONSULTANT_DASHBOARD_PHASE1_CSS_SPEC.md` | CSS 클래스·토큰·반응형 스타일 |
| 컴포넌트 스펙 | `docs/design-system/v2/CONSULTANT_DASHBOARD_PHASE1_COMPONENT_SPEC.md` | React 컴포넌트 구조·Props·상태 관리 |
| 펜슬 가이드 | `docs/design-system/PENCIL_DESIGN_GUIDE.md` | 디자이너 필수 숙지 (색상·레이아웃·타이포) |
| 기획 분석 | `docs/analysis/CONSULTANT_DASHBOARD_CONTENT_ENHANCEMENT_ANALYSIS.md` | 기술 분석·API 설계·구현 전략 |
| 디자인 토큰 | `frontend/src/styles/unified-design-tokens.css` | 토큰 목록 (참고만, 수정 금지) |

---

## 11. 연락처 및 지원

**디자인 관련 문의**: core-designer  
**백엔드 구현 문의**: core-coder (백엔드 담당)  
**프론트엔드 구현 문의**: core-coder (프론트엔드 담당)  
**기획 관련 문의**: core-planner

**Slack 채널**: #mindgarden-dashboard  
**이슈 트래킹**: GitHub Issues (mindGarden 레포지토리)

---

**Handoff 완료**. core-coder가 본 문서와 3개 스펙 문서를 기반으로 구현을 시작할 수 있습니다.
