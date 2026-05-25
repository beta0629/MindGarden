package com.coresolution.consultation.service.impl;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * {@link WorkflowAutomationServiceImpl} 클래스 레벨 {@link ConditionalOnProperty}
 * 어노테이션 부착 여부 단위 테스트.
 *
 * <p>운영 ENV {@code SCHEDULER_WORKFLOW_AUTOMATION_ENABLED=false} 설정 시 Spring 컨텍스트
 * 에서 빈 자체가 등록되지 않도록 클래스 선언부에 어노테이션이 정확히 부착되어 있는지
 * reflection 으로 검증한다. {@code application.yml} 매핑:
 * {@code scheduler.workflow-automation.enabled: ${SCHEDULER_WORKFLOW_AUTOMATION_ENABLED:true}}.
 *
 * <p>DB SSOT 플래그 가드({@link WorkflowAutomationServiceImplGuardTest})와 이중 가드 — 둘 다
 * 활성화되어야 본문 진입이 가능하다.
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@DisplayName("워크플로우 자동화 — @ConditionalOnProperty 어노테이션 부착")
class WorkflowAutomationServiceImplConditionalTest {

    @Test
    @DisplayName("클래스 레벨 @ConditionalOnProperty 어노테이션 존재")
    void classHasConditionalOnPropertyAnnotation() {
        ConditionalOnProperty annotation = WorkflowAutomationServiceImpl.class
                .getAnnotation(ConditionalOnProperty.class);

        assertNotNull(annotation,
                "WorkflowAutomationServiceImpl 클래스에 @ConditionalOnProperty 가 부착되어야 한다");
    }

    @Test
    @DisplayName("name = scheduler.workflow-automation.enabled")
    void annotationNameMatchesYamlKey() {
        ConditionalOnProperty annotation = WorkflowAutomationServiceImpl.class
                .getAnnotation(ConditionalOnProperty.class);

        assertNotNull(annotation);
        assertArrayEquals(
                new String[]{"scheduler.workflow-automation.enabled"},
                annotation.name(),
                "name 속성은 application.yml 매핑 키와 정확히 일치해야 한다");
    }

    @Test
    @DisplayName("havingValue = true")
    void annotationHavingValueIsTrue() {
        ConditionalOnProperty annotation = WorkflowAutomationServiceImpl.class
                .getAnnotation(ConditionalOnProperty.class);

        assertNotNull(annotation);
        assertEquals("true", annotation.havingValue(),
                "havingValue 는 true 로 설정되어야 한다");
    }

    @Test
    @DisplayName("matchIfMissing = true (기존 환경 비파괴)")
    void annotationMatchIfMissingIsTrue() {
        ConditionalOnProperty annotation = WorkflowAutomationServiceImpl.class
                .getAnnotation(ConditionalOnProperty.class);

        assertNotNull(annotation);
        assertTrue(annotation.matchIfMissing(),
                "matchIfMissing 은 true 여야 — 프로퍼티 누락 시 기본 빈 등록을 유지한다");
    }
}
