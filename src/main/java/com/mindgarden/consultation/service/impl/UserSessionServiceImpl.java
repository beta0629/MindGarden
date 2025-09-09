package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.constant.SessionManagementConstants;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSession;
import com.mindgarden.consultation.repository.UserSessionRepository;
import com.mindgarden.consultation.service.UserSessionService;
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
    
    @Override
    public UserSession createSession(User user, String sessionId, String clientIp, String userAgent, 
                                   String loginType, String socialProvider) {
        try {
            log.info("🔐 새 세션 생성 시작: userId={}, sessionId={}, loginType={}", 
                    user.getId(), sessionId, loginType);
            
            // 새 세션 생성 (중복 로그인 체크는 AuthService에서 처리)
            LocalDateTime now = LocalDateTime.now();
            UserSession userSession = UserSession.builder()
                    .user(user)
                    .sessionId(sessionId)
                    .createdAt(now)
                    .lastActivityAt(now)
                    .expiresAt(now.plusMinutes(SessionManagementConstants.DEFAULT_SESSION_TIMEOUT_MINUTES))
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .loginType(loginType)
                    .socialProvider(socialProvider)
                    .isActive(true)
                    .build();
            
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
            Optional<UserSession> session = userSessionRepository.findActiveSessionBySessionId(sessionId, LocalDateTime.now());
            return session.orElse(null);
        } catch (Exception e) {
            log.error("❌ 활성 세션 조회 실패: sessionId={}, error={}", sessionId, e.getMessage(), e);
            return null;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UserSession> getActiveSessions(User user) {
        try {
            return userSessionRepository.findAllActiveSessionsByUser(user, LocalDateTime.now());
        } catch (Exception e) {
            log.error("❌ 사용자 활성 세션 조회 실패: userId={}, error={}", user.getId(), e.getMessage(), e);
            return List.of();
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public long getActiveSessionCount(User user) {
        try {
            return userSessionRepository.countActiveSessionsByUser(user, LocalDateTime.now());
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
            
            // 현재 세션을 제외한 활성 세션 수 계산
            long otherActiveSessions = activeSessions.stream()
                    .filter(session -> !session.getSessionId().equals(currentSessionId))
                    .count();
            
            if (otherActiveSessions > 0) {
                log.warn("⚠️ 중복 로그인 감지 (현재 세션 제외): userId={}, otherActiveSessions={}", 
                        user.getId(), otherActiveSessions);
                return true;
            }
            
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
    public int deactivateAllUserSessions(User user, String reason) {
        try {
            int updatedCount = userSessionRepository.deactivateAllUserSessions(user, LocalDateTime.now(), reason);
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
    public int cleanupExpiredSessions() {
        try {
            int cleanedCount = userSessionRepository.deactivateExpiredSessions(LocalDateTime.now());
            log.info("🧹 만료된 세션 정리 완료: count={}", cleanedCount);
            return cleanedCount;
            
        } catch (Exception e) {
            log.error("❌ 만료된 세션 정리 실패: error={}", e.getMessage(), e);
            return 0;
        }
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
