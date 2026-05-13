import React, { useState, useEffect, useMemo } from 'react';
import apiClient from 'api/apiClient';
import CommercialSubNav from './CommercialSubNav';
import {
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
    ReferenceArea, ReferenceLine
} from 'recharts';

const IndustryAnalysisPage = () => {
    // 1. 상태 관리
    const [searchTerm, setSearchTerm] = useState('');
    const [industryData, setIndustryData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedArea, setSelectedArea] = useState('역삼1동');
    const [hoveredCluster, setHoveredCluster] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 10;

    // 2. 초기 로드 및 검색
    useEffect(() => {
        handleSearch("역삼1동");
    }, []);

    const handleSearch = async (term = searchTerm) => {
        const target = term.trim() || "역삼1동";
        setIsLoading(true);
        setCurrentPage(0);
        try {
            const res = await apiClient.get('/api/industry/code', {
                params: { address: target }
            });
            setIndustryData(res.data || []);
            setSelectedArea(target);
        } catch (error) {
            console.error("데이터 조회 실패:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const CLASSIFICATION_RULES = [
        { name: '카페/디저트', regex: /커피|카페|제과|빵|디저트|베이커리/, color: '#00F5FF' },
        { name: '식음료', regex: /음식점|식당|치킨|호프|주점|분식|고기|식사/, color: '#FF007F' },
        { name: '소매/유통', regex: /편의점|슈퍼|마트|식료품|청과|시장/, color: '#ADFF2F' },
        { name: '의료/약국', regex: /의원|병원|약국|한의원|치과/, color: '#FFD700' },
        { name: '교육/학원', regex: /학원|교습|독서실|공부방/, color: '#BF00FF' },
        { name: '패션/생활', regex: /의류|신발|화장품|안경|가구/, color: '#FF4500' },
        { name: '뷰티/케어', regex: /미용|헤어|네일|피부|마사지/, color: '#F0E68C' },
        { name: '여가/오락', regex: /헬스|연습장|당구|PC방|노래방/, color: '#1E90FF' },
        { name: '전문서비스', regex: /부동산|중개|세탁|수리|세무|법무/, color: '#00FA9A' },
        { name: '문화/기타', regex: /사진|꽃|화원|서점|예술|종교/, color: '#808080' }
    ];

    const chartData = useMemo(() => {
        if (!industryData.length) return { scatter: [], pie: [], frc: [], metrics: { total: 0, open: 0, close: 0, frc: 0 } };

        const clusterMap = {};
        CLASSIFICATION_RULES.forEach(rule => {
            clusterMap[rule.name] = {
                name: rule.name, color: rule.color, totalShop: 0,
                weightedOpenSum: 0, weightedCloseSum: 0, totalFrc: 0, subIndustries: []
            };
        });
        clusterMap['기타'] = { name: '기타', color: '#cbd5e1', totalShop: 0, weightedOpenSum: 0, weightedCloseSum: 0, totalFrc: 0, subIndustries: [] };

        industryData.forEach(item => {
            const rule = CLASSIFICATION_RULES.find(r => r.regex.test(item.svcIndutyNm)) || { name: '기타' };
            const cluster = clusterMap[rule.name];
            cluster.totalShop += (item.shopCount || 0);
            cluster.weightedOpenSum += (item.opbizRt * item.shopCount);
            cluster.weightedCloseSum += (item.clsbizRt * item.shopCount);
            cluster.totalFrc += (item.frcShopCount || 0);
            if (cluster.subIndustries.length < 3) cluster.subIndustries.push({ name: item.svcIndutyNm, count: item.shopCount });
        });

        const activeClusters = Object.values(clusterMap).filter(c => c.totalShop > 0);
        if (!activeClusters.length) return { scatter: [], pie: [], frc: [], metrics: { total: 0, open: 0, close: 0, frc: 0 } };

        const total = activeClusters.reduce((acc, cur) => acc + cur.totalShop, 0);
        const totalFrc = activeClusters.reduce((acc, cur) => acc + cur.totalFrc, 0);

        const clusterRates = activeClusters.map(c => ({
            open: c.weightedOpenSum / c.totalShop,
            close: c.weightedCloseSum / c.totalShop
        }));

        const getStats = (arr) => {
            const n = arr.length;
            const mean = arr.reduce((a, b) => a + b, 0) / n;
            const std = Math.sqrt(arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n) || 1;
            return { mean, std };
        };

        const openStats = getStats(clusterRates.map(r => r.open));
        const closeStats = getStats(clusterRates.map(r => r.close));

        const scatter = activeClusters.map(c => {
            const rawOpen = c.weightedOpenSum / c.totalShop;
            const rawClose = c.weightedCloseSum / c.totalShop;
            return {
                x: (rawOpen - openStats.mean) / openStats.std,
                y: (rawClose - closeStats.mean) / closeStats.std,
                z: c.totalShop,
                name: c.name,
                color: c.color,
                realX: rawOpen,
                realY: rawClose,
                sub: c.subIndustries.map(s => s.name).join(', ')
            };
        });

        const pie = scatter.map(s => ({ name: s.name, value: s.z, color: s.color })).sort((a, b) => b.value - a.value);

        const frcData = activeClusters
            .filter(c => c.totalFrc > 0)
            .map(c => {
                const compositionShare = totalFrc > 0 ? (c.totalFrc / totalFrc) * 100 : 0;
                return { name: c.name, color: c.color, ratio: Number(compositionShare.toFixed(1)) };
            }).sort((a, b) => b.ratio - a.ratio);

        const regionalFrcRate = total > 0 ? (totalFrc / total) * 100 : 0;

        return {
            scatter, pie, frc: frcData,
            metrics: {
                total,
                open: openStats.mean.toFixed(1),
                close: closeStats.mean.toFixed(1),
                frc: regionalFrcRate.toFixed(1)
            }
        };
    }, [industryData]);

    const chartDomain = useMemo(() => {
        if (!chartData.scatter.length) return [-3, 3];
        const maxVal = Math.max(...chartData.scatter.map(s => Math.max(Math.abs(s.x), Math.abs(s.y))), 1);
        const padded = Math.ceil(maxVal + 0.5);
        return [-padded, padded];
    }, [chartData.scatter]);

    const paginatedData = useMemo(() => {
        const start = currentPage * itemsPerPage;
        return industryData.slice(start, start + itemsPerPage);
    }, [industryData, currentPage]);

    const totalPages = Math.ceil(industryData.length / itemsPerPage);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-slate-900 p-8 rounded-[32px] border border-white/10 shadow-2xl backdrop-blur-xl max-w-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: d.color }}></div>
                        <p className="text-sm font-black text-slate-400 tracking-widest uppercase">{d.name}</p>
                    </div>
                    <p className="text-4xl font-black text-white mb-4">{d.z.toLocaleString()}<span className="text-sm ml-2 opacity-50 font-bold">개소</span></p>
                    <div className="space-y-2 text-sm font-bold">
                        <div className="flex justify-between gap-12 text-slate-400">
                            <span>실제 개업률</span>
                            <span className="text-blue-400 text-lg">{d.realX.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between gap-12 text-slate-400">
                            <span>실제 폐업률</span>
                            <span className="text-rose-400 text-lg">{d.realY.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">구성 업종 리스트</p>
                        <p className="text-sm font-bold text-slate-300 leading-relaxed">{d.sub}</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8">
            <style jsx>{`
                .heading-section { font-size: 2.25rem; font-weight: 900; color: #0f172a; letter-spacing: -0.05em; margin-bottom: 0.5rem; line-height: 1; }
                .text-detail { font-size: 0.85rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .bento-item { background: #ffffff; border: 1.5px solid #e5e7eb; border-radius: 2.5rem; padding: 2.5rem; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
                .bento-item:hover { border-color: #0f172a; transform: translateY(-4px); }
                .minimal-table th { padding: 2rem 1.5rem; border-bottom: 3px solid #0f172a; font-size: 1.1rem; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.02em; }
                .minimal-table td { padding: 2rem 1.5rem; border-bottom: 1px solid #f1f5f9; transition: all 0.2s ease; }
                .minimal-table tr:hover td { background: #f8fafc; }
                .reveal { animation: slideReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                @keyframes slideReveal { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Aggressive Interaction Fixes */
                .cluster-item { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer; transform-box: fill-box; transform-origin: center; }
                .recharts-wrapper, .recharts-surface, .recharts-layer, .recharts-scatter, svg, g, path, circle { outline: none !important; -webkit-tap-highlight-color: transparent; }
                .quadrant-label { user-select: none; pointer-events: none; }
            `}</style>

            <header className="max-w-7xl mx-auto mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">🏢 상권 업종 분석</h1>
                    <p className="text-slate-500 font-bold mt-2">상권 내 업종별 생존 전략과 시장 지배력을 정밀 데이터로 진단합니다.</p>
                </div>
                {selectedArea && (
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-lg font-black text-slate-800">{selectedArea} 분석 중</span>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto">
                <CommercialSubNav />

                <div className="grid lg:grid-cols-12 gap-8 mt-8">
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span className="text-3xl">🔍</span> 지역 검색
                            </h3>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="예: 역삼1동"
                                    className="w-full p-6 bg-slate-50 rounded-2xl font-black border-none focus:ring-2 focus:ring-blue-500 text-xl shadow-inner"
                                />
                                <button
                                    onClick={() => handleSearch()}
                                    className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-xl active:scale-95 text-xl"
                                >
                                    {isLoading ? "분석 중..." : "분석 시작하기"}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                                <span className="text-3xl">🎯</span> 분석 업종 리스트
                            </h3>
                            <div className="space-y-3">
                                {chartData.pie.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onMouseEnter={() => setHoveredCluster(item.name)}
                                        onMouseLeave={() => setHoveredCluster(null)}
                                        className={`flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all ${hoveredCluster === item.name ? 'bg-slate-900 text-white scale-[1.03] shadow-lg' : 'hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="font-black text-lg">{item.name}</span>
                                        </div>
                                        <span className={`text-sm font-black ${hoveredCluster === item.name ? 'text-blue-400' : 'text-slate-400'}`}>
                                            {((item.value / chartData.metrics.total) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <section className="lg:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-6 bento-item reveal relative overflow-hidden">
                                <p className="text-detail mb-6">전체 점포 수</p>
                                <div className="flex items-baseline">
                                    <span className="text-8xl font-black text-slate-900 tracking-tighter mr-4">
                                        {chartData.metrics.total.toLocaleString()}
                                    </span>
                                    <span className="text-2xl font-black text-slate-300 italic whitespace-nowrap">개소</span>
                                </div>
                            </div>
                            <div className="md:col-span-6 bento-item reveal flex flex-col justify-center">
                                <div className="grid grid-cols-2 h-full items-center">
                                    <div className="border-r border-slate-100 pr-6">
                                        <p className="text-detail mb-6">평균 개업률</p>
                                        <p className="text-6xl font-black text-blue-600 tracking-tighter">{chartData.metrics.open}%</p>
                                    </div>
                                    <div className="pl-6">
                                        <p className="text-detail mb-6">평균 폐업률</p>
                                        <p className="text-6xl font-black text-rose-500 tracking-tighter">{chartData.metrics.close}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Industry Growth-Risk Matrix */}
                        <div className="bento-item reveal">
                            <div className="flex justify-between items-center mb-10">
                                <div className="space-y-1">
                                    <p className="text-detail">상권 업종 활성도 매트릭스</p>
                                    <h3 className="heading-section text-5xl">업종별 성장·위험 분석도<span className="text-blue-600">.</span></h3>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 border border-slate-200 px-6 py-2 rounded-full uppercase tracking-widest bg-slate-50">통계 전문 분석 모델</span>
                            </div>

                            <div className="h-[650px] w-full relative mt-12 group">
                                {/* Corrected Quadrant Labels - Absolute Positioned for Precise Cornering */}
                                <div className="absolute top-0 left-0 z-20 text-left quadrant-label">
                                    <p className="text-2xl font-black text-rose-500 tracking-tighter italic">[시장 위축기]</p>
                                    <p className="text-sm font-bold text-slate-400 mt-1">이탈 가속 및 쇠퇴 경향</p>
                                </div>
                                <div className="absolute top-0 right-0 z-20 text-right quadrant-label">
                                    <p className="text-2xl font-black text-blue-600 tracking-tighter italic">[과열 경쟁기]</p>
                                    <p className="text-sm font-bold text-slate-400 mt-1">진입·이탈 동시 활성</p>
                                </div>
                                <div className="absolute bottom-24 left-0 z-20 text-left quadrant-label">
                                    <p className="text-2xl font-black text-slate-500 tracking-tighter italic">[성숙 정체기]</p>
                                    <p className="text-sm font-bold text-slate-400 mt-1">변동성 낮음·상권 고착</p>
                                </div>
                                <div className="absolute bottom-24 right-0 z-20 text-right quadrant-label">
                                    <p className="text-2xl font-black text-emerald-500 tracking-tighter italic">[시장 확장기]</p>
                                    <p className="text-sm font-bold text-slate-400 mt-1">신규 진입 위주 성장세</p>
                                </div>

                                {/* Axis Labels */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-center quadrant-label">
                                    <div className="px-8 py-3 bg-slate-900 text-white rounded-full text-xs font-black tracking-[0.2em] shadow-2xl border border-white/10">
                                        ← 개업률 →
                                    </div>
                                </div>
                                <div className="absolute top-1/2 left-0 -translate-y-1/2 -rotate-90 origin-left z-20 quadrant-label">
                                    <div className="px-8 py-3 bg-slate-50 text-slate-400 rounded-full text-xs font-black tracking-[0.2em] border border-slate-200">
                                        ← 폐업률 →
                                    </div>
                                </div>

                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 40, right: 40, bottom: 80, left: 40 }}>
                                        <XAxis type="number" dataKey="x" hide domain={chartDomain} />
                                        <YAxis type="number" dataKey="y" hide domain={chartDomain} />
                                        <ZAxis type="number" dataKey="z" range={[600, 7000]} />
                                        <Tooltip content={<CustomTooltip />} />
                                        
                                        {/* Stylized Reference Areas */}
                                        <ReferenceArea x1={0} y1={0} fill="#f1f5f9" fillOpacity={0.03} />
                                        <ReferenceArea x2={0} y1={0} fill="#f1f5f9" fillOpacity={0.03} />
                                        <ReferenceArea x1={0} y2={0} fill="#f1f5f9" fillOpacity={0.03} />
                                        <ReferenceArea x2={0} y2={0} fill="#f1f5f9" fillOpacity={0.03} />

                                        <ReferenceLine x={0} stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" />
                                        <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 5" />
                                        
                                        {[...chartData.scatter].sort((a, b) => b.z - a.z).map((entry, index) => (
                                            <Scatter
                                                key={index}
                                                data={[entry]}
                                                fill={entry.color}
                                                className={`cluster-item transition-all duration-500 ${hoveredCluster ? (hoveredCluster === entry.name ? 'opacity-100' : 'opacity-10') : 'opacity-80'}`}
                                            />
                                        ))}
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Franchise Density Analysis */}
                        <div className="bento-item reveal flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-detail">프랜차이즈 밀도</p>
                                    <h3 className="heading-section">프랜차이즈 비중 분석<span className="text-orange-500">.</span></h3>
                                </div>
                                <div className="flex flex-col items-end">
                                    <p className="text-8xl font-black text-orange-500 tracking-tighter">{chartData.metrics.frc}%</p>
                                    <p className="text-[12px] font-black text-slate-300 uppercase tracking-widest mt-1">지역 평균 비중</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mt-12">
                                {chartData.frc.map((item, idx) => (
                                    <div key={idx} className="space-y-3 py-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xl font-black text-slate-800 tracking-tight">{item.name}</span>
                                            <span className="text-xl font-black text-orange-500">{item.ratio}%</span>
                                        </div>
                                        <div className="w-full h-3.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${item.ratio}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-12 pt-8 border-t border-slate-50 flex items-center gap-6">
                                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 text-orange-500 font-black text-2xl">!</div>
                                <p className="text-sm font-bold text-slate-500 leading-tight">해당 지역은 프랜차이즈 밀도가 {Number(chartData.metrics.frc) > 30 ? '높은 편' : '균형 잡힌 편'}이며, {chartData.frc[0]?.name} 업종의 시장 지배력이 높습니다.</p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Full-Width Detailed Data Report */}
                <div className="bento-item reveal overflow-hidden mt-8">
                    <div className="flex justify-between items-end mb-16">
                        <div className="space-y-1">
                            <p className="text-detail">데이터 인벤토리</p>
                            <h3 className="heading-section text-5xl">전수 데이터 리포트<span className="text-blue-600">.</span></h3>
                        </div>
                        <div className="flex items-center gap-8">
                            <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="w-16 h-16 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><span className="text-3xl">←</span></button>
                            <span className="text-3xl font-black text-slate-900 tracking-tighter">{currentPage + 1} <span className="text-slate-300">/</span> {totalPages}</span>
                            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} className="w-16 h-16 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"><span className="text-3xl">→</span></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left minimal-table">
                            <thead>
                                <tr>
                                    <th className="text-left">업종 카테고리</th>
                                    <th className="text-right text-slate-400">전체 점포</th>
                                    <th className="text-right text-blue-600">개업률</th>
                                    <th className="text-right text-rose-500">폐업률</th>
                                    <th className="text-right text-slate-900">순개업률 (변동수)</th>
                                    <th className="text-center text-slate-400">데이터 신뢰도</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((i, idx) => {
                                    const netRate = (i.opbizRt - i.clsbizRt).toFixed(1);
                                    const netCount = Math.round((i.shopCount * (i.opbizRt - i.clsbizRt)) / 100);
                                    return (
                                        <tr key={idx} className="group">
                                            <td className="py-12">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-4xl text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors">{i.svcIndutyNm}</span>
                                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest mt-2">산업 분류 섹터</span>
                                                </div>
                                            </td>
                                            <td className="text-right font-black text-slate-400 text-3xl tracking-tighter bg-slate-50/30">{i.shopCount.toLocaleString()}</td>
                                            <td className="text-right font-black text-blue-600 text-3xl tracking-tighter">{i.opbizRt.toFixed(1)}%</td>
                                            <td className="text-right font-black text-rose-500 text-3xl tracking-tighter bg-rose-50/10">{i.clsbizRt.toFixed(1)}%</td>
                                            <td className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-4xl font-black tracking-tighter ${Number(netRate) >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>{Number(netRate) >= 0 ? `+${netRate}` : netRate}%</span>
                                                    <span className="text-sm font-bold text-slate-400">({Number(netCount) >= 0 ? `+${netCount}` : netCount}개소)</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${i.shopCount > 10 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></div>
                                                    <span className="font-bold text-slate-400">{i.shopCount > 10 ? '높음' : '보통'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default IndustryAnalysisPage;
