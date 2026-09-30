package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.service.SystemMonitoringService;
import com.coresolution.core.service.ConnectionPoolManagementService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.RuntimeMXBean;
import java.lang.management.ThreadMXBean;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 시스템 모니터링 서비스 구현체
 * Week 13 Day 2: 동적 시스템 감시 시스템 구축
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemMonitoringServiceImpl implements SystemMonitoringService {

    private final MeterRegistry meterRegistry;
    private final JdbcTemplate jdbcTemplate;
    private final ConnectionPoolManagementService connectionPoolManagementService;

    /**
     * Heap 사용률 경고 임계치 (%) — 테넌트 ID 하드코딩 금지, env/property 만.
     */
    @Value("${mg.monitoring.stacking.heap-warn-pct:85}")
    private double heapWarnPct;

    /**
     * Hikari pending(대기 스레드) 경고: 이 값을 초과하면 alert.
     */
    @Value("${mg.monitoring.stacking.hikari-pending-warn:0}")
    private int hikariPendingWarn;

    /**
     * Hikari active/max 비율 경고 임계치 (0.0–1.0).
     */
    @Value("${mg.monitoring.stacking.hikari-active-ratio-warn:0.9}")
    private double hikariActiveRatioWarn;

    /**
     * JVM live thread 고수위 경고.
     */
    @Value("${mg.monitoring.stacking.jvm-threads-live-warn:500}")
    private int jvmThreadsLiveWarn;

    @Override
    public Map<String, Object> getSystemStatus() {
        Map<String, Object> status = new HashMap<>();

        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();

        status.put("uptime", runtimeBean.getUptime());
        status.put("uptimeFormatted", formatUptime(runtimeBean.getUptime()));
        status.put("jvmName", runtimeBean.getVmName());
        status.put("jvmVersion", runtimeBean.getVmVersion());
        status.put("availableProcessors", Runtime.getRuntime().availableProcessors());

        long totalMemory = Runtime.getRuntime().totalMemory();
        long freeMemory = Runtime.getRuntime().freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = Runtime.getRuntime().maxMemory();

        status.put("memory", Map.of(
                "total", totalMemory,
                "used", usedMemory,
                "free", freeMemory,
                "max", maxMemory,
                "usedPercent", (double) usedMemory / maxMemory * 100
        ));

        return status;
    }

    @Override
    public Map<String, Object> getMemoryUsage() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        Runtime runtime = Runtime.getRuntime();

        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = runtime.maxMemory();

        Map<String, Object> memory = new HashMap<>();
        memory.put("heapUsed", memoryBean.getHeapMemoryUsage().getUsed());
        memory.put("heapMax", memoryBean.getHeapMemoryUsage().getMax());
        memory.put("heapCommitted", memoryBean.getHeapMemoryUsage().getCommitted());
        memory.put("nonHeapUsed", memoryBean.getNonHeapMemoryUsage().getUsed());
        memory.put("nonHeapMax", memoryBean.getNonHeapMemoryUsage().getMax());
        memory.put("totalUsed", usedMemory);
        memory.put("totalMax", maxMemory);
        memory.put("usedPercent", (double) usedMemory / maxMemory * 100);

        return memory;
    }

    @Override
    public Map<String, Object> getCpuUsage() {
        RuntimeMXBean runtimeBean = ManagementFactory.getRuntimeMXBean();
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();

        long uptime = runtimeBean.getUptime();

        Map<String, Object> cpu = new HashMap<>();
        cpu.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        cpu.put("systemLoadAverage", osBean.getSystemLoadAverage());
        cpu.put("uptime", uptime);

        if (osBean instanceof com.sun.management.OperatingSystemMXBean) {
            com.sun.management.OperatingSystemMXBean sunOsBean =
                    (com.sun.management.OperatingSystemMXBean) osBean;
            cpu.put("processCpuLoad", sunOsBean.getProcessCpuLoad());
            cpu.put("systemCpuLoad", sunOsBean.getSystemCpuLoad());
        }

        return cpu;
    }

    @Override
    public Map<String, Object> getDatabaseStatus() {
        Map<String, Object> db = new HashMap<>();

        try {
            log.info("🔍 데이터베이스 상태 확인 시작");

            String connectionTest = jdbcTemplate.queryForObject("SELECT 'OK' as status", String.class);
            db.put("status", "UP");
            db.put("connectionTest", connectionTest);

            try {
                Integer activeConnections = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.processlist WHERE command != 'Sleep'",
                    Integer.class
                );
                db.put("activeConnections", activeConnections != null ? activeConnections : 0);
                log.info("✅ 활성 DB 연결 수: {}", activeConnections);
            } catch (Exception e) {
                log.warn("⚠️ 활성 연결 수 조회 실패: {}", e.getMessage());
                db.put("activeConnections", 0);
                db.put("activeConnectionsError", e.getMessage());
            }

            try {
                Integer totalConnections = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.processlist",
                    Integer.class
                );
                db.put("totalConnections", totalConnections != null ? totalConnections : 0);
                log.info("✅ 전체 DB 연결 수: {}", totalConnections);
            } catch (Exception e) {
                log.warn("⚠️ 전체 연결 수 조회 실패: {}", e.getMessage());
                db.put("totalConnections", 0);
                db.put("totalConnectionsError", e.getMessage());
            }

            try {
                String dbVersion = jdbcTemplate.queryForObject("SELECT VERSION()", String.class);
                db.put("version", dbVersion);
                log.info("✅ DB 버전: {}", dbVersion);
            } catch (Exception e) {
                log.warn("⚠️ DB 버전 조회 실패: {}", e.getMessage());
                db.put("versionError", e.getMessage());
            }

            try {
                Integer tableCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()",
                    Integer.class
                );
                db.put("tableCount", tableCount != null ? tableCount : 0);
                log.info("✅ 테이블 수: {}", tableCount);
            } catch (Exception e) {
                log.warn("⚠️ 테이블 수 조회 실패: {}", e.getMessage());
                db.put("tableCount", 0);
                db.put("tableCountError", e.getMessage());
            }

            log.info("✅ 데이터베이스 상태 확인 완료");

        } catch (Exception e) {
            log.error("❌ 데이터베이스 상태 확인 실패: {}", e.getMessage(), e);
            db.put("status", "DOWN");
            db.put("error", e.getMessage());
            db.put("activeConnections", 0);
            db.put("totalConnections", 0);
        }

        return db;
    }

    @Override
    public Map<String, Object> getRecentErrors(int limit) {
        Map<String, Object> errors = new HashMap<>();
        errors.put("count", 0);
        errors.put("errors", new java.util.ArrayList<>());
        errors.put("note", "로그 파일 파싱 또는 로그 수집 시스템 연동 필요");

        return errors;
    }

    @Override
    public Map<String, Object> getApiResponseTimeStats() {
        Map<String, Object> stats = new HashMap<>();

        try {
            Timer apiTimer = meterRegistry.find("api.duration").timer();
            if (apiTimer != null) {
                stats.put("count", apiTimer.count());
                stats.put("totalTime", apiTimer.totalTime(java.util.concurrent.TimeUnit.MILLISECONDS));
                stats.put("mean", apiTimer.mean(java.util.concurrent.TimeUnit.MILLISECONDS));
                stats.put("max", apiTimer.max(java.util.concurrent.TimeUnit.MILLISECONDS));
                stats.put("note", "Percentile 통계는 Prometheus 또는 별도 설정 필요");
            } else {
                stats.put("note", "아직 수집된 메트릭이 없습니다");
            }
        } catch (Exception e) {
            log.warn("API 응답 시간 통계 조회 실패: {}", e.getMessage());
            stats.put("error", e.getMessage());
        }

        return stats;
    }

    /**
     * Track3: 힙·스레드·Hikari·processlist 스택킹 관측.
     * 경고는 log.warn + alerts 페이로드만 — cleanupConnectionPool / traffic kill 호출 금지.
     *
     * @return 스택킹 상태 맵
     */
    @Override
    public Map<String, Object> getResourceStackingStatus() {
        Map<String, Object> result = new HashMap<>();
        List<String> alerts = new ArrayList<>();
        boolean thresholdsBreached = false;

        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heap = memoryBean.getHeapMemoryUsage();
        long heapUsed = heap.getUsed();
        long heapMax = heap.getMax();
        double heapPct = (heapMax > 0) ? (heapUsed * 100.0 / heapMax) : 0.0;

        Map<String, Object> heapMap = new HashMap<>();
        heapMap.put("used", heapUsed);
        heapMap.put("max", heapMax);
        heapMap.put("pct", heapPct);
        result.put("heap", heapMap);

        ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        int threadsLive = threadBean.getThreadCount();
        int threadsPeak = threadBean.getPeakThreadCount();
        Map<String, Object> threadsMap = new HashMap<>();
        threadsMap.put("live", threadsLive);
        threadsMap.put("peak", threadsPeak);
        result.put("jvmThreads", threadsMap);

        Map<String, Object> hikari = new HashMap<>();
        int hikariActive = 0;
        int hikariIdle = 0;
        int hikariPending = 0;
        int hikariMax = 0;
        try {
            Map<String, Object> poolStatus = connectionPoolManagementService.getConnectionPoolStatus();
            hikari.putAll(poolStatus);
            hikariActive = toInt(poolStatus.get("activeConnections"));
            hikariIdle = toInt(poolStatus.get("idleConnections"));
            hikariPending = toInt(poolStatus.get("threadsAwaitingConnection"));
            hikariMax = toInt(poolStatus.get("maximumPoolSize"));
        } catch (Exception e) {
            log.warn("Hikari 풀 상태 조회 실패(스택킹): {}", e.getMessage());
            hikari.put("error", e.getMessage());
        }
        hikari.put("active", hikariActive);
        hikari.put("idle", hikariIdle);
        hikari.put("pending", hikariPending);
        hikari.put("max", hikariMax);
        result.put("hikari", hikari);

        int processlistActive = 0;
        int processlistTotal = 0;
        Map<String, Object> processlist = new HashMap<>();
        try {
            Integer active = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.processlist WHERE command != 'Sleep'",
                Integer.class
            );
            Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.processlist",
                Integer.class
            );
            processlistActive = active != null ? active : 0;
            processlistTotal = total != null ? total : 0;
        } catch (Exception e) {
            log.warn("processlist counts 조회 실패(스택킹): {}", e.getMessage());
            processlist.put("error", e.getMessage());
        }
        processlist.put("active", processlistActive);
        processlist.put("total", processlistTotal);
        result.put("processlist", processlist);

        Map<String, Object> thresholds = new HashMap<>();
        thresholds.put("heapWarnPct", heapWarnPct);
        thresholds.put("hikariPendingWarn", hikariPendingWarn);
        thresholds.put("hikariActiveRatioWarn", hikariActiveRatioWarn);
        thresholds.put("jvmThreadsLiveWarn", jvmThreadsLiveWarn);
        result.put("thresholds", thresholds);

        if (heapPct >= heapWarnPct) {
            thresholdsBreached = true;
            alerts.add("HEAP_PCT_HIGH");
            log.warn("스택킹 경고: alert=HEAP_PCT_HIGH heapPct={}, heapUsed={}, heapMax={}, threshold={}",
                heapPct, heapUsed, heapMax, heapWarnPct);
        }
        if (hikariPending > hikariPendingWarn) {
            thresholdsBreached = true;
            alerts.add("HIKARI_PENDING");
            log.warn("스택킹 경고: alert=HIKARI_PENDING pending={}, active={}, idle={}, max={}, threshold={}",
                hikariPending, hikariActive, hikariIdle, hikariMax, hikariPendingWarn);
        }
        if (hikariMax > 0 && (hikariActive * 1.0 / hikariMax) >= hikariActiveRatioWarn) {
            thresholdsBreached = true;
            alerts.add("HIKARI_ACTIVE_RATIO_HIGH");
            log.warn("스택킹 경고: alert=HIKARI_ACTIVE_RATIO_HIGH active={}, max={}, ratio={}, threshold={}",
                hikariActive, hikariMax, (hikariActive * 1.0 / hikariMax), hikariActiveRatioWarn);
        }
        if (threadsLive >= jvmThreadsLiveWarn) {
            thresholdsBreached = true;
            alerts.add("JVM_THREADS_LIVE_HIGH");
            log.warn("스택킹 경고: alert=JVM_THREADS_LIVE_HIGH live={}, peak={}, threshold={}",
                threadsLive, threadsPeak, jvmThreadsLiveWarn);
        }

        result.put("alerts", alerts);
        result.put("thresholdsBreached", thresholdsBreached);
        result.put("readOnly", true);
        result.put("note", "Observability only — no pool cleanup or traffic kill");

        return result;
    }

    /**
     * Number/String → int 안전 변환.
     *
     * @param value 원본 값
     * @return int (실패 시 0)
     */
    private int toInt(Object value) {
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        if (value != null) {
            try {
                return Integer.parseInt(value.toString());
            } catch (NumberFormatException ignored) {
                return 0;
            }
        }
        return 0;
    }

    /**
     * 업타임을 읽기 쉬운 형식으로 변환
     *
     * @param uptimeMs 업타임(밀리초)
     * @return 포맷 문자열
     */
    private String formatUptime(long uptimeMs) {
        long seconds = uptimeMs / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;
        long days = hours / 24;

        if (days > 0) {
            return String.format("%d일 %d시간 %d분", days, hours % 24, minutes % 60);
        } else if (hours > 0) {
            return String.format("%d시간 %d분", hours, minutes % 60);
        } else if (minutes > 0) {
            return String.format("%d분 %d초", minutes, seconds % 60);
        } else {
            return String.format("%d초", seconds);
        }
    }
}
