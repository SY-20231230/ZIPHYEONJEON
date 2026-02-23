import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { suggestPrice } from '../api/priceApi';

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

const PriceSuggestion = () => {
    const [formData, setFormData] = useState({
        sido: '서울특별시',
        gu: '강남구',
        dong: '',
        propertyType: '아파트',
        area_m2: '',
        built_year: '',
        floor: '',
        current_price: ''
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'sido') {
                const guOptions = GU_LIST[value] || [];
                next.gu = guOptions[0] || '';
            }
            return next;
        });
    };

    const handleSuggest = async () => {
        if (!formData.gu || !formData.area_m2) {
            alert('구/시와 전용면적은 필수 입력입니다.');
            return;
        }
        setLoading(true);
        try {
            const request = {
                address: `${formData.sido} ${formData.gu} ${formData.dong}`.trim(),
                sigungu: formData.gu,
                dong: formData.dong,
                propertyType: formData.propertyType,
                area_m2: parseFloat(formData.area_m2),
                market_data: {
                    built_year: formData.built_year ? parseInt(formData.built_year) : null,
                    floor: formData.floor ? parseInt(formData.floor) : null,
                    current_price: formData.current_price ? parseInt(formData.current_price) : null
                }
            };
            const data = await suggestPrice(request);
            setResult(data);
        } catch (error) {
            alert('AI 분석 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <Card className="ai-suggestion-card">
            <h2 style={{ color: '#198754' }}>AI 적정 가격 제안 (P-008)</h2>
            <p>매물 정보를 입력하면 AI가 주변 시세와 특성을 분석하여 적정 가격을 산출합니다.</p>

            <div className="suggestion-form" style={{ maxWidth: '600px', margin: '0 auto' }}>
                {/* 주소 입력 - 시도/구/동 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '5px' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>시도</label>
                        <select name="sido" value={formData.sido} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                            {SIDO_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>구/시</label>
                        <select name="gu" value={formData.gu} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                            {(GU_LIST[formData.sido] || []).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '5px' }}>
                    <Input name="dong" value={formData.dong} onChange={handleChange}
                        placeholder="동 (예: 역삼동)" label="동 (선택)" />
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>유형</label>
                        <select name="propertyType" value={formData.propertyType} onChange={handleChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                            <option value="아파트">아파트</option>
                            <option value="빌라">빌라/연립</option>
                            <option value="오피스텔">오피스텔</option>
                        </select>
                    </div>
                </div>
                {/* 나머지 정보 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

                    <Input
                        name="area_m2"
                        value={formData.area_m2}
                        onChange={handleChange}
                        placeholder="면적 (m²)"
                        label="전용면적"
                        type="number"
                    />
                    <Input
                        name="current_price"
                        value={formData.current_price}
                        onChange={handleChange}
                        placeholder="현재 호가 (선택)"
                        label="현재 가격(만원)"
                        type="number"
                    />
                    <Input
                        name="built_year"
                        value={formData.built_year}
                        onChange={handleChange}
                        placeholder="YYYY (선택)"
                        label="건축년도"
                        type="number"
                    />
                    <Input
                        name="floor"
                        value={formData.floor}
                        onChange={handleChange}
                        placeholder="층수 (선택)"
                        label="층수"
                        type="number"
                    />

                    <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                        <Button onClick={handleSuggest} disabled={loading} style={{ width: '100%', backgroundColor: '#198754' }}>
                            {loading ? 'AI 분석 중...' : '적정가 분석'}
                        </Button>
                    </div>
                </div>
            </div> {/* closes suggestion-form */}

            {result && (
                <div className="ai-result" style={{ mt: '30px', padding: '20px', borderRadius: '10px', background: '#f0fff4', border: '1px solid #c3e6cb', marginTop: '20px' }}>
                    <div className="result-header" style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>분석 결과</h3>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#198754' }}>
                            {result.suggested_price.toLocaleString()} 만원
                        </div>
                        {result.grade && (
                            <div style={{
                                display: 'inline-block',
                                padding: '5px 15px',
                                borderRadius: '20px',
                                background: result.grade.includes('저평가') ? '#d4edda' : (result.grade.includes('고평가') ? '#fff3cd' : '#d1ecf1'),
                                color: result.grade.includes('저평가') ? '#155724' : (result.grade.includes('고평가') ? '#856404' : '#0c5460'),
                                marginTop: '10px', fontWeight: 'bold'
                            }}>
                                판단: {result.grade}
                            </div>
                        )}
                    </div>

                    <div className="result-details" style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                        <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>산출 근거 ({result.calculation_basis.algorithm_version})</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ padding: '5px 0', display: 'flex', justifyContent: 'space-between' }}>
                                <span>기준 시세</span>
                                <span>{result.calculation_basis.avg_market_price}</span>
                            </li>
                            {result.calculation_basis.adjustments.map((adj, idx) => (
                                <li key={idx} style={{ padding: '5px 0', display: 'flex', justifyContent: 'space-between', color: adj.includes('(+') ? 'blue' : 'red' }}>
                                    <span>- 보정 요인 {idx + 1}</span>
                                    <span>{adj}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default PriceSuggestion;
