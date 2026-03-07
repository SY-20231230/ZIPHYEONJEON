package io.pjj.ziphyeonjeon.RiskAnalysis.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "USERS")
public class Users {

    protected Users() {
        this.lastLoginAt = LocalDateTime.now();
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USER_ID")
    private Long userId;

    @Column(name = "CREDIT_SCORE")
    private Long creditScore;

    @Column(name = "INCOME_LEVEL", length = 50)
    private String incomeLevel;

    @Column(name = "FAMILY_TYPE", length = 50)
    private String familyType;

    @Column(name = "LAST_LOGIN_AT", nullable = false)
    private LocalDateTime lastLoginAt;

    public Users(Long creditScore, String incomeLevel, String familyType) {
        this.creditScore = creditScore;
        this.incomeLevel = incomeLevel;
        this.familyType = familyType;
        this.lastLoginAt = LocalDateTime.now();
    }

}