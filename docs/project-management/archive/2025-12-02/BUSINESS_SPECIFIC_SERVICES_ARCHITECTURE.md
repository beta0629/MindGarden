# 업종별 특화 서비스 아키텍처

**작성일**: 2025-12-02  
**버전**: 1.0.0  
**목적**: 각 비즈니스 타입별 특화 서비스 존재 문제 해결

---

## 🎯 핵심 문제

> **"문제는 각 비즈니스타입별로 특화 서비스가 존재한다는거야"**

### 현재 상황

각 업종마다 **완전히 다른 비즈니스 로직**이 필요합니다:

| 업종 | 특화 서비스 | 공통 서비스로 대체 불가 이유 |
|-----|------------|---------------------------|
| **상담소** | `SessionManagementService` (회기 관리) | 회기 번호, 상담 목표, 진행 단계 추적 |
| **학원** | `AttendanceService` (출결 관리) | QR코드, 생체인식, 학부모 알림 |
| **학원** | `GradeManagementService` (성적 관리) | 과목별 점수, 석차, 성적표 생성 |
| **학원** | `ParentNotificationService` (학부모 알림) | 자녀별 알림, 동의 관리 |
| **병원** | `PrescriptionService` (처방전 관리) | 약품 코드, 용법, 보험 청구 |
| **병원** | `MedicalRecordService` (진료기록) | 의료법 준수, EMR 표준 |
| **요식업** | `MenuManagementService` (메뉴 관리) | 재료, 레시피, 알레르기 정보 |
| **요식업** | `TableManagementService` (테이블 관리) | 좌석 배치, 예약, 회전율 |
| **요식업** | `POSIntegrationService` (POS 연동) | 주문, 결제, 재고 연동 |

---

## 📊 업종별 특화 서비스 상세 분석

### 1. 상담소 (CONSULTATION) - 7개 특화 서비스

#### A. SessionManagementService (회기 관리) ⭐ 핵심
**비즈니스 로직**:
```java
@Service
public class SessionManagementService {
    
    /**
     * 회기 번호 자동 증가
     * 예: 1회기 → 2회기 → 3회기
     */
    public ConsultationRecord createNextSession(Long mappingId) {
        int currentSessionNumber = getCurrentSessionNumber(mappingId);
        int nextSessionNumber = currentSessionNumber + 1;
        
        // 회기별 목표 설정
        String sessionGoal = determineSessionGoal(nextSessionNumber);
        
        return ConsultationRecord.builder()
                .sessionNumber(nextSessionNumber)
                .sessionGoal(sessionGoal)
                .build();
    }
    
    /**
     * 회기별 목표 자동 설정
     * 초기(1-3회기): 사정 및 관계 형성
     * 중기(4-8회기): 문제 해결 및 개입
     * 종결(9회기~): 종결 준비 및 사후 관리
     */
    private String determineSessionGoal(int sessionNumber) {
        if (sessionNumber <= 3) {
            return "사정 및 관계 형성";
        } else if (sessionNumber <= 8) {
            return "문제 해결 및 개입";
        } else {
            return "종결 준비 및 사후 관리";
        }
    }
}
```

**왜 공통화 불가?**
- 회기 개념은 상담소 고유
- 학원/병원/요식업에는 "회기"가 없음
- 상담 진행 단계 추적 로직이 복잡

#### B. QualityEvaluationService (품질 평가)
**비즈니스 로직**:
```java
/**
 * 상담 품질 평가 (슈퍼비전)
 * - 상담사 자가 평가
 * - 슈퍼바이저 평가
 * - 내담자 만족도
 */
public QualityEvaluation evaluateSession(Long sessionId) {
    // 상담 기록 분석
    // 목표 달성도 평가
    // 개선 사항 도출
}
```

#### C. ConsultantRatingService (상담사 평점)
**비즈니스 로직**:
```java
/**
 * 상담사 평점 계산
 * - 내담자 만족도
 * - 상담 완료율
 * - 재상담 비율
 */
public double calculateConsultantRating(Long consultantId) {
    // 복잡한 가중치 계산
}
```

---

### 2. 학원 (ACADEMY) - 9개 특화 서비스

