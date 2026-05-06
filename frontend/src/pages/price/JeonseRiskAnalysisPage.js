/**
 * [Jeonse Risk Analysis Page]
 * 담당: 전세가율 계산 및 깡통전세 위험도 분석 시각화
 * 업데이트: 2026. 05. 05
 * 특징: 서버 측 통합 분석 로직(Single API) 결과 바인딩
 */
import React, { useState } from 'react';
import { riskService } from '../../api/price/riskService';

const JeonseRiskAnalysisPage = () => {
    // 1. [State] 분석을 위한 필수 입력 상태 관리[cite: 8]
    const [inputs, setInputs] = useState({ 
        address: '',        // 분석 대상 주소 (SIDO, SIGUNGU, EMD 포함 가능)
        exclusiveArea: '',  // HOUSE.AREA 대응
        myJeonsePrice: '',  // 사용자의 희망/계약 전세가 (만원 단위)
        propertyType: '아파트' // HOUSE.PROPERTY_TYPE 대응
    });
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    // 2. [UI Configuration] 위험 등급별 스타일 매핑 (백엔드 판정 지표 기준)
    const riskStyles = {
        SAFE: { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', label: '안전' },
        CAUTION: { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: '주의' },
        HIGH_RISK: { color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', label: '고위험' },
        DANGER: { color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', label: '위험' },
        SUSPICIOUS_LOW: { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100', label: '검토필요' }
    };

    // 3. [Action] 위험도 분석 실행
    const handleCheck = async () => {
        // 유효성 검사: 하드코딩된 값 없이 사용자의 입력을 강제함[cite: 8]
        if (!inputs.address || !inputs.exclusiveArea || !inputs.myJeonsePrice) {
            return alert("분석을 위해 모든 항목을 정확히 입력해주세요.");
        }
        
        setLoading(true);
        try {
            // 서비스 레이어를 통해 백엔드의 Single API 호출[cite: 5, 8]
            // 백엔드는 내부적으로 인근 실거래가를 추출하여 결과를 반환함
            const data = await riskService.checkRisk(inputs);
            setResult(data); 
        } catch (err) {
            console.error("Risk Analysis Error:", err);
            alert("서버 분석 엔진 통신에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-10 font-sans">
            <header className="mb-12">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Jeonse Risk Report</h1>
                <p className="text-slate-500 mt-2 font-medium">실거래가 데이터를 기반으로 한 단일 API 위험 분석 시스템입니다.</p>
            </header>

            <div className="grid grid-cols-12 gap-10">
                {/* [좌측] 입력 섹션: HOUSE 테이블 명세 기반[cite: 2, 8] */}
                <div className="col-span-12 lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block">Address</label>
                        <input 
                            type="text"
                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-blue-500 transition-all"
                            placeholder="예: 서울특별시 동작구 상도동"
                            value={inputs.address}
                            onChange={(e) => setInputs({...inputs, address: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block">Area (㎡)</label>
                            <input 
                                type="number"
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                                placeholder="84.5"
                                value={inputs.exclusiveArea}
                                onChange={(e) => setInputs({...inputs, exclusiveArea: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block">Type</label>
                            <select 
                                value={inputs.propertyType}
                                onChange={(e) => setInputs({...inputs, propertyType: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                            >
                                <option value="아파트">아파트</option>
                                <option value="오피스텔">오피스텔</option>
                                <option value="연립다세대">빌라/다세대</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[11px] font-black text-slate-400 uppercase mb-2 block">Desired Jeonse (만원)</label>
                        <input 
                            type="number"
                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none"
                            placeholder="55000"
                            value={inputs.myJeonsePrice}
                            onChange={(e) => setInputs({...inputs, myJeonsePrice: e.target.value})}
                        />
                    </div>

                    <button 
                        onClick={handleCheck} 
                        disabled={loading}
                        className={`w-full py-5 text-white font-black rounded-2xl transition-all shadow-xl ${
                            loading ? 'bg-slate-300' : 'bg-[#002855] hover:bg-blue-600'
                        }`}
                    >
                        {loading ? "분석 중..." : "위험도 정밀 분석 실행"}
                    </button>
                </div>

                {/* [우측] 결과 섹션: 서버 응답 데이터 바인딩[cite: 2, 8] */}
                <div className="col-span-12 lg:col-span-7 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-10 flex flex-col items-center justify-center min-h-[500px]">
                    {result ? (
                        <div className="w-full animate-in fade-in zoom-in duration-500">
                            {/* 등급 요약 카드 */}
                            <div className={`p-8 rounded-3xl border ${riskStyles[result.riskLevel]?.bg} ${riskStyles[result.riskLevel]?.border} text-center mb-6`}>
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full bg-white ${riskStyles[result.riskLevel]?.color} shadow-sm mb-4 inline-block uppercase`}>
                                    Level: {riskStyles[result.riskLevel]?.label}
                                </span>
                                <h2 className="text-6xl font-black text-slate-900 mb-2">
                                    {result.myJeonseRatio}<span className="text-2xl ml-1">%</span>
                                </h2>
                                <p className="text-slate-600 font-bold text-sm">전세가율 (Jeonse to Price Ratio)</p>
                            </div>

                            {/* 상세 리포트 항목[cite: 2] */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                    <span className="text-xs font-bold text-slate-400">인근 평균 매매가</span>
                                    <span className="text-sm font-black text-slate-700">{result.avgSalePrice?.toLocaleString()} 만원</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                                    <span className="text-xs font-bold text-slate-400">분석 주소</span>
                                    <span className="text-sm font-black text-slate-700">{result.address}</span>
                                </div>
                                <div className="pt-2">
                                    <p className={`text-sm leading-relaxed font-bold ${riskStyles[result.riskLevel]?.color}`}>
                                        {result.riskMessage}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-40">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-sm mx-auto mb-6">📉</div>
                            <h3 className="text-xl font-black text-slate-700">분석 리포트 대기 중</h3>
                            <p className="text-slate-400 mt-2 font-medium">실거래가 기반 위험도 리포트가 생성됩니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JeonseRiskAnalysisPage;