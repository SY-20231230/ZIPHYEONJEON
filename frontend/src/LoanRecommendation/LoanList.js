import React, { useEffect, useMemo, useState } from 'react';
import './LoanList.css';
import MainLayout from "../layouts/MainLayout";
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Hero from "../components/common/Hero";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";

const TARGET_OPTIONS = ["청년", "근로자", "전세피해자", "금융취약계층", "무주택세대주", "기타"];
const RATE_OPTIONS = ["무이자", "고정금리", "변동금리"]
const PAYMENT_OPTIONS = ["원(리)금균등", "만기일시", "체증식분할", "거치식", "기타"]
const INST_OPTIONS = ["공공", "민간"]

const LoanList = () => {
    const location = useLocation();

    const API_BASE_URL = process.env.REACT_APP_API_URL || "https://ziphyeonjeon.kro.kr";

    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [selectedFilters, setSelectedFilters] = useState(() => {
        const initialStructure = {
            target: [],
            rate: [],
            payment: [],
            instType: []
        };

        if (location.state?.prevFilters) {
            return { ...initialStructure, ...location.state.prevFilters };
        }
        if (location.state?.initialInstType) {
            return { ...initialStructure, instType: [location.state.initialInstType] };
        }

        return initialStructure;
    });
    const [compareCount, setCompareCount] = useState(0);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }, [selectedFilters]);

    // 필터링된 데이터 계산
    const filteredLoans = useMemo(() => {
        if (!loans || loans.length === 0) return [];

        return loans.filter(loan => {
            // 대상 고객 필터 (trgt 컬럼 활용)
            const matchTarget = selectedFilters.target.length === 0 ||
                selectedFilters.target.some(f => {
                    if (f === "기타") {
                        return TARGET_OPTIONS.filter(opt => opt !== "기타")
                            .every(option => !loan?.trgt.includes(option));
                    }
                    return loan?.trgt?.includes(f);
                });

            // 금리 유형 필터 (irtCtg 컬럼 활용)
            const matchRate = selectedFilters.rate.length === 0 ||
                selectedFilters.rate.some(f => loan?.irtCtg.includes(f));

            // 상환 방법 필터 (rdptMthd 컬럼 활용)
            const matchPayment = selectedFilters.payment.length === 0 ||
                selectedFilters.payment.some(f => {
                    if (f === "기타") {
                        return PAYMENT_OPTIONS.filter(opt => opt !== "기타")
                            .every(option => !loan?.rdptMthd.includes(option));
                    }
                    return loan?.rdptMthd?.includes(f);
                });

            // 기관 구분 필터 (instCtg 컬럼 활용)
            const matchInst = selectedFilters.instType.length === 0 ||
                selectedFilters.instType.includes(loan?.origin);

            return matchTarget && matchRate && matchPayment && matchInst;
        });
    }, [loans, selectedFilters]);

    // 필터 변경 함수 (FilterGroup에서 호출)
    const handleFilterChange = (group, value) => {
        setSelectedFilters(prev => ({
            ...prev,
            [group]: prev[group].includes(value)
                ? prev[group].filter(v => v !== value)
                : [...prev[group], value]
        }));
    };

    useEffect(() => {
        const fetchLoans = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/loan/list`);
                // console.log(response.data);
                const { govLoans, bankLoans } = response.data;
                const combinedLoans = [
                    ...(govLoans || []).map(l => ({ ...l, origin: '공공' })),
                    ...(bankLoans || []).map(l => ({ ...l, origin: '민간' }))
                ];
                setLoans(combinedLoans);

            } catch (err) {
                console.error("LoanList.js 실패:", err);
                setError("대출 정보를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchLoans();
    }, [API_BASE_URL]);

    return (
        <MainLayout>
            <div className="loan-loan-page-wrapper">
                <div className="loan-max-container">
                    {/* Header */}
                    <Hero
                        badgeText="맞춤 대출 분석"
                        badgeIcon="auto_awesome"
                        title='대출 상품 목록'
                        subtitle="다양한 금융권 대출 상품을 한눈에 비교하고 선택할 수 있습니다."
                    />

                    <div className="loan-horizontal-filter-wrapper">
                        <div className="loan-filter-header" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <div style={{ fontWeight: '700' }}>전체 상품 <span
                                style={{ color: 'var(--primary)' }}>{filteredLoans.length}</span>
                            </div>
                            <div className="loan-filter-controls">
                                <button className="loan-filter-reset-btn" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFilters({ target: [], rate: [], payment: [], instType: [] });
                                }}>초기화
                                </button>
                            </div>
                        </div>

                        {isFilterOpen && (
                            <div className="loan-filter-content-horizontal">
                                <FilterGroup title="적용 대상" icon="person"
                                    options={[...TARGET_OPTIONS]}
                                    selected={selectedFilters.target}
                                    onChange={(val) => handleFilterChange('target', val)} />
                                <FilterGroup title="금리 유형" icon="trending_up"
                                    options={[...RATE_OPTIONS]}
                                    selected={selectedFilters.rate}
                                    onChange={(val) => handleFilterChange('rate', val)} />
                                <FilterGroup title="상환 방법" icon="payment"
                                    options={[...PAYMENT_OPTIONS]}
                                    selected={selectedFilters.payment}
                                    onChange={(val) => handleFilterChange('payment', val)} />
                                <FilterGroup title="기관 구분" icon="account_balance"
                                    options={[...INST_OPTIONS]}
                                    selected={selectedFilters.instType}
                                    onChange={(val) => handleFilterChange('instType', val)} />
                            </div>
                        )}
                    </div>

                    <div className="loan-main-content-vertical">

                        {error ? (<div>오류가 발생했습니다. 다시 시도해 주세요</div>) :
                            (!loading && filteredLoans.length > 0 ? (
                                filteredLoans.map((loan, index) => (
                                    <Card key={`${index}`}
                                        className={`loan-product-card ${loan?.isRecommended ? 'recommended' : ''}`}>
                                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '0' }}>
                                                        {loan?.badges?.map(b => (
                                                            <Badge key={b}
                                                                variant={loan?.isRecommended ? "primary" : "secondary"}>
                                                                {b}
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                        <label className="loan-filter-option"
                                                            style={{ marginBottom: 0 }}>
                                                            <input
                                                                type="checkbox"
                                                                onChange={(e) => setCompareCount(prev => e.target.checked ? prev + 1 : prev - 1)}
                                                            />
                                                            <h3 style={{
                                                                fontSize: '20px',
                                                                fontWeight: '700',
                                                                marginBottom: '4px'
                                                            }}>
                                                                {loan?.finPrdNm}
                                                            </h3>
                                                        </label>
                                                    </div>

                                                    <p style={{
                                                        fontSize: '14px',
                                                        color: 'var(--slate-500)'
                                                    }}>{loan?.desc}</p>

                                                    <div className="loan-product-info-grid">
                                                        <div>
                                                            <div className="loan-data-label">최저 금리</div>
                                                            <div
                                                                className={`loan-data-value ${loan?.isRecommended ? 'highlight' : ''}`}>
                                                                {loan?.irt.length > 10 ? (loan?.irt?.substring(0, 10) + "...") : (loan?.irt)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="loan-data-label">최대 한도</div>
                                                            <div
                                                                className="loan-data-value">{loan?.lnLmt.length > 10 ? (loan?.lnLmt?.substring(0, 10) + "...") : (loan?.lnLmt)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="loan-data-label">대출 기간</div>
                                                            <div
                                                                className="loan-data-value">{loan?.maxTotLnTrm.length > 10 ? (loan?.maxTotLnTrm?.substring(0, 10) + "...") : (loan?.maxTotLnTrm)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="loan-data-label">제공기관</div>
                                                            <div
                                                                className="loan-data-value">{loan?.ofrInstNm.length > 10 ? (loan?.ofrInstNm?.substring(0, 10) + "...") : (loan?.ofrInstNm)}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="loan-card-action-area">
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div className="loan-data-label">대상 조건</div>
                                                        <div style={{
                                                            fontWeight: '600',
                                                            fontSize: '14px'
                                                        }}>{loan?.trgt}</div>
                                                    </div>
                                                    <Link
                                                        to={`/loan/detail/${loan?.snq}`}
                                                        state={{ prevFilters: selectedFilters }}
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        <Button
                                                            variant={loan?.isRecommended ? "primary" : "outline"}
                                                            style={{
                                                                width: '100%',
                                                                borderRadius: '12px',
                                                                fontWeight: '700',
                                                                padding: '10px 24px'
                                                            }}
                                                        >
                                                            {loan?.isRecommended ? "자격 확인" : "상세 보기"}
                                                        </Button></Link>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                loading && <div className="skeleton-placeholder">상품 정보를 불러오는 중입니다...</div>
                            ))}
                    </div>

                    {/* Footer Info */}
                    <footer className="loan-info-footer-box">
                        <h4 style={{
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <span className="material-icons-outlined" style={{ color: '#f59e0b' }}>info</span> 꼭
                            확인하세요!
                        </h4>
                        <ul style={{
                            fontSize: '14px',
                            color: 'var(--slate-500)',
                            lineHeight: '1.8',
                            paddingLeft: '20px'
                        }}>
                            <li>표시된 금리는 최저금리 기준이며, 조건에 따라 달라질 수 있습니다.</li>
                            <li>정부지원 상품은 관련 법규 변화에 따라 상세 조건이 변경될 수 있습니다.</li>
                        </ul>
                    </footer>

                    {/* Floating Bar */}
                    {compareCount > 0 && (
                        <div className="loan-compare-bar">
                            <span style={{ fontSize: '14px', fontWeight: '700' }}>비교할 상품 <span
                                style={{ color: 'var(--primary)' }}>{compareCount}</span></span>
                            <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--slate-600)' }}></div>
                            <button style={{
                                background: 'none',
                                border: 'none',
                                color: compareCount > 0 ? 'white' : 'var(--slate-600)',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                선택 비교하기 <span className="material-icons-outlined"
                                    style={{ fontSize: '18px' }}>arrow_forward</span>
                            </button>
                        </div>)}
                </div>
            </div>
        </MainLayout>
    );
};

const FilterGroup = ({ title, icon, options, selected, onChange, isGrid }) => (
    <div className="loan-filter-section">
        <h3><span className="material-icons-outlined"
            style={{ fontSize: '16px', color: 'var(--slate-400)' }}>{icon}</span> {title}</h3>
        <div className={isGrid ? "loan-filter-options-grid" : "loan-filter-options-stack"}>
            {options.map(opt => (
                <label key={opt} className="loan-filter-option">
                    <input type="checkbox"
                        checked={selected.includes(opt)}
                        onChange={() => onChange(opt)} />
                    {opt}
                </label>
            ))}
        </div>
    </div>
);

export default LoanList;