#### A. AttendanceService (출결 관리) ⭐ 핵심
**비즈니스 로직**:
```java
@Service
public class AttendanceService {
    
    /**
     * QR 코드 출석 체크
     */
    public Attendance checkInWithQR(String qrCode) {
        // QR 코드 검증
        // 학생 정보 추출
        // 출석 시간 기록
        // 학부모 알림 발송
    }
    
    /**
     * 생체인식 출석 체크
     */
    public Attendance checkInWithBiometric(byte[] biometricData) {
        // 지문/얼굴 인식
        // 학생 매칭
        // 출석 기록
    }
    
    /**
     * 출석률 계산
     */
    public AttendanceRate calculateAttendanceRate(Long studentId, LocalDate startDate, LocalDate endDate) {
        int totalDays = getTotalClassDays(studentId, startDate, endDate);
        int presentDays = getPresentDays(studentId, startDate, endDate);
        int lateDays = getLateDays(studentId, startDate, endDate);
        
        double attendanceRate = (presentDays + (lateDays * 0.5)) / totalDays * 100;
        
        return AttendanceRate.builder()
                .totalDays(totalDays)
                .presentDays(presentDays)
                .lateDays(lateDays)
                .rate(attendanceRate)
                .build();
    }
    
    /**
     * 학부모 알림 발송
     */
    public void notifyParent(Attendance attendance) {
        Student student = getStudent(attendance.getStudentId());
        Parent parent = getParent(student.getParentId());
        
        String message = String.format(
            "[%s] %s 학생이 %s %s에 %s하였습니다.",
            student.getAcademyName(),
            student.getName(),
            attendance.getDate(),
            attendance.getTime(),
            attendance.getStatus().getDescription()
        );
        
        // 푸시 알림
        sendPushNotification(parent.getDeviceToken(), message);
        
        // SMS (설정된 경우)
        if (parent.isSmsEnabled()) {
            sendSMS(parent.getPhoneNumber(), message);
        }
        
        // 카카오톡 (설정된 경우)
        if (parent.isKakaoEnabled()) {
            sendKakaoMessage(parent.getKakaoId(), message);
        }
    }
}
```

**왜 공통화 불가?**
- QR코드/생체인식은 학원 특화
- 상담소는 예약제, 병원은 진료 예약
- 학부모 알림은 학원만 필요

#### B. GradeManagementService (성적 관리) ⭐ 핵심
**비즈니스 로직**:
```java
@Service
public class GradeManagementService {
    
    /**
     * 성적 입력
     */
    public Grade createGrade(GradeDto dto) {
        // 과목별 점수 입력
        // 석차 자동 계산
        // 평균 계산
        // 학부모 알림
    }
    
    /**
     * 석차 계산
     */
    public int calculateRank(Long studentId, Long examId) {
        List<Grade> allGrades = gradeRepository.findByExamId(examId);
        
        // 총점 기준 정렬
        allGrades.sort((g1, g2) -> 
            Double.compare(g2.getTotalScore(), g1.getTotalScore())
        );
        
        // 석차 반환
        for (int i = 0; i < allGrades.size(); i++) {
            if (allGrades.get(i).getStudentId().equals(studentId)) {
                return i + 1;
            }
        }
        
        return -1;
    }
    
    /**
     * 성적표 생성
     */
    public ReportCard generateReportCard(Long studentId, String semester) {
        // 과목별 성적 조회
        // 출석률 조회
        // 선생님 코멘트 조회
        // PDF 생성
    }
}
```

#### C. ParentNotificationService (학부모 알림) ⭐ 핵심
**비즈니스 로직**:
```java
@Service
public class ParentNotificationService {
    
    /**
     * 자녀별 알림 발송
     */
    public void notifyParentAboutChild(Long parentId, Long studentId, String message) {
        // 학부모-자녀 관계 확인
        // 알림 동의 확인
        // 채널별 발송 (푸시/SMS/카카오)
    }
    
    /**
     * 일괄 알림 발송 (학원 공지)
     */
    public void broadcastToParents(Long academyId, String message) {
        // 학원의 모든 학부모 조회
        // 알림 동의한 학부모만 필터링
        // 일괄 발송
    }
}
```

#### D. CourseManagementService (과정 관리)
**비즈니스 로직**:
```java
/**
 * 과정(Course) 관리
 * - 커리큘럼 설정
 * - 교재 관리
 * - 진도 관리
 */
```

