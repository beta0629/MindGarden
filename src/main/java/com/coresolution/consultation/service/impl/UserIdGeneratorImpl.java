package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserIdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 사용자 ID(UserId) 생성기 구현체
 * 테넌트 ID 생성기(TenantIdGenerator)와 동일한 표준화 패턴 적용
 * 
 * 생성 전략:
 * 1. 이메일의 로컬 파트(@ 앞부분) 추출
 * 2. 특수문자 제거, 영문/숫자만 허용
 * 3. 테넌트별 중복 체크 수행
 * 4. 중복 시 순번 추가 (userId1, userId2, ...)
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-08
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserIdGeneratorImpl implements UserIdGenerator {
    
    private final UserRepository userRepository;
    
    @Override
    public String generateUniqueUserId(String email, String tenantId) {
        // 입력 검증
        if (!StringUtils.hasText(email)) {
            log.error("❌ 이메일이 없습니다. email={}", email);
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }
        
        if (!StringUtils.hasText(tenantId)) {
            log.error("❌ 테넌트 ID가 없습니다. tenantId={}", tenantId);
            throw new IllegalArgumentException("테넌트 ID는 필수입니다.");
        }
        
        // 이메일 정규화 (소문자 변환, 공백 제거)
        String normalizedEmail = email.trim().toLowerCase();
        
        // 이메일에서 로컬 파트 추출
        String localPart = normalizedEmail.split("@")[0];
        
        // 특수문자 제거, 영문/숫자만 허용
        String base = localPart.replaceAll("[^a-zA-Z0-9]", "");
        
        // 기본값이 비어있으면 "user" 사용
        if (!StringUtils.hasText(base)) {
            base = "user";
            log.warn("⚠️ 이메일 로컬 파트가 비어있어 기본값 'user' 사용: email={}", normalizedEmail);
        }
        
        // 소문자로 변환
        String candidate = base.toLowerCase();
        int suffix = 1;
        
        // 테넌트별 중복 체크 및 순번 증가
        while (userRepository.existsByTenantIdAndUserId(tenantId, candidate)) {
            candidate = String.format("%s%d", base.toLowerCase(), suffix++);
            log.debug("사용자 ID 중복 감지, 순번 증가: tenantId={}, candidate={}", tenantId, candidate);
        }
        
        log.info("✅ 테넌트별 사용자 ID 생성 완료: email={}, tenantId={}, userId={}", 
                normalizedEmail, tenantId, candidate);
        
        return candidate;
    }
}

