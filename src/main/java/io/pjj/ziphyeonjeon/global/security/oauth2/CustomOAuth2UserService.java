package io.pjj.ziphyeonjeon.global.security.oauth2;

import io.pjj.ziphyeonjeon.auth.entity.User;
import io.pjj.ziphyeonjeon.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();
        
        String email = "";
        String name = "";

        if ("kakao".equals(registrationId)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            if (kakaoAccount != null) {
                email = (String) kakaoAccount.get("email");
                Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
                if (profile != null) {
                    name = (String) profile.get("nickname");
                }
            }
        } else if ("google".equals(registrationId)) {
            email = (String) attributes.get("email");
            name = (String) attributes.get("name");
        }

        log.info("OAuth2 Login Request - Email: {}", email);

        if (email == null || email.isEmpty()) {
            throw new OAuth2AuthenticationException("소셜 계정에 이메일이 등록되어 있지 않습니다.");
        }

        Optional<User> optionalUser = userRepository.findByEmail(email);
        User user;

        if (optionalUser.isEmpty()) {
            // 소셜 최초 로그인 시 자동 가입 처리 (선택 항목은 null)
            user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString())) // 소셜 전용 더미 비번
                    .userName(name != null ? name : "소셜회원")
                    .userType("ROLE_USER")
                    .provider(registrationId.toUpperCase()) // 가입 출처 기록 (KAKAO, GOOGLE 등)
                    .build();
            userRepository.save(user);
        } else {
            user = optionalUser.get();
            // 계정 탈취 방지: 기존 가입된 계정의 provider와 현재 로그인 시도한 provider가 다를 경우 차단
            String existingProvider = user.getProvider();
            String currentProvider = registrationId.toUpperCase();
            
            if (existingProvider == null || existingProvider.isEmpty() || existingProvider.equals("LOCAL")) {
                throw new OAuth2AuthenticationException("해당 이메일은 이미 자체 회원가입으로 등록된 계정입니다. 이메일/비밀번호로 로그인해주세요.");
            } else if (!existingProvider.equals(currentProvider)) {
                throw new OAuth2AuthenticationException("해당 이메일은 이미 " + existingProvider + " 계정으로 가입되어 있습니다.");
            }
        }

        return new CustomOAuth2User(user, attributes);
    }
}
