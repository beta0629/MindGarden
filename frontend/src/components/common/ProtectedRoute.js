/**
 * 보호된 라우트 컴포넌트
/**
 * 
/**
 * 권한 확인 후 접근 제어
/**
 * 
/**
 * @author MindGarden
/**
 * @version 2.0.0
/**
 * @since 2025-12-03
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    // 세션에서 사용자 정보 조회 (실제 구현 시에는 useAuth 훅 사용)
    const role = sessionStorage.getItem('role') || localStorage.getItem('role');
    const isAuthenticated = !!sessionStorage.getItem('userId') || !!localStorage.getItem('userId');

    // 미인증 사용자
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 역할이 필요한 경우 권한 확인
    if (requiredRole && role !== requiredRole) {
        // 권한 없음 - 대시보드로 리다이렉트
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;

