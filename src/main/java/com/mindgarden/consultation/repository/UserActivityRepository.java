package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.UserActivity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 사용자 활동 내역 레포지토리
 */
@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    
    /**
     * 사용자별 활동 내역 조회 (최신순)
     */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.userId = :userId ORDER BY ua.createdAt DESC")
    Page<UserActivity> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * 사용자별 활동 타입별 조회
     */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.userId = :userId AND ua.activityType = :activityType ORDER BY ua.createdAt DESC")
    Page<UserActivity> findByUserIdAndActivityTypeOrderByCreatedAtDesc(
        @Param("userId") Long userId, 
        @Param("activityType") String activityType, 
        Pageable pageable
    );
    
    /**
     * 사용자별 최근 활동 조회 (대시보드용)
     */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.userId = :userId ORDER BY ua.createdAt DESC")
    List<UserActivity> findTop5ByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);
    
    /**
     * 사용자별 활동 통계 조회
     */
    @Query("SELECT ua.activityType, COUNT(ua) FROM UserActivity ua WHERE ua.userId = :userId GROUP BY ua.activityType")
    List<Object[]> findActivityStatisticsByUserId(@Param("userId") Long userId);
    
    /**
     * 사용자별 완료된 활동 수 조회
     */
    @Query("SELECT COUNT(ua) FROM UserActivity ua WHERE ua.userId = :userId AND ua.status = 'COMPLETED'")
    Long countCompletedActivitiesByUserId(@Param("userId") Long userId);
    
    /**
     * 기간별 활동 조회
     */
    @Query("SELECT ua FROM UserActivity ua WHERE ua.userId = :userId AND ua.createdAt BETWEEN :startDate AND :endDate ORDER BY ua.createdAt DESC")
    List<UserActivity> findByUserIdAndCreatedAtBetween(
        @Param("userId") Long userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}
