import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';

/**
 * [ProtectedRoute - 04.28 지침 대응형]
 * @param {children} - 보호할 페이지
 * @param {requiredRole} - 요구되는 회원 등급 (ROLE_USER, ROLE_ADMIN 등)
 */
const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    // 💡 1. [대기 시간 확보] 토큰 재발급 및 세션 복구 중 UI 점유
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>보안 세션을 확인 중입니다...</p>
            </div>
        );
    }

    // 💡 2. [비인증 차단] 로그인하지 않은 접근자 처리
    if (!isAuthenticated) {
        // state를 통해 원래 가려던 주소를 기억함 (Redirect Back)
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 💡 3. [권한(RBAC) 통제] 04.28 AI 분석 및 관리자 기능 보호
    // 유저 정보가 없거나, 요구되는 권한과 일치하지 않을 때 실행
    if (requiredRole && user?.role !== requiredRole) {
        if (typeof window !== 'undefined') {
            alert("해당 기능을 이용할 권한이 없습니다.");
        }
        return <Navigate to="/main" replace />;
    }

    // 💡 4. 모든 보안 검문 통과 시 컴포넌트 렌더링
    return children;
};

export default ProtectedRoute;