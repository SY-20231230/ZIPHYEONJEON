/**
 * [Real Estate Price Service]
 * 담당: 실거래가 통합 검색 및 지역 시세 추이 조회
 * 업데이트: 2026. 05. 05
 * 참조 문서: 26.04.30v2.pdf (실거래가 통합 검색 API 명세)
 */
import apiClient from '../apiClient';

export const priceService = {
    /**
     * [P-001] 실거래가 통합 검색 및 시세 추이 분석
     * @param {Object} params - { sigungu, dong, propertyType, dealType, startMonth, endMonth, page }
     * @description 
     * 1. 04.30 지침에 따라 405 Method Not Allowed 에러를 방지하기 위해 GET 요청을 사용합니다[cite: 6].
     * 2. 서버 부하 최소화를 위해 페이지당 20건(size: 20)으로 고정하여 스마트 페이징을 수행합니다[cite: 2].
     * 3. 모든 시세 그래프 데이터는 3.3㎡(평)당 평균가로 환산된 상태로 수신됩니다[cite: 2].
     */
    calculateRealPrice: async (params) => {
        try {
            // 쿼리 스트링(Query String) 방식으로 파라미터 전달
            const response = await apiClient.get('/api/price/molit', {
                params: {
                    sigungu: params.sigungu,      // 예: "서울특별시 동작구"[cite: 2]
                    dong: params.dong,            // 예: "상도동"[cite: 2]
                    propertyType: params.propertyType, // 아파트, 오피스텔 등[cite: 2]
                    dealType: params.dealType,    // 매매, 전세, 월세[cite: 2]
                    startMonth: params.startMonth, // 조회 시작 (YYYYMM)[cite: 2]
                    endMonth: params.endMonth,     // 조회 종료 (YYYYMM)[cite: 2]
                    page: params.page || 0,        // 현재 페이지 인덱스
                    size: 20                       // 04.30 백엔드 최적화 지침 적용[cite: 2]
                }
            });

            /**
             * 응답 구조 분석[cite: 2, 6]:
             * - content: 실거래 단지 목록 (complexName, latestTradePrice 등 포함)
             * - trendGraph: 평당가 통계 배열 (pyeongPrice, period 포함)
             * - totalPages: 전체 페이지 수
             */
            return response.data;
        } catch (error) {
            console.error("Price Calculation API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * [P-009] 단지 목록 조회 (Directory)
     * @description 텍스트 검색 시 '아파트 단지 기준'으로 그룹화된 리스트를 가져옵니다[cite: 1].
     * 응답에 포함된 representativeHouseId는 AI 예측의 마스터 키가 됩니다[cite: 1].
     */
    getDirectory: async (filter) => {
        try {
            const response = await apiClient.post('/api/price/directory', filter);
            return response.data;
        } catch (error) {
            console.error("Directory API Error:", error);
            throw error;
        }
    }
};