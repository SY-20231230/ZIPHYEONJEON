import React, { useState } from 'react';
import apiClient from '../../api/apiClient';

const DataDownloadPage = () => {
    const [inputs, setInputs] = useState({
        sido_code: '11',
        sigungu_code: '11680',
        property_type: '',
        deal_type: '',
        format: 'csv',
        year: '2025'
    });
    const [isDownloading, setIsDownloading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const url = `/api/price/download?sido_code=${inputs.sido_code}&sigungu_code=${inputs.sigungu_code}&property_type=${inputs.property_type}&deal_type=${inputs.deal_type}&format=${inputs.format}&year=${inputs.year}`;

            // 파일 다운로드를 위해 responseType을 blob으로 설정
            const res = await apiClient.get(url, { responseType: 'blob' });

            // Blob URL 생성 및 가상 링크로 다운로드 트리거
            const blob = new Blob([res.data], { type: inputs.format === 'csv' ? 'text/csv' : 'application/json' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `trade_data_${inputs.sigungu_code}.${inputs.format}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

        } catch (error) {
            console.error("다운로드 실패:", error);
            alert("데이터 추출 중 오류가 발생했습니다. 백엔드 지원 포맷을 확인해주세요.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 bg-[#F8FAFC] min-h-screen font-sans">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-black text-[#002855] tracking-tighter italic">실거래가 <span className="text-rose-500 font-light">다운로드 센터</span></h1>
                <p className="text-slate-500 mt-2 text-sm font-bold">연구원, 데이터 분석가를 위한 시군구별 실거래가 원천 데이터 추출 시스템입니다.</p>
            </header>

            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-slate-100 flex flex-col items-center">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8">
                    <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>

                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase ml-2">시도 선택</label>
                        <select name="sido_code" value={inputs.sido_code} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none text-slate-500 cursor-not-allowed">
                            <option value="11">서울특별시</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase ml-2">시군구 선택</label>
                        <select name="sigungu_code" value={inputs.sigungu_code} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-rose-500">
                            <option value="11680">강남구</option>
                            <option value="11740">강동구</option>
                            <option value="11305">강북구</option>
                            <option value="11500">강서구</option>
                            <option value="11620">관악구</option>
                            <option value="11215">광진구</option>
                            <option value="11530">구로구</option>
                            <option value="11545">금천구</option>
                            <option value="11350">노원구</option>
                            <option value="11320">도봉구</option>
                            <option value="11230">동대문구</option>
                            <option value="11590">동작구</option>
                            <option value="11440">마포구</option>
                            <option value="11410">서대문구</option>
                            <option value="11650">서초구</option>
                            <option value="11200">성동구</option>
                            <option value="11290">성북구</option>
                            <option value="11710">송파구</option>
                            <option value="11470">양천구</option>
                            <option value="11560">영등포구</option>
                            <option value="11170">용산구</option>
                            <option value="11380">은평구</option>
                            <option value="11110">종로구</option>
                            <option value="11140">중구</option>
                            <option value="11260">중랑구</option>
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                            <label className="text-[10px] font-black text-rose-600 uppercase ml-2">매물 유형</label>
                            <select name="property_type" value={inputs.property_type} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-rose-500">
                                <option value="">전체</option>
                                <option value="아파트">아파트</option>
                                <option value="오피스텔">오피스텔</option>
                                <option value="연립다세대">연립다세대</option>
                            </select>
                        </div>
                        <div className="space-y-2 flex-1">
                            <label className="text-[10px] font-black text-rose-600 uppercase ml-2">거래 유형</label>
                            <select name="deal_type" value={inputs.deal_type} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-rose-500">
                                <option value="">전체</option>
                                <option value="매매">매매</option>
                                <option value="전세">전세</option>
                                <option value="월세">월세</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase ml-2">조회 연도</label>
                        <select name="year" value={inputs.year} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-rose-500">
                            <option value="2026">2026년 (3월까지)</option>
                            <option value="2025">2025년</option>
                            <option value="2024">2024년</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase ml-2">추출 포맷</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 py-4 text-center rounded-2xl font-black cursor-pointer transition-all ${inputs.format === 'csv' ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                <input type="radio" name="format" value="csv" checked={inputs.format === 'csv'} onChange={handleInputChange} className="hidden" />
                                CSV
                            </label>
                            <label className={`flex-1 py-4 text-center rounded-2xl font-black cursor-pointer transition-all ${inputs.format === 'json' ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                <input type="radio" name="format" value="json" checked={inputs.format === 'json'} onChange={handleInputChange} className="hidden" />
                                JSON
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full bg-[#002855] hover:bg-rose-600 text-white p-5 rounded-2xl font-black shadow-lg transition-all mt-8 disabled:opacity-50 tracking-wider"
                    >
                        {isDownloading ? '데이터 생성 및 추출 중...' : '원천 데이터 다운로드 시작'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataDownloadPage;
