import React, { useState } from 'react';
import apiClient from 'api/apiClient';
import { 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Line, ComposedChart 
} from 'recharts';

const CommercialSearchPage = () => {
    // 1. [상태 관리] 💡 지침 반영: sigungu, dong, propertyType 필터 구성[cite: 1]
    const [filters, setFilters] = useState({
        sigungu: '',
        dong: '',
        propertyType: '상가',
        page: 0,
        size: 20
    });

    const [commercialList, setCommercialList] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // 💡 [수정 완료]

    /**
     * 2. [데이터 호출] 💡 04.30 지침: POST /api/price/directory[cite: 1]
     */
    const handleSearch = async (e) => {
        if(e) e.preventDefault();
        if (!filters.sigungu) return alert("지역명(시군구)을 입력하세요.");
        
        setIsLoading(true);
        try {
            // 💡 건물(상가) 목록 조회[cite: 1]
            const listRes = await apiClient.post('/api/price/directory', filters);
            setCommercialList(listRes.data.content || []);

            // 💡 시세 추이 조회 (GET /api/price/trend)[cite: 1]
            const trendRes = await apiClient.get('/api/price/trend', { 
                params: { 
                    sigungu: filters.sigungu,
                    startMonth: '202401',
                    endMonth: '202412'
                } 
            });
            setTrendData(trendRes.data.trends || []);
        } catch (error) {
            console.error("데이터 로드 실패:", error);
            alert("서버 통신에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] p-8">
            <header className="max-w-7xl mx-auto mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">🏢 상권 분석 시스템</h1>
                <p className="text-slate-500 font-medium mt-2">04.30 업데이트: 상가 보증금/월세 듀얼 차트 적용[cite: 1]</p>
            </header>

            <main className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8">
                <aside className="lg:col-span-4 space-y-6">
                    <form onSubmit={handleSearch} className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                        <h3 className="text-lg font-black mb-6">검색 필터</h3>
                        <div className="space-y-4">
                            <input 
                                className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 font-bold"
                                placeholder="시군구 (예: 동작구)"
                                value={filters.sigungu}
                                onChange={(e) => setFilters({...filters, sigungu: e.target.value})}
                            />
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black">
                                {isLoading ? "분석 중..." : "상권 검색"}
                            </button>
                        </div>
                    </form>

                    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-[500px] overflow-y-auto">
                        <h3 className="text-lg font-black mb-6">지역 건물 목록</h3>
                        <div className="space-y-4">
                            {commercialList.map((item, idx) => (
                                <div key={idx} className="p-5 bg-slate-50 rounded-3xl hover:bg-blue-50 transition-all cursor-pointer">
                                    <h4 className="font-black text-slate-800">{item.complexName}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1">{item.roadAddress}</p>
                                    <p className="text-xs text-blue-600 font-bold mt-2">누적 거래: {item.totalTransactions}건</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <section className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100">
                        <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tighter">임대료 추이 분석</h3>
                        <div className="h-80 w-full">
                            {trendData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="period" />
                                        <YAxis hide />
                                        <Tooltip />
                                        {/* 💡 지침 반영 필드명: aptWolseDeposit, aptWolseRent[cite: 1] */}
                                        <Bar dataKey="aptWolseDeposit" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} name="보증금" />
                                        <Line type="monotone" dataKey="aptWolseRent" stroke="#f43f5e" strokeWidth={4} name="월세" />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 text-slate-300 font-bold">
                                    분석 데이터를 불러오세요.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default CommercialSearchPage;