import React from 'react';
import './Ziphyeonjeon.css';
import MainLayout from './layouts/MainLayout';
import SearchContainer from "./components/SearchContainer";
import ArchitectureSection, { ArchitectureCard } from './components/ArchitectureSection';

const Ziphyeonjeon = () => {
    return (
        <MainLayout>
            <section className="main-v2">
                <div className="container-v2">
                    <div className="hero-content-v2">
                        <div className="badge-v2">안전한 부동산 거래의 시작</div>
                        <h1 className="hero-title-v2">
                            당신의 소중한 보증금,<br />
                            <span className="text-gradient-v2">집현전이 지켜드립니다</span>
                        </h1>
                        <p className="hero-desc-v2">
                            정밀 권리 분석으로 리스크를 사전에 차단합니다.
                        </p>

                        <SearchContainer
                            placeholderTxt="도로명 주소 또는 지번을 입력하세요"
                            buttonName="리스크 조회"
                        />
                    </div>
                </div>
            </section>

            <ArchitectureSection
                header="System Architecture"
                headDescription="Java 21 & Spring Boot 기반의 견고한 백엔드 시스템"
            >
                <ArchitectureCard
                    title="Spring Boot Server"
                    description="Main API 및 비즈니스 로직 처리"
                    color="#3b82f6"
                />
                <ArchitectureCard
                    title="Python AI Server"
                    description="OCR 분석 및 LLM 기반 위험도 예측"
                    color="#10b981"
                />
                <ArchitectureCard
                    title="MySQL"
                    description="부동산 데이터 및 유저 정보 관리"
                    color="#f59e0b"
                />
            </ArchitectureSection>
        </MainLayout>
    );
};

export default Ziphyeonjeon;