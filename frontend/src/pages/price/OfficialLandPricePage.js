import React, { useState } from 'react';
import apiClient from '../../api/apiClient';

const OfficialLandPricePage = () => {
    const [address, setAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pnu, setPnu] = useState('');
    const [landData, setLandData] = useState(null);

    const handleSearch = async () => {
        if (!address) {
            alert("조회할 도로명/지번 주소를 입력해주세요.");
            return;
        }

        setIsLoading(true);
        setLandData(null);
        setPnu('');
        
        try {
            // 1. PNU 조회
            const pnuRes = await apiClient.get('/api/price/pnu', { params: { address } });
            if (!pnuRes.data || !pnuRes.data.pnu) {
                alert("해당 주소의 PNU(고유번호)를 찾을 수 없습니다.");
                setIsLoading(false);
                return;
            }
            
            const fetchedPnu = pnuRes.data.pnu;
            setPnu(fetchedPnu);

            // 2. 공시지가 조회 (연도 필터 제거하고 최신 데이터 조회)
            const landRes = await apiClient.get('/api/price/land', { 
                params: { 
                    uninum_code: fetchedPnu
                } 
            });
            
            // OpenAPI 결과 파싱
            const data = typeof landRes.data === 'string' ? JSON.parse(landRes.data) : landRes.data;
            setLandData(data);
        } catch (error) {
            console.error("공시지가 조회 실패:", error);
            alert("공공데이터포털 연동 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 데이터 추출 헬퍼 함수
    const getLandInfo = () => {
        if (!landData || !landData.response?.result?.featureCollection?.features?.length) return null;
        const feature = landData.response.result.featureCollection.features[0];
        const props = feature.properties;
        
        // 브이월드 레이어마다 필드명이 다를 수 있으므로(gosi_year vs stdr_year) 유연하게 매핑
        return {
            ...props,
            stdr_year: props.gosi_year || props.stdr_year,
            stdr_mt: props.gosi_month || props.stdr_mt
        };
    };

    const landInfo = getLandInfo();

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 bg-[#F8FAFC] min-h-screen font-sans">
            <header><h1 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">공시지가 정밀 조회 <span className="text-blue-600 text-sm font-light ml-1">PNU 자동 변환 기술을 통해 국토부 공식 최신 개별공시지가를 조회합니다.</span></h1></header>

            {/* 검색창 섹션 */}
            <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-4 items-end transition-all hover:shadow-2xl">
                <div className="w-full md:w-3/4 space-y-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase ml-2 tracking-widest">주소 입력</label>
                    <input 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder="예: 서울특별시 강남구 역삼동 825" 
                        className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-500 shadow-inner" 
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <button 
                    onClick={handleSearch} 
                    disabled={isLoading}
                    className="w-full md:w-auto px-12 py-4 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl font-black shadow-lg transition-all disabled:opacity-50 whitespace-nowrap active:scale-95 flex-grow"
                >
                    {isLoading ? '조회 중...' : '최신 데이터 조회'}
                </button>
            </div>

            {/* PNU 정보 배지 */}
            {pnu && (
                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-700 text-center animate-in fade-in slide-in-from-top-4 shadow-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">추출된 PNU 고유번호</p>
                    <p className="text-xl font-mono font-black text-blue-400 tracking-[0.3em]">{pnu}</p>
                </div>
            )}

            {/* 결과 가공 표시 섹션 */}
            {landInfo ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
                    {/* 메인 가격 카드 */}
                    <div className="bg-white p-10 rounded-[45px] shadow-xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                        <div className="space-y-2">
                            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-blue-100">
                                최신 개별공시지가 ({landInfo.stdr_year}년)
                            </span>
                            <h2 className="text-4xl font-black text-slate-900">{Number(landInfo.jiga).toLocaleString()} <span className="text-xl text-slate-400">원 / ㎡</span></h2>
                            <p className="text-slate-400 font-bold text-xs">공시 기준일: {landInfo.stdr_year}년 {landInfo.stdr_mt}월</p>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">데이터 출처</p>
                            <p className="text-xs font-bold text-slate-400">국토교통부 OpenAPI</p>
                        </div>
                    </div>

                    {/* 상세 정보 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 transition-all hover:border-blue-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">지목</p>
                            <p className="text-lg font-black text-slate-800">{landInfo.ldcg_nm || '-'}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 transition-all hover:border-blue-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">면적</p>
                            <p className="text-lg font-black text-slate-800">{landInfo.parea || '-'} ㎡</p>
                        </div>
                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-slate-100 transition-all hover:border-blue-200">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">이용상황</p>
                            <p className="text-lg font-black text-slate-800">{landInfo.land_use_nm || '-'}</p>
                        </div>
                    </div>
                </div>
            ) : (landData && (
                <div className="bg-rose-50 p-10 rounded-[40px] border border-rose-100 text-center animate-in zoom-in-95">
                    <p className="text-rose-600 font-black">공시지가 데이터를 찾을 수 없습니다.</p>
                    <p className="text-rose-400 text-xs mt-2 font-bold">주소 정보를 다시 확인해주세요.</p>
                </div>
            ))}

            {/* 원본 JSON (개발자용/참고용) */}
            {landData && (
                <details className="group">
                    <summary className="text-[10px] font-black text-slate-300 cursor-pointer hover:text-slate-500 transition-colors uppercase tracking-widest mb-4 list-none text-center">
                        + API 원본 데이터 보기 (JSON)
                    </summary>
                    <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-800">
                        <pre className="text-blue-400 text-[10px] font-mono overflow-auto max-h-80 custom-scrollbar leading-relaxed">
                            {JSON.stringify(landData, null, 2)}
                        </pre>
                    </div>
                </details>
            )}
        </div>
    );
};

export default OfficialLandPricePage;
