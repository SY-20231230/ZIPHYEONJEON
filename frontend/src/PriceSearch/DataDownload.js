import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

import { downloadTradeDataUrl } from '../api/priceApi';

const SEOUL_GU_LIST = [
    { code: '11110', name: '종로구' },
    { code: '11140', name: '중구' },
    { code: '11170', name: '용산구' },
    { code: '11200', name: '성동구' },
    { code: '11215', name: '광진구' },
    { code: '11230', name: '동대문구' },
    { code: '11260', name: '중랑구' },
    { code: '11290', name: '성북구' },
    { code: '11305', name: '강북구' },
    { code: '11320', name: '도봉구' },
    { code: '11350', name: '노원구' },
    { code: '11380', name: '은평구' },
    { code: '11410', name: '서대문구' },
    { code: '11440', name: '마포구' },
    { code: '11470', name: '양천구' },
    { code: '11500', name: '강서구' },
    { code: '11530', name: '구로구' },
    { code: '11545', name: '금천구' },
    { code: '11560', name: '영등포구' },
    { code: '11590', name: '동작구' },
    { code: '11620', name: '관악구' },
    { code: '11650', name: '서초구' },
    { code: '11680', name: '강남구' },
    { code: '11710', name: '송파구' },
    { code: '11740', name: '강동구' },
];

const DataDownload = () => {
    const [sigunguCode, setSigunguCode] = useState('11680'); // Default Kangnam
    const [format, setFormat] = useState('csv');
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        try {
            const url = downloadTradeDataUrl('11', sigunguCode, format);
            const response = await fetch(url);
            if (!response.ok) throw new Error('다운로드 실패');
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const selectedGu = SEOUL_GU_LIST.find(g => g.code === sigunguCode);
            link.download = `trade_data_${selectedGu?.name || sigunguCode}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (err) {
            alert('다운로드 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <h2>실거래가 데이터 다운로드 (P-007)</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>지역 코드 (구)</label>
                    <select
                        value={sigunguCode}
                        onChange={(e) => setSigunguCode(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        {SEOUL_GU_LIST.map(gu => (
                            <option key={gu.code} value={gu.code}>
                                {gu.name} ({gu.code})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>파일 형식</label>
                    <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                        <option value="csv">CSV (.csv)</option>
                    </select>
                </div>
                <Button onClick={handleDownload} variant="primary" disabled={loading}>
                    {loading ? '다운로드 중...' : '다운로드 시작'}
                </Button>
                <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>※ 선택한 구의 아파트 실거래 내역을 CSV 파일로 다운로드합니다.</p>
            </div>
        </Card>
    );
};

export default DataDownload;


