/**
 * [Main Navigation Bar]
 * 담당: 시스템 메뉴 탐색 및 사용자 인증 상태 표시
 * 업데이트: 2026. 04. 30 (백엔드 통합 지침 반영 완료)
 * 특징: 드롭다운 서브메뉴 시스템, 인증 기반 UI 분기
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext'; // 사용자 인증 컨텍스트
import ConfirmModal from 'components/common/ConfirmModal'; // 공통 확인 모달

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeMenu, setActiveMenu] = useState(null);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    /**
     * 💡 04.30 업데이트 반영 데이터셋
     * 백엔드 API 통합 및 페이지 분리에 따른 경로 설정
     */
    const navConfig = [
        {
            title: "상가검색",
            path: "/search/commercial",
            subMenus: [
                { name: "임대료 조회", path: "/search/commercial" },
                { name: "유동인구 분석", path: "/search/commercial" },
                { name: "지역별 업황", path: "/search/commercial" }
            ]
        },
        {
            title: "주거검색",
            path: "/price/calc",
            subMenus: [
                { name: "주거용 정밀분석", path: "/price/calc" },
                { name: "다중 매물 비교", path: "/price/compare" }, // [NEW] 다중 매물 시세 비교 보드
                { name: "공식 공시지가 조회", path: "/price/land" }, // [NEW] 공시지가 및 PNU 딥서치
                { name: "전세가율 및 위험도분석", path: "/price/risk" }
            ]
        },
        {
            title: "AI 분석",
            path: "/ai/residential",
            subMenus: [
                { name: "상권 임대료 예측", path: "/ai/commercial" },
                { name: "주택 거래가 예측", path: "/ai/residential" },
                { name: "AI 적정 입찰가 제안", path: "/price/suggest" } // [NEW] AI 적정 입찰가 제안 페이지
            ]
        },
        {
            title: "고객서비스",
            path: "/service",
            subMenus: [
                { name: "AI 챗봇 상담", path: "/service" },
                { name: "매물 비교 보드", path: "/price/compare" }, // 기존 매물 비교 보드를 진짜 페이지로 연결
                { name: "실거래가 다운로드 센터", path: "/price/download" } // [NEW] 실거래가 원천 데이터 다운로드
            ]
        },
        {
            title: "마이페이지",
            path: "/mypage",
            subMenus: [
                // { name: "최근 본 매물", path: "/RecentViewPage" },
                // { name: "관심 매물 관리", path: "/FavoritePage" },
                // ANALYSIS 테이블에 저장된 과거 예측 결과 조회[cite: 11]
                // { name: "AI 분석 이력", path: "/AIHistoryPagee" }
            ]
        }
    ];

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const handleConfirmLogout = () => {
        setIsLogoutModalOpen(false);
        logout(); // sessionStorage 삭제 및 리다이렉트 처리
    };

    return (
        <>
            <nav className="fixed top-0 w-full h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-[100] px-10 flex items-center justify-between">
                {/* 브랜드 로고 */}
                <div className="flex items-center gap-12 h-full">
                    <Link to="/main" className="text-2xl font-black tracking-tighter text-[#002855] flex items-center gap-2">
                        <span className="bg-[#002855] text-white p-1.5 rounded-xl text-xl shadow-lg shadow-blue-900/20">🏛️</span>
                        집현전 <span className="text-blue-500 font-light italic text-sm tracking-widest">ZIP</span>
                    </Link>

                    {/* 메인 메뉴 (로그인 시 노출) */}
                    {isAuthenticated && (
                        <div className="hidden lg:flex items-center h-full gap-2">
                            {navConfig.map((menu, idx) => (
                                <div 
                                    key={idx}
                                    className="relative h-full flex items-center"
                                    onMouseEnter={() => setActiveMenu(idx)}
                                    onMouseLeave={() => setActiveMenu(null)}
                                >
                                    <button 
                                        onClick={() => navigate(menu.path)}
                                        className={`px-5 py-2 rounded-xl text-[14px] font-black transition-all duration-300 ${
                                            activeMenu === idx ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {menu.title}
                                    </button>

                                    {/* 드롭다운 서브메뉴 */}
                                    <div className={`absolute top-[75px] left-0 w-52 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden transition-all duration-200 origin-top-left ${
                                        activeMenu === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                                    }`}>
                                        <div className="p-2 space-y-1 bg-gradient-to-b from-white to-slate-50">
                                            {menu.subMenus.map((sub, sIdx) => (
                                                <button
                                                    key={sIdx}
                                                    onClick={() => navigate(sub.path)}
                                                    className="w-full text-left px-4 py-3 text-xs font-bold text-slate-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200 flex justify-between items-center group/item"
                                                >
                                                    {sub.name}
                                                    <span className="opacity-0 group-hover/item:opacity-100 transition-opacity">→</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 우측 사용자 프로필/로그아웃 영역 */}
                <div className="flex items-center gap-5">
                    {isAuthenticated ? (
                        <>
                            <div 
                                className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full cursor-pointer hover:bg-blue-50 transition-all group"
                                onClick={() => navigate('/mypage')}
                            >
                                <div className="w-8 h-8 bg-white rounded-full border border-slate-200 flex items-center justify-center text-[11px] font-black text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                    {user?.userName?.charAt(0) || 'U'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter leading-none mb-1">Authenticated</span>
                                    <span className="text-xs font-black text-slate-700 leading-none">{user?.userName || '사용자'} 님</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleLogoutClick}
                                className="text-[11px] font-black text-rose-500 px-4 py-2 hover:bg-rose-50 rounded-xl transition-all"
                            >LOGOUT</button>
                        </>
                    ) : (
                        <Link to="/" className="px-8 py-3 bg-[#002855] text-white text-xs font-black rounded-2xl hover:bg-blue-600 shadow-xl transition-all">
                            시스템 접속
                        </Link>
                    )}
                </div>
            </nav>

            {/* 로그아웃 확인 모달 */}
            <ConfirmModal 
                isOpen={isLogoutModalOpen}
                title="로그아웃 확인"
                message={"로그아웃 하시겠습니까?\n주의: 진행 중인 내용이 사라질 수 있습니다."}
                confirmText="로그아웃"
                cancelText="머무르기"
                type="danger"
                onConfirm={handleConfirmLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
            />
        </>
    );
};

export default Navbar;