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

        const response = await apiGet(`/api/admin/common-codes/values?groupCode=${groupCode}`);
        
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
        const codes = await getCommonCodes('PACKAGE_TYPE');
        
        return codes.map(code => {
            let sessions = 10;
            let price = 500000;
            
            try {
                const extraData = JSON.parse(code.extraData || '{}');
                sessions = extraData.sessions || 10;
                price = extraData.price || 500000;
            } catch (e) {
                // extraData가 없거나 파싱 실패 시 기본값 사용
                console.warn(`패키지 데이터 파싱 실패 (${code.codeValue}):`, e);
            }
            
            return {
                value: code.codeValue,
                label: code.codeLabel,
                sessions: sessions,
                price: price
            };
        });
    } catch (error) {
        console.error('패키지 옵션 조회 실패:', error);
        // 기본값 반환
        return [
            { value: 'basic_10', label: '기본 10회기', sessions: 10, price: 500000 },
            { value: 'basic_20', label: '기본 20회기', sessions: 20, price: 900000 },
            { value: 'premium_10', label: '프리미엄 10회기', sessions: 10, price: 700000 }
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
