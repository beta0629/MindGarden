package com.coresolution.consultation.service;

/**
 * 환율 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-22
 */
public interface ExchangeRateService {
    
    /**
     * USD-KRW 환율 조회
     * @return USD 1달러당 KRW 원화 환율
     */
    Double getUsdToKrwRate();
    
    /**
     * 환율 정보 새로고침
     * @return 새로고침된 환율
     */
    Double refreshExchangeRate();
    
    /**
     * 마지막 환율 업데이트 시간
     * @return 업데이트 시간
     */
    String getLastUpdateTime();
}
