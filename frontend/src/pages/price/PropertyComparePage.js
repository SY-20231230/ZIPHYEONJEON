import React, { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';
import { interactionService } from '../../api/interaction/interactionService';
import priceService from '../../api/price/priceService';

const PropertyComparePage = () => {
    const [targets, setTargets] = useState([
        { address: '', area_m2: '', transaction_type: '아파트', targetPrice: '' },
        { address: '', area_m2: '', transaction_type: '아파트', targetPrice: '' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [quickTags, setQuickTags] = useState({ liked: [], recent: [] });

    useEffect(() => {
        const fetchQuickTags = async () => {
            try {
                const [likes, records] = await Promise.all([
                    interactionService.getLikedHouses(),
                    interactionService.getRecentRecords()
                ]);
                
                const extract = (res) => res.data?.data || res.data || (Array.isArray(res) ? res : []);
                
                setQuickTags({
                    liked: extract(likes).slice(0, 5),
                    recent: extract(records).slice(0, 5)
                });
            } catch (err) {
                console.error("퀵 태그 데이터 로딩 실패:", err);
            }
        };
        fetchQuickTags();
    }, []);

    const handleSelectQuickTag = async (item) => {
        const base = item.house || item;
        const hId = base.representativeHouseId || base.HOUSE_ID || base.houseId;
        if (!hId) return;

        // 1. 중복 확인
        const isAlreadyAdded = targets.some(t => t.houseId === hId);
        if (isAlreadyAdded) {
            alert("이미 선택된 매물입니다.");
            return;
        }

        try {
            // 2. [성능 최적화] 경량화된 API를 사용하여 실제 주소와 면적 정보를 신속하게 조회
            const d = await priceService.getSimplifiedProfile(hId);
            
            const newData = {
                houseId: hId,
                // [보정] 건물 이름 대신 실제 분석 가능한 '도로명 주소' 입력
                address: d.roadAddress || d.address || base.roadAddress || base.address || '',
                // [보정] 기본값 84 대신 서버에 저장된 '실제 전용면적' 입력
                area_m2: d.area || d.AREA || base.area || 84,
                transaction_type: d.propertyType || d.PROPERTY_TYPE || '아파트',
                targetPrice: '' 
            };

            // [추가] 비교 대상 선택 시 방문 기록 최신화 (백엔드 기존 로직 활용)
            try {
                await interactionService.addRecentRecord(hId);
            } catch (recordErr) {
                console.warn("방문 기록 갱신 실패:", recordErr);
            }

            // 3. 순차적으로 빈 슬롯 찾기
            const emptyIdx = targets.findIndex(t => !t.address);

            if (emptyIdx !== -1) {
                const newTargets = [...targets];
                newTargets[emptyIdx] = newData;
                setTargets(newTargets);
            } else if (targets.length < 5) {
                setTargets([...targets, newData]);
            } else {
                alert("최대 5개까지만 비교할 수 있습니다.");
            }
        } catch (error) {
            console.error("매물 정보 상세 조회 실패:", error);
            // 실패 시 기본 데이터라도 입력
            const fallbackData = {
                houseId: hId,
                address: base.roadAddress || base.address || '',
                area_m2: base.area || 84,
                transaction_type: '아파트',
                targetPrice: ''
            };
            const emptyIdx = targets.findIndex(t => !t.address);
            if (emptyIdx !== -1) {
                const newTargets = [...targets];
                newTargets[emptyIdx] = fallbackData;
                setTargets(newTargets);
            }
        }
    };


    const handleAddTarget = () => {
        if (targets.length >= 5) {
            alert("최대 5개까지만 비교할 수 있습니다.");
            return;
        }
        setTargets([...targets, { address: '', area_m2: '', transaction_type: '아파트', targetPrice: '' }]);
    };

    const handleRemoveTarget = (index) => {
        if (targets.length <= 2) {
            alert("최소 2개의 매물을 비교해야 합니다.");
            return;
        }
        const newTargets = [...targets];
        newTargets.splice(index, 1);
        setTargets(newTargets);
    };

    const handleTargetChange = (index, field, value) => {
        const newTargets = [...targets];
        newTargets[index][field] = value;
        setTargets(newTargets);
    };

    const handleCompare = async () => {
        for (let i = 0; i < targets.length; i++) {
            if (!targets[i].address || !targets[i].area_m2) {
                alert(`${i + 1}번째 매물의 주소와 전용면적을 입력해주세요.`);
                return;
            }
        }

        setIsLoading(true);
        try {
            const payload = {
                targets: targets.map(t => ({
                    address: t.address,
                    area_m2: parseFloat(t.area_m2) || 84.0,
                    transaction_type: t.transaction_type,
                    targetPrice: t.targetPrice ? parseInt(t.targetPrice, 10) : 0
                }))
            };
            const res = await apiClient.post('/api/price/compare', payload);
            setResults(res.data);
        } catch (error) {
            console.error("비교 분석 실패:", error);
            alert("매물 비교 분석 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC] min-h-screen font-sans">
            <header><h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">다중 매물 비교 <span className="text-blue-600 text-sm font-light ml-1">관심 있는 매물들을 나란히 두고 객관적인 데이터를 바탕으로 비교 분석하세요.</span></h1></header>

            <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800">비교 대상 설정 (최대 5개)</h2>
                    <button onClick={handleAddTarget} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all text-xs">+ 대상 추가</button>
                </div>
                
                {/* 퀵 태그 섹션: 찜 매물과 최근 기록 분리 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    {/* 찜한 매물 섹션 */}
                    <div className="bg-gradient-to-br from-rose-50/80 to-white p-6 rounded-[32px] border border-rose-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-200/10 rounded-bl-[80px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm font-black border border-rose-50">❤️</div>
                            <div>
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] block">Favorites</span>
                                <span className="text-sm font-black text-slate-700">찜한 매물</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {quickTags.liked.length > 0 ? (
                                quickTags.liked.map((item, idx) => (
                                    <button 
                                        key={`like-${idx}`}
                                        onClick={() => handleSelectQuickTag(item)}
                                        className="px-4 py-2.5 bg-white hover:bg-rose-500 hover:text-white text-rose-600 rounded-2xl text-[11px] font-black transition-all shadow-sm border border-rose-100 active:scale-95 flex items-center gap-2"
                                    >
                                        {item.complexName || item.name || "이름 없음"}
                                    </button>
                                ))
                            ) : (
                                <div className="w-full py-4 text-center border-2 border-dashed border-rose-100 rounded-2xl">
                                    <p className="text-[11px] text-rose-300 font-bold">찜한 매물이 아직 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 최근 본 매물 섹션 */}
                    <div className="bg-gradient-to-br from-blue-50/80 to-white p-6 rounded-[32px] border border-blue-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/10 rounded-bl-[80px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm font-black border border-blue-50">🕒</div>
                            <div>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block">History</span>
                                <span className="text-sm font-black text-slate-700">최근 본 매물</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 relative z-10">
                            {quickTags.recent.length > 0 ? (
                                quickTags.recent.map((item, idx) => (
                                    <button 
                                        key={`recent-${idx}`}
                                        onClick={() => handleSelectQuickTag(item)}
                                        className="px-4 py-2.5 bg-white hover:bg-blue-500 hover:text-white text-blue-600 rounded-2xl text-[11px] font-black transition-all shadow-sm border border-blue-100 active:scale-95 flex items-center gap-2"
                                    >
                                        {item.complexName || item.name || "이름 없음"}
                                    </button>
                                ))
                            ) : (
                                <div className="w-full py-4 text-center border-2 border-dashed border-blue-100 rounded-2xl">
                                    <p className="text-[11px] text-blue-300 font-bold">최근 열람 기록이 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {targets.map((target, idx) => (
                        <div key={idx} className="flex flex-wrap md:flex-nowrap gap-4 items-center bg-slate-50 p-4 rounded-2xl relative group">
                            <div className="absolute -left-3 -top-3 w-6 h-6 bg-[#002855] text-white rounded-full flex items-center justify-center text-[10px] font-black z-10">
                                {idx + 1}
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="text-[9px] font-black text-blue-600 uppercase ml-2">매물 유형</label>
                                <select value={target.transaction_type} onChange={e => handleTargetChange(idx, 'transaction_type', e.target.value)} className="w-full bg-white p-3 rounded-xl font-bold border-none text-sm shadow-sm focus:ring-2 focus:ring-blue-500">
                                    <option value="아파트">아파트</option>
                                    <option value="연립다세대">빌라</option>
                                    <option value="오피스텔">오피스텔</option>
                                </select>
                            </div>
                            <div className="w-full md:w-2/4">
                                <label className="text-[9px] font-black text-blue-600 uppercase ml-2">주소 (도로명 또는 동+지번)</label>
                                <input value={target.address} onChange={e => handleTargetChange(idx, 'address', e.target.value)} placeholder="예: 서울특별시 동작구 상도동" className="w-full bg-white p-3 rounded-xl font-bold border-none text-sm shadow-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="w-full md:w-1/4">
                                <div className="flex justify-between items-center ml-2">
                                    <label className="text-[9px] font-black text-blue-600 uppercase">전용면적 (㎡)</label>
                                    {target.area_m2 && (
                                        <span className="text-[9px] font-black text-slate-400">≈ {(target.area_m2 * 0.3025).toFixed(1)}평</span>
                                    )}
                                </div>
                                <input type="number" value={target.area_m2} onChange={e => handleTargetChange(idx, 'area_m2', e.target.value)} placeholder="84" className="w-full bg-white p-3 rounded-xl font-bold border-none text-sm shadow-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">목표가 (옵션)</label>
                                <input type="number" value={target.targetPrice} onChange={e => handleTargetChange(idx, 'targetPrice', e.target.value)} placeholder="예: 120000" className="w-full bg-white p-3 rounded-xl font-bold border-none text-sm shadow-sm focus:ring-2 focus:ring-slate-300" />
                            </div>
                            {targets.length > 2 && (
                                <button onClick={() => handleRemoveTarget(idx)} className="mt-5 md:mt-0 px-3 py-3 text-rose-500 hover:bg-rose-100 rounded-xl transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <button 
                        onClick={handleCompare} 
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-[#002855] text-white px-12 py-4 rounded-2xl font-black shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 text-lg tracking-wide"
                    >
                        {isLoading ? '분석 중...' : '선택 매물 비교 분석 시작'}
                    </button>
                </div>
            </div>

            {results.length > 0 && (
                <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-8">
                    <h2 className="text-2xl font-black text-slate-900 mb-8 italic">비교 분석 결과</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {results.map((res, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 opacity-5 rounded-bl-[100px]"></div>
                                
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-[#002855] text-white text-[10px] px-3 py-1 rounded-full font-black uppercase">비교 대상 {idx + 1}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{res.propertyType}</span>
                                    </div>
                                    <h3 className="font-black text-slate-800 text-sm mb-1 leading-snug h-10 overflow-hidden">{res.address}</h3>
                                    <p className="text-xs font-bold text-slate-500 mb-6">
                                        {res.exclusiveArea}㎡ 
                                        <span className="ml-1 text-slate-400 font-medium">({(res.exclusiveArea * 0.3025).toFixed(1)}평)</span>
                                    </p>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                            <p className="text-[9px] font-black text-blue-500 uppercase">주변 평균 시세</p>
                                            <p className="font-black text-lg text-slate-900">{res.averageMarketPrice ? res.averageMarketPrice.toLocaleString() : '-'} <span className="text-[10px] text-slate-500">만원</span></p>
                                        </div>
                                        {res.targetPrice > 0 && (
                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase">나의 목표가</p>
                                                <p className="font-black text-md text-slate-700">{res.targetPrice.toLocaleString()} <span className="text-[10px] text-slate-500">만원</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-slate-200">
                                    {res.targetPrice > 0 && res.averageMarketPrice > 0 ? (
                                        <div>
                                            <div className="flex items-end justify-between mb-2">
                                                <span className="text-[10px] font-black text-slate-500">시세 대비 차익</span>
                                                <span className={`font-black text-lg ${res.priceDiff < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {res.priceDiff > 0 ? '+' : ''}{res.priceDiff.toLocaleString()}
                                                </span>
                                            </div>
                                            <p className={`text-[11px] font-bold px-3 py-2 rounded-xl text-center ${res.priceDiff < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                {res.analysisMessage}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] font-bold text-slate-400 text-center italic py-2">
                                            {res.averageMarketPrice ? '목표가를 입력하면 시세 분석이 제공됩니다.' : '지역 평균 데이터가 부족합니다.'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyComparePage;
