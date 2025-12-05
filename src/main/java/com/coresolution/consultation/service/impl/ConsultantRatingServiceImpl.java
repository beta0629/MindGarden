package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.ConsultantRating;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사 평가 서비스 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class ConsultantRatingServiceImpl implements ConsultantRatingService {

    private final ConsultantRatingRepository ratingRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final RealTimeStatisticsService realTimeStatisticsService;
    private final BranchService branchService;

    @Override
    public ConsultantRating createRating(Long scheduleId, Long clientId, Integer heartScore, 
                                        String comment, List<String> ratingTags, Boolean isAnonymous) {
        try {
            log.info("💖 상담사 평가 등록 시작: 스케줄={}, 내담자={}, 하트점수={}", scheduleId, clientId, heartScore);

            // 스케줄 조회 및 검증
            Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("스케줄을 찾을 수 없습니다."));

            // 스케줄이 완료되었는지 확인
            if (!ScheduleStatus.COMPLETED.equals(schedule.getStatus())) {
                throw new RuntimeException("완료된 상담만 평가할 수 있습니다.");
            }

            // 내담자 확인
            if (!schedule.getClientId().equals(clientId)) {
                throw new RuntimeException("본인의 상담만 평가할 수 있습니다.");
            }

            // 중복 평가 확인
            if (ratingRepository.existsByScheduleIdAndClientIdAndStatus(scheduleId, clientId, ConsultantRating.RatingStatus.ACTIVE)) {
                throw new RuntimeException("이미 평가한 상담입니다.");
            }

            // 상담사 조회
            User consultant = userRepository.findById(schedule.getConsultantId())
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다."));

            // 내담자 조회
            User client = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("내담자를 찾을 수 없습니다."));

            // 평가 태그 JSON 변환
            String ratingTagsJson = null;
            if (ratingTags != null && !ratingTags.isEmpty()) {
                ratingTagsJson = objectMapper.writeValueAsString(ratingTags);
            }

            // 평가 생성
            ConsultantRating rating = ConsultantRating.builder()
                .consultant(consultant)
                .client(client)
                .schedule(schedule)
                .heartScore(heartScore)
                .comment(comment)
                .ratingTags(ratingTagsJson)
                .isAnonymous(isAnonymous != null ? isAnonymous : false)
                .status(ConsultantRating.RatingStatus.ACTIVE)
                .ratedAt(LocalDateTime.now())
                .build();

            ConsultantRating savedRating = ratingRepository.save(rating);

            // 🚀 실시간 통계 업데이트 추가
            try {
                realTimeStatisticsService.updateConsultantPerformance(
                    consultant.getId(), 
                    schedule.getDate()
                );
                
                log.info("✅ 평점 등록시 실시간 통계 업데이트 완료: consultantId={}, scheduleDate={}", 
                         consultant.getId(), schedule.getDate());
            } catch (Exception e) {
                log.error("❌ 평점 등록시 실시간 통계 업데이트 실패: {}", e.getMessage(), e);
            }

            log.info("✅ 상담사 평가 등록 완료: ID={}, 상담사={}, 하트점수={}", 
                savedRating.getId(), consultant.getName(), heartScore);

            return savedRating;

        } catch (JsonProcessingException e) {
            log.error("❌ 평가 태그 JSON 변환 실패", e);
            throw new RuntimeException("평가 태그 처리 중 오류가 발생했습니다.");
        } catch (Exception e) {
            log.error("❌ 상담사 평가 등록 실패: 스케줄={}, 내담자={}", scheduleId, clientId, e);
            throw e;
        }
    }

    @Override
    public ConsultantRating updateRating(Long ratingId, Integer heartScore, String comment, List<String> ratingTags) {
        try {
            log.info("💖 상담사 평가 수정 시작: ID={}, 하트점수={}", ratingId, heartScore);

            ConsultantRating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new RuntimeException("평가를 찾을 수 없습니다."));

            // 평가 태그 JSON 변환
            String ratingTagsJson = null;
            if (ratingTags != null && !ratingTags.isEmpty()) {
                ratingTagsJson = objectMapper.writeValueAsString(ratingTags);
            }

            // 평가 수정
            rating.setHeartScore(heartScore);
            rating.setComment(comment);
            rating.setRatingTags(ratingTagsJson);
            rating.setUpdatedAt(LocalDateTime.now());

            ConsultantRating savedRating = ratingRepository.save(rating);

            log.info("✅ 상담사 평가 수정 완료: ID={}, 하트점수={}", ratingId, heartScore);

            return savedRating;

        } catch (JsonProcessingException e) {
            log.error("❌ 평가 태그 JSON 변환 실패", e);
            throw new RuntimeException("평가 태그 처리 중 오류가 발생했습니다.");
        } catch (Exception e) {
            log.error("❌ 상담사 평가 수정 실패: ID={}", ratingId, e);
            throw e;
        }
    }

    @Override
    public void deleteRating(Long ratingId, Long clientId) {
        try {
            log.info("💖 상담사 평가 삭제 시작: ID={}, 내담자={}", ratingId, clientId);

            ConsultantRating rating = ratingRepository.findById(ratingId)
                .orElseThrow(() -> new RuntimeException("평가를 찾을 수 없습니다."));

            // 권한 확인 (본인만 삭제 가능)
            if (!rating.getClient().getId().equals(clientId)) {
                throw new RuntimeException("본인의 평가만 삭제할 수 있습니다.");
            }

            // 소프트 삭제
            rating.setStatus(ConsultantRating.RatingStatus.DELETED);
            rating.setUpdatedAt(LocalDateTime.now());
            ratingRepository.save(rating);

            log.info("✅ 상담사 평가 삭제 완료: ID={}", ratingId);

        } catch (Exception e) {
            log.error("❌ 상담사 평가 삭제 실패: ID={}", ratingId, e);
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ConsultantRating getRatingBySchedule(Long scheduleId) {
        return ratingRepository.findByScheduleIdAndStatus(scheduleId, ConsultantRating.RatingStatus.ACTIVE)
            .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRatableSchedules(Long clientId) {
        try {
            log.info("💖 평가 가능한 스케줄 조회: 내담자={}", clientId);

            // 완료된 스케줄 중 아직 평가하지 않은 것들 조회
            log.info("💖 COMPLETED 스케줄 조회 시작: clientId={}, status={}", clientId, ScheduleStatus.COMPLETED);
            List<Schedule> completedSchedules = scheduleRepository.findByClientIdAndStatus(clientId, ScheduleStatus.COMPLETED);
            log.info("💖 조회된 COMPLETED 스케줄 개수: {}", completedSchedules.size());

            List<Map<String, Object>> ratableSchedules = new ArrayList<>();

            for (Schedule schedule : completedSchedules) {
                // 이미 평가했는지 확인
                boolean alreadyRated = ratingRepository.existsByScheduleIdAndClientIdAndStatus(
                    schedule.getId(), clientId, ConsultantRating.RatingStatus.ACTIVE);

                if (!alreadyRated) {
                    try {
                        // 활성 상담사 정보 조회
                        User consultant = userRepository.findById(schedule.getConsultantId())
                            .filter(user -> user.getIsActive() != null && user.getIsActive())
                            .orElse(null);

                        // 활성 상담사인 경우만 평가 목록에 추가
                        if (consultant != null) {
                            Map<String, Object> scheduleInfo = new HashMap<>();
                            scheduleInfo.put("scheduleId", schedule.getId());
                            scheduleInfo.put("consultationDate", schedule.getDate().toString());
                            scheduleInfo.put("consultationTime", schedule.getStartTime() + " - " + schedule.getEndTime());
                            scheduleInfo.put("consultantId", schedule.getConsultantId());
                            scheduleInfo.put("consultantName", consultant.getName());
                            scheduleInfo.put("consultationType", getConsultationTypeDisplayName(schedule.getConsultationType()));
                            scheduleInfo.put("completedAt", schedule.getUpdatedAt());

                            ratableSchedules.add(scheduleInfo);
                        } else {
                            log.warn("비활성 상담사 스케줄 제외: consultantId={}", schedule.getConsultantId());
                        }
                        
                    } catch (Exception e) {
                        log.error("스케줄 정보 처리 중 오류: scheduleId={}", schedule.getId(), e);
                    }
                }
            }

            log.info("✅ 평가 가능한 스케줄 조회 완료: 내담자={}, 개수={}", clientId, ratableSchedules.size());

            return ratableSchedules;

        } catch (Exception e) {
            log.error("❌ 평가 가능한 스케줄 조회 실패: 내담자={}, 오류: {}", clientId, e.getMessage(), e);
            
            // 개발용 임시 처리: 오류 발생 시 빈 목록 반환
            log.warn("💖 개발용 임시 처리: 빈 평가 목록 반환");
            return new ArrayList<>();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getConsultantRatingStats(Long consultantId) {
        try {
            log.info("💖 상담사 평가 통계 조회: 상담사={}", consultantId);

            Map<String, Object> stats = new HashMap<>();

            // 평균 하트 점수
            Double averageScore = ratingRepository.getAverageHeartScoreByConsultant(consultantId, ConsultantRating.RatingStatus.ACTIVE);
            stats.put("averageHeartScore", averageScore != null ? Math.round(averageScore * 10.0) / 10.0 : 0.0);

            // 총 평가 개수
            Long totalCount = ratingRepository.getTotalRatingCountByConsultant(consultantId, ConsultantRating.RatingStatus.ACTIVE);
            stats.put("totalRatingCount", totalCount != null ? totalCount : 0L);

            // 하트 점수별 분포
            List<Object[]> distribution = ratingRepository.getHeartScoreDistributionByConsultant(consultantId, ConsultantRating.RatingStatus.ACTIVE);
            Map<Integer, Long> heartScoreDistribution = new HashMap<>();
            
            // 1-5점 초기화
            for (int i = 1; i <= 5; i++) {
                heartScoreDistribution.put(i, 0L);
            }
            
            // 실제 데이터 설정
            for (Object[] row : distribution) {
                Integer score = (Integer) row[0];
                Long count = (Long) row[1];
                heartScoreDistribution.put(score, count);
            }
            
            stats.put("heartScoreDistribution", heartScoreDistribution);

            // 최근 평가들
            List<ConsultantRating> recentRatings = ratingRepository.findTop10ByConsultantIdAndStatusOrderByRatedAtDesc(
                consultantId, ConsultantRating.RatingStatus.ACTIVE);
            
            List<Map<String, Object>> recentRatingsList = recentRatings.stream().map(rating -> {
                Map<String, Object> ratingInfo = new HashMap<>();
                ratingInfo.put("id", rating.getId());
                ratingInfo.put("heartScore", rating.getHeartScore());
                ratingInfo.put("comment", rating.getComment());
                ratingInfo.put("clientName", rating.getIsAnonymous() ? "익명" : rating.getClient().getName());
                ratingInfo.put("ratedAt", rating.getRatedAt());
                ratingInfo.put("isAnonymous", rating.getIsAnonymous());
                
                // 태그 파싱
                if (rating.getRatingTags() != null) {
                    try {
                        @SuppressWarnings("unchecked")
                        List<String> tags = objectMapper.readValue(rating.getRatingTags(), List.class);
                        ratingInfo.put("tags", tags);
                    } catch (JsonProcessingException e) {
                        ratingInfo.put("tags", Collections.emptyList());
                    }
                } else {
                    ratingInfo.put("tags", Collections.emptyList());
                }
                
                return ratingInfo;
            }).collect(Collectors.toList());
            
            stats.put("recentRatings", recentRatingsList);

            log.info("✅ 상담사 평가 통계 조회 완료: 상담사={}, 평균점수={}, 총개수={}", 
                consultantId, averageScore, totalCount);

            return stats;

        } catch (Exception e) {
            log.error("❌ 상담사 평가 통계 조회 실패: 상담사={}", consultantId, e);
            throw new RuntimeException("평가 통계를 불러오는데 실패했습니다.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConsultantRating> getConsultantRatings(Long consultantId, Pageable pageable) {
        return ratingRepository.findByConsultantIdAndStatusOrderByRatedAtDesc(consultantId, ConsultantRating.RatingStatus.ACTIVE, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConsultantRating> getClientRatings(Long clientId, Pageable pageable) {
        return ratingRepository.findByClientIdAndStatusOrderByRatedAtDesc(clientId, ConsultantRating.RatingStatus.ACTIVE, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConsultantRanking(Pageable pageable) {
        try {
            log.info("💖 상담사 랭킹 조회 시작");

            List<Object[]> rankings = ratingRepository.getConsultantRankingByAverageScore(ConsultantRating.RatingStatus.ACTIVE, pageable);

            List<Map<String, Object>> rankingList = new ArrayList<>();
            int rank = 1;

            for (Object[] row : rankings) {
                User consultant = (User) row[0];
                Double avgScore = (Double) row[1];
                Long totalCount = (Long) row[2];

                Map<String, Object> rankingInfo = new HashMap<>();
                rankingInfo.put("rank", rank++);
                rankingInfo.put("consultantId", consultant.getId());
                rankingInfo.put("consultantName", consultant.getName());
                rankingInfo.put("averageHeartScore", Math.round(avgScore * 10.0) / 10.0);
                rankingInfo.put("totalRatingCount", totalCount);
                rankingInfo.put("specialty", "전문분야"); // TODO: User 엔티티에 specialty 필드 추가 필요

                rankingList.add(rankingInfo);
            }

            log.info("✅ 상담사 랭킹 조회 완료: {}명", rankingList.size());

            return rankingList;

        } catch (Exception e) {
            log.error("❌ 상담사 랭킹 조회 실패", e);
            throw new RuntimeException("상담사 랭킹을 불러오는데 실패했습니다.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRatingStatsByPeriod(Long consultantId, LocalDateTime startDate, LocalDateTime endDate) {
        try {
            log.info("💖 기간별 평가 통계 조회: 상담사={}, 기간={} ~ {}", consultantId, startDate, endDate);

            List<ConsultantRating> ratings = ratingRepository.findByConsultantAndDateRange(
                consultantId, ConsultantRating.RatingStatus.ACTIVE, startDate, endDate);

            Map<String, Object> stats = new HashMap<>();
            stats.put("period", Map.of("start", startDate, "end", endDate));
            stats.put("totalCount", ratings.size());

            if (!ratings.isEmpty()) {
                double averageScore = ratings.stream()
                    .mapToInt(ConsultantRating::getHeartScore)
                    .average()
                    .orElse(0.0);
                stats.put("averageHeartScore", Math.round(averageScore * 10.0) / 10.0);

                // 일별 평가 개수
                Map<String, Long> dailyCount = ratings.stream()
                    .collect(Collectors.groupingBy(
                        rating -> rating.getRatedAt().toLocalDate().toString(),
                        Collectors.counting()
                    ));
                stats.put("dailyRatingCount", dailyCount);
            } else {
                stats.put("averageHeartScore", 0.0);
                stats.put("dailyRatingCount", Collections.emptyMap());
            }

            log.info("✅ 기간별 평가 통계 조회 완료: 상담사={}, 개수={}", consultantId, ratings.size());

            return stats;

        } catch (Exception e) {
            log.error("❌ 기간별 평가 통계 조회 실패: 상담사={}", consultantId, e);
            throw new RuntimeException("기간별 평가 통계를 불러오는데 실패했습니다.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPopularRatingTags(Long consultantId) {
        try {
            log.info("💖 인기 평가 태그 조회: 상담사={}", consultantId);

            List<ConsultantRating> ratings = ratingRepository.findByConsultantIdAndStatusOrderByRatedAtDesc(
                consultantId, ConsultantRating.RatingStatus.ACTIVE, Pageable.unpaged()).getContent();

            Map<String, Long> tagCount = new HashMap<>();

            for (ConsultantRating rating : ratings) {
                if (rating.getRatingTags() != null) {
                    try {
                        @SuppressWarnings("unchecked")
                        List<String> tags = objectMapper.readValue(rating.getRatingTags(), List.class);
                        for (String tag : tags) {
                            tagCount.put(tag, tagCount.getOrDefault(tag, 0L) + 1);
                        }
                    } catch (JsonProcessingException e) {
                        log.warn("태그 파싱 실패: {}", rating.getRatingTags());
                    }
                }
            }

            // 빈도순 정렬
            List<Map<String, Object>> popularTags = tagCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10) // 상위 10개만
                .map(entry -> {
                    Map<String, Object> tagInfo = new HashMap<>();
                    tagInfo.put("tag", entry.getKey());
                    tagInfo.put("count", entry.getValue());
                    return tagInfo;
                })
                .collect(Collectors.toList());

            log.info("✅ 인기 평가 태그 조회 완료: 상담사={}, 태그수={}", consultantId, popularTags.size());

            return popularTags;

        } catch (Exception e) {
            log.error("❌ 인기 평가 태그 조회 실패: 상담사={}", consultantId, e);
            throw new RuntimeException("인기 태그를 불러오는데 실패했습니다.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminRatingStatistics() {
        try {
            log.info("💖 관리자 평가 통계 조회 시작");

            Map<String, Object> stats = new HashMap<>();

            // 전체 평가 개수
            Long totalRatings = ratingRepository.count();
            stats.put("totalRatings", totalRatings != null ? totalRatings : 0L);

            // 전체 평균 점수
            String tenantId = TenantContextHolder.getRequiredTenantId();
            List<ConsultantRating> allRatings = ratingRepository.findByTenantId(tenantId);
            double averageScore = allRatings.stream()
                .filter(rating -> rating.getStatus() == ConsultantRating.RatingStatus.ACTIVE)
                .mapToInt(ConsultantRating::getHeartScore)
                .average()
                .orElse(0.0);
            stats.put("averageScore", Math.round(averageScore * 10.0) / 10.0);

            // 상담사 랭킹 (TOP 10)
            List<Map<String, Object>> topConsultants = getConsultantRanking(PageRequest.of(0, 10));
            stats.put("topConsultants", topConsultants);

            // 최근 7일 평가 동향
            
            List<Map<String, Object>> recentTrends = new ArrayList<>();
            for (int i = 6; i >= 0; i--) {
                LocalDateTime dayStart = LocalDateTime.now().minusDays(i).withHour(0).withMinute(0).withSecond(0);
                LocalDateTime dayEnd = dayStart.withHour(23).withMinute(59).withSecond(59);
                
                // 해당 날짜의 모든 평가 개수 조회
                long dayCount = ratingRepository.findByTenantId(tenantId).stream()
                    .filter(rating -> rating.getStatus() == ConsultantRating.RatingStatus.ACTIVE)
                    .filter(rating -> rating.getRatedAt().isAfter(dayStart) && rating.getRatedAt().isBefore(dayEnd))
                    .count();
                
                Map<String, Object> dayTrend = new HashMap<>();
                dayTrend.put("date", dayStart.toLocalDate().toString().substring(5)); // MM-dd 형식
                dayTrend.put("count", dayCount);
                recentTrends.add(dayTrend);
            }
            stats.put("recentTrends", recentTrends);

            log.info("✅ 관리자 평가 통계 조회 완료: 총평가={}, 평균점수={}, 상담사수={}", 
                totalRatings, averageScore, topConsultants.size());

            return stats;

        } catch (Exception e) {
            log.error("❌ 관리자 평가 통계 조회 실패", e);
            throw new RuntimeException("평가 통계를 불러오는데 실패했습니다.");
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminRatingStatisticsByBranch(String branchCode) {
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new HashMap<>();
            }
            
            log.info("💖 관리자 평가 통계 조회 시작 (테넌트 전체): tenantId={}", tenantId);

            Map<String, Object> stats = new HashMap<>();

            // 테넌트 전체 상담사들 조회
            List<User> consultants = userRepository.findByTenantIdAndRole(tenantId, UserRole.CONSULTANT);
            // isActive = true 필터링 (Java 스트림)
            List<User> branchConsultants = consultants.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .collect(Collectors.toList());
            
            final List<User> finalBranchConsultants = new ArrayList<>(branchConsultants); // 람다에서 사용하기 위한 final 변수
            List<Long> consultantIds = finalBranchConsultants.stream()
                .map(User::getId)
                .collect(Collectors.toList());
            
            log.info("🏢 테넌트 상담사 수: {}", consultantIds.size());

            // 해당 지점 상담사들의 평가만 조회
            List<ConsultantRating> branchRatings = ratingRepository.findByTenantId(tenantId).stream()
                .filter(rating -> consultantIds.contains(rating.getConsultant().getId()))
                .filter(rating -> rating.getStatus() == ConsultantRating.RatingStatus.ACTIVE)
                .collect(Collectors.toList());
            
            Long totalRatings = (long) branchRatings.size();
            stats.put("totalRatings", totalRatings);

            // 지점별 평균 점수
            double averageScore = branchRatings.stream()
                .filter(rating -> rating.getStatus() == ConsultantRating.RatingStatus.ACTIVE)
                .mapToInt(ConsultantRating::getHeartScore)
                .average()
                .orElse(0.0);
            stats.put("averageScore", Math.round(averageScore * 10.0) / 10.0);

            // 상담사 랭킹 (TOP 10) - 테넌트 전체
            List<Map<String, Object>> topConsultants = getConsultantRankingByBranch(null, PageRequest.of(0, 10));
            stats.put("topConsultants", topConsultants);

            // 최근 7일 평가 동향
            List<Map<String, Object>> recentTrends = new ArrayList<>();
            for (int i = 6; i >= 0; i--) {
                LocalDateTime dayStart = LocalDateTime.now().minusDays(i).withHour(0).withMinute(0).withSecond(0);
                LocalDateTime dayEnd = dayStart.withHour(23).withMinute(59).withSecond(59);
                
                // 해당 날짜의 지점 평가 개수 조회
                long dayCount = branchRatings.stream()
                    .filter(rating -> rating.getStatus() == ConsultantRating.RatingStatus.ACTIVE)
                    .filter(rating -> rating.getRatedAt().isAfter(dayStart) && rating.getRatedAt().isBefore(dayEnd))
                    .count();
                
                Map<String, Object> dayTrend = new HashMap<>();
                dayTrend.put("date", dayStart.toLocalDate().toString().substring(5)); // MM-dd 형식
                dayTrend.put("count", dayCount);
                recentTrends.add(dayTrend);
            }
            stats.put("recentTrends", recentTrends);
            stats.put("tenantId", tenantId);

            log.info("✅ 관리자 평가 통계 조회 완료 (테넌트 전체): 총평가={}, 평균점수={}, 상담사수={}", 
                totalRatings, averageScore, topConsultants.size());

            return stats;

        } catch (Exception e) {
            log.error("❌ 관리자 평가 통계 조회 실패 (지점별): branchCode={}", branchCode, e);
            throw new RuntimeException("평가 통계를 불러오는데 실패했습니다.");
        }
    }
    
    /**
     * 지점별 상담사 랭킹 조회
     */
    private List<Map<String, Object>> getConsultantRankingByBranch(String branchCode, Pageable pageable) {
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new ArrayList<>();
            }
            
            // 해당 지점의 상담사들 조회 (브랜치 엔티티 기반)
            List<User> branchConsultants;
            if (branchCode == null || branchCode.trim().isEmpty()) {
                branchConsultants = new ArrayList<>();
            } else {
                try {
                    Branch branch = branchService.getBranchByCode(branchCode);
                    List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(tenantId, branch, UserRole.CONSULTANT);
                    // isActive = true 필터링 (Java 스트림)
                    branchConsultants = consultants.stream()
                        .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                        .collect(Collectors.toList());
                } catch (com.coresolution.consultation.exception.EntityNotFoundException e) {
                    log.warn("브랜치를 찾을 수 없습니다: {}", branchCode);
                    branchConsultants = new ArrayList<>();
                }
            }
            final List<User> finalBranchConsultants = new ArrayList<>(branchConsultants); // 람다에서 사용하기 위한 final 변수
            List<Long> consultantIds = finalBranchConsultants.stream()
                .map(User::getId)
                .collect(Collectors.toList());
            
            if (consultantIds.isEmpty()) {
                return new ArrayList<>();
            }
            
            // 해당 지점 상담사들의 평가만 조회하여 랭킹 계산
            List<ConsultantRating> branchRatings = ratingRepository.findByTenantId(tenantId).stream()
                .filter(rating -> consultantIds.contains(rating.getConsultant().getId()))
                .filter(rating -> rating.getStatus() == ConsultantRating.RatingStatus.ACTIVE)
                .collect(Collectors.toList());
            
            // 상담사별 평균 점수 계산
            Map<Long, Double> consultantAverages = branchRatings.stream()
                .collect(Collectors.groupingBy(
                    rating -> rating.getConsultant().getId(),
                    Collectors.averagingInt(ConsultantRating::getHeartScore)
                ));
            
            // 상담사별 평가 개수 계산
            Map<Long, Long> consultantCounts = branchRatings.stream()
                .collect(Collectors.groupingBy(
                    rating -> rating.getConsultant().getId(),
                    Collectors.counting()
                ));
            
            // 랭킹 생성
            List<Map<String, Object>> ranking = consultantAverages.entrySet().stream()
                .filter(entry -> entry.getValue() > 0) // 평균 점수가 0보다 큰 경우만
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(pageable.getPageSize())
                .map(entry -> {
                    Long consultantId = entry.getKey();
                    Double averageScore = entry.getValue();
                    Long ratingCount = consultantCounts.getOrDefault(consultantId, 0L);
                    
                    // 상담사 정보 조회
                    User consultant = finalBranchConsultants.stream()
                        .filter(c -> c.getId().equals(consultantId))
                        .findFirst()
                        .orElse(null);
                    
                    Map<String, Object> consultantData = new HashMap<>();
                    consultantData.put("consultantId", consultantId);
                    consultantData.put("consultantName", consultant != null ? consultant.getName() : "알 수 없음");
                    consultantData.put("averageScore", Math.round(averageScore * 10.0) / 10.0);
                    consultantData.put("ratingCount", ratingCount);
                    
                    return consultantData;
                })
                .collect(Collectors.toList());
            
            return ranking;
            
        } catch (Exception e) {
            log.error("❌ 상담사 랭킹 조회 실패 (테넌트 전체)", e);
            return new ArrayList<>();
        }
    }

    /**
     * 상담 유형을 한글 표시명으로 변환
     */
    private String getConsultationTypeDisplayName(String consultationType) {
        if (consultationType == null) {
            return "일반상담";
        }
        
        switch (consultationType.toUpperCase()) {
            case "INDIVIDUAL":
                return "개인상담";
            case "FAMILY":
                return "가족상담";
            case "COUPLE":
                return "부부상담";
            case "GROUP":
                return "집단상담";
            case "INITIAL":
                return "초기상담";
            case "FOLLOW_UP":
                return "후속상담";
            case "CRISIS":
                return "위기상담";
            case "ASSESSMENT":
                return "심리평가";
            default:
                return "일반상담";
        }
    }
}
