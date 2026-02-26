/**
 * 세션 가드 컴포넌트
 * 
 * 모든 페이지 이동 시 자동으로 세션을 체크하고 갱신합니다.
 * 기존 SessionContext와 sessionManager를 활용합니다.
 * tenantId가 없으면 세션을 강제로 갱신하여 최신 정보를 확보합니다.
 * 
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-12-08
 */

import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';

/**
 * 세션 가드 컴포넌트
 * - 페이지 이동 시 자동으로 세션 체크 (SessionContext 활용)
 * - tenantId가 없으면 강제 갱신
 * - 공개 경로는 세션 체크 스킵
 */
const SessionGuard = ({ children }) => {
    const location = useLocation();
    const { user, checkSession } = useSession();
    const lastPathRef = useRef(null);
    const checkingRef = useRef(false);
    
    // 공개 경로 정의 (인증 없이 접근 가능)
    const publicPaths = [
        '/',
        '/landing',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/oauth2/callback',
        '/auth/oauth2/callback',
        '/design-system',
        '/design-system-v2',
        '/admin-dashboard-sample',
        '/filter-search',
        '/test/notifications',
        '/test/payment',
        '/test/integration',
        '/test/ios-cards',
        '/test/design-sample',
        '/test/premium-sample',
        '/test/advanced-sample',
        '/test/components'
    ];
    
    useEffect(() => {
        const currentPath = location.pathname;
        const isPublicPath = publicPaths.some(path => 
            currentPath === path || currentPath.startsWith(path)
        );
        
        // 공개 경로는 세션 체크 스킵
        if (isPublicPath) {
            console.log('🔓 [SessionGuard] 공개 경로 - 세션 체크 건너뛰기:', currentPath);
            return;
        }
        
        // 같은 경로로 재렌더링되는 경우 스킵 (중복 방지)
        if (lastPathRef.current === currentPath) {
            return;
        }
        
        lastPathRef.current = currentPath;
        
        // 이미 체크 중이면 스킵
        if (checkingRef.current) {
            return;
        }
        
        const checkSessionAndRefresh = async () => {
            try {
                checkingRef.current = true;
                console.log('🔍 [SessionGuard] 페이지 이동 감지 - 세션 체크 시작:', currentPath);
                
                // SessionContext의 checkSession 사용 (기존 공통 모듈 활용)
                // 페이지 이동 중에는 강제 체크하지 않음 (무한 루프 방지)
                const isLoggedIn = await checkSession(false);
                
                if (isLoggedIn && user) {
                    // tenantId 확인
                    const tenantId = user.tenantId;
                    const tenantIdTrimmed = tenantId ? tenantId.trim() : '';
                    
                    // 기본값 체크: "tenant-unknown-"으로 시작하는 것은 실제 tenantId일 수 있음
                    const isInvalidDefault = !tenantId || 
                        tenantIdTrimmed === 'unknown' || tenantIdTrimmed === 'default' ||
                        tenantIdTrimmed.startsWith('unknown-') || tenantIdTrimmed.startsWith('default-') ||
                        tenantIdTrimmed === 'tenant-unknown' || tenantIdTrimmed === 'tenant-default';
                    
                    if (isInvalidDefault) {
                        console.warn('⚠️ [SessionGuard] tenantId 없음 - 강제 세션 갱신:', {
                            userId: user.id,
                            email: user.email,
                            role: user.role,
                            tenantId: tenantId || 'null'
                        });
                        
                        // tenantId가 없으면 강제 갱신 (단, 체크 중 플래그를 유지하여 무한 루프 방지)
                        await checkSession(true);
                        
                        // 갱신 후 다시 확인 (user는 SessionContext에서 자동 업데이트됨)
                        // 다음 렌더링 사이클에서 user가 업데이트될 것임
                        console.log('✅ [SessionGuard] 세션 강제 갱신 완료');
                    } else {
                        console.log('✅ [SessionGuard] 세션 확인 완료 - tenantId:', tenantId);
                    }
                } else {
                    console.log('🔍 [SessionGuard] 로그인되지 않은 상태');
                }
            } catch (error) {
                console.error('❌ [SessionGuard] 세션 체크 중 오류:', error);
            } finally {
                // 약간의 지연 후 체크 플래그 해제 (너무 빠른 페이지 이동 대응)
                setTimeout(() => {
                    checkingRef.current = false;
                }, 1000);
            }
        };
        
        // 페이지 이동 시 세션 체크 (약간의 지연을 두어 중복 호출 방지)
        const timeoutId = setTimeout(() => {
            checkSessionAndRefresh();
        }, 100);
        
        return () => {
            clearTimeout(timeoutId);
        };
    }, [location.pathname, checkSession]); // user 의존성 제거 (무한 루프 방지)
    
    return <>{children}</>;
};

export default SessionGuard;

