package com.coresolution.consultation.security.pii;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * JPA {@link jakarta.persistence.AttributeConverter} 용 {@link PiiCryptoService} 정적 브리지.
 *
 * <p>구 {@code PersonalDataEncryptionContextHolder} 를 대체한다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PiiEncryptionContextHolder {

    private static volatile PiiCryptoService instance;

    private final PiiCryptoService cryptoService;

    @PostConstruct
    public void initialize() {
        instance = cryptoService;
        log.info("PiiEncryptionContextHolder 초기화 완료 — PiiAttributeConverter SSOT 활성화");
    }

    /**
     * 현재 활성 {@link PiiCryptoService}.
     *
     * @return 미초기화 시 null
     */
    public static PiiCryptoService get() {
        return instance;
    }

    /**
     * 단위 테스트용 직접 주입.
     *
     * @param service 주입할 서비스 (null 허용 — 정리용)
     */
    static void setInstanceForTesting(PiiCryptoService service) {
        instance = service;
    }
}
