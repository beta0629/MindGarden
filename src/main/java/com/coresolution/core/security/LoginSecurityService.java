package com.coresolution.core.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 로그인 보안 서비스
 * Redis가 설정되어 있을 때만 활성화됩니다.
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnBean(RedisTemplate.class)
public class LoginSecurityService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    @Value("${security.login.max-attempts:5}")
    private int maxLoginAttempts;
    
    @Value("${security.login.lockout-duration-minutes:30}")
    private int lockoutDurationMinutes;
    
    private static final String LOGIN_ATTEMPT_PREFIX = "login:attempt:";
    private static final String ACCOUNT_LOCK_PREFIX = "login:lock:";
    
    /**
     * 로그인 실패 기록
     */
    public void recordLoginFailure(String email) {
        String key = LOGIN_ATTEMPT_PREFIX + email;
        
        // 현재 실패 횟수 조회
        Integer attempts = (Integer) redisTemplate.opsForValue().get(key);
        if (attempts == null) {
            attempts = 0;
        }
        
        attempts++;
        
        // 실패 횟수 저장 (30분 TTL)
        redisTemplate.opsForValue().set(key, attempts, lockoutDurationMinutes, TimeUnit.MINUTES);
        
        log.warn("⚠️ 로그인 실패 기록: email={}, attempts={}/{}", 
            email, attempts, maxLoginAttempts);
        
        // 최대 시도 횟수 초과 시 계정 잠금
        if (attempts >= maxLoginAttempts) {
            lockAccount(email);
        }
    }
    
    /**
     * 로그인 성공 시 실패 횟수 초기화
     */
    public void resetLoginAttempts(String email) {
        String attemptKey = LOGIN_ATTEMPT_PREFIX + email;
        String lockKey = ACCOUNT_LOCK_PREFIX + email;
        
        redisTemplate.delete(attemptKey);
        redisTemplate.delete(lockKey);
        
        log.info("✅ 로그인 성공: email={}, 실패 횟수 초기화", email);
    }
    
    /**
     * 계정 잠금
     */
    public void lockAccount(String email) {
        String key = ACCOUNT_LOCK_PREFIX + email;
        
        // 계정 잠금 (30분)
        redisTemplate.opsForValue().set(
            key, 
            true, 
            lockoutDurationMinutes, 
            TimeUnit.MINUTES
        );
        
        log.error("🔒 계정 잠금: email={}, duration={}분", email, lockoutDurationMinutes);
    }
    
    /**
     * 계정 잠금 해제
     */
    public void unlockAccount(String email) {
        String attemptKey = LOGIN_ATTEMPT_PREFIX + email;
        String lockKey = ACCOUNT_LOCK_PREFIX + email;
        
        redisTemplate.delete(attemptKey);
        redisTemplate.delete(lockKey);
        
        log.info("🔓 계정 잠금 해제: email={}", email);
    }
    
    /**
     * 계정 잠금 여부 확인
     */
    public boolean isAccountLocked(String email) {
        String key = ACCOUNT_LOCK_PREFIX + email;
        Boolean locked = (Boolean) redisTemplate.opsForValue().get(key);
        return locked != null && locked;
    }
    
    /**
     * 남은 로그인 시도 횟수 조회
     */
    public int getRemainingAttempts(String email) {
        String key = LOGIN_ATTEMPT_PREFIX + email;
        Integer attempts = (Integer) redisTemplate.opsForValue().get(key);
        
        if (attempts == null) {
            return maxLoginAttempts;
        }
        
        return Math.max(0, maxLoginAttempts - attempts);
    }
    
    /**
     * 계정 잠금 남은 시간 조회 (초)
     */
    public long getLockoutRemainingTime(String email) {
        String key = ACCOUNT_LOCK_PREFIX + email;
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null ? ttl : 0;
    }
    
    /**
     * 로그인 시도 전 검증
     */
    public void validateLoginAttempt(String email) {
        if (isAccountLocked(email)) {
            long remainingSeconds = getLockoutRemainingTime(email);
            long remainingMinutes = remainingSeconds / 60;
            
            throw new AccountLockedException(
                String.format(
                    "계정이 잠겼습니다. %d분 후 다시 시도하세요.",
                    remainingMinutes + 1
                )
            );
        }
    }
    
    /**
     * 계정 잠금 예외
     */
    public static class AccountLockedException extends RuntimeException {
        public AccountLockedException(String message) {
            super(message);
        }
    }
}

