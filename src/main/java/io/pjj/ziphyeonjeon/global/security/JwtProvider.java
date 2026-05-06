package io.pjj.ziphyeonjeon.global.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collections;
import java.util.List;

import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
public class JwtProvider {

    private final SecretKey key;
    private final long accessTokenValidityInMilliseconds;
    private final long refreshTokenValidityInMilliseconds;

    public JwtProvider(
            @Value("${jwt.secret:vmfhaltjskstskswhadsregnalroqkfwkdbalroqkfwkdbalroqkfwkdbal}") String secret,
            @Value("${jwt.access-token-validity:3600000}") long accessTokenValidity,
            @Value("${jwt.refresh-token-validity:1209600000}") long refreshTokenValidity) {
        // 💡 Base64 디코딩 시 예외 처리를 위해 공백 제거 등 전처리
        byte[] keyBytes = Decoders.BASE64.decode(secret.trim());
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenValidityInMilliseconds = accessTokenValidity;
        this.refreshTokenValidityInMilliseconds = refreshTokenValidity;

        log.info("===[DEBUG] JwtProvider 키 해시: {}", java.util.Arrays.hashCode(secret.getBytes()));
    }

    // 2. Access Token 생성 (클레임 키를 "auth"로 설정)
    public String createToken(String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + this.accessTokenValidityInMilliseconds);

        return Jwts.builder()
                .subject(email)
                .claim("auth", role) // 💡 스프링 시큐리티 관례에 따른 "auth" 사용
                .issuedAt(now)
                .expiration(expiryDate) // 💡 변수명 수정 완료
                .signWith(key)
                .compact();
    }

    // 3. Refresh Token 생성
    public String createRefreshToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + this.refreshTokenValidityInMilliseconds);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    // 4. 리프레시 토큰 전용 보안 쿠키 생성
    public ResponseCookie createRefreshTokenCookie(String refreshToken) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true) // HTTPS가 아닐 경우 개발 단계에선 false로 잠시 바꿔야 할 수도 있습니다.
                .path("/")
                // 💡 만료 시간도 하드코딩 대신 주입받은 변수 활용 (초 단위 변환)
                .maxAge(refreshTokenValidityInMilliseconds / 1000)
                .sameSite("Lax")
                .build();
    }

    // 5. 토큰 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // 6. 이메일 추출
    public String getEmail(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // 💡 [추가] 권한 정보 추출 (프론트 및 시큐리티 연동 필수)
    public String getRole(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .get("auth", String.class);
    }

    // 7. 헤더에서 Access Token 추출 (오타 및 로직 수정 완료)
    public String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * 💡 추가된 메서드: 토큰에서 인증 정보를 추출합니다.
     */
    public Authentication getAuthentication(String token) {
        // 1. 토큰에서 클레임(데이터 뭉치) 추출
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        // 2. 이메일(Subject) 추출
        String email = claims.getSubject();

        // 2.1 이메일이 없는 토큰은 인증을 거부해야 합니다.
        if (!StringUtils.hasText(email)) {
            throw new JwtException("토큰에 이메일 정보가 없습니다.");
        }

        // 3. 권한(Role) 추출 - 권한(Authority) 확보
        String role = claims.get("auth", String.class);
        
        // 3.1 권한이 없으면 최소한의 권한(USER)을 주거나, 더 엄격하게는 예외를 던집니다.
        if (role == null) {
            role = "ROLE_USER";
        }

        // 4. 추출된 정보를 바탕으로 인증 객체 생성
        List<SimpleGrantedAuthority> authorities =
                Collections.singletonList(new SimpleGrantedAuthority(role));
                
        // 4.1 이제 변수화된 email을 principal(주체)로 사용합니다.
        User principal = new User(email, "", authorities);

        
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }
}