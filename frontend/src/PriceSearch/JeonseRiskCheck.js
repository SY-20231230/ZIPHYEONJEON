import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { checkJeonseRisk } from '../api/priceApi';

const SIDO_LIST = [
    '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
    '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도',
    '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도'
];

const GU_LIST = {
    '서울특별시': ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'],
    '부산광역시': ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
    '대구광역시': ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군', '군위군'],
    '인천광역시': ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
    '광주광역시': ['동구', '서구', '남구', '북구', '광산구'],
    '대전광역시': ['동구', '중구', '서구', '유성구', '대덕구'],
    '울산광역시': ['중구', '남구', '동구', '북구', '울주군'],
    '세종특별자치시': ['세종시'],
    '경기도': ['수원시 장안구', '수원시 권선구', '수원시 팔달구', '수원시 영통구', '성남시 수정구', '성남시 중원구', '성남시 분당구', '고양시 덕양구', '고양시 일산동구', '고양시 일산서구', '용인시 처인구', '용인시 기흥구', '용인시 수지구', '부천시', '안산시 단원구', '안산시 상록구', '안양시 만안구', '안양시 동안구', '남양주시', '화성시', '평택시', '의정부시', '광명시', '파주시', '김포시', '광주시', '하남시', '구리시', '양주시', '오산시', '이천시', '안성시', '여주시', '포천시', '동두천시', '의왕시', '군포시', '과천시', '가평군', '양평군', '연천군'],
    '강원특별자치도': ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
    '충청북도': ['청주시 상당구', '청주시 서원구', '청주시 흥덕구', '청주시 청원구', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
    '충청남도': ['천안시 동남구', '천안시 서북구', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
    '전북특별자치도': ['전주시 완산구', '전주시 덕진구', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
    '전라남도': ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
    '경상북도': ['포항시 남구', '포항시 북구', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
    '경상남도': ['창원시 의창구', '창원시 성산구', '창원시 마산합포구', '창원시 마산회원구', '창원시 진해구', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
    '제주특별자치도': ['제주시', '서귀포시'],
};

const JeonseRiskCheck = () => {
    const [formData, setFormData] = useState({
        sido: '서울특별시',
        gu: '서초구',
        dong: '',            // 기본값 비워둠
        propertyType: '아파트',
        exclusiveArea: '',
        jeonseAmount: ''
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            // 시도 변경 시 구를 첫 번째 항목으로 초기화
            if (name === 'sido') {
                const guOptions = GU_LIST[value] || [];
                next.gu = guOptions[0] || '';
            }
            return next;
        });
    };

    const handleCheck = async () => {
        if (!formData.gu || !formData.exclusiveArea || !formData.jeonseAmount) {
            alert('모든 정보를 입력해주세요.');
            return;
        }
        setLoading(true);
        try {
            const request = {
                address: `${formData.sido} ${formData.gu} ${formData.dong}`.trim(), // 기존 호환
                sigungu: formData.gu,    // DB SIGUNGU 컬럼은 '서초구' 형식으로만 저장됨 (sido 분리)
                dong: formData.dong,
                propertyType: formData.propertyType,
                exclusiveArea: parseFloat(formData.exclusiveArea),
                jeonse_amount: parseInt(formData.jeonseAmount)
            };
            const data = await checkJeonseRisk(request);
            setResult(data);
        } catch (error) {
            alert('분석 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="risk-check-card">

            <h2 style={{ color: '#d63384' }}>전세 사기 리스크 진단 (P-005)</h2>
            <p>보증금을 입력하면 깡통 전세 위험도를 분석해드립니다.</p>

            <div className="risk-form" style={{ maxWidth: '500px', margin: '0 auto' }}>
                {/* 시도 선택 */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>시도</label>
                    <select
                        name="sido"
                        value={formData.sido}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        {SIDO_LIST.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
                {/* 구 선택 */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>구/시</label>
                    <select
                        name="gu"
                        value={formData.gu}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        {(GU_LIST[formData.sido] || []).map(g => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>
                {/* 동 입력 */}
                <Input
                    name="dong"
                    value={formData.dong}
                    onChange={handleChange}
                    placeholder="동 (예: 반포동, 역삼동)"
                    label="동 (선택)"
                />
                {/* 유형 */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>유형</label>
                    <select
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value="아파트">아파트</option>
                        <option value="빌라">빌라/연립</option>
                        <option value="오피스텔">오피스텔</option>
                    </select>
                </div>
                <Input
                    name="exclusiveArea"
                    value={formData.exclusiveArea}
                    onChange={handleChange}
                    placeholder="전용면적 (m²)"
                    label="면적"
                    type="number"
                />
                <Input
                    name="jeonseAmount"
                    value={formData.jeonseAmount}
                    onChange={handleChange}
                    placeholder="보증금 (만원)"
                    label="전세보증금"
                    type="number"
                />
                <Button onClick={handleCheck} disabled={loading} style={{ width: '100%', marginTop: '10px', backgroundColor: '#dc3545' }}>
                    {loading ? '진단 중...' : '위험도 조회'}
                </Button>
            </div>

            {result && (
                <div className="risk-result" style={{ marginTop: '30px', padding: '20px', background: '#fff0f3', borderRadius: '8px', border: '1px solid #f5c2c7' }}>
                    {result.riskLevel === 'UNKNOWN' ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <h3 style={{ color: '#6c757d' }}>📊 데이터 부족</h3>
                            <p style={{ color: '#555' }}>{result.riskMessage}</p>
                            <p style={{ fontSize: '0.85rem', color: '#888' }}>
                                검색 지역 또는 면적 조건에 맞는 인근 실거래 데이터가 충분하지 않습니다.<br />
                                지역명을 더 구체적으로 입력하거나 면적 범위를 조정해 보세요.
                            </p>
                        </div>
                    ) : (() => {
                        const RISK_CONFIG = {
                            SUSPICIOUS_LOW: { label: '🟣 의심 (비정상 저가)', color: '#7b2ff7', bg: '#f3eaff' },
                            SAFE: { label: '✅ 안전', color: '#198754', bg: '#e8f5e9' },
                            CAUTION: { label: '⚠️ 주의', color: '#e6a817', bg: '#fff8e1' },
                            HIGH_RISK: { label: '🟠 고위험', color: '#e85d04', bg: '#fff3e0' },
                            DANGER: { label: '🚨 위험 (깡통전세)', color: '#dc3545', bg: '#ffeef0' },
                        };
                        const cfg = RISK_CONFIG[result.riskLevel] || RISK_CONFIG.SAFE;
                        const ratio = result.myJeonseRatio ?? 0;

                        return (
                            <div style={{ background: cfg.bg, borderRadius: '8px', padding: '15px' }}>
                                <h3 style={{ textAlign: 'center', color: cfg.color, marginBottom: '8px' }}>{cfg.label}</h3>
                                <div style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '15px', color: cfg.color }}>
                                    내 전세가율: {result.myJeonseRatio != null ? result.myJeonseRatio.toFixed(1) : '-'}%
                                </div>

                                {/* 5구간 진행 바 */}
                                <div style={{ position: 'relative', height: '24px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(to right, #7b2ff7 0% 25%, #198754 25% 60%, #ffc107 60% 70%, #e85d04 70% 85%, #dc3545 85% 100%)' }}>
                                    {/* 내 위치 마커 */}
                                    <div style={{ position: 'absolute', left: `${Math.min(ratio, 100)}%`, top: '-2px', bottom: '-2px', width: '3px', background: 'white', borderRadius: '2px', boxShadow: '0 0 4px rgba(0,0,0,0.5)' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '4px', color: '#666' }}>
                                    <span>0%</span><span>25%</span><span>60%</span><span>70%</span><span>85%</span><span>100%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#999', marginTop: '2px' }}>
                                    <span>의심</span><span style={{ marginLeft: '4px' }}>안전</span><span>주의</span><span>고위험</span><span>위험</span><span></span>
                                </div>

                                <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.9rem', color: '#444' }}>
                                    {result.riskMessage}
                                </p>
                                <hr />
                                <ul style={{ fontSize: '0.9rem', color: '#555' }}>
                                    <li>인근 매매 평균가: {result.avgSalePrice?.toLocaleString()}만원</li>
                                    <li>인근 전세 평균가: {result.avgJeonsePrice?.toLocaleString()}만원
                                        {result.marketJeonseRatio != null && ` (시장 전세가율 ${result.marketJeonseRatio.toFixed(1)}%)`}
                                    </li>
                                </ul>
                            </div>
                        );
                    })()}
                </div>
            )}
        </Card>
    );
};

export default JeonseRiskCheck;

