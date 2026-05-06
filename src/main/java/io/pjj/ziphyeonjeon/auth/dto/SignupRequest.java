package io.pjj.ziphyeonjeon.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    private String email;
    private String password;
    private String userName;
    private Long creditScore;  // 실제 DB 싱크
    private String familyType; // 실제 DB 싱크
    private String incomeLevel;// 실제 DB 싱크
}