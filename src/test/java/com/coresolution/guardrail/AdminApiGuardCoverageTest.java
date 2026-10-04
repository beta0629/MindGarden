package com.coresolution.guardrail;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.asm.ClassReader;
import org.springframework.asm.ClassVisitor;
import org.springframework.asm.Handle;
import org.springframework.asm.MethodVisitor;
import org.springframework.asm.Opcodes;
import org.springframework.asm.Type;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.support.GenericBeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Controller;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * 가드레일 1 — 관리자 API 역할 검사 누락 차단.
 *
 * <p><b>수집</b>: {@code com.coresolution} 의 {@code @Controller}/{@code @RestController} 를 지연(lazy) 빈 정의로만
 * 등록한 {@link GenericApplicationContext} 에 Spring 의 {@link RequestMappingHandlerMapping} 을 붙여, 운영과
 * 같은 매핑 규칙(클래스+메서드 경로 결합, placeholder 해석)으로 핸들러를 모은다. 컨트롤러 인스턴스·DB·Redis 를
 * 만들지 않으므로 수 초 안에 끝난다. 경로가 {@code /api/v1/admin/**} 또는 {@code /api/admin/**} 인 핸들러만 본다.</p>
 *
 * <p><b>가드 판정</b>: (1) 메서드/클래스에 역할식이 있는 {@code @PreAuthorize}(hasRole·hasAuthority 등),
 * {@code @Secured}, {@code @RolesAllowed}, {@code @RequireRole} 이 있거나 (2) 핸들러 바이트코드(같은 컨트롤러·상위
 * 클래스의 헬퍼 메서드와 람다 본문까지 깊이 5 추적)에 {@code guardrails/admin-api-guard-methods.txt} 의 공통 가드
 * 호출이 하나라도 있으면 통과. 소스 정규식 대신 바이트코드를 보는 이유: 주석·문자열 오탐이 없고, 헬퍼로
 * 감싼 가드 호출도 따라갈 수 있다. 서비스 계층 안쪽의 검사는 추적하지 않는다(그런 핸들러는 베이스라인에 사유와 함께 둔다).</p>
 *
 * <p><b>예외/베이스라인</b>: {@code guardrails/admin-api-guard-allowlist.txt} 한 파일. {@code PUBLIC} 은 의도된
 * 공개 API(라벨·메뉴·브랜딩 등), {@code TODO} 는 현재 미가드(정리 대상). 둘 다 사유 필수, 줄어들기만 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("[가드레일1] /api/v1/admin/**·/api/admin/** 핸들러는 공통 역할 가드를 거친다")
class AdminApiGuardCoverageTest {

    static final Path ALLOWLIST = Path.of("src/test/resources/guardrails/admin-api-guard-allowlist.txt");
    static final Path GUARD_METHODS = Path.of("src/test/resources/guardrails/admin-api-guard-methods.txt");
    static final Path CURRENT_OUT = Path.of("target/guardrails/admin-api-unguarded.current.txt");
    private static final String BASE_PACKAGE = "com.coresolution";
    private static final List<String> ADMIN_PREFIXES = List.of("/api/v1/admin/", "/api/admin/");
    private static final int MAX_DEPTH = 5;
    private static final Set<String> ROLE_ANNOTATIONS = Set.of("Secured", "RolesAllowed", "RequireRole");
    private static final Pattern ROLE_EXPRESSION =
        Pattern.compile("has(Any)?(Role|Authority)\\s*\\(|denyAll");

    @Test
    @DisplayName("미가드 관리자 핸들러는 allowlist(PUBLIC/TODO) 와 정확히 일치해야 한다 (신규 FAIL · 정리된 항목 삭제 FAIL)")
    void everyAdminHandlerIsGuardedOrListed() throws Exception {
        List<GuardSpec> specs = loadGuardSpecs();
        Map<String, String> unguarded = new TreeMap<>();
        Map<String, HandlerMethod> handlers = collectAdminHandlers();
        assertTrue(handlers.size() > 0, "관리자 핸들러를 하나도 찾지 못했습니다 — 수집 로직(경로 prefix)을 확인하세요");
        for (Map.Entry<String, HandlerMethod> e : handlers.entrySet()) {
            Method method = e.getValue().getMethod();
            if (!hasRoleAnnotation(method) && !callsGuard(method, specs)) {
                unguarded.merge(handlerKey(method), e.getKey(), (a, b) -> a + ", " + b);
            }
        }
        Files.createDirectories(CURRENT_OUT.getParent());
        Files.write(CURRENT_OUT, unguarded.entrySet().stream()
            .map(x -> "TODO " + x.getKey() + " # " + x.getValue()).collect(Collectors.toList()),
            StandardCharsets.UTF_8);

        GuardrailBaseline baseline = GuardrailBaseline.load(ALLOWLIST, Set.of("PUBLIC", "TODO"));
        List<String> failures = baseline.diff(unguarded.keySet(),
            "핸들러에서 공통 가드(ClientPathAccessGuard.requireTenantManager 등, admin-api-guard-methods.txt)를 호출하거나"
                + " @PreAuthorize(hasRole…) 를 붙이세요. 공개 API 면 allowlist 에 'PUBLIC <key> # 사유' 추가");
        failures.replaceAll(f -> withPaths(f, unguarded));
        assertTrue(failures.isEmpty(), GuardrailBaseline.report("관리자 API 가드 누락", failures)
            + "\n  (전체 현재 목록: " + CURRENT_OUT + ")");
    }

    private static String withPaths(String failure, Map<String, String> unguarded) {
        for (Map.Entry<String, String> e : unguarded.entrySet()) {
            if (failure.startsWith("신규 위반: " + e.getKey() + " ")) {
                return failure.replace(e.getKey() + " —", e.getKey() + " [" + e.getValue() + "] —");
            }
        }
        return failure;
    }

    static String handlerKey(Method method) {
        return method.getDeclaringClass().getSimpleName() + "#" + method.getName();
    }

    /**
     * 관리자 경로 핸들러를 "HTTP메서드 경로" → HandlerMethod 로 모은다.
     *
     * @return 정렬된 핸들러 맵
     */
    static Map<String, HandlerMethod> collectAdminHandlers() {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(Controller.class));
        try (GenericApplicationContext ctx = new GenericApplicationContext()) {
            for (BeanDefinition candidate : scanner.findCandidateComponents(BASE_PACKAGE)) {
                GenericBeanDefinition def = new GenericBeanDefinition();
                def.setBeanClassName(candidate.getBeanClassName());
                def.setLazyInit(true);
                ctx.registerBeanDefinition(candidate.getBeanClassName(), def);
            }
            ctx.refresh();
            RequestMappingHandlerMapping mapping = new RequestMappingHandlerMapping();
            mapping.setApplicationContext(ctx);
            mapping.setEmbeddedValueResolver(ctx.getEnvironment()::resolvePlaceholders);
            mapping.afterPropertiesSet();
            Map<String, HandlerMethod> result = new TreeMap<>();
            for (Map.Entry<RequestMappingInfo, HandlerMethod> e : mapping.getHandlerMethods().entrySet()) {
                RequestMappingInfo info = e.getKey();
                String methods = info.getMethodsCondition().getMethods().isEmpty() ? "ANY"
                    : info.getMethodsCondition().getMethods().stream().map(Enum::name).sorted()
                        .collect(Collectors.joining("|"));
                for (String path : info.getPatternValues()) {
                    if (ADMIN_PREFIXES.stream().anyMatch(p -> path.startsWith(p) || (path + "/").equals(p))) {
                        result.put(methods + " " + path, e.getValue());
                    }
                }
            }
            return result;
        }
    }

    private static boolean hasRoleAnnotation(Method method) {
        List<Annotation> annotations = new ArrayList<>(List.of(method.getAnnotations()));
        annotations.addAll(List.of(method.getDeclaringClass().getAnnotations()));
        for (Annotation a : annotations) {
            String name = a.annotationType().getSimpleName();
            if (ROLE_ANNOTATIONS.contains(name)) {
                return true;
            }
            if ("PreAuthorize".equals(name) && ROLE_EXPRESSION.matcher(String.valueOf(a)).find()) {
                return true;
            }
        }
        return false;
    }

    /** 바이트코드에서 가드 호출을 찾는다. 같은 클래스(및 com.coresolution 상위 클래스) 메서드·람다는 재귀 추적. */
    static boolean callsGuard(Method method, List<GuardSpec> specs) throws IOException {
        Set<String> traceOwners = new HashSet<>();
        for (Class<?> c = method.getDeclaringClass(); c != null && c.getName().startsWith(BASE_PACKAGE);
                c = c.getSuperclass()) {
            traceOwners.add(Type.getInternalName(c));
        }
        Deque<String[]> queue = new ArrayDeque<>();
        Set<String> visited = new HashSet<>();
        queue.add(new String[] {Type.getInternalName(method.getDeclaringClass()), method.getName(),
            Type.getMethodDescriptor(method), "0"});
        while (!queue.isEmpty()) {
            String[] target = queue.poll();
            if (!visited.add(target[0] + "." + target[1] + target[2])) {
                continue;
            }
            int depth = Integer.parseInt(target[3]);
            List<String[]> calls = readCalls(target[0], target[1], target[2]);
            for (String[] call : calls) {
                if (specs.stream().anyMatch(s -> s.matches(call[0], call[1]))) {
                    return true;
                }
                if (depth < MAX_DEPTH && traceOwners.contains(call[0])) {
                    queue.add(new String[] {call[0], call[1], call[2], String.valueOf(depth + 1)});
                }
            }
        }
        return false;
    }

    private static final Map<String, Map<String, List<String[]>>> CALL_CACHE = new LinkedHashMap<>();

    private static List<String[]> readCalls(String owner, String name, String desc) throws IOException {
        Map<String, List<String[]>> byMethod = CALL_CACHE.get(owner);
        if (byMethod == null) {
            byMethod = new LinkedHashMap<>();
            String resource = owner + ".class";
            try (InputStream in = AdminApiGuardCoverageTest.class.getClassLoader().getResourceAsStream(resource)) {
                if (in != null) {
                    collectCalls(new ClassReader(in), byMethod);
                }
            }
            CALL_CACHE.put(owner, byMethod);
        }
        return byMethod.getOrDefault(name + desc, List.of());
    }

    private static void collectCalls(ClassReader reader, Map<String, List<String[]>> byMethod) {
        reader.accept(new ClassVisitor(Opcodes.ASM9) {
            @Override
            public MethodVisitor visitMethod(int access, String name, String descriptor, String signature,
                    String[] exceptions) {
                List<String[]> calls = new ArrayList<>();
                byMethod.put(name + descriptor, calls);
                return new MethodVisitor(Opcodes.ASM9) {
                    @Override
                    public void visitMethodInsn(int opcode, String owner, String mName, String mDesc, boolean itf) {
                        calls.add(new String[] {owner, mName, mDesc});
                    }

                    @Override
                    public void visitInvokeDynamicInsn(String iName, String iDesc, Handle bsm, Object... args) {
                        for (Object arg : args) {
                            if (arg instanceof Handle h) {
                                calls.add(new String[] {h.getOwner(), h.getName(), h.getDesc()});
                            }
                        }
                    }
                };
            }
        }, ClassReader.SKIP_DEBUG | ClassReader.SKIP_FRAMES);
    }

    static List<GuardSpec> loadGuardSpecs() throws IOException {
        List<GuardSpec> specs = new ArrayList<>();
        for (String raw : Files.readAllLines(GUARD_METHODS, StandardCharsets.UTF_8)) {
            String line = raw.contains(" # ") ? raw.substring(0, raw.indexOf(" # ")).strip() : raw.strip();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            String[] parts = line.split("#", 2);
            specs.add(new GuardSpec(parts[0], parts[1]));
        }
        return specs;
    }

    /** 소유 클래스 단순명 + 메서드명 glob. */
    record GuardSpec(String ownerSimpleName, String methodGlob) {
        boolean matches(String ownerInternalName, String methodName) {
            String simple = ownerInternalName.substring(ownerInternalName.lastIndexOf('/') + 1);
            simple = simple.substring(simple.lastIndexOf('$') + 1);
            if (!simple.equals(ownerSimpleName)) {
                return false;
            }
            String regex = Pattern.quote(methodGlob).replace("*", "\\E.*\\Q");
            return methodName.matches(regex);
        }
    }
}