#### E. ClassScheduleService (수업 일정)
**비즈니스 로직**:
```java
/**
 * 수업 시간표 관리
 * - 정기 수업 스케줄
 * - 보강 수업
 * - 휴강 관리
 */
```

---

### 3. 병원 (HOSPITAL) - 8개 특화 서비스

#### A. PrescriptionService (처방전 관리) ⭐ 핵심
**비즈니스 로직**:
```java
@Service
public class PrescriptionService {
    
    /**
     * 처방전 생성
     */
    public Prescription createPrescription(PrescriptionDto dto) {
        // 약품 코드 검증 (표준 코드)
        // 용법 설정
        // 투약 일수 계산
        // 보험 청구 코드 생성
        // 약국 전송
    }
    
    /**
     * 약물 상호작용 체크
     */
    public List<DrugInteraction> checkDrugInteractions(List<String> drugCodes) {
        // 약물 데이터베이스 조회
        // 상호작용 검사
        // 경고 생성
    }
    
    /**
     * 보험 청구
     */
    public InsuranceClaim createInsuranceClaim(Long prescriptionId) {
        // 처방 내역 조회
        // 보험 코드 매핑
        // 청구서 생성
        // 심평원 전송
    }
}
```

**왜 공통화 불가?**
- 약품 코드는 의료 표준 (KCD, EDI 코드)
- 보험 청구는 병원만 필요
- 약물 상호작용 체크는 의료 전문 로직

#### B. MedicalRecordService (진료기록) ⭐ 핵심
**비즈니스 로직**:
```java
@Service
public class MedicalRecordService {
    
    /**
     * 진료기록 작성 (EMR 표준)
     */
    public MedicalRecord createMedicalRecord(MedicalRecordDto dto) {
        // 주호소(Chief Complaint)
        // 현병력(Present Illness)
        // 과거력(Past History)
        // 가족력(Family History)
        // 진단명(Diagnosis) - ICD-10 코드
        // 처치(Treatment)
        // 처방(Prescription)
    }
    
    /**
     * 의료법 준수 체크
     */
    public void validateMedicalLaw(MedicalRecord record) {
        // 필수 항목 체크
        // 의사 면허 확인
        // 서명 확인
        // 보관 기간 설정 (10년)
    }
}
```

#### C. AppointmentService (진료 예약)
**비즈니스 로직**:
```java
/**
 * 진료 예약 관리
 * - 진료과별 예약
 * - 의사별 예약
 * - 응급 예약
 * - 예약 대기
 */
```

#### D. InsuranceClaimService (보험 청구)
**비즈니스 로직**:
```java
/**
 * 의료보험 청구
 * - 건강보험 청구
 * - 실손보험 청구
 * - 청구 심사
 * - 지급 확인
 */
```

---

### 4. 요식업 (FOOD_SERVICE) - 7개 특화 서비스

#### A. MenuManagementService (메뉴 관리) ⭐ 핵심
**비즈니스 로직**:
```java
@Service
public class MenuManagementService {
    
    /**
     * 메뉴 생성
     */
    public Menu createMenu(MenuDto dto) {
        // 메뉴명, 가격
        // 재료 목록
        // 레시피
        // 알레르기 정보
        // 영양 정보
        // 이미지
    }
    
    /**
     * 재료 원가 계산
     */
    public BigDecimal calculateIngredientCost(Long menuId) {
        List<Ingredient> ingredients = getIngredients(menuId);
        
        return ingredients.stream()
                .map(ing -> ing.getUnitPrice().multiply(ing.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    /**
     * 알레르기 정보 표시
     */
    public List<Allergen> getAllergens(Long menuId) {
        // 재료별 알레르기 정보 조회
        // 법적 표시 의무 항목 체크
        // 고객 알레르기 정보와 매칭
    }
}
```

