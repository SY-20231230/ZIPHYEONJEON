/**
 * [MyPage Component - Swipe UI & Data Sync v18.0]
 * 업데이트: 2026. 05. 06
 * 
 * 1. 실명 복구: Source 3 규격에 따라 user.userName을 최우선 매핑하여 '홍길동'님 출력 보장
 * 2. 가로 스와이프: Recently Viewed 및 My Favorites 섹션에 Horizontal Scroll UI 적용
 * 3. 상세 프로필: DTO에서 확인된 familyType, incomeLevel, creditScore 정보 실시간 연동
 * 4. 경로 최적화: /likes/me, /records/me 등 백엔드 최신 규격 반영[cite: 1, 2]
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const MyPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // 💡 UserResponseDto (userName, creditScore 등 포함)[cite: 3]

    const [recentViews, setRecentViews] = useState([]); 
    const [favorites, setFavorites] = useState([]);     
    const [aiHistory, setAiHistory] = useState([]);     
    const [isLoading, setIsLoading] = useState(true);

    /**
     * 1. [데이터 통합 로드] 백엔드 실시간 API 규격 준수[cite: 1, 2]
     */
    const fetchMyData = async () => {
        setIsLoading(true);
        try {
            // 💡 병렬 요청으로 로딩 성능 최적화 및 404 에러 방지
            const [recentRes, favoriteRes, aiRes] = await Promise.all([
                apiClient.get('/api/v1/interaction/records/me'), 
                apiClient.get('/api/v1/interaction/likes/me'),   // 💡 likes/me 경로 사용[cite: 2]
                apiClient.get('/api/v1/ai/predict/me')           // 💡 Flow 4 분석 이력[cite: 1]
            ]);

            const extract = (res) => {
                const root = res.data;
                if (!root) return [];
                return root.data || root.content || (Array.isArray(root) ? root : []);
            };
            
            setRecentViews(extract(recentRes));
            setFavorites(extract(favoriteRes));
            setAiHistory(extract(aiRes));
        } catch (error) {
            console.error("[MyPage] 연동 데이터 로드 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMyData();
    }, []);

    /**
     * 2. [관심 매물 삭제] Flow 2 토글 로직 적용[cite: 1]
     */
    const handleRemoveFavorite = async (e, houseId) => {
        e.stopPropagation();
        try {
            await apiClient.post('/api/v1/interaction/likes', { houseId });
            setFavorites(prev => prev.filter(f => (f.houseId || f.HOUSE_ID) !== houseId));
        } catch (error) {
            alert("찜 해제 처리에 실패했습니다.");
        }
    };

    /**
     * 3. [이동] AI 예측 페이지 자동 완성 연동 (Flow 5)[cite: 1]
     */
    const handleItemClick = (item) => {
        const hId = item.houseId || item.HOUSE_ID || item.representativeHouseId;
        if (!hId) return;
        
        // AI 분석 페이지로 이동하며 데이터 전달
        navigate('/ai/residential', { 
            state: { autoFillData: item.house || item } 
        });
    };

    const formatTargetMonth = (month) => {
        const map = { 'h1m': '1개월 후', 'h3m': '3개월 후', 'h6m': '6개월 후' };
        return map[month] || month;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans overflow-x-hidden">
            
            {/* [Header] 프로필 대시보드 - 홍길동님 이름 및 DTO 상세 정보[cite: 3] */}
            <header className="max-w-7xl mx-auto mb-12">
                <div className="bg-white p-10 rounded-[56px] shadow-2xl shadow-blue-900/5 border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-10">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[38px] flex items-center justify-center text-4xl text-white font-black shadow-xl">
                            {(user?.userName || 'U').charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest italic">
                                    {user?.userType || 'Premium'} Member
                                </span>
                                <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">Gold</span>
                            </div>
                            {/* 💡 [해결] userName 필드를 정확히 매핑하여 '홍길동'님 출력[cite: 3] */}
                            <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">
                                {user?.userName || '사용자'} 님
                            </h2>
                            {/* 💡 [추가] DTO의 유저 상세 정보 실시간 바인딩[cite: 3] */}
                            <div className="flex items-center gap-4 mt-3 text-[11px] font-bold text-slate-400">
                                <span className="flex items-center gap-2">
                                    🏠 {user?.familyType || '정보없음'}
                                </span>
                                <span className="flex items-center gap-2">
                                    💰 {user?.incomeLevel || '일반소득'}
                                </span>
                                <span className="flex items-center gap-2">
                                    📊 CS: {user?.creditScore || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-50 p-6 rounded-[40px] border border-slate-100">
                        <div className="text-center px-10 border-r border-slate-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Saved Likes</p>
                            <p className="text-4xl font-black text-slate-900 leading-none">{favorites.length}</p>
                        </div>
                        <div className="text-center px-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">AI Reports</p>
                            <p className="text-4xl font-black text-blue-600 leading-none">{aiHistory.length}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10">
                
                {/* [Left Content] 가로 스와이프 UI 적용 영역 */}
                <section className="lg:col-span-8 space-y-10 overflow-hidden">
                    
                    {/* 💡 Recently Viewed - Horizontal Swipe[cite: 2] */}
                    <div className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100">
                        <header className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-4 italic">
                                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                                Recently Viewed
                            </h3>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Swipe Right →</span>
                        </header>

                        {recentViews.length > 0 ? (
                            <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {recentViews.map((item, idx) => {
                                    const base = item.house || item;
                                    return (
                                        <div key={idx} onClick={() => handleItemClick(item)} className="min-w-[320px] snap-start p-8 bg-slate-50 rounded-[45px] hover:bg-white border border-transparent hover:border-blue-200 transition-all cursor-pointer group shadow-sm hover:shadow-2xl">
                                            <div className="flex justify-between items-start mb-6">
                                                <span className="text-[9px] font-black text-slate-300 uppercase">Rec. {recentViews.length - idx}</span>
                                                <span className="text-[9px] text-slate-300 font-bold uppercase">{item.VIEWED_TIME ? new Date(item.VIEWED_TIME).toLocaleDateString() : 'Today'}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors truncate italic">
                                                {base.NAME || base.complexName || `매물 #${base.HOUSE_ID || base.houseId}`}
                                            </h4>
                                            <p className="text-[11px] text-slate-400 font-bold mt-2 truncate uppercase tracking-tighter">
                                                {base.ROADNAME || base.roadAddress || base.SIGUNGU || "Address Loading..."}
                                            </p>
                                            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-end">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Trade Value</span>
                                                <span className="text-xl font-black text-slate-700">{(base.TRADE || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">만원</span></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-24 text-center bg-slate-50 rounded-[45px] border-4 border-dashed border-white italic text-slate-300 font-bold text-sm uppercase">Empty viewing history</div>
                        )}
                    </div>

                    {/* 💡 My Favorites - Horizontal Swipe[cite: 2] */}
                    <div className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-4 italic mb-10">
                            <span className="w-2 h-8 bg-rose-500 rounded-full"></span>
                            My Favorites
                        </h3>

                        {favorites.length > 0 ? (
                            <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {favorites.map((fav, idx) => {
                                    const hId = fav.houseId || fav.HOUSE_ID;
                                    return (
                                        <div key={idx} onClick={() => handleItemClick(fav)} className="min-w-[280px] snap-start p-8 bg-slate-50 hover:bg-white border border-transparent hover:border-rose-100 rounded-[45px] transition-all cursor-pointer group shadow-sm flex flex-col justify-between">
                                            <div>
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm font-black mb-6 group-hover:scale-110 transition-transform">❤</div>
                                                <h4 className="font-black text-slate-800 text-xl leading-tight mb-2 truncate italic">{fav.NAME || fav.name || `매물 #${hId}`}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{fav.PROPERTY_TYPE || "Residential Complex"}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => handleRemoveFavorite(e, hId)} 
                                                className="mt-8 text-slate-300 hover:text-rose-500 font-black text-[9px] uppercase px-8 py-3 rounded-2xl transition-all hover:bg-rose-50 border border-slate-200"
                                            >
                                                Remove Item
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-24 text-center bg-slate-50 rounded-[45px] border-4 border-dashed border-white italic text-slate-300 font-bold text-sm uppercase">No Saved Items Found</div>
                        )}
                    </div>
                </section>

                {/* [Right Section] AI 분석 리포트 이력[cite: 1] */}
                <aside className="lg:col-span-4">
                    <div className="bg-[#0F172A] p-10 rounded-[56px] shadow-2xl text-white min-h-[750px] border border-white/5 relative overflow-hidden">
                        {/* 배경 데코레이션 */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <header className="relative z-10 mb-12">
                            <span className="text-blue-500 font-black text-[9px] uppercase tracking-[0.3em] italic">Intelligence History</span>
                            <h3 className="text-2xl font-black tracking-tighter mt-2 italic flex items-center gap-3">
                                AI Analysis
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                            </h3>
                        </header>

                        <div className="space-y-6 relative z-10">
                            {aiHistory.length > 0 ? (
                                aiHistory.map((report, idx) => (
                                    <div key={idx} onClick={() => handleItemClick(report)} className="p-8 bg-white/5 border border-white/10 rounded-[40px] hover:bg-white/10 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-6 text-[9px] font-black uppercase">
                                            <span className="px-3 py-1 bg-blue-600 text-white rounded-full tracking-tighter">Report v{aiHistory.length - idx}</span>
                                            <span className="text-slate-500">{report.analysisDate || '2026.05'}</span>
                                        </div>
                                        <div className="space-y-1 mb-8 text-white group-hover:text-blue-400 transition-colors">
                                            {/* 💡 sigungu, propertyType 매핑[cite: 1] */}
                                            <h4 className="font-black text-md truncate italic">{report.sigungu}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{report.propertyType} • {formatTargetMonth(report.predictTargetMonth)}</p>
                                        </div>
                                        <div className="flex items-end justify-between border-t border-white/5 pt-6">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">Predicted Price</span>
                                            <div className="text-right leading-none">
                                                <span className="text-2xl font-black text-blue-400">{(report.predictedPrice || 0).toLocaleString()}</span>[cite: 1]
                                                <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase">만원</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center opacity-20 py-20 border-2 border-dashed border-white/10 rounded-[40px]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-loose text-center">No AI Simulation <br/> Data Found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default MyPage;