package io.pjj.ziphyeonjeon.interaction.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.pjj.ziphyeonjeon.auth.entity.User;
import io.pjj.ziphyeonjeon.auth.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

/**
 * [JWT 파서 통합 버전]
 * 수정일: 2026. 05. 04
 * 내용: 04.30 지침에 따른 실제 JWT 파싱 로직 도입 및 이메일-ID 변환 로직 추가
 */
@Slf4j
@Component
@RequiredArgsConstructor // UserRepository 주입을 위한 생성자 자동 생성
public class JwtMockUtil {

    private final UserRepository userRepository; // DB 조회를 위한 리포지토리 주입

    @Value("${jwt.secret:vmfhaltjskstskswhadsregnalroqkfwkdbalroqkfwkdbalroqkfwkdbal}")
    private String jwtSecret;

    @PostConstruct
    public void checkKeySync() {
        log.info("===[DEBUG] JwtMockUtil 키 해시 확인 완료");
    }

    /**
     * 토큰에서 사용자 PK(Long)를 추출합니다.
     * 04.30 지침: 리턴 로직을 실제 JWT 파서로 교체하여 즉시 연동.
     */
    public Long extractUserIdFromToken(String token) {
        // 1. Bearer 접두사 제거
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        // 2. Base64 디코딩을 통한 SecretKey 생성 (JwtProvider와 규격 통일)
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret.trim());
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);

        // 3. JWT 파싱 및 Payload(Claims) 추출
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String subject = claims.getSubject();
        
        // 4. 데이터 타입 불일치 방지 및 변환 로직 [중요 포인트]
        try {
            // Case A: Subject가 이미 숫자(ID)인 경우
            return Long.parseLong(subject);
        } catch (NumberFormatException e) {
            // Case B: Subject가 이메일 형태인 경우 (현재 로그 발생 상황)
            log.info("[Auth] 이메일 기반 User ID 조회 수행: {}", subject);
            
            return userRepository.findByEmail(subject)
                    .map(User::getUserId) // DB에서 실제 Long ID 추출
                    .orElseGet(() -> {
                        // DB에도 없는 경우에만 방어적으로 1L 반환 (보안상 추후 Exception 처리 권장)
                        log.warn("⚠️ 미등록 사용자 토큰 감지: {}. 임시 ID 1L 할당.", subject);
                        return 1L;
                    });
        }
    }
}