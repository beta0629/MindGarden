package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import com.mindgarden.consultation.service.ExchangeRateService;
import com.mindgarden.consultation.service.SystemConfigService;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 환율 서비스 구현체
 * 실시간 환율 정보를 조회하고 캐싱
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-22
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExchangeRateServiceImpl implements ExchangeRateService {
    
    private final SystemConfigService systemConfigService;
    private final RestTemplate restTemplate;
    
    // 환율 캐시 (실제 운영에서는 Redis 사용 권장)
    private final Map<String, Object> exchangeRateCache = new ConcurrentHashMap<>();
    private static final String CACHE_KEY_RATE = "usd_krw_rate";
    private static final String CACHE_KEY_UPDATE_TIME = "last_update_time";
    
    // 환율 API URL (무료 API 사용)
    private static final String EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD";
    
    @Override
    public Double getUsdToKrwRate() {
        try {
            // 캐시에서 조회 (1시간 이내)
            if (isCacheValid()) {
                Double cachedRate = (Double) exchangeRateCache.get(CACHE_KEY_RATE);
                if (cachedRate != null) {
                    log.debug("💱 캐시된 환율 사용: {}", cachedRate);
                    return cachedRate;
                }
            }
            
            // API에서 환율 조회
            return refreshExchangeRate();
            
        } catch (Exception e) {
            log.error("❌ 환율 조회 실패, 기본값 사용", e);
            return getDefaultExchangeRate();
        }
    }
    
    @Override
    public Double refreshExchangeRate() {
        try {
            log.info("💱 환율 API 호출 시작: {}", EXCHANGE_RATE_API_URL);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "MindGarden/1.0");
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                EXCHANGE_RATE_API_URL,
                HttpMethod.GET,
                request,
                Map.class
            );
            
            @SuppressWarnings("unchecked")
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody != null && responseBody.containsKey("rates")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> rates = (Map<String, Object>) responseBody.get("rates");
                
                Double krwRate = (Double) rates.get("KRW");
                if (krwRate != null && krwRate > 0) {
                    // 캐시에 저장
                    exchangeRateCache.put(CACHE_KEY_RATE, krwRate);
                    exchangeRateCache.put(CACHE_KEY_UPDATE_TIME, LocalDateTime.now());
                    
                    // 시스템 설정에도 저장
                    systemConfigService.setUsdToKrwRate(krwRate);
                    
                    log.info("✅ 환율 조회 성공: 1 USD = {} KRW", krwRate);
                    return krwRate;
                }
            }
            
            throw new RuntimeException("환율 API 응답에서 KRW 환율을 찾을 수 없습니다.");
            
        } catch (Exception e) {
            log.error("❌ 환율 API 호출 실패", e);
            return getDefaultExchangeRate();
        }
    }
    
    @Override
    public String getLastUpdateTime() {
        LocalDateTime lastUpdate = (LocalDateTime) exchangeRateCache.get(CACHE_KEY_UPDATE_TIME);
        if (lastUpdate != null) {
            return lastUpdate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }
        return "업데이트 이력 없음";
    }
    
    /**
     * 캐시 유효성 검사 (1시간)
     */
    private boolean isCacheValid() {
        LocalDateTime lastUpdate = (LocalDateTime) exchangeRateCache.get(CACHE_KEY_UPDATE_TIME);
        if (lastUpdate == null) {
            return false;
        }
        
        return lastUpdate.isAfter(LocalDateTime.now().minusHours(1));
    }
    
    /**
     * 기본 환율 반환 (API 실패 시)
     */
    private Double getDefaultExchangeRate() {
        // 시스템 설정에서 기본값 조회
        Double defaultRate = systemConfigService.getUsdToKrwRate();
        if (defaultRate == null || defaultRate <= 0) {
            defaultRate = 1300.0; // 기본값
        }
        
        log.warn("⚠️ 기본 환율 사용: {}", defaultRate);
        return defaultRate;
    }
}
