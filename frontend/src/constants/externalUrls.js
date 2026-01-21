/**
 * External System URLs
 * 외부 시스템 연동 주소 상수
 */

export const EXTERNAL_URLS = {
    OPS: 'http://localhost:4300',      // 운영 포털
    ONBOARDING: 'http://localhost:3100', // 온보딩 시스템 (별도 로컬 서비스)
    CORE: 'http://localhost:3000',     // 코어 솔루션 (메인 서비스)

    // Helper properties for specific paths
    get ONBOARDING_REGISTER() { return `${this.ONBOARDING}/register`; },
    get ONBOARDING_CONTACT() { return `${this.ONBOARDING}/contact`; },
    get CORE_LOGIN() { return `${this.CORE}/login`; },
    get OPS_LOGIN() { return `${this.OPS}/auth/login`; },
};
