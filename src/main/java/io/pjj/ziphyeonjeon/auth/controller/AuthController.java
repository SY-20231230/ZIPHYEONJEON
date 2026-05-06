package io.pjj.ziphyeonjeon.auth.controller;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.pjj.ziphyeonjeon.auth.dto.LoginRequest;
import io.pjj.ziphyeonjeon.auth.dto.LoginResponse;
import io.pjj.ziphyeonjeon.auth.dto.SignupRequest;
import io.pjj.ziphyeonjeon.auth.dto.UserResponseDto; // 💡 유저 정보 DTO 추가
import io.pjj.ziphyeonjeon.auth.service.AuthService;
import io.pjj.ziphyeonjeon.global.security.JwtProvider;

import java.util.Map;

/**
 * [AuthController - High Integrity Version]
 * 수리 내역:
 * 1. 생성자 에러 해결: new LoginResponse 대신 Builder 패턴 적용.
 * 2. 실명 복구 API 추가: 로그인 직후 정보를 갱신할 수 있는 /api/auth/me 엔드포인트 구현.
 * 3. 보안 강화: 토큰에 담지 않은 상세 정보(userName, creditScore 등)를 별도 호출로 분리[cite: 3].
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtProvider jwtProvider;

    /**
     * 1. 회원가입 API
     */
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignupRequest request) {
        log.info("[API] 회원가입 시도: {}", request.getEmail());
        authService.signup(request); 
        return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 완료되었습니다.");
    }

    /**
     * 2. 로그인 API (컴파일 에러 수정 완료)
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request, 
            HttpServletResponse response) {
        
        log.info("[API] 로그인 시도: {}", request.getEmail());
        
        // 1. 서비스 로직 호출 (토큰 쌍 획득)
        Map<String, Object> tokens = authService.login(request);
        String accessToken = (String) tokens.get("accessToken");
        String refreshToken = (String) tokens.get("refreshToken");

        // 2. 보안 쿠키 생성 및 응답 헤더 추가
        ResponseCookie cookie = jwtProvider.createRefreshTokenCookie(refreshToken);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        log.info("[API] 로그인 성공: {}", request.getEmail());

        // 💡 [해결] 빌더 패턴을 사용하여 1개의 인자만으로 LoginResponse 객체 생성
        // 기존의 'new LoginResponse(accessToken)'에서 발생하던 컴파일 에러 완벽 해결
        return ResponseEntity.ok(LoginResponse.builder()
                .accessToken(accessToken)
                .build());
    }

    /**
     * 💡 3. 내 프로필 정보 조회 API (추가)
     * 이 API가 있어야 프론트엔드의 Mypage에서 '홍길동'님이 정상적으로 출력됩니다.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> getMyProfile(@RequestAttribute("email") String email) {
        log.info("[API] 프로필 정보 요청: {}", email);
        
        // 서비스에서 이메일을 기반으로 UserResponseDto(userName, familyType 등)를 조회[cite: 3]
        UserResponseDto profile = authService.getUserProfile(email); 
        
        return ResponseEntity.ok(profile);
    }

    /**
     * 4. 토큰 재발급 API (컴파일 에러 수정 완료)
     */
    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @CookieValue(name = "refreshToken") String refreshToken,
            HttpServletResponse response) {
        
        log.info("[API] 토큰 갱신 요청");

        Map<String, String> newTokens = authService.refresh(refreshToken);
        String newAccessToken = newTokens.get("accessToken");
        String newRefreshToken = newTokens.get("refreshToken");

        ResponseCookie cookie = jwtProvider.createRefreshTokenCookie(newRefreshToken);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 💡 [해결] 빌더 패턴 적용으로 재발급 시 컴파일 에러도 해결
        return ResponseEntity.ok(LoginResponse.builder()
                .accessToken(newAccessToken)
                .build());
    }

    /**
     * 5. 로그아웃 API
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @RequestAttribute("email") String email, 
            HttpServletResponse response) {
        
        authService.logout(email);

        // 쿠키 무효화 처리
        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok("로그아웃 완료");
    }
}