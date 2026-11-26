package com.coresolution.consultation.service;

import com.coresolution.consultation.constant.ClientEventBackfillMode;
import com.coresolution.consultation.dto.ClientEventBackfillResult;

/**
 * 내담자 관리용 타임라인({@code client_event}) 백필 서비스.
 *
 * <p>소스 테이블을 읽어 {@link ClientEventService#record} 로 append-only 재구성한다.
 * dry-run 은 insert 0·예상 건수만. apply 재실행 시 멱등(skipped)이다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public interface ClientEventBackfillService {

    /**
     * dry-run: DB insert 없이 scanned/inserted(예상)/skipped 만 집계.
     *
     * @param tenantId 테넌트(null·blank 이면 활성 테넌트 순회, 각 조회는 tenant 스코프)
     * @return 집계
     */
    ClientEventBackfillResult dryRun(String tenantId);

    /**
     * apply: {@link ClientEventService#record} 로 실제 insert(멱등).
     *
     * @param tenantId 테넌트(null·blank 이면 활성 테넌트 순회)
     * @return 집계
     */
    ClientEventBackfillResult apply(String tenantId);

    /**
     * 모드에 따라 dry-run 또는 apply 를 실행한다.
     *
     * @param mode 실행 모드
     * @param tenantId 선택 테넌트
     * @return 집계
     */
    ClientEventBackfillResult run(ClientEventBackfillMode mode, String tenantId);
}
