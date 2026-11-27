package com.coresolution.consultation.security.pii;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * JPA EntityListener 용 {@link PiiHmacService} 정적 브리지.
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PiiHmacContextHolder {

    private static volatile PiiHmacService instance;

    private final PiiHmacService hmacService;

    @PostConstruct
    public void initialize() {
        instance = hmacService;
        log.info("PiiHmacContextHolder 초기화 완료 — PiiBlindIndexListener SSOT 활성화");
    }

    /**
     * 현재 활성 {@link PiiHmacService}.
     *
     * @return 미초기화 시 null
     */
    public static PiiHmacService get() {
        return instance;
    }

    /**
     * 단위 테스트용 직접 주입.
     *
     * @param service 주입할 서비스 (null 허용 — 정리용)
     */
    static void setInstanceForTesting(PiiHmacService service) {
        instance = service;
    }
}
