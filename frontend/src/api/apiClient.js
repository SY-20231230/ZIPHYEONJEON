import axios from 'axios';

/**
 * [apiClient - 통합 환경 최적화 버전]
 * 수정일: 2026. 05. 04
 * 내용: 단일 포트(8080) 통합 및 스마트 라우팅 로직 제거
 */
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true, // RTR 및 쿠키 세션 유지를 위해 필수
});

// [요청 인터셉터] 인증 토큰 자동 주입
apiClient.interceptors.request.use(
    (config) => {
        // 💡 [수정 핵심] 기존의 AUTH_URL / SERVICE_URL 분기 로직을 완전히 삭제했습니다.
        // 이제 모든 요청은 설정된 BASE_URL(8080)로 전송됩니다.

        const token = sessionStorage.getItem('accessToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }   
        return config;
    },
    (error) => Promise.reject(error)
);

// [응답 인터셉터] 401 에러(토큰 만료) 시 자동 리프레시 및 재시도
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401(Unauthorized) 에러 발생 시 1회에 한해 재발급 시도
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // 💡 [수정] 재발급 역시 통합된 단일 서버 주소를 사용합니다.
                const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {}, { 
                    withCredentials: true 
                });

                const { accessToken } = response.data;
                
                // 새로운 토큰 갱신 및 기존 요청 재실행
                sessionStorage.setItem('accessToken', accessToken);
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                
                return apiClient(originalRequest);
            } catch (refreshError) {
                // 재발급 실패 시 세션 만료 처리 및 로그인 페이지로 리다이렉트
                sessionStorage.removeItem('accessToken');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;