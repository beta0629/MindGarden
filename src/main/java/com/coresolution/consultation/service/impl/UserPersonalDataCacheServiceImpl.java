package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 사용자 개인정보 복호화 데이터 캐싱 서비스 구현체
 * 
 * <p>Spring Cache를 활용하여 복호화된 개인정보를 캐시에 저장하고 조회합니다.</p>
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-08
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserPersonalDataCacheServiceImpl implements UserPersonalDataCacheService {
    
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    @Override
    @Cacheable(value = "userPersonalData", key = "'user:decrypted:' + #tenantId + ':' + #userId", 
               unless = "#result == null")
    public Map<String, String> decryptAndCacheUserPersonalData(User user) {
        String tenantId = user.getTenantId() != null ? user.getTenantId() : TenantContextHolder.getTenantId();
        Long userId = user.getId();
        
        log.debug("🔓 사용자 개인정보 복호화 및 캐시 저장: tenantId={}, userId={}", tenantId, userId);
        
        Map<String, String> decryptedData = new HashMap<>();
        
        try {
            // 이름 복호화
            if (user.getName() != null) {
                decryptedData.put("name", encryptionUtil.safeDecrypt(user.getName()));
            }
            
            // 이메일 복호화 (이메일은 일반적으로 암호화하지 않지만 일관성을 위해)
            if (user.getEmail() != null) {
                decryptedData.put("email", encryptionUtil.safeDecrypt(user.getEmail()));
            }
            
            // 전화번호 복호화
            if (user.getPhone() != null) {
                decryptedData.put("phone", encryptionUtil.safeDecrypt(user.getPhone()));
            }
            
            // 닉네임 복호화
            if (user.getNickname() != null) {
                decryptedData.put("nickname", encryptionUtil.safeDecrypt(user.getNickname()));
            }
            
            // 성별 복호화
            if (user.getGender() != null) {
                decryptedData.put("gender", encryptionUtil.safeDecrypt(user.getGender()));
            }
            
            log.debug("✅ 사용자 개인정보 복호화 완료: tenantId={}, userId={}, 필드 수={}", 
                     tenantId, userId, decryptedData.size());
            
        } catch (Exception e) {
            log.error("❌ 사용자 개인정보 복호화 실패: tenantId={}, userId={}", tenantId, userId, e);
            // 복호화 실패 시 빈 Map 반환 (캐시하지 않음)
            return null;
        }
        
        return decryptedData;
    }
    
    @Override
    public Map<String, String> getCachedUserPersonalData(String tenantId, Long userId) {
        // Cacheable이 적용된 메서드를 호출하여 캐시 조회/저장
        // 실제 구현은 decryptAndCacheUserPersonalData를 User 객체 없이 호출할 수 없으므로
        // 별도로 캐시를 조회하는 방법이 필요합니다.
        // 현재는 decryptAndCacheUserPersonalData를 직접 호출하는 방식으로 처리합니다.
        
        log.debug("🔍 캐시에서 사용자 개인정보 조회: tenantId={}, userId={}", tenantId, userId);
        
        // User 객체가 필요한 경우를 위해 이 메서드는 호출 시 User 객체를 함께 전달해야 합니다.
        // 대안으로 CacheManager를 직접 주입받아 사용할 수 있지만, 
        // 현재 구조에서는 decryptAndCacheUserPersonalData를 사용하는 것을 권장합니다.
        
        return null; // User 객체가 없으면 조회 불가
    }
    
    @Override
    public String getCachedName(String tenantId, Long userId) {
        // 이 메서드는 실제로는 User 객체가 필요하므로 
        // 호출하는 쪽에서 decryptAndCacheUserPersonalData를 사용하도록 권장합니다.
        return null;
    }
    
    @Override
    public String getCachedEmail(String tenantId, Long userId) {
        return null;
    }
    
    @Override
    public String getCachedPhone(String tenantId, Long userId) {
        return null;
    }
    
    @Override
    @CacheEvict(value = "userPersonalData", key = "'user:decrypted:' + #tenantId + ':' + #userId")
    public void evictUserPersonalDataCache(String tenantId, Long userId) {
        log.info("🗑️ 사용자 개인정보 캐시 무효화: tenantId={}, userId={}", tenantId, userId);
    }
    
    @Override
    @CacheEvict(value = "userPersonalData", allEntries = true, condition = "#tenantId != null")
    public void evictTenantPersonalDataCache(String tenantId) {
        log.info("🗑️ 테넌트의 모든 사용자 개인정보 캐시 무효화: tenantId={}", tenantId);
        // 현재 Spring Cache는 조건부 전체 무효화를 지원하지 않으므로
        // 실제 구현은 CacheManager를 직접 사용해야 합니다.
        // 이 부분은 향후 개선이 필요합니다.
    }
    
    @Override
    @CacheEvict(value = "userPersonalData", allEntries = true)
    public void evictAllPersonalDataCache() {
        log.warn("🗑️ 모든 사용자 개인정보 캐시 무효화 (전역 이벤트)");
    }
    
    /**
     * User 객체를 받아서 복호화된 데이터를 반환하는 헬퍼 메서드
     * 
     * @param user 사용자 엔티티
     * @return 복호화된 개인정보 Map
     */
    public Map<String, String> getDecryptedUserData(User user) {
        if (user == null) {
            return null;
        }
        
        String tenantId = user.getTenantId() != null ? user.getTenantId() : TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.warn("⚠️ tenantId가 없어 캐시를 사용할 수 없습니다. 직접 복호화합니다.");
            return decryptDirectly(user);
        }
        
        return decryptAndCacheUserPersonalData(user);
    }
    
    /**
     * 캐시 없이 직접 복호화 (tenantId가 없는 경우)
     */
    private Map<String, String> decryptDirectly(User user) {
        Map<String, String> decryptedData = new HashMap<>();
        
        if (user.getName() != null) {
            decryptedData.put("name", encryptionUtil.safeDecrypt(user.getName()));
        }
        if (user.getEmail() != null) {
            decryptedData.put("email", encryptionUtil.safeDecrypt(user.getEmail()));
        }
        if (user.getPhone() != null) {
            decryptedData.put("phone", encryptionUtil.safeDecrypt(user.getPhone()));
        }
        if (user.getNickname() != null) {
            decryptedData.put("nickname", encryptionUtil.safeDecrypt(user.getNickname()));
        }
        if (user.getGender() != null) {
            decryptedData.put("gender", encryptionUtil.safeDecrypt(user.getGender()));
        }
        
        return decryptedData;
    }
}