#### B. TableManagementService (테이블 관리) ⭐ 핵심
**비즈니스 로직**:
```java
@Service
public class TableManagementService {
    
    /**
     * 테이블 배치도 관리
     */
    public TableLayout createTableLayout(TableLayoutDto dto) {
        // 좌석 배치
        // 테이블 번호
        // 수용 인원
        // 예약 가능 여부
    }
    
    /**
     * 테이블 상태 관리
     */
    public void updateTableStatus(Long tableId, TableStatus status) {
        // AVAILABLE (이용 가능)
        // OCCUPIED (사용 중)
        // RESERVED (예약됨)
        // CLEANING (정리 중)
    }
    
    /**
     * 테이블 회전율 계산
     */
    public double calculateTurnoverRate(LocalDate date) {
        int totalTables = getTotalTables();
        int totalSessions = getTotalSessions(date);
        int operatingHours = getOperatingHours(date);
        
        return (double) totalSessions / (totalTables * operatingHours);
    }
}
```

#### C. POSIntegrationService (POS 연동) ⭐ 핵심
**비즈니스 로직**:
```java
@Service
public class POSIntegrationService {
    
    /**
     * 주문 전송
     */
    public void sendOrderToPOS(Order order) {
        // POS 시스템 API 호출
        // 주문 항목 전송
        // 주방 프린터 출력
        // 재고 차감
    }
    
    /**
     * 결제 처리
     */
    public Payment processPayment(PaymentDto dto) {
        // POS 결제 단말기 연동
        // 카드/현금/간편결제
        // 영수증 발행
        // 매출 집계
    }
    
    /**
     * 재고 연동
     */
    public void syncInventory() {
        // POS 재고 조회
        // MindGarden 재고 업데이트
        // 발주 알림
    }
}
```

#### D. InventoryManagementService (재고 관리)
**비즈니스 로직**:
```java
/**
 * 재고 관리
 * - 입고/출고
 * - 재고 실사
 * - 유통기한 관리
 * - 발주 자동화
 */
```

---

## 🏗️ 해결 방안: 3-Layer 아키텍처

### 문제 재정의

**공통 추상화만으로는 부족합니다!**
- `ServiceProvider`, `ServiceReceiver`, `ServiceSession`은 **기본 CRUD만 가능**
- 업종별 **복잡한 비즈니스 로직**은 추상화 불가

### 제안: 3-Layer 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│         Layer 1: 공통 추상화 레이어 (Common)             │
│  - ServiceProvider, ServiceReceiver, ServiceSession     │
│  - 기본 CRUD, 검색, 통계                                 │
│  - 모든 업종이 공유                                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│         Layer 2: 업종 특화 서비스 레이어 (Specific)      │
│  - ConsultationSpecificService                          │
│  - AcademySpecificService                               │
│  - HospitalSpecificService                              │
│  - RestaurantSpecificService                            │
│  - 업종별 비즈니스 로직                                  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│         Layer 3: 통합 번들 레이어 (Bundle)               │
│  - ConsultationBundle (Layer 1 + Layer 2 통합)          │
│  - AcademyBundle (Layer 1 + Layer 2 통합)               │
│  - 단일 API로 모든 데이터 제공                           │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 구현 예시

### Layer 1: 공통 추상화 (기본 CRUD)

```java
// 공통 인터페이스
public interface ServiceProvider {
    String getProviderId();
    String getProviderType();
    String getName();
    String getSpecialty();
}

// 공통 서비스
@Service
public class CommonProviderService {
    
    // 기본 CRUD
    public ServiceProvider create(ServiceProvider provider) { ... }
    public ServiceProvider findById(String providerId) { ... }
    public List<ServiceProvider> findAll(String tenantId) { ... }
    public void delete(String providerId) { ... }
    
    // 기본 통계
    public long count(String tenantId) { ... }
    public List<ServiceProvider> findByType(String tenantId, String type) { ... }
}
```

---

### Layer 2: 업종 특화 서비스

#### 상담소 특화
```java
@Service
@RequireBusinessType("CONSULTATION")
public class ConsultationSpecificService {
    
    @Autowired
    private CommonProviderService commonProviderService;  // Layer 1 사용
    
    /**
     * 회기 관리 (상담소 전용)
     */
    public ConsultationRecord createNextSession(Long mappingId) {
        int currentSessionNumber = getCurrentSessionNumber(mappingId);
        int nextSessionNumber = currentSessionNumber + 1;
        String sessionGoal = determineSessionGoal(nextSessionNumber);
        
        return ConsultationRecord.builder()
                .sessionNumber(nextSessionNumber)
                .sessionGoal(sessionGoal)
                .build();
    }
    
    /**
     * 품질 평가 (상담소 전용)
     */
    public QualityEvaluation evaluateSession(Long sessionId) {
        // 상담 품질 평가 로직
    }
    
    /**
     * 상담사 평점 (상담소 전용)
     */
    public double calculateConsultantRating(Long consultantId) {
        // 평점 계산 로직
    }
}
```

