package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.AnnotatedBeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.prepost.PreFilter;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * B8 회귀 가드 — Consultant 영역(`Consultant*`, `Schedule*` 컨트롤러) 의 모든 매핑 메서드가
 * 클래스 레벨 또는 메서드 레벨 {@link PreAuthorize} 가드로 보호되는지 검증한다.
 *
 * <p>새 Consultant 컨트롤러 추가 시 가드 누락 회귀를 컴파일·테스트 시점에 차단한다.</p>
 *
 * <p>검사 정책:</p>
 * <ul>
 *   <li>대상: {@code @RestController} + 클래스명이 {@code Consultant*}/{@code Schedule*} 로 시작
 *       (단, {@code Scheduler*} 는 운영 모니터링용이므로 제외)</li>
 *   <li>검증: 클래스 레벨 {@link PreAuthorize} 부착 → 통과. 없으면 모든 매핑 메서드에
 *       {@link PreAuthorize} 필요</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-14
 */
@DisplayName("B8 회귀 가드 — Consultant 영역 컨트롤러는 @PreAuthorize 보호 필수")
class ConsultantAreaPreAuthorizeRegressionTest {

    /** Consultant 영역 컨트롤러 스캔 베이스 패키지. */
    private static final String CONTROLLER_BASE_PACKAGE = "com.coresolution.consultation.controller";

    /** Consultant 영역 컨트롤러 식별 prefix. */
    private static final List<String> CONSULTANT_CLASS_PREFIXES = List.of("Consultant", "Schedule");

    /** Consultant 영역에서 제외할 prefix (운영 모니터링/Admin/스케줄러 인프라). */
    private static final List<String> EXCLUDE_PREFIXES = List.of("Scheduler");

    /** 매핑 메서드 식별 어노테이션. */
    private static final List<Class<? extends Annotation>> MAPPING_ANNOTATIONS = List.of(
            RequestMapping.class,
            GetMapping.class,
            PostMapping.class,
            PutMapping.class,
            DeleteMapping.class,
            PatchMapping.class
    );

    @Test
    @DisplayName("Consultant*/Schedule* 컨트롤러 모두 클래스 또는 모든 매핑 메서드에 @PreAuthorize 가드 보유")
    void consultantAreaControllers_haveClassOrMethodLevelPreAuthorize() {
        List<Class<?>> consultantControllers = scanConsultantAreaControllers();
        assertThat(consultantControllers)
                .as("Consultant 영역 컨트롤러가 1개 이상 스캔되어야 함 (회귀 가드 자체 무력화 방지)")
                .isNotEmpty();

        List<String> violations = new ArrayList<>();
        for (Class<?> controller : consultantControllers) {
            if (hasClassLevelPreAuthorize(controller)) {
                continue;
            }
            List<Method> unguardedMappingMethods = findUnguardedMappingMethods(controller);
            if (!unguardedMappingMethods.isEmpty()) {
                String methodNames = String.join(", ",
                        unguardedMappingMethods.stream().map(Method::getName).sorted().toList());
                violations.add(controller.getName() + " (unguarded methods: " + methodNames + ")");
            }
        }

        assertThat(violations)
                .as("Consultant 영역 컨트롤러 중 @PreAuthorize 가 없는 매핑 메서드 발견 (클래스 또는 메서드 레벨 가드 추가 필요)")
                .isEmpty();
    }

    @Test
    @DisplayName("스캔 자체가 정상 작동 — 알려진 Consultant 컨트롤러 (ConsultantController, ScheduleController) 검출")
    void scanFindsKnownConsultantControllers() {
        List<Class<?>> consultantControllers = scanConsultantAreaControllers();
        Set<String> simpleNames = new LinkedHashSet<>();
        for (Class<?> c : consultantControllers) {
            simpleNames.add(c.getSimpleName());
        }
        assertThat(simpleNames)
                .as("회귀 가드 자체의 신뢰성 확보 — 알려진 컨트롤러 검출 검증")
                .contains("ConsultantController", "ScheduleController");
    }

    private List<Class<?>> scanConsultantAreaControllers() {
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

        List<Class<?>> result = new ArrayList<>();
        for (var beanDef : scanner.findCandidateComponents(CONTROLLER_BASE_PACKAGE)) {
            if (!(beanDef instanceof AnnotatedBeanDefinition)) {
                continue;
            }
            String beanClassName = beanDef.getBeanClassName();
            if (beanClassName == null) {
                continue;
            }
            if (!isConsultantAreaClassName(beanClassName)) {
                continue;
            }
            try {
                result.add(Class.forName(beanClassName));
            } catch (ClassNotFoundException e) {
                throw new IllegalStateException("Consultant 영역 컨트롤러 로딩 실패: " + beanClassName, e);
            }
        }
        return result;
    }

    private boolean isConsultantAreaClassName(String fullyQualifiedName) {
        int lastDot = fullyQualifiedName.lastIndexOf('.');
        String simpleName = lastDot >= 0
                ? fullyQualifiedName.substring(lastDot + 1)
                : fullyQualifiedName;
        for (String exclude : EXCLUDE_PREFIXES) {
            if (simpleName.startsWith(exclude)) {
                return false;
            }
        }
        for (String prefix : CONSULTANT_CLASS_PREFIXES) {
            if (simpleName.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    private boolean hasClassLevelPreAuthorize(Class<?> controller) {
        return controller.isAnnotationPresent(PreAuthorize.class)
                || controller.isAnnotationPresent(PreFilter.class);
    }

    private List<Method> findUnguardedMappingMethods(Class<?> controller) {
        List<Method> unguarded = new ArrayList<>();
        for (Method method : controller.getDeclaredMethods()) {
            if (!Modifier.isPublic(method.getModifiers()) || Modifier.isStatic(method.getModifiers())) {
                continue;
            }
            if (!isMappingMethod(method)) {
                continue;
            }
            if (method.isAnnotationPresent(PreAuthorize.class)
                    || method.isAnnotationPresent(PreFilter.class)) {
                continue;
            }
            unguarded.add(method);
        }
        return unguarded;
    }

    private boolean isMappingMethod(Method method) {
        for (Class<? extends Annotation> mapping : MAPPING_ANNOTATIONS) {
            if (method.isAnnotationPresent(mapping)) {
                return true;
            }
        }
        return Arrays.stream(method.getDeclaredAnnotations())
                .anyMatch(a -> MAPPING_ANNOTATIONS.contains(a.annotationType())
                        || a.annotationType().isAnnotationPresent(RequestMapping.class));
    }
}
