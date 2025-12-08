package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.User;

/**
 * 사용자 개인정보 복호화 데이터 캐싱 서비스
 * 
 * <p>목적:</p>
 * <ul>
 *   <li>로그인 시 사용자 정보를 한 번 복호화하여 캐시에 저장</li>
 *   <li>반복적인 복호화 작업으로 인한 성능 부하 감소</li>
 *   <li>상담소, 학원 등 모든 테넌트에 적용</li>
 * </ul>
 * 
 * <p>캐시 전략:</p>
 * <ul>
 *   <li>캐시 키: "user:decrypted:{tenantId}:{userId}"</li>
 *   <li>TTL: 세션 만료 시간 기준 (기본 30분)</li>
 *   <li>무효화: 사용자 정보 업데이트 시 즉시 무효화</li>
 * </ul>
 * 
 * <p>보안 고려사항:</p>
 * <ul>
 *   <li>서버 메모리에 평문 저장 (상대적으로 안전)</li>
 *   <li>세션 만료 시 자동 무효화</li>
 *   <li>서버 재시작 시 캐시 초기화</li>
 * </ul>
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-12-08
 */
public interface UserPersonalDataCacheService {
    
    /**
     * 사용자 개인정보 복호화 및 캐시 저장
     * 
     * <p>로그인 시 호출하여 사용자 정보를 복호화하고 캐시에 저장합니다.</p>
     * 
     * @param user 원본 사용자 엔티티 (암호화된 데이터)
     * @return 복호화된 사용자 정보 Map (name, email, phone, nickname, gender)
     */
    java.util.Map<String, String> decryptAndCacheUserPersonalData(User user);
    
    /**
     * 캐시에서 복호화된 사용자 개인정보 조회
     * 
     * <p>캐시에 없으면 복호화하여 캐시에 저장한 후 반환합니다.</p>
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @return 복호화된 사용자 정보 Map (없으면 null)
     */
    java.util.Map<String, String> getCachedUserPersonalData(String tenantId, Long userId);
    
    /**
     * 캐시에서 복호화된 이름 조회
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @return 복호화된 이름 (없으면 null)
     */
    String getCachedName(String tenantId, Long userId);
    
    /**
     * 캐시에서 복호화된 이메일 조회
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @return 복호화된 이메일 (없으면 null)
     */
    String getCachedEmail(String tenantId, Long userId);
    
    /**
     * 캐시에서 복호화된 전화번호 조회
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     * @return 복호화된 전화번호 (없으면 null)
     */
    String getCachedPhone(String tenantId, Long userId);
    
    /**
     * 사용자 개인정보 캐시 무효화
     * 
     * <p>사용자 정보가 업데이트되었을 때 호출합니다.</p>
     * 
     * @param tenantId 테넌트 ID
     * @param userId 사용자 ID
     */
    void evictUserPersonalDataCache(String tenantId, Long userId);
    
    /**
     * 테넌트의 모든 사용자 캐시 무효화
     * 
     * <p>테넌트 설정 변경 등 대량 무효화가 필요한 경우 사용합니다.</p>
     * 
     * @param tenantId 테넌트 ID
     */
    void evictTenantPersonalDataCache(String tenantId);
    
    /**
     * 모든 사용자 개인정보 캐시 무효화
     * 
     * <p>암호화 키 변경 등 전역 이벤트 시 사용합니다.</p>
     */
    void evictAllPersonalDataCache();
    
    /**
     * User 객체를 받아서 복호화된 데이터를 반환하는 헬퍼 메서드
     * 
     * <p>캐시를 활용하여 복호화된 개인정보를 반환합니다.</p>
     * 
     * @param user 사용자 엔티티
     * @return 복호화된 개인정보 Map (name, email, phone 등)
     */
    java.util.Map<String, String> getDecryptedUserData(User user);
}

