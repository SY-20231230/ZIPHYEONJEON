import React, {useEffect} from 'react';
import './RiskReport.css';
import MainLayout from "../layouts/MainLayout";
import Card from '../components/common/Card';
import Hero from '../components/common/Hero';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import {useLocation, useNavigate} from "react-router-dom";

const RiskReport = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // 페이지 상단으로 로드
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const resultData = location.state?.riskAnalysisResult;

    if (!resultData) {
        return (
            <MainLayout>
                <div style={{padding: "50px", textAlign: "center"}}>
                    <Hero
                        subtitle={"분석 데이터가 없습니다. 다시 시도해 주세요."}>
                    </Hero>
                    <Button variant="outline" onClick={() => navigate('/riskanalysis')}>돌아가기</Button>
                </div>
            </MainLayout>
        );
    }

    const disasterScore = resultData.analysisData.disasterRiskScore ?? 0;
    const buildingScore = resultData.analysisData.buildingRiskScore ?? 0;
    const ocrScore = resultData.analysisData.registerRiskScore ?? 0;

    const circumference = 283;
    const strokeDashoffset = circumference - (resultData.analysisData.totalSafetyScore / 100) * circumference;

    return (
        <MainLayout>
            <div className="risk-report-page-risk">
                <div className="dashboard-container-risk">

                    {/* Process Steps */}
                    <section className="process-section-risk">
                        <div className="progress-track-risk">
                            <div className="progress-fill-risk" style={{width: '55%'}}></div>
                        </div>
                        <div className="steps-container-risk">
                            <Step icon="location_on" label="주소<br/>분석" active/>
                            <Step icon="fact_check" label="등기부등본<br/>확인" active/>
                            <Step icon="analytics" label="위험성<br/>평가" current/>
                            <Step icon="description" label="계약서<br/>초안" disabled/>
                            <Step icon="verified" label="최종<br/>평가" disabled/>
                        </div>
                    </section>

                    <Hero
                        title={resultData.analysisData.address}
                        actions={
                            <>
                                {/*<Button variant="outline">공유하기</Button>*/}
                                {/*<Button variant="primary">리포트 다운로드</Button>*/}
                            </>
                        }
                    />

                    <div className="layout-grid-risk">
                        <div className="main-content-risk">
                            <Card className="safety-card-risk" padding="40px">
                                <div className="safety-flex-risk">
                                    <div className="score-circle-risk">
                                        <svg viewBox="0 0 100 100">
                                            <circle
                                                cx="50" cy="50" r="45"
                                                stroke="#F1F5F9" strokeWidth="8" fill="none"
                                            />
                                            <circle
                                                cx="50" cy="50" r="45"
                                                stroke={resultData.analysisData.finalGrade === '안전' ? 'green' : 'yellow'}
                                                strokeWidth="8" fill="none"
                                                strokeDasharray={circumference}
                                                strokeDashoffset={strokeDashoffset}
                                                strokeLinecap="round"
                                                style={{transition: 'stroke-dashoffset 0.5s ease-in-out'}}
                                            />
                                        </svg>
                                        <div className="score-info-risk">
                                            <span className="val-risk">{resultData.analysisData.totalSafetyScore}</span>
                                            <span className="lbl-risk">SAFETY SCORE</span>
                                        </div>
                                    </div>
                                    <div className="score-desc-risk">
                                        <Badge color={resultData.analysisData.finalGrade === '안전' ? 'green' : 'yellow'}
                                               variant="subtle"
                                               className="mb-12">{resultData.analysisData.finalGrade}</Badge>
                                        {resultData.disasterData ? (
                                            <>
                                                <h3>재해 분석</h3>
                                                {resultData.disasterData.data[0]?.disasterData?.length === 0 ? (
                                                    <p className="risk-item">조회된 재해 정보가 없습니다.</p>
                                                ) : (
                                                    resultData.disasterData.data[0].disasterData.map((item, index) => (
                                                        <div key={index} className="risk-item">
                                                            <strong>{item.DST_SE_NM}</strong> ({item.REG_YMD})
                                                        </div>
                                                    ))
                                                )}
                                            </>
                                        ) : <p className="risk-item-disabled">재해 분석이 제외되었습니다.</p>}

                                        <br/>

                                        {resultData.buildingData ? (
                                            <>
                                                <h3>건축물 분석</h3>
                                                <p className="risk-item">{resultData.buildingData.data[0]?.reasons?.join(", ") || "특이사항 없음"}</p>
                                            </>
                                        ) : <p className="risk-item-disabled">건축물 분석이 제외되었습니다.</p>}

                                        <br/>

                                        <h3>등기부 분석: {resultData.ocrData.data[0]?.gapguIssue}</h3>
                                        {(resultData.ocrData?.data[0]?.riskFactors)?.map((factor, index) => (
                                            <div key={index} className="risk-item">{factor}</div>
                                        ))}
                                        <p></p>
                                        <div className="mini-stats-risk">
                                            {resultData.disasterData &&
                                                <SmallProg label="재해" val={disasterScore} color="blue"/>}
                                            {resultData.buildingData &&
                                                <SmallProg label="건축물" val={buildingScore} color="yellow"/>}
                                            <SmallProg label="등기" val={ocrScore} color="green"/>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <aside className="sidebar-risk">
                            {/*
                            <Card padding="24px" className="sidebar-card-risk">
                                <h3>위험 요약 리포트</h3>
                                <div className="summary-list-risk">
                                    <Summary icon="verified" title="소유주 검증 완료" desc="신분증 일치" color="green"/>
                                    <Summary icon="security" title="보증 보험 가능" desc="HUG 조건 충족" color="green"/>
                                    <Summary icon="trending_up" title="시세 변동 경고" desc="최근 거래량 증가" color="yellow"/>
                                </div>
                                <Button variant="dark" fullWidth className="mt-20">상세 리포트 보기</Button>
                            </Card>
                            */}

                            <Card className="detail-item-risk" padding="24px">
                                <h4>건물 상태 정보</h4>
                                <div className="mini-grid-risk">
                                    <div className="info-box-risk">
                                        <span>건물 연식 (사용승인)</span><strong>{resultData.buildingData?.data?.[0]?.approvalUseDay
                                        ? `${Math.floor(resultData.buildingData.data[0].approvalUseDay / 10000)}년`
                                        : "미분석"}</strong>
                                    </div>
                                    <div className="info-box-risk">
                                        <span>총 세대수</span><strong>{resultData.buildingData?.data?.[0]?.householdCount
                                        ? `${resultData.buildingData.data[0].householdCount}세대`
                                        : "미분석"}</strong>
                                    </div>
                                </div>
                            </Card>

                            <Card className="detail-item-risk" p-dding="24px">
                                <h4>시장 가치 평가</h4>
                                <div className="price-risk">
                                    {resultData.buildingData?.data?.[0]?.housePrice > 0
                                        ? `${(resultData.buildingData.data[0].housePrice / 100000000).toFixed(1)}억`
                                        : "미분석"}
                                    <small> KRW</small>
                                </div>
                                {/*
                                    <div className="info-row-risk"><span>전세가율</span><span
                                        className="text-yellow">00%</span></div>
                                    <div className="progress-bar-risk multi">
                                        <div className="segment safe" style={{width: '60%'}}></div>
                                        <div className="segment caution" style={{width: '18%'}}></div>
                                    </div>
                                    */}
                            </Card>

                            <Card padding="24px" className="sidebar-pro-risk dark-card">
                                <Badge color="blue" variant="solid" className="mb-16">PRO TIP</Badge>
                                <h4>대항력 확보 방법</h4>
                                <p>전입신고와 확정일자는 이사 당일 반드시 완료해야 보증금을 지킬 수 있습니다.</p>
                                {/*<Button variant="ghost" icon="arrow_forward" className="text-blue p-0">가이드북 보기</Button>*/}
                            </Card>
                        </aside>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

/* Internal Helpers */
const Step = ({icon, label, active, current, disabled}) => (
    <div className={`step-risk ${active ? 'active' : ''} ${current ? 'current' : ''} ${disabled ? 'disabled' : ''}`}>
        <div className="circle-risk"><span className="material-symbols-outlined">{icon}</span></div>
        <p dangerouslySetInnerHTML={{__html: label}}></p>
    </div>
);

const SmallProg = ({label, val, color}) => (
    <div className="small-stat-risk">
        <div className="lbl-row-risk"><span>{label}</span><strong className={`text-${color}`}>{val}%</strong></div>
        <div className="bar-risk">
            <div className={`fill-risk ${color}`} style={{width: `${val}%`}}></div>
        </div>
    </div>
);

const Summary = ({icon, title, desc, color}) => (
    <div className={`summary-item-risk ${color}`}>
        <div className="icon-risk"><span className="material-symbols-outlined">{icon}</span></div>
        <div className="txt-risk"><strong>{title}</strong><p>{desc}</p></div>
    </div>
);

export default RiskReport;