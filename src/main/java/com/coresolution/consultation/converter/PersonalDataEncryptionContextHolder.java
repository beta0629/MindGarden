package com.coresolution.consultation.converter;

import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * JPA {@link jakarta.persistence.AttributeConverter} 가 Spring DI 컨테이너 밖에서
 * 인스턴스화되는 환경(부트 초기 단계·테스트 컨텍스트)에서도 {@link PersonalDataEncryptionUtil}
 * 에 접근할 수 있도록 정적 핸들을 제공하는 브리지.
 *
 * <p>본 클래스가 Spring 빈으로 생성되는 시점에 정적 참조를 채우고, PII Converter 들은
 * 정적 메서드 {@link #get()} 로 활성 인스턴스를 획득한다. 부팅 초기·테스트에서 아직
 * 초기화 전이라면 {@code null} 을 반환할 수 있으므로 호출 측은 반드시 null 체크 후
 * 평문 입력을 안전 폴백으로 그대로 반환해야 한다.</p>
 *
 * <h3>관련 문서</h3>
 * <ul>
 *   <li>docs/standards/PII_PROTECTION_STANDARD.md §3 — Converter 패턴 정의</li>
 *   <li>docs/standards/SECRET_ROTATION_POLICY.md §2~§4 — 키 회전 절차</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-14
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PersonalDataEncryptionContextHolder {

    private static volatile PersonalDataEncryptionUtil instance;

    private final PersonalDataEncryptionUtil encryptionUtil;

    @PostConstruct
    public void initialize() {
        instance = encryptionUtil;
        log.info("🔐 PersonalDataEncryptionContextHolder 초기화 완료 - PII AttributeConverter SSOT 활성화");
    }

    /**
     * 현재 활성화된 {@link PersonalDataEncryptionUtil} 인스턴스를 반환한다.
     *
     * <p>Spring 컨테이너 초기화 이전에 호출될 수 있으므로 호출 측은 반드시 {@code null}
     * 체크 후 평문 입력을 그대로 반환하는 fail-safe 경로를 두어야 한다 (마이그레이션
     * 백필 batch 등 부팅 초기 진입점 대응).</p>
     *
     * @return 활성 암호화 유틸 인스턴스, 미초기화 시 {@code null}
     */
    public static PersonalDataEncryptionUtil get() {
        return instance;
    }

    /**
     * 테스트용 인스턴스 직접 주입 (Spring 컨텍스트가 기동되지 않는 단위 테스트 전용).
     *
     * @param util 주입할 유틸 인스턴스 (null 허용 — 테스트 종료 시 정리용)
     */
    static void setInstanceForTesting(PersonalDataEncryptionUtil util) {
        instance = util;
    }
}
