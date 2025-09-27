import { apiGet } from './ajax';

/**
 * 공통 코드 관련 유틸리티 함수들
 */

// 공통 코드 캐시
const codeCache = new Map();

/**
 * 공통 코드 그룹의 모든 코드를 가져옵니다
 * @param {string} groupCode - 코드 그룹명
 * @param {boolean} useCache - 캐시 사용 여부 (기본값: true)
 * @returns {Promise<Array>} 공통 코드 배열
 */
export const getCommonCodes = async (groupCode, useCache = true) => {
    try {
        // 캐시에서 먼저 확인
        if (useCache && codeCache.has(groupCode)) {
            return codeCache.get(groupCode);
        }

        const response = await apiGet(`/api/common-codes/group/${groupCode}`);
        
        if (Array.isArray(response)) {
            // 캐시에 저장
            if (useCache) {
                codeCache.set(groupCode, response);
            }
            return response;
        }
        
        return [];
    } catch (error) {
        console.error(`공통 코드 조회 실패 (${groupCode}):`, error);
        return [];
    }
};

/**
 * 특정 코드의 값을 가져옵니다
 * @param {string} groupCode - 코드 그룹명
 * @param {string} codeValue - 코드 값
 * @returns {Promise<string>} 코드 라벨
 */
export const getCodeLabel = async (groupCode, codeValue) => {
    try {
        const codes = await getCommonCodes(groupCode);
        const code = codes.find(c => c.codeValue === codeValue);
        return code ? code.codeLabel : codeValue;
    } catch (error) {
        console.error(`코드 라벨 조회 실패 (${groupCode}.${codeValue}):`, error);
        return codeValue;
    }
};

/**
 * 상담사 등급별 기본 급여를 가져옵니다
 * @returns {Promise<Object>} 등급별 급여 매핑 객체
 */
export const getGradeSalaryMap = async () => {
    try {
        const codes = await getCommonCodes('FREELANCE_BASE_RATE');
        const salaryMap = {};
        
        codes.forEach(code => {
            try {
                const extraData = JSON.parse(code.extraData || '{}');
                if (extraData.rate) {
                    salaryMap[code.codeValue] = extraData.rate;
                }
            } catch (e) {
                console.warn(`등급 급여 파싱 실패 (${code.codeValue}):`, e);
            }
        });
        
        return salaryMap;
    } catch (error) {
        console.error('등급별 급여 조회 실패:', error);
        // 기본값 반환
        return {
            'CONSULTANT_JUNIOR': 30000,
            'CONSULTANT_SENIOR': 35000,
            'CONSULTANT_EXPERT': 40000,
            'CONSULTANT_MASTER': 45000
        };
    }
};

/**
 * 상담사 등급을 한글로 변환합니다
 * @param {string} grade - 등급 코드
 * @returns {Promise<string>} 한글 등급명
 */
export const getGradeKoreanName = async (grade) => {
    try {
        return await getCodeLabel('CONSULTANT_GRADE', grade);
    } catch (error) {
        console.error(`등급 한글명 조회 실패 (${grade}):`, error);
        // 기본값 반환
        const defaultMap = {
            'CONSULTANT_JUNIOR': '주니어 상담사',
            'CONSULTANT_SENIOR': '시니어 상담사',
            'CONSULTANT_EXPERT': '엑스퍼트 상담사',
            'CONSULTANT_MASTER': '마스터 상담사'
        };
        return defaultMap[grade] || grade;
    }
};

/**
 * 패키지 타입별 세션 수와 가격을 가져옵니다
 * @returns {Promise<Array>} 패키지 옵션 배열
 */
