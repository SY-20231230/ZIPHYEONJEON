import React, { useState } from 'react';
import apiClient from '../../api/apiClient';

const OfficialLandPricePage = () => {
    const [address, setAddress] = useState('');
    const [year, setYear] = useState('2024');
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

            // 2. 공시지가 조회
            const landRes = await apiClient.get('/api/price/land', { 
                params: { 
                    uninum_code: fetchedPnu,
                    year: year
                } 
            });
            
            // OpenAPI 결과는 String 형태의 JSON일 가능성이 큼
            const data = typeof landRes.data === 'string' ? JSON.parse(landRes.data) : landRes.data;
            setLandData(data);
        } catch (error) {
            console.error("공시지가 조회 실패:", error);
            alert("공공데이터포털 연동 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 bg-[#F8FAFC] min-h-screen font-sans">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-black text-[#002855] tracking-tighter italic">OFFICIAL <span className="text-emerald-500 font-light">LAND PRICE</span></h1>
                <p className="text-slate-500 mt-2 text-sm font-bold">PNU 자동 변환 기술을 통해 국토부 공식 개별공시지가를 조회합니다.</p>
            </header>

            <div className="bg-white p-8 md:p-10 rounded-[40px] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-2/3 space-y-2">
                    <label className="text-[10px] font-black text-emerald-600 uppercase ml-2">Search Address</label>
                    <input 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder="예: 서울특별시 강남구 역삼동 825" 
                        className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-emerald-500" 
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <div className="w-full md:w-1/4 space-y-2">
                    <label className="text-[10px] font-black text-emerald-600 uppercase ml-2">Target Year</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-emerald-500">
                        <option value="2024">2024년</option>
                        <option value="2023">2023년</option>
                        <option value="2022">2022년</option>
                        <option value="2021">2021년</option>
                    </select>
                </div>
                <button 
                    onClick={handleSearch} 
                    disabled={isLoading}
                    className="w-full md:w-auto px-10 py-4 bg-[#002855] hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
                >
                    {isLoading ? '조회 중...' : '데이터 조회'}
                </button>
            </div>

            {pnu && (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center animate-in fade-in">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Extracted PNU Code</p>
                    <p className="text-xl font-mono font-black text-emerald-600 tracking-widest">{pnu}</p>
                </div>
            )}

            {landData && (
                <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-8">
                    <h2 className="text-2xl font-black text-[#002855] mb-6 border-b pb-4">조회 결과</h2>
                    <pre className="bg-slate-900 text-emerald-400 p-6 rounded-2xl text-xs font-mono overflow-auto max-h-96 shadow-inner custom-scrollbar">
                        {JSON.stringify(landData, null, 2)}
                    </pre>
                    <p className="text-[10px] font-bold text-slate-400 mt-4 text-right">※ 공공데이터포털(OpenAPI) 실시간 연동 데이터</p>
                </div>
            )}
        </div>
    );
};

export default OfficialLandPricePage;
