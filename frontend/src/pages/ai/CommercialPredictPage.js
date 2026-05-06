import React, { useState } from 'react';
import { commercialService } from 'api/ai/commercialService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CommercialPredictPage = () => {
    const [inputs, setInputs] = useState({
        sigungu: '',
        buildingUse: '제2종근생',
        floor: '',
        area: '',
        targetMonth: 'h1m'
    });
    const [result, setResult] = useState(null);
    const [isPredicting, setIsPredicting] = useState(false);

    const handlePredict = async (e) => {
        e.preventDefault();
        if (!inputs.sigungu || !inputs.area) {
            alert("지역명과 면적은 필수 입력 항목입니다.");
            return;
        }
        setIsPredicting(true);

        // 💡 [핵심] 백엔드 DTO 규격에 맞춘 "완벽한 포장"
        const payload = {
            propertyType: "상가",
            dealType: "월세",
            sigungu: inputs.sigungu,
            targetMonth: inputs.targetMonth,
            features: [
                {
                    // AI 서버 및 백엔드가 인식하는 스네이크 케이스 키값 사용
                    "building_use": inputs.buildingUse,
                    "mean_area": parseFloat(inputs.area),
                    "mean_floor": parseInt(inputs.floor) || 1
                }
            ]
        };

        try {
            const data = await commercialService.predict(payload);
            setResult(data);
        } catch (error) {
            // 💡 404(모델 없음), 400(규격 오류) 등을 구분하여 대응
            if (error.response?.status === 404) {
                alert("해당 조건(예: 6개월 모델)은 현재 AI가 학습 중입니다. 1개월/3개월로 시도해 보세요.");
            } else {
                alert("상가 분석 서버 응답이 지연되고 있습니다.");
            }
            console.error("Prediction Error:", error);
        } finally {
            setIsPredicting(false);
        }
    };

    // [듀얼 차트 데이터 구성]
   const mixedChartData = result ? {
        labels: ['현재 시세', 'AI 예측'],
        datasets: [
            {
                type: 'line',
                label: '월세액 (만원)',
                data: [150, result.predictedPrice], 
                borderColor: '#f43f5e',
                backgroundColor: '#f43f5e',
                borderWidth: 4,
                pointRadius: 7,
                pointHoverRadius: 10,
                fill: false,
                yAxisID: 'y1',
                order: 1 // 💡 막대보다 앞으로 나오게 설정
            },
            {
                type: 'bar',
                label: '보증금 (만원)',
                data: [5000, result.predictedDeposit || 5200],
                backgroundColor: 'rgba(99, 102, 241, 0.5)', // 반투명 처리
                barThickness: 50, // 💡 막대 두께 최적화
                borderRadius: 12,
                yAxisID: 'y',
                order: 2 // 💡 라인 뒤로 배치
            }
        ]
    } : null;

    return (
        <div className="p-8 bg-slate-900 min-h-screen text-white">
            <header className="mb-10">
                <span className="text-emerald-400 font-black text-xs uppercase tracking-widest">
                    AI Analytical Engine
                </span>
                <h1 className="text-4xl font-black mt-2">🏢 상가 임대료 AI 예측</h1>
            </header>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* 검색 필터 섹션 */}
                <form onSubmit={handlePredict} className="lg:col-span-4 space-y-5 bg-white/5 p-8 rounded-[40px] border border-white/10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">상권 지역명</label>
                        <input className="w-full bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold"
                               placeholder="예: 서울특별시 마포구 서교동" 
                               value={inputs.sigungu} 
                               onChange={e => setInputs({...inputs, sigungu: e.target.value})} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">건물 용도</label>
                        <select className="w-full bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold"
                                value={inputs.buildingUse} 
                                onChange={e => setInputs({...inputs, buildingUse: e.target.value})}>
                            <option value="제1종근생">제1종 근린생활시설</option>
                            <option value="제2종근생">제2종 근린생활시설</option>
                            <option value="판매시설">판매시설</option>
                            <option value="업무시설">업무시설</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">전용면적(㎡)</label>
                            <input type="number" className="w-full bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold"
                                   placeholder="33.0" value={inputs.area} onChange={e => setInputs({...inputs, area: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-1">층수</label>
                            <input type="number" className="w-full bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold"
                                   placeholder="1" value={inputs.floor} onChange={e => setInputs({...inputs, floor: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1">예측 목표 기간</label>
                        <select className="w-full bg-slate-800 p-4 rounded-2xl outline-none focus:ring-2 ring-emerald-500 font-bold"
                                value={inputs.targetMonth} 
                                onChange={e => setInputs({...inputs, targetMonth: e.target.value})}>
                            <option value="h1m">1개월 후 예측</option>
                            <option value="h3m">3개월 후 예측</option>
                            <option value="h6m">6개월 후 (현재 미지원)</option>
                        </select>
                    </div>

                    <button type="submit" disabled={isPredicting}
                            className={`w-full py-5 rounded-[28px] font-black text-lg transition-all ${isPredicting ? 'bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-900/10'}`}>
                        {isPredicting ? "AI 모델 분석 중..." : "임대료 예측 실행"}
                    </button>
                </form>

                {/* 분석 결과 섹션 */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-10 rounded-[50px] shadow-2xl flex justify-between items-center">
                        <div>
                            <h3 className="text-emerald-100 font-bold text-xs uppercase tracking-widest mb-2">Estimated Rent Value</h3>
                            {result ? (
                                <div className="text-7xl font-black tracking-tighter">
                                    {Math.floor(result.predictedPrice).toLocaleString()} <span className="text-2xl font-bold text-emerald-200">만원</span>
                                </div>
                            ) : <div className="text-emerald-200/40 text-xl font-bold italic">지역을 검색하여 분석을 시작하세요.</div>}
                        </div>
                    </div>

                    {mixedChartData && (
                        <div className="bg-white/5 p-10 rounded-[50px] border border-white/10">
                            <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                                임대 조건 복합 분석 차트
                            </h3>
                            <div className="h-[350px]">
                                <Chart type='bar' data={mixedChartData} options={{
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'top', labels: { boxWidth: 10, color: '#94a3b8' } } },
                                    scales: {
                                        y: { position: 'left', title: { display: true, text: '보증금 (만원)', color: '#6366f1' }, grid: { display: false } },
                                        y1: { position: 'right', title: { display: true, text: '월세 (만원)', color: '#f43f5e' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                                    }
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommercialPredictPage;