package com.mindgarden.consultation.controller;

import java.util.Map;
import com.mindgarden.consultation.service.StatisticsService;
import com.mindgarden.consultation.service.DynamicPermissionService;
import com.mindgarden.consultation.util.PermissionCheckUtils;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
public class StatisticsController {
    
    private final StatisticsService statisticsService;
    private final DynamicPermissionService dynamicPermissionService;
    
    /**
     * 전체 통계 조회
     */
    @GetMapping("/overall")
    public ResponseEntity<Map<String, Object>> getOverallStatistics(HttpSession session) {
        // 동적 권한 체크: REPORT_VIEW 또는 DASHBOARD_VIEW 권한 필요
        ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
            session, 
            "REPORT_VIEW", 
            dynamicPermissionService
        );
        if (permissionCheck != null) {
            return (ResponseEntity<Map<String, Object>>) permissionCheck;
        }
        
        try {
            Map<String, Object> statistics = statisticsService.getOverallStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("전체 통계 조회 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "통계 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 트렌드 통계 조회
     */
    @GetMapping("/trends")
    public ResponseEntity<Map<String, Object>> getTrendStatistics(HttpSession session) {
        // 동적 권한 체크
        ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
            session, 
            "REPORT_VIEW", 
            dynamicPermissionService
        );
        if (permissionCheck != null) {
            return (ResponseEntity<Map<String, Object>>) permissionCheck;
        }
        
        try {
            Map<String, Object> trends = statisticsService.getTrendStatistics();
            return ResponseEntity.ok(trends);
        } catch (Exception e) {
            log.error("트렌드 통계 조회 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "트렌드 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 차트 데이터 조회
     */
    @GetMapping("/chart-data")
    public ResponseEntity<Map<String, Object>> getChartData(HttpSession session) {
        // 동적 권한 체크
        ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
            session, 
            "REPORT_VIEW", 
            dynamicPermissionService
        );
        if (permissionCheck != null) {
            return (ResponseEntity<Map<String, Object>>) permissionCheck;
        }
        
        try {
            Map<String, Object> chartData = statisticsService.getChartData();
            return ResponseEntity.ok(chartData);
        } catch (Exception e) {
            log.error("차트 데이터 조회 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "차트 데이터 조회 중 오류가 발생했습니다."));
        }
    }
    
    /**
     * 최근 활동 조회
     */
    @GetMapping("/recent-activity")
    public ResponseEntity<Map<String, Object>> getRecentActivity(HttpSession session) {
        // 동적 권한 체크
        ResponseEntity<?> permissionCheck = PermissionCheckUtils.checkPermission(
            session, 
            "REPORT_VIEW", 
            dynamicPermissionService
        );
        if (permissionCheck != null) {
            return (ResponseEntity<Map<String, Object>>) permissionCheck;
        }
        
        try {
            Map<String, Object> activities = statisticsService.getRecentActivity();
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            log.error("최근 활동 조회 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "최근 활동 조회 중 오류가 발생했습니다."));
        }
    }
}
