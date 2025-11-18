package com.coresolution.core.exception;

/**
 * 연결 테스트 예외
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public class ConnectionTestException extends RuntimeException {
    
    private final String configId;
    private final String provider;
    private final String errorCode;
    
    public ConnectionTestException(String message, String configId, String provider) {
        super(message);
        this.configId = configId;
        this.provider = provider;
        this.errorCode = null;
    }
    
    public ConnectionTestException(String message, String configId, String provider, String errorCode) {
        super(message);
        this.configId = configId;
        this.provider = provider;
        this.errorCode = errorCode;
    }
    
    public ConnectionTestException(String message, Throwable cause, String configId, String provider) {
        super(message, cause);
        this.configId = configId;
        this.provider = provider;
        this.errorCode = null;
    }
    
    public ConnectionTestException(String message, Throwable cause, String configId, String provider, String errorCode) {
        super(message, cause);
        this.configId = configId;
        this.provider = provider;
        this.errorCode = errorCode;
    }
    
    public String getConfigId() {
        return configId;
    }
    
    public String getProvider() {
        return provider;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}