#### 학원 특화
```java
@Service
@RequireBusinessType("ACADEMY")
public class AcademySpecificService {
    
    @Autowired
    private CommonProviderService commonProviderService;  // Layer 1 사용
    
    /**
     * 출결 관리 (학원 전용)
     */
    public Attendance checkInWithQR(String qrCode) {
        // QR 코드 출석 체크
        // 학부모 알림 발송
    }
    
    /**
     * 성적 관리 (학원 전용)
     */
    public Grade createGrade(GradeDto dto) {
        // 성적 입력
        // 석차 계산
        // 학부모 알림
    }
    
    /**
     * 학부모 알림 (학원 전용)
     */
    public void notifyParent(Long parentId, String message) {
        // 푸시/SMS/카카오 알림
    }
}
```

#### 병원 특화
```java
@Service
@RequireBusinessType("HOSPITAL")
public class HospitalSpecificService {
    
    @Autowired
    private CommonProviderService commonProviderService;  // Layer 1 사용
    
    /**
     * 처방전 관리 (병원 전용)
     */
    public Prescription createPrescription(PrescriptionDto dto) {
        // 약품 코드 검증
        // 용법 설정
        // 보험 청구
    }
    
    /**
     * 진료기록 (병원 전용)
     */
    public MedicalRecord createMedicalRecord(MedicalRecordDto dto) {
        // EMR 표준 준수
        // 의료법 체크
    }
    
    /**
     * 보험 청구 (병원 전용)
     */
    public InsuranceClaim createInsuranceClaim(Long prescriptionId) {
        // 보험 코드 매핑
        // 심평원 전송
    }
}
```

---

### Layer 3: 통합 번들 (API 통합)

```java
@RestController
@RequestMapping("/api/bundle")
public class BusinessBundleController {
    
    @Autowired
    private Map<String, BusinessBundleService> bundleServices;
    
    @GetMapping("/core-stats")
    public ApiResponse<CoreStatsDTO> getCoreStats(@RequestParam String tenantId) {
        String businessType = tenantService.getBusinessType(tenantId);
        BusinessBundleService service = bundleServices.get(businessType.toLowerCase() + "BundleService");
        
        CoreStatsDTO stats = service.getCoreStats(tenantId);
        return ApiResponse.success(stats);
    }
    
    @GetMapping("/specific-features")
    public ApiResponse<Map<String, Object>> getSpecificFeatures(@RequestParam String tenantId) {
        String businessType = tenantService.getBusinessType(tenantId);
        
        Map<String, Object> features = new HashMap<>();
        
        switch (businessType) {
            case "CONSULTATION":
                // 상담소 특화 데이터
                features.put("sessions", consultationSpecificService.getRecentSessions(tenantId));
                features.put("qualityEvaluations", consultationSpecificService.getQualityEvaluations(tenantId));
                features.put("consultantRatings", consultationSpecificService.getConsultantRatings(tenantId));
                break;
                
            case "ACADEMY":
                // 학원 특화 데이터
                features.put("attendances", academySpecificService.getTodayAttendances(tenantId));
                features.put("grades", academySpecificService.getRecentGrades(tenantId));
                features.put("parentNotifications", academySpecificService.getParentNotifications(tenantId));
                break;
                
            case "HOSPITAL":
                // 병원 특화 데이터
                features.put("prescriptions", hospitalSpecificService.getRecentPrescriptions(tenantId));
                features.put("medicalRecords", hospitalSpecificService.getRecentMedicalRecords(tenantId));
                features.put("insuranceClaims", hospitalSpecificService.getPendingClaims(tenantId));
                break;
                
            case "FOOD_SERVICE":
                // 요식업 특화 데이터
                features.put("menus", restaurantSpecificService.getMenus(tenantId));
                features.put("tables", restaurantSpecificService.getTableStatus(tenantId));
                features.put("orders", restaurantSpecificService.getTodayOrders(tenantId));
                break;
        }
        
        return ApiResponse.success(features);
    }
}
```

---

## 📊 최종 아키텍처

