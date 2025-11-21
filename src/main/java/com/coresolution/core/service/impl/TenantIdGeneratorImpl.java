package com.coresolution.core.service.impl;

import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.TenantIdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

/**
 * 테넌트 ID 생성기 구현체
 * 
 * 생성 전략:
 * 1. 업종(businessType)이 있으면: tenant-{업종코드}-{순번} 형식
 *    예: "tenant-academy-001", "tenant-consultation-001"
 * 2. 업종이 없으면: 기존 방식 (해시 + UUID 또는 순수 UUID)
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-21
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TenantIdGeneratorImpl implements TenantIdGenerator {
    
    private static final int HASH_PREFIX_LENGTH = 8; // 해시 접두사 길이
    
    private final TenantRepository tenantRepository;
    
    @Override
    public String generateTenantId(String tenantName, String businessType, String regionCode) {
        // 업종과 지역이 있으면 새로운 형식 사용: tenant-{지역}-{업종}-{순번}
        if (businessType != null && !businessType.trim().isEmpty()) {
            return generateWithBusinessTypeAndRegion(businessType.trim(), regionCode);
        }
        
        // 업종이 없으면 기존 방식 사용
        if (tenantName != null && !tenantName.trim().isEmpty()) {
            // 테넌트명 기반 생성: 해시 접두사 + UUID
            return generateFromTenantName(tenantName, null);
        } else {
            // 기본: 순수 UUID
            return generateDefault();
        }
    }
    
    /**
     * 업종 및 지역 기반 테넌트 ID 생성
     * 형식: tenant-{지역코드}-{업종코드}-{순번}
     * 예: "tenant-seoul-academy-001", "tenant-busan-consultation-001"
     * 
     * @param businessType 업종 타입 (예: "ACADEMY", "CONSULTATION")
     * @param regionCode 지역 코드 (예: "seoul", "busan", null이면 "unknown")
     * @return 생성된 테넌트 ID
     */
    private String generateWithBusinessTypeAndRegion(String businessType, String regionCode) {
        try {
            // 업종 코드 정규화 (대문자 -> 소문자, 언더스코어는 하이픈으로 변환)
            String normalizedBusinessType = normalizeBusinessType(businessType);
            
            // 지역 코드 정규화
            String normalizedRegion = normalizeRegionCode(regionCode);
            
            // 같은 지역+업종의 기존 테넌트 수 조회하여 순번 결정
            long existingCount = countTenantsByBusinessTypeAndRegion(businessType, normalizedRegion);
            int sequenceNumber = (int) (existingCount + 1);
            
            // 순번을 3자리 숫자로 포맷팅 (001, 002, ...)
            String formattedSequence = String.format("%03d", sequenceNumber);
            
            // 최종 테넌트 ID 생성
            String tenantId = "tenant-" + normalizedRegion + "-" + normalizedBusinessType + "-" + formattedSequence;
            
            // 중복 체크 (같은 ID가 이미 존재하는 경우 순번 증가)
            while (tenantRepository.existsByTenantId(tenantId)) {
                sequenceNumber++;
                formattedSequence = String.format("%03d", sequenceNumber);
                tenantId = "tenant-" + normalizedRegion + "-" + normalizedBusinessType + "-" + formattedSequence;
                log.warn("테넌트 ID 중복 감지, 순번 증가: tenantId={}", tenantId);
            }
            
            log.info("업종 및 지역 기반 테넌트 ID 생성: businessType={}, region={}, normalizedType={}, normalizedRegion={}, sequence={}, tenantId={}", 
                businessType, regionCode, normalizedBusinessType, normalizedRegion, sequenceNumber, tenantId);
            
            return tenantId;
            
        } catch (Exception e) {
            log.error("업종 및 지역 기반 테넌트 ID 생성 실패, 기본 UUID 사용: businessType={}, region={}, error={}", 
                businessType, regionCode, e.getMessage(), e);
            return generateDefault();
        }
    }
    
    /**
     * 지역 코드 정규화
     * - 주소에서 지역 추출 또는 지역 코드 변환
     * - 예: "서울특별시" -> "seoul", "부산광역시" -> "busan"
     * - null이면 "unknown" 반환
     */
    private String normalizeRegionCode(String regionCode) {
        if (regionCode == null || regionCode.trim().isEmpty()) {
            return "unknown";
        }
        
        String normalized = regionCode.trim().toLowerCase();
        
        // 주소에서 지역 추출 (예: "서울특별시 강남구" -> "seoul")
        if (normalized.contains("서울") || normalized.contains("seoul")) {
            return "seoul";
        } else if (normalized.contains("부산") || normalized.contains("busan")) {
            return "busan";
        } else if (normalized.contains("인천") || normalized.contains("incheon")) {
            return "incheon";
        } else if (normalized.contains("대구") || normalized.contains("daegu")) {
            return "daegu";
        } else if (normalized.contains("대전") || normalized.contains("daejeon")) {
            return "daejeon";
        } else if (normalized.contains("광주") || normalized.contains("gwangju")) {
            return "gwangju";
        } else if (normalized.contains("울산") || normalized.contains("ulsan")) {
            return "ulsan";
        } else if (normalized.contains("세종") || normalized.contains("sejong")) {
            return "sejong";
        } else if (normalized.contains("경기") || normalized.contains("gyeonggi")) {
            return "gyeonggi";
        } else if (normalized.contains("강원") || normalized.contains("gangwon")) {
            return "gangwon";
        } else if (normalized.contains("충북") || normalized.contains("chungbuk")) {
            return "chungbuk";
        } else if (normalized.contains("충남") || normalized.contains("chungnam")) {
            return "chungnam";
        } else if (normalized.contains("전북") || normalized.contains("jeonbuk")) {
            return "jeonbuk";
        } else if (normalized.contains("전남") || normalized.contains("jeonnam")) {
            return "jeonnam";
        } else if (normalized.contains("경북") || normalized.contains("gyeongbuk")) {
            return "gyeongbuk";
        } else if (normalized.contains("경남") || normalized.contains("gyeongnam")) {
            return "gyeongnam";
        } else if (normalized.contains("제주") || normalized.contains("jeju")) {
            return "jeju";
        }
        
        // 알 수 없는 지역이면 소문자로 변환하고 특수문자 제거
        return normalized.replaceAll("[^a-z0-9]", "-").replaceAll("-+", "-").replaceAll("^-|-$", "");
    }
    
    /**
     * 같은 지역+업종의 기존 테넌트 수 조회
     * 
     * @param businessType 업종 타입
     * @param normalizedRegion 정규화된 지역 코드
     * @return 기존 테넌트 수
     */
    private long countTenantsByBusinessTypeAndRegion(String businessType, String normalizedRegion) {
        try {
            // tenant_id 패턴으로 조회: tenant-{지역}-{업종}-{순번}
            String prefix = "tenant-" + normalizedRegion + "-" + normalizeBusinessType(businessType) + "-";
            return tenantRepository.countByTenantIdStartingWithAndIsDeletedFalse(prefix);
        } catch (Exception e) {
            log.warn("지역+업종별 테넌트 수 조회 실패, 0으로 설정: businessType={}, region={}, error={}", 
                businessType, normalizedRegion, e.getMessage());
            return 0;
        }
    }
    
    /**
     * 업종 코드 정규화
     * - 대문자를 소문자로 변환
     * - 언더스코어를 하이픈으로 변환
     * - 예: "ACADEMY" -> "academy", "FOOD_SERVICE" -> "food-service"
     */
    private String normalizeBusinessType(String businessType) {
        if (businessType == null || businessType.trim().isEmpty()) {
            return "unknown";
        }
        
        return businessType.trim()
            .toLowerCase()
            .replace("_", "-");
    }
    
    /**
     * 테넌트명 기반 ID 생성 (기존 방식, 하위 호환성)
     * 형식: {해시8자리}-{UUID}
     * 예: "a1b2c3d4-550e8400-e29b-41d4-a716-446655440000"
     */
    private String generateFromTenantName(String tenantName, String businessType) {
        try {
            // 테넌트명 + 업종 타입을 조합하여 해시 생성
            String input = tenantName.trim().toLowerCase();
            if (businessType != null && !businessType.trim().isEmpty()) {
                input += ":" + businessType.trim().toLowerCase();
            }
            
            // SHA-256 해시 생성
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            
            // 해시의 처음 8바이트를 16진수 문자열로 변환
            StringBuilder hashPrefix = new StringBuilder();
            for (int i = 0; i < HASH_PREFIX_LENGTH / 2; i++) {
                hashPrefix.append(String.format("%02x", hash[i]));
            }
            
            // UUID 생성 및 조합
            String uuid = UUID.randomUUID().toString();
            String tenantId = hashPrefix.toString() + "-" + uuid;
            
            log.debug("테넌트명 기반 ID 생성: tenantName={}, businessType={}, tenantId={}", 
                tenantName, businessType, tenantId);
            
            return tenantId;
            
        } catch (NoSuchAlgorithmException e) {
            log.warn("SHA-256 알고리즘을 찾을 수 없어 기본 UUID 사용: {}", e.getMessage());
            return generateDefault();
        }
    }
    
    /**
     * 기본 UUID 생성
     */
    private String generateDefault() {
        String tenantId = UUID.randomUUID().toString();
        log.debug("기본 UUID 생성: tenantId={}", tenantId);
        return tenantId;
    }
}

