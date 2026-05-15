package io.pjj.ziphyeonjeon.Chatbot.controller;

import io.pjj.ziphyeonjeon.Chatbot.dto.request.DeleteRoomsRequest;
import io.pjj.ziphyeonjeon.Chatbot.dto.request.SendMessageRequest;
import io.pjj.ziphyeonjeon.Chatbot.dto.request.UpdateRoomTitleRequest;
import io.pjj.ziphyeonjeon.Chatbot.dto.response.ChatMessageResponse;
import io.pjj.ziphyeonjeon.Chatbot.dto.response.ChatRoomResponse;
import io.pjj.ziphyeonjeon.Chatbot.service.ChatMessageService;
import io.pjj.ziphyeonjeon.Chatbot.service.ChatRoomService;
import io.pjj.ziphyeonjeon.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatRoomService chatRoomService;
    private final ChatMessageService chatMessageService;
    private final UserRepository userRepository;

    private Long getUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."))
                .getUserId();
    }

    // ① 새 채팅방 생성
    @PostMapping("/rooms")
    public ResponseEntity<Map<String, Long>> createRoom(@RequestAttribute("email") String email) {
        Long userId = getUserId(email);
        Long roomId = chatRoomService.createRoom(userId);
        Map<String, Long> response = new HashMap<>();
        response.put("roomId", roomId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ② 내 채팅방 목록 조회
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponse>> getRooms(@RequestAttribute("email") String email) {
        Long userId = getUserId(email);
        List<ChatRoomResponse> rooms = chatRoomService.getRooms(userId);
        return ResponseEntity.ok(rooms);
    }

    // ③ 특정 방 메시지 전체 조회
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<List<ChatMessageResponse>> getMessages(
            @PathVariable Long roomId,
            @RequestAttribute("email") String email) {
        Long userId = getUserId(email);
        List<ChatMessageResponse> messages = chatMessageService.getMessages(roomId, userId);
        return ResponseEntity.ok(messages);
    }

    // ④ 메시지 전송 + AI 응답
    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ChatMessageResponse> sendMessage(
            @PathVariable Long roomId,
            @RequestBody SendMessageRequest request,
            @RequestAttribute("email") String email) {
        Long userId = getUserId(email);
        ChatMessageResponse response = chatMessageService.sendMessage(roomId, userId, request);
        return ResponseEntity.ok(response);
    }

    // ⑤ 채팅방 제목 수정
    @PatchMapping("/rooms/{roomId}/title")
    public ResponseEntity<String> updateRoomTitle(
            @PathVariable Long roomId,
            @RequestBody UpdateRoomTitleRequest request,
            @RequestAttribute("email") String email) {
        Long userId = getUserId(email);
        chatRoomService.updateRoomTitle(roomId, userId, request.getTitle());
        return ResponseEntity.ok("제목이 수정되었습니다.");
    }

    // ⑥ 특정 방 1개 삭제
    @DeleteMapping("/rooms/{roomId}")
    public ResponseEntity<String> deleteRoom(
            @PathVariable Long roomId,
            @RequestAttribute("email") String email) {
        Long userId = getUserId(email);
        chatRoomService.deleteRoom(roomId, userId);
        return ResponseEntity.ok("채팅방이 삭제되었습니다.");
    }

    // ⑦ 선택 삭제
    @DeleteMapping("/rooms")
    public ResponseEntity<String> deleteSelectedRooms(
            @RequestBody DeleteRoomsRequest request,
            @RequestAttribute("email") String email) {
        Long userId = getUserId(email);
        chatRoomService.deleteSelectedRooms(userId, request.getRoomIds());
        return ResponseEntity.ok("선택된 채팅방이 삭제되었습니다.");
    }

    // ⑧ 전체 삭제 전용
    @DeleteMapping("/rooms/all")
    public ResponseEntity<String> deleteAllRooms(@RequestAttribute("email") String email) {
        Long userId = getUserId(email);
        chatRoomService.deleteAllRooms(userId);
        return ResponseEntity.ok("모든 채팅방이 삭제되었습니다.");
    }

    // ⑨ 챗봇 초기 안내 + 카테고리 목록
    @GetMapping("/intro")
    public ResponseEntity<Map<String, Object>> getChatIntro() {
        Map<String, Object> response = new HashMap<>();
        response.put("greeting", "안녕하세요! 집현전 부동산 법령 정보 검색 AI입니다. 어떤 정보를 찾아드릴까요?");
        response.put("capabilities", List.of(
                "주택임대차보호법, 상가건물임대차보호법 등 관련 법령 정보 조회",
                "전세/월세 계약 체크리스트 안내",
                "임장(현장 방문) 시 주요 확인 사항 가이드",
                "보증금, 대출, 세금 관련 일반 정보 전달"));

        List<Map<String, String>> categories = List.of(
                Map.of("id", "LAW", "label", "법령 질문", "icon", "⚖️", "description", "임대차 법령, 계약 관련 조항 조회"),
                Map.of("id", "CONTRACT", "label", "계약 체크리스트", "icon", "📋", "description", "전세/월세 계약 시 확인 사항"),
                Map.of("id", "VISIT", "label", "임장 가이드", "icon", "🏠", "description", "현장 방문 시 체크할 내용"),
                Map.of("id", "GENERAL", "label", "그 외 질문", "icon", "💬", "description", "대출, 세금, 기타 부동산 질문"));
        response.put("categories", categories);

        return ResponseEntity.ok(response);
    }
}
