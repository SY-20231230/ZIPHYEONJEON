import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { searchLandPrice, getPnuByAddress } from '../api/priceApi';
import { IoSearchOutline, IoLocationOutline } from 'react-icons/io5';

const LandPriceSearch = () => {
    const [addressQuery, setAddressQuery] = useState('');
    const [pnu, setPnu] = useState('');
    const [data, setData] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [loadingPnu, setLoadingPnu] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    // 1단계: 주소로 PNU 조회
    const handleFindPnu = async () => {
        if (!addressQuery.trim()) {
            alert('주소를 입력해주세요. (예: 반포동 123)');
            return;
        }
        setLoadingPnu(true);
        try {
            const result = await getPnuByAddress(addressQuery);
            if (result && result.pnu) {
                setPnu(result.pnu);
                setData(null); // PNU가 바뀌면 이전 결과 초기화
                setParsedData([]);
            } else {
                alert('해당 주소의 PNU(토지 고유번호)를 찾을 수 없습니다.');
            }
        } catch (e) {
            alert('PNU 조회 중 오류가 발생했습니다.');
        } finally {
            setLoadingPnu(false);
        }
    };

    const parseVworldJson = (jsonResult) => {
        try {
            // Check if it's the valid WFS JSON format
            if (!jsonResult || !jsonResult.response || !jsonResult.response.result || !jsonResult.response.result.featureCollection) {
                return [];
            }

            const features = jsonResult.response.result.featureCollection.features;
            if (!features || features.length === 0) return [];

            const parsedList = [];
            features.forEach(feature => {
                const props = feature.properties;
                // VWorld LP_PA_CBND_BUBUN attribute names might be lowercase
                if (props && props.jiga) {
                    // Note: This API sometimes doesn't provide year/month directly in easily readable format 
                    // or it provides the single most recent one. 
                    // Let's assume it provides standard base_year if available, else fallback to '최근'
                    const year = props.base_year || props.base_mon?.substring(0, 4) || '최근';
                    const month = props.base_month || props.base_mon?.substring(4, 6) || '01';

                    parsedList.push({
                        year: year,
                        month: month,
                        price: parseInt(props.jiga, 10).toLocaleString()
                    });
                }
            });

            // 최신 연도순 정렬
            return parsedList.sort((a, b) => {
                if (a.year === '최근' || b.year === '최근') return 0;
                return parseInt(b.year) - parseInt(a.year);
            });
        } catch (e) {
            console.error("JSON 파싱 에러:", e);
            return [];
        }
    };

    // 2단계: PNU로 공시지가 조회
    const handleSearch = async () => {
        if (!pnu) {
            alert('PNU 코드를 먼저 입력하거나 주소로 검색해주세요.');
            return;
        }
        setLoadingData(true);
        try {
            const result = await searchLandPrice({ uninum_code: pnu });

            // result is expected to be a string or JSON object depending on Axios parsing
            const jsonObj = typeof result === 'string' ? JSON.parse(result) : result;
            setData(jsonObj);

            // 파싱 시도
            const parsed = parseVworldJson(jsonObj);
            setParsedData(parsed);

        } catch (e) {
            alert('공시지가 데이터 조회 실패');
        } finally {
            setLoadingData(false);
        }
    };

    return (
        <Card style={{ maxWidth: '800px', margin: '0 auto', padding: '30px' }}>
            <h2 style={{ color: '#0d6efd', marginBottom: '10px' }}>공시지가 조회 (P-003)</h2>
            <p style={{ color: '#6c757d', marginBottom: '30px' }}>주소를 검색하여 토지 고유번호(PNU)를 자동으로 찾고 공시지가를 조회합니다.</p>

            {/* Step 1: 주소 검색 */}
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e9ecef' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#495057', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#0d6efd', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
                    주소로 PNU 찾기
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <IoSearchOutline style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#adb5bd', fontSize: '20px' }} />
                        <Input
                            value={addressQuery}
                            onChange={(e) => setAddressQuery(e.target.value)}
                            placeholder="지번/도로명 주소 (예: 용산구 한강대로 405)"
                            style={{ width: '100%', paddingLeft: '45px', paddingRight: '15px', paddingTop: '12px', paddingBottom: '12px', borderRadius: '8px', border: '1px solid #ced4da', boxSizing: 'border-box' }}
                            onKeyDown={(e) => e.key === 'Enter' && handleFindPnu()}
                        />
                    </div>
                    <Button onClick={handleFindPnu} disabled={loadingPnu} style={{ padding: '0 25px', borderRadius: '8px' }}>
                        {loadingPnu ? '검색 중...' : 'PNU 검색'}
                    </Button>
                </div>
            </div>

            {/* Step 2: PNU 확인 및 조회 */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #e9ecef', position: 'relative' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: '#495057', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#0d6efd', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
                    토지 고유번호(PNU) 확인 및 공시지가 조회
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                    <IoLocationOutline size={24} color="#dc3545" />
                    <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: '#6c757d', marginBottom: '4px' }}>검색된 PNU 코드 (수동 수정 가능)</span>
                        <input
                            value={pnu}
                            onChange={(e) => setPnu(e.target.value)}
                            placeholder="주소를 검색하면 19자리 숫자가 자동 기입됩니다."
                            style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.1rem', fontWeight: 'bold', color: pnu ? '#212529' : '#adb5bd', outline: 'none' }}
                        />
                    </div>
                    <Button onClick={handleSearch} disabled={loadingData || !pnu} style={{ padding: '10px 20px', borderRadius: '8px', minWidth: '120px' }}>
                        {loadingData ? '조회 중...' : '공시지가 조회'}
                    </Button>
                </div>
            </div>

            {/* Step 3: 결과 출력 */}
            {data && (
                <div style={{ marginTop: '30px' }}>
                    <h3 style={{ fontSize: '1.2rem', paddingBottom: '10px', borderBottom: '2px solid #343a40', marginBottom: '20px' }}>조회 결과</h3>

                    {parsedData.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                            {parsedData.map((item, index) => (
                                <div key={index} style={{ border: '1px solid #e9ecef', borderRadius: '10px', padding: '15px', background: index === 0 ? '#e3f2fd' : '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: '0.9rem', color: index === 0 ? '#0d6efd' : '#6c757d', marginBottom: '8px', fontWeight: 'bold' }}>
                                        {item.year}년 {item.month}월 기준
                                        {index === 0 && <span style={{ marginLeft: '5px', padding: '2px 6px', background: '#0d6efd', color: 'white', borderRadius: '10px', fontSize: '0.7rem' }}>최신</span>}
                                    </div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#212529' }}>
                                        {item.price} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>원/m²</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // 파싱 실패 시 원본 표시
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px', overflowX: 'auto', fontSize: '0.9rem', border: '1px solid #dee2e6' }}>
                            <p style={{ color: '#dc3545', marginBottom: '10px', fontWeight: 'bold' }}>데이터를 표로 변환할 수 없습니다. 원본 데이터를 표시합니다.</p>
                            <pre>{typeof data === 'object' ? JSON.stringify(data, null, 2) : data}</pre>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default LandPriceSearch;
