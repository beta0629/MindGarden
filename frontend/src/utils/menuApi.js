/**
 * 메뉴 API 유틸리티
/**
 * 
/**
 * 표준화 준수:
/**
 * - API 버전 관리 (/api/v1/*)
/**
 * - 표준 에러 처리
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import axios from 'axios';
import { getApiBaseUrl } from '../constants/api';

const getMenuApi = () => `${getApiBaseUrl()}/api/v1/menus`;

/**
 * 사용자 메뉴 조회 (역할별)
 */
export const getUserMenus = async() => {
    try {
        const response = await axios.get(`${getMenuApi()}/user`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('사용자 메뉴 조회 실패:', error);
        throw error;
    }
};

/**
 * 관리자 전용 메뉴 조회
 */
export const getAdminMenus = async() => {
    try {
        const response = await axios.get(`${getMenuApi()}/admin`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('관리자 메뉴 조회 실패:', error);
        throw error;
    }
};

/**
 * 전체 메뉴 조회
 */
export const getAllMenus = async() => {
    try {
        const response = await axios.get(`${getMenuApi()}/all`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('전체 메뉴 조회 실패:', error);
        throw error;
    }
};

/**
 * 메뉴 코드로 조회
 */
export const getMenuByCode = async(menuCode) => {
    try {
        const response = await axios.get(`${getMenuApi()}/code/${menuCode}`, {
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('메뉴 조회 실패:', error);
        throw error;
    }
};

// P0 hotfix 2026-06-12: 동시 LNB fetch dedup — 마이페이지/대시보드 등 여러 화면이 거의 동시에 호출해도 실제 요청은 1회.
let inflightLnbPromise = null;

/**
 * LNB 메뉴 트리 조회 (역할·권한 필터, 메인/서브)
 * 백엔드 미기동(ERR_NETWORK) 시 콘솔 에러 대신 경고만 출력, 호출부에서 폴백 메뉴 사용.
 * 동시 호출 시 in-flight promise 를 공유해 중복 네트워크 요청을 막는다.
 *
 * @returns {Promise<{ data?: Array }>} ApiResponse 형태. data가 메뉴 트리(children 포함)
 */
export const getLnbMenus = async() => {
    if (inflightLnbPromise) {
        return inflightLnbPromise;
    }
    inflightLnbPromise = (async() => {
        try {
            const response = await axios.get(`${getMenuApi()}/lnb`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            const isNetworkError = error?.code === 'ERR_NETWORK' || (error?.message && String(error.message).includes('Network Error'));
            if (isNetworkError) {
                console.warn('LNB: 백엔드 연결 불가, 기본 메뉴를 사용합니다.');
            } else {
                console.error('LNB 메뉴 조회 실패:', error);
            }
            throw error;
        }
    })().finally(() => {
        inflightLnbPromise = null;
    });
    return inflightLnbPromise;
};

/**
 * 메뉴 경로로 조회
 */
export const getMenuByPath = async(menuPath) => {
    try {
        const response = await axios.get(`${getMenuApi()}/path`, {
            params: { path: menuPath },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        console.error('메뉴 조회 실패:', error);
        throw error;
    }
};

