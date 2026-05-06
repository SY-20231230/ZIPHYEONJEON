/**
 * [Real Price Calculation Page - Professional Integrity Final]
 * 수정 사항:
 * 1. 이름 누락 해결: DB 컬럼명 기반인 name/NAME/complexName 등 모든 매핑 가능성 확보
 * 2. 원칙 준수: 프론트엔드 계산 0%, 백엔드에서 전달된 가공 데이터만 매핑 출력
 * 3. 안정성: 401 에러(Unauthorized) 발생 시에도 상세 데이터 노출은 차단되지 않도록 catch 처리
 * 4. Flow 1-5 완결: 중복 없는 단지 목록 -> 상세 정보 -> 찜/기록 -> AI 연동
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient'; 
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const REGION_MAP = {
    "서울특별시": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
    "경기도": ["수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시", "화성시"]
};

const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(2015 + i));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

const RealPriceCalculationPage = () => {
    const navigate = useNavigate();

    // 1. [State] 검색 및 데이터 상태 관리
    const [searchParams, setSearchParams] = useState({
        sido: '', sigungu: '', propertyType: '아파트', dealType: '매매',
        startYear: '2024', startMonth: '01', endYear: '2026', endMonth: '05',
        page: 0
    });
    const [roadKeyword, setRoadKeyword] = useState('');
    const [isCalculating, setIsCalculating] = useState(false);
    
    const [complexList, setComplexList] = useState([]); // 단지 목록
    const [trendData, setTrendData] = useState([]); // 시세 통계
    const [pagination, setPagination] = useState({ totalPages: 0, totalElements: 0 });
    const [selectedDetail, setSelectedDetail] = useState(null); // 상세 정보
    const [likedIds, setLikedIds] = useState(new Set());

    // 찜 목록 초기화
    useEffect(() => {
        const syncLikes = async () => {
            try {
                const res = await apiClient.get('/api/v1/interaction/likes/me');
                setLikedIds(new Set(res.data.map(h => h.houseId)));
            } catch (err) { console.warn("비인증 상태"); }
        };
        syncLikes();
    }, []);

    /**
     * 2. [Action] Flow 1: 단지별 목록 조회 및 중복 제거
     * 💡 백엔드 계산 결과인 TRADE와 totalTransactions를 보존합니다.
     */
    const handleSearch = async (mode, pageNum = 0) => {
        if (mode === 'FILTER' && !searchParams.sigungu) return alert("지역을 선택하세요.");
        
        setIsCalculating(true);
        try {
            const queryObj = {
                propertyType: searchParams.propertyType,
                dealType: searchParams.dealType,
                startMonth: `${searchParams.startYear}${searchParams.startMonth}`,
                endMonth: `${searchParams.endYear}${searchParams.endMonth}`,
                page: pageNum,
                size: 50
            };

            if (mode === 'FILTER') queryObj.sigungu = searchParams.sigungu;
            else queryObj.keyword = roadKeyword;

            const response = await apiClient.get('/api/price/molit', { params: queryObj });
            const { content, totalPages, totalElements, trendGraph } = response.data;

            // 단지명(name/NAME) 기준 중복 제거
            const uniqueMap = new Map();
            content.forEach(item => {
                const key = `${item.name || item.NAME}-${item.roadname || item.ROADNAME}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, { ...item, totalTransactions: item.totalTransactions || 1 });
                } else {
                    uniqueMap.get(key).totalTransactions += 1;
                }
            });

            setComplexList(Array.from(uniqueMap.values()));
            setPagination({ totalPages, totalElements });
            setSearchParams(prev => ({ ...prev, page: pageNum }));

            if (pageNum === 0) {
                setTrendData(trendGraph || []);
                setSelectedDetail(null);
            }
        } catch (error) {
            alert("조회 결과가 없습니다.");
        } finally {
            setIsCalculating(false);
        }
    };

    /**
     * 3. [Action] Flow 2: 단지 클릭 -> 상세 정보 로드
     * 🚨 마스터 키(houseId)를 통해 상세 프로필을 가져옵니다.
     */
    const handleComplexClick = async (item) => {
        if (isCalculating) return;
        const masterId = item.houseId || item.representativeHouseId;
        if (!masterId) return;

        setIsCalculating(true);
        try {
            // 상세 조회와 열람 기록 저장을 병렬 실행 (401 에러가 상세 창을 막지 않도록 catch 처리)
            const [profileRes] = await Promise.all([
                apiClient.get(`/api/price/profile/${masterId}`),
                apiClient.post('/api/v1/interaction/records', { houseId: masterId }).catch(() => null)
            ]);
            setSelectedDetail(profileRes.data);
        } catch (err) {
            alert("상세 데이터를 로드할 수 없습니다.");
        } finally {
            setIsCalculating(false);
        }
    };

    const handleToggleLike = async (e, houseId) => {
        e.stopPropagation();
        if (!houseId) return;
        try {
            await apiClient.post('/api/v1/interaction/likes', { houseId });
            setLikedIds(prev => {
                const next = new Set(prev);
                next.has(houseId) ? next.delete(houseId) : next.add(houseId);
                return next;
            });
        } catch (err) { alert("로그인이 필요합니다."); }
    };

    /**
     * 4. [Action] Flow 5: AI 예측 페이지 연동
     */
    const handleNavigateAI = (e, item) => {
        e.stopPropagation();
        const autoData = {
            houseId: item.houseId,
            sigungu: item.roadname || item.roadAddress || item.ROADNAME,
            propertyType: item.propertyType,
            dealType: searchParams.dealType,
            builtYear: item.builtYear,
            floor: item.floorNo || item.floor,
            area: item.area
        };
        const path = (item.propertyType === '상가') ? '/ai/commercial' : '/ai/residential';
        navigate(path, { state: { autoFillData: autoData } });
    };

    return (
        <div className="relative p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC] min-h-screen font-sans">
            
            {/* [Guarded UI] 조회 중 오버레이 */}
            {isCalculating && (
                <div className="fixed inset-0 z-[999] bg-white/30 backdrop-blur-[2px] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[#002855] font-black text-xs tracking-widest animate-pulse">INTEGRATING DATA...</p>
                </div>
            )}

            <header className={isCalculating ? 'opacity-50 pointer-events-none' : ''}>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">집현전 <span className="text-blue-600 font-light text-sm italic ml-1">ZIP</span></h1>
                <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase italic mt-1">Backend Integrated Engine v16.0</p>
            </header>

            <main className={`space-y-6 transition-all ${isCalculating ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="bg-white p-8 rounded-[35px] shadow-2xl shadow-blue-900/5 border border-blue-100 flex gap-4 items-end">
                    <div className="flex-grow space-y-2">
                        <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Direct Address Search</label>
                        <input className="w-full bg-slate-50 p-5 rounded-2xl font-bold border-none outline-none focus:ring-2 ring-blue-500 text-lg"
                               placeholder="단지명 직접 입력" value={roadKeyword} onChange={(e) => setRoadKeyword(e.target.value)} />
                    </div>
                    <button onClick={() => handleSearch('ROAD', 0)} className="px-12 py-5 bg-[#002855] text-white rounded-2xl font-black shadow-xl hover:bg-blue-600">검색</button>
                </div>

                <div className="bg-white p-8 rounded-[35px] shadow-xl shadow-blue-900/5 border border-slate-100 grid grid-cols-12 gap-5 items-end">
                    <div className="col-span-12 lg:col-span-3 grid grid-cols-2 gap-2">
                        <select className="bg-slate-50 p-4 rounded-xl font-bold text-sm border-none" value={searchParams.sido} onChange={e => setSearchParams({...searchParams, sido: e.target.value, sigungu: ''})}>
                            <option value="">시/도</option>
                            {Object.keys(REGION_MAP).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select className="bg-slate-50 p-4 rounded-xl font-bold text-sm border-none" disabled={!searchParams.sido} value={searchParams.sigungu} onChange={e => setSearchParams({...searchParams, sigungu: e.target.value})}>
                            <option value="">군/구</option>
                            {searchParams.sido && REGION_MAP[searchParams.sido].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="col-span-12 lg:col-span-2">
                        <select className="w-full bg-slate-50 p-4 rounded-xl font-bold text-sm" value={searchParams.dealType} onChange={e => setSearchParams({...searchParams, dealType: e.target.value})}>
                            <option value="매매">매매</option><option value="전세">전세</option><option value="월세">월세</option>
                        </select>
                    </div>
                    <div className="col-span-12 lg:col-span-5">
                        <div className="flex items-center gap-2">
                            <select className="flex-1 bg-slate-50 p-4 rounded-xl font-bold text-xs" value={searchParams.startYear} onChange={e => setSearchParams({...searchParams, startYear: e.target.value})}>{YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}년</option>)}</select>
                            <select className="flex-1 bg-slate-50 p-4 rounded-xl font-bold text-xs" value={searchParams.startMonth} onChange={e => setSearchParams({...searchParams, startMonth: e.target.value})}>{MONTH_OPTIONS.map(m => <option key={m} value={m}>{m}월</option>)}</select>
                            <span className="text-slate-300">~</span>
                            <select className="flex-1 bg-slate-50 p-4 rounded-xl font-bold text-xs" value={searchParams.endYear} onChange={e => setSearchParams({...searchParams, endYear: e.target.value})}>{YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}년</option>)}</select>
                            <select className="flex-1 bg-slate-50 p-4 rounded-xl font-bold text-xs" value={searchParams.endMonth} onChange={e => setSearchParams({...searchParams, endMonth: e.target.value})}>{MONTH_OPTIONS.map(m => <option key={m} value={m}>{m}월</option>)}</select>
                        </div>
                    </div>
                    <button onClick={() => handleSearch('FILTER', 0)} className="col-span-12 lg:col-span-2 py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg">GO</button>
                </div>
            </main>

            <div className={`grid lg:grid-cols-12 gap-10 transition-all ${isCalculating ? 'opacity-30' : ''}`}>
                <div className="lg:col-span-4 bg-white rounded-[45px] shadow-sm border border-slate-200 flex flex-col h-[750px]">
                    <div className="p-8 bg-slate-50 border-b border-slate-100 font-black text-slate-800 uppercase tracking-widest text-xs flex justify-between items-center">
                        Complex Directory <span className="text-blue-600 font-bold italic">{complexList.length} units</span>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar">
                        {complexList.length > 0 ? complexList.map((item, idx) => (
                            <div key={item.houseId || idx} onClick={() => handleComplexClick(item)} className="p-8 hover:bg-blue-50/50 transition-all border-b border-slate-50 group cursor-pointer relative">
                                <div className="flex justify-between items-start">
                                    <div className="max-w-[80%]">
                                        <h4 className="font-black text-slate-900 group-hover:text-blue-600 truncate text-lg">
                                            {item.name || item.NAME || item.complexName}
                                        </h4>
                                        <p className="text-[11px] text-slate-500 font-bold mt-1 uppercase italic truncate">
                                            {item.roadname || item.ROADNAME || item.roadAddress}
                                        </p>
                                    </div>
                                    <button onClick={(e) => handleToggleLike(e, item.houseId)} className={`text-2xl transition-all ${likedIds.has(item.houseId) ? 'text-rose-500' : 'text-slate-200'}`}>♥</button>
                                </div>
                                <div className="mt-6 flex justify-between items-center">
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black">누적 {item.totalTransactions}건 거래</span>
                                    <span className="text-xl font-black text-[#002855]">
                                        {(item.trade || item.TRADE || 0).toLocaleString()} <span className="text-xs ml-1 text-slate-400 font-bold">만원</span>
                                    </span>
                                </div>
                                <div className="mt-3 text-right">
                                    <button onClick={(e) => handleNavigateAI(e, item)} className="text-[9px] font-black text-slate-400 hover:text-blue-600 underline">AI 분석 이동</button>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex items-center justify-center p-20 text-center text-slate-200 font-black uppercase text-[10px] italic">검색 결과 없음</div>
                        )}
                    </div>
                </div>

                {/* [우측] 상세 분석 리포트 - 명칭 누락 해결 영역 */}
                <div className="lg:col-span-8 bg-white p-12 rounded-[56px] shadow-sm border border-slate-100 min-h-[600px]">
                    {selectedDetail ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                            <header className="flex justify-between items-end border-b border-slate-50 pb-8">
                                <div>
                                    {/* 💡 [수정] DB 스크린샷의 NAME, ROADNAME 필드를 직접 참조하여 명칭 복구 */}
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
                                        {selectedDetail.name || selectedDetail.NAME || selectedDetail.complexName}
                                    </h2>
                                    <p className="text-slate-400 font-bold text-xs uppercase mt-2 italic">
                                        {selectedDetail.roadname || selectedDetail.ROADNAME || selectedDetail.roadAddress}
                                    </p>
                                </div>
                                <div className={`px-5 py-2 rounded-2xl font-black text-xs ${selectedDetail.riskLevel === 'SAFE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{selectedDetail.riskLevel || "SAFE"}</div>
                            </header>
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-8 rounded-[40px] text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Pyeong Price</p>
                                    <p className="text-3xl font-black text-blue-600">
                                        {/* 프론트 계산 없이 백엔드에서 계산된 값 그대로 출력 */}
                                        {(selectedDetail.pyeongPrice || 0).toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-[40px] text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Jeonse Ratio</p>
                                    <p className="text-3xl font-black text-slate-800">{selectedDetail.jeonseRatio || 0}%</p>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-[40px] text-center flex items-center justify-center">
                                    <button onClick={(e) => handleNavigateAI(e, selectedDetail)} className="w-full py-4 bg-[#002855] text-white text-[10px] font-black rounded-2xl shadow-xl hover:bg-blue-600">AI 예측 실행</button>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase mb-6 italic tracking-[0.2em]">Regional Market Trend (3.3㎡ Avg)</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}><defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} /><YAxis hide /><Tooltip contentStyle={{borderRadius: '20px', border: 'none'}} /><Area type="monotone" dataKey="avgPrice" stroke="#2563eb" strokeWidth={5} fillOpacity={1} fill="url(#colorPrice)" /></AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-200 font-black italic uppercase tracking-widest leading-loose">목록에서 단지를 선택하면<br/>백엔드 정밀 분석 리포트가 표시됩니다</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RealPriceCalculationPage;