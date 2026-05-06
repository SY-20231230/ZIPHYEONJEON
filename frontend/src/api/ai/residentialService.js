/**
 * [Residential AI Prediction Service - Final Integrated]
 * 백엔드 소스(Source 1-3) 및 지침서(Source 4-5) 완벽 준수
 */
import apiClient from '../apiClient'; 

export const residentialService = {
    /**
     * [P-008] 실시간 집값 예측 요청 (단일 호출)
     */
    predict: async (payload) => {
        try {
            // 주의: target_month가 아닌 targetMonth를 사용해야 함
            const response = await apiClient.post('/api/v1/ai/predict', payload);
            return response.data;
        } catch (error) {
            console.error("AI 예측 API 에러:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * [P-011] 마이페이지 AI 분석 기록 조회
     * 협업 가이드(Source 5)에 따라 /predict/me를 기본으로 사용
     */
    getHistory: async () => {
        try {
            const response = await apiClient.get('/api/v1/ai/predict/me');
            return response.data;
        } catch (error) {
            console.error("분석 기록 조회 에러:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * 특정 매물의 종합 프로필 조회
     */
    getPropertyProfile: async (houseId) => {
        const response = await apiClient.get(`/api/price/profile/${houseId}`);
        return response.data;
    }
};