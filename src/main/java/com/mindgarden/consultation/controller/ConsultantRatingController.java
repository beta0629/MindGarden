package com.mindgarden.consultation.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultantRating;
import com.mindgarden.consultation.service.ConsultantRatingService;
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
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class ConsultantRatingController {

    private final ConsultantRatingService ratingService;

    /**
     * 상담 후 평가 등록
     */
    @PostMapping("/create")
    public ResponseEntity<?> createRating(@RequestBody Map<String, Object> request) {
        try {
            Long scheduleId = Long.valueOf(request.get("scheduleId").toString());
            Long clientId = Long.valueOf(request.get("clientId").toString());
            Integer heartScore = (Integer) request.get("heartScore");
            String comment = (String) request.get("comment");
            @SuppressWarnings("unchecked")
            List<String> ratingTags = (List<String>) request.get("ratingTags");
            Boolean isAnonymous = (Boolean) request.get("isAnonymous");

            ConsultantRating rating = ratingService.createRating(scheduleId, clientId, heartScore, comment, ratingTags, isAnonymous);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "상담사 평가가 등록되었습니다.");
            response.put("data", Map.of(
                "ratingId", rating.getId(),
                "heartScore", rating.getHeartScore(),
                "consultantName", rating.getConsultant().getName()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("상담사 평가 등록 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 평가 수정
     */
    @PutMapping("/{ratingId}")
    public ResponseEntity<?> updateRating(@PathVariable Long ratingId, @RequestBody Map<String, Object> request) {
        try {
            Integer heartScore = (Integer) request.get("heartScore");
            String comment = (String) request.get("comment");
            @SuppressWarnings("unchecked")
            List<String> ratingTags = (List<String>) request.get("ratingTags");

            ConsultantRating rating = ratingService.updateRating(ratingId, heartScore, comment, ratingTags);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "평가가 수정되었습니다.");
            response.put("data", Map.of(
                "ratingId", rating.getId(),
                "heartScore", rating.getHeartScore()
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("평가 수정 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 평가 삭제
     */
    @DeleteMapping("/{ratingId}")
    public ResponseEntity<?> deleteRating(@PathVariable Long ratingId, @RequestParam Long clientId) {
        try {
            ratingService.deleteRating(ratingId, clientId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "평가가 삭제되었습니다."
            ));

        } catch (Exception e) {
            log.error("평가 삭제 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 내담자용 - 평가 가능한 상담 목록
     */
    @GetMapping("/client/{clientId}/ratable-schedules")
    public ResponseEntity<?> getRatableSchedules(@PathVariable Long clientId) {
        try {
            List<Map<String, Object>> schedules = ratingService.getRatableSchedules(clientId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", schedules,
                "count", schedules.size()
            ));

        } catch (Exception e) {
            log.error("평가 가능한 스케줄 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 상담사용 - 평가 통계 조회
     */
    @GetMapping("/consultant/{consultantId}/stats")
    public ResponseEntity<?> getConsultantRatingStats(@PathVariable Long consultantId) {
        try {
            Map<String, Object> stats = ratingService.getConsultantRatingStats(consultantId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", stats
            ));

        } catch (Exception e) {
            log.error("상담사 평가 통계 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 상담사용 - 평가 목록 조회
     */
    @GetMapping("/consultant/{consultantId}")
    public ResponseEntity<?> getConsultantRatings(@PathVariable Long consultantId,
                                                 @RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ConsultantRating> ratings = ratingService.getConsultantRatings(consultantId, pageable);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", ratings.getContent(),
                "totalElements", ratings.getTotalElements(),
                "totalPages", ratings.getTotalPages(),
                "currentPage", page
            ));

        } catch (Exception e) {
            log.error("상담사 평가 목록 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 상담사 랭킹 조회
     */
    @GetMapping("/ranking")
    public ResponseEntity<?> getConsultantRanking(@RequestParam(defaultValue = "0") int page,
                                                 @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            List<Map<String, Object>> ranking = ratingService.getConsultantRanking(pageable);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", ranking,
                "count", ranking.size()
            ));

        } catch (Exception e) {
            log.error("상담사 랭킹 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 인기 평가 태그 조회
     */
    @GetMapping("/consultant/{consultantId}/popular-tags")
    public ResponseEntity<?> getPopularRatingTags(@PathVariable Long consultantId) {
        try {
            List<Map<String, Object>> tags = ratingService.getPopularRatingTags(consultantId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", tags,
                "count", tags.size()
            ));

        } catch (Exception e) {
            log.error("인기 평가 태그 조회 실패", e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
}
