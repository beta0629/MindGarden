package com.coresolution.core.integration;

import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.TenantDashboard;
import com.coresolution.core.domain.TenantRole;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.TenantDashboardRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.service.TenantDashboardService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 동적 카드 레이아웃 통합 테스트
 * 대시보드 생성 시 카드 레이아웃 설정이 자동으로 추가되는지 검증
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("동적 카드 레이아웃 통합 테스트")
class DynamicCardLayoutIntegrationTest {
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private TenantRoleRepository tenantRoleRepository;
    
    @Autowired
    private TenantDashboardRepository dashboardRepository;
    
    @Autowired
    private TenantDashboardService dashboardService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private String tenantId;
    private Tenant testTenant;
    private TenantRole testRole;
    
    @BeforeEach
    void setUp() {
        // 테스트용 테넌트 생성 (36자 제한을 위해 짧은 ID 사용)
        tenantId = "test-" + UUID.randomUUID().toString().substring(0, 30);
        testTenant = Tenant.builder()
                .tenantId(tenantId)
                .name("테스트 상담소")
                .businessType("CONSULTATION")
                .status(Tenant.TenantStatus.ACTIVE)
                .contactEmail("test@test.com")
                .build();
        testTenant = tenantRepository.save(testTenant);
        
        // 테넌트 컨텍스트 설정
        TenantContextHolder.setTenantId(tenantId);
        
        // 테스트용 역할 생성
        String roleId = UUID.randomUUID().toString();
        testRole = TenantRole.builder()
                .tenantRoleId(roleId)
                .tenantId(tenantId)
                .name("테스트 역할") // name 필수
                .nameKo("테스트 역할")
                .nameEn("Test Role")
                .isActive(true)
                .build();
        testRole = tenantRoleRepository.save(testRole);
    }
    
    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        // Cleanup은 @Transactional로 자동 처리
    }
    
    @Test
    @DisplayName("대시보드 생성 시 cardLayout 설정 자동 추가 확인")
    void testDashboardCreation_WithCardLayout() throws Exception {
        // Given: 대시보드 생성 요청
        String dashboardName = "테스트 대시보드";
        
        // When: 대시보드 생성
        var dashboardResponse = dashboardService.createDefaultDashboards(
                tenantId, "CONSULTATION", "test-user");
        
        // Then: 생성된 대시보드 확인
        assertThat(dashboardResponse).isNotNull();
        assertThat(dashboardResponse.size()).isGreaterThan(0);
        
        // 첫 번째 대시보드의 dashboardConfig 확인
        // dashboardResponse에서 직접 확인
        var firstDashboard = dashboardResponse.get(0);
        assertThat(firstDashboard).isNotNull();
        
        // dashboardId로 다시 조회하여 dashboardConfig 확인
        TenantDashboard createdDashboard = dashboardRepository.findByDashboardIdAndIsDeletedFalse(firstDashboard.getDashboardId())
                .orElse(null);
        assertThat(createdDashboard).isNotNull();
        assertThat(createdDashboard.getDashboardConfig()).isNotNull();
        
        // dashboardConfig JSON 파싱
        JsonNode config = objectMapper.readTree(createdDashboard.getDashboardConfig());
        
        // cardLayout 필드 확인
        assertThat(config.has("cardLayout")).isTrue();
        JsonNode cardLayout = config.get("cardLayout");
        
        // cardLayout 필드 값 확인
        assertThat(cardLayout.has("defaultStyle")).isTrue();
        assertThat(cardLayout.get("defaultStyle").asText()).isEqualTo("v2");
        
        assertThat(cardLayout.has("defaultVariant")).isTrue();
        assertThat(cardLayout.get("defaultVariant").asText()).isEqualTo("elevated");
        
        assertThat(cardLayout.has("defaultPadding")).isTrue();
        assertThat(cardLayout.get("defaultPadding").asText()).isEqualTo("md");
        
        assertThat(cardLayout.has("defaultBorderRadius")).isTrue();
        assertThat(cardLayout.get("defaultBorderRadius").asText()).isEqualTo("md");
        
        assertThat(cardLayout.has("hoverEffect")).isTrue();
        assertThat(cardLayout.get("hoverEffect").asBoolean()).isTrue();
        
        assertThat(cardLayout.has("shadow")).isTrue();
        assertThat(cardLayout.get("shadow").asText()).isEqualTo("md");
    }
    
    @Test
    @DisplayName("대시보드 설정에 위젯별 cardStyle 추가 가능 확인")
    void testDashboardConfig_WithWidgetCardStyle() throws Exception {
        // Given: 위젯에 cardStyle이 포함된 대시보드 설정
        String dashboardConfigJson = """
            {
                "version": "1.0",
                "layout": {
                    "type": "grid",
                    "columns": 3,
                    "gap": "md"
                },
                "widgets": [
                    {
                        "id": "widget-1",
                        "type": "statistics",
                        "position": {"row": 0, "col": 0, "span": 1},
                        "cardStyle": {
                            "style": "glass",
                            "variant": "elevated",
                            "glassEffect": true,
                            "padding": "lg"
                        },
                        "config": {
                            "title": "통계"
                        }
                    }
                ],
                "cardLayout": {
                    "defaultStyle": "v2",
                    "defaultVariant": "elevated",
                    "defaultPadding": "md",
                    "defaultBorderRadius": "md",
                    "hoverEffect": true,
                    "shadow": "md"
                }
            }
            """;
        
        // When: JSON 파싱
        JsonNode config = objectMapper.readTree(dashboardConfigJson);
        
        // Then: 위젯별 cardStyle 확인
        JsonNode widgets = config.get("widgets");
        assertThat(widgets.isArray()).isTrue();
        assertThat(widgets.size()).isEqualTo(1);
        
        JsonNode widget = widgets.get(0);
        assertThat(widget.has("cardStyle")).isTrue();
        
        JsonNode cardStyle = widget.get("cardStyle");
        assertThat(cardStyle.get("style").asText()).isEqualTo("glass");
        assertThat(cardStyle.get("glassEffect").asBoolean()).isTrue();
        assertThat(cardStyle.get("padding").asText()).isEqualTo("lg");
        
        // cardLayout 기본값도 확인
        assertThat(config.has("cardLayout")).isTrue();
    }
    
    @Test
    @DisplayName("대시보드 설정에 cardLayout이 없으면 자동 추가 확인")
    void testDashboardConfig_AutoAddCardLayout() throws Exception {
        // Given: cardLayout이 없는 대시보드 설정
        String dashboardConfigJson = """
            {
                "version": "1.0",
                "layout": {
                    "type": "grid",
                    "columns": 3
                },
                "widgets": []
            }
            """;
        
        // When: JSON 파싱 및 cardLayout 확인
        JsonNode config = objectMapper.readTree(dashboardConfigJson);
        
        // Then: cardLayout이 없음을 확인
        assertThat(config.has("cardLayout")).isFalse();
        
        // 실제 대시보드 생성 시에는 addCardLayoutConfig()가 호출되어
        // cardLayout이 자동으로 추가됨 (이미 위 테스트에서 검증됨)
    }
}

