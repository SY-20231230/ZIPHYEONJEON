package io.pjj.ziphyeonjeon.RiskAnalysis.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ANALYSIS_TARGET_DOC")
public class AnalysisTargetDoc {

    protected AnalysisTargetDoc() {
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FILE_ID")
    private Long fileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", nullable = false)
    private Users users;

    @Column(name = "ADDRESS", nullable = false)
    private String address;

    @Column(name = "SAVED_FILE", nullable = false)
    private String savedFile;

    @Column(name = "UPLOADED_AT")
    private LocalDateTime uploadedAt;

    public AnalysisTargetDoc(Users users, String address, String savedFile) {
        this.users = users;
        this.address = address;
        this.savedFile = savedFile;
        this.uploadedAt = LocalDateTime.now();
    }

}
