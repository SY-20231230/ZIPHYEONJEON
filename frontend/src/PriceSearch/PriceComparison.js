import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { comparePrices } from '../api/priceApi';
import { IoAddOutline, IoTrashOutline } from 'react-icons/io5';

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

const PriceComparison = () => {
    // 공통 주소
    const [commonAddress, setCommonAddress] = useState({
        sido: '서울특별시',
        gu: '서초구',
        dong: ''
    });

    // 개별 매물 정보
    const [items, setItems] = useState([
        { id: 1, name: 'A 아파트', area_m2: '', transaction_type: '아파트', targetPrice: '' },
        { id: 2, name: 'B 아파트', area_m2: '', transaction_type: '아파트', targetPrice: '' }
    ]);

    let nextId = items.length > 0 ? items[items.length - 1].id + 1 : 1;

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // 공통 주소 핸들러
    const handleCommonAddressChange = (e) => {
        const { name, value } = e.target;
        setCommonAddress(prev => {
            const next = { ...prev, [name]: value };
            if (name === 'sido') {
                const guOptions = GU_LIST[value] || [];
                next.gu = guOptions[0] || '';
            }
            return next;
        });
    };

    // 개별 매물 핸들러
    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [name]: value };
        setItems(newItems);
    };

    // 항목 추가/삭제
    const handleAddItem = () => {
        if (items.length >= 4) {
            alert('비교 매물은 최대 4개까지만 추가할 수 있습니다.');
            return;
        }
        setItems([...items, { id: nextId, name: `매물 ${nextId}`, area_m2: '', transaction_type: '아파트', targetPrice: '' }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length <= 2) {
            alert('비교 매물은 최소 2개 이상이어야 합니다.');
            return;
        }
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleCompare = async () => {
        if (!commonAddress.gu) {
            alert('공통 지역의 구/시를 선택해주세요.'); return;
        }
        for (let item of items) {
            if (!item.area_m2 || !item.targetPrice) {
                alert('모든 매물의 전용면적과 가격을 입력해주세요.');
                return;
            }
        }

        setLoading(true);
        try {
            // 백엔드에는 기존 DTO 구조에 맞춰 전송 (address 필드에 조립해서 전송)
            const fullAddress = `${commonAddress.sido} ${commonAddress.gu} ${commonAddress.dong}`.trim();
            const request = {
                targets: items.map(i => ({
                    address: fullAddress, // 공통 주소 사용
                    area_m2: parseFloat(i.area_m2),
                    transaction_type: i.transaction_type,
                    targetPrice: parseInt(i.targetPrice)
                }))
            };
            const data = await comparePrices(request);

            // 결과를 프론트의 식별(name)과 매칭하기 위해 items 정보 병합
            const enhancedResults = data.map((res, index) => ({
                ...res,
                itemName: items[index].name,
                itemProps: items[index]
            }));

            setResults(enhancedResults);
        } catch (error) {
            alert('비교 분석 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="price-compare-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ color: '#0d6efd', marginBottom: '5px' }}>매물 가격 비교 (P-004)</h2>
            <p style={{ color: '#6c757d', marginBottom: '25px' }}>같은 동네의 여러 매물을 한눈에 비교하고 시세 대비 가치를 평가해보세요.</p>

            {/* 공통 지역 설정 */}
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #e9ecef' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#495057' }}>📍 공통 관심 지역</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#6c757d' }}>시도</label>
                        <select name="sido" value={commonAddress.sido} onChange={handleCommonAddressChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da' }}>
                            {SIDO_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#6c757d' }}>구/시</label>
                        <select name="gu" value={commonAddress.gu} onChange={handleCommonAddressChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da' }}>
                            {(GU_LIST[commonAddress.sido] || []).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#6c757d' }}>동</label>
                        <input name="dong" value={commonAddress.dong} onChange={handleCommonAddressChange}
                            placeholder="예: 반포동"
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', boxSizing: 'border-box' }} />
                    </div>
                </div>
            </div>

            {/* 개별 매물 입력 폼 */}
            <div className="compare-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {items.map((item, idx) => (
                    <div key={item.id} style={{ border: '2px solid #e9ecef', padding: '20px', borderRadius: '12px', background: '#fff', position: 'relative' }}>
                        {items.length > 2 && (
                            <button onClick={() => handleRemoveItem(idx)}
                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '5px' }}>
                                <IoTrashOutline size={20} />
                            </button>
                        )}
                        <Input
                            name="name"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, e)}
                            placeholder="단지명 (별명)"
                            label={`매물 ${idx + 1} 이름`}
                            style={{ fontWeight: 'bold', color: '#0d6efd' }}
                        />
                        <div style={{ marginTop: '15px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', color: '#6c757d' }}>물건 유형</label>
                            <select
                                name="transaction_type"
                                value={item.transaction_type}
                                onChange={(e) => handleItemChange(idx, e)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ced4da' }}
                            >
                                <option value="아파트">아파트</option>
                                <option value="빌라">빌라/연립</option>
                                <option value="오피스텔">오피스텔</option>
                            </select>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <Input
                                name="area_m2"
                                value={item.area_m2}
                                onChange={(e) => handleItemChange(idx, e)}
                                placeholder="전용면적"
                                label="전용면적 (m²)"
                                type="number"
                            />
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <Input
                                name="targetPrice"
                                value={item.targetPrice}
                                onChange={(e) => handleItemChange(idx, e)}
                                placeholder="호가 입력"
                                label="설정 가격 (만원)"
                                type="number"
                            />
                        </div>
                    </div>
                ))}

                {/* 추가 버튼 카드 */}
                {items.length < 4 && (
                    <div onClick={handleAddItem}
                        style={{ border: '2px dashed #ced4da', padding: '20px', borderRadius: '12px', background: '#f8f9fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: '300px', transition: 'all 0.2s', ':hover': { background: '#e9ecef' } }}>
                        <IoAddOutline size={40} color="#adb5bd" style={{ marginBottom: '10px' }} />
                        <span style={{ color: '#6c757d', fontWeight: 'bold' }}>비교 매물 추가하기</span>
                        <span style={{ color: '#adb5bd', fontSize: '0.85rem' }}>(최대 4개)</span>
                    </div>
                )}
            </div>

            <Button onClick={handleCompare} disabled={loading} style={{ width: '100%', padding: '15px', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '8px' }}>
                {loading ? '시세 비교 분석 중...' : '적정성 비교하기'}
            </Button>

            {/* 카드 뷰 결과 */}
            {results.length > 0 && (
                <div className="compare-results" style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '1.4rem', borderBottom: '2px solid #343a40', paddingBottom: '10px', marginBottom: '20px' }}>비교 결과 진단</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        {results.map((r, i) => {
                            const diffValue = r.priceDiff;
                            const isOverpriced = diffValue > 0;
                            const diffColor = isOverpriced ? '#dc3545' : '#198754';
                            const bgColor = isOverpriced ? '#fff5f5' : '#f0fff4';

                            return (
                                <div key={i} style={{ border: `1px solid ${isOverpriced ? '#f5c2c7' : '#c3e6cb'}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>

                                    <div style={{ background: isOverpriced ? '#f8d7da' : '#d4edda', padding: '15px', borderBottom: `1px solid ${isOverpriced ? '#f5c2c7' : '#c3e6cb'}`, textAlign: 'center' }}>
                                        <h4 style={{ margin: 0, color: isOverpriced ? '#842029' : '#0f5132', fontSize: '1.2rem' }}>{r.itemName}</h4>
                                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>{r.itemProps.transaction_type} • {r.itemProps.area_m2}m²</span>
                                    </div>

                                    <div style={{ padding: '20px' }}>
                                        <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>비교 호가</span>
                                            <strong style={{ fontSize: '1.2rem' }}>{r.targetPrice.toLocaleString()}만원</strong>
                                        </div>
                                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>인근 평균 시세</span>
                                            <strong style={{ fontSize: '1.1rem', color: '#adb5bd' }}>
                                                {r.averageMarketPrice > 0 ? `${r.averageMarketPrice.toLocaleString()}만원` : '정보 없음'}
                                            </strong>
                                        </div>

                                        <div style={{ background: bgColor, borderRadius: '8px', padding: '15px', border: `1px solid ${isOverpriced ? '#f5c2c7' : '#c3e6cb'}`, marginBottom: '15px' }}>
                                            <div style={{ color: diffColor, fontSize: '1.3rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '5px' }}>
                                                평균 대비 {Math.abs(diffValue).toLocaleString()}만원 {isOverpriced ? '비쌈' : '저렴'}
                                            </div>
                                            <div style={{ textAlign: 'center', fontSize: '0.9rem', color: diffColor }}>
                                                ({diffValue > 0 ? '+' : ''}{r.diffPercent.toFixed(1)}%)
                                            </div>
                                        </div>

                                        <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.5', color: '#495057' }}>
                                            <strong>💡 AI 진단:</strong> {r.analysisMessage}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default PriceComparison;

