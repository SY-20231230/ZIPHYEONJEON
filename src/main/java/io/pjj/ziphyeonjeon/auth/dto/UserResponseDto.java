package io.pjj.ziphyeonjeon.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDto {
    private Long userId;
    private String email;
    private String userName;
    private String userType;
    private Long creditScore;     // 💡 추가
    private String familyType;    // 💡 추가
    private String incomeLevel;   // 💡 추가
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdTime;
}