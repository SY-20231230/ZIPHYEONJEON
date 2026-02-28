import React, {useEffect, useState} from 'react';
import {Link, useLocation, useNavigate, useParams} from "react-router-dom";
import './LoanDetail.css';
import MainLayout from "../layouts/MainLayout";
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import axios from "axios";

const LoanDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const prevFilters = location.state?.prevFilters;

    const {snq} = useParams();
    const [loanData, setLoanData] = useState(null);

    useEffect(() => {
        axios.get(`/api/loan/detail/${snq}`)
            .then(response => setLoanData(response.data))
            .catch(error => console.error("데이터 로드 실패:", error));
    }, [snq]);

    if (!loanData) return <div className="loading-LoanDetail">데이터를 불러오는 중입니다...</div>;

    return (
        <MainLayout>
            <div className="ld-wrapper-LoanDetail">
                {/* 상단 헤더 섹션 */}
                <header className="ld-header-LoanDetail">
                    <Link
                        to={`/loan/list`}
                        state={{ prevFilters: location.state?.prevFilters }}
                        style={{textDecoration: 'none'}}
                    >
                        <button className="ld-back-btn-LoanDetail">
                            <span className="material-icons">chevron_left</span>
                            대출 목록으로 돌아가기
                        </button>
                    </Link>
                    <div className="ld-header-main-LoanDetail">
                        <div className="ld-title-area-LoanDetail">
                            <div className="ld-badge-row-LoanDetail">
                                <Badge color="blue" className="badge-LoanDetail">{loanData.usge}</Badge>
                                <Badge color="gray" className="badge-LoanDetail">{loanData.irtCtg}</Badge>
                            </div>
                            <h1 className="ld-main-title-LoanDetail">{loanData.finPrdNm}</h1>
                            <p className="ld-sub-title-LoanDetail">{loanData.ofrInstNm}에서 지원하는 프로그램</p>
                        </div>
                        <div className="ld-action-btns-LoanDetail">
                            <button className="ld-icon-btn-LoanDetail"><span className="material-icons">share</span>
                            </button>
                            <button className="ld-icon-btn-LoanDetail"><span
                                className="material-icons">bookmark_border</span></button>
                        </div>
                    </div>
                </header>

                <div className="ld-grid-container-LoanDetail">
                    {/* 왼쪽 상세 정보 섹션 */}
                    <main className="ld-main-content-LoanDetail">
                        <section className="ld-card-LoanDetail">
                            <h3 className="ld-card-label-LoanDetail"><span className="material-icons">info</span> 기본 정보
                            </h3>
                            <div className="ld-info-grid-LoanDetail">
                                <div className="ld-info-item-LoanDetail">
                                    <span className="ld-label-LoanDetail">최저 금리</span>
                                    <span className="ld-value-LoanDetail primary-LoanDetail">{loanData.irt}</span>
                                </div>
                                <div className="ld-info-item-LoanDetail">
                                    <span className="ld-label-LoanDetail">최대 한도</span>
                                    <span className="ld-value-LoanDetail">{loanData.lnLmt}</span>
                                </div>
                                <div className="ld-info-item-LoanDetail">
                                    <span className="ld-label-LoanDetail">대출 기간</span>
                                    <span className="ld-value-LoanDetail">{loanData.maxTotLnTrm}</span>
                                </div>
                                <div className="ld-info-item-LoanDetail">
                                    <span className="ld-label-LoanDetail">상환 방법</span>
                                    <span className="ld-value-LoanDetail">{loanData.rdptMthd}</span>
                                </div>
                            </div>
                        </section>

                        <section className="ld-card-LoanDetail">
                            <h3 className="ld-card-label-LoanDetail"><span
                                className="material-icons">person_search</span> 지원 자격 및 대상</h3>
                            <div className="ld-desc-list-LoanDetail">
                                <div className="ld-desc-row-LoanDetail">
                                    <span className="ld-desc-label-LoanDetail">대상 조건</span>
                                    <p className="ld-desc-value-LoanDetail">{loanData.trgt}</p>
                                </div>
                                <div className="ld-desc-row-LoanDetail">
                                    <span className="ld-desc-label-LoanDetail">소득 조건</span>
                                    <p className="ld-desc-value-LoanDetail">{loanData.incm}</p>
                                </div>
                                <div className="ld-desc-row-LoanDetail full-LoanDetail">
                                    <span className="ld-desc-label-LoanDetail">세부 내용</span>
                                    <div className="ld-desc-box-LoanDetail">{loanData.suprTgtDtlCond}</div>
                                </div>
                            </div>
                        </section>

                        <section className="ld-card-LoanDetail">
                            <h3 className="ld-card-label-LoanDetail">
                                <span className="material-icons">business</span> 제공 기관 정보
                            </h3>
                            <div className="ld-agency-info-LoanDetail">
                                <div className="ld-agency-icon-LoanDetail">
                                    <span className="material-icons">domain</span>
                                </div>
                                <div className="ld-agency-text-LoanDetail">
                                    <strong className="ld-agency-name-LoanDetail">{loanData.ofrInstNm}</strong>
                                    <div className="ld-agency-contact-LoanDetail">
                                        <span className="material-icons">phone</span>
                                        <span className="ld-contact-text-LoanDetail">{loanData.cnpl}</span>
                                    </div>
                                    <div className="ld-agency-link-LoanDetail">
                                        <span className="material-icons">language</span>
                                        <a href={loanData.rltSite} target="_blank" rel="noopener noreferrer"
                                           className="ld-link-text-LoanDetail">
                                            {loanData.rltSite}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>

                    {/* 오른쪽 사이드바 섹션 */}
                    <aside className="ld-sidebar-LoanDetail">
                        <div className="ld-blue-card-LoanDetail">
                            <h4>나의 적합도 확인</h4>
                            <p className="ld-blue-card-desc-LoanDetail">몇 가지 질문을 통해 적합 여부를 바로 확인해 보세요.</p>
                            <ul className="ld-checklist-LoanDetail">
                                <li className="checked-LoanDetail">나이 기준 충족 <span
                                    className="material-icons">check_circle</span></li>
                                <li className="checked-LoanDetail">소득 기준 충족 <span
                                    className="material-icons">check_circle</span></li>
                                <li className="unchecked-LoanDetail">거주지 증명 필요 <span
                                    className="material-icons">radio_button_unchecked</span></li>
                            </ul>
                            <button className="ld-white-btn-LoanDetail">적합도 테스트 시작하기</button>
                        </div>

                        <div className="ld-calc-card-LoanDetail">
                            <h4>대출 계산기</h4>
                            <div className="ld-input-field-LoanDetail">
                                <label>대출 신청 금액</label>
                                <div className="ld-input-wrap-LoanDetail">
                                    <input type="text" defaultValue="3,000"/>
                                    <span>만원</span>
                                </div>
                            </div>
                            <div className="ld-calc-summary-LoanDetail">
                                <div className="ld-calc-row-LoanDetail">
                                    <span>총 상환 금액</span>
                                    <strong>30,000,000원</strong>
                                </div>
                            </div>
                            <button className="ld-dark-btn-LoanDetail">신청하러 가기</button>
                        </div>
                    </aside>
                </div>
            </div>
        </MainLayout>
    );
};

export default LoanDetail;