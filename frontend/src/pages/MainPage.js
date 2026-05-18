import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'context/AuthContext';

/**
 * [MainPage Component]
 * 작성일: 2026. 04. 29
 * 역할: 로그인 후 진입하는 서비스 허브(Hub). 모든 하위 도메인으로의 분기점 역할.
 * 수리사항: 중복 GNB 제거, 레이아웃 안정화, 플로우차트 도메인 동기화
 */
const MainPage = () => {
    // 💡 내비게이션 엔진 및 유저 상태 호출
    const navigate = useNavigate();
    const { user } = useAuth();

    /**
     * [serviceConfig]
     * 💡 플로우차트와 요구명세서를 반영한 서비스 카드 데이터
     * 각 항목은 클릭 시 해당 도메인 경로로 안전하게 이동하도록 설계됨
     */
    const services = [
        {
            id: 'commercial',
            title: '상가검색',
            desc: '지역별 임대료 조회, 유동인구 분석 및 업황 리포트',
            icon: '🏢',
            path: '/search/commercial/population',
            color: 'border-blue-100 bg-blue-50/30'
        },
        {
            id: 'residential',
            title: '주거검색',
            desc: '실거래가 조회, 전세가율 계산 및 깡통전세 위험분석',
            icon: '🏠',
            path: '/price/calc',
            color: 'border-emerald-100 bg-emerald-50/30'
        },
        {
            id: 'ai',
            title: 'AI 분석',
            desc: '상가 임대료 및 주택 실거래가 예측',
            icon: '🤖',
            path: '/ai/commercial',
            color: 'border-purple-100 bg-purple-50/30'
        },
        {
            id: 'cs',
            title: '고객서비스',
            desc: 'AI 챗봇 서비스 및 실거래가 다운로드',
            icon: '🎧',
            path: '/service',
            color: 'border-amber-100 bg-amber-50/30'
        }
    ];

    return (
        // 💡 화이트 아웃 방지를 위한 견고한 컨테이너 구조
        <div className="min-h-screen bg-[#F8FAFC]">

            {/* [Hero Section] 브랜드 가치 제고 및 통합 검색바 */}
            <header className="bg-white border-b border-slate-100 py-24 lg:py-32 relative overflow-hidden">
                {/* 배경 데코레이션: 전문적인 분위기 조성 */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 skew-x-12 translate-x-20 z-0"></div>

                <div className="max-w-7xl mx-auto px-10 relative z-10">
                    <div className="max-w-3xl animate-fadeInUp">
                        {/* 04.28 지침 키워드 반영 문구 */}
                        <h2 className="text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter text-slate-900 mb-8">
                            데이터로 증명하는 <br />
                            <span className="text-blue-600">부동산의 진정한 가치</span>
                        </h2>

                        {/* 💡 검색바: 현재는 주거검색(/search)으로 연결되도록 설정 */}
                        <div className="flex p-2 bg-white rounded-[32px] shadow-2xl border border-blue-50 max-w-2xl ring-8 ring-blue-500/5 focus-within:ring-blue-500/10 transition-all">
                            <input
                                type="text"
                                placeholder="분석할 단지명, 지역 또는 매물번호를 입력하세요"
                                className="flex-grow px-8 py-5 outline-none text-slate-700 font-bold placeholder:text-slate-300"
                            />
                            <button
                                onClick={() => navigate('/search')}
                                className="bg-[#002855] text-white px-10 py-5 rounded-[24px] font-black hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
                            >
                                분석 시작
                            </button>
                        </div>

                        {/* 사용자 인사말 */}
                        <p className="mt-8 text-slate-400 font-bold ml-4">
                            환영합니다, <span className="text-slate-800">{user?.userName || '사용자'}</span> 님. 무엇을 분석해 드릴까요?
                        </p>
                    </div>
                </div>
            </header>

            {/* [Service Grid] 플로우차트 도메인 분기점 */}
            <main className="max-w-7xl mx-auto px-10 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {services.map((service, index) => (
                        <div
                            key={service.id}
                            onClick={() => navigate(service.path)}
                            className={`group p-10 rounded-[56px] border ${service.color} shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 cursor-pointer flex flex-col justify-between h-[380px]`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* 상단: 아이콘 및 타이틀 */}
                            <div>
                                <div className="text-5xl mb-8 group-hover:scale-125 transition-transform duration-500 origin-left">
                                    {service.icon}
                                </div>
                                <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">{service.title}</h4>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{service.desc}</p>
                            </div>

                            {/* 하단: 액션 가이드 */}
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">상세 보기</span>
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* [Footer] */}
            <footer className="bg-slate-900 py-16 text-center">
                <div className="text-white font-black text-2xl italic tracking-tighter opacity-50">집현전 <span className="text-blue-500 not-italic text-sm ml-1">부동산 데이터 분석 서비스</span></div>
                <p className="text-slate-600 text-[10px] font-bold mt-4 tracking-[0.5em]">© 2026 집현전 ALL RIGHTS RESERVED.</p>
            </footer>
        </div>
    );
};

// 💡 런타임 에러 방지를 위한 필수 Export
export default MainPage;