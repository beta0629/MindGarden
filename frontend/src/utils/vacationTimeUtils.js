/**
 * 휴가 시간 동적 관리 유틸리티
 * 업무 시간 설정에 따라 휴가 시간을 동적으로 계산합니다.
 * 정규직/프리랜서 구분에 따라 반반차 휴가 옵션을 제한합니다.
 */

import { apiGet } from './ajax';
import { TIME_SLOTS } from '../constants/vacation';

const VACATION_SETTINGS_CACHE_KEY = 'vacationTimeSettingsCache';
const CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5분 캐시

let cachedSettings = null;
let lastCacheTime = 0;

/**
 * 업무 시간 설정을 가져와서 휴가 시간을 계산합니다.
 */
const fetchBusinessTimeSettings = async () => {
    try {
        const response = await apiGet('/api/admin/business-time/settings');
        if (response && response.success) {
            return response.data;
        }
    } catch (error) {
        console.error('업무 시간 설정 API 호출 실패:', error);
    }
    return null;
};

/**
 * 동적으로 휴가 시간 설정을 가져옵니다.
 */
export const getVacationTimeSettings = async (forceRefresh = false) => {
    if (!forceRefresh && cachedSettings && (Date.now() - lastCacheTime < CACHE_EXPIRATION_MS)) {
        return cachedSettings;
    }

    const businessTimeSettings = await fetchBusinessTimeSettings();
    if (!businessTimeSettings) {
        console.warn('업무 시간 설정을 불러올 수 없어 기본값으로 휴가 시간을 설정합니다.');
        return TIME_SLOTS;
    }

    // 업무 시간 설정을 기반으로 휴가 시간 계산
    const businessStart = businessTimeSettings.businessStartTime || '10:00';
    const businessEnd = businessTimeSettings.businessEndTime || '20:00';
    const lunchStart = businessTimeSettings.lunchStartTime || '12:00';
    const lunchEnd = businessTimeSettings.lunchEndTime || '13:00';

    // 시간 계산 함수
    const addHours = (timeStr, hours) => {
        const [hour, minute] = timeStr.split(':').map(Number);
        const newHour = hour + hours;
        return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    const subtractHours = (timeStr, hours) => {
        const [hour, minute] = timeStr.split(':').map(Number);
        const newHour = hour - hours;
        return `${newHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    // 동적 휴가 시간 설정 (정규직 기준)
    const dynamicVacationSettings = {
        // 기본 휴가 (모든 직종)
        MORNING: {
            start: businessStart,
            end: lunchStart,
            label: `오전 휴가 (${businessStart}-${lunchStart})`
        },
        AFTERNOON: {
            start: lunchEnd,
            end: businessEnd,
            label: `오후 휴가 (${lunchEnd}-${businessEnd})`
        },
        ALL_DAY: {
            start: businessStart,
            end: businessEnd,
            label: `하루 종일 휴가 (${businessStart}-${businessEnd})`
        },
        CUSTOM_TIME: {
            start: businessStart,
            end: businessEnd,
            label: '사용자 정의 시간'
        },
        
        // 반반차 (정규직만, 2시간 단위)
        MORNING_HALF_1: {
            start: businessStart,
            end: addHours(businessStart, 2),
            label: `오전 반반차 1 (${businessStart}-${addHours(businessStart, 2)})`
        },
        MORNING_HALF_2: {
            start: addHours(businessStart, 2),
            end: lunchStart,
            label: `오전 반반차 2 (${addHours(businessStart, 2)}-${lunchStart})`
        },
        AFTERNOON_HALF_1: {
            start: lunchEnd,
            end: addHours(lunchEnd, 2),
            label: `오후 반반차 1 (${lunchEnd}-${addHours(lunchEnd, 2)})`
        },
        AFTERNOON_HALF_2: {
            start: addHours(lunchEnd, 2),
            end: businessEnd,
            label: `오후 반반차 2 (${addHours(lunchEnd, 2)}-${businessEnd})`
        }
    };

    cachedSettings = dynamicVacationSettings;
    lastCacheTime = Date.now();

    console.log('🕐 동적 휴가 시간 설정 로딩 완료:', dynamicVacationSettings);
    return dynamicVacationSettings;
};

/**
 * 특정 휴가 유형의 시간을 가져옵니다.
 */
export const getVacationTimeSlot = async (vacationType) => {
    const settings = await getVacationTimeSettings();
    return settings[vacationType] || TIME_SLOTS[vacationType];
};

/**
 * 모든 휴가 시간 슬롯을 가져옵니다.
 */
export const getAllVacationTimeSlots = async () => {
    return await getVacationTimeSettings();
};

/**
 * 상담사의 직종에 따라 사용 가능한 휴가 유형을 필터링합니다.
 */
export const getAvailableVacationTypes = async (consultantId = null, salaryType = null) => {
    const vacationSettings = await getVacationTimeSettings();
    
    // 기본 휴가 유형 (모든 직종 사용 가능)
    const basicVacationTypes = [
        'MORNING',
        'AFTERNOON', 
        'ALL_DAY',
        'CUSTOM_TIME'
    ];
    
    // 반반차 휴가 유형 (정규직만 사용 가능)
    const halfDayVacationTypes = [
        'MORNING_HALF_1',
        'MORNING_HALF_2',
        'AFTERNOON_HALF_1',
        'AFTERNOON_HALF_2'
    ];
    
    // 정규직인 경우 모든 휴가 유형 사용 가능
    if (salaryType === 'REGULAR' || salaryType === 'FULL_TIME') {
        return {
            ...vacationSettings,
            availableTypes: [...basicVacationTypes, ...halfDayVacationTypes]
        };
    }
    
    // 프리랜서나 기타 직종인 경우 기본 휴가만 사용 가능
    const filteredSettings = {};
    basicVacationTypes.forEach(type => {
        if (vacationSettings[type]) {
            filteredSettings[type] = vacationSettings[type];
        }
    });
    
    return {
        ...filteredSettings,
        availableTypes: basicVacationTypes
    };
};

/**
 * 휴가 시간 설정 캐시를 초기화합니다.
 */
export const clearVacationTimeCache = () => {
    cachedSettings = null;
    lastCacheTime = 0;
    console.log('🔄 휴가 시간 설정 캐시 초기화 완료');
};

/**
 * 특정 시간이 휴가 시간과 겹치는지 확인합니다.
 */
export const isVacationTime = async (time, vacationType) => {
    const timeSlot = await getVacationTimeSlot(vacationType);
    const checkTime = time.split(':');
    const startTime = timeSlot.start.split(':');
    const endTime = timeSlot.end.split(':');

    const checkMinutes = parseInt(checkTime[0]) * 60 + parseInt(checkTime[1]);
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);

    return checkMinutes >= startMinutes && checkMinutes < endMinutes;
};

/**
 * 휴가 유형별 표시 라벨을 가져옵니다.
 */
export const getVacationTypeLabel = async (vacationType) => {
    const timeSlot = await getVacationTimeSlot(vacationType);
    return timeSlot.label || vacationType;
};
