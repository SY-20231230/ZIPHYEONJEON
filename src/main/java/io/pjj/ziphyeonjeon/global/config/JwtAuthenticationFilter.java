package io.pjj.ziphyeonjeon.global.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import io.pjj.ziphyeonjeon.global.security.JwtProvider;

import java.io.IOException;

@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 💡 JwtProvider에 미리 만들어둔 로직을 재사용합니다. (중복 제거)
        String token = jwtProvider.resolveToken(request);

        // 2. 토큰 유효성 검사
        if (token != null && jwtProvider.validateToken(token)) {
            
            // 3. 💡 [핵심 수정] 수동으로 객체를 만들지 않고, Provider가 주는 '완성된 인증 객체'를 사용합니다.
            // 이메일 추출, 권한 정보 로드가 이 메서드 안에서 한 번에 처리됩니다.
            Authentication auth = jwtProvider.getAuthentication(token);

            // 4. 보안 컨텍스트에 저장
            SecurityContextHolder.getContext().setAuthentication(auth);
            
            log.debug("JWT 인증 성공: 사용자 = {}, 권한 = {}", auth.getName(), auth.getAuthorities());
        } else if (token != null) {
            log.warn("유효하지 않은 JWT 토큰이 감지되었습니다.");
        }

        // 5. 다음 필터로 진행
        filterChain.doFilter(request, response);
    }
}