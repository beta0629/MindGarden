package com.mindgarden.consultation.service;

import java.util.List;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSession;

/**
 * 사용자 세션 관리 서비스 인터페이스
 * 중복 로그인 방지 기능 제공
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-09
 */
public interface UserSessionService {
    
    /**
     * 새로운 세션 생성
     * 
     * @param user 사용자 정보
     * @param sessionId HTTP 세션 ID
     * @param clientIp 클라이언트 IP
     * @param userAgent 사용자 에이전트
     * @param loginType 로그인 타입 (NORMAL, SOCIAL)
     * @param socialProvider 소셜 로그인 제공자 (선택사항)
     * @return 생성된 UserSession
     */
    UserSession createSession(User user, String sessionId, String clientIp, String userAgent, 
                            String loginType, String socialProvider);
    
    /**
     * 세션 ID로 활성 세션 조회
     * 
     * @param sessionId HTTP 세션 ID
     * @return 활성 세션 정보 (없으면 null)
     */
    UserSession getActiveSession(String sessionId);
    
    /**
     * 사용자의 모든 활성 세션 조회
     * 
     * @param user 사용자 정보
     * @return 활성 세션 목록
     */
    List<UserSession> getActiveSessions(User user);
    
    /**
     * 사용자의 활성 세션 수 조회
     * 
     * @param user 사용자 정보
     * @return 활성 세션 수
     */
    long getActiveSessionCount(User user);
    
    /**
     * 중복 로그인 체크 및 처리
     * 
     * @param user 사용자 정보
     * @return 중복 로그인 여부
     */
    boolean checkAndHandleDuplicateLogin(User user);
    
    /**
     * 현재 세션을 제외한 중복 로그인 체크
     * 
     * @param user 사용자 정보
     * @param currentSessionId 현재 세션 ID
     * @return 중복 로그인 여부
     */
    boolean checkDuplicateLoginExcludingCurrent(User user, String currentSessionId);
    
    /**
     * 세션 비활성화
     * 
     * @param sessionId HTTP 세션 ID
     * @param reason 종료 사유
     * @return 처리 성공 여부
     */
    boolean deactivateSession(String sessionId, String reason);
    
    /**
     * 사용자의 모든 세션 비활성화
     * 
     * @param user 사용자 정보
     * @param reason 종료 사유
     * @return 처리된 세션 수
     */
    int deactivateAllUserSessions(User user, String reason);
    
    /**
     * 세션 활동 시간 업데이트
     * 
     * @param sessionId HTTP 세션 ID
     * @return 업데이트 성공 여부
     */
    boolean updateLastActivity(String sessionId);
    
    /**
     * 세션 만료 시간 연장
     * 
     * @param sessionId HTTP 세션 ID
     * @param minutes 연장할 시간 (분)
     * @return 연장 성공 여부
     */
    boolean extendSession(String sessionId, int minutes);
    
    /**
     * 중복 세션 정리 (같은 sessionId를 가진 중복 세션 삭제)
     * 
     * @param sessionId 중복된 세션 ID
     * @return 정리된 세션 수
     */
    int cleanupDuplicateSessions(String sessionId);
    
    /**
     * 만료된 세션 정리
     * 
     * @return 정리된 세션 수
     */
    int cleanupExpiredSessions();
    
    /**
     * 사용자 세션 통계 조회
     * 
     * @return 세션 통계 정보
     */
    List<Object[]> getSessionStatistics();
    
    /**
     * 의심스러운 활동 감지
     * 
     * @param clientIp 클라이언트 IP
     * @return 의심스러운 활동 여부
     */
    boolean detectSuspiciousActivity(String clientIp);
}
