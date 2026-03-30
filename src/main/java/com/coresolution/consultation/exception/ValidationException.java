package com.coresolution.consultation.exception;

import java.util.List;
import java.util.Map;

/**
 * 데이터 검증 실패 시 발생하는 예외
 * 개발 가이드 문서에 명시된 예외 처리 가이드라인 준수
 */
public class ValidationException extends RuntimeException {
    
    private final String fieldName;
    private final Object invalidValue;
    private final List<String> validationErrors;
    private final Map<String, String> fieldErrors;
    
    public ValidationException(String message) {
        super(message);
        this.fieldName = null;
        this.invalidValue = null;
        this.validationErrors = null;
        this.fieldErrors = null;
    }
    
    public ValidationException(String fieldName, Object invalidValue, String message) {
        super(message);
        this.fieldName = fieldName;
        this.invalidValue = invalidValue;
        this.validationErrors = null;
        this.fieldErrors = null;
    }
    
    public ValidationException(String message, List<String> validationErrors) {
        super(message);
        this.fieldName = null;
        this.invalidValue = null;
        this.validationErrors = validationErrors;
        this.fieldErrors = null;
    }
    
    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(message);
        this.fieldName = null;
        this.invalidValue = null;
        this.validationErrors = null;
        this.fieldErrors = fieldErrors;
    }
    
    public ValidationException(String message, Throwable cause) {
        super(message, cause);
        this.fieldName = null;
        this.invalidValue = null;
        this.validationErrors = null;
        this.fieldErrors = null;
    }
    
    public ValidationException(String fieldName, Object invalidValue, String message, Throwable cause) {
        super(message, cause);
        this.fieldName = fieldName;
        this.invalidValue = invalidValue;
        this.validationErrors = null;
        this.fieldErrors = null;
    }
    
    public String getFieldName() {
        return fieldName;
    }
    
    public Object getInvalidValue() {
        return invalidValue;
    }
    
    public List<String> getValidationErrors() {
        return validationErrors;
    }
    
    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
    
    public boolean hasFieldErrors() {
        return fieldErrors != null && !fieldErrors.isEmpty();
    }
    
    public boolean hasValidationErrors() {
        return validationErrors != null && !validationErrors.isEmpty();
    }
}
