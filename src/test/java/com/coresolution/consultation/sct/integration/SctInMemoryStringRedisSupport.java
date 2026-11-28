package com.coresolution.consultation.sct.integration;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.connection.RedisClusterConnection;
import org.springframework.data.redis.connection.RedisCommands;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.connection.RedisHashCommands;
import org.springframework.data.redis.connection.RedisHyperLogLogCommands;
import org.springframework.data.redis.connection.RedisKeyCommands;
import org.springframework.data.redis.connection.RedisListCommands;
import org.springframework.data.redis.connection.RedisScriptingCommands;
import org.springframework.data.redis.connection.RedisSentinelConnection;
import org.springframework.data.redis.connection.RedisServerCommands;
import org.springframework.data.redis.connection.RedisSetCommands;
import org.springframework.data.redis.connection.RedisStreamCommands;
import org.springframework.data.redis.connection.RedisStringCommands;
import org.springframework.data.redis.connection.RedisZSetCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.types.Expiration;

/**
 * SCT IT 전용 — Mockito 없이 ConcurrentHashMap 백킹 {@link StringRedisTemplate}.
 *
 * <p>{@link com.coresolution.consultation.sct.service.SctExchangeCodeStore}·
 * {@link com.coresolution.consultation.sct.service.SctVerifySessionStore} 가 쓰는
 * get/set(TTL)/expire/del/ttl 만 지원한다.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public final class SctInMemoryStringRedisSupport {

    private SctInMemoryStringRedisSupport() {
    }

    /**
     * 공유 맵을 비울 수 있는 인메모리 Redis 핸들.
     *
     * @param store    키→값
     * @param template afterPropertiesSet 완료된 StringRedisTemplate
     */
    public record Harness(ConcurrentHashMap<String, Entry> store, StringRedisTemplate template) {

        /**
         * 저장소 비우기.
         */
        public void clear() {
            store.clear();
        }
    }

    /**
     * 값 + 만료 epoch millis({@code expireAtEpochMs <= 0} 이면 무만료).
     *
     * @param value           바이트 값
     * @param expireAtEpochMs 만료 시각(ms). 0 이하면 무만료
     */
    public record Entry(byte[] value, long expireAtEpochMs) {
    }

    /**
     * Mockito 없는 인메모리 {@link StringRedisTemplate} 생성.
     *
     * @return harness
     */
    public static Harness create() {
        ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();
        RedisConnectionFactory factory = new MemoryRedisConnectionFactory(store);
        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(factory);
        template.afterPropertiesSet();
        return new Harness(store, template);
    }

    private static final class MemoryRedisConnectionFactory implements RedisConnectionFactory {

        private final ConcurrentHashMap<String, Entry> store;

        private MemoryRedisConnectionFactory(ConcurrentHashMap<String, Entry> store) {
            this.store = store;
        }

        @Override
        public RedisConnection getConnection() {
            return newConnection(store);
        }

        @Override
        public RedisClusterConnection getClusterConnection() {
            throw new UnsupportedOperationException("cluster not supported");
        }

        @Override
        public boolean getConvertPipelineAndTxResults() {
            return true;
        }

        @Override
        public RedisSentinelConnection getSentinelConnection() {
            throw new UnsupportedOperationException("sentinel not supported");
        }

        @Override
        public DataAccessException translateExceptionIfPossible(RuntimeException ex) {
            return null;
        }
    }

    private static RedisConnection newConnection(ConcurrentHashMap<String, Entry> store) {
        RedisKeyCommands keyCommands = proxyCommands(RedisKeyCommands.class, new KeyHandler(store));
        RedisStringCommands stringCommands =
                proxyCommands(RedisStringCommands.class, new StringHandler(store));
        AtomicBoolean closed = new AtomicBoolean(false);
        ConnectionHandler handler = new ConnectionHandler(store, keyCommands, stringCommands, closed);
        RedisConnection connection = (RedisConnection) Proxy.newProxyInstance(
                RedisConnection.class.getClassLoader(),
                new Class<?>[]{RedisConnection.class},
                handler);
        handler.bind(connection);
        return connection;
    }

    private static final class ConnectionHandler implements InvocationHandler {

        private final ConcurrentHashMap<String, Entry> store;
        private final RedisKeyCommands keyCommands;
        private final RedisStringCommands stringCommands;
        private final AtomicBoolean closed;
        private RedisConnection self;

        private ConnectionHandler(
                ConcurrentHashMap<String, Entry> store,
                RedisKeyCommands keyCommands,
                RedisStringCommands stringCommands,
                AtomicBoolean closed) {
            this.store = store;
            this.keyCommands = keyCommands;
            this.stringCommands = stringCommands;
            this.closed = closed;
        }

        private void bind(RedisConnection self) {
            this.self = self;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            if (method.getDeclaringClass() == Object.class) {
                return invokeObject(method, args, this);
            }
            String name = method.getName();
            switch (name) {
                case "keyCommands" -> {
                    return keyCommands;
                }
                case "stringCommands" -> {
                    return stringCommands;
                }
                case "commands" -> {
                    return proxyCommands(RedisCommands.class, (p, m, a) ->
                            dispatchShared(m, a, keyCommands, stringCommands));
                }
                case "geoCommands" -> {
                    return unsupported(RedisGeoCommands.class);
                }
                case "hashCommands" -> {
                    return unsupported(RedisHashCommands.class);
                }
                case "hyperLogLogCommands" -> {
                    return unsupported(RedisHyperLogLogCommands.class);
                }
                case "listCommands" -> {
                    return unsupported(RedisListCommands.class);
                }
                case "setCommands" -> {
                    return unsupported(RedisSetCommands.class);
                }
                case "scriptingCommands" -> {
                    return unsupported(RedisScriptingCommands.class);
                }
                case "serverCommands" -> {
                    return unsupported(RedisServerCommands.class);
                }
                case "streamCommands" -> {
                    return unsupported(RedisStreamCommands.class);
                }
                case "zSetCommands" -> {
                    return unsupported(RedisZSetCommands.class);
                }
                case "close" -> {
                    closed.set(true);
                    return null;
                }
                case "isClosed" -> {
                    return closed.get();
                }
                case "getNativeConnection" -> {
                    return store;
                }
                case "isQueueing", "isPipelined", "isSubscribed" -> {
                    return Boolean.FALSE;
                }
                case "openPipeline" -> {
                    throw new UnsupportedOperationException("pipeline not supported");
                }
                case "closePipeline" -> {
                    return Collections.emptyList();
                }
                case "getSentinelConnection" -> {
                    throw new UnsupportedOperationException("sentinel not supported");
                }
                case "getSubscription" -> {
                    return null;
                }
                case "multi", "discard", "unwatch", "select" -> {
                    return null;
                }
                case "exec" -> {
                    return List.of();
                }
                case "watch" -> {
                    return null;
                }
                case "echo" -> {
                    return args == null || args.length == 0 ? null : args[0];
                }
                case "ping" -> {
                    return "PONG";
                }
                case "publish" -> {
                    return 0L;
                }
                case "subscribe", "pSubscribe" -> {
                    return null;
                }
                case "execute" -> {
                    throw new UnsupportedOperationException("execute not supported");
                }
                default -> {
                    // no-op
                }
            }
            if (method.isDefault()) {
                return InvocationHandler.invokeDefault(self != null ? self : proxy, method, args);
            }
            if (isKeyCommand(name)) {
                return method.invoke(keyCommands, args);
            }
            if (isStringCommand(name)) {
                return method.invoke(stringCommands, args);
            }
            throw new UnsupportedOperationException("RedisConnection." + name);
        }
    }

    private static Object dispatchShared(
            Method method,
            Object[] args,
            RedisKeyCommands keyCommands,
            RedisStringCommands stringCommands) throws Throwable {
        if (method.getDeclaringClass() == Object.class) {
            return invokeObject(method, args, keyCommands);
        }
        String name = method.getName();
        if (isKeyCommand(name)) {
            return method.invoke(keyCommands, args);
        }
        if (isStringCommand(name)) {
            return method.invoke(stringCommands, args);
        }
        throw new UnsupportedOperationException("RedisCommands." + name);
    }

    private static boolean isKeyCommand(String name) {
        return switch (name) {
            case "del", "unlink", "expire", "pExpire", "expireAt", "pExpireAt",
                    "ttl", "pTtl", "persist", "exists", "type", "touch", "keys",
                    "rename", "renameNX", "move", "dump", "restore", "encodingOf",
                    "idletime", "refcount", "copy", "scan", "randomKey", "sort" -> true;
            default -> false;
        };
    }

    private static boolean isStringCommand(String name) {
        return switch (name) {
            case "get", "getDel", "getEx", "getSet", "mGet", "set", "setNX", "setEx", "pSetEx",
                    "mSet", "mSetNX", "incr", "incrBy", "decr", "decrBy", "append",
                    "getRange", "setRange", "getBit", "setBit", "bitCount", "bitField",
                    "bitOp", "bitPos", "strLen" -> true;
            default -> false;
        };
    }

    private static final class KeyHandler implements InvocationHandler {

        private final ConcurrentHashMap<String, Entry> store;

        private KeyHandler(ConcurrentHashMap<String, Entry> store) {
            this.store = store;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) {
            if (method.getDeclaringClass() == Object.class) {
                return invokeObject(method, args, this);
            }
            String name = method.getName();
            return switch (name) {
                case "del", "unlink" -> Long.valueOf(deleteKeys(store, asKeyArray(args[0])));
                case "expire" -> Boolean.valueOf(expireSeconds(store, (byte[]) args[0], (Long) args[1]));
                case "pExpire" -> Boolean.valueOf(
                        expireMillis(store, (byte[]) args[0], (Long) args[1]));
                case "ttl" -> ttl(store, (byte[]) args[0], args);
                case "pTtl" -> pTtl(store, (byte[]) args[0], args);
                case "exists" -> exists(store, args);
                default -> throw new UnsupportedOperationException("RedisKeyCommands." + name);
            };
        }
    }

    private static final class StringHandler implements InvocationHandler {

        private final ConcurrentHashMap<String, Entry> store;

        private StringHandler(ConcurrentHashMap<String, Entry> store) {
            this.store = store;
        }

        @Override
        public Object invoke(Object proxy, Method method, Object[] args) {
            if (method.getDeclaringClass() == Object.class) {
                return invokeObject(method, args, this);
            }
            String name = method.getName();
            return switch (name) {
                case "get" -> getBytes(store, (byte[]) args[0]);
                case "set" -> setBytes(store, args);
                case "setEx" -> {
                    putWithTtlSeconds(store, (byte[]) args[0], (byte[]) args[2], (Long) args[1]);
                    yield Boolean.TRUE;
                }
                case "pSetEx" -> {
                    putWithTtlMillis(store, (byte[]) args[0], (byte[]) args[2], (Long) args[1]);
                    yield Boolean.TRUE;
                }
                case "setNX" -> setIfAbsent(store, (byte[]) args[0], (byte[]) args[1]);
                default -> throw new UnsupportedOperationException("RedisStringCommands." + name);
            };
        }
    }

    private static Boolean setBytes(ConcurrentHashMap<String, Entry> store, Object[] args) {
        byte[] key = (byte[]) args[0];
        byte[] value = (byte[]) args[1];
        if (args.length == 2) {
            store.put(keyString(key), new Entry(copy(value), 0L));
            return Boolean.TRUE;
        }
        Expiration expiration = (Expiration) args[2];
        RedisStringCommands.SetOption option = args.length > 3
                ? (RedisStringCommands.SetOption) args[3]
                : RedisStringCommands.SetOption.UPSERT;
        String k = keyString(key);
        purgeIfExpired(store, k);
        boolean present = store.containsKey(k);
        if (option == RedisStringCommands.SetOption.SET_IF_ABSENT && present) {
            return Boolean.FALSE;
        }
        if (option == RedisStringCommands.SetOption.SET_IF_PRESENT && !present) {
            return Boolean.FALSE;
        }
        long expireAt = 0L;
        if (expiration != null && !expiration.isPersistent() && !expiration.isKeepTtl()) {
            expireAt = System.currentTimeMillis() + expiration.getExpirationTimeInMilliseconds();
        } else if (expiration != null && expiration.isKeepTtl() && present) {
            Entry existing = store.get(k);
            expireAt = existing == null ? 0L : existing.expireAtEpochMs();
        }
        store.put(k, new Entry(copy(value), expireAt));
        return Boolean.TRUE;
    }

    private static Boolean setIfAbsent(
            ConcurrentHashMap<String, Entry> store, byte[] key, byte[] value) {
        String k = keyString(key);
        purgeIfExpired(store, k);
        Entry prev = store.putIfAbsent(k, new Entry(copy(value), 0L));
        return Boolean.valueOf(prev == null);
    }

    private static byte[] getBytes(ConcurrentHashMap<String, Entry> store, byte[] key) {
        String k = keyString(key);
        purgeIfExpired(store, k);
        Entry entry = store.get(k);
        return entry == null ? null : copy(entry.value());
    }

    private static byte[][] asKeyArray(Object raw) {
        if (raw == null) {
            return new byte[0][];
        }
        if (raw instanceof byte[][] many) {
            return many;
        }
        if (raw instanceof byte[] single) {
            return new byte[][]{single};
        }
        return new byte[0][];
    }

    private static long deleteKeys(ConcurrentHashMap<String, Entry> store, byte[][] keys) {
        if (keys == null || keys.length == 0) {
            return 0L;
        }
        long removed = 0L;
        for (byte[] key : keys) {
            if (store.remove(keyString(key)) != null) {
                removed++;
            }
        }
        return removed;
    }

    private static boolean expireSeconds(
            ConcurrentHashMap<String, Entry> store, byte[] key, long seconds) {
        return expireMillis(store, key, TimeUnit.SECONDS.toMillis(seconds));
    }

    private static boolean expireMillis(
            ConcurrentHashMap<String, Entry> store, byte[] key, long millis) {
        String k = keyString(key);
        purgeIfExpired(store, k);
        Entry entry = store.get(k);
        if (entry == null) {
            return false;
        }
        store.put(k, new Entry(entry.value(), System.currentTimeMillis() + millis));
        return true;
    }

    private static Long ttl(ConcurrentHashMap<String, Entry> store, byte[] key, Object[] args) {
        long millis = remainingMillis(store, key);
        if (millis < 0L) {
            return millis;
        }
        if (args != null && args.length > 1 && args[1] instanceof TimeUnit unit) {
            return unit.convert(millis, TimeUnit.MILLISECONDS);
        }
        return TimeUnit.MILLISECONDS.toSeconds(millis);
    }

    private static Long pTtl(ConcurrentHashMap<String, Entry> store, byte[] key, Object[] args) {
        long millis = remainingMillis(store, key);
        if (millis < 0L) {
            return millis;
        }
        if (args != null && args.length > 1 && args[1] instanceof TimeUnit unit) {
            return unit.convert(millis, TimeUnit.MILLISECONDS);
        }
        return millis;
    }

    /**
     * Redis TTL 관례: 키 없음 -2, 무만료 -1, 그 외 잔여 ms.
     */
    private static long remainingMillis(ConcurrentHashMap<String, Entry> store, byte[] key) {
        String k = keyString(key);
        purgeIfExpired(store, k);
        Entry entry = store.get(k);
        if (entry == null) {
            return -2L;
        }
        if (entry.expireAtEpochMs() <= 0L) {
            return -1L;
        }
        long left = entry.expireAtEpochMs() - System.currentTimeMillis();
        return Math.max(0L, left);
    }

    private static Object exists(ConcurrentHashMap<String, Entry> store, Object[] args) {
        if (args == null || args.length == 0) {
            return 0L;
        }
        Object first = args[0];
        if (first instanceof byte[] single) {
            String k = keyString(single);
            purgeIfExpired(store, k);
            return Boolean.valueOf(store.containsKey(k));
        }
        if (first instanceof byte[][] many) {
            long count = 0L;
            for (byte[] key : many) {
                String k = keyString(key);
                purgeIfExpired(store, k);
                if (store.containsKey(k)) {
                    count++;
                }
            }
            return count;
        }
        return 0L;
    }

    private static void putWithTtlSeconds(
            ConcurrentHashMap<String, Entry> store, byte[] key, byte[] value, long seconds) {
        store.put(keyString(key), new Entry(
                copy(value),
                System.currentTimeMillis() + TimeUnit.SECONDS.toMillis(seconds)));
    }

    private static void putWithTtlMillis(
            ConcurrentHashMap<String, Entry> store, byte[] key, byte[] value, long millis) {
        store.put(keyString(key), new Entry(copy(value), System.currentTimeMillis() + millis));
    }

    private static void purgeIfExpired(ConcurrentHashMap<String, Entry> store, String key) {
        Entry entry = store.get(key);
        if (entry == null) {
            return;
        }
        if (entry.expireAtEpochMs() > 0L && entry.expireAtEpochMs() <= System.currentTimeMillis()) {
            store.remove(key, entry);
        }
    }

    private static String keyString(byte[] key) {
        return new String(key, StandardCharsets.UTF_8);
    }

    private static byte[] copy(byte[] value) {
        return value == null ? null : Arrays.copyOf(value, value.length);
    }

    @SuppressWarnings("unchecked")
    private static <T> T proxyCommands(Class<T> type, InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, handler);
    }

    private static <T> T unsupported(Class<T> type) {
        return proxyCommands(type, (proxy, method, args) -> {
            if (method.getDeclaringClass() == Object.class) {
                return invokeObject(method, args, proxy);
            }
            throw new UnsupportedOperationException(type.getSimpleName() + "." + method.getName());
        });
    }

    private static Object invokeObject(Method method, Object[] args, Object target) {
        return switch (method.getName()) {
            case "toString" -> target.getClass().getSimpleName() + "@" + System.identityHashCode(target);
            case "hashCode" -> System.identityHashCode(target);
            case "equals" -> Boolean.valueOf(target == args[0]);
            default -> throw new UnsupportedOperationException(method.getName());
        };
    }
}
