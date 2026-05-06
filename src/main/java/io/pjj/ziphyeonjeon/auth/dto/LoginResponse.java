package io.pjj.ziphyeonjeon.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor // 빈 객체 생성을 위해 추가 권장
@Builder // 💡 빌더 패턴으로 생성자 에러 해결
public class LoginResponse {
    private String accessToken;
    @Builder.Default // 💡 기본값을 "Bearer"로 고정
    private final String tokenType = "Bearer";
    private UserResponseDto user; // 💡 로그인 시 이름, 가구형태 등을 한 번에 넘겨줌[cite: 3, 5]
}