/**
 * [Risk Analysis Service]
 * 담당: 전세가율 및 깡통전세 위험도 분석 API 통신
 * 업데이트: 2026. 05. 05
 * 참조 문서: 집현전 백엔드 업데이트 종합 산출물(2026.04.30v2.pdf)
 */
import apiClient from '../apiClient';

export const riskService = {
    /**
     * [P-004] 전세가율 및 깡통전세 위험도 분석 요청
     * @param {Object} data - { address, exclusiveArea, myJeonsePrice, propertyType }
     * @description 
     * 1. 입력받은 주소와 전용면적(±10%) 내 가장 최근 실거래 매매가를 추출합니다.
     * 2. 실거래가가 없을 경우 해당 동네 동일 면적 평균가를 기준가로 적용합니다.
     * 3. 5단계 판정 지표(SAFE, CAUTION 등)를 포함한 분석 리포트를 반환받습니다.
     */
    checkRisk: async (data) => {
        try {
            // DB 스키마 및 백엔드 요구 타입(Number)에 맞게 가공하여 전송[cite: 5]
            const payload = {
                address: data.address, // 입력 주소 기반 타겟팅
                exclusiveArea: Number(data.exclusiveArea), // HOUSE.AREA 대응 (Decimal/Number)
                myJeonsePrice: Number(data.myJeonsePrice), // 사용자의 희망 전세가 (만원 단위)[cite: 5]
                propertyType: data.propertyType // HOUSE.PROPERTY_TYPE 대응[cite: 2, 5]
            };

            // 모든 요청은 apiClient의 인터셉터를 통해 sessionStorage의 accessToken이 자동 주입됨[cite: 1]
            const response = await apiClient.post('/api/price/risk-check', payload);
            
            // 응답 구조: { address, avgSalePrice, myJeonseRatio, riskLevel, riskMessage }[cite: 2]
            return response.data;
        } catch (error) {
            console.error("Risk Check API Error:", error.response?.data || error.message);
            throw error;
        }
    }
};