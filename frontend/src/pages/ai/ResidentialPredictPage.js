/**
 * [Residential AI Prediction Page - Enterprise Edition]
 * 1. 🎯 데이터 정규화: targetMonth(CamelCase) 적용으로 백엔드(Source 1)와 완벽 호환.
 * 2. ⚡ 다중 시점 엔진: 매물 클릭 시 1, 3, 6개월 자동 호출 루프 구현 (Source 5 준수).
 * 3. 🚫 예외 로직: 월세 거래 시 6개월(h6m) 옵션 자동 제거 및 호출 차단 (Source 5 준수).
 * 4. 🔑 마스터 키: representativeHouseId를 기반으로 찜/최근기록/AI 데이터 통합 연동.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { residentialService } from '../../api/ai/residentialService';
import { interactionService } from '../../api/interaction/interactionService';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

// ChartJS 엔진 등록
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const SIDO_OPTIONS = ["서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시", "강원특별자치도", "충청북도", "충청남도", "전라북도", "전라남도", "전북특별자치도", "경상북도", "경상남도", "제주특별자치도"];

const ResidentialPredictPage = () => {
  // --- 1. [State] 입력 및 데이터 관리 (7개 필수 필드 포함) ---
  const [inputs, setInputs] = useState({
    sigungu: '',        // 시군구 (주소)
    propertyType: '아파트', // 주택 유형[cite: 1, 5]
    dealType: '매매',      // 거래 유형[cite: 1, 5]
    builtYear: '',      // 건축년도 (features)
    floor: '',          // 층수 (features)
    area: '',           // 전용면적 (features)
    targetMonth: 'h1m', // 🚨 중요: CamelCase로 수정하여 백엔드 @RequestBody와 매핑[cite: 1, 5]
    houseId: null       // representativeHouseId (마스터 키)
  });

  const [keyword, setKeyword] = useState('');         // 검색어
  const [searchResults, setSearchResults] = useState([]); // 검색 결과 리스트
  const [multiResults, setMultiResults] = useState({});   // 1,3,6개월 예측 결과 저장
  const [isPredicting, setIsPredicting] = useState(false); // 로딩 상태
  const [sidebarData, setSidebarData] = useState({ liked: [], recent: [] }); // 사이드바 데이터

  // --- 2. [Effect] 사이드바 초기 데이터 로딩[cite: 4, 5] ---
  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const [likes, records] = await Promise.all([
          interactionService.getLikedHouses(),
          interactionService.getRecentRecords()
        ]);
        // 응답 규격 방어 코드 적용
        const extract = (res) => res.data?.data || res.data || (Array.isArray(res) ? res : []);
        setSidebarData({ liked: extract(likes), recent: extract(records) });
      } catch (err) {
        console.error("[Service Error] 사이드바 데이터 동기화 실패");
      }
    };
    fetchSidebar();
  }, []);

  /**
   * 3. [Action] 단지/도로명 검색 (POST /api/price/directory)[cite: 4]
   */
  const handleSearch = async () => {
    if (!keyword.trim()) return;
    try {
      // 주소 파싱 로직: 마지막 단어를 검색 키워드로 사용[cite: 7]
      const terms = keyword.split(' ');
      const searchVal = terms[terms.length - 1];

      const res = await residentialService.searchDirectory({
        sigungu: searchVal,
        propertyType: inputs.propertyType,
        page: 0, size: 10
      });
      setSearchResults(res.content || []);
    } catch (err) {
      alert("단지 정보를 찾을 수 없습니다.");
    }
  };

  /**
   * 4. [Action] 매물 선택 시 상세 정보 바인딩 & 자동 예측 (Auto-fill & Auto-Predict)
   */
  const handleSelectProperty = async (item) => {
    // 마스터 키 추출 (대소문자 및 필드명 방어)[cite: 4, 7]
    const hId = item.representativeHouseId || item.HOUSE_ID || item.houseId;
    if (!hId) return;

    try {
      // Flow 3: 상세 프로필 조회 (배틀 보드 API 활용)[cite: 4, 5]
      const res = await residentialService.getPropertyProfile(hId);
      const d = res || res;
      const complexName = d.complexName || d.complex_name || d.NAME || d.name || "이름 없는 매물";
      const sigungu = d.sigungu || d.SIGUNGU ||
                      (d.SIDO && d.SIGUNGU ? `${d.SIDO} ${d.SIGUNGU}` : d.roadAddress) ||
                      "지역 정보 없음";

      const autoFillData = {
        sigungu: d.sigungu || d.SIGUNGU || (d.roadAddress ? d.roadAddress.split(' ').slice(0, 2).join(' ') : "서울특별시 은평구"),
        propertyType: d.propertyType || d.PROPERTY_TYPE || '아파트',
        dealType: inputs.dealType,
        area: d.area || d.AREA || '',
        floor: d.floor || d.FLOOR_NO || '10',
        builtYear: d.builtYear || d.BUILT_YEAR || '2020',
        targetMonth: 'h1m',
        houseId: hId,
        currentPrice: d.latestTradePrice || 0
      };

      setInputs(autoFillData);
      setKeyword(d.complexName || d.NAME || '');
      setSearchResults([]);

      const updateList = (list) => list.map(h => 
      (h.HOUSE_ID === hId || h.houseId === hId) ? { ...h, NAME: complexName, complexName: complexName } : h
      );
      setSidebarData(prev => ({
        liked: updateList(prev.liked),
        recent: updateList(prev.recent)
      }));

      // 자동 예측 실행: h1m, h3m, h6m 연달아 호출 (월세 예외 처리 포함)[cite: 5]
      executeAIPrediction(true, autoFillData);
    } catch (err) {
      alert("매물 상세 정보를 가져오는데 실패했습니다.");
    }
  };

  /**
   * 5. [Core Logic] AI 예측 실행 엔진 (자동 3회 호출 vs 수동 1회 호출)[cite: 5]
   */
  const executeAIPrediction = async (isAuto, data) => {
    setIsPredicting(true);
    setMultiResults({}); // 기존 결과 초기화

    const validSigungu = data.sigungu && !data.sigungu.includes('undefined') 
    ? data.sigungu 
    : `${data.province || ''} ${data.city || ''}`.trim() || "지역 정보 없음";

    try {
      // 🚨 가이드 준수: 월세는 h1m, h3m만 실행. 매매/전세는 h1m, h3m, h6m 실행[cite: 5]
      let months = [];
      if (isAuto) {
        months = data.dealType === '월세' ? ['h1m', 'h3m'] : ['h1m', 'h3m', 'h6m'];
      } else {
        months = [data.targetMonth];
      }

      // 루프를 돌며 개별 targetMonth 요청 생성[cite: 5]
      const requests = months.map(m => {
        // 💡 [AI 규격 준수] AI 서버는 sido, mean_building_age 등의 이름을 기다립니다.
        const sido = validSigungu.split(' ')[0] || "서울특별시";
        const currentYear = new Date().getFullYear();
        const buildingAge = currentYear - (parseInt(data.builtYear) || 2020);

        return residentialService.predict({
          propertyType: data.propertyType,
          dealType: data.dealType,
          sigungu: validSigungu,
          targetMonth: m,
          features: [{
            month: new Date().getMonth() + 1,
            sido: sido,
            property_type: data.propertyType,
            mean_building_age: buildingAge,
            mean_floor: parseInt(data.floor) || 10,
            mean_area: parseFloat(data.area) || 84.0
          }]
        });
      });

      const responses = await Promise.all(requests);
      
      // 결과를 타겟 시점별로 매핑하여 상태 저장
      const resMap = {};
      responses.forEach((res, idx) => {
        resMap[months[idx]] = res;
      });
      setMultiResults(resMap);

    } catch (err) {
      console.error("[AI Engine] 분석 실패:", err);
      alert("AI 서버와의 통신에 실패했습니다. 입력 규격을 확인하세요.");
    } finally {
      setIsPredicting(false);
    }
  };

  // --- 6. [Visualization] 그래프 데이터 계산[cite: 4, 7] ---
  const chartData = useMemo(() => {
    const keys = Object.keys(multiResults);
    if (keys.length === 0) return { labels: [], datasets: [] };

    // 시계열 레이블 설정[cite: 7]
    const labels = ['현재 시세', ...keys.map(k => k.replace('h', '').replace('m', '개월 후'))];
    
    // 첫 번째 결과에서 기준 실거래가 추출
    const basePrice = inputs.currentPrice || 0;
    const predictedPrices = keys.map(k => multiResults[k].predictedPrice);

    return {
      labels,
      datasets: [{
        label: '예상가 (만원)',
        data: [basePrice, ...predictedPrices],
        borderColor: '#60A5FA',
        backgroundColor: 'rgba(96, 165, 250, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: '#FFFFFF'
      }]
    };
  }, [multiResults, inputs.currentPrice]);

  // --- 7. [Render] UI 레이아웃 ---
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 p-8">
      {/* 헤더 섹션 */}
      <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
        <div>
          <p className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-1">Molit AI Inference Engine v12.0</p>
          <h1 className="text-3xl font-black tracking-tight">부동산 가치 정밀 예측</h1>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* 좌측: 입력 및 검색 패널 */}
        <div className="lg:col-span-4 space-y-6">
          {/* 단지 검색창 */}
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 shadow-xl">
            <label className="text-[10px] font-bold text-blue-400 uppercase mb-3 block">Complex Finder</label>
            <div className="flex gap-2">
              <input 
                className="flex-grow bg-slate-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="도로명 또는 아파트명 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="bg-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition-colors">검색</button>
            </div>
            {/* 검색 결과 드롭다운 */}
            {searchResults.length > 0 && (
              <div className="mt-3 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.map((item, i) => (
                  <div key={i} onClick={() => handleSelectProperty(item)} className="p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-800 last:border-none">
                    <p className="text-xs font-bold">{item.complexName}</p>
                    <p className="text-[10px] text-slate-500">{item.roadAddress}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 수동 입력 폼 */}
          <form onSubmit={(e) => { e.preventDefault(); executeAIPrediction(false, inputs); }} className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 shadow-xl space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <select className="bg-slate-900 rounded-xl p-3 text-sm border-none" value={inputs.dealType} onChange={e => setInputs({...inputs, dealType: e.target.value})}>
                <option value="매매">매매</option><option value="전세">전세</option><option value="월세">월세</option>
              </select>
              <select className="bg-slate-900 rounded-xl p-3 text-sm border-none" value={inputs.propertyType} onChange={e => setInputs({...inputs, propertyType: e.target.value})}>
                <option value="아파트">아파트</option><option value="연립다세대">연립다세대</option>
              </select>
            </div>
            <input className="w-full bg-slate-900 rounded-xl p-3 text-sm border-none" placeholder="지역구 (예: 서울특별시 동작구)" value={inputs.sigungu} onChange={e => setInputs({...inputs, sigungu: e.target.value})} />
            
            <div className="grid grid-cols-3 gap-2">
              <input type="number" className="bg-slate-900 rounded-xl p-3 text-xs border-none" placeholder="연도" value={inputs.builtYear} onChange={e => setInputs({...inputs, builtYear: e.target.value})} />
              <input type="number" className="bg-slate-900 rounded-xl p-3 text-xs border-none" placeholder="층" value={inputs.floor} onChange={e => setInputs({...inputs, floor: e.target.value})} />
              <input type="number" className="bg-slate-900 rounded-xl p-3 text-xs border-none" placeholder="면적" value={inputs.area} onChange={e => setInputs({...inputs, area: e.target.value})} />
            </div>

            <select className="w-full bg-slate-900 rounded-xl p-3 text-sm border-none" value={inputs.targetMonth} onChange={e => setInputs({...inputs, targetMonth: e.target.value})}>
              <option value="h1m">1개월 후</option><option value="h3m">3개월 후</option>
              {inputs.dealType !== '월세' && <option value="h6m">6개월 후</option>} {/* 월세 예외 로직[cite: 5] */}
            </select>

            <button type="submit" disabled={isPredicting} className="w-full bg-blue-600 py-4 rounded-xl font-black text-lg hover:bg-blue-500 disabled:bg-slate-700 transition-all">
              {isPredicting ? "AI 분석 엔진 가동 중..." : "AI 예측 실행"}
            </button>
          </form>
        </div>

        {/* 우측: 결과 그래프 및 사이드바 */}
        <div className="lg:col-span-8 grid md:grid-cols-3 gap-6">
          {/* 그래프 메인보드 */}
          <div className="md:col-span-2 bg-slate-800/30 p-8 rounded-[40px] border border-slate-800 flex flex-col justify-between">
            {Object.keys(multiResults).length > 0 ? (
              <>
                <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Target Valuation</p>
                  <h2 className="text-6xl font-black text-blue-400">
                    {(
                      multiResults[inputs.targetMonth]?.predictedPrice ||
                      Object.values(multiResults)[0]?.predictedPrice
                    )?.toLocaleString()} 
                    <span className="text-2xl font-light italic ml-1">만원</span>
                  </h2>
                </div>
                <div className="h-64 mt-8">
                  <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#1E293B' } }, x: { grid: { display: false } } } }} />
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
                <p>매물을 선택하거나 정보를 입력하여 AI 예측을 시작하세요.</p>
              </div>
            )}
          </div>

          {/* 사이드바: 찜/최근기록[cite: 5] */}
          <div className="space-y-4">
            <section className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <h4 className="text-xs font-black text-blue-400 uppercase mb-4 tracking-tighter">❤️ Favorites</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {sidebarData.liked.map((item, i) => (
                  <div key={i} onClick={() => handleSelectProperty(item)} className="p-3 bg-slate-900 rounded-xl cursor-pointer hover:ring-1 hover:ring-blue-500 transition-all">
                    <p className="text-[11px] font-bold truncate">{item.complexName || item.NAME}</p>
                    <p className="text-[9px] text-slate-500 italic">클릭 시 자동 예측</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <h4 className="text-xs font-black text-slate-400 uppercase mb-4 tracking-tighter">🕒 Recent</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {sidebarData.recent.map((item, i) => (
                  <div key={i} onClick={() => handleSelectProperty(item)} className="p-3 bg-slate-900 rounded-xl cursor-pointer hover:ring-1 hover:ring-slate-500 transition-all">
                    <p className="text-[11px] font-bold truncate">{item.complexName || item.NAME}</p>
                    <p className="text-[9px] text-slate-500 italic">정보 불러오기</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentialPredictPage;