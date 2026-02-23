import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { searchMolitTrade, searchByComplexName, searchBySpecificAddress } from '../api/priceApi';

const RealTradeSearch = () => {
    const [searchMode, setSearchMode] = useState('region'); // 'region', 'complex', 'address'
    const [formData, setFormData] = useState({
        sigunguName: '',
        buildingType: '아파트',
        dealYearMonth: '202412', // Default
        complexName: '',
        specificAddress: '',
        dealType: '' // '' (All), '매매', '전세', '월세'
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        setResults([]);
        try {
            let data = [];
            if (searchMode === 'region') {
                if (!formData.sigunguName) {
                    alert('지역명(구)을 입력해주세요.');
                    setLoading(false);
                    return;
                }
                const params = {
                    sigungu_name: formData.sigunguName,
                    building_type: formData.buildingType,
                    deal_year_month: formData.dealYearMonth,
                    deal_type: formData.dealType
                };
                data = await searchMolitTrade(params);
            } else if (searchMode === 'complex') {
                if (!formData.complexName) {
                    alert('아파트 단지명을 입력해주세요.');
                    setLoading(false);
                    return;
                }
                data = await searchByComplexName(formData.complexName, formData.dealType);
            } else if (searchMode === 'address') {
                if (!formData.specificAddress) {
                    alert('주소를 입력해주세요.');
                    setLoading(false);
                    return;
                }
                data = await searchBySpecificAddress(formData.specificAddress, formData.dealType);
            }

            setResults(data);
            if (data.length === 0) {
                alert('검색 결과가 없습니다.');
            }
        } catch (err) {
            setError('데이터를 불러오는 중 오류가 발생했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="price-search-card">
            <h2>국토부 실거래가 조회 (P-001)</h2>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['region', 'complex', 'address'].map(mode => (
                    <button
                        key={mode}
                        onClick={() => setSearchMode(mode)}
                        style={{
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '20px',
                            background: searchMode === mode ? '#0d6efd' : '#f0f0f0',
                            color: searchMode === mode ? 'white' : '#333',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            flex: '1 1 auto'
                        }}
                    >
                        {mode === 'region' && '지역별 조회'}
                        {mode === 'complex' && '아파트 단지명 검색'}
                        {mode === 'address' && '상세 주소 검색'}
                    </button>
                ))}
            </div>

            <div className="search-form" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>

                {searchMode === 'region' && (
                    <>
                        <Input
                            name="sigunguName"
                            value={formData.sigunguName}
                            onChange={handleChange}
                            placeholder="지역명 (예: 강남구)"
                            label="지역"
                        />
                        <div className="form-group">
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: 'bold' }}>건물 유형</label>
                            <select
                                name="buildingType"
                                value={formData.buildingType}
                                onChange={handleChange}
                                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                            >
                                <option value="아파트">아파트</option>
                                <option value="빌라">빌라/연립</option>
                                <option value="오피스텔">오피스텔</option>
                            </select>
                        </div>
                        <Input
                            name="dealYearMonth"
                            value={formData.dealYearMonth}
                            onChange={handleChange}
                            placeholder="YYYYMM"
                            label="거래년월"
                        />
                    </>
                )}

                {searchMode === 'complex' && (
                    <Input
                        name="complexName"
                        value={formData.complexName}
                        onChange={handleChange}
                        placeholder="예: 은마, 타워팰리스"
                        label="아파트 단지명"
                        style={{ minWidth: '300px' }}
                    />
                )}

                {searchMode === 'address' && (
                    <Input
                        name="specificAddress"
                        value={formData.specificAddress}
                        onChange={handleChange}
                        placeholder="예: 서울특별시 강남구 테헤란로 123"
                        label="도로명/지번 주소"
                        style={{ minWidth: '350px' }}
                    />
                )}

                <div className="form-group" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <label style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '5px' }}>거래 유형</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {['', '매매', '전세', '월세'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFormData(prev => ({ ...prev, dealType: type }))}
                                style={{
                                    padding: '5px 12px',
                                    fontSize: '13px',
                                    border: '1px solid #ddd',
                                    borderRadius: '15px',
                                    background: formData.dealType === type ? '#6c757d' : 'white',
                                    color: formData.dealType === type ? 'white' : '#555',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {type === '' ? '전체' : type}
                            </button>
                        ))}
                    </div>
                </div>

                <Button onClick={handleSearch} disabled={loading} style={{ height: '40px', display: 'flex', alignItems: 'center' }}>
                    {loading ? '검색 중...' : '조회'}
                </Button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <div className="result-list">
                {results.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                            <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                <th style={{ padding: '10px', textAlign: 'left' }}>단지명/건물명</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>주소</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>거래유형</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>전용면적</th>
                                <th style={{ padding: '10px', textAlign: 'right' }}>거래금액(만원)</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>계약일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{item.complexName || '-'}</td>
                                    <td style={{ padding: '10px' }}>{item.sigungu} {item.jibun}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            background: item.dealType === '매매' ? '#fff3cd' : (item.dealType === '전세' ? '#cfe2ff' : '#d1e7dd'),
                                            color: item.dealType === '매매' ? '#856404' : (item.dealType === '전세' ? '#084298' : '#0f5132'),
                                            border: `1px solid ${item.dealType === '매매' ? '#ffeeba' : (item.dealType === '전세' ? '#b6d4fe' : '#badbcc')}`
                                        }}>
                                            {item.dealType}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{item.exclusiveArea}㎡</td>
                                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#0056b3' }}>
                                        {item.dealAmountMan?.toLocaleString()}
                                        {item.dealType === '월세' && item.monthlyRentMan && ` / ${item.monthlyRentMan}`}
                                    </td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        {item.contractYm}.{item.contractDay}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    !loading && <p style={{ color: '#888', textAlign: 'center' }}>
                        {searchMode === 'complex' && '단지명을 입력하면 2024년 이후의 모든 실거래 내역이 조회됩니다.'}
                        {searchMode === 'address' && '주소를 입력하면 해당 건물의 실거래 내역을 찾습니다.'}
                        {searchMode === 'region' && '조회된 데이터가 없습니다.'}
                    </p>
                )}
            </div>
        </Card>
    );
};

export default RealTradeSearch;
