package io.pjj.ziphyeonjeon.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {

    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,20}$",
             message = "비밀번호는 영문, 숫자, 특수문자를 최소 1개 이상 포함하여 8~20자리여야 합니다.")
    private String password;

    @NotBlank(message = "이름은 필수입니다.")
    private String userName;

    private Long creditScore;  // 실제 DB 싱크 (선택사항)
    private String familyType; // 실제 DB 싱크 (선택사항)
    private String incomeLevel;// 실제 DB 싱크 (선택사항)
}