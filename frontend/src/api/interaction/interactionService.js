/**
 * [Interaction Service]
 * 담당: 관심 매물(Likes) 및 최근 열람 기록(Records) API 통신
 * 업데이트: 2026. 05. 05
 * 참조 문서: 집현전 백엔드 업데이트 종합 산출물(26.04.30v2.pdf)
 */
import apiClient from '../apiClient';

export const interactionService = {
    /**
     * [GET] 내 찜 리스트 조회
     * @description 로그인한 유저의 전체 찜 리스트를 DB 'LIKES' 테이블에서 가져옵니다.
     * 응답 데이터에는 HOUSE_ID와 매물 이름(NAME) 등이 포함됩니다.
     */
    getLikedHouses: async () => {
        try {
            // 헤더에 Authorization 토큰이 자동으로 포함됨
            const response = await apiClient.get('/api/v1/interaction/likes/me');
            return response.data;
        } catch (error) {
            console.error("Fetch Liked Houses Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * [GET] 최근 본 매물 목록 조회
     * @description 'RECORDS' 테이블에서 VIEWED_TIME 기준 최신순으로 데이터를 가져옵니다.
     */
    getRecentRecords: async () => {
        try {
            const response = await apiClient.get('/api/v1/interaction/records/me');
            return response.data;
        } catch (error) {
            console.error("Fetch Recent Records Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * [POST] 찜 토글 (추가/해제)
     * @param {Long} houseId - 대상 매물의 PK (Master Key)
     * @description 백엔드에서 존재 여부를 확인하여 추가 또는 해제 분기 처리를 수행합니다[cite: 2].
     */
    toggleLike: async (houseId) => {
        try {
            const response = await apiClient.post('/api/v1/interaction/likes', { houseId });
            return response.data;
        } catch (error) {
            console.error("Toggle Like Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * [POST] 열람 기록 생성
     * @param {Long} houseId - 열람한 매물의 PK
     * @description 상세 페이지 진입 시 호출하여 방문 시각을 갱신하거나 기록을 생성합니다[cite: 2].
     */
    addRecentRecord: async (houseId) => {
        try {
            const response = await apiClient.post('/api/v1/interaction/records', { houseId });
            return response.data;
        } catch (error) {
            console.warn("Add Record Warning:", error.message);
            // 기록 생성 실패는 사용자 경험을 방해하지 않도록 throw 하지 않을 수 있음
        }
    }
};