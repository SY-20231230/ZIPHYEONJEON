import React, { useState, useMemo } from 'react';
import apiClient from 'api/apiClient';
import CommercialSubNav from './CommercialSubNav';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const PopulationAnalysisPage = () => {
    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAddress, setSelectedAddress] = useState('');

    // Core Data States
    const [dailyDataMap, setDailyDataMap] = useState({});
    const [dateList, setDateList] = useState([]);
    const [baseDate, setBaseDate] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [availableRange, setAvailableRange] = useState({ start: '', end: '' });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Calendar Step States
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [calStep, setCalStep] = useState('year'); // 'year', 'month', 'day'
    const [tmpYear, setTmpYear] = useState('');
    const [tmpMonth, setTmpMonth] = useState('');

    const formatFullDate = (d) => {
        if (!d) return '';
        return `${d.slice(0, 4)}년 ${d.slice(4, 6)}월 ${d.slice(6, 8)}일`;
    };

    const summaryMetrics = useMemo(() => {
        if (!selectedDate || !dailyDataMap[selectedDate]) return null;
        const currentTotal = dailyDataMap[selectedDate].total;
        const dateIdx = dateList.indexOf(selectedDate);
        const prevDate = dateList[dateIdx + 1];
        const prevTotal = prevDate ? dailyDataMap[prevDate].total : null;
        const deltaPrev = prevTotal ? ((currentTotal - prevTotal) / prevTotal * 100).toFixed(1) : null;
        const allTotals = dateList.map(d => dailyDataMap[d].total);
        const monthAvg = allTotals.reduce((a, b) => a + b, 0) / allTotals.length;
        const deltaMonth = ((currentTotal - monthAvg) / monthAvg * 100).toFixed(1);

        return {
            total: Math.round(currentTotal),
            deltaPrev,
            deltaMonth,
            isPrevUp: parseFloat(deltaPrev) > 0,
            isMonthUp: parseFloat(deltaMonth) > 0
        };
    }, [selectedDate, dailyDataMap, dateList]);

    const chartData = useMemo(() => {
        if (!selectedDate || !dailyDataMap[selectedDate]) return [];
        const businessHours = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3];
        const rawHours = dailyDataMap[selectedDate].hours;
        return businessHours.map(h => ({
            time: `${String(h).padStart(2, '0')}시`,
            pop: Math.round(rawHours[h] || 0)
        }));
    }, [selectedDate, dailyDataMap]);

    const handleSearch = async () => {
        const trimmedTerm = searchTerm.trim();
        if (!trimmedTerm) {
            setSearchError("조회할 행정동명을 입력해 주세요.");
            setIsModalOpen(true);
            return;
        }

        const isNotDong = trimmedTerm.endsWith('시') || trimmedTerm.endsWith('구') || !trimmedTerm.endsWith('동');
        if (isNotDong) {
            setSearchError("상세 행정동 명칭을 입력해 주세요. (예: 역삼1동)\n'시' 또는 '구' 단위는 조회가 불가능합니다.");
            setIsModalOpen(true);
            return;
        }

        setIsSearching(true);
        setSearchError('');
        try {
            const res = await apiClient.get('/api/populations', {
                params: { address: trimmedTerm }
            });

            if (res.data && res.data.length > 0) {
                const indexed = res.data.reduce((acc, item) => {
                    const date = item.REFERENCE_DATE;
                    if (!acc[date]) acc[date] = { hours: Array(24).fill(0), total: 0 };
                    acc[date].hours[item.HOURS] = item.POPULATION_COUNT;
                    acc[date].total += item.POPULATION_COUNT;
                    return acc;
                }, {});

                const sortedDates = Object.keys(indexed).sort((a, b) => b.localeCompare(a));

                setDailyDataMap(indexed);
                setDateList(sortedDates);
                setAvailableRange({
                    start: sortedDates[sortedDates.length - 1],
                    end: sortedDates[0]
                });

                setBaseDate(sortedDates[0]);
                setSelectedDate(sortedDates[0]);
                setSelectedAddress(trimmedTerm);
            } else {
                setSearchError("해당 지역의 데이터를 찾을 수 없습니다.");
                setIsModalOpen(true);
            }
        } catch (error) {
            setSearchError("데이터 조회 중 오류가 발생했습니다.");
            setIsModalOpen(true);
        } finally {
            setIsSearching(false);
        }
    };

    const availableYears = useMemo(() => {
        return [...new Set(dateList.map(d => d.slice(0, 4)))].sort((a, b) => a - b);
    }, [dateList]);

    const availableMonths = useMemo(() => {
        if (!tmpYear) return [];
        return [...new Set(dateList.filter(d => d.startsWith(tmpYear)).map(d => d.slice(4, 6)))].sort((a, b) => a - b);
    }, [dateList, tmpYear]);

    const availableDays = useMemo(() => {
        if (!tmpYear || !tmpMonth) return [];
        return dateList.filter(d => d.startsWith(tmpYear + tmpMonth)).map(d => d.slice(6, 8)).sort((a, b) => a - b);
    }, [dateList, tmpYear, tmpMonth]);

    const openCalendar = () => {
        setCalStep('year');
        setIsCalendarOpen(true);
    };

    const handleYearPick = (year) => {
        setTmpYear(year);
        setCalStep('month');
    };

    const handleMonthPick = (month) => {
        setTmpMonth(month);
        setCalStep('day');
    };

    const handleDayPick = (day) => {
        const fullDate = tmpYear + tmpMonth + day;
        setBaseDate(fullDate);
        setSelectedDate(fullDate);
        setIsCalendarOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8">
            <header className="max-w-7xl mx-auto mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">🏢 상권 유동인구 분석</h1>
                    <p className="text-slate-500 font-bold mt-2">유동인구의 지역별, 시간대별 분석으로 상권의 활성도 변화를 객관적 지표로 제공합니다.</p>
                </div>
                {selectedAddress && (
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-lg font-black text-slate-800">{selectedAddress} 분석 중</span>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto">
                <CommercialSubNav />

                <div className="grid lg:grid-cols-12 gap-8">
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                <span className="text-2xl">🔍</span> 지역 선택
                            </h3>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-600 ml-1">행정동 검색</label>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="예: 역삼1동"
                                        className="w-full p-5 bg-slate-50 rounded-2xl font-black border-none focus:ring-2 focus:ring-blue-500 text-lg shadow-inner"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:bg-slate-100 text-lg"
                                >
                                    {isSearching ? "데이터 분석 중..." : "분석 시작하기"}
                                </button>
                            </div>
                        </div>

                        {dateList.length > 0 && (
                            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                                <div className="mb-6">
                                    <h3 className="text-lg font-black flex items-center gap-2">
                                        <span>📅 주간 유동인구</span>
                                        <span className="text-xs text-slate-400">조회된 날짜: 총 {dateList.length}일</span>
                                    </h3>
                                    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-[12px] text-blue-700 font-black">
                                            {formatFullDate(availableRange.start)} ~ {formatFullDate(availableRange.end)}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center ml-1 mb-2">
                                        <h4 className="text-sm font-black text-slate-600">주간 흐름 리스트</h4>
                                        <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                            {baseDate.slice(0, 4)}년 {baseDate.slice(4, 6)}월
                                        </span>
                                    </div>
                                    {(() => {
                                        const baseIdx = dateList.indexOf(baseDate);
                                        const displayList = baseIdx !== -1
                                            ? dateList.slice(baseIdx, baseIdx + 7)
                                            : dateList.slice(0, 7);

                                        return displayList.map(date => (
                                            <button
                                                key={date}
                                                onClick={() => setSelectedDate(date)}
                                                className={`w-full flex justify-between items-center p-5 rounded-2xl transition-all font-black ${selectedDate === date
                                                    ? 'bg-blue-600 text-white shadow-xl scale-[1.03]'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-sm'
                                                    }`}
                                            >
                                                <span className="text-lg">{date.slice(6, 8)}일</span>
                                                <span className="text-sm opacity-80">{dailyDataMap[date].total.toLocaleString()} 명</span>
                                            </button>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </aside>

                    <section className="lg:col-span-8 space-y-6">
                        {selectedDate ? (
                            <>
                                <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-blue-600 rounded-[32px] flex items-center justify-center text-white text-3xl shadow-2xl shadow-blue-200">
                                            🗓️
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] mb-1">선택된 날짜</p>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                                                {formatFullDate(selectedDate)}
                                            </h2>
                                        </div>
                                    </div>
                                    <button
                                        onClick={openCalendar}
                                        className="px-10 py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-blue-600 transition-all shadow-2xl active:scale-95 flex items-center gap-3"
                                    >
                                        <span>조회 날짜 선택</span>
                                        <span className="text-2xl">➔</span>
                                    </button>
                                </div>

                                {/* Metrics Grid with optimized spans for high-value data */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                    <div className="md:col-span-5 bg-white p-8 md:p-10 rounded-[48px] shadow-sm border border-slate-100 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150 opacity-50"></div>
                                        <p className="text-sm text-slate-500 font-black mb-3 tracking-widest uppercase">총 유동인구</p>
                                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-none flex items-baseline gap-2 overflow-hidden">
                                            <span className="truncate">{summaryMetrics.total.toLocaleString()}</span>
                                            <span className="text-lg text-slate-400 font-bold whitespace-nowrap shrink-0">명</span>
                                        </h2>
                                    </div>

                                    <div className="md:col-span-3 bg-white p-8 md:p-10 rounded-[48px] shadow-sm border border-slate-100 flex flex-col justify-center">
                                        <p className="text-sm text-slate-500 font-black mb-3 tracking-widest uppercase">전일 대비</p>
                                        <h2 className={`text-3xl md:text-4xl font-black whitespace-nowrap ${summaryMetrics.isPrevUp ? 'text-rose-500' : 'text-blue-500'}`}>
                                            {summaryMetrics.deltaPrev ? `${summaryMetrics.isPrevUp ? '▲' : '▼'} ${Math.abs(summaryMetrics.deltaPrev)}%` : '--'}
                                        </h2>
                                    </div>

                                    <div className="md:col-span-4 bg-white p-8 md:p-10 rounded-[48px] shadow-sm border border-slate-100 flex flex-col justify-center">
                                        <p className="text-sm text-slate-500 font-black mb-3 tracking-widest uppercase">월평균 대비</p>
                                        <h2 className={`text-3xl md:text-4xl font-black whitespace-nowrap ${summaryMetrics.isMonthUp ? 'text-rose-500' : 'text-blue-500'}`}>
                                            {summaryMetrics.deltaMonth ? `${summaryMetrics.isMonthUp ? '▲' : '▼'} ${Math.abs(summaryMetrics.deltaMonth)}%` : '--'}
                                        </h2>
                                    </div>
                                </div>

                                <div className="bg-white p-12 rounded-[56px] shadow-sm border border-slate-100">
                                    <div className="mb-12">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tighter">시간대별 유동인구 추이</h3>
                                        <p className="text-sm text-slate-500 font-black mt-2">※ 04시(익일 03시) 기준 상권 생활 주기 분석</p>
                                    </div>
                                    <div className="h-[450px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 900 }} dy={15} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', fontWeight: '900', padding: '20px', fontSize: '15px' }}
                                                    cursor={{ stroke: '#3b82f6', strokeWidth: 3, strokeDasharray: '6 6' }}
                                                />
                                                <Area type="monotone" dataKey="pop" stroke="#2563eb" strokeWidth={6} fillOpacity={1} fill="url(#colorPop)" name="유동인구수" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-24 bg-white rounded-[56px] border-4 border-dashed border-slate-100">
                                <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center text-5xl mb-8 shadow-inner">📊</div>
                                <h3 className="text-3xl font-black text-slate-900 mb-4">분석할 행정동을 선택해 주세요</h3>
                                <p className="text-slate-500 font-black text-lg leading-relaxed">
                                    행정동 명칭(예: 역삼1동)을 입력하면<br />
                                    전문가용 유동인구 분석 보드가 활성화됩니다.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* 단계별 커스텀 날짜 선택 모달 - 반응형 및 스크롤 최적화 */}
            {isCalendarOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-[10000] p-4 md:p-6">
                    <div className="bg-white rounded-[48px] md:rounded-[64px] shadow-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in fade-in duration-500 border border-white/20">
                        {/* Fixed Header */}
                        <div className="bg-slate-900 p-8 md:p-12 text-white shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl md:text-3xl font-black tracking-tighter">원하시는 날짜를 선택하세요.</h3>
                                <button onClick={() => setIsCalendarOpen(false)} className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-2xl md:text-3xl font-bold">✕</button>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 text-blue-400 font-black text-sm md:text-lg">
                                <span className={calStep === 'year' ? 'text-white' : 'opacity-50'}>연도 선택</span>
                                <span className="opacity-30">❯</span>
                                <span className={calStep === 'month' ? 'text-white' : 'opacity-50'}>{tmpYear ? `${tmpYear}년` : '월 선택'}</span>
                                <span className="opacity-30">❯</span>
                                <span className={calStep === 'day' ? 'text-white' : 'opacity-50'}>{tmpMonth ? `${tmpMonth}월` : '일 선택'}</span>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-grow bg-white">
                            {calStep === 'year' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {availableYears.map(year => (
                                        <button
                                            key={year}
                                            onClick={() => handleYearPick(year)}
                                            className="group p-8 md:p-10 bg-slate-50 rounded-[32px] md:rounded-[40px] text-center hover:bg-blue-600 transition-all shadow-sm hover:shadow-2xl active:scale-95"
                                        >
                                            <span className="text-4xl md:text-5xl font-black text-slate-900 group-hover:text-white">{year}</span>
                                            <p className="mt-3 text-xs md:text-sm text-slate-400 font-black group-hover:text-blue-100">데이터가 있는 연도입니다</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {calStep === 'month' && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                    {availableMonths.map(month => (
                                        <button
                                            key={month}
                                            onClick={() => handleMonthPick(month)}
                                            className="p-6 md:p-8 bg-slate-50 rounded-[24px] md:rounded-[32px] text-center hover:bg-blue-600 transition-all group"
                                        >
                                            <span className="text-3xl md:text-4xl font-black text-slate-900 group-hover:text-white">{parseInt(month)}월</span>
                                        </button>
                                    ))}
                                    <button onClick={() => setCalStep('year')} className="col-span-full mt-6 py-4 text-slate-400 font-black hover:text-slate-900 transition-all flex items-center justify-center gap-2">❮ 연도 다시 선택하기</button>
                                </div>
                            )}

                            {calStep === 'day' && (
                                <div className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-3">
                                    {availableDays.map(day => (
                                        <button
                                            key={day}
                                            onClick={() => handleDayPick(day)}
                                            className="p-4 md:p-6 bg-slate-50 rounded-xl md:rounded-2xl text-center hover:bg-blue-600 transition-all group active:scale-90"
                                        >
                                            <span className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-white">{parseInt(day)}</span>
                                            <p className="text-[10px] font-black text-slate-400 group-hover:text-blue-100">일</p>
                                        </button>
                                    ))}
                                    <button onClick={() => setCalStep('month')} className="col-span-full mt-6 py-4 text-slate-400 font-black hover:text-slate-900 transition-all flex items-center justify-center gap-2">❮ 월 다시 선택하기</button>
                                </div>
                            )}
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 md:p-8 bg-slate-50 flex justify-center shrink-0 border-t border-slate-100">
                            <p className="text-xs md:text-sm font-black text-slate-400">데이터가 확보된 날짜만 선택 가능합니다</p>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[11000] p-6">
                    <div className="bg-white p-12 md:p-16 rounded-[48px] md:rounded-[64px] shadow-3xl max-w-md w-full text-center border border-slate-50 animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-rose-50 text-rose-500 rounded-[32px] md:rounded-[40px] flex items-center justify-center text-4xl md:text-5xl mx-auto mb-8 md:mb-10 shadow-inner">📍</div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6 md:mb-8 whitespace-pre-line leading-[1.4] tracking-tighter">
                            {searchError}
                        </h3>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-5 md:py-6 bg-slate-900 text-white rounded-[24px] md:rounded-3xl font-black hover:bg-blue-600 transition-all shadow-2xl active:scale-95 text-lg md:text-xl"
                        >
                            확인했습니다
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
};

export default PopulationAnalysisPage;
