package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.stream.Collectors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * Apple T2 P0 hotfix — 컨트롤러 매핑 중복(Ambiguous mapping) 회귀 차단.
 *
 * <p>직전 결함:
 * <ul>
 *   <li>{@code CommunityBlockController} + {@code CommunityUserBlockController} — 동일
 *       {@code /api/v1/community/users/{userId}/block}, {@code /api/v1/community/users/blocked}
 *       매핑 중복 → Spring 부팅 {@code IllegalStateException: Ambiguous mapping}.</li>
 *   <li>{@code AdminCommunityModerationController} + {@code AdminCommunityReportController} —
 *       동일 {@code /api/v1/admin/community/reports}, {@code /posts/{id}/hide|unhide},
 *       {@code /comments/{id}/hide|unhide} 매핑 중복.</li>
 * </ul>
 * </p>
 *
 * <p>두 컨트롤러 모두 단위 mock 테스트({@code MockMvcBuilders.standaloneSetup}) 는 통과했지만
 * 풀 컨텍스트 부팅을 검증하지 않아 P0 BLOCKER 가 미적발됐다.</p>
 *
 * <p>본 테스트는 클래스패스 스캔으로 모든 {@code @RestController} 클래스의 매핑 좌표
 * {@code (HttpMethod, urlPattern)} 튜플을 추출하여 중복을 직접 검출한다. 무거운
 * {@code @SpringBootTest} 부팅(JPA/DataSource 등) 없이도 Spring 의
 * {@code IllegalStateException: Ambiguous mapping} 과 동일한 회귀를 적발할 수 있다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@DisplayName("컨트롤러 매핑 중복(Ambiguous) 회귀 — 클래스패스 스캔")
class ControllerMappingRegressionTest {

    /** Core Solution 전체 컨트롤러를 포함하는 기본 패키지 두 개. */
    private static final List<String> BASE_PACKAGES = List.of(
            "com.coresolution.consultation.controller",
            "com.coresolution.core.controller"
    );

    /** Spring 의 매핑 어노테이션 → HTTP 메서드 변환 — class-level 도 method-level 도 동일 규칙. */
    private static final List<Class<? extends Annotation>> MAPPING_ANNOTATIONS = List.of(
            RequestMapping.class,
            GetMapping.class,
            PostMapping.class,
            PutMapping.class,
            PatchMapping.class,
            DeleteMapping.class
    );

