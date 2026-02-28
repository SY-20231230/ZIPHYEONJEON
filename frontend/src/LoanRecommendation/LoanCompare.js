import React from 'react';
import MainLayout from "../layouts/MainLayout";
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Hero from "../components/common/Hero";

import './LoanCompare.css';

const LoanCompare = () => {
    const comparedLoans = [
        {
            id: 1,
            name: "저소득주민 융자사업",
            tags: ["주거", "무이자"],
            agency: "강원도 영월군청",
            rate: "0%",
            limit: "3,000만원",
            period: "3년 (연장불가)",
            age: "제한 없음",
            income: "기초생활수급자",
            incomeSub: "차상위계층 포함",
            repayment: "만기일시상환",
            isRecommended: true
        },
        {
            id: 2,
            name: "자활기금 대여사업",
            tags: ["자활", "공공"],
            agency: "강원도 춘천시청",
            rate: "1.0%",
            limit: "3,000만원",
            period: "5년",
            age: "만 19세 이상",
            income: "중위소득 50% 이하",
            incomeSub: "자활사업 참여자",
            repayment: "원금균등분할",
            isRecommended: false
        }
    ];

    return (
        <MainLayout>
            <div className="loan-compare-page">
                <div className="compare-container">

                    <div className="compare-header-wrapper">
                        <Hero
                            title="맞춤 대출 상품 비교"
                            subtitle="선택한 상품들의 금리와 한도를 한눈에 비교해보세요."
                        />
                        <div className="header-action-area">
                            <Button variant="outline" className="add-search-btn">
                                <span className="material-symbols-outlined">add</span> 상품 더 찾아보기
                            </Button>
                        </div>
                    </div>

                    {/* 상품 카드 그리드 */}
                    <div className="compare-card-grid">
                        {comparedLoans.map((loan) => (
                            <Card key={loan.id} className={`loan-compare-card ${loan.isRecommended ? 'recommended-border' : ''}`}>
                                {loan.isRecommended && <div className="recommend-tag">추천 1위</div>}

                                <div className="card-top-content">
                                    <div className="loan-badges">
                                        {loan.tags.map(tag => (
                                            <Badge key={tag} variant="secondary" className="type-badge">{tag}</Badge>
                                        ))}
                                    </div>
                                    <span className="material-symbols-outlined close-btn">cancel</span>
                                </div>

                                <h3 className="loan-title">{loan.name}</h3>

                                <div className="loan-visual-stats">
                                    <div className="stat-info">
                                        <span>최저 금리</span>
                                        <span className="blue-highlight">{loan.rate}</span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{width: loan.id === 1 ? '5%' : '25%'}}></div>
                                    </div>

                                    <div className="stat-info">
                                        <span>최대 한도</span>
                                        <span className="dark-val">{loan.limit}</span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{width: '30%'}}></div>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {/* 상품 추가 카드 */}
                        <Card className="empty-add-card">
                            <div className="plus-icon-circle">
                                <span className="material-symbols-outlined">add</span>
                            </div>
                            <p>비교할 상품을<br/>더 추가해보세요</p>
                        </Card>
                    </div>

                    {/* 상세 비교 테이블 영역 */}
                    <div className="compare-table-wrapper">
                        {/* 테이블 헤더 행 */}
                        <div className="table-row table-head">
                            <div className="table-cell label-col">비교 항목</div>
                            {comparedLoans.map(loan => (
                                <div key={loan.id} className="table-cell product-title-col">{loan.name}</div>
                            ))}
                            <div className="table-cell product-title-col" style={{color: '#cbd5e1'}}>-</div>
                        </div>

                        {/* 섹션 1: 기본 정보 */}
                        <div className="table-divider">
                            <span className="material-symbols-outlined">info</span> 기본 정보
                        </div>
                        <div className="table-row">
                            <div className="table-cell label-col">제공 기관</div>
                            {comparedLoans.map(loan => <div key={loan.id} className="table-cell">{loan.agency}</div>)}
                            <div className="table-cell"></div>
                        </div>
                        <div className="table-row">
                            <div className="table-cell label-col">최대 대출 기간</div>
                            {comparedLoans.map(loan => <div key={loan.id} className="table-cell">{loan.period}</div>)}
                            <div className="table-cell"></div>
                        </div>

                        {/* 섹션 2: 지원 자격 */}
                        <div className="table-divider">
                            <span className="material-symbols-outlined">person_search</span> 지원 자격
                        </div>
                        <div className="table-row">
                            <div className="table-cell label-col">연령 조건</div>
                            {comparedLoans.map(loan => <div key={loan.id} className="table-cell">{loan.age}</div>)}
                            <div className="table-cell"></div>
                        </div>
                        <div className="table-row">
                            <div className="table-cell label-col">소득 기준</div>
                            {comparedLoans.map(loan => (
                                <div key={loan.id} className="table-cell">
                                    <div className="bold-text">{loan.income}</div>
                                    <div className="small-sub-text">{loan.incomeSub}</div>
                                </div>
                            ))}
                            <div className="table-cell"></div>
                        </div>

                        {/* 섹션 3: 대출 조건 */}
                        <div className="table-divider">
                            <span className="material-symbols-outlined">account_balance_wallet</span> 대출 조건
                        </div>
                        <div className="table-row">
                            <div className="table-cell label-col">상환 방식</div>
                            {comparedLoans.map(loan => <div key={loan.id} className="table-cell">{loan.repayment}</div>)}
                            <div className="table-cell"></div>
                        </div>
                        <div className="table-row">
                            <div className="table-cell label-col">중도상환 수수료</div>
                            {comparedLoans.map(loan => (
                                <div key={loan.id} className="table-cell status-ok-LoanCf">
                                    <span className="material-symbols-outlined">check_circle</span> 없음
                                </div>
                            ))}
                            <div className="table-cell"></div>
                        </div>

                        {/* 상세 정보 보기 버튼 행 */}
                        <div className="table-row btn-row">
                            <div className="table-cell"></div>
                            {comparedLoans.map(loan => (
                                <div className="table-cell" key={loan.id}>
                                    <Button variant={loan.id === 1 ? "primary" : "dark"} className="full-width-btn">
                                        상세 정보 보기
                                    </Button>
                                </div>
                            ))}
                            <div className="table-cell"></div>
                        </div>
                    </div>

                    {/* 하단 공지 배너 */}
                    <div className="bottom-info-notice">
                        <span className="material-symbols-outlined">campaign</span>
                        <p>비교 결과는 참고용이며, 실제 대출 승인 및 조건은 개인의 신용도와 신청 시점에 따라 달라질 수 있습니다. 정확한 내용은 각 상품의 <strong>'상세 정보 보기'</strong>를 통해 해당 지자체나 기관 공고를 확인해주세요.</p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default LoanCompare;