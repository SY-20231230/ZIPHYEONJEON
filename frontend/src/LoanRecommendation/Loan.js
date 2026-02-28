import React, {useEffect, useState} from 'react';
import './Loan.css';
import MainLayout from "../layouts/MainLayout";
import Card from '../components/common/Card';
import Hero from '../components/common/Hero';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import axios from "axios";
import {Link, useNavigate} from "react-router-dom";

const Loan = () => {
        const navigate = useNavigate();

        const [govLoans, setGovLoans] = useState([]);
        const [bankLoans, setBankLoans] = useState([]);
        const [loanCount, setLoanCount] = useState(0);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            fetchLoans();
        }, []);

        const fetchLoans = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/loan/list');
                console.log(response.data);

                const {govLoans, bankLoans} = response.data;

                setGovLoans(govLoans || []);
                setBankLoans(bankLoans || []);
                setLoanCount((govLoans?.length || 0) + (bankLoans?.length || 0));
            } catch (err) {
                console.error("Loan.js 실패:", err);
            } finally {
                setLoading(false);
            }
        };

        return (
            <MainLayout>
                <div className="loan-page-loan">
                    <div className="dashboard-container-loan">
                        <Hero
                            badgeText="맞춤 대출 분석"
                            badgeIcon="auto_awesome"
                            title='나에게 가장 유리한 최적의 대출을 찾아보세요'
                            subtitle="다양한 금융권 대출 상품을 한눈에 비교하고 선택할 수 있습니다."
                        />

                        <div className="layout-grid-loan">
                            <div className="main-content-loan">
                                {/* Government Loans */}
                                <section className="section-loan">
                                    <div className="section-header-loan">
                                        <h2 className="section-title-loan">
                                            <span className="material-symbols-outlined icon-blue">account_balance</span>
                                            정부 지원 대출 상품
                                        </h2>
                                        <Link
                                            to="/loan/list"
                                            state={{initialInstType: "공공"}}
                                            style={{textDecoration: 'none'}}>
                                            <Button variant="ghost" size="sm">
                                                {loading && "..."}
                                                {!loading && loanCount === 0 && (
                                                    <p onClick={(e) => {
                                                        e.preventDefault();
                                                        fetchLoans();
                                                    }} style={{cursor: 'pointer'}}>
                                                        데이터 로드에 실패했습니다.&ensp;
                                                        <span
                                                            style={{textDecoration: 'underline', color: 'red'}}>새로고침</span>
                                                    </p>
                                                )}
                                                {!loading && loanCount > 0 && `${govLoans.length}개 상품 전체보기`}
                                            </Button>
                                        </Link>
                                    </div>
                                    <div className="product-grid-loan">
                                        {govLoans.slice(0, 3).map(loan => (
                                            <Card key={loan.snq} className="loan-card-loan" padding="24px">
                                                <Badge variant="subtle"
                                                       className="mb-12">{loan.usge}</Badge>
                                                <h3 className="loan-title-loan">{loan.finPrdNm.length > 10 ? loan.finPrdNm.substring(0, 10) + "..." : loan.finPrdNm}</h3>
                                                <div className="loan-rate-box-loan">
                                                    연 {loan.irt === "-" ?
                                                    <span style={{fontSize: '24px', fontWeight: '900', color: '#6C757D'}}>별도 확인</span>
                                                    : <span className="loan-rate-value-loan">{loan.irt}</span>} ~
                                                </div>
                                                <ul className="benefit-list-loan">
                                                    <li><span
                                                        className="material-symbols-outlined">check</span> 최대 {loan.lnLmt} 한도
                                                    </li>
                                                    <li><span className="material-symbols-outlined">check</span> {loan.trgt}
                                                    </li>
                                                </ul>
                                                <Link to={`/loan/detail/${loan.snq}`} style={{textDecoration: 'none'}}>
                                                    <Button variant="secondary" fullWidth className="mt-16">자격 확인</Button>
                                                </Link>
                                            </Card>
                                        ))}
                                    </div>
                                </section>

                                {/* Bank Loans Comparison */}
                                <section className="section-loan">
                                    <Card padding="0" overflow={false}>
                                        <div className="table-header-loan">
                                            <h2 className="section-title-loan">
                                                <span className="material-symbols-outlined icon-blue">list_alt</span>
                                                1금융권 실시간 금리 비교
                                            </h2>
                                            <span className="update-time-loan">2024.05.22 14:00 기준</span>
                                        </div>
                                        <div className="table-wrapper-loan">
                                            <table className="comparison-table-loan">
                                                <thead>
                                                <tr>
                                                    <th>은행사</th>
                                                    <th>상품명</th>
                                                    <th>최저 금리</th>
                                                    <th>최대 한도</th>
                                                    <th></th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {bankLoans.slice(0, 3).map(loan => (
                                                    <tr key={loan.snq}>
                                                        <td className="bank-info-loan">
                                                            <div
                                                                className={`bank-logo-loan`}>{loan.logo}</div>
                                                            <span className="bank-name-loan">{loan.ofrInstNm}</span>
                                                        </td>
                                                        <td>{loan.finPrdNm.length > 13 ? loan.finPrdNm.substring(0, 13) + "..." : loan.finPrdNm}</td>
                                                        <td className="rate-td-loan">{loan.irt}</td>
                                                        <td>{loan.lnLmt}</td>
                                                        <Link to={`/loan/detail/${loan.snq}`}
                                                              style={{textDecoration: 'none'}}>
                                                            <td><span
                                                                className="material-symbols-outlined">chevron_right</span>
                                                            </td>
                                                        </Link>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                            <Link
                                                to="/loan/list"
                                                state={{initialInstType: "민간"}}
                                                style={{textDecoration: 'none', display: 'block'}}>
                                                <button className="table-footer-btn-loan">
                                                    {loanCount === 0
                                                        ? "데이터 로드에 실패했습니다. 새로고침 해주세요."
                                                        : (bankLoans.length + "개 은행 상품 더보기")
                                                    }
                                                    <span className="material-symbols-outlined">expand_more</span>
                                                </button>
                                            </Link>
                                        </div>
                                    </Card>
                                </section>
                            </div>

                            <aside className="sidebar-loan">
                                <Card className="sidebar-item-loan" padding="24px">
                                    <div className="sidebar-header-loan">
                                        <span className="material-symbols-outlined icon-blue">analytics</span>
                                        나의 대출 역량
                                    </div>
                                    <div className="credit-score-loan">
                                        <div className="score-loan">
                                            <input type="text" defaultValue="???"/>
                                            <span>점</span>
                                        </div>
                                        <p className="desc-loan">NICE / KCB 기준 점수를 입력해주세요.</p>
                                    </div>
                                    <Button variant="secondary" fullWidth icon="link" className="mb-8">신용점수 기반 분석하기</Button>
                                    <div className="sidebar-links-loan">
                                        <div className="link-item-loan"><span
                                            className="material-symbols-outlined">calculate</span> 계산기
                                        </div>
                                        <div className="link-item-loan"><span
                                            className="material-symbols-outlined">history</span> 최근 조회
                                        </div>
                                    </div>
                                </Card>

                                <Card className="sidebar-tip-loan" padding="24px">
                                    <Badge color="blue" variant="solid" className="mb-12">PRO TIP</Badge>
                                    <h4>대출 승인 확률을 높이는 법</h4>
                                    <p>전세 보증 보험 가입이 가능한 매물을 선택하면 대출 금리 우대 혜택을 받을 수 있습니다.</p>
                                    <Button variant="ghost" icon="arrow_forward" className="p-0 text-blue">분석 리포트
                                        확인</Button>
                                </Card>
                            </aside>
                        </div>

                        <footer className="loan-footer-notice-loan">
                            <h4>꼭 확인하세요!</h4>
                            <ul>
                                <li>표시된 금리는 최저금리 기준이며, 개인의 환경에 따라 달라질 수 있습니다.</li>
                                <li>정부지원 상품은 관련 법규 변화에 따라 상시 변경될 수 있습니다.</li>
                                <li>본 서비스에서 제공하는 정보는 참고용이며, 최종 계약은 금융기관에서 진행하시기 바랍니다.</li>
                            </ul>
                        </footer>
                    </div>
                </div>
            </MainLayout>
        );
    }
;

export default Loan;
