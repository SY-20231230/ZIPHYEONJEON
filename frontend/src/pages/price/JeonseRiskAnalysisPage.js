/**
 * [Jeonse Risk Analysis Page - Professional Data Integrity v3.0]
 * 수정 내역:
 * 1. 주소 포맷 최적화: '서울특별시'를 제외한 '동작구 상도동' 형태의 주소 전달 (LIKE 쿼리 매칭률 극대화)
 * 2. 데이터 타입 강제화: Area와 Price를 Number(숫자) 타입으로 명시적 변환하여 전송
 * 3. 분석 실패 시 가이드 강화: 데이터 부족 시 사용자에게 입력값 수정을 유도하는 UI 적용
 */

import React, { useState } from 'react';
import { riskService } from '../../api/price/riskService';

// 서울 지역 데이터 (기존 규격 유지)
const GUGUN_MAP = {
    "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"]
};
const DONG_MAP = {
    "동작구": ["상도동", "상도1동", "흑석동", "노량진동", "대방동", "신대방동", "사당동"],
    "은평구": ["녹번동", "불광동", "갈현동", "구산동", "대조동", "응암동"]
};

const JeonseRiskAnalysisPage = () => {
    const [inputs, setInputs] = useState({
        sido: '서울특별시',
        gugun: '동작구',
        dong: '상도동',
        exclusiveArea: '84',
        myJeonsePrice: '55000',
        propertyType: '아파트'
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const riskStyles = {
        SAFE: { color: 'text-emerald-500', bg: 'bg-emerald-50', label: '안전' },
        CAUTION: { color: 'text-amber-500', bg: 'bg-amber-50', label: '주의' },
        DANGER: { color: 'text-rose-500', bg: 'bg-rose-50', label: '위험' },
        UNKNOWN: { color: 'text-slate-400', bg: 'bg-slate-100', label: '분석불가' }
    };

    /**
     * [Action] 정밀 분석 실행
     */
    const handleCheck = async () => {
        if (!inputs.exclusiveArea || !inputs.myJeonsePrice) return alert("필수 정보를 입력해주세요.");

        setLoading(true);
        try {
            // [💡 핵심 수정] 백엔드 DB 컬럼(SIGUNGU, EMD)에 '서울특별시'가 없으므로 제외하고 전송
            // '동작구 상도동' 형식은 백엔드의 LIKE %?% 쿼리에서 가장 높은 매칭률을 보입니다.
            const formattedPayload = {
                address: `${inputs.gugun} ${inputs.dong}`,
                exclusiveArea: Number(inputs.exclusiveArea), // 숫자로 확실히 변환
                myJeonsePrice: Number(inputs.myJeonsePrice), // 숫자로 확실히 변환
                propertyType: inputs.propertyType
            };

            console.log("전송 데이터(Payload):", formattedPayload); // 디버깅용 로그

            const data = await riskService.checkRisk(formattedPayload);
            setResult(data);
        } catch (err) {
            console.error("통신 에러:", err);
            alert("서버 분석 엔진과 연결할 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-10 font-sans">
            <header className="mb-14"><h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">전세가율 및 위험도 분석 <span className="text-blue-600 text-sm font-light ml-1">입력하신 희망 전세가와 해당 지역의 실거래가를 분석하여 보증금의 안전성과 전세 사기 위험도를 정밀 진단합니다.</span></h1></header>

            <div className="grid grid-cols-12 gap-10">
                {/* 입력 섹션 */}
                <div className="col-span-12 lg:col-span-5 bg-white p-8 rounded-[40px] shadow-xl border border-slate-100 space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Area Location</label>
                        <div className="grid grid-cols-2 gap-2">
                            <select className="bg-slate-50 p-4 rounded-2xl font-bold text-sm border-none" value={inputs.gugun} onChange={e => setInputs({ ...inputs, gugun: e.target.value, dong: DONG_MAP[e.target.value]?.[0] || '' })}>
                                {GUGUN_MAP[inputs.sido].map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                            <select className="bg-slate-50 p-4 rounded-2xl font-bold text-sm border-none" value={inputs.dong} onChange={e => setInputs({ ...inputs, dong: e.target.value })}>
                                {DONG_MAP[inputs.gugun]?.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Area (㎡)</label>
                            <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none" value={inputs.exclusiveArea} onChange={e => setInputs({ ...inputs, exclusiveArea: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Type</label>
                            <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none" value={inputs.propertyType} onChange={e => setInputs({ ...inputs, propertyType: e.target.value })}>
                                <option value="아파트">아파트</option>
                                <option value="오피스텔">오피스텔</option>
                                <option value="연립다세대">빌라/다세대</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Desired Price (만원)</label>
                        <input type="number" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm border-none" value={inputs.myJeonsePrice} onChange={e => setInputs({ ...inputs, myJeonsePrice: e.target.value })} />
                    </div>

                    <button onClick={handleCheck} disabled={loading} className="w-full py-5 bg-blue-600 text-white font-black rounded-[24px] shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                        {loading ? "분석 중..." : "정밀 분석 실행"}
                    </button>
                </div>

                {/* 결과 섹션 */}
                <div className="col-span-12 lg:col-span-7 bg-white rounded-[40px] border border-slate-100 p-12 shadow-sm flex flex-col justify-center">
                    {result ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                            <div className="text-center">
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${riskStyles[result.riskLevel]?.bg} ${riskStyles[result.riskLevel]?.color}`}>
                                    Level: {riskStyles[result.riskLevel]?.label || '분석 중'}
                                </span>
                                <h2 className="text-7xl font-black text-slate-900 mt-6 tracking-tighter">
                                    {result.myJeonseRatio || 0}<span className="text-2xl ml-1 text-slate-300">%</span>
                                </h2>
                                <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-widest italic">Current Jeonse to Price Ratio</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-7 rounded-[32px] text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Market Avg. Sale</p>
                                    <p className="text-xl font-black text-slate-800">{result.avgSalePrice?.toLocaleString() || 0}만</p>
                                </div>
                                <div className="bg-slate-50 p-7 rounded-[32px] text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Market Avg. Jeonse</p>
                                    <p className="text-xl font-black text-slate-800">{result.avgJeonsePrice?.toLocaleString() || 0}만</p>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[35px] ${result.riskLevel === 'UNKNOWN' ? 'bg-slate-50' : 'bg-slate-900'} transition-colors`}>
                                <p className={`text-xs font-bold leading-relaxed italic text-center ${result.riskLevel === 'UNKNOWN' ? 'text-slate-400' : 'text-white'}`}>
                                    " {result.riskMessage} "
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 opacity-10 grayscale">
                            <div className="text-8xl">🏘️</div>
                            <p className="font-black text-sm uppercase tracking-[0.3em]">Waiting for Request</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JeonseRiskAnalysisPage;