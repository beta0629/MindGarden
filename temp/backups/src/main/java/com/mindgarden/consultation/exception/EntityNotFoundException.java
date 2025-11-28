package com.mindgarden.consultation.exception;

/**
 * 엔티티를 찾을 수 없을 때 발생하는 예외
 * 개발 가이드 문서에 명시된 예외 처리 가이드라인 준수
 */
public class EntityNotFoundException extends RuntimeException {
    
    private final String entityName;
    private final Object identifier;
    
    public EntityNotFoundException(String message) {
        super(message);
        this.entityName = null;
        this.identifier = null;
    }
    
    public EntityNotFoundException(String entityName, Object identifier) {
        super(String.format("%s를 찾을 수 없습니다. ID: %s", entityName, identifier));
        this.entityName = entityName;
        this.identifier = identifier;
    }
    
    public EntityNotFoundException(String entityName, Object identifier, String message) {
        super(message);
        this.entityName = entityName;
        this.identifier = identifier;
    }
    
    public EntityNotFoundException(String message, Throwable cause) {
        super(message, cause);
        this.entityName = null;
        this.identifier = null;
    }
    
    public EntityNotFoundException(String entityName, Object identifier, Throwable cause) {
        super(String.format("%s를 찾을 수 없습니다. ID: %s", entityName, identifier), cause);
        this.entityName = entityName;
        this.identifier = identifier;
    }
    
    public String getEntityName() {
        return entityName;
    }
    
    public Object getIdentifier() {
        return identifier;
    }
}