### 전체 구조

```
프론트엔드
    ↓
BusinessBundleController (단일 API)
    ├─ GET /api/bundle/core-stats (공통 통계)
    └─ GET /api/bundle/specific-features (업종 특화)
    ↓
┌─────────────────────────────────────────────────────────┐
│         ConsultationBundleService                       │
│  - Layer 1: CommonProviderService (공통 CRUD)           │
│  - Layer 2: ConsultationSpecificService (회기, 평가)    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│         AcademyBundleService                            │
│  - Layer 1: CommonProviderService (공통 CRUD)           │
│  - Layer 2: AcademySpecificService (출결, 성적, 학부모)  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│         HospitalBundleService                           │
│  - Layer 1: CommonProviderService (공통 CRUD)           │
│  - Layer 2: HospitalSpecificService (처방, 진료, 보험)   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 핵심 원칙

### 1. 공통화 가능한 것 vs 불가능한 것

| 기능 | 공통화 가능? | 이유 |
|-----|------------|------|
| **기본 CRUD** | ✅ 가능 | 모든 업종 동일 |
| **검색/필터** | ✅ 가능 | 모든 업종 동일 |
| **통계 (개수)** | ✅ 가능 | 모든 업종 동일 |
| **회기 관리** | ❌ 불가능 | 상담소만 필요 |
| **출결 관리** | ❌ 불가능 | 학원만 필요 |
| **처방전 관리** | ❌ 불가능 | 병원만 필요 |
| **테이블 관리** | ❌ 불가능 | 요식업만 필요 |

### 2. 3-Layer 분리 원칙

**Layer 1 (공통)**: 모든 업종이 100% 동일하게 사용
**Layer 2 (특화)**: 업종별로 완전히 다른 로직
**Layer 3 (번들)**: Layer 1 + Layer 2를 통합하여 단일 API 제공

### 3. 확장 전략

**새 업종 추가 시**:
1. Layer 1: 그대로 사용 (수정 불필요)
2. Layer 2: 새 업종 특화 서비스 추가
3. Layer 3: 번들 서비스 추가

**예시**: 피트니스 센터 추가
```java
@Service
@RequireBusinessType("FITNESS")
public class FitnessSpecificService {
    
    /**
     * 운동 프로그램 관리 (피트니스 전용)
     */
    public WorkoutProgram createProgram(WorkoutProgramDto dto) { ... }
    
    /**
     * 체성분 측정 (피트니스 전용)
     */
    public BodyComposition measureBodyComposition(Long memberId) { ... }
    
    /**
     * PT 세션 관리 (피트니스 전용)
     */
    public PTSession createPTSession(PTSessionDto dto) { ... }
}
```

---

## 📝 결론

### 핵심 인사이트

> **"각 비즈니스타입별로 특화 서비스가 존재한다"** → **정확한 문제 정의!**

### 해결 방안

1. ✅ **공통 추상화 레이어** (Layer 1)
   - 기본 CRUD, 검색, 통계
   - 모든 업종 공유

2. ✅ **업종 특화 서비스 레이어** (Layer 2)
   - 상담소: 회기, 품질 평가
   - 학원: 출결, 성적, 학부모 알림
   - 병원: 처방, 진료, 보험
   - 요식업: 메뉴, 테이블, POS

3. ✅ **통합 번들 레이어** (Layer 3)
   - Layer 1 + Layer 2 통합
   - 단일 API로 제공
   - 성능 최적화

### 기대 효과

- ✅ **공통 로직 재사용**: 80% 코드 중복 제거
- ✅ **업종별 유연성**: 특화 서비스 독립 관리
- ✅ **확장성**: 새 업종 추가 용이
- ✅ **성능**: API 호출 70% 감소

---

**최종 업데이트**: 2025-12-02  
**작성자**: CoreSolution Team  
**상태**: ✅ 분석 완료

---

## 📎 관련 문서

1. [상담소 위젯 의존성 분석](./CONSULTATION_CENTER_WIDGET_DEPENDENCY_ANALYSIS.md)
2. [멀티 비즈니스 타입 시스템 재설계](./MULTI_BUSINESS_TYPE_SYSTEM_REDESIGN.md)
3. [통합 개선 계획서](./INTEGRATED_IMPROVEMENT_PLAN.md)

