import React, { useState } from 'react';
import apiClient from '../../api/apiClient';

const AIBiddingSuggestionPage = () => {
    const [inputs, setInputs] = useState({
        property_type: '아파트',
        location: '서울특별시 동작구 상도동',
        area_m2: '84',
        current_price: '',
        built_year: '',
        floor: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleSuggest = async () => {
        if (!inputs.location || !inputs.current_price || !inputs.built_year || !inputs.floor) {
            alert("모든 정보를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                propertyType: inputs.property_type,
                address: inputs.location,
                area_m2: parseFloat(inputs.area_m2) || 84.0,
                market_data: {
                    current_price: parseInt(inputs.current_price, 10),
                    built_year: parseInt(inputs.built_year, 10),
                    floor: parseInt(inputs.floor, 10)
                }
            };
            const res = await apiClient.post('/api/price/suggest', payload);
            setResult(res.data);
        } catch (error) {
            console.error("적정가 산출 실패:", error);
            alert("AI 분석 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const getGradeBadge = (grade) => {
        if (grade.includes("추천") || grade.includes("저평가")) return "bg-emerald-50 text-emerald-600 border-emerald-200";
        if (grade.includes("주의") || grade.includes("고평가")) return "bg-rose-50 text-rose-600 border-rose-200";
        return "bg-blue-50 text-blue-600 border-blue-200";
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 bg-[#F8FAFC] min-h-screen font-sans">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-black text-[#002855] tracking-tighter italic">AI 적정 입찰가 <span className="text-blue-500 font-light">제안</span></h1>
                <p className="text-slate-500 mt-2 text-sm font-bold">호가, 연식, 층수를 바탕으로 최적의 협상/입찰 가격을 제안합니다</p>
            </header>

            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 입력 폼 */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase">매물 종류</label>
                            <select name="property_type" value={inputs.property_type} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-500">
                                <option value="아파트">아파트</option>
                                <option value="연립다세대">연립다세대 (빌라)</option>
                                <option value="오피스텔">오피스텔</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase">매물 주소</label>
                            <input name="location" value={inputs.location} onChange={handleInputChange} placeholder="예: 서울특별시 강남구 역삼동" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase">전용면적 (㎡)</label>
                            <input type="number" name="area_m2" value={inputs.area_m2} onChange={handleInputChange} placeholder="예: 84" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase">현재 호가 (단위: 만원)</label>
                            <input type="number" name="current_price" value={inputs.current_price} onChange={handleInputChange} placeholder="예: 150000 (15억)" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-500" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-blue-600 uppercase">준공 연도</label>
                                <input type="number" name="built_year" value={inputs.built_year} onChange={handleInputChange} placeholder="예: 2018" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-blue-600 uppercase">층수</label>
                                <input type="number" name="floor" value={inputs.floor} onChange={handleInputChange} placeholder="예: 15" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <button 
                            onClick={handleSuggest} 
                            disabled={isLoading}
                            className="w-full bg-[#002855] hover:bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg transition-all mt-4 disabled:opacity-50"
                        >
                            {isLoading ? '분석 중...' : '적정 입찰가 분석하기 →'}
                        </button>
                    </div>

                    {/* 결과 화면 */}
                    <div className="bg-slate-50 rounded-[32px] p-8 flex flex-col justify-center items-center text-center border border-slate-100">
                        {result ? (
                            <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4">
                                <div>
                                    <span className={`px-4 py-1.5 rounded-full border text-[11px] font-black ${getGradeBadge(result.grade)}`}>
                                        {result.grade}
                                    </span>
                                </div>
                                
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AI 제안 적정가</p>
                                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
                                        {result.suggested_price.toLocaleString()} <span className="text-lg font-bold text-slate-500">만원</span>
                                    </h2>
                                </div>

                                <div className="pt-6 border-t border-slate-200 w-full text-left space-y-4">
                                    <p className="text-xs font-bold text-slate-600 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        💡 <span className="font-black text-blue-600">산출 근거:</span> {result.calculation_basis.avg_market_price}
                                    </p>
                                    
                                    {result.calculation_basis.adjustments.length > 0 && (
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">보정 항목 적용</p>
                                            <ul className="space-y-1">
                                                {result.calculation_basis.adjustments.map((adj, idx) => (
                                                    <li key={idx} className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> {adj}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400 text-sm font-bold uppercase tracking-widest opacity-50">
                                <span className="text-4xl block mb-4">🤖</span>
                                매물 상세 정보를 입력하면<br/>AI 적정가 제안이 시작됩니다
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIBiddingSuggestionPage;
