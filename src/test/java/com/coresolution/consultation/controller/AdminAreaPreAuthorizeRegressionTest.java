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
 * B8 회귀 가드 — Admin 영역(`Admin*`, `HQ*`, `consultation.controller.erp.*`) 컨트롤러의 모든 매핑
 * 메서드가 클래스 레벨 또는 메서드 레벨 {@link PreAuthorize} 가드로 보호되는지 검증한다.
 *
 * <p>새 Admin 컨트롤러 추가 시 가드를 깜박이고 누락하는 회귀를 컴파일·테스트 시점에 차단한다.</p>
 *
 * <p>검사 정책:</p>
 * <ul>
 *   <li>대상: {@code @RestController} + 패키지가 {@code com.coresolution.consultation.controller}
 *       이고 클래스명이 {@code Admin*}/{@code HQ*} 로 시작하거나, 패키지가
 *       {@code com.coresolution.consultation.controller.erp} 인 경우</li>
 *   <li>검증: 클래스 레벨에 {@link PreAuthorize} 가 있으면 통과. 없으면 모든 매핑 메서드
 *       ({@link RequestMapping}/{@link GetMapping}/...) 에 {@link PreAuthorize} 가 있어야 통과</li>
 * </ul>
 *
 * <p>회귀 발생 시 fail 메시지에 누락된 컨트롤러·메서드 전체 목록을 출력하여 디버깅을 돕는다.</p>
 *
 * @author MindGarden
 * @since 2026-06-14
 */
@DisplayName("B8 회귀 가드 — Admin 영역 컨트롤러는 @PreAuthorize 보호 필수")
class AdminAreaPreAuthorizeRegressionTest {

    /** Admin 영역 컨트롤러 스캔 베이스 패키지. */
    private static final String CONTROLLER_BASE_PACKAGE = "com.coresolution.consultation.controller";

    /** Admin 영역 컨트롤러 식별 prefix. */
    private static final List<String> ADMIN_CLASS_PREFIXES = List.of("Admin", "HQ");

    /** Admin 영역(서브패키지) 식별 패키지 fragment. */
    private static final String ERP_SUBPACKAGE = ".erp.";

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
    @DisplayName("Admin/HQ/erp.* 컨트롤러 모두 클래스 또는 모든 매핑 메서드에 @PreAuthorize 가드 보유")
    void adminAreaControllers_haveClassOrMethodLevelPreAuthorize() {
        List<Class<?>> adminControllers = scanAdminAreaControllers();
        assertThat(adminControllers)
                .as("Admin 영역 컨트롤러가 1개 이상 스캔되어야 함 (회귀 가드 자체 무력화 방지)")
                .isNotEmpty();

        List<String> violations = new ArrayList<>();
        for (Class<?> controller : adminControllers) {
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
                .as("Admin 영역 컨트롤러 중 @PreAuthorize 가 없는 매핑 메서드 발견 (클래스 또는 메서드 레벨 가드 추가 필요)")
                .isEmpty();
    }

    @Test
    @DisplayName("스캔 자체가 정상 작동 — 알려진 Admin 컨트롤러 (AdminController, HQErpController) 검출")
    void scanFindsKnownAdminControllers() {
        List<Class<?>> adminControllers = scanAdminAreaControllers();
        Set<String> simpleNames = new LinkedHashSet<>();
        for (Class<?> c : adminControllers) {
            simpleNames.add(c.getSimpleName());
        }
        assertThat(simpleNames)
                .as("회귀 가드 자체의 신뢰성 확보 — 알려진 컨트롤러 검출 검증")
                .contains("AdminController", "HQErpController", "AccountingController");
    }

    /**
     * {@code com.coresolution.consultation.controller} 패키지를 스캔해 Admin 영역
     * 컨트롤러 클래스 리스트를 반환.
     */
    private List<Class<?>> scanAdminAreaControllers() {
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
            if (!isAdminAreaClassName(beanClassName)) {
                continue;
            }
            try {
                result.add(Class.forName(beanClassName));
            } catch (ClassNotFoundException e) {
                throw new IllegalStateException("Admin 영역 컨트롤러 로딩 실패: " + beanClassName, e);
            }
        }
        return result;
    }

    /**
     * 클래스명/패키지 기반 Admin 영역 식별.
     */
    private boolean isAdminAreaClassName(String fullyQualifiedName) {
        if (fullyQualifiedName.contains(ERP_SUBPACKAGE)) {
            return true;
        }
        int lastDot = fullyQualifiedName.lastIndexOf('.');
        String simpleName = lastDot >= 0
                ? fullyQualifiedName.substring(lastDot + 1)
                : fullyQualifiedName;
        for (String prefix : ADMIN_CLASS_PREFIXES) {
            if (simpleName.startsWith(prefix)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 클래스에 직접 또는 상속 메타 어노테이션으로 {@link PreAuthorize} 가 있는지 검사.
     */
    private boolean hasClassLevelPreAuthorize(Class<?> controller) {
        return controller.isAnnotationPresent(PreAuthorize.class)
                || controller.isAnnotationPresent(PreFilter.class);
    }

    /**
     * 매핑 어노테이션이 붙은 public 메서드 중 {@link PreAuthorize} 없는 것 반환.
     */
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

    /**
     * 메서드가 매핑 어노테이션을 포함하는지 검사.
     */
    private boolean isMappingMethod(Method method) {
        for (Class<? extends Annotation> mapping : MAPPING_ANNOTATIONS) {
            if (method.isAnnotationPresent(mapping)) {
                return true;
            }
        }
        // 메타 어노테이션 (커스텀 매핑) 도 안전하게 검사.
        return Arrays.stream(method.getDeclaredAnnotations())
                .anyMatch(a -> MAPPING_ANNOTATIONS.contains(a.annotationType())
                        || a.annotationType().isAnnotationPresent(RequestMapping.class));
    }
}
