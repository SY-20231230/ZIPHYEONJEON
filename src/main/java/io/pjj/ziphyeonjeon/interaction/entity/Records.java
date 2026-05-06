package io.pjj.ziphyeonjeon.interaction.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "RECORDS", indexes = {
        @Index(name = "idx_records_user_house", columnList = "USER_ID, HOUSE_ID"),
        @Index(name = "idx_records_user_viewed", columnList = "USER_ID, VIEWED_TIME")
})
public class Records {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RECORDS_ID")
    private Long recordsId;

    @Column(name = "VIEWED_TIME", nullable = false)
    private LocalDateTime viewedTime;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @Column(name = "HOUSE_ID")
    private Long houseId;

    // 상가 개발자를 위한 여분 필드
    @Column(name = "STORE_ID")
    private Long storeId;

    @PrePersist
    @PreUpdate
    public void preUpdate() {
        this.viewedTime = LocalDateTime.now();
    }
}
