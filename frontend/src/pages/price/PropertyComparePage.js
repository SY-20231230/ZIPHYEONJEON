import React, { useState } from 'react';
import apiClient from '../../api/apiClient';

const PropertyComparePage = () => {
    const [targets, setTargets] = useState([
        { address: '', area_m2: '', transaction_type: '아파트', targetPrice: '' },
        { address: '', area_m2: '', transaction_type: '아파트', targetPrice: '' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState([]);

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
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-black text-[#002855] tracking-tighter italic">PROPERTY <span className="text-blue-500 font-light">COMPARE</span></h1>
                <p className="text-slate-500 mt-2 text-sm font-bold">관심 있는 매물들을 나란히 두고 객관적인 데이터를 바탕으로 비교 분석하세요.</p>
            </header>

            <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-slate-800">비교 대상 설정 (최대 5개)</h2>
                    <button onClick={handleAddTarget} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all text-xs">+ 대상 추가</button>
                </div>
                
                <div className="space-y-4">
                    {targets.map((target, idx) => (
                        <div key={idx} className="flex flex-wrap md:flex-nowrap gap-4 items-center bg-slate-50 p-4 rounded-2xl relative group">
                            <div className="absolute -left-3 -top-3 w-6 h-6 bg-[#002855] text-white rounded-full flex items-center justify-center text-[10px] font-black z-10">
                                {idx + 1}
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="text-[9px] font-black text-blue-600 uppercase ml-2">Type</label>
                                <select value={target.transaction_type} onChange={e => handleTargetChange(idx, 'transaction_type', e.target.value)} className="w-full bg-white p-3 rounded-xl font-bold border-none text-sm shadow-sm focus:ring-2 focus:ring-blue-500">
                                    <option value="아파트">아파트</option>
                                    <option value="연립다세대">빌라</option>
                                    <option value="오피스텔">오피스텔</option>
                                </select>
                            </div>
                            <div className="w-full md:w-2/4">
                                <label className="text-[9px] font-black text-blue-600 uppercase ml-2">Address (동 포함)</label>
                                <input value={target.address} onChange={e => handleTargetChange(idx, 'address', e.target.value)} placeholder="예: 서울특별시 동작구 상도동" className="w-full bg-white p-3 rounded-xl font-bold border-none text-sm shadow-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="text-[9px] font-black text-blue-600 uppercase ml-2">Area (㎡)</label>
                                <input type="number" value={target.area_m2} onChange={e => handleTargetChange(idx, 'area_m2', e.target.value)} placeholder="84" className="w-full bg-white p-3 rounded-xl font-bold border-none text-sm shadow-sm focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="w-full md:w-1/4">
                                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Target Price (옵션)</label>
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
                    <h2 className="text-2xl font-black text-[#002855] mb-8 italic">BATTLE BOARD</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {results.map((res, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 opacity-5 rounded-bl-[100px]"></div>
                                
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-[#002855] text-white text-[10px] px-3 py-1 rounded-full font-black uppercase">Target {idx + 1}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{res.propertyType}</span>
                                    </div>
                                    <h3 className="font-black text-slate-800 text-sm mb-1 leading-snug h-10 overflow-hidden">{res.address}</h3>
                                    <p className="text-xs font-bold text-slate-500 mb-6">{res.exclusiveArea}㎡</p>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                            <p className="text-[9px] font-black text-blue-500 uppercase">Average Market Price</p>
                                            <p className="font-black text-lg text-slate-900">{res.averageMarketPrice ? res.averageMarketPrice.toLocaleString() : '-'} <span className="text-[10px] text-slate-500">만원</span></p>
                                        </div>
                                        {res.targetPrice > 0 && (
                                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Target Price</p>
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
