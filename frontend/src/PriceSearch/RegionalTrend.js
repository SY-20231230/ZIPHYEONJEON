import React, { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { getRegionalTrend } from '../api/priceApi';

const RegionalTrend = () => {
    const [address, setAddress] = useState('');
    const [trendData, setTrendData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [propertyType, setPropertyType] = useState('apt'); // 'apt', 'villa', 'officetel'

    const handleSearch = async () => {
        if (!address) {
            alert('지역명을 입력해주세요.');
            return;
        }
        setLoading(true);
        try {
            const data = await getRegionalTrend(address);
            if (!data.trends || data.trends.length === 0) {
                alert('해당 지역에 대한 시세 데이터가 없습니다.');
            }
            setTrendData(data);
        } catch (error) {
            console.error(error);
            alert('시세 추이를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const formattedData = useMemo(() => {
        if (!trendData || !trendData.trends) return [];
        return trendData.trends.map(item => ({
            ...item,
            periodStr: `${item.period.substring(0, 4)}.${item.period.substring(4)}`
        }));
    }, [trendData]);

    const propertyTypes = [
        { id: 'apt', label: '아파트' },
        { id: 'villa', label: '빌라/연립' },
        { id: 'officetel', label: '오피스텔' }
    ];

    const currentLines = {
        apt: [
            { key: 'aptSale', name: '매매 (만원/m²)', color: '#007bff' },
            { key: 'aptJeonse', name: '전세 (만원/m²)', color: '#28a745' },
            { key: 'aptWolse', name: '월세 (만원)', color: '#ffc107' }
        ],
        villa: [
            { key: 'villaSale', name: '매매 (만원/m²)', color: '#007bff' },
            { key: 'villaJeonse', name: '전세 (만원/m²)', color: '#28a745' },
            { key: 'villaWolse', name: '월세 (만원)', color: '#ffc107' }
        ],
        officetel: [
            { key: 'officetelSale', name: '매매 (만원/m²)', color: '#007bff' },
            { key: 'officetelJeonse', name: '전세 (만원/m²)', color: '#28a745' },
            { key: 'officetelWolse', name: '월세 (만원)', color: '#ffc107' }
        ]
    };

    return (
        <Card className="trend-card">
            <h2 style={{ marginBottom: '10px' }}>지역 시세 추이 (P-006)</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
                2024년 1월부터 2025년 12월까지의 시세 변동 흐름을 확인합니다.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="구 이름과 동 이름을 입력하세요 (예: 은평구 역촌동)"
                    style={{ flex: 1 }}
                />
                <Button onClick={handleSearch} disabled={loading} style={{ minWidth: '80px' }}>
                    {loading ? '조회 중...' : '조회'}
                </Button>
            </div>

            {trendData && trendData.trends && trendData.trends.length > 0 && (
                <div className="chart-container" style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0 }}>{trendData.regionName} 시세 추이</h3>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {propertyTypes.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setPropertyType(type.id)}
                                    style={{
                                        padding: '5px 12px',
                                        fontSize: '13px',
                                        borderRadius: '20px',
                                        border: '1px solid #ddd',
                                        background: propertyType === type.id ? '#333' : '#fff',
                                        color: propertyType === type.id ? '#fff' : '#333',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ width: '100%', height: 400, background: '#f9f9f9', borderRadius: '8px', padding: '20px 10px 10px 0' }}>
                        <ResponsiveContainer>
                            <LineChart data={formattedData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="periodStr"
                                    tick={{ fontSize: 11 }}
                                    interval={2}
                                />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value, name) => [`${value.toLocaleString()}`, name]}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                {currentLines[propertyType].map(line => (
                                    <Line
                                        key={line.key}
                                        type="monotone"
                                        dataKey={line.key}
                                        name={line.name}
                                        stroke={line.color}
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: line.color, strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                        connectNulls
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    <p style={{ marginTop: '15px', fontSize: '12px', color: '#888', textAlign: 'right' }}>
                        * 매매/전세 단위: 만원/m², 월세 단위: 만원
                    </p>
                </div>
            )}
        </Card>
    );
};

export default RegionalTrend;
