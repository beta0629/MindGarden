package com.coresolution.core.krpublic;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 키 존재 여부만 알린다. 키 값은 포함하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KrPublicDataCapabilities {

    private boolean businessLookupEnabled;
    private boolean addressSearchEnabled;
}
