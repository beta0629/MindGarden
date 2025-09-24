package com.mindgarden.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultantRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 상담사 평가 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
public interface ConsultantRatingService {

    /**
     * 상담 후 평가 등록
     * 
     * @param scheduleId 스케줄 ID
     * @param clientId 내담자 ID
     * @param heartScore 하트 점수 (1-5)
     * @param comment 평가 코멘트 (선택)
     * @param ratingTags 평가 태그들 (선택)
     * @param isAnonymous 익명 여부
     * @return 등록된 평가
     */
    ConsultantRating createRating(Long scheduleId, Long clientId, Integer heartScore, 
                                 String comment, List<String> ratingTags, Boolean isAnonymous);

    /**
     * 평가 수정
     * 
     * @param ratingId 평가 ID
     * @param heartScore 하트 점수
     * @param comment 평가 코멘트
     * @param ratingTags 평가 태그들
     * @return 수정된 평가
     */
    ConsultantRating updateRating(Long ratingId, Integer heartScore, String comment, List<String> ratingTags);

    /**
     * 평가 삭제 (소프트 삭제)
     * 
     * @param ratingId 평가 ID
     * @param clientId 내담자 ID (권한 확인용)
     */
    void deleteRating(Long ratingId, Long clientId);

    /**
     * 스케줄별 평가 조회
     * 
     * @param scheduleId 스케줄 ID
     * @return 평가 정보
     */
    ConsultantRating getRatingBySchedule(Long scheduleId);

    /**
     * 내담자가 평가 가능한 스케줄 목록
     * 
     * @param clientId 내담자 ID
     * @return 평가 가능한 완료된 스케줄 목록
     */
    List<Map<String, Object>> getRatableSchedules(Long clientId);

    /**
     * 상담사별 평가 통계
     * 
     * @param consultantId 상담사 ID
     * @return 평가 통계 정보
     */
    Map<String, Object> getConsultantRatingStats(Long consultantId);

    /**
     * 상담사별 평가 목록 조회
     * 
     * @param consultantId 상담사 ID
     * @param pageable 페이징 정보
     * @return 평가 목록
     */
    Page<ConsultantRating> getConsultantRatings(Long consultantId, Pageable pageable);

    /**
     * 내담자별 평가 목록 조회
     * 
     * @param clientId 내담자 ID
     * @param pageable 페이징 정보
     * @return 평가 목록
     */
    Page<ConsultantRating> getClientRatings(Long clientId, Pageable pageable);

    /**
     * 상담사 랭킹 조회 (평균 점수 기준)
     * 
     * @param pageable 페이징 정보
     * @return 상담사 랭킹 목록
     */
    List<Map<String, Object>> getConsultantRanking(Pageable pageable);

    /**
     * 기간별 평가 통계
     * 
     * @param consultantId 상담사 ID
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 기간별 통계
     */
    Map<String, Object> getRatingStatsByPeriod(Long consultantId, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * 인기 평가 태그 조회
     * 
     * @param consultantId 상담사 ID
     * @return 인기 태그 목록
     */
    List<Map<String, Object>> getPopularRatingTags(Long consultantId);

    /**
     * 관리자용 전체 평가 통계
     * 
     * @return 전체 평가 통계 정보
     */
    Map<String, Object> getAdminRatingStatistics();
    
    /**
     * 관리자용 전체 평가 통계 (지점별 필터링)
     * 
     * @param branchCode 지점코드
     * @return 지점별 평가 통계 정보
     */
    Map<String, Object> getAdminRatingStatisticsByBranch(String branchCode);
}
