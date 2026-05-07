package io.pjj.ziphyeonjeon.interaction.controller;

import io.pjj.ziphyeonjeon.interaction.entity.Likes;
import io.pjj.ziphyeonjeon.interaction.entity.Records;
import io.pjj.ziphyeonjeon.interaction.service.InteractionService;
import io.pjj.ziphyeonjeon.auth.entity.User;
import io.pjj.ziphyeonjeon.auth.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/interaction")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;
    private final UserRepository userRepository; // JWT의 email로 userId 조회용

    @Data
    public static class LikeRequest {
        private Long houseId;
        private String name; // 주택이나 상가 이름 (화면 표시용)
    }

    @Data
    public static class RecordRequest {
        private Long houseId;
    }

    @Data
    public static class InteractionItemDto {
        private Long houseId;
        private String complexName;
    }

    private Long getUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getUserId();
    }

    /**
     * 주택 하트(찜) 클릭 시 호출
     */
    @PostMapping("/likes")
    public ResponseEntity<Boolean> toggleLike(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody LikeRequest req) {
        
        Long userId = getUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        
        boolean isLiked = interactionService.toggleLike(userId, req.getHouseId(), req.getName());
        return ResponseEntity.ok(isLiked);
    }

    /**
     * 내 관심 주택 목록 조회
     */
    @GetMapping("/likes/me")
    public ResponseEntity<List<InteractionItemDto>> getMyLikes(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        
        List<InteractionItemDto> likes = interactionService.getMyLikes(userId).stream()
            .map(like -> {
                InteractionItemDto dto = new InteractionItemDto();
                dto.setHouseId(like.getHouseId());
                dto.setComplexName(like.getName()); // name -> complexName (프론트 매핑)
                return dto;
            }).collect(Collectors.toList());
            
        return ResponseEntity.ok(likes);
    }

    /**
     * 주택 다가구/단지 등을 눌렀을 때 열람 기록 추가
     */
    @PostMapping("/records")
    public ResponseEntity<Records> addViewRecord(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RecordRequest req) {
        
        Long userId = getUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        
        Records record = interactionService.addViewRecord(userId, req.getHouseId());
        return ResponseEntity.ok(record);
    }

    /**
     * 내가 최근 본 매물 목록 전체 조회
     */
    @GetMapping("/records/me")
    public ResponseEntity<List<InteractionItemDto>> getMyRecords(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = getUserId(userDetails);
        if (userId == null) return ResponseEntity.status(401).build();
        
        // 주의: Records 엔티티는 name 필드가 없으므로, 현재로선 최근 본 매물 이름은 프론트엔드가 houseId로 보완하게 됩니다.
        // InteractionItemDto를 반환하되 complexName은 null 또는 "최근 본 매물"로 보냅니다.
        List<InteractionItemDto> records = interactionService.getMyRecords(userId).stream()
            .map(record -> {
                InteractionItemDto dto = new InteractionItemDto();
                dto.setHouseId(record.getHouseId());
                // Records에는 이름이 없으므로 프론트에서 클릭 시 채워지도록 유도
                return dto;
            }).collect(Collectors.toList());
            
        return ResponseEntity.ok(records);
    }
}
