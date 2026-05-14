package io.pjj.ziphyeonjeon.interaction.service;

import io.pjj.ziphyeonjeon.interaction.entity.Likes;
import io.pjj.ziphyeonjeon.interaction.entity.Records;
import io.pjj.ziphyeonjeon.interaction.repository.LikesRepository;
import io.pjj.ziphyeonjeon.interaction.repository.RecordsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class InteractionService {

    private final LikesRepository likesRepository;
    private final RecordsRepository recordsRepository;

    /**
     * 주택 관심(찜) 등록 및 취소 토글 기능
     */
    @Transactional
    public boolean toggleLike(Long userId, Long houseId, String name) {
        Optional<Likes> existingLike = likesRepository.findByUserIdAndHouseId(userId, houseId);

        if (existingLike.isPresent()) {
            // 이미 찜 상태면 삭제 (하트 해제)
            likesRepository.delete(existingLike.get());
            log.info("UserId {} unliked HouseId {}", userId, houseId);
            return false; // 반환: 찜 해제됨
        } else {
            // 찜이 안 풀려있으면 추가 (하트 채우기)
            Likes like = new Likes();
            like.setUserId(userId);
            like.setHouseId(houseId);
            like.setName(name);
            likesRepository.save(like);
            log.info("UserId {} liked HouseId {}", userId, houseId);
            return true; // 반환: 찜 됨
        }
    }

    /**
     * 사용자의 모든 찜 목록 조회
     */
    @Transactional(readOnly = true)
    public List<Likes> getMyLikes(Long userId) {
        return likesRepository.findByUserIdOrderByLikesIdDesc(userId);
    }

    /**
     * 주택 시세 상세 열람 시 기록 추가
     */
    @Transactional
    public Records addViewRecord(Long userId, Long houseId) {
        Optional<Records> existingRecord = recordsRepository.findByUserIdAndHouseId(userId, houseId);

        if (existingRecord.isPresent()) {
            // 이미 본 기록이 있으면 시간만 최근으로 업데이트
            Records record = existingRecord.get();
            record.setViewedTime(LocalDateTime.now());
            // @PreUpdate에 의해 시간 자동 갱신됨
            return recordsRepository.save(record);
        } else {
            // 처음 본 매물이면 새로 생성
            Records record = new Records();
            record.setUserId(userId);
            record.setHouseId(houseId);
            record.setViewedTime(LocalDateTime.now());
            return recordsRepository.save(record);
        }
    }

    /**
     * 사용자의 최근 본 매물 기록 조회
     */
    @Transactional(readOnly = true)
    public List<Records> getMyRecords(Long userId) {
        return recordsRepository.findByUserIdOrderByViewedTimeDesc(userId);
    }
}
