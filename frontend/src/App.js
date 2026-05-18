/**
 * [Main Application Entry & Routing]
 * 담당: 전역 상태(Auth) 관리 및 페이지 라우팅 구성
 * 업데이트: 2026. 04. 30 (통합 API 경로 반영 완료)
 * 특징: 보안 라우팅(ProtectedRoute) 적용, 시스템 진입점 제어
 */
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; 
import { AuthProvider } from './context/AuthContext'; // 인증 전역 상태 관리
import Navbar from './context/layout/Navbar'; // 상단 네비게이션

// [페이지 컴포넌트 임포트]
import AuthPage from './pages/AuthPage'; // 로그인/회원가입
import MainPage from './pages/MainPage'; // 메인 대시보드
import CommercialRentPage from './pages/commercial/CommercialRentPage'; // 상가 임대료 조회
import PopulationAnalysisPage from './pages/commercial/PopulationAnalysisPage'; // 유동인구 분석
import IndustryAnalysisPage from './pages/commercial/IndustryAnalysisPage'; // 지역별 업황 분석
import CustomerServicePage from './pages/CustomerServicePage'; // AI 챗봇 및 고객센터
import MyPage from './pages/MyPage'; // 마이페이지 (AI 분석 이력 포함)

// [AI 분석 섹션]
import ResidentialPredictPage from './pages/ai/ResidentialPredictPage'; // 주택 가격 예측
import CommercialPredictPage from './pages/ai/CommercialPredictPage'; // 상가 임대료 예측

// [실거래가 및 위험 분석 섹션] - 04.30 지침 반영
import RealPriceCalculationPage from './pages/price/RealPriceCalculationPage'; // 실거래가 정밀분석
import JeonseRiskAnalysisPage from './pages/price/JeonseRiskAnalysisPage'; // 전세 위험도 분석

// [새로운 가격 및 정보 조회 기능 섹션]
import PropertyComparePage from './pages/price/PropertyComparePage'; // 다중 매물 비교 보드 (P-004)
import AIBiddingSuggestionPage from './pages/price/AIBiddingSuggestionPage'; // AI 적정 입찰가 제안 (P-008)
import OfficialLandPricePage from './pages/price/OfficialLandPricePage'; // 공식 공시지가 조회 (P-003)
import DataDownloadPage from './pages/price/DataDownloadPage'; // 데이터 다운로드 센터 (P-007)

// [보안 속성]
import ProtectedRoute from './components/ProtectedRoute'; // 로그인 여부 확인 컴포넌트

function App() {
    const location = useLocation();
    const isAuthPage = location.pathname === '/';

    return (
        <AuthProvider>
            <div className="app-container font-sans antialiased bg-[#F8FAFC] min-h-screen">
                {/* 전역 상단 바 */}
                {!isAuthPage && <Navbar />}
                
                {/* 메인 콘텐츠 영역: Navbar 높이(h-20)를 고려하여 pt-20 적용 */}
                <main className={isAuthPage ? "" : "pt-20"}>
                    <Routes>
                        {/* 1. 공개 경로: 인증 없이 접근 가능 */}
                        <Route path="/" element={<AuthPage />} />
                        
                        {/* 2. 보호된 경로: ProtectedRoute를 통한 세션 체크 */}
                        <Route path="/main" element={
                            <ProtectedRoute><MainPage /></ProtectedRoute>
                        } />
                        
                        {/* 현 주거 섹션: 04.30 업데이트에 따른 시세 분석 및 위험 진단 경로 */}
                        <Route path="/price/calc" element={
                            <ProtectedRoute><RealPriceCalculationPage /></ProtectedRoute>
                        } />
                        <Route path="/price/risk" element={
                            <ProtectedRoute><JeonseRiskAnalysisPage /></ProtectedRoute>
                        } />
                        
                        {/* [NEW] 추가된 시세 비교 및 정보 조회 라우트 */}
                        <Route path="/price/compare" element={
                            <ProtectedRoute><PropertyComparePage /></ProtectedRoute>
                        } />
                        <Route path="/price/suggest" element={
                            <ProtectedRoute><AIBiddingSuggestionPage /></ProtectedRoute>
                        } />
                        <Route path="/price/land" element={
                            <ProtectedRoute><OfficialLandPricePage /></ProtectedRoute>
                        } />
                        <Route path="/price/download" element={
                            <ProtectedRoute><DataDownloadPage /></ProtectedRoute>
                        } />
                        
                        {/* 🤖 AI 분석 섹션: 수동 입력 및 마스터 키 기반 분석[cite: 7, 10] */}
                        <Route path="/ai/residential" element={
                            <ProtectedRoute><ResidentialPredictPage /></ProtectedRoute>
                        } />
                        <Route path="/ai/commercial" element={
                            <ProtectedRoute><CommercialPredictPage /></ProtectedRoute>
                        } />
                        
                        {/* 🏢 상가 섹션: 유동인구 및 지역 업황 분석 포함 */}
                        <Route path="/search/commercial/rent" element={
                            <ProtectedRoute><CommercialRentPage /></ProtectedRoute>
                        } />
                        <Route path="/search/commercial/population" element={
                            <ProtectedRoute><PopulationAnalysisPage /></ProtectedRoute>
                        } />
                        <Route path="/search/commercial/industry" element={
                            <ProtectedRoute><IndustryAnalysisPage /></ProtectedRoute>
                        } />
                        
                        {/* 🛠 서비스 및 개인화 영역 */}
                        <Route path="/service" element={
                            <ProtectedRoute><CustomerServicePage /></ProtectedRoute>
                        } />
                        <Route path="/mypage" element={
                            <ProtectedRoute><MyPage /></ProtectedRoute>
                        } />

                        {/* 3. 예외 처리: 존재하지 않는 경로는 모두 루트로 리다이렉트 */}
                        <Route path="/search" element={<Navigate to="/price/calc" replace />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </AuthProvider>
    );
}

export default App;