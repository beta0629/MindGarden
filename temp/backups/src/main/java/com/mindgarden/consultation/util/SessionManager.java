package com.mindgarden.consultation.util;

import com.mindgarden.consultation.constant.SessionConstants;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserSocialAccount;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * 세션 관리 유틸리티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionManager {

    // PersonalDataEncryptionUtil은 제거 - 복호화된 데이터를 직접 받도록 수정

    /**
     * 현재 HTTP 세션 가져오기
     */
    public HttpSession getCurrentSession() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            return attributes.getRequest().getSession(true);
        }
        return null;
    }

    /**
     * 로그인 세션 생성
     * 
     * @param user 사용자 정보
     * @param isSocialLogin 소셜 로그인 여부
     * @param socialProvider 소셜 제공자
     */
    public void createLoginSession(User user, boolean isSocialLogin, String socialProvider) {
        HttpSession session = getCurrentSession();
        if (session == null) {
            log.error("세션을 생성할 수 없습니다.");
            return;
        }

        try {
            // 로그인 세션 정보 설정
            session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_ID, user.getId());
            session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_EMAIL, user.getEmail());
            session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_ROLE, user.getRole());
            session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.LOGIN_TIME, LocalDateTime.now());
            session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.LAST_ACTIVITY_TIME, LocalDateTime.now());
            session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.IS_SOCIAL_LOGIN, isSocialLogin);
            
            if (isSocialLogin && socialProvider != null) {
                session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.SOCIAL_PROVIDER, socialProvider);
            }

            // 세션 타임아웃 설정
            session.setMaxInactiveInterval(SessionConstants.SESSION_TIMEOUT_SECONDS);

            log.info("로그인 세션 생성 완료: userId={}, email={}", user.getId(), user.getEmail());

        } catch (Exception e) {
            log.error("로그인 세션 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("로그인 세션 생성에 실패했습니다.", e);
        }
    }

    /**
     * 비즈니스 로직 세션 생성 (복호화된 사용자 정보)
     * 
     * @param user 사용자 정보
     * @param socialAccount 소셜 계정 정보 (선택사항)
     * @param decryptedUserData 복호화된 사용자 데이터 (Map 형태)
     */
    public void createBusinessSession(User user, UserSocialAccount socialAccount, Map<String, Object> decryptedUserData) {
        HttpSession session = getCurrentSession();
        if (session == null) {
            log.error("세션을 생성할 수 없습니다.");
            return;
        }

        try {
            // 복호화된 사용자 프로필 정보를 직접 사용
            Map<String, Object> userProfile = new HashMap<>(decryptedUserData);
            userProfile.put(SessionConstants.USER_BIRTH_DATE, user.getBirthDate());
            userProfile.put(SessionConstants.USER_PROFILE_IMAGE, user.getProfileImageUrl());

            // 소셜 계정 정보가 있는 경우 추가
            if (socialAccount != null) {
                userProfile.put("socialProvider", socialAccount.getProvider());
                userProfile.put("socialUsername", socialAccount.getProviderUsername()); // 이미 복호화된 데이터
                userProfile.put("socialProfileImage", socialAccount.getProviderProfileImage());
            }

            // 비즈니스 세션에 프로필 정보 저장
            session.setAttribute(SessionConstants.BUSINESS_SESSION_NAMESPACE + "." + SessionConstants.USER_PROFILE, userProfile);
            session.setAttribute(SessionConstants.BUSINESS_SESSION_NAMESPACE + "." + SessionConstants.LAST_ACTIVITY_TIME, LocalDateTime.now());

            // 비즈니스 세션 타임아웃 설정 (로그인 세션보다 길게)
            int businessTimeout = Math.max(session.getMaxInactiveInterval(), SessionConstants.BUSINESS_SESSION_TIMEOUT_SECONDS);
            session.setMaxInactiveInterval(businessTimeout);

            log.info("비즈니스 세션 생성 완료: userId={}", user.getId());

        } catch (Exception e) {
            log.error("비즈니스 세션 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException("비즈니스 세션 생성에 실패했습니다.", e);
        }
    }

    /**
     * 로그인 세션 정보 가져오기
     */
    public Optional<Map<String, Object>> getLoginSession() {
        HttpSession session = getCurrentSession();
        if (session == null) {
            return Optional.empty();
        }

        try {
            Map<String, Object> loginSession = new HashMap<>();
            loginSession.put(SessionConstants.USER_ID, session.getAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_ID));
            loginSession.put(SessionConstants.USER_EMAIL, session.getAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_EMAIL));
            loginSession.put(SessionConstants.USER_ROLE, session.getAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_ROLE));
            loginSession.put(SessionConstants.LOGIN_TIME, session.getAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.LOGIN_TIME));
            loginSession.put(SessionConstants.LAST_ACTIVITY_TIME, session.getAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.LAST_ACTIVITY_TIME));
            loginSession.put(SessionConstants.IS_SOCIAL_LOGIN, session.getAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.IS_SOCIAL_LOGIN));
            loginSession.put(SessionConstants.SOCIAL_PROVIDER, session.getAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.SOCIAL_PROVIDER));

            return Optional.of(loginSession);
        } catch (Exception e) {
            log.error("로그인 세션 정보 가져오기 실패: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * 비즈니스 세션 정보 가져오기
     */
    public Optional<Map<String, Object>> getBusinessSession() {
        HttpSession session = getCurrentSession();
        if (session == null) {
            return Optional.empty();
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> userProfile = (Map<String, Object>) session.getAttribute(SessionConstants.BUSINESS_SESSION_NAMESPACE + "." + SessionConstants.USER_PROFILE);
            
            if (userProfile != null) {
                Map<String, Object> businessSession = new HashMap<>(userProfile);
                businessSession.put(SessionConstants.LAST_ACTIVITY_TIME, session.getAttribute(SessionConstants.BUSINESS_SESSION_NAMESPACE + "." + SessionConstants.LAST_ACTIVITY_TIME));
                return Optional.of(businessSession);
            }

            return Optional.empty();
        } catch (Exception e) {
            log.error("비즈니스 세션 정보 가져오기 실패: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * 세션 활동 시간 갱신
     */
    public void refreshSessionActivity() {
        HttpSession session = getCurrentSession();
        if (session == null) {
            return;
        }

        try {
            LocalDateTime now = LocalDateTime.now();
            
            // 로그인 세션 활동 시간 갱신
            session.setAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.LAST_ACTIVITY_TIME, now);
            
            // 비즈니스 세션 활동 시간 갱신
            session.setAttribute(SessionConstants.BUSINESS_SESSION_NAMESPACE + "." + SessionConstants.LAST_ACTIVITY_TIME, now);

        } catch (Exception e) {
            log.error("세션 활동 시간 갱신 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 세션 유효성 검사
     */
    public boolean isSessionValid() {
        HttpSession session = getCurrentSession();
        if (session == null) {
            return false;
        }

        try {
            // 로그인 세션 확인
            Object userId = session.getAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.USER_ID);
            if (userId == null) {
                return false;
            }

            // 세션 만료 시간 확인
            Object lastActivityTime = session.getAttribute(SessionConstants.LOGIN_SESSION_NAMESPACE + "." + SessionConstants.LAST_ACTIVITY_TIME);
            if (lastActivityTime instanceof LocalDateTime) {
                LocalDateTime lastActivity = (LocalDateTime) lastActivityTime;
                LocalDateTime now = LocalDateTime.now();
                
                if (lastActivity.plusSeconds(SessionConstants.SESSION_TIMEOUT_SECONDS).isBefore(now)) {
                    log.info("세션이 만료되었습니다: userId={}", userId);
                    return false;
                }
            }

            return true;
        } catch (Exception e) {
            log.error("세션 유효성 검사 실패: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * 세션 무효화
     */
    public void invalidateSession() {
        HttpSession session = getCurrentSession();
        if (session != null) {
            try {
                session.invalidate();
                log.info("세션이 무효화되었습니다.");
            } catch (Exception e) {
                log.error("세션 무효화 실패: {}", e.getMessage(), e);
            }
        }
    }

    /**
     * 특정 세션 속성 가져오기
     */
    public Object getSessionAttribute(String namespace, String key) {
        HttpSession session = getCurrentSession();
        if (session == null) {
            return null;
        }

        return session.getAttribute(namespace + "." + key);
    }

    /**
     * 특정 세션 속성 설정
     */
    public void setSessionAttribute(String namespace, String key, Object value) {
        HttpSession session = getCurrentSession();
        if (session == null) {
            return;
        }

        try {
            session.setAttribute(namespace + "." + key, value);
        } catch (Exception e) {
            log.error("세션 속성 설정 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 특정 세션 속성 제거
     */
    public void removeSessionAttribute(String namespace, String key) {
        HttpSession session = getCurrentSession();
        if (session == null) {
            return;
        }

        try {
            session.removeAttribute(namespace + "." + key);
        } catch (Exception e) {
            log.error("세션 속성 제거 실패: {}", e.getMessage(), e);
        }
    }
}
