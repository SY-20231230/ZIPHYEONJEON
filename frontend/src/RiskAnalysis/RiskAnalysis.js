import React, { useState } from 'react';
import axios from 'axios';
import './RiskAnalysis.css';

import MainLayout from "../layouts/MainLayout";
import {
    IoSearchOutline,
    IoCloudUploadOutline,
    IoShieldCheckmarkOutline,
    IoCheckmark,
    IoArrowForwardOutline
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";

/**
 * @typedef {Object} responseData
 * @property {string} analysis - 건축물대장
 * @property {string} ocr - 등기부등본
 */

const RiskAnalysis = () => {
    const navigate = useNavigate();

    const API_BASE_URL = process.env.REACT_APP_API_URL || "https://ziphyeonjeon.kro.kr";
    const [address, setAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [isSearched, setIsSearched] = useState(false);

    // 주소 검색 버튼
    // 윤성용님이 만든 /global/API/vworld/VworldSearchClient.java 지번 검색으로 사용해서 만들기
    const addressButton = async () => {
        if (!address.trim()) return alert("주소를 입력해주세요.");
        setIsSearched(true);
        console.log("주소 검색 완료:", address);
    }

    // 파일 업로드
    const [file, setFile] = useState(null);
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // UUID 생성 (중복 방지)
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = (Math.random() * 16) | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
            return v.toString(16);
        });
    };

    // 툴팁 팝업
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const handleMouseEnter = () => setIsTooltipVisible(true);
    const handleMouseLeave = () => setIsTooltipVisible(false);

    // 약관 버튼 비활성화
    const [agreements, setAgreements] = useState({
        terms: false,       // 분석 결과 활용 (필수)
        disaster: false,    // 재해 정보 (선택)
        building: false     // 건축물대장 (선택)
    });

    // 약관 동의 ConsentItem key
    const handleToggle = (key) => {
        setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 제출 검증
    const isInvalid = !address.trim() || !file || !isSearched || !agreements.terms;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (loading) return <div>분석 중입니다...</div>;
    if (error) return <div>{error}</div>;

    // 제출
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isInvalid) return alert("필수 항목과 주소, 등기부등본을 확인해 주세요.");

        try {
            setLoading(true);
            const commonRequestId = generateUUID();

            const requestNames = [];
            const requestPromises = [];

            // 선택 - 재해
            if (agreements.disaster) {
                requestNames.push('disaster');
                console.log("RiskAnalysis.js 재해:", address);
                requestPromises.push(axios.get(`${API_BASE_URL}/api/risk/disaster/${address}`));

            }

            const fullAddress = detailAddress.trim() ? `${address} ${detailAddress}` : address;

            // 선택 - 건축물대장
            if (agreements.building) {
                requestNames.push('building');
                console.log("RiskAnalysis.js 건축물대장:", fullAddress);
                requestPromises.push(axios.get(`${API_BASE_URL}/api/risk/building/${fullAddress}`));
            }

            // 필수 - 파일 업로드
            requestNames.push('upload');
            const backFormData = new FormData();
            backFormData.append('address', address);
            backFormData.append('requestId', commonRequestId);
            backFormData.append('file', file);

            // console.log("RiskAnalysis.js 파일 업로드:", commonRequestId);
            requestPromises.push(axios.post(`${API_BASE_URL}/api/risk/upload`, backFormData));

            // 필수 - 등기부등본 OCR
            requestNames.push('ocr');
            const ocrFormData = new FormData();
            const message = {
                version: 'V2',
                requestId: commonRequestId,
                timestamp: Date.now(),
                lang: 'ko',
                images: [
                    {
                        format: file.name.split('.').pop().toLowerCase(),
                        name: 'registration_document'
                    }
                ]
            };
            ocrFormData.append('message', JSON.stringify(message));
            ocrFormData.append('file', file);
            // console.log("RiskAnalysis.js 등기부등본 OCR:", file);
            requestPromises.push(axios.post(`${API_BASE_URL}/api/risk/ocr`, ocrFormData));

            // 분석 데이터 저장
            requestNames.push('analysis');
            const analysisFormData = new FormData();
            analysisFormData.append('address', fullAddress);
            analysisFormData.append('message', JSON.stringify(message));
            analysisFormData.append('file', file);

            console.log("RiskAnalysis.js 분석 저장:", address);
            requestPromises.push(axios.post(`${API_BASE_URL}/api/risk/analysis/save`, analysisFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
            ));

            const responses = await Promise.all(requestPromises);
            console.log(`${address}에 대한 데이터 요청...`);

                    const responseData = {
                    };
                    requestNames.forEach((name, index) => {
                        responseData[name] = responses[index].data;
                    });

            const riskAnalysisResult = {
                address: address,
                detailAddress: detailAddress || null,
                disasterData: responseData.disaster || null,
                buildingData: responseData.building || null,
                ocrData: responseData.ocr || null,
                analysisData: responseData.analysis || null,
                allResponses: responses.map(res => res.data)
            };

            navigate('/risk/report', { state: { riskAnalysisResult } });

            // responses.forEach((res, index) => {
            //     console.log(`응답 데이터 [${index}]:`, res.data);
            // });

        } catch
        (error) {
            console.error("데이터 요청 실패:", error.response?.data || error.message);
            setError("종합 분석 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    }
        ;

    return (
        <MainLayout>

            <div className="risk-analysis-page">

                {/* Main Content */}
                <main className="risk-main-content">
                    <section className="risk-main-section">
                        <div className="risk-main-bg-blur"></div>
                        <span className="risk-badge">
                            <IoShieldCheckmarkOutline size={14} /> 안심 분석
                        </span>
                        <h2 className="risk-title">종합 위험도 분석하기</h2>
                        <p className="risk-description">
                            부동산 정보를 입력하고 등기부등본을 업로드해 주세요. <br />
                            집현전이 법적 및 시세 위험을 분석해 드립니다. <br />
                            <br />
                            서울특별시 동작구 신대방동 691-3 102호<br />
                            서울특별시 금천구 독산동 150-10
                        </p>
                    </section>

                    <div className="risk-form-container">
                        <div className="risk-card">
                            <div className="risk-card-decoration"></div>
                            <form className="risk-analysis-form" onSubmit={(e) => {
                                e.preventDefault();
                            }}>
                                {/* 부동산 주소 */}
                                <div className="risk-form-step">
                                    <div className="risk-label-row">
                                        <label className="risk-input-label">
                                            <span className="risk-step-num">1</span> 재해, 건축물대장 위험 분석
                                            <span className="risk-tag-required">필수</span>
                                        </label>
                                        {/* 지도 연결 필요 검색창 주소 받아서 그에 해당하는 위치를 중심으로 지도 팝업
                                            <span className="risk-helper-text-link">지도 열기</span>*/}
                                    </div>
                                    {/* 지번 주소 (메인 검색) */}
                                    <div className="risk-search-input-wrapper">
                                        <IoSearchOutline className="risk-search-icon" />
                                        <input
                                            type="text"
                                            placeholder="지번주소를 입력하세요. 예) 서울특별시 용산구 한강대로 405"
                                            value={address}
                                            onChange={(e) => {
                                                setAddress(e.target.value);
                                                setIsSearched(false);
                                            }}
                                        />
                                        <button type="button" className="risk-search-btn" onClick={addressButton}>검색
                                        </button>
                                    </div>

                                    {/* 상세 주소 (서브 입력) */}
                                    <div className="risk-detail-input-wrapper">
                                        <IoSearchOutline className="risk-detail-icon" />
                                        <input
                                            type="text"
                                            placeholder="상세주소를 입력하세요. 예) 101동 102호"
                                            value={detailAddress}
                                            onChange={(e) => setDetailAddress(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <hr className="risk-form-divider" />

                                {/* 등기부등본 업로드 */}
                                <div className="risk-form-step">
                                    <div className="risk-label-row">
                                        <label className="risk-input-label">
                                            <span className="risk-step-num">2</span> 등기부등본 위험 분석
                                            <span className="risk-tag-required">필수</span>
                                        </label>
                                        <div className="risk-tooltip-container">
                                            <span className="risk-tooltip-trigger"
                                                onMouseEnter={handleMouseEnter}
                                                onMouseLeave={handleMouseLeave}>등기부등본?</span>

                                            {isTooltipVisible && (
                                                <div className="risk-tooltip-box">
                                                    권리 분석을 위해 필요한 서류입니다.<br />
                                                    분석 목적으로만 활용되며, 데이터를 저장하지 않습니다.
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                    <div className="risk-upload-box">
                                        <input type="file" className="risk-file-input" onChange={handleFileChange} />
                                        <div className="risk-upload-content">
                                            <div className="risk-upload-icon-circle">
                                                <IoCloudUploadOutline size={30} />
                                            </div>
                                            <h3>{file ? `선택된 파일: ${file.name}` : "파일을 선택해 주세요"}</h3>
                                            <p>PDF, JPG, PNG 파일 (10MB 이하)</p>
                                            <div className="risk-select-btn">파일 선택</div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="risk-form-divider" />

                                {/* 3: 약관 동의 */}
                                <div className="risk-form-step">
                                    <label className="risk-input-label">
                                        <span className="risk-step-num">3</span> 약관 동의
                                    </label>
                                    <div className="risk-consent-group">
                                        <ConsentItem
                                            title="분석 결과 활용 시 주의사항"
                                            desc={<>
                                                분석 결과는 과거 데이터를 바탕으로 구성되었습니다.<br />
                                                실제 매물 상태와 차이가 있을 수 있으므로, 의사 결정의 보조 수단으로만 사용하시길 권장합니다.
                                            </>}
                                            essential={true}
                                            checked={agreements.terms}
                                            onChange={() => handleToggle('terms')}
                                        />
                                        <ConsentItem
                                            title="부동산 재해 위험 정보 조회 동의"
                                            desc={"정부 공공 데이터를 활용하여 해당 법정동의 침수, 화재 등 재해 이력을 확인합니다."}
                                            essential={false}
                                            checked={agreements.disaster}
                                            onChange={() => handleToggle('disaster')}
                                        />
                                        <ConsentItem
                                            title="부동산 건축물대장 위험 정보 조회 동의"
                                            desc="정부 공공 데이터를 활용하여 해당 주소의 건물 이력을 확인합니다."
                                            essential={false}
                                            checked={agreements.building}
                                            onChange={() => handleToggle('building')}
                                        />
                                    </div>
                                </div>

                                <div className="risk-submit-section">
                                    {isInvalid && (
                                        <div className="risk-validation-message">
                                            <span>
                                                필수 항목과 주소, 등기부등본을 확인해 주세요.
                                            </span>
                                        </div>
                                    )}

                                    <button type="button"
                                        className={`risk-submit-btn ${isInvalid ? 'disabled' : ''}`}
                                        disabled={isInvalid} onClick={handleSubmit}>
                                        <span>위험 분석 시작하기</span>
                                        <IoArrowForwardOutline size={20} />
                                    </button>

                                    <p className="risk-terms-text">

                                            시작하기를 클릭하면 <a href="#" onClick={(e) => e.preventDefault()}>서비스 약관</a>에 동의하게 됩니다.
                                        </p>
                                    </div>
                                </form>
                            </div>

                    </div>
                </main>
            </div>

        </MainLayout>
    );
}
    ;

const ConsentItem = ({ title, desc, essential, checked, onChange }) => (
    <label className="risk-consent-item">
        <div className="risk-checkbox-wrapper">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
            />
            <span className="risk-custom-checkbox"><IoCheckmark /></span>
        </div>
        <div className="risk-consent-text">
            <div className="risk-consent-header">
                <p className="risk-consent-title">{title}</p>
                <span className={`risk-tag-${essential ? 'essential' : 'optional'}`}>
                    {essential ? '필수' : '선택'}
                </span>
            </div>
            <p className="risk-consent-desc">{desc}</p>
        </div>
    </label>
);

export default RiskAnalysis;