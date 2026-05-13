package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.mindweather.MindWeatherAnalyzeRequest;
import com.coresolution.consultation.dto.mindweather.MindWeatherCardResponse;
import com.coresolution.consultation.dto.mindweather.MindWeatherShareRequest;
import com.coresolution.consultation.entity.User;

/**
 * 마음 날씨 카드 비즈니스 로직.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public interface MindWeatherService {

    /**
     * 텍스트를 분석해 신규 카드를 저장한다.
     *
     * @param request 분석 요청
     * @param client  내담자 사용자
     * @return 저장된 카드 응답
     */
    MindWeatherCardResponse analyze(MindWeatherAnalyzeRequest request, User client);

    /**
     * 본인 카드 목록.
     *
     * @param client 내담자 사용자
     * @return 카드 목록
     */
    List<MindWeatherCardResponse> listMine(User client);

    /**
     * 본인 카드 상세.
     *
     * @param idParam 카드 id (문자열 숫자)
     * @param client  내담자 사용자
     * @return 카드
     */
    MindWeatherCardResponse getMineById(String idParam, User client);

    /**
     * 공유 옵트인/갱신.
     *
     * @param idParam 카드 id
     * @param request 공유 동의
     * @param client  내담자 사용자
     * @return 갱신된 카드
     */
    MindWeatherCardResponse share(String idParam, MindWeatherShareRequest request, User client);

    /**
     * 공유 철회.
     *
     * @param idParam 카드 id
     * @param client  내담자 사용자
     * @return 갱신된 카드
     */
    MindWeatherCardResponse unshare(String idParam, User client);

    /**
     * 상담사 수신함(공유 동의된 카드만).
     *
     * @param consultant 상담사(전문가) 사용자
     * @return 카드 목록
     */
    List<MindWeatherCardResponse> listInboxForConsultant(User consultant);
}
