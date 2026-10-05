package com.coresolution.core.krpublic;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 도로명주소 검색 결과. 키가 없으면 enabled=false 이고 수동 입력을 막지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressSearchResult {

    private boolean enabled;

    @Builder.Default
    private List<AddressItem> items = new ArrayList<>();

    /**
     * 도로명주소 한 건.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddressItem {
        private String roadAddress;
        private String zipCode;
    }
}
