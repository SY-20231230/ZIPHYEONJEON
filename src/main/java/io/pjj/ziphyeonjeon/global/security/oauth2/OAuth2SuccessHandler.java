package io.pjj.ziphyeonjeon.global.security.oauth2;

import io.pjj.ziphyeonjeon.global.security.JwtProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.url:https://ziphyeonjeon.pages.dev}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getName();
        String role = oAuth2User.getUser().getUserType();

        log.info("OAuth2 Login Success - Email: {}", email);

        String accessToken = jwtProvider.createToken(email, role);
        String refreshToken = jwtProvider.createRefreshToken(email);

        ResponseCookie cookie = jwtProvider.createRefreshTokenCookie(refreshToken);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        // 프론트엔드로 리다이렉트 시 쿼리 스트링으로 토큰 전달
        // 프론트엔드에서 이를 감지하여 AuthContext에 로그인 처리하도록 구현 필요
        String redirectUrl = frontendUrl + "/main?token=" + accessToken;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
