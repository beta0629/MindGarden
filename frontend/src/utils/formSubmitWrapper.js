/**
 * 폼 제출 래퍼 유틸리티
 * 폼 제출 시 자동으로 세션 체크를 일시 중지하여 데이터 수정 중 되돌아가는 문제를 방지
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

import { sessionManager } from './sessionManager';

/**
 * 폼 제출 함수를 래핑하여 자동으로 세션 체크를 일시 중지
 * @param {Function} submitFunction - 실제 폼 제출 함수
 * @returns {Function} - 래핑된 함수
 */
export const withFormSubmit = (submitFunction) => {
    return async (...args) => {
        // 폼 제출 시작 - 세션 체크 일시 중지
        sessionManager.startFormSubmit();
        
        try {
            // 실제 폼 제출 함수 실행
            const result = await submitFunction(...args);
            return result;
        } catch (error) {
            // 에러가 발생해도 폼 제출 종료 처리
            throw error;
        } finally {
            // 폼 제출 종료 - 세션 체크 재개
            sessionManager.endFormSubmit();
        }
    };
};

/**
 * 폼 제출 함수를 래핑하는 고차 함수 (HOC)
 * @param {Function} WrappedComponent - 래핑할 컴포넌트
 * @returns {Function} - 래핑된 컴포넌트
 */
export const withFormSubmitHOC = (WrappedComponent) => {
    return (props) => {
        // 컴포넌트의 모든 메서드를 래핑
        const wrappedProps = { ...props };
        
        // props에서 함수들을 찾아서 래핑
        Object.keys(wrappedProps).forEach(key => {
            if (typeof wrappedProps[key] === 'function' && 
                (key.includes('Submit') || key.includes('Update') || key.includes('Create') || key.includes('Delete'))) {
                wrappedProps[key] = withFormSubmit(wrappedProps[key]);
            }
        });
        
        return <WrappedComponent {...wrappedProps} />;
    };
};

/**
 * 수동으로 폼 제출 시작/종료를 관리하는 훅
 * @returns {Object} - 폼 제출 관리 함수들
 */
export const useFormSubmit = () => {
    const startSubmit = () => {
        sessionManager.startFormSubmit();
    };
    
    const endSubmit = () => {
        sessionManager.endFormSubmit();
    };
    
    const withSubmit = (fn) => {
        return withFormSubmit(fn);
    };
    
    return {
        startSubmit,
        endSubmit,
        withSubmit
    };
};

export default {
    withFormSubmit,
    withFormSubmitHOC,
    useFormSubmit
};
