/**
 * [MyPage Component - Scroll Fixed v20.0]
 * 업데이트: 2026. 05. 08
 * * 주요 수정 사항:
 * 1. flex-shrink-0 (shrink-0) 적용: 아이템이 줄어들지 않고 컨테이너 밖으로 넘치게 하여 가로 스크롤 활성화.
 * 2. 레이아웃 고정: 각 섹션의 카드들이 설정된 min-width를 강제 유지하도록 설정.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

const MyPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [recentViews, setRecentViews] = useState([]); 
    const [favorites, setFavorites] = useState([]);     
    const [aiHistory, setAiHistory] = useState([]);     
    const [isLoading, setIsLoading] = useState(true);

    const fetchMyData = async () => {
        setIsLoading(true);
        try {
            const [recentRes, favoriteRes, aiRes] = await Promise.all([
                apiClient.get('/api/v1/interaction/records/me'), 
                apiClient.get('/api/v1/interaction/likes/me'),
                apiClient.get('/api/v1/ai/predict/me')
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
            console.error("[MyPage] 데이터 로드 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchMyData(); }, []);

    const handleRemoveFavorite = async (e, houseId) => {
        e.stopPropagation();
        try {
            await apiClient.post('/api/v1/interaction/likes', { houseId });
            setFavorites(prev => prev.filter(f => (f.houseId || f.HOUSE_ID) !== houseId));
        } catch (error) { alert("찜 해제 실패"); }
    };

    const handleItemClick = (item) => {
        const hId = item.houseId || item.HOUSE_ID || item.representativeHouseId;
        if (!hId) return;
        navigate('/ai/residential', { state: { autoFillData: item.house || item } });
    };

    const formatTargetMonth = (month) => {
        const map = { 'h1m': '1개월 후', 'h3m': '3개월 후', 'h6m': '6개월 후' };
        return map[month] || month;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 font-sans overflow-x-hidden">
            
            {/* [Header] 상단 대시보드 - 기존과 동일 */}
            <header className="max-w-7xl mx-auto mb-12">
                <div className="bg-white p-10 rounded-[56px] shadow-2xl shadow-blue-900/5 border border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-10">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[38px] flex items-center justify-center text-4xl text-white font-black shadow-xl">
                            {(user?.userName || 'U').charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest italic">Member</span>
                                <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">Gold</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">{user?.userName || '사용자'} 님</h2>
                            <div className="flex items-center gap-4 mt-3 text-[11px] font-bold text-slate-400">
                                <span>🏠 {user?.familyType || '정보없음'}</span>
                                <span>💰 {user?.incomeLevel || '일반소득'}</span>
                                <span>📊 CS: {user?.creditScore || 0}</span>
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

            <main className="max-w-7xl mx-auto space-y-10">
                
                {/* 1. Recently Viewed - Horizontal Swipe */}
                <section className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100">
                    <header className="flex justify-between items-center mb-10">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-4 italic">
                            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>Recently Viewed
                        </h3>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Shift + Mouse Wheel to Scroll →</span>
                    </header>

                    {recentViews.length > 0 ? (
                        /* flex-nowrap과 overflow-x-auto를 통해 가로 스크롤 박스 생성 */
                        <div className="flex flex-nowrap gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide">
                            {recentViews.map((item, idx) => {
                                const base = item.house || item;
                                return (
                                    /* 💡 shrink-0 추가: 너비 보장 */
                                    <div key={idx} onClick={() => handleItemClick(item)} className="min-w-[320px] shrink-0 snap-start p-8 bg-slate-50 rounded-[45px] hover:bg-white border border-transparent hover:border-blue-200 transition-all cursor-pointer group shadow-sm hover:shadow-2xl">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="text-[9px] font-black text-slate-300 uppercase">Rec. {recentViews.length - idx}</span>
                                            <span className="text-[9px] text-slate-300 font-bold uppercase">{item.viewedTime ? new Date(item.viewedTime).toLocaleDateString() : 'Today'}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors truncate italic">{base.NAME || base.complexName || `매물 #${base.houseId}`}</h4>
                                        <p className="text-[11px] text-slate-400 font-bold mt-2 truncate uppercase tracking-tighter">{base.roadAddress || "Address Loading..."}</p>
                                        <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-end">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Trade Value</span>
                                            <span className="text-xl font-black text-slate-700">{(base.TRADE || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">만원</span></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-slate-50 rounded-[45px] border-4 border-dashed border-white italic text-slate-300 font-bold text-sm uppercase">Empty history</div>
                    )}
                </section>

                {/* 2. My Favorites - Horizontal Swipe */}
                <section className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-4 italic mb-10">
                        <span className="w-2 h-8 bg-rose-500 rounded-full"></span>My Favorites
                    </h3>

                    {favorites.length > 0 ? (
                        <div className="flex flex-nowrap gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide">
                            {favorites.map((fav, idx) => {
                                const hId = fav.houseId || fav.HOUSE_ID;
                                return (
                                    /* 💡 shrink-0 추가: 너비 보장 */
                                    <div key={idx} onClick={() => handleItemClick(fav)} className="min-w-[280px] shrink-0 snap-start p-8 bg-slate-50 hover:bg-white border border-transparent hover:border-rose-100 rounded-[45px] transition-all cursor-pointer group shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm font-black mb-6 group-hover:scale-110 transition-transform">❤</div>
                                            <h4 className="font-black text-slate-800 text-xl leading-tight mb-2 truncate italic">{fav.NAME || fav.name || `매물 #${hId}`}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{fav.PROPERTY_TYPE || "Residential"}</p>
                                        </div>
                                        <button onClick={(e) => handleRemoveFavorite(e, hId)} className="mt-8 text-slate-300 hover:text-rose-500 font-black text-[9px] uppercase px-8 py-3 rounded-2xl transition-all hover:bg-rose-50 border border-slate-200">Remove Item</button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-slate-50 rounded-[45px] border-4 border-dashed border-white italic text-slate-300 font-bold text-sm uppercase">No Favorites</div>
                    )}
                </section>

                {/* 3. AI Analysis History - NEW Horizontal Swipe UI */}
                <section className="bg-[#0F172A] p-12 rounded-[56px] shadow-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <header className="flex justify-between items-center mb-10 relative z-10">
                        <h3 className="text-2xl font-black text-white tracking-tighter flex items-center gap-4 italic">
                            <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></span>AI History
                        </h3>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Swipe Right →</span>
                    </header>

                    {aiHistory.length > 0 ? (
                        <div className="flex flex-nowrap gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide relative z-10">
                            {aiHistory.map((report, idx) => (
                                /* 💡 shrink-0 추가: 너비 보장 */
                                <div key={idx} onClick={() => handleItemClick(report)} className="min-w-[360px] shrink-0 snap-start p-8 bg-white/5 border border-white/10 rounded-[45px] hover:bg-white/10 transition-all cursor-pointer group flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase">Report v{aiHistory.length - idx}</span>
                                            <span className="text-[9px] text-slate-500 font-bold uppercase">{report.analysisDate || '2026.05'}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors truncate italic">{report.sigungu || "Property Analysis"}</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{report.propertyType} • {formatTargetMonth(report.predictTargetMonth)}</p>
                                    </div>
                                    <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-end">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Predicted Price</span>
                                        <div className="text-right leading-none">
                                            <span className="text-2xl font-black text-blue-400">{(report.predictedPrice || 0).toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-slate-500 ml-1 uppercase">만원</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-white/5 rounded-[45px] border-4 border-dashed border-white/10 italic text-slate-600 font-bold text-sm uppercase relative z-10">No AI Reports</div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default MyPage;