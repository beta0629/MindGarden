package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.ClientEventBackfillMode;
import com.coresolution.consultation.dto.ClientEventBackfillResult;

/**
 * 내담자 관리용 타임라인({@code client_event}) 백필 서비스.
 *
 * <p>소스 테이블을 읽어 {@link ClientEventService#record} 로 append-only 재구성한다.
 * dry-run 은 insert 0·예상 건수만. apply 재실행 시 멱등(skipped)이다.
 * {@code tenantId} 는 필수(전체 테넌트 순회 없음).</p>
 *
 * <p>.dev HTTP 가드({@code requireDevOnly})는 Controller 전용이다.
 * 본 서비스는 서버 로컬 CLI(운영 포함)에서도 호출된다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public interface ClientEventBackfillService {

    /**
     * dry-run: DB insert 없이 scanned/inserted(예상)/skipped 만 집계.
     *
     * @param tenantId 테넌트(필수)
     * @return 집계
     */
    ClientEventBackfillResult dryRun(String tenantId);

    /**
     * apply: {@link ClientEventService#record} 로 실제 insert(멱등).
     *
     * @param tenantId 테넌트(필수)
     * @return 집계
     */
    ClientEventBackfillResult apply(String tenantId);

    /**
     * 모드에 따라 dry-run 또는 apply 를 실행한다.
     *
     * @param mode 실행 모드(ROLLBACK 제외 — {@link #rollback} 사용)
     * @param tenantId 테넌트(필수)
     * @return 집계
     */
    ClientEventBackfillResult run(ClientEventBackfillMode mode, String tenantId);

    /**
     * 백필 행 롤백. {@code source=BACKFILLED} 이고 통일/레거시 키인 행만.
     *
     * @param tenantId 테넌트(필수)
     * @param dryRun true 이면 삭제 예정 건수만
     * @return 집계(inserted=삭제 예정/삭제 건수)
     */
    ClientEventBackfillResult rollback(String tenantId, boolean dryRun);
}