    @Test
    @DisplayName("모든 @RestController 매핑 좌표(HttpMethod, urlPattern)는 유니크해야 함")
    void noAmbiguousMappingsAcrossControllers() throws Exception {
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RestController.class));

        List<Class<?>> controllers = new ArrayList<>();
        for (String basePackage : BASE_PACKAGES) {
            scanner.findCandidateComponents(basePackage).forEach(bd -> {
                try {
                    controllers.add(Class.forName(bd.getBeanClassName()));
                } catch (ClassNotFoundException e) {
                    throw new IllegalStateException("컨트롤러 클래스 로드 실패: " + bd.getBeanClassName(), e);
                }
            });
        }

        assertThat(controllers)
                .as("최소 한 개 이상의 @RestController 가 스캔되어야 함 — 0개면 스캐너 또는 패키지 경로 오류")
                .isNotEmpty();

        Map<MappingCoordinate, List<String>> coordinateToHandlers = new TreeMap<>();
        for (Class<?> controller : controllers) {
            List<String> classBaseUrls = extractClassBaseUrls(controller);
            for (Method method : controller.getDeclaredMethods()) {
                MethodMapping methodMapping = extractMethodMapping(method);
                if (methodMapping == null) {
                    continue;
                }
                for (String basePath : classBaseUrls) {
                    for (String methodPath : methodMapping.paths) {
                        String fullPath = normalize(basePath + methodPath);
                        for (RequestMethod httpMethod : methodMapping.httpMethods) {
                            MappingCoordinate coord = new MappingCoordinate(httpMethod, fullPath);
                            coordinateToHandlers
                                    .computeIfAbsent(coord, k -> new ArrayList<>())
                                    .add(controller.getSimpleName() + "#" + method.getName());
                        }
                    }
                }
            }
        }

        Map<MappingCoordinate, List<String>> duplicates = coordinateToHandlers.entrySet().stream()
                .filter(e -> e.getValue().size() > 1)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new));

        assertThat(duplicates)
                .as(
                    "Ambiguous mapping 검출 — 다음 (HttpMethod, urlPattern) 좌표가 2개 이상의 핸들러에 등록됨. "
                  + "Spring 부팅이 IllegalStateException: Ambiguous mapping 으로 실패한다.\n"
                  + "충돌 좌표:\n%s",
                    formatDuplicates(duplicates))
                .isEmpty();
    }

    private static List<String> extractClassBaseUrls(Class<?> controller) {
        RequestMapping classMapping = AnnotatedElementUtils.findMergedAnnotation(controller, RequestMapping.class);
        if (classMapping == null) {
            return List.of("");
        }
        String[] paths = classMapping.path().length > 0 ? classMapping.path() : classMapping.value();
        if (paths.length == 0) {
            return List.of("");
        }
        return List.of(paths);
    }

    private static MethodMapping extractMethodMapping(Method method) {
        for (Class<? extends Annotation> annotationClass : MAPPING_ANNOTATIONS) {
            Annotation annotation = AnnotatedElementUtils.findMergedAnnotation(method, annotationClass);
            if (annotation == null) {
                continue;
            }
            String[] paths = readPaths(annotation);
            RequestMethod[] httpMethods = readMethods(annotation, annotationClass);
            if (httpMethods.length == 0) {
                // @RequestMapping 에 method 미지정 — 모든 HTTP 메서드 매칭 (Spring 동작과 동일하게 ALL 로 처리)
                httpMethods = RequestMethod.values();
            }
            if (paths.length == 0) {
                paths = new String[] { "" };
            }
            return new MethodMapping(paths, httpMethods);
        }
        return null;
    }

    private static String[] readPaths(Annotation annotation) {
        try {
            Method pathMethod = annotation.annotationType().getMethod("path");
            String[] paths = (String[]) pathMethod.invoke(annotation);
            if (paths.length > 0) {
                return paths;
            }
        } catch (NoSuchMethodException ignore) {
            // 일부 어노테이션은 path 가 없을 수 있음 — value 로 fallback
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("어노테이션 path 추출 실패", e);
        }
        try {
            Method valueMethod = annotation.annotationType().getMethod("value");
            return (String[]) valueMethod.invoke(annotation);
        } catch (ReflectiveOperationException e) {
            return new String[0];
        }
    }

    private static RequestMethod[] readMethods(Annotation annotation, Class<? extends Annotation> annotationClass) {
        if (annotationClass == GetMapping.class) {
            return new RequestMethod[] { RequestMethod.GET };
        }
        if (annotationClass == PostMapping.class) {
            return new RequestMethod[] { RequestMethod.POST };
        }
        if (annotationClass == PutMapping.class) {
            return new RequestMethod[] { RequestMethod.PUT };
        }
        if (annotationClass == PatchMapping.class) {
            return new RequestMethod[] { RequestMethod.PATCH };
        }
        if (annotationClass == DeleteMapping.class) {
            return new RequestMethod[] { RequestMethod.DELETE };
        }
        try {
            Method methodAttr = annotation.annotationType().getMethod("method");
            return (RequestMethod[]) methodAttr.invoke(annotation);
        } catch (ReflectiveOperationException e) {
            return new RequestMethod[0];
        }
    }

    private static String normalize(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "";
        }
        String trimmed = raw;
        // 중간의 // 를 / 한 개로 합치고, 끝의 / 는 보존(Spring 도 끝 / 차이는 매칭 동등 처리하지 않음).
        while (trimmed.contains("//")) {
            trimmed = trimmed.replace("//", "/");
        }
        if (!trimmed.startsWith("/")) {
            trimmed = "/" + trimmed;
        }
        return trimmed;
    }

    private static String formatDuplicates(Map<MappingCoordinate, List<String>> duplicates) {
        StringBuilder sb = new StringBuilder();
        duplicates.forEach((coord, handlers) -> {
            sb.append("  ").append(coord).append("\n");
            Set<String> sortedHandlers = new TreeSet<>(handlers);
            sortedHandlers.forEach(h -> sb.append("    - ").append(h).append("\n"));
        });
        return sb.toString();
    }

    private static final class MethodMapping {
        final String[] paths;
        final RequestMethod[] httpMethods;

        MethodMapping(String[] paths, RequestMethod[] httpMethods) {
            this.paths = paths;
            this.httpMethods = httpMethods;
        }
    }

    private static final class MappingCoordinate implements Comparable<MappingCoordinate> {
        final RequestMethod httpMethod;
        final String urlPattern;

        MappingCoordinate(RequestMethod httpMethod, String urlPattern) {
            this.httpMethod = httpMethod;
            this.urlPattern = urlPattern;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof MappingCoordinate other)) return false;
            return httpMethod == other.httpMethod && urlPattern.equals(other.urlPattern);
        }

        @Override
        public int hashCode() {
            return httpMethod.hashCode() * 31 + urlPattern.hashCode();
        }

        @Override
        public int compareTo(MappingCoordinate o) {
            int c = urlPattern.compareTo(o.urlPattern);
            if (c != 0) return c;
            return httpMethod.compareTo(o.httpMethod);
        }

        @Override
        public String toString() {
            return httpMethod + " " + urlPattern;
        }
    }
}
