import React, { useState } from 'react';
import apiClient from '../../api/apiClient';

const DataDownloadPage = () => {
    const [inputs, setInputs] = useState({
        sido_code: '11',
        sigungu_code: '11590',
        format: 'csv',
        year: '2024'
    });
    const [isDownloading, setIsDownloading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const url = `/api/price/download?sido_code=${inputs.sido_code}&sigungu_code=${inputs.sigungu_code}&format=${inputs.format}&year=${inputs.year}`;
            
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
                <h1 className="text-4xl font-black text-[#002855] tracking-tighter italic">DATA <span className="text-rose-500 font-light">DOWNLOAD CENTER</span></h1>
                <p className="text-slate-500 mt-2 text-sm font-bold">연구원, 데이터 분석가를 위한 시군구별 실거래가 원천 데이터 추출 시스템입니다.</p>
            </header>

            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-slate-100 flex flex-col items-center">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8">
                    <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>

                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase ml-2">시도 코드 (SIDO CODE)</label>
                        <select name="sido_code" value={inputs.sido_code} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-rose-500">
                            <option value="11">서울특별시 (11)</option>
                            <option value="41">경기도 (41)</option>
                            <option value="26">부산광역시 (26)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase ml-2">시군구 코드 (SIGUNGU CODE)</label>
                        <input name="sigungu_code" value={inputs.sigungu_code} onChange={handleInputChange} placeholder="예: 11590 (동작구)" className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-rose-500" />
                        <p className="text-[9px] text-slate-400 font-bold ml-2">※ 법정동 코드 앞 5자리를 입력하세요.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase ml-2">조회 연도 (YEAR)</label>
                        <select name="year" value={inputs.year} onChange={handleInputChange} className="w-full bg-slate-50 p-4 rounded-2xl font-bold border-none focus:ring-2 focus:ring-rose-500">
                            <option value="2024">2024년</option>
                            <option value="2023">2023년</option>
                            <option value="2022">2022년</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-600 uppercase ml-2">추출 포맷 (FORMAT)</label>
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
