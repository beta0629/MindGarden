package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultantRating;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사 평가 API 컨트롤러
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/ratings", "/api/ratings"}) // v1 경로 추가, 레거시 경로 유지
@RequiredArgsConstructor
public class ConsultantRatingController extends BaseApiController {

    private final ConsultantRatingService ratingService;

    /**
     * 상담 후 평가 등록
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createRating(@RequestBody Map<String, Object> request) {
        Long scheduleId = Long.valueOf(request.get("scheduleId").toString());
        Long clientId = Long.valueOf(request.get("clientId").toString());
        Integer heartScore = (Integer) request.get("heartScore");
        String comment = (String) request.get("comment");
        @SuppressWarnings("unchecked")
        List<String> ratingTags = (List<String>) request.get("ratingTags");
        Boolean isAnonymous = (Boolean) request.get("isAnonymous");

        ConsultantRating rating = ratingService.createRating(scheduleId, clientId, heartScore, comment, ratingTags, isAnonymous);

        Map<String, Object> data = new HashMap<>();
        data.put("ratingId", rating.getId());
        data.put("heartScore", rating.getHeartScore());
        data.put("consultantName", rating.getConsultant().getName());

        return created("상담사 평가가 등록되었습니다.", data);
    }

    /**
     * 평가 수정
     */
    @PutMapping("/{ratingId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateRating(@PathVariable Long ratingId, @RequestBody Map<String, Object> request) {
        Integer heartScore = (Integer) request.get("heartScore");
        String comment = (String) request.get("comment");
        @SuppressWarnings("unchecked")
        List<String> ratingTags = (List<String>) request.get("ratingTags");

        ConsultantRating rating = ratingService.updateRating(ratingId, heartScore, comment, ratingTags);

        Map<String, Object> data = new HashMap<>();
        data.put("ratingId", rating.getId());
        data.put("heartScore", rating.getHeartScore());

        return updated("평가가 수정되었습니다.", data);
    }

    /**
     * 평가 삭제
     */
    @DeleteMapping("/{ratingId}")
    public ResponseEntity<ApiResponse<Void>> deleteRating(@PathVariable Long ratingId, @RequestParam Long clientId) {
        ratingService.deleteRating(ratingId, clientId);

        return deleted("평가가 삭제되었습니다.");
    }

    /**
     * 테스트용 - 간단한 응답
     */
    @GetMapping("/test")
    public ResponseEntity<ApiResponse<String>> test() {
        return success("평가 API 테스트 성공");
    }

    /**
     * 관리자용 - 전체 평가 통계
     */
    @GetMapping("/admin/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminRatingStatistics() {
        log.info("💖 관리자 평가 통계 조회 시작");
        
        // 전체 평가 통계 조회
        Map<String, Object> stats = ratingService.getAdminRatingStatistics();
        
        return success(stats);
    }

    /**
     * 내담자용 - 평가 가능한 상담 목록
     */
    @GetMapping("/client/{clientId}/ratable-schedules")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRatableSchedules(@PathVariable Long clientId) {
        log.info("💖 평가 가능한 스케줄 조회 API 호출: clientId={}", clientId);
        
        // 실제 서비스 호출 - 완료되었지만 아직 평가하지 않은 상담만 조회
        List<Map<String, Object>> schedules = ratingService.getRatableSchedules(clientId);
        log.info("💖 평가 가능한 스케줄 조회 API 성공: clientId={}, count={}", clientId, schedules.size());

        Map<String, Object> data = new HashMap<>();
        data.put("schedules", schedules);
        data.put("count", schedules.size());

        return success(data);
    }

    /**
     * 상담사용 - 평가 통계 조회
     */
    @GetMapping("/consultant/{consultantId}/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantRatingStats(@PathVariable Long consultantId) {
        Map<String, Object> stats = ratingService.getConsultantRatingStats(consultantId);

        return success(stats);
    }

    /**
     * 상담사용 - 평가 목록 조회
     */
    @GetMapping("/consultant/{consultantId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantRatings(@PathVariable Long consultantId,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ConsultantRating> ratings = ratingService.getConsultantRatings(consultantId, pageable);

        Map<String, Object> data = new HashMap<>();
        data.put("ratings", ratings.getContent());
        data.put("totalElements", ratings.getTotalElements());
        data.put("totalPages", ratings.getTotalPages());
        data.put("currentPage", page);

        return success(data);
    }

    /**
     * 상담사 랭킹 조회
     */
    @GetMapping("/ranking")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getConsultantRanking(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<Map<String, Object>> ranking = ratingService.getConsultantRanking(pageable);

        Map<String, Object> data = new HashMap<>();
        data.put("ranking", ranking);
        data.put("count", ranking.size());

        return success(data);
    }

    /**
     * 인기 평가 태그 조회
     */
    @GetMapping("/consultant/{consultantId}/popular-tags")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPopularRatingTags(@PathVariable Long consultantId) {
        List<Map<String, Object>> tags = ratingService.getPopularRatingTags(consultantId);

        Map<String, Object> data = new HashMap<>();
        data.put("tags", tags);
        data.put("count", tags.size());

        return success(data);
    }
}
