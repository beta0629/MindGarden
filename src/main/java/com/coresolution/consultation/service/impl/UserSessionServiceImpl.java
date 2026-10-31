package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.repository.UserSessionRepository;
import com.coresolution.consultation.service.UserSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 사용자 세션 관리 서비스 구현체
 * 중복 로그인 방지 기능 구현
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
@Slf4j
@Service
@Transactional
public class UserSessionServiceImpl implements UserSessionService {
    
    @Autowired
    private UserSessionRepository userSessionRepository;

    @Autowired
    private SessionTimeoutProperties sessionTimeoutProperties;
    
    @Override
    public UserSession createSession(User user, String sessionId, String clientIp, String userAgent, 
                                   String loginType, String socialProvider) {
        try {
            log.info("🔐 새 세션 생성 시작: userId={}, sessionId={}, loginType={}", 
                    user.getId(), sessionId, loginType);

            LocalDateTime now = LocalDateTime.now();
            int timeoutSeconds = sessionTimeoutProperties.getTimeoutSecondsForRole(user.getRole());

            // 동일 sid 활성 세션이 있으면 삭제하지 않고 upsert(슬라이드) — 병렬 ensureActiveSession 레이스 방지
            Optional<UserSession> activeExisting =
                    userSessionRepository.findActiveSessionBySessionId(sessionId, now);
            if (activeExisting.isPresent()) {
                UserSession existing = activeExisting.get();
                existing.setLastActivityAt(now);
                existing.extendExpirationSeconds(timeoutSeconds);
                if (clientIp != null) {
                    existing.setClientIp(clientIp);
                }
                if (userAgent != null) {
                    existing.setUserAgent(userAgent);
                }
                if (loginType != null) {
                    existing.setLoginType(loginType);
                }
                if (socialProvider != null) {
                    existing.setSocialProvider(socialProvider);
                }
                UserSession saved = userSessionRepository.save(existing);
                log.info("✅ 세션 upsert(기존 활성 유지): userId={}, sessionId={}",
                        user.getId(), sessionId);
                return saved;
            }

            // 비활성·만료 행만 정리 후 신규 생성 (활성 행은 위 분기로 이미 return)
            log.info("🧹 기존 비활성/만료 세션 정리 시작: sessionId={}", sessionId);
            try {
                userSessionRepository.deleteBySessionId(sessionId);
                log.info("🗑️ 기존 세션 삭제 완료: sessionId={}", sessionId);
            } catch (Exception e) {
                log.warn("⚠️ 기존 세션 삭제 중 오류 (무시하고 계속): sessionId={}, error={}", sessionId, e.getMessage());
            }

            // 삭제~저장 사이 병렬 create 레이스: 다시 활성 확인
            activeExisting = userSessionRepository.findActiveSessionBySessionId(sessionId, LocalDateTime.now());
            if (activeExisting.isPresent()) {
                UserSession existing = activeExisting.get();
                existing.setLastActivityAt(LocalDateTime.now());
                existing.extendExpirationSeconds(timeoutSeconds);
                UserSession saved = userSessionRepository.save(existing);
                log.info("✅ 세션 upsert(레이스 재확인): userId={}, sessionId={}",
                        user.getId(), sessionId);
                return saved;
            }
            
            UserSession userSession = UserSession.builder()
                    .user(user)
                    .sessionId(sessionId)
                    .lastActivityAt(now)
                    .expiresAt(now.plusSeconds(timeoutSeconds))
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .loginType(loginType)
                    .socialProvider(socialProvider)
                    .isActive(true)
                    .build();
            
            // 테넌트 ID 설정 (User 엔티티에서 가져오기)
            String tenantId = user.getTenantId();
            if (tenantId == null) {
                // TenantContext에서 가져오기 (폴백)
                tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
            }
            userSession.setTenantId(tenantId);
            
            UserSession savedSession = userSessionRepository.save(userSession);
            log.info("✅ 세션 생성 완료: userId={}, sessionId={}", user.getId(), sessionId);
            return savedSession;
            
        } catch (Exception e) {
            log.error("❌ 세션 생성 실패: userId={}, sessionId={}, error={}", 
                     user.getId(), sessionId, e.getMessage(), e);
            throw new RuntimeException("세션 생성에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public UserSession getActiveSession(String sessionId) {
        try {
            LocalDateTime now = LocalDateTime.now();
            log.info("🔍 활성 세션 조회 시작: sessionId={}, 현재 시간={}", sessionId, now);
            
            Optional<UserSession> session = userSessionRepository.findActiveSessionBySessionId(sessionId, now);
            
            if (session.isPresent()) {
                UserSession userSession = session.get();
                log.info("✅ 활성 세션 조회 성공: sessionId={}, userId={}, isActive={}, expiresAt={}, now={}", 
                        sessionId, userSession.getUser().getId(), userSession.getIsActive(), 
                        userSession.getExpiresAt(), now);
                return userSession;
            } else {
                log.warn("⚠️ 활성 세션 조회 실패: sessionId={}, 현재 시간={} - 세션을 찾을 수 없음", sessionId, now);
                // 디버깅: 모든 세션 조회 (활성/비활성 포함)
                List<UserSession> allSessions = userSessionRepository.findBySessionId(sessionId);
                if (!allSessions.isEmpty()) {
                    UserSession firstSession = allSessions.get(0);
                    log.warn("🔍 세션은 존재하지만 활성 조건 불일치: sessionId={}, isActive={}, expiresAt={}, now={}", 
                            sessionId, firstSession.getIsActive(), firstSession.getExpiresAt(), now);
                } else {
                    log.warn("🔍 세션 자체가 존재하지 않음: sessionId={}", sessionId);
                }
                return null;
            }
        } catch (Exception e) {
            log.error("❌ 활성 세션 조회 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
            return null;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserSession> getActiveSessions(User user) {
        try {
            return userSessionRepository.findAllActiveSessionsByUser(user.getId(), LocalDateTime.now());
        } catch (Exception e) {
            log.error("❌ 사용자 활성 세션 조회 실패: userId={}, error={}", user.getId(), e.getMessage(), e);
            return List.of();
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public long getActiveSessionCount(User user) {
        try {
            String tenantId = user.getTenantId();
            if (tenantId != null && !tenantId.trim().isEmpty()) {
                return userSessionRepository.countActiveSessionsByTenantIdAndUser(
                    tenantId.trim(), user.getId(), LocalDateTime.now());
            }
            log.warn("⚠️ getActiveSessionCount: tenantId 없음 — 전역(deprecated) 카운트 사용 userId={}", user.getId());
            return userSessionRepository.countActiveSessionsByUser(user.getId(), LocalDateTime.now());
        } catch (Exception e) {
            log.error("❌ 활성 세션 수 조회 실패: userId={}, error={}", user.getId(), e.getMessage(), e);
            return 0;
        }
    }
    
    @Override
    public boolean checkAndHandleDuplicateLogin(User user) {
        try {
            long activeSessionCount = getActiveSessionCount(user);
            
            if (activeSessionCount > 0) {
                log.warn("⚠️ 중복 로그인 감지: userId={}, activeSessions={}", user.getId(), activeSessionCount);
                
                if (SessionManagementConstants.TERMINATE_EXISTING_SESSION) {
                    // 기존 세션들 종료
                    int terminatedCount = deactivateAllUserSessions(user, SessionManagementConstants.END_REASON_DUPLICATE_LOGIN);
                    log.info("🔄 기존 세션 종료 완료: userId={}, terminatedCount={}", user.getId(), terminatedCount);
                }
                
                return true; // 중복 로그인 감지됨
            }
            
            return false; // 중복 로그인 없음
            
        } catch (Exception e) {
            log.error("❌ 중복 로그인 체크 실패: userId={}, error={}", user.getId(), e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 현재 세션을 제외한 중복 로그인 체크
     */
    @Override
    public boolean checkDuplicateLoginExcludingCurrent(User user, String currentSessionId) {
        try {
            List<UserSession> activeSessions = getActiveSessions(user);
            LocalDateTime now = LocalDateTime.now();
            
            // 현재 세션을 제외하고, 만료되지 않은 활성 세션 수 계산
            long otherActiveSessions = activeSessions.stream()
                    .filter(session -> {
                        // 현재 세션 ID와 다르고
                        boolean isNotCurrentSession = !session.getSessionId().equals(currentSessionId);
                        // 만료되지 않았고
                        boolean isNotExpired = session.getExpiresAt() == null || 
                                             session.getExpiresAt().isAfter(now);
                        // 활성 상태인 세션만
                        boolean isActive = session.getIsActive() != null && session.getIsActive();
                        
                        return isNotCurrentSession && isNotExpired && isActive;
                    })
                    .count();
            
            if (otherActiveSessions > 0) {
                log.warn("⚠️ 중복 로그인 감지 (현재 세션 제외): userId={}, otherActiveSessions={}, currentSessionId={}", 
                        user.getId(), otherActiveSessions, currentSessionId);
                return true;
            }
            
            log.debug("✅ 중복 로그인 없음: userId={}, currentSessionId={}", user.getId(), currentSessionId);
            return false;
            
        } catch (Exception e) {
            log.error("❌ 중복 로그인 체크 실패: userId={}, error={}", user.getId(), e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean deactivateSession(String sessionId, String reason) {
        try {
            int updatedCount = userSessionRepository.deactivateSessionBySessionId(sessionId, LocalDateTime.now(), reason);
            
            if (updatedCount > 0) {
                log.info("✅ 세션 비활성화 완료: sessionId={}, reason={}", sessionId, reason);
                return true;
            } else {
                log.warn("⚠️ 세션 비활성화 실패: sessionId={}, reason={}", sessionId, reason);
                return false;
            }
            
        } catch (Exception e) {
            log.error("❌ 세션 비활성화 실패: sessionId={}, reason={}, error={}", 
                     sessionId, reason, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean deactivateSessionForTenant(String tenantId, String sessionId, String reason) {
        if (tenantId == null || tenantId.isBlank() || sessionId == null || sessionId.isBlank()) {
            log.warn("⚠️ deactivateSessionForTenant 스킵: tenantId 또는 sessionId 없음 tenantId={}", tenantId);
            return false;
        }
        try {
            int updatedCount = userSessionRepository.deactivateSessionByTenantIdAndSessionId(
                tenantId.trim(), sessionId, LocalDateTime.now(), reason);
            log.info("✅ 테넌트 세션 비활성화: tenantId={}, sessionId={}, reason={}, count={}",
                tenantId, sessionId, reason, updatedCount);
            return updatedCount > 0;
        } catch (Exception e) {
            log.error("❌ 테넌트 세션 비활성화 실패: tenantId={}, sessionId={}, reason={}, error={}",
                tenantId, sessionId, reason, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public int deactivateAllUserSessions(User user, String reason) {
        try {
            int updatedCount = userSessionRepository.deactivateAllUserSessions(user.getId(), LocalDateTime.now(), reason);
            log.info("✅ 사용자 모든 세션 비활성화 완료: userId={}, reason={}, count={}", 
                    user.getId(), reason, updatedCount);
            return updatedCount;
            
        } catch (Exception e) {
            log.error("❌ 사용자 모든 세션 비활성화 실패: userId={}, reason={}, error={}", 
                     user.getId(), reason, e.getMessage(), e);
            return 0;
        }
    }
    
    @Override
    public int deactivateAllSessionsForTenantUser(String tenantId, Long userId, String reason) {
        if (tenantId == null || tenantId.isBlank() || userId == null) {
            log.warn("⚠️ deactivateAllSessionsForTenantUser 스킵: tenantId 또는 userId 없음 tenantId={}, userId={}",
                tenantId, userId);
            return 0;
        }
        try {
            LocalDateTime now = LocalDateTime.now();
            int updatedCount = userSessionRepository.deactivateAllUserSessionsByTenantId(
                tenantId.trim(), userId, now, reason);
            log.info("✅ 테넌트·사용자 세션 일괄 비활성화: tenantId={}, userId={}, reason={}, count={}",
                tenantId, userId, reason, updatedCount);
            return updatedCount;
        } catch (Exception e) {
            log.error("❌ 테넌트·사용자 세션 일괄 비활성화 실패: tenantId={}, userId={}, reason={}, error={}",
                tenantId, userId, reason, e.getMessage(), e);
            return 0;
        }
    }

    @Override
    public int deactivateOtherSessionsForTenantUser(String tenantId, Long userId,
            String excludeSessionId, String reason) {
        if (tenantId == null || tenantId.isBlank() || userId == null
                || excludeSessionId == null || excludeSessionId.isBlank()) {
            log.warn("⚠️ deactivateOtherSessionsForTenantUser 스킵: 필수값 없음 tenantId={}, userId={}, exclude={}",
                    tenantId, userId, excludeSessionId);
            return 0;
        }
        try {
            int updatedCount = userSessionRepository.deactivateOtherUserSessionsByTenantId(
                    tenantId.trim(), userId, excludeSessionId, LocalDateTime.now(), reason);
            log.info("✅ 타 세션 비활성화(현재 제외): tenantId={}, userId={}, exclude={}, reason={}, count={}",
                    tenantId, userId, excludeSessionId, reason, updatedCount);
            return updatedCount;
        } catch (Exception e) {
            log.error("❌ 타 세션 비활성화 실패: tenantId={}, userId={}, exclude={}, reason={}, error={}",
                    tenantId, userId, excludeSessionId, reason, e.getMessage(), e);
            return 0;
        }
    }
    
    @Override
    public boolean updateLastActivity(String sessionId) {
        try {
            UserSession session = getActiveSession(sessionId);
            if (session != null) {
                session.updateLastActivity();
                userSessionRepository.save(session);
                return true;
            }
            return false;
            
        } catch (Exception e) {
            log.error("❌ 세션 활동 시간 업데이트 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean extendSession(String sessionId, int minutes) {
        try {
            UserSession session = getActiveSession(sessionId);
            if (session != null) {
                session.extendExpiration(minutes);
                userSessionRepository.save(session);
                log.info("✅ 세션 연장 완료: sessionId={}, minutes={}", sessionId, minutes);
                return true;
            }
            return false;
            
        } catch (Exception e) {
            log.error("❌ 세션 연장 실패: sessionId={}, minutes={}, error={}", 
                     sessionId, minutes, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean slideActiveSession(String sessionId, int timeoutSeconds, long throttleSeconds) {
        if (sessionId == null || sessionId.isBlank() || timeoutSeconds <= 0) {
            return false;
        }
        try {
            UserSession session = getActiveSession(sessionId);
            if (session == null) {
                return false;
            }
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime lastActivity = session.getLastActivityAt();
            if (throttleSeconds > 0
                    && lastActivity != null
                    && lastActivity.plusSeconds(throttleSeconds).isAfter(now)) {
                log.debug("세션 슬라이딩 스로틀 스킵: sessionId={}, lastActivityAt={}",
                        sessionId, lastActivity);
                return true;
            }
            session.updateLastActivity();
            session.extendExpirationSeconds(timeoutSeconds);
            userSessionRepository.save(session);
            log.debug("✅ 세션 슬라이딩 연장: sessionId={}, timeoutSeconds={}", sessionId, timeoutSeconds);
            return true;
        } catch (Exception e) {
            log.error("❌ 세션 슬라이딩 실패: sessionId={}, timeoutSeconds={}, error={}",
                    sessionId, timeoutSeconds, e.getMessage(), e);
            return false;
        }
    }

    @Override
    public int cleanupDuplicateSessions(String sessionId) {
        try {
            log.info("🧹 중복 세션 정리 시작: sessionId={}", sessionId);
            
            // 같은 sessionId를 가진 모든 세션 조회
            List<UserSession> duplicateSessions = userSessionRepository.findBySessionId(sessionId);
            log.info("🔍 조회된 중복 세션 수: sessionId={}, count={}", sessionId, duplicateSessions.size());
            
            if (duplicateSessions.isEmpty()) {
                log.info("✅ 중복 세션 없음: sessionId={}", sessionId);
                return 0;
            }
            
            // 가장 최근 세션을 제외하고 나머지 삭제
            UserSession latestSession = duplicateSessions.stream()
                .max(Comparator.comparing(UserSession::getCreatedAt))
                .orElse(null);
            
            log.info("📅 가장 최근 세션: sessionId={}, latestId={}", sessionId, latestSession != null ? latestSession.getId() : "null");
            
            int deletedCount = 0;
            for (UserSession session : duplicateSessions) {
                if (!session.equals(latestSession)) {
                    userSessionRepository.delete(session);
                    deletedCount++;
                    log.info("🗑️ 중복 세션 삭제: id={}, sessionId={}", session.getId(), sessionId);
                }
            }
            
            log.info("✅ 중복 세션 정리 완료: sessionId={}, deletedCount={}", sessionId, deletedCount);
            return deletedCount;
            
        } catch (Exception e) {
            log.error("❌ 중복 세션 정리 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
            return 0;
        }
    }
    
    @Override
    public int cleanupExpiredSessions() {
        try {
            int cleanedCount = userSessionRepository.deactivateExpiredSessions(LocalDateTime.now());
            log.debug("🧹 만료된 세션 정리 완료: count={}", cleanedCount);
            return cleanedCount;

        } catch (Exception e) {
            if (isRetryableSessionCleanupFailure(e)) {
                throw e instanceof RuntimeException runtime
                        ? runtime
                        : new RuntimeException("만료된 세션 정리 실패(재시도 가능)", e);
            }
            log.error("❌ 만료된 세션 정리 실패: error={}", e.getMessage(), e);
            return 0;
        }
    }

    private static boolean isRetryableSessionCleanupFailure(Throwable error) {
        Throwable current = error;
        for (int depth = 0; current != null && depth < 8; depth++) {
            if (current instanceof java.sql.SQLException sqlEx) {
                String sqlState = sqlEx.getSQLState();
                if ("40001".equals(sqlState) || "40P01".equals(sqlState)) {
                    return true;
                }
                if ("HY000".equals(sqlState) && sqlEx.getErrorCode() == 1213) {
                    return true;
                }
            }
            String message = current.getMessage();
            if (message != null) {
                String lower = message.toLowerCase();
                if (lower.contains("deadlock") || lower.contains("try restarting transaction")) {
                    return true;
                }
            }
            current = current.getCause();
        }
        return false;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Object[]> getSessionStatistics() {
        try {
            return userSessionRepository.getActiveSessionStatistics(LocalDateTime.now());
        } catch (Exception e) {
            log.error("❌ 세션 통계 조회 실패: error={}", e.getMessage(), e);
            return List.of();
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean detectSuspiciousActivity(String clientIp) {
        try {
            List<UserSession> sessions = userSessionRepository.findActiveSessionsByClientIp(clientIp, LocalDateTime.now());
            boolean isSuspicious = sessions.size() >= SessionManagementConstants.SUSPICIOUS_ACTIVITY_THRESHOLD;
            
            if (isSuspicious) {
                log.warn("🚨 의심스러운 활동 감지: clientIp={}, sessionCount={}", clientIp, sessions.size());
            }
            
            return isSuspicious;
            
        } catch (Exception e) {
            log.error("❌ 의심스러운 활동 감지 실패: clientIp={}, error={}", clientIp, e.getMessage(), e);
            return false;
        }
    }
}
