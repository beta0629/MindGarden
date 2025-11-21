package com.coresolution.consultation.controller;

import java.util.Map;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.util.PermissionCheckUtils;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 통계 관리 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/statistics", "/api/admin/statistics"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class StatisticsController extends BaseApiController {
    
    private final StatisticsService statisticsService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 전체 통계 조회
     */
    @GetMapping("/overall")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOverallStatistics(HttpSession session) {
        // 동적 권한 체크: REPORT_VIEW 또는 DASHBOARD_VIEW 권한 필요
        ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
            session, 
            "REPORT_VIEW", 
            dynamicPermissionService
        );
        if (permissionCheck != null) {
            throw new org.springframework.security.access.AccessDeniedException("통계 조회 권한이 없습니다.");
        }
        
        Map<String, Object> statistics = statisticsService.getOverallStatistics();
        return success(statistics);
    }
    
    /**
     * 트렌드 통계 조회
     */
    @GetMapping("/trends")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTrendStatistics(HttpSession session) {
        // 동적 권한 체크
        ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
            session, 
            "REPORT_VIEW", 
            dynamicPermissionService
        );
        if (permissionCheck != null) {
            throw new org.springframework.security.access.AccessDeniedException("통계 조회 권한이 없습니다.");
        }
        
        Map<String, Object> trends = statisticsService.getTrendStatistics();
        return success(trends);
    }
    
    /**
     * 차트 데이터 조회
     */
    @GetMapping("/chart-data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getChartData(HttpSession session) {
        // 동적 권한 체크
        ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
            session, 
            "REPORT_VIEW", 
            dynamicPermissionService
        );
        if (permissionCheck != null) {
            throw new org.springframework.security.access.AccessDeniedException("통계 조회 권한이 없습니다.");
        }
        
        Map<String, Object> chartData = statisticsService.getChartData();
        return success(chartData);
    }
    
    /**
     * 최근 활동 조회
     */
    @GetMapping("/recent-activity")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRecentActivity(HttpSession session) {
        // 동적 권한 체크
        ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
            session, 
            "REPORT_VIEW", 
            dynamicPermissionService
        );
        if (permissionCheck != null) {
            throw new org.springframework.security.access.AccessDeniedException("통계 조회 권한이 없습니다.");
        }
        
        Map<String, Object> activities = statisticsService.getRecentActivity();
        return success(activities);
    }
}
