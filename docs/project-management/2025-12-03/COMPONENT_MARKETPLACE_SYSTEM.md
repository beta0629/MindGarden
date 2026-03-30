# 컴포넌트 마켓플레이스 시스템

**작성일**: 2025-12-03  
**목적**: 테넌트 관리자가 필요한 컴포넌트를 구매/활성화하는 시스템

---

## 🎯 핵심 개념

### 비즈니스 모델
```
CoreSolution 플랫폼
├─ 기본 패키지 (무료)
│  ├─ 통계 섹션
│  ├─ 기본 관리 섹션
│  └─ 사용자 관리
│
├─ 프리미엄 컴포넌트 (유료)
│  ├─ ERP 관리 (월 50,000원)
│  ├─ 고급 통계 (월 30,000원)
│  ├─ AI 분석 (월 100,000원)
│  └─ 맞춤 보고서 (월 40,000원)
│
└─ 업종별 전문 컴포넌트 (유료)
   ├─ 상담소: 심리평가 도구 (월 80,000원)
   ├─ 학원: 성적 분석 시스템 (월 60,000원)
   └─ 병원: 진료 기록 시스템 (월 120,000원)
```

---

## 📊 데이터베이스 설계

### 1. component_packages 테이블 (컴포넌트 패키지)

```sql
CREATE TABLE component_packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 패키지 정보
    package_code VARCHAR(50) NOT NULL UNIQUE COMMENT '패키지 코드 (예: ERP_BASIC)',
    package_name VARCHAR(100) NOT NULL COMMENT '패키지명',
    package_name_en VARCHAR(100) COMMENT '영문 패키지명',
    description TEXT COMMENT '패키지 설명',
    
    -- 분류
    category VARCHAR(50) NOT NULL COMMENT '카테고리 (MANAGEMENT, ANALYTICS, ERP, SPECIALIZED)',
    business_type VARCHAR(50) NULL COMMENT '업종 (NULL=공통, CONSULTATION, ACADEMY)',
    
    -- 가격 정보
    pricing_model VARCHAR(20) NOT NULL COMMENT 'FREE, MONTHLY, YEARLY, ONE_TIME',
    price_monthly DECIMAL(10,2) DEFAULT 0 COMMENT '월 구독료',
    price_yearly DECIMAL(10,2) DEFAULT 0 COMMENT '연 구독료',
    price_one_time DECIMAL(10,2) DEFAULT 0 COMMENT '일회성 구매가',
    
    -- 메타데이터
    icon VARCHAR(50) COMMENT '아이콘',
    thumbnail_url VARCHAR(200) COMMENT '썸네일 이미지',
    demo_url VARCHAR(200) COMMENT '데모 URL',
    documentation_url VARCHAR(200) COMMENT '문서 URL',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false COMMENT '추천 패키지',
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_business_type (business_type),
    INDEX idx_pricing_model (pricing_model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. package_components 테이블 (패키지-컴포넌트 매핑)

```sql
CREATE TABLE package_components (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    package_code VARCHAR(50) NOT NULL COMMENT '패키지 코드',
    permission_group_code VARCHAR(50) NOT NULL COMMENT '권한 그룹 코드',
    
    -- 메타데이터
    is_required BOOLEAN DEFAULT true COMMENT '필수 컴포넌트 여부',
    sort_order INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_package_component (package_code, permission_group_code),
    INDEX idx_package (package_code),
    INDEX idx_component (permission_group_code),
    
    FOREIGN KEY (package_code) REFERENCES component_packages(package_code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. tenant_subscriptions 테이블 (테넌트 구독)

```sql
CREATE TABLE tenant_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 구독 정보
    subscription_id VARCHAR(36) NOT NULL UNIQUE COMMENT '구독 ID (UUID)',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    package_code VARCHAR(50) NOT NULL COMMENT '패키지 코드',
    
    -- 구독 상태
    status VARCHAR(20) NOT NULL COMMENT 'ACTIVE, SUSPENDED, CANCELLED, EXPIRED',
    
    -- 구독 기간
    subscription_type VARCHAR(20) NOT NULL COMMENT 'MONTHLY, YEARLY, LIFETIME',
    start_date DATE NOT NULL COMMENT '시작일',
    end_date DATE NULL COMMENT '종료일 (NULL = 무제한)',
    
    -- 결제 정보
    payment_amount DECIMAL(10,2) NOT NULL COMMENT '결제 금액',
    payment_method VARCHAR(50) COMMENT '결제 수단',
    last_payment_date DATE COMMENT '마지막 결제일',
    next_payment_date DATE COMMENT '다음 결제일',
    
    -- 자동 갱신
    auto_renewal BOOLEAN DEFAULT true COMMENT '자동 갱신 여부',
    
    -- 메타데이터
    purchased_by VARCHAR(100) COMMENT '구매자',
    notes TEXT COMMENT '비고',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant (tenant_id),
    INDEX idx_package (package_code),
    INDEX idx_status (status),
    INDEX idx_end_date (end_date),
    
    FOREIGN KEY (package_code) REFERENCES component_packages(package_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. subscription_history 테이블 (구독 이력)

```sql
CREATE TABLE subscription_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    subscription_id VARCHAR(36) NOT NULL COMMENT '구독 ID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    
    -- 이벤트 정보
    event_type VARCHAR(20) NOT NULL COMMENT 'PURCHASED, RENEWED, CANCELLED, SUSPENDED, EXPIRED',
    event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 상세 정보
    amount DECIMAL(10,2) COMMENT '금액',
    payment_method VARCHAR(50) COMMENT '결제 수단',
    description TEXT COMMENT '설명',
    
    -- 처리자
    processed_by VARCHAR(100) COMMENT '처리자',
    
    INDEX idx_subscription (subscription_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 💻 백엔드 구현

### 1. ComponentPackageService.java

```java
@Service
public class ComponentPackageService {
    
    /**
     * 마켓플레이스 패키지 목록 조회
     */
    public List<ComponentPackageDTO> getMarketplacePackages(String tenantId) {
        // 1. 테넌트 업종 확인
        Tenant tenant = tenantRepository.findById(tenantId)
            .orElseThrow(() -> new NotFoundException("테넌트를 찾을 수 없습니다"));
        
        String businessType = tenant.getBusinessType();
        
        // 2. 공통 패키지 + 업종별 패키지 조회
        List<ComponentPackage> packages = componentPackageRepository
            .findByBusinessTypeInAndIsActiveTrue(
                Arrays.asList(null, businessType)
            );
        
        // 3. 구독 여부 확인
        List<String> subscribedPackages = tenantSubscriptionRepository
            .findActiveByt tenantId(tenantId)
            .stream()
            .map(TenantSubscription::getPackageCode)
            .collect(Collectors.toList());
        
        // 4. DTO 변환
        return packages.stream()
            .map(pkg -> ComponentPackageDTO.builder()
                .packageCode(pkg.getPackageCode())
                .packageName(pkg.getPackageName())
                .description(pkg.getDescription())
                .category(pkg.getCategory())
                .pricingModel(pkg.getPricingModel())
                .priceMonthly(pkg.getPriceMonthly())
                .priceYearly(pkg.getPriceYearly())
                .isSubscribed(subscribedPackages.contains(pkg.getPackageCode()))
                .build())
            .collect(Collectors.toList());
    }
    
    /**
     * 패키지 구매/구독
     */
    @Transactional
    public SubscriptionResult purchasePackage(String tenantId, String packageCode, 
                                              SubscriptionType subscriptionType) {
        // 1. 패키지 확인
        ComponentPackage pkg = componentPackageRepository
            .findByPackageCodeAndIsActiveTrue(packageCode)
            .orElseThrow(() -> new NotFoundException("패키지를 찾을 수 없습니다"));
        
        // 2. 중복 구독 확인
        boolean alreadySubscribed = tenantSubscriptionRepository
            .existsByTenantIdAndPackageCodeAndStatus(tenantId, packageCode, "ACTIVE");
        
        if (alreadySubscribed) {
            throw new BusinessException("이미 구독 중인 패키지입니다");
        }
        
        // 3. 결제 금액 계산
        BigDecimal amount = calculateAmount(pkg, subscriptionType);
        
        // 4. 결제 처리 (결제 게이트웨이 연동)
        PaymentResult paymentResult = paymentService.processPayment(tenantId, amount);
        
        if (!paymentResult.isSuccess()) {
            throw new PaymentException("결제 처리 실패");
        }
        
        // 5. 구독 생성
        TenantSubscription subscription = TenantSubscription.builder()
            .subscriptionId(UUID.randomUUID().toString())
            .tenantId(tenantId)
            .packageCode(packageCode)
            .status("ACTIVE")
            .subscriptionType(subscriptionType.name())
            .startDate(LocalDate.now())
            .endDate(calculateEndDate(subscriptionType))
            .paymentAmount(amount)
            .paymentMethod(paymentResult.getPaymentMethod())
            .lastPaymentDate(LocalDate.now())
            .nextPaymentDate(calculateNextPaymentDate(subscriptionType))
            .autoRenewal(true)
            .build();
        
        tenantSubscriptionRepository.save(subscription);
        
        // 6. 구독 이력 생성
        subscriptionHistoryRepository.save(SubscriptionHistory.builder()
            .subscriptionId(subscription.getSubscriptionId())
            .tenantId(tenantId)
            .eventType("PURCHASED")
            .amount(amount)
            .paymentMethod(paymentResult.getPaymentMethod())
            .description("패키지 구매: " + pkg.getPackageName())
            .build());
        
        // 7. 역할별 권한 자동 부여
        activatePackageComponents(tenantId, packageCode);
        
        return SubscriptionResult.builder()
            .subscriptionId(subscription.getSubscriptionId())
            .success(true)
            .message("구독이 완료되었습니다")
            .build();
    }
    
    /**
     * 패키지 컴포넌트 활성화
     */
    private void activatePackageComponents(String tenantId, String packageCode) {
        // 1. 패키지에 포함된 컴포넌트 조회
        List<String> componentCodes = packageComponentRepository
            .findByPackageCode(packageCode)
            .stream()
            .map(PackageComponent::getPermissionGroupCode)
            .collect(Collectors.toList());
        
        // 2. 테넌트의 모든 역할에 권한 부여
        List<TenantRole> roles = tenantRoleRepository
            .findByTenantIdAndIsActiveTrue(tenantId);
        
        for (TenantRole role : roles) {
            for (String componentCode : componentCodes) {
                // 관리자에게만 부여하거나, 역할별로 다르게 부여 가능
                if (shouldGrantPermission(role, componentCode)) {
                    RolePermissionGroup rpg = RolePermissionGroup.builder()
                        .tenantId(tenantId)
                        .tenantRoleId(role.getTenantRoleId())
                        .permissionGroupCode(componentCode)
                        .accessLevel("FULL")
                        .isActive(true)
                        .build();
                    
                    rolePermissionGroupRepository.save(rpg);
                }
            }
        }
    }
}
```

### 2. ComponentMarketplaceController.java

```java
@RestController
@RequestMapping("/api/v1/marketplace")
public class ComponentMarketplaceController {
    
    /**
     * 마켓플레이스 패키지 목록 조회
     */
    @GetMapping("/packages")
    public ResponseEntity<List<ComponentPackageDTO>> getPackages() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        List<ComponentPackageDTO> packages = componentPackageService
            .getMarketplacePackages(tenantId);
        return ResponseEntity.ok(packages);
    }
    
    /**
     * 패키지 상세 정보 조회
     */
    @GetMapping("/packages/{packageCode}")
    public ResponseEntity<ComponentPackageDetailDTO> getPackageDetail(
            @PathVariable String packageCode) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        ComponentPackageDetailDTO detail = componentPackageService
            .getPackageDetail(tenantId, packageCode);
        return ResponseEntity.ok(detail);
    }
    
    /**
     * 패키지 구매
     */
    @PostMapping("/packages/{packageCode}/purchase")
    public ResponseEntity<SubscriptionResult> purchasePackage(
            @PathVariable String packageCode,
            @RequestBody PurchaseRequest request) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        SubscriptionResult result = componentPackageService
            .purchasePackage(tenantId, packageCode, request.getSubscriptionType());
        return ResponseEntity.ok(result);
    }
    
    /**
     * 내 구독 목록 조회
     */
    @GetMapping("/subscriptions")
    public ResponseEntity<List<SubscriptionDTO>> getMySubscriptions() {
        String tenantId = SecurityUtils.getCurrentTenantId();
        List<SubscriptionDTO> subscriptions = componentPackageService
            .getTenantSubscriptions(tenantId);
        return ResponseEntity.ok(subscriptions);
    }
    
    /**
     * 구독 취소
     */
    @PostMapping("/subscriptions/{subscriptionId}/cancel")
    public ResponseEntity<Void> cancelSubscription(
            @PathVariable String subscriptionId) {
        String tenantId = SecurityUtils.getCurrentTenantId();
        componentPackageService.cancelSubscription(tenantId, subscriptionId);
        return ResponseEntity.ok().build();
    }
}
```

---

## 💻 프론트엔드 구현

### 1. ComponentMarketplace.js

```javascript
// components/admin/ComponentMarketplace.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ComponentMarketplace.css';

const ComponentMarketplace = () => {
    const [packages, setPackages] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await axios.get('/api/v1/marketplace/packages');
            setPackages(response.data);
        } catch (error) {
            console.error('Failed to fetch packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (packageCode, subscriptionType) => {
        if (!confirm('이 패키지를 구매하시겠습니까?')) return;
        
        try {
            const response = await axios.post(
                `/api/v1/marketplace/packages/${packageCode}/purchase`,
                { subscriptionType }
            );
            
            alert('구매가 완료되었습니다!');
            fetchPackages(); // 목록 새로고침
        } catch (error) {
            alert('구매 실패: ' + error.response?.data?.message);
        }
    };

    const filteredPackages = selectedCategory === 'ALL'
        ? packages
        : packages.filter(pkg => pkg.category === selectedCategory);

    if (loading) return <div>로딩 중...</div>;

    return (
        <div className="component-marketplace">
            <div className="marketplace-header">
                <h1>컴포넌트 마켓플레이스</h1>
                <p>필요한 기능을 선택하고 구매하세요</p>
            </div>

            {/* 카테고리 필터 */}
            <div className="category-filter">
                <button 
                    className={selectedCategory === 'ALL' ? 'active' : ''}
                    onClick={() => setSelectedCategory('ALL')}
                >
                    전체
                </button>
                <button 
                    className={selectedCategory === 'MANAGEMENT' ? 'active' : ''}
                    onClick={() => setSelectedCategory('MANAGEMENT')}
                >
                    관리
                </button>
                <button 
                    className={selectedCategory === 'ANALYTICS' ? 'active' : ''}
                    onClick={() => setSelectedCategory('ANALYTICS')}
                >
                    분석
                </button>
                <button 
                    className={selectedCategory === 'ERP' ? 'active' : ''}
                    onClick={() => setSelectedCategory('ERP')}
                >
                    ERP
                </button>
                <button 
                    className={selectedCategory === 'SPECIALIZED' ? 'active' : ''}
                    onClick={() => setSelectedCategory('SPECIALIZED')}
                >
                    전문
                </button>
            </div>

            {/* 패키지 목록 */}
            <div className="package-grid">
                {filteredPackages.map(pkg => (
                    <div key={pkg.packageCode} className="package-card">
                        {pkg.isFeatured && (
                            <div className="featured-badge">추천</div>
                        )}
                        
                        <div className="package-thumbnail">
                            <img src={pkg.thumbnailUrl || '/default-thumbnail.png'} 
                                 alt={pkg.packageName} />
                        </div>
                        
                        <div className="package-info">
                            <h3>{pkg.packageName}</h3>
                            <p className="description">{pkg.description}</p>
                            
                            <div className="package-price">
                                {pkg.pricingModel === 'FREE' ? (
                                    <span className="price-free">무료</span>
                                ) : (
                                    <>
                                        <span className="price-amount">
                                            {pkg.priceMonthly.toLocaleString()}원
                                        </span>
                                        <span className="price-period">/월</span>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="package-actions">
                            {pkg.isSubscribed ? (
                                <button className="btn-subscribed" disabled>
                                    <i className="bi-check-circle"></i> 구독 중
                                </button>
                            ) : (
                                <>
                                    <button 
                                        className="btn-demo"
                                        onClick={() => window.open(pkg.demoUrl, '_blank')}
                                    >
                                        데모 보기
                                    </button>
                                    <button 
                                        className="btn-purchase"
                                        onClick={() => handlePurchase(pkg.packageCode, 'MONTHLY')}
                                    >
                                        구매하기
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ComponentMarketplace;
```

### 2. MySubscriptions.js

```javascript
// components/admin/MySubscriptions.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MySubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const response = await axios.get('/api/v1/marketplace/subscriptions');
            setSubscriptions(response.data);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
        }
    };

    const handleCancel = async (subscriptionId) => {
        if (!confirm('구독을 취소하시겠습니까?')) return;
        
        try {
            await axios.post(`/api/v1/marketplace/subscriptions/${subscriptionId}/cancel`);
            alert('구독이 취소되었습니다');
            fetchSubscriptions();
        } catch (error) {
            alert('취소 실패: ' + error.response?.data?.message);
        }
    };

    return (
        <div className="my-subscriptions">
            <h2>내 구독 관리</h2>
            
            <div className="subscription-list">
                {subscriptions.map(sub => (
                    <div key={sub.subscriptionId} className="subscription-item">
                        <div className="sub-info">
                            <h3>{sub.packageName}</h3>
                            <p>구독 기간: {sub.startDate} ~ {sub.endDate || '무제한'}</p>
                            <p>다음 결제일: {sub.nextPaymentDate}</p>
                            <p>결제 금액: {sub.paymentAmount.toLocaleString()}원</p>
                        </div>
                        
                        <div className="sub-actions">
                            <span className={`status ${sub.status.toLowerCase()}`}>
                                {sub.status === 'ACTIVE' ? '활성' : '비활성'}
                            </span>
                            {sub.status === 'ACTIVE' && (
                                <button 
                                    className="btn-cancel"
                                    onClick={() => handleCancel(sub.subscriptionId)}
                                >
                                    구독 취소
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MySubscriptions;
```

---

## 📋 기본 패키지 데이터

```sql
-- ========================================
-- 1. 무료 기본 패키지
-- ========================================
INSERT INTO component_packages VALUES
(NULL, 'BASIC_FREE', '기본 패키지', 'Basic Package', 
 '무료로 제공되는 기본 기능', 'BASIC', NULL, 
 'FREE', 0, 0, 0, 
 'bi-gift', NULL, NULL, NULL, 
 true, false, 1, NOW(), NOW());

-- 기본 패키지 컴포넌트
INSERT INTO package_components VALUES
(NULL, 'BASIC_FREE', 'DASHBOARD_STATISTICS', true, 1, NOW()),
(NULL, 'BASIC_FREE', 'DASHBOARD_MANAGEMENT', true, 2, NOW());

-- ========================================
-- 2. ERP 패키지 (유료)
-- ========================================
INSERT INTO component_packages VALUES
(NULL, 'ERP_BASIC', 'ERP 기본', 'ERP Basic', 
 '구매, 재무, 예산 관리 기능', 'ERP', NULL, 
 'MONTHLY', 50000, 540000, 0, 
 'bi-building', NULL, NULL, NULL, 
 true, true, 10, NOW(), NOW());

-- ERP 패키지 컴포넌트
INSERT INTO package_components VALUES
(NULL, 'ERP_BASIC', 'DASHBOARD_ERP', true, 1, NOW()),
(NULL, 'ERP_BASIC', 'ERP_PURCHASE', true, 2, NOW()),
(NULL, 'ERP_BASIC', 'ERP_FINANCIAL', true, 3, NOW()),
(NULL, 'ERP_BASIC', 'ERP_BUDGET', true, 4, NOW());

-- ========================================
-- 3. 고급 통계 패키지 (유료)
-- ========================================
INSERT INTO component_packages VALUES
(NULL, 'ANALYTICS_PRO', '고급 통계 분석', 'Analytics Pro', 
 'AI 기반 고급 통계 및 예측 분석', 'ANALYTICS', NULL, 
 'MONTHLY', 30000, 324000, 0, 
 'bi-graph-up-arrow', NULL, NULL, NULL, 
 true, true, 20, NOW(), NOW());

-- ========================================
-- 4. 상담소 전문 패키지 (유료)
-- ========================================
INSERT INTO component_packages VALUES
(NULL, 'CONSULTATION_PRO', '상담소 전문 패키지', 'Consultation Pro', 
 '심리평가, 치료계획, 슈퍼비전 도구', 'SPECIALIZED', 'CONSULTATION', 
 'MONTHLY', 80000, 864000, 0, 
 'bi-heart-pulse', NULL, NULL, NULL, 
 true, true, 30, NOW(), NOW());

-- 상담소 전문 패키지 컴포넌트
INSERT INTO package_components VALUES
(NULL, 'CONSULTATION_PRO', 'CONSULT_ASSESSMENT', true, 1, NOW()),
(NULL, 'CONSULTATION_PRO', 'CONSULT_TREATMENT_PLAN', true, 2, NOW()),
(NULL, 'CONSULTATION_PRO', 'CONSULTANT_SUPERVISION', true, 3, NOW());

-- ========================================
-- 5. 학원 전문 패키지 (유료)
-- ========================================
INSERT INTO component_packages VALUES
(NULL, 'ACADEMY_PRO', '학원 전문 패키지', 'Academy Pro', 
 '성적 분석, 시험 관리, 학부모 소통', 'SPECIALIZED', 'ACADEMY', 
 'MONTHLY', 60000, 648000, 0, 
 'bi-mortarboard', NULL, NULL, NULL, 
 true, true, 40, NOW(), NOW());

-- 학원 전문 패키지 컴포넌트
INSERT INTO package_components VALUES
(NULL, 'ACADEMY_PRO', 'ACADEMY_EXAM_MANAGEMENT', true, 1, NOW()),
(NULL, 'ACADEMY_PRO', 'EXAM_ANALYSIS', true, 2, NOW()),
(NULL, 'ACADEMY_PRO', 'STUDENT_PARENT_COMM', true, 3, NOW());
```

---

## 🎯 사용 시나리오

### 시나리오 1: 상담소 원장이 ERP 구매

```
1. 마켓플레이스 접속
   GET /api/v1/marketplace/packages
   → ERP 패키지 목록 확인

2. ERP 기본 패키지 선택
   - 가격: 월 50,000원
   - 포함 기능: 구매/재무/예산 관리

3. 구매하기 클릭
   POST /api/v1/marketplace/packages/ERP_BASIC/purchase
   { "subscriptionType": "MONTHLY" }

4. 결제 처리
   - 결제 게이트웨이 연동
   - 결제 완료

5. 자동 활성화
   - tenant_subscriptions 생성
   - role_permission_groups 자동 생성
   - 원장에게 ERP 권한 부여

6. 즉시 사용 가능
   - 대시보드 새로고침
   - ERP 섹션 자동 표시!
```

### 시나리오 2: 학원 원장이 전문 패키지 구매

```
1. 마켓플레이스에서 "학원 전문 패키지" 확인
   - 성적 분석 시스템
   - 시험 관리
   - 학부모 소통

2. 데모 보기 클릭
   - 실제 기능 미리 체험

3. 구매 (월 60,000원)

4. 자동 활성화
   - 시험 관리 섹션 추가
   - 성적 분석 위젯 추가
   - 학부모 소통 기능 활성화

5. 즉시 사용 가능
```

---

## ✅ 장점

### 1. 수익 모델 다양화
```
기본 패키지: 무료 (사용자 확보)
프리미엄 기능: 유료 (수익 창출)
업종별 전문 패키지: 고가 (전문성)
```

### 2. 테넌트 맞춤화
```
필요한 기능만 구매
불필요한 기능 숨김
비용 절감
```

### 3. 확장성
```
새 패키지 추가: SQL만 추가
새 컴포넌트 추가: SQL만 추가
즉시 판매 가능
```

### 4. 자동화
```
구매 → 자동 활성화 → 즉시 사용
취소 → 자동 비활성화
만료 → 자동 갱신 or 비활성화
```

---

**작성 완료**: 2025-12-03  
**핵심**: 그룹 코드 기반 → 컴포넌트 마켓플레이스까지 자연스럽게 확장!

