import { apiGet, apiPost } from './ajax';

/**
 * 업무 시간 및 정책 관리 유틸리티
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-01-27
 */

// 캐시된 업무 시간 설정
let businessTimeCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 업무 시간 설정을 조회합니다
/**
 * @param {boolean} useCache - 캐시 사용 여부 (기본값: true)
/**
 * @returns {Promise<Object>} 업무 시간 설정 객체
 */
export const getBusinessTimeSettings = async(useCache = true) => {
    const now = Date.now();
    
    // 캐시 사용 및 유효성 검사
    if (useCache && businessTimeCache && (now - lastCacheTime) < CACHE_DURATION) {
        console.log('📋 캐시에서 업무 시간 설정 조회');
        return businessTimeCache;
    }
    
    try {
        console.log('🕐 서버에서 업무 시간 설정 조회');
        const response = await apiGet('/api/admin/business-time/settings');
        
        if (response && response.success && response.data) {
            businessTimeCache = response.data;
            lastCacheTime = now;
            console.log('✅ 업무 시간 설정 로드 완료:', businessTimeCache);
            return businessTimeCache;
        } else {
            throw new Error('업무 시간 설정 응답이 올바르지 않습니다.');
        }
    } catch (error) {
        console.error('❌ 업무 시간 설정 조회 실패:', error);
        
        // 기본값 반환
        const defaultSettings = {
            businessStartTime: '10:00',
            businessEndTime: '20:00',
            lunchStartTime: '12:00',
            lunchEndTime: '13:00',
            slotIntervalMinutes: 30,
            minNoticeHours: 24,
            maxAdvanceBookingDays: 30,
            breakTimeMinutes: 10
        };
        
        console.log('🔄 기본 업무 시간 설정 사용:', defaultSettings);
        return defaultSettings;
    }
};

/**
 * 업무 시간 설정을 업데이트합니다
/**
 * @param {Object} settings - 업데이트할 설정 객체
/**
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export const updateBusinessTimeSettings = async(settings) => {
    try {
        console.log('🕐 업무 시간 설정 업데이트 요청:', settings);
        
        const response = await apiPost('/api/admin/business-time/settings', settings);
        
        if (response && response.success) {
            // 캐시 초기화
            businessTimeCache = null;
            lastCacheTime = 0;
            
            console.log('✅ 업무 시간 설정 업데이트 성공');
            return true;
        } else {
            throw new Error(response?.message || '업무 시간 설정 업데이트에 실패했습니다.');
        }
    } catch (error) {
        console.error('❌ 업무 시간 설정 업데이트 실패:', error);
        throw error;
    }
};

/**
 * 특정 시간이 업무 시간인지 확인합니다
/**
 * @param {string} time - 확인할 시간 (HH:mm 형식)
/**
 * @returns {Promise<Object>} 시간 확인 결과
 */
export const checkBusinessTime = async(time) => {
    try {
        const response = await apiGet(`/api/admin/business-time/check-time?time=${time}`);
        
        if (response && response.success) {
            return response.data;
        } else {
            throw new Error(response?.message || '업무 시간 확인에 실패했습니다.');
        }
    } catch (error) {
        console.error('❌ 업무 시간 확인 실패:', error);
        throw error;
    }
};

/**
 * 시간 슬롯을 생성합니다
/**
 * @param {Object} settings - 업무 시간 설정 (선택사항)
/**
 * @returns {Array} 시간 슬롯 배열
 */
export const generateTimeSlots = async(settings = null) => {
    try {
        const timeSettings = settings || await getBusinessTimeSettings();
        
        const slots = [];
        const startTime = parseTime(timeSettings.businessStartTime);
        const endTime = parseTime(timeSettings.businessEndTime);
        const interval = timeSettings.slotIntervalMinutes || 30;
        
        let currentTime = startTime;
        
        while (currentTime.isBefore(endTime)) {
            const timeString = formatTime(currentTime);
            
            slots.push({
                value: timeString,
                label: timeString,
                time: timeString,
                isBusinessTime: true,
                isLunchTime: isLunchTime(currentTime, timeSettings)
            });
            
            currentTime = currentTime.plusMinutes(interval);
        }
        
        console.log(`✅ 시간 슬롯 생성 완료: ${slots.length}개 (${timeSettings.businessStartTime}-${timeSettings.businessEndTime})`);
        return slots;
    } catch (error) {
        console.error('❌ 시간 슬롯 생성 실패:', error);
        return [];
    }
};

/**
 * 특정 시간이 점심시간인지 확인합니다
/**
 * @param {Object} time - 확인할 시간 객체
/**
 * @param {Object} settings - 업무 시간 설정
/**
 * @returns {boolean} 점심시간 여부
 */
export const isLunchTime = (time, settings) => {
    const lunchStart = parseTime(settings.lunchStartTime);
    const lunchEnd = parseTime(settings.lunchEndTime);
    
    return !time.isBefore(lunchStart) && time.isBefore(lunchEnd);
};

/**
 * 시간 문자열을 파싱합니다
/**
 * @param {string} timeStr - 시간 문자열 (HH:mm)
/**
 * @returns {Object} 시간 객체
 */
export const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return {
        hour: hours,
        minute: minutes,
        isBefore: (other) => {
            if (hours < other.hour) return true;
            if (hours > other.hour) return false;
            return minutes < other.minute;
        },
        isAfter: (other) => {
            if (hours > other.hour) return true;
            if (hours < other.hour) return false;
            return minutes > other.minute;
        },
        plusMinutes: (minutesToAdd) => {
            const totalMinutes = hours * 60 + minutes + minutesToAdd;
            const newHours = Math.floor(totalMinutes / 60);
            const newMinutes = totalMinutes % 60;
            return parseTime(`${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`);
        }
    };
};

/**
 * 시간 객체를 문자열로 포맷합니다
/**
 * @param {Object} time - 시간 객체
/**
 * @returns {string} 시간 문자열 (HH:mm)
 */
export const formatTime = (time) => {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
};

/**
 * 캐시를 초기화합니다
 */
export const clearBusinessTimeCache = () => {
    businessTimeCache = null;
    lastCacheTime = 0;
    console.log('🔄 업무 시간 설정 캐시 초기화');
};

/**
 * 업무 시간 설정의 기본값을 반환합니다
/**
 * @returns {Object} 기본 업무 시간 설정
 */
export const getDefaultBusinessTimeSettings = () => {
    return {
        businessStartTime: '10:00',
        businessEndTime: '20:00',
        lunchStartTime: '12:00',
        lunchEndTime: '13:00',
        slotIntervalMinutes: 30,
        minNoticeHours: 24,
        maxAdvanceBookingDays: 30,
        breakTimeMinutes: 10
    };
};