export const getPackageOptions = async () => {
    try {
        console.log('🔍 getPackageOptions 시작');
        const codes = await getCommonCodes('CONSULTATION_PACKAGE');
        console.log('📋 CONSULTATION_PACKAGE 코드들:', codes);
        
        return codes.map(code => {
            console.log(`🔧 처리 중인 코드: ${code.codeValue}`);
            let sessions = 1; // 기본값
            let price = 50000; // 기본값
            
            // 코드 값에 따라 세션 수와 가격 설정
            if (code.codeValue === 'BASIC') {
                sessions = 20;
                price = 200000;
            } else if (code.codeValue === 'STANDARD') {
                sessions = 20;
                price = 400000;
            } else if (code.codeValue === 'PREMIUM') {
                sessions = 20;
                price = 600000;
            } else if (code.codeValue === 'VIP') {
                sessions = 20;
                price = 1000000;
            } else if (code.codeValue.startsWith('SINGLE_')) {
                sessions = 1;
                // SINGLE_30000 -> 30000
                const priceStr = code.codeValue.replace('SINGLE_', '');
                price = parseInt(priceStr, 10);
                // NaN 체크
                if (isNaN(price)) {
                    console.warn(`단회기 가격 파싱 실패: ${code.codeValue} -> ${priceStr}`);
                    price = 30000; // 기본값
                }
                console.log(`단회기 옵션 처리: ${code.codeValue} -> ${sessions}회기, ${price}원`);
            }
            
            // korean_name이 있으면 그것을 사용, 없으면 code_label 사용
            const label = code.koreanName || code.codeLabel;
            
            const result = {
                value: code.codeValue,
                label: label,
                sessions: sessions,
                price: price
            };
            
            console.log(`패키지 옵션 생성:`, result);
            return result;
        });
    } catch (error) {
        console.error('패키지 옵션 조회 실패:', error);
        // 기본값 반환
        return [
            { value: 'BASIC', label: '기본 패키지 (20회기, 200,000원)', sessions: 20, price: 200000 },
            { value: 'STANDARD', label: '표준 패키지 (20회기, 400,000원)', sessions: 20, price: 400000 },
            { value: 'PREMIUM', label: '프리미엄 패키지 (20회기, 600,000원)', sessions: 20, price: 600000 },
            { value: 'VIP', label: 'VIP 패키지 (20회기, 1,000,000원)', sessions: 20, price: 1000000 },
            { value: 'SINGLE_30000', label: '단회기 (30,000원)', sessions: 1, price: 30000 }
        ];
    }
};

/**
 * 만족도 관련 데이터를 가져옵니다
 * @returns {Promise<Object>} 만족도 데이터
 */
export const getSatisfactionData = async () => {
    try {
        const codes = await getCommonCodes('SATISFACTION');
        const satisfactionData = {};
        
        codes.forEach(code => {
            try {
                const extraData = JSON.parse(code.extraData || '{}');
                if (code.codeValue === 'AVERAGE') {
                    satisfactionData.average = extraData.value || 4.2;
                } else if (code.codeValue === 'TOTAL_RESPONSES') {
                    satisfactionData.totalResponses = extraData.count || 150;
                } else if (code.codeValue.startsWith('SCORE_')) {
                    const score = extraData.score;
                    const count = extraData.count;
                    if (score && count !== undefined) {
                        satisfactionData[`score${score}`] = count;
                    }
                }
            } catch (e) {
                console.warn(`만족도 데이터 파싱 실패 (${code.codeValue}):`, e);
            }
        });
        
        return satisfactionData;
    } catch (error) {
        console.error('만족도 데이터 조회 실패:', error);
        // 기본값 반환
        return {
            average: 4.2,
            totalResponses: 150,
            score5: 45,
            score4: 60,
            score3: 30,
            score2: 10,
            score1: 5
        };
    }
};

/**
 * 캐시를 초기화합니다
 */
export const clearCodeCache = () => {
    codeCache.clear();
};

/**
 * 특정 그룹의 캐시를 제거합니다
 * @param {string} groupCode - 코드 그룹명
 */
export const clearGroupCache = (groupCode) => {
    codeCache.delete(groupCode);
};
