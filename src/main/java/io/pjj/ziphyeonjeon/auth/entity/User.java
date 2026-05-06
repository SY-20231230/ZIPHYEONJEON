package io.pjj.ziphyeonjeon.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "USERS") // 💡 image_65ea7a.png 확인 결과 대문자 USERS가 안전합니다.
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USER_ID") // 💡 DB 컬럼명과 일치 (USER_ID)
    private Long userId;

    @Column(name = "EMAIL", nullable = false, unique = true)
    private String email;

    @Column(name = "PASSWORD", nullable = false)
    private String password;

    @Column(name = "USER_NAME", nullable = false)
    private String userName;

    @Column(name = "CREDIT_SCORE")
    private Long creditScore;

    @Column(name = "FAMILY_TYPE")
    private String familyType;

    @Column(name = "INCOME_LEVEL")
    private String incomeLevel;

    @Column(name = "USER_TYPE")
    private String userType;

    @CreationTimestamp
    @Column(name = "CREATED_TIME", updatable = false)
    private LocalDateTime createdTime;
    
    @Column(name = "LAST_LOGIN_AT") 
    private LocalDateTime lastLoginAt;
}