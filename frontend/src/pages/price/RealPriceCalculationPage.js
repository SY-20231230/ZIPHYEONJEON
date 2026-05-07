/**
 * [Real Price Calculation Page - Professional Integrity Final]
 * 1. 데이터 정합성: latestTradePrice가 0일 경우 '최근 매매 없음'으로 방어 처리
 * 2. 의미 명확화: 그래프가 단지별이 아닌 '지역 평균'임을 텍스트로 명시 (백엔드 쿼리 특성 반영)
 * 3. 등급 시각화: riskLevel(SAFE/DANGER)에 따른 조건부 배지 디자인 적용
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient'; 
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const REGION_MAP = {
    "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
    "경기도": ["수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시", "화성시", "무안군"]
};

const RealPriceCalculationPage = () => {
    const navigate = useNavigate();

    // --- 1. [State] 상태 관리 ---
    const [searchParams, setSearchParams] = useState({
        sido: '서울특별시', gugun: '동작구', propertyType: '아파트', dealType: '매매',
        startYear: '2024', endYear: '2026', page: 0
    });
    const [keyword, setKeyword] = useState('');
    const [complexList, setComplexList] = useState([]); 
    const [selectedProfile, setSelectedProfile] = useState(null); 
    const [molitData, setMolitData] = useState({ content: [], trendGraph: [], totalPages: 0 }); 
    const [isCalculating, setIsCalculating] = useState(false);

    /**
     * 2. [Action] 단지 목록 조회 (P-009)
     */
    const handleSearch = async (mode, targetPage = 0) => {
        setIsCalculating(true);
        try {
            if (mode === 'ROAD') {
                const res = await apiClient.get('/api/price/search', { params: { address: keyword } });
                setComplexList(res.data || []);
            } else {
                const payload = {
                    sigungu: searchParams.gugun, // 백엔드 LIKE 쿼리 최적화
                    propertyType: searchParams.propertyType,
                    page: targetPage, size: 20
                };
                const res = await apiClient.post('/api/price/directory', payload);
                setComplexList(res.data.content || []);
                setMolitData(prev => ({ ...prev, totalPages: res.data.totalPages }));
                setSearchParams(prev => ({ ...prev, page: targetPage }));
            }
            setSelectedProfile(null);
        } catch (err) { alert("데이터 로드 실패"); }
        finally { setIsCalculating(false); }
    };

    /**
     * 3. [Action] 단지 상세 클릭 (P-010 & P-001)
     */
    const handleComplexClick = async (item) => {
        const masterId = item.representativeHouseId || item.houseId;
        setIsCalculating(true);
        try {
            const [profileRes, trendRes] = await Promise.all([
                apiClient.get(`/api/price/profile/${masterId}`),
                apiClient.get('/api/price/trend', {
                    params: {
                        sigungu: item.sigungu || searchParams.gugun,
                        dong: '', // 행정동을 지정하지 않으면 시군구 전체로 조회됨
                        startMonth: `${searchParams.startYear}01`,
                        endMonth: `${searchParams.endYear}12`
                    }
                })
            ]);

            setSelectedProfile(profileRes.data);
            setMolitData(prev => ({
                ...prev,
                // /api/price/trend API는 PriceTrendResponse { trends: [...] } 형식을 반환합니다.
                trendGraph: trendRes.data.trends || []
            }));
        } catch (err) { alert("상세 리포트 생성 실패"); }
        finally { setIsCalculating(false); }
    };

    // --- UI Helper ---
    const getRiskBadge = (level) => {
        const styles = {
            'SAFE': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'DANGER': 'bg-rose-50 text-rose-600 border-rose-100',
            'CAUTION': 'bg-amber-50 text-amber-600 border-amber-100'
        };
        return <span className={`px-4 py-1 rounded-full border font-black text-[10px] ${styles[level] || 'bg-slate-50'}`}>{level}</span>;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC] min-h-screen font-sans">
            {isCalculating && <div className="fixed inset-0 z-[999] bg-white/40 backdrop-blur-sm flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>}

            <header><h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">집현전 <span className="text-blue-600 text-sm font-light ml-1">PRICE ANALYSIS</span></h1></header>

            <main className="grid grid-cols-12 gap-5 bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <div className="col-span-4 space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Direct Address</label>
                    <input className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none" placeholder="도로명/단지명 입력" value={keyword} onChange={e => setKeyword(e.target.value)} />
                </div>
                <div className="col-span-6 grid grid-cols-3 gap-2 items-end">
                    <select className="bg-slate-50 p-4 rounded-2xl font-bold text-sm border-none" value={searchParams.gugun} onChange={e => setSearchParams({...searchParams, gugun: e.target.value})}>
                        {REGION_MAP[searchParams.sido].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select className="bg-slate-50 p-4 rounded-2xl font-bold text-sm border-none" value={searchParams.propertyType} onChange={e => setSearchParams({...searchParams, propertyType: e.target.value})}><option value="아파트">아파트</option><option value="연립다세대">빌라</option></select>
                    <button onClick={() => handleSearch('FILTER')} className="bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg">조회 실행</button>
                </div>
            </main>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* 좌측 리스트 */}
                <aside className="lg:col-span-4 bg-white rounded-[45px] shadow-sm border border-slate-200 h-[750px] flex flex-col overflow-hidden">
                    <div className="p-8 bg-slate-50 border-b font-black text-slate-800 text-xs">PROPERTY DIRECTORY</div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {complexList.map((item, idx) => (
                            <div key={idx} onClick={() => handleComplexClick(item)} className={`p-8 border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition-all ${selectedProfile?.houseId === (item.representativeHouseId || item.houseId) ? 'bg-blue-50/80 ring-1 ring-inset ring-blue-500' : ''}`}>
                                <h4 className="font-black text-slate-900 truncate">{item.complexName || item.roadAddress}</h4>
                                <p className="text-[11px] text-slate-400 font-bold mt-1 truncate">{item.roadAddress}</p>
                                <div className="mt-4 flex justify-between items-center"><span className="text-[10px] text-slate-400 font-black italic">{item.totalTransactions || 1}건 거래 기록</span><span className="text-blue-600 text-[10px] font-black">Analyze →</span></div>
                            </div>
                        ))}
                    </div>
                    {molitData.totalPages > 1 && (
                        <div className="p-4 bg-slate-50 border-t flex justify-between items-center px-8">
                            <button disabled={searchParams.page === 0} onClick={() => handleSearch('FILTER', searchParams.page - 1)} className="text-xs font-black disabled:opacity-20">PREV</button>
                            <span className="text-[10px] font-bold text-slate-400">{searchParams.page + 1} / {molitData.totalPages}</span>
                            <button disabled={searchParams.page + 1 >= molitData.totalPages} onClick={() => handleSearch('FILTER', searchParams.page + 1)} className="text-xs font-black disabled:opacity-20">NEXT</button>
                        </div>
                    )}
                </aside>

                {/* 우측 배틀보드 */}
                <main className="lg:col-span-8 space-y-8">
                    {selectedProfile ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <section className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100">
                                <header className="flex justify-between items-start mb-10 pb-8 border-b border-slate-50">
                                    <div>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">{selectedProfile.complexName}</h2>
                                        <p className="text-slate-400 font-bold text-xs mt-2 uppercase">{selectedProfile.roadAddress}</p>
                                    </div>
                                    {getRiskBadge(selectedProfile.riskLevel)}
                                </header>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-slate-50 p-8 rounded-[40px] text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Latest Trade</p>
                                        <p className="text-3xl font-black text-[#002855]">{selectedProfile.latestTradePrice > 0 ? selectedProfile.latestTradePrice.toLocaleString() : '최근 거래 없음'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-8 rounded-[40px] text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-tighter">Jeonse Ratio</p>
                                        <p className="text-3xl font-black text-slate-800">{selectedProfile.jeonseRatio?.toFixed(1) || 0}%</p>
                                    </div>
                                    <div className="bg-slate-900 p-8 rounded-[40px] text-center text-white shadow-2xl">
                                        <p className="text-[10px] font-black text-blue-400 uppercase mb-2">AI Forecast</p>
                                        <p className="text-2xl font-black">{selectedProfile.aiPredictedPrice ? selectedProfile.aiPredictedPrice.toLocaleString() : '-'}</p>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Regional Market Trend (3.3㎡ Avg)</h3>
                                    <p className="text-[9px] font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase">※ {searchParams.gugun} 전체 평균 데이터</p>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={molitData.trendGraph}>
                                            <defs>
                                                <linearGradient id="colorSale" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                                                <linearGradient id="colorJeonse" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                                                <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/><stop offset="95%" stopColor="#ec4899" stopOpacity={0}/></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="period" fontSize={10} axisLine={false} tickLine={false} />
                                            <YAxis hide /><Tooltip contentStyle={{borderRadius: '20px', border: 'none'}} />
                                            
                                            {/* 아파트 */}
                                            {searchParams.propertyType === '아파트' && searchParams.dealType === '매매' && <Area type="monotone" name="평균 매매가(3.3㎡)" dataKey="aptSale" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSale)" />}
                                            {searchParams.propertyType === '아파트' && searchParams.dealType === '전세' && <Area type="monotone" name="평균 전세가(3.3㎡)" dataKey="aptJeonse" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorJeonse)" />}
                                            {searchParams.propertyType === '아파트' && searchParams.dealType === '월세' && (
                                                <>
                                                    <Area type="monotone" name="평균 보증금" dataKey="aptWolseDeposit" stroke="#8b5cf6" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                                                    <Area type="monotone" name="평균 월세액" dataKey="aptWolseRent" stroke="#ec4899" strokeWidth={4} fillOpacity={1} fill="url(#colorRent)" />
                                                </>
                                            )}

                                            {/* 빌라(연립다세대) */}
                                            {searchParams.propertyType === '연립다세대' && searchParams.dealType === '매매' && <Area type="monotone" name="평균 매매가(3.3㎡)" dataKey="villaSale" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorSale)" />}
                                            {searchParams.propertyType === '연립다세대' && searchParams.dealType === '전세' && <Area type="monotone" name="평균 전세가(3.3㎡)" dataKey="villaJeonse" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorJeonse)" />}
                                            {searchParams.propertyType === '연립다세대' && searchParams.dealType === '월세' && (
                                                <>
                                                    <Area type="monotone" name="평균 보증금" dataKey="villaWolseDeposit" stroke="#8b5cf6" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                                                    <Area type="monotone" name="평균 월세액" dataKey="villaWolseRent" stroke="#ec4899" strokeWidth={4} fillOpacity={1} fill="url(#colorRent)" />
                                                </>
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center p-20 text-center opacity-30 grayscale italic font-black text-slate-300 uppercase tracking-widest leading-loose">
                            Select a property from the directory <br/> to generate market report
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default RealPriceCalculationPage;