package com.mindgarden.ops.exception;

/**
 * 엔티티를 찾을 수 없을 때 발생하는 예외
 * HTTP 404 Not Found
 * 
 * @author CoreSolution
 * @version 1.0.0
 */
public class EntityNotFoundException extends RuntimeException {
    private final String entityName;
    private final Object entityId;

    public EntityNotFoundException(String entityName, Object entityId) {
        super(String.format("%s를 찾을 수 없습니다: %s", entityName, entityId));
        this.entityName = entityName;
        this.entityId = entityId;
    }

    public String getEntityName() {
        return entityName;
    }

    public Object getEntityId() {
        return entityId;
    }
}

