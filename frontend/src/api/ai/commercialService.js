import apiClient from '../apiClient';

export const commercialService = {
    predict: async (payload) => {
        // 💡 payload 내부의 targetMonth를 target_month로 변경하여 전송
        const formattedPayload = {
            ...payload,
            target_month: payload.targetMonth // 파이썬이 원하는 snake_case로 강제 변경
        };
        
        // 변경된 payload를 백엔드로 보냄
        const response = await apiClient.post('/api/v1/ai/predict', formattedPayload);
        return response.data;
    }
